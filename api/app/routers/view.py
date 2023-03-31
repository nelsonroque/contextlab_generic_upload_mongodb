from typing import Union, Annotated
import pymongo
from fastapi import FastAPI, APIRouter
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, Json
from starlette.status import *

from ..lib.authdb import *
from ..lib.storage import *
from ..lib.constants import *
from ..lib.log import *
from ..models.base import User2, Study, Activity, Event

router = APIRouter(
    prefix="/view",
    tags=["ui"],
    responses={500: {"description": "huge mystery..."}})

@router.get("/activity/{uid}", response_model=Activity)
async def view_activity(uid, token: Annotated[str, Depends(oauth2_scheme)]):
    user = decode_token(token)
    print(user)
    if user.get("email") in ADMIN_EMAILS:
        db = init_pymongo(DATA_DB)
        result = db.activities.find_one({"uid": uid})
        return result
    else:
        return "You are not authorized to view an activity"