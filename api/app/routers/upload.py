from typing import Union
from fastapi import FastAPI, APIRouter
from pydantic import BaseModel, Json
from starlette.status import *

from ..models.base import *
from ..lib.log import logger
from ..lib.storage import *
from ..lib.depends import *
from ..lib.notify import *
from ..lib.constants import *

router = APIRouter(
    prefix="/upload",
    tags=["data-ingestion"],
    responses={500: {"description": "huge mystery..."}})

# Query activity data
# upload activity data
@router.post("/", response_model = UID)
async def upload_activity_data(upload: Upload):
    logger.info(f"[STARTING] Data upload")
    try:
        results = insertone_mongodb_collection(Settings.COLLECTION_DATA, upload)
        logger.info(f"[COMPLETE] Data upload")
        return upload
    except:
        logger.error(f"[ERROR] Data upload")
        raise HTTPException(status_code=500, detail="Data upload failed")