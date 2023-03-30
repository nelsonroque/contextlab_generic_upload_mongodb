from typing import Union
from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
import pymongo
from beanie import init_beanie

import uuid
import contextvars

# rest of API library
from .routers import metadata, query, debug, upload
from .lib.constants import *
from .lib.depends import logger

# auth library
from .lib.authdb import User, db
from .models.schemas import *
from .lib.users import auth_backend, current_active_user, fastapi_users

# -----------------------------------------------------------------------------

# Create the FastAPI app
logger.info("STARTING: FastAPI `app` creation...")
app = FastAPI(title=APP_NAME, 
              version=APP_VERSION)

# create a request ID for all requests
request_id_contextvar = contextvars.ContextVar("request_id", default=None)

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

    # turn off collation on client to avoid errors
    client = pymongo.MongoClient(MONGODB_ENDPOINT_URL)
    await init_beanie(
        client,
        database=db,
        document_models=[
            User,
        ],
    )

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

# app.include_router(
#     fastapi_users.get_auth_router(auth_backend), 
#     prefix="/auth/jwt", 
#     tags=["auth"]
# )
# app.include_router(
#     fastapi_users.get_register_router(UserRead, UserCreate),
#     prefix="/auth",
#     tags=["auth"],
# )
# app.include_router(
#     fastapi_users.get_reset_password_router(),
#     prefix="/auth",
#     tags=["auth"],
# )
# app.include_router(
#     fastapi_users.get_verify_router(UserRead),
#     prefix="/auth",
#     tags=["auth"],
# )
# app.include_router(
#     fastapi_users.get_users_router(UserRead, UserUpdate),
#     prefix="/users",
#     tags=["users"],
# )

app.include_router(upload.router)
app.include_router(query.router)
app.include_router(metadata.router)
app.include_router(debug.router) # not returning false on failure

logger.info("COMPLETE: Adding routers...")

# -----------------------------------------------------------------------------

# Add health check endpoint
@app.get("/", status_code=200)
async def get_health():
    return {"status": "ok"}