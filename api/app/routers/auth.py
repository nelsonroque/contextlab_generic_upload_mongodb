from typing import Union, Annotated
from fastapi import FastAPI, APIRouter
from pydantic import BaseModel, Json
from ..models.base import *
from ..lib.log import logger
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

from ..lib.authdb import *
from ..models.auth import *

router = APIRouter(
    prefix="/auth",
    tags=["authentication"],
    responses={}
)

client = pymongo.MongoClient(MONGODB_ENDPOINT_URL)
db = client[AUTH_DB]

@router.post("/register")
async def sign_up(
    form_data: OAuth2PasswordRequestForm = Depends(),
    additional_data: AdditionalUserDataForm = Depends(),
):
    print("Connecting to MongoDB")
    user = create_user(db, form_data, additional_data)
    print("Inserted record into MongoDB")
    return {"msg": "User created successfully"}

@router.get("/whoami")
async def login_for_access_token_otp(token: Annotated[str, Depends(oauth2_scheme)]):
    tk = decode_token(token)
    return tk

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(db, form_data.username, form_data.password)
    print("===============")
    print(user)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    print("==============")
    access_token_expires = timedelta(minutes=int(ACCESS_TOKEN_EXPIRE_MINUTES))
    print("Access token expires")
    access_token = create_access_token(
        data={"sub": user.get("username"),
              "email": user.get("email"),
              "studies": user.get("studies"),
              "uid": user.get("uid")}, expires_delta=access_token_expires
    )
    tk = {"access_token": access_token, "token_type": "bearer"}
    print(tk)
    return tk

@router.post("/allow/{email}")
async def add_study_to_user(email: str, study:str, token: Annotated[str, Depends(oauth2_scheme)]):
    print(f"Adding study {study} to user's studies list")
    user = decode_token(token)
    print(user)
    if user.get("email") in ADMIN_EMAILS:
        logger.info("Connecting to MongoDB")
        client = pymongo.MongoClient(MONGODB_ENDPOINT_URL)
        db = client[AUTH_DB]
        logger.info(db)
        logger.info(AUTH_DB)
        logger.info("Connected to MongoDB!")

        user_r = db.users.find_one({"email": email})
        print(user_r)

        if user_r is None:
            # Return a 404 error if user not found
            return {"error": f"User with email: {email} not found"}

        # Add the study to the user's studies list
        if 'studies' not in user_r:
            user_r['studies'] = []  # Initialize the studies list if it doesn't exist yet

        if study not in user_r['studies']:
            user_r['studies'].append(study)
            # Update the user record in the database
            db['users'].update_one({"email": email}, {"$set": user_r})
            return "Success"
        else:
            return {"error": f"User with email: {email} already has access to study: {study}"}
    else:
        return {"error": "You do not have permission to access this endpoint."}

@router.post("/deny/{email}")
async def remove_study_from_user(email: str, study:str, token: Annotated[str, Depends(oauth2_scheme)]):
    print(f"Adding study {study} to user's studies list")
    user = decode_token(token)
    print(user)
    if user.get("email") in ADMIN_EMAILS:
        logger.info("Connecting to MongoDB")
        client = pymongo.MongoClient(MONGODB_ENDPOINT_URL)
        db = client[AUTH_DB]
        logger.info(db)
        logger.info(AUTH_DB)
        logger.info("Connected to MongoDB!")

        user_r = db.users.find_one({"email": email})
        print(user_r)

        if user_r is None:
            # Return a 404 error if user not found
            return {"error": f"User with email: {email} not found"}

        # Add the study to the user's studies list
        if 'studies' not in user_r:
            user_r['studies'] = []  # Initialize the studies list if it doesn't exist yet

        if study in user_r['studies']:
            user_r['studies'].remove(study)
            # Update the user record in the database
            db['users'].update_one({"email": email}, {"$set": user_r})
            return "Success"
        else:
            return {"error": f"User with email: {email} does not currently have access to study: {study}"}
    else:
        return {"error": "You do not have permission to access this endpoint."}