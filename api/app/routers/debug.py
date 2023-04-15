from typing import Union
from fastapi import FastAPI, APIRouter
from ..lib.depends import *
from ..lib.storage import *
from ..lib.auth import *
from ..models.base import *

router = APIRouter(
    prefix="/debug", tags=["debug"], responses={501: {"description": "TBD"}}
)


# # get unique by field endpoint
@router.get("/collections/{db}")
async def get_database_collections(
    db: str, token: Annotated[str, Depends(oauth2_scheme)]
):
    user = decode_token(token)
    print(user)
    if user.get("email") in Settings.ADMIN_EMAILS:
        client = pymongo.MongoClient(Settings.MONGODB_ENDPOINT_URL)
        db = client[db]
        rc = db.list_collection_names()
        collections = ", ".join(rc)
        print("Collections: " + collections)
        return {"collections": collections}
    else:
        # return an unauthroized error with response code using fastapi httpexception
        return {"error": "You do not have permission to access this endpoint."}


@router.get("/user-list", response_model=List[User])
async def get_user_list(token: Annotated[str, Depends(oauth2_scheme)]):
    user = decode_token(token)
    print(user)
    if user.get("email") in Settings.ADMIN_EMAILS:
        client = pymongo.MongoClient(Settings.MONGODB_ENDPOINT_URL)
        db = client[Settings.AUTH_DB]
        users = list(db.users.find())
        print("Found users")
        print(users)
        print(type(users))
        return users
    else:
        # return an unauthroized error with response code using fastapi httpexception
        return {"error": "You do not have permission to access this endpoint."}


@router.get("/user-list/{study}", response_model=List[User])
async def get_user_list_by_study(
    study: str, token: Annotated[str, Depends(oauth2_scheme)]
):
    user = decode_token(token)
    print(user)
    print("About to check if user is in admin list")
    if user.get("email", None) in Settings.ADMIN_EMAILS:
        client = pymongo.MongoClient(Settings.MONGODB_ENDPOINT_URL)
        auth_db = client[Settings.AUTH_DB]
        print("Finding users for study: " + study)
        users = auth_db.users.aggregate([{"$match": {"studies": study}}])
        if users is not None:
            return list(users)
        else:
            return {"error": f"No users found for study: {study}"}
    else:
        # return an unauthroized error with response code using fastapi httpexception
        return {"error": "You do not have permission to access this endpoint."}
