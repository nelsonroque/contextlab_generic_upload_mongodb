from typing import Union
from fastapi import FastAPI, APIRouter
from pydantic import BaseModel, Json
from ..models.base import *
from ..log import logger
from ..auth import get_api_key
from ..storage import *
from ..depends import *

router = APIRouter(
    prefix="/ui",
    tags=["user-interface"],
    responses={})

# Query activity data
@router.post("/")
async def show_about_page():
    return {"message": "This is the about page."}