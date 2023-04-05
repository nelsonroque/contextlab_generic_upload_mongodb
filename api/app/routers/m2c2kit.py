import datetime
from datetime import date
import time
from json import JSONDecoder
import re
from urllib import response
from typing import Union
from jinja2 import Template
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from typing import Union, Annotated
import pymongo
from fastapi import FastAPI, APIRouter
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, Json
from starlette.status import *

from ..lib.webpages import *
from ..lib.auth import *
from ..lib.storage import *
from ..lib.constants import *
from ..lib.log import *
from ..models.base import User2, Study, Activity, Event

# @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

router = APIRouter(
    prefix="/m2c2",
    tags=["m2c2kit"],
    responses={500: {"description": "huge mystery..."}},
)

# -----------------------------------------------------------------------------

# prepare homepage
@router.get("/")
async def render_homepage():
    logger.info("[STARTING] Render page: `homepage`")
    html = HTML_HOMEPAGE
    template = Template(html)
    html_template_string = template.render(INSTALL_URL=Settings.INSTALL_URL, activity_list = ACTIVITY_LIST)
    logger.info("[COMPLETE] Render page: `homepage`")
    return HTMLResponse(html_template_string, status_code=200, headers={"Content-Type": "text/html", "Access-Control-Allow-Origin": "*"})


@router.get("/custom")
async def render_custom():
    html = HTML_HOMEPAGE_2
    template = Template(html)
    html_template_string = template.render(INSTALL_URL=Settings.INSTALL_URL)
    logger.info("[COMPLETE] Render page: `homepage`")
    return HTMLResponse(html_template_string, status_code=200, headers={"Content-Type": "text/html", "Access-Control-Allow-Origin": "*"})


# run m2c2kit activities
# TODO: look more into caching with fastapi (not too long, goldilocks zone)
@router.get("/c/{task_name}")
async def render_activity(
        task_name, 
        #admin_type: Union[str, None] = "qualtrics", 
        n_trials: Union[int, None] = None, 
        api_key: Union[str, None] = None, 
        participant_id: Union[str, None] = None, 
        study_id: Union[str, None] = None, 
        session_id: Union[str, None] = None
    ):

    # CHECK 1 is api key valid?
    logger.info(f"[DEPLOYMENT MODE] {Settings.APP_DEPLOYMENT}")
    if Settings.APP_DEPLOYMENT == "dev":
        valid_api_key = True
    else:
        valid_api_key = True
    
    if valid_api_key is True:
        # CHECK 2 is activity name valid?
        logger.info(f"[API-KEY] {valid_api_key}")
        logger.info(f"[task_name] {task_name}")
        logger.info(f"[n_trials] {n_trials}")
        if task_name in ["symbol-search", "grid-memory", "color-dots"]:
            if task_name == "symbol-search" and n_trials is None:
                n_trials = 20
            elif task_name == "grid-memory" and n_trials is None: 
                n_trials = 4
            logger.info("About to redirect to task")
            return(RedirectResponse(f"{Settings.INSTALL_URL}/m2c2kit/ntc/index.html?activity_name={task_name}&n_trials={n_trials}&participant_id={participant_id}&session_id={session_id}&study_id={study_id}&api_key={api_key}"))
        else:
            logger.error(f"[task_name]: {task_name} not found")
            raise HTTPException(status_code=404, detail=f"Oops, `{task_name}` not found.")
    else:
        logger.info(f"[API-KEY] {valid_api_key}")
        raise HTTPException(status_code=404, detail=f"Invalid study API key.")

@router.get("/s")
async def render_activity(
        order: Union[str, None] = None,  
        api_key: Union[str, None] = None, 
        participant_id: Union[str, None] = None, 
        study_id: Union[str, None] = None, 
        session_id: Union[str, None] = None
    ):

    # CHECK 1 is api key valid?
    logger.info(f"[DEPLOYMENT MODE] {Settings.APP_DEPLOYMENT}")
    valid_api_key = True
    # if APP_DEPLOYMENT == "dev":
    #     valid_api_key = simple_api_checker(api_key)
    # else:
    #     valid_api_key = await is_valid_study_api_key(api_key)
    
    if valid_api_key is True:
        logger.info(f"[API-KEY] {valid_api_key}")
        logger.info(f"[task_name] {order}")

        logger.info("About to redirect to task")
        return(RedirectResponse(f"{Settings.INSTALL_URL}/m2c2kit/sequence/index.html?order={order}&participant_id={participant_id}&session_id={session_id}&study_id={study_id}&api_key={api_key}"))
    else:
        logger.info(f"[API-KEY] {valid_api_key}")
        raise HTTPException(status_code=404, detail=f"Invalid study API key.")