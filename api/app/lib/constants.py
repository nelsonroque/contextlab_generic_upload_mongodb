import os
from .log import logger
from starlette.status import *

from dotenv import load_dotenv
import os

load_dotenv()

# DEBUGGING ----------------------------------------------------------------
DEBUG_FLAG = False

# APP CONFIG ----------------------------------------------------------------

UID_LENGTH = int(os.getenv("UID_LENGTH"))
QUERY_SKIP_LIMIT = int(os.getenv("QUERY_SKIP_LIMIT"))

# set API name
APP_NAME=os.getenv("APP_NAME")
APP_VERSION=os.getenv("APP_VERSION")
APP_DEPLOYMENT=os.getenv("APP_DEPLOYMENT")

# determine what to log and where
LOG_IP_HEADERS = os.getenv("LOG_IP_HEADERS")
LOG_TO_DB = os.getenv("LOG_TO_DB")

# valid API keys
API_KEY_HEADER = os.getenv("API_KEY_HEADER")

# specify URLS for app in various environments
LOCAL_URL = os.getenv("LOCAL_URL")
PROD_URL = os.getenv("PROD_URL")

# SPECIFY COLLECTIONS/TABLES ----------------------------------------------------------------
COLLECTION_DATA=os.getenv("COLLECTION_DATA")
COLLECTION_LOGS=os.getenv("COLLECTION_LOGS")

# ALL COLLECTIONS
VALID_COLLECTIONS = [
    "DEBUG",
    COLLECTION_DATA,
    COLLECTION_LOGS
]

# DB CONFIG ----------------------------------------------------------------

# deployment: dev
DEV_DB_USERNAME = os.getenv("DEV_DB_USERNAME")
DEV_DB_PASSWORD = os.getenv("DEV_DB_PASSWORD")
DEV_DB_CLUSTERID = os.getenv("DEV_DB_CLUSTERID")
DEV_DB_RETRYWRITES = os.getenv("DEV_DB_RETRYWRITES")

PROD_DB_USERNAME = os.getenv("PROD_DB_USERNAME")
PROD_DB_PASSWORD = os.getenv("PROD_DB_PASSWORD")
PROD_DB_CLUSTERID = os.getenv("PROD_DB_CLUSTERID")
PROD_DB_RETRYWRITES = os.getenv("PROD_DB_RETRYWRITES")

DATA_DB = os.getenv("DATA_DB")
AUTH_DB = os.getenv("AUTH_DB")

## DEPLOYMENT PROFILES ----------------------------------------------------------------
if APP_DEPLOYMENT == "dev":
    INSTALL_URL = f"http://{LOCAL_URL}"
    INSTALL_WS_URL = f"ws://{LOCAL_URL}"
    MONGODB_ENDPOINT_URL = f"mongodb+srv://{DEV_DB_USERNAME}:{DEV_DB_PASSWORD}@{DEV_DB_CLUSTERID}/?retryWrites=true&w=majority"
elif APP_DEPLOYMENT == "staging":
    INSTALL_URL = f"https://{PROD_URL}"
    INSTALL_WS_URL = f"wss://{PROD_URL}"
    MONGODB_ENDPOINT_URL = f"mongodb+srv://{DEV_DB_USERNAME}:{DEV_DB_PASSWORD}@{DEV_DB_CLUSTERID}/?retryWrites=true&w=majority"
elif APP_DEPLOYMENT == "production":
    INSTALL_URL = f"https://{PROD_URL}"
    INSTALL_WS_URL = f"wss://{PROD_URL}"
    MONGODB_ENDPOINT_URL = f"mongodb://{PROD_DB_USERNAME}:{PROD_DB_PASSWORD}@{PROD_DB_CLUSTERID}:27017/?tls=true&tlsCAFile=rds-combined-ca-bundle.pem&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites={DOCDB_RETRYWRITES}"


# CORS ----------------------------------------------------------------

# specify valid CORS origins
CORS_ORIGINS = [
    f"{LOCAL_URL}",
    "*"
]

DEFAULT_HTML_RESPONSE = {"Content-Type": "text/html", "Access-Control-Allow-Origin": "*"}

SECRET_USERAUTH = os.getenv("SECRET_USERAUTH")
JWT_EXPIRY_SECS = os.getenv("JWT_EXPIRY_SECS")

logger.info("All constants read")
logger.info("App deployment: " + APP_DEPLOYMENT)