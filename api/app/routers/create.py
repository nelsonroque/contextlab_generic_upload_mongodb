from typing import Union
import pymongo
from fastapi import FastAPI, APIRouter
from pydantic import BaseModel, Json
from starlette.status import *

from ..lib.storage import *
from ..lib.constants import *
from ..lib.log import *
from ..models.base import User2, Study, Activity, Event

router = APIRouter(
    prefix="/create",
    tags=["create"],
    responses={500: {"description": "huge mystery..."}})

# Create things
@router.post("/participant")
async def create_user(user: User2):
    db = init_pymongo(DATA_DB)
    db.participants.insert_one(user.dict())
    return "Participant created"

@router.post("/study")
async def create_study(study: Study):
    db = init_pymongo(DATA_DB)  
    db.studies.insert_one(study.dict())
    return "Study created"

@router.post("/activity")
async def create_activity(activity: Activity):
    db = init_pymongo(DATA_DB)
    db.activities.insert_one(activity.dict())
    return "Activity created"

@router.post("/event")
async def create_event(event: Event):
    db = init_pymongo(DATA_DB)
    db.events.insert_one(event.dict())
    return "Event created"

@router.get("/activity/{uid}", response_model=Activity)
async def view_activity(uid):
    db = init_pymongo(DATA_DB)
    result = db.activities.find_one({"uid": uid})
    return result