from pydantic import BaseModel, Field, Json
from typing import List, Optional
from pymongo import IndexModel
from ..lib.utils import *
from datetime import datetime
import uuid as uuidp

# 📚 CUSTOM LIBRARY

# -----------------------------------------------------------------------------
# BASE MODELS
# Organized alphabetically (with adjustments to accomodate inheritance).
# -----------------------------------------------------------------------------

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
    window_innerHeight: Optional[int]
    window_innerWidth: Optional[int]
    screen_availHeight: Optional[int]
    screen_availWidth: Optional[int]
    screen_width: Optional[int]
    screen_height: Optional[int]
    screen_colorDepth: Optional[int]
    screen_pixelDepth: Optional[int]

    class Settings:
        indexes = [
            IndexModel("uuid", unique=True),
            IndexModel("study_uid", unique=False),
            IndexModel("participant_id", unique=False),
            IndexModel("created_utc", unique=False),
            #expireAfterSeconds
        ]

    pass