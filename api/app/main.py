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
from .routers import metadata, query, debug, upload, auth
from .lib.constants import *
from .lib.depends import logger

# auth library
from .lib.authdb import *
from .models.schemas import *

# -----------------------------------------------------------------------------

# create a request ID for all requests
request_id_contextvar = contextvars.ContextVar("request_id", default=None)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

# -----------------------------------------------------------------------------

# Create the FastAPI app
logger.info("STARTING: FastAPI `app` creation...")

app = FastAPI(title=APP_NAME, 
              version=APP_VERSION)

# -----------------------------------------------------------------------------

# MOUNT FILES
app.mount("/share", StaticFiles(directory="app/share"), name="shared_files")

# -----------------------------------------------------------------------------

# Add event handlers
@app.on_event("startup")
async def startup_event():
    request_id = str(uuid.uuid4())
    #request_id_contextvar.set(request_id) # TODO: not working
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

# add request ID middleware
@app.middleware("http")
async def request_middleware(request, call_next):
    request_id = str(uuid.uuid4())
    request_id_contextvar.set(request_id)

    request_url = request.url
    request_method = request.method
    request_query_params = request.query_params
    request_path_params = request.path_params
    request_client_address = request.client.host
    request_headers = request.headers
    #request_state = request.state

    logger.info(f"Request [{request_id}] started")
    logger.info(f"Request [{request_id}] client address: {request_client_address}")
    logger.info(f"Request [{request_id}] URL: {request_url}")
    logger.info(f"Request [{request_id}] method: {request_method}")
    logger.info(f"Request [{request_id}] headers: {request_headers}")
    logger.info(f"Request [{request_id}] query params: {request_query_params}")
    logger.info(f"Request [{request_id}] path params: {request_path_params}")
    #logger.info(f"Request [{request_id}] state: {request_state}")

    try:
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response
    except Exception as ex:
        logger.info(f"Request [{request_id}] failed: {ex}")
    finally:
        assert request_id_contextvar.get() == request_id
        logger.info(f"Request [{request_id}] ended")

logger.info("COMPLETE: Adding middleware...")

# -----------------------------------------------------------------------------

# Add routers
logger.info("STARTING: Adding routers...")
app.include_router(upload.router)
app.include_router(query.router)
app.include_router(metadata.router)
app.include_router(debug.router)
app.include_router(auth.router)
logger.info("COMPLETE: Adding routers...")

# -----------------------------------------------------------------------------

# Add health check endpoint
@app.get("/", status_code=200)
async def get_health():
    return {"status": "ok", "deployment": APP_DEPLOYMENT, "version": APP_VERSION}