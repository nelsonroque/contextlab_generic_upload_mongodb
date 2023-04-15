import os
from .log import logger
from pydantic import BaseModel, BaseSettings
from dotenv import load_dotenv

# load the .env file
load_dotenv()

class Settings(BaseSettings):

    # DEBUGGING ----------------------------------------------------------------
    DEBUG_FLAG = False

    # APP CONFIG ----------------------------------------------------------------

    # set API name
    APP_NAME=os.getenv("APP_NAME")
    APP_VERSION=os.getenv("APP_VERSION")
    APP_DEPLOYMENT=os.getenv("APP_DEPLOYMENT")

    # specify URLS for app in various environments
    LOCAL_URL = os.getenv("LOCAL_URL")
    PROD_URL = os.getenv("PROD_URL")

    # set the admin emails for superuser access
    ADMIN_EMAILS = ["nelson.roque@ucf.edu", "nelsonroquejr@gmail.com"]

    # valid API keys
    API_KEY_HEADER = os.getenv("API_KEY_HEADER")

    # set the defaults for the API
    UID_LENGTH = int(os.getenv("UID_LENGTH"))
    QUERY_SKIP_LIMIT = int(os.getenv("QUERY_SKIP_LIMIT"))
    SYSTEM_TIMEZONE = "America/New_York"

    SHARED_FOLDER = "app/share"

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
    LOG_DB = os.getenv("LOG_DB")

    # SPECIFY COLLECTIONS/TABLES ----------------------------------------------------------------
    COLLECTION_DATA=os.getenv("COLLECTION_DATA")
    COLLECTION_LOGS=os.getenv("COLLECTION_LOGS")

    # ALL COLLECTIONS
    VALID_COLLECTIONS = [
        "DEBUG",
        COLLECTION_DATA,
        COLLECTION_LOGS
    ]

    S3_BUCKET = os.getenv("S3_BUCKET")

    # CORS ----------------------------------------------------------------

    # specify valid CORS origins
    CORS_ORIGINS = [
        f"{LOCAL_URL}",
        "*"
    ]

    DEFAULT_HTML_RESPONSE = {"Content-Type": "text/html", "Access-Control-Allow-Origin": "*"}

    # JWT ----------------------------------------------------------------
    AUTH_TOKEN_URL = os.getenv("AUTH_TOKEN_URL")
    SECRET_KEY = os.getenv("SECRET_KEY") # used to sign JWT, TODO: move to AWS KMS
    ACCESS_TOKEN_EXPIRE_MINUTES = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")
    ALGORITHM = os.getenv("ALGORITHM")
    CRYPTCONTEXT = os.getenv("CRYPTCONTEXT")

    # TWILIO ----------------------------------------------------------------
    TWILIO_ACCOUNT_SID=os.getenv("TWILIO_ACCOUNT_SID")
    TWILIO_AUTH_TOKEN=os.getenv("TWILIO_AUTH_TOKEN")
    TWILIO_PHONE_NUMBER=os.getenv("TWILIO_PHONE_NUMBER")

    # PLACEHOLDERS ----------------------------------------------------------------
    INSTALL_URL = ""
    INSTALL_WS_URL = ""
    MONGODB_ENDPOINT_URL = ""

# instantiate the settings
Settings = Settings()
logger.info("All constants read")
logger.info("App deployment: " + Settings.APP_DEPLOYMENT)

## DEPLOYMENT PROFILES ----------------------------------------------------------------
if Settings.APP_DEPLOYMENT == "dev":
    Settings.INSTALL_URL = f"http://{Settings.LOCAL_URL}"
    Settings.INSTALL_WS_URL = f"ws://{Settings.LOCAL_URL}"
    Settings.MONGODB_ENDPOINT_URL = f"mongodb+srv://{Settings.DEV_DB_USERNAME}:{Settings.DEV_DB_PASSWORD}@{Settings.DEV_DB_CLUSTERID}/?retryWrites=true&w=majority"
elif Settings.APP_DEPLOYMENT == "staging":
    Settings.INSTALL_URL = f"https://{Settings.PROD_URL}"
    Settings.INSTALL_WS_URL = f"wss://{Settings.PROD_URL}"
    Settings.MONGODB_ENDPOINT_URL = f"mongodb+srv://{Settings.DEV_DB_USERNAME}:{Settings.DEV_DB_PASSWORD}@{Settings.DEV_DB_CLUSTERID}/?retryWrites=true&w=majority"
elif Settings.APP_DEPLOYMENT == "production":
    Settings.INSTALL_URL = f"https://{Settings.PROD_URL}"
    Settings.INSTALL_WS_URL = f"wss://{Settings.PROD_URL}"
    Settings.MONGODB_ENDPOINT_URL = f"mongodb://{Settings.PROD_DB_USERNAME}:{Settings.PROD_DB_PASSWORD}@{Settings.PROD_DB_CLUSTERID}:27017/?tls=true&tlsCAFile=rds-combined-ca-bundle.pem&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false"


# ACTIVITY LIST
ACTIVITY_LIST = []
ACTIVITY_LIST.append({"name": "symbol-search", "construct": "PROCESSING SPEED"})
ACTIVITY_LIST.append({"name": "grid-memory", "construct": "WORKING MEMORY"})
ACTIVITY_LIST.append({"name": "color-dots", "construct": "RELATIONAL BINDING"})
#ACTIVITY_LIST.append({"name": "color-shapes", "construct": "RELATIONAL BINDING"})
#ACTIVITY_LIST.append({"name": "stroop", "construct": "EXECUTIVE FUNCTION"})