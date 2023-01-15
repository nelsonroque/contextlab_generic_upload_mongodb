import motor.motor_asyncio
from .constants import *
from ..models.schemas import *
from .log import logger

# get database connection client
client = motor.motor_asyncio.AsyncIOMotorClient(
    MONGODB_ENDPOINT_URL, 
    uuidRepresentation="standard"
)

# get database for auth (seperate from data)
db = client[AUTH_DB]

# connect to user collection
async def get_user_db():
    logger.info("Connecting to MongoDB...")
    logger.info("Connection string (last 50 chars): " + MONGODB_ENDPOINT_URL[-50:])
    logger.info("Getting user db with Beanie.")
    yield BeanieUserDatabase(User)
