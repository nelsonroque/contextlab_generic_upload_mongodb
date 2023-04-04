from typing import Union, Annotated
import pymongo
from fastapi import FastAPI, APIRouter
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, Json
from starlette.status import *

from ..lib.auth import *
from ..lib.storage import *
from ..lib.constants import *
from ..lib.log import *
from ..models.base import User2, Study, Activity, Event

router = APIRouter(
    prefix="/create",
    tags=["create"],
    responses={500: {"description": "huge mystery..."}},
)


# Create things
@router.post("/participant")
async def create_user(user: User2, token: Annotated[str, Depends(oauth2_scheme)]):
    user = decode_token(token)
    print(user)
    if user.get("email") in Settings.ADMIN_EMAILS:
        db = init_pymongo(Settings.DATA_DB)
        db.participants.insert_one(user.dict())
        return "Participant created"
    else:
        return "You are not authorized to create a participant"


@router.post("/study")
async def create_study(study: Study, token: Annotated[str, Depends(oauth2_scheme)]):
    user = decode_token(token)
    print(user)
    if user.get("email") in Settings.ADMIN_EMAILS:
        db = init_pymongo(Settings.DATA_DB)
        db.studies.insert_one(study.dict())
        return "Study created"
    else:
        return "You are not authorized to create a study"


@router.post("/activity")
async def create_activity(
    activity: Activity, token: Annotated[str, Depends(oauth2_scheme)]
):
    user = decode_token(token)
    print(user)
    if user.get("email") in Settings.ADMIN_EMAILS:
        db = init_pymongo(Settings.DATA_DB)
        db.activities.insert_one(activity.dict())
        return "Activity created"
    else:
        return "You are not authorized to create an activity"


@router.post("/event")
async def create_event(event: Event, token: Annotated[str, Depends(oauth2_scheme)]):
    user = decode_token(token)
    print(user)
    if user.get("email") in Settings.ADMIN_EMAILS:
        db = init_pymongo(Settings.DATA_DB)
        db.events.insert_one(event.dict())
        return "Event created"
    else:
        return "You are not authorized to create an event"
