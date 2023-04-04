from pydantic import BaseModel, Field, Json, HttpUrl, AnyUrl
from pydantic.dataclasses import dataclass

from typing import List, Optional
from pymongo import IndexModel, ASCENDING, DESCENDING
from datetime import datetime
import uuid as uuidp
from enum import Enum

from fastapi import Depends, FastAPI, HTTPException, status, Form
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

from jose import JWTError, jwt
from passlib.context import CryptContext

# 📚 CUSTOM LIBRARY
from ..lib.utils import *

# -----------------------------------------------------------------------------
# BASE MODELS
# Organized alphabetically (with adjustments to accomodate inheritance).
# -----------------------------------------------------------------------------

@dataclass
class AdditionalUserDataForm:
    email: str = Form(None)
    phone_number: str = Form(None)
    first_name: str = Form(None)
    last_name: str = Form(None)
    affiliation: str = Form(None)


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: str
    studies: List[str]

class ObjectIdentifiers(BaseModel):
    uuid: str = Field(default_factory=gen_uuid_str)
    created_utc: datetime = Field(default_factory=datetime.now)
    uid: Optional[str] = Field(default_factory=gen_uid)


class UID(BaseModel):
    uid: str


class UserUID(BaseModel):
    user_uid: str


class PaginatedReturn(BaseModel):
    records: List
    total_records_current_download: Optional[int]
    total_records: Optional[int]
    skip: Optional[int]
    limit: Optional[int]


class UploadQuery(BaseModel):
    uid: Optional[str]
    study_uid: str
    user_uid: Optional[str]
    session_uid: Optional[str]
    event_type: Optional[str]
    screen_width: Optional[str]
    screen_height: Optional[str]
    activity_id: Optional[str]


class UserAPIKey(BaseModel):
    key: str


class StudyAPIKey(BaseModel):
    key: str
    study_uid: str


class Upload(ObjectIdentifiers):
    # identify the data
    event_type: Optional[str]
    data_json: Optional[Json]
    data_base64: Optional[str]
    data_binary: Optional[str]
    data_list: Optional[List[str]]

    # identify the session
    study_uid: Optional[str]
    activity_id: Optional[str]
    session_uid: Optional[str]
    session_uuid: Optional[str]
    user_uid: str

    # identify the task
    timestamp_start: Optional[str]
    timestamp_end: Optional[str]
    task_version: Optional[str]
    debug_flag: Optional[str]

    # collect user agent information
    useragent: Optional[str]

    # collect request information
    window_location_href: Optional[str]
    window_location_hostname: Optional[str]
    window_location_protocol: Optional[str]
    window_location_port: Optional[str]

    # collect screen and window dimensions
    window_innerHeight: Optional[Optional[int]]
    window_innerWidth: Optional[Optional[int]]
    screen_availHeight: Optional[Optional[int]]
    screen_availWidth: Optional[Optional[int]]
    screen_width: Optional[Optional[int]]
    screen_height: Optional[Optional[int]]
    screen_colorDepth: Optional[Optional[int]]
    screen_pixelDepth: Optional[Optional[int]]

    class Settings:
        indexes = [
            IndexModel("uuid", unique=True),
            IndexModel("study_uid", unique=False),
            IndexModel("participant_id", unique=False),
            IndexModel("event_type", unique=False),
            IndexModel("created_utc", unique=False),
            IndexModel("activity_id", unique=False),
            # expireAfterSeconds
        ]

    pass


class M2C2Upload(ObjectIdentifiers):
    # identify the data
    event_type: Optional[str]
    data_json: Optional[Json]
    data_base64: Optional[str]
    data_binary: Optional[str]
    data_list: Optional[List[str]]

    # identify the session
    study_uid: Optional[str]
    activity_id: Optional[str]
    session_uid: Optional[str]
    session_uuid: Optional[str]
    user_uid: str
    
    api_key: str
    activity_uid: str
    activity_name: str
    activity_version: str
    activity_url: str
    activity_engine: str
    activity_engine_version: str
    activity_schema: str
    event_type: str
    metadata: str

