from fastapi import Depends, FastAPI, HTTPException, status, Form
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, Field, Json
from pydantic.dataclasses import dataclass
from typing import List, Optional
from pymongo import IndexModel
from ..lib.utils import *
from datetime import datetime
import uuid as uuidp
from pymongo import IndexModel, ASCENDING, DESCENDING

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


class User(BaseModel):
    created_utc: datetime = Field(default_factory=datetime.now)
    uid: Optional[str] = Field(default_factory=gen_uid)
    username: str
    email: Optional[str]
    first_name: Optional[str]
    last_name: Optional[str]
    affiliation: Optional[str]
    disabled: bool = False
    studies: List[str] = []

    class Config:
        indexes = [
            IndexModel([("uid", ASCENDING)], unique=True),
            IndexModel([("email", ASCENDING)], unique=True),
        ]


class UserInDB(User):
    hashed_password: str
