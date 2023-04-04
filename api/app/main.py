from typing import Union
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
import pymongo

from jose import JWTError, jwt
from passlib.context import CryptContext

import uuid
import contextvars

# rest of API library
from .routers import metadata, query, debug, upload, auth, create, jobs, m2c2kit
from .lib.constants import *
from .lib.depends import logger
from .models.base import *

# auth library
from .lib.auth import *

# -----------------------------------------------------------------------------

# create a request ID for all requests
request_id_contextvar = contextvars.ContextVar("request_id", default=None)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=Settings.AUTH_TOKEN_URL)

# -----------------------------------------------------------------------------

# Create the FastAPI app
logger.info("STARTING: FastAPI `app` creation...")
app = FastAPI(title=Settings.APP_NAME, version=Settings.APP_VERSION)
# TODO: consider subapps: https://fastapi.tiangolo.com/advanced/sub-applications/

# - mount no-toolchain approach
app.mount("/m2c2kit/ntc", StaticFiles(directory="app/m2c2kit/ntc"), name="m2c2kit_no_toolchain")
app.mount("/m2c2kit/sequence", StaticFiles(directory="app/m2c2kit/sequence"), name="m2c2kit_no_toolchain_seq")
print("MOUNTED: m2c2kit_no_toolchain")


# -----------------------------------------------------------------------------

# MOUNT FILES
logger.info("STARTING: Mounting folders")
app.mount(f"/{Settings.SHARED_FOLDER}", StaticFiles(directory=f"app/{Settings.SHARED_FOLDER}"), name="shared_files")

# -----------------------------------------------------------------------------

# Add event handlers
@app.on_event("startup")
async def startup_event():
    request_id = str(uuid.uuid4())
    # request_id_contextvar.set(request_id) # TODO: not working
    logger.info(f"App startup. Request [{request_id}]].")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info(f"App shutdown.")

# -----------------------------------------------------------------------------

# Add middleware
logger.info("STARTING: Adding middleware...")

# add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------------------------

# Add routers
logger.info("STARTING: Adding routers...")
app.include_router(upload.router)
app.include_router(query.router)
app.include_router(metadata.router)
app.include_router(debug.router)
app.include_router(auth.router)
app.include_router(create.router)
app.include_router(jobs.router)
app.include_router(m2c2kit.router)
logger.info("COMPLETE: Adding routers...")

# -----------------------------------------------------------------------------

# Add health check endpoint
@app.get("/", status_code=200, response_model=HealthCheckResponse)
async def get_health():
    s = HealthCheckResponse(
        status="ok",
        deployment=Settings.APP_DEPLOYMENT,
        version=Settings.APP_VERSION,
        docs={
            "openapi": f"{Settings.INSTALL_URL}/docs",
            "redoc": f"{Settings.INSTALL_URL}/redoc",
        },
    )
    return s