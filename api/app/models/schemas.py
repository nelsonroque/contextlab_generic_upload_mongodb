from typing import Optional
from beanie import PydanticObjectId
from fastapi_users import schemas
from fastapi_users.db import BeanieBaseUser, BeanieUserDatabase
from pymongo import IndexModel

class User(BeanieBaseUser[PydanticObjectId]):
    first_name: Optional[str]
    last_name: Optional[str]
    affiliation: Optional[str]
    studies: list = []
    
    class Settings:
        email_collation = None
        indexes = [
            IndexModel("email", unique=True)
        ]

    pass

class UserRead(schemas.BaseUser[PydanticObjectId]):
    first_name: Optional[str]
    last_name: Optional[str]
    affiliation: Optional[str]
    studies: list = []
    class Settings:
        email_collation = None
        indexes = [
            IndexModel("email", unique=True)
    ]
    pass

class UserCreate(schemas.BaseUserCreate):
    first_name: str
    last_name: str
    affiliation: str
    class Settings:
        email_collation = None
        indexes = [
            IndexModel("email", unique=True)
    ]
    pass

class UserUpdate(schemas.BaseUserUpdate):
    first_name: Optional[str]
    last_name: Optional[str]
    affiliation: Optional[str]
    #studies: Optional[list] = []
    pass