class ActivityType(str, Enum):
    HTML = "html"
    MARKDOWN = "markdown"
    YOUTUBE = "youtube"
    JSPSYCH = "jspsych"
    SURVEYJS = "surveyjs"
    IMAGE = "image"
    IMAGE_BASE64 = "image_base64"
    IFRAME = "iframe"
    REDIRECT = "redirect"


class UID(BaseModel):
    id_: str = Field(default_factory=gen_uuid_str)
    uid: str = Field(default_factory=gen_uid)
    uuid: str = gen_uuid_str()


class BaseHead(UID):
    created_year: int = get_current_year()
    created_ts: Optional[str] = gen_current_ts_pytz()


class Descriptors(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None


class Params(UID):
    key: str
    value: Optional[str] = None


class Notification(BaseHead, Descriptors):
    channel: str
    notify: bool = False
    notify_at: Optional[str] = None
    message: str = "No message"


class NotificationLog(BaseHead):
    channel: str
    notify_at: Optional[str] = None
    notification_uid: Optional[str] = None
    user_uid: Optional[str] = None
    sent_at: Optional[str] = None


class Study(BaseHead, Descriptors):
    user_uid: str
    affiliation: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    font_color: Optional[str] = None
    font_family: Optional[str] = None


class Event(BaseHead, Descriptors):
    activity_uid: str
    user_uid: str
    start_ts: Optional[str] = None
    end_ts: Optional[str] = None
    notifications: Optional[List[Notification]] = None


class Content(BaseModel):
    html: Optional[str] = None
    js: Optional[str] = None
    css: Optional[str] = None
    json_: Optional[str] = None
    params: Optional[List[Params]] = None
    URL: Optional[URL] = None


class Activity(BaseHead, Descriptors):
    user_uid: str
    wordcode: Optional[str] = gen_wordcode()
    cover_img_base64: Optional[str] = None
    activity_type: Optional[ActivityType] = None
    content: Optional[Content] = None

class User(BaseModel):
    created_utc: datetime = Field(default_factory=datetime.now)
    uid: Optional[str] = Field(default_factory=gen_uid)
    username: str
    email: Optional[str]
    first_name: Optional[str]
    last_name: Optional[str]
    affiliation: Optional[str]
    disabled: bool = False
    is_superuser: bool = False
    is_researcher: bool = False
    is_participant: bool = False
    is_developer: bool = False
    is_admin: bool = False
    studies: List[str] = []

    class Config:
        indexes = [
            IndexModel([("uid", ASCENDING)], unique=True),
            IndexModel([("email", ASCENDING)], unique=True),
        ]
class UserInDB(User):
    hashed_password: str

class User2(BaseHead):
    api_key: Optional[str] = gen_uuid_str()
    wordcode: Optional[str] = gen_wordcode()
    otp: Optional[str] = gen_otp()
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    # email: Optional[EmailStr] = None
    mobile_phone: Optional[str] = None
    is_superuser: bool = False
    is_active: bool = True
    is_researcher: bool = False
    is_tester: bool = False
    is_participant: bool = False
    is_admin: bool = False


# Base class for the input request schema
class OTPRequest(BaseModel):
    email: str = None
    phone_number: str = None


# Base class for the output response schema
class OTPResponse(BaseModel):
    success: bool
    message: str

class JobCheck(BaseModel):
    ts: datetime
    status: str
    user: str

class Job(ObjectIdentifiers):
    user_uid: str
    study_uid: Optional[str] = None
    title: Optional[str] = None
    type: str
    status_checked: Optional[List[JobCheck]] = []
    locked: bool = False
    result: Optional[str] = None

class JobStatus(BaseModel):
    created_utc: datetime
    uuid: str
    status_checked: Optional[List[JobCheck]] = []
    result: Optional[str] = None

class Docs(BaseModel):
    openapi: AnyUrl
    redoc: AnyUrl

class HealthCheckResponse(BaseModel):
    status: str
    deployment: str
    version: str
    docs: Docs