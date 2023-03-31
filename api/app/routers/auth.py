from typing import Union, Annotated
from fastapi import FastAPI, APIRouter
from pydantic import BaseModel, Json
from ..models.base import *
from ..lib.log import logger
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from random import randint
from ..lib.authdb import *
from ..models.auth import *

router = APIRouter(
    prefix="/auth",
    tags=["authentication"],
    responses={}
)

client = pymongo.MongoClient(MONGODB_ENDPOINT_URL)
db = client[AUTH_DB]
# db.users.create_index("username", unique=True)
# db.users.create_index("email", unique=True)

@router.post("/register")
async def sign_up(
    form_data: OAuth2PasswordRequestForm = Depends(),
    additional_data: AdditionalUserDataForm = Depends(),
):
    print("Connecting to MongoDB")
    user = create_user(db, form_data, additional_data)
    print("Inserted record into MongoDB")
    return {"msg": "User created successfully"}

@router.post("/reset_password")
async def reset_password(email: str, form_data: OAuth2PasswordRequestForm = Depends()):
    user = find_user_by_email(db, email)
    if user:
        hashed_password = get_password_hash(form_data.password)
        update_password(db, user["uid"], email, hashed_password)
        return {"msg": "Password reset successfully"}
    else:
        return {"msg": "User not found"}

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

@router.post("/update-email/{uid}")
async def update_user_email(uid: str, email:str, token: Annotated[str, Depends(oauth2_scheme)]):
    print(f"Adding email to user's studies list")
    user = decode_token(token)
    print(user)
    print("===============")
    if user.get("email") in ADMIN_EMAILS:
        logger.info("Connecting to MongoDB")
        print("Connecting to MongoDB")
        client = pymongo.MongoClient(MONGODB_ENDPOINT_URL)
        auth_db = client[AUTH_DB]
        user2 = auth_db.users.find_one({"uid": uid})
        if user2 is not None:
            auth_db.users.update_one({"uid": uid}, {"$set": {"email": email}})
            print("User updated")
            return "Success"
        else:
            print("User not found")
            return "User not found"
    else:
        return {"error": "You do not have permission to access this endpoint."}

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
    

# Endpoint for sending the OTP
@router.post("/otp/request")
async def request_otp(otp_request: OTPRequest):
    # Generate a random 6-digit OTP
    otp = str(randint(100000, 999999))
    client = pymongo.MongoClient(MONGODB_ENDPOINT_URL)
    db = client[AUTH_DB]
    db.users.update_one({"email": otp_request.email}, {"$set": {"otp": otp, "otp_generated_at": datetime.now()}})
    db.otp_logs.insert_one({"email": otp_request.email, "otp": otp, "otp_generated_at": datetime.now()})
    message = "Your OTP is: " + otp

    # Send the OTP to the user via SMS
    if otp_request.phone_number:
        send_sms_twilio_simple(otp_request.phone_number, message)
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please provide a valid phone number.")

    return OTPResponse(success=True, message="OTP sent successfully.")

# Endpoint for verifying the OTP and generating a JWT
@router.post("/otp/verify")
async def verify_otp(otp:str, form_data: OAuth2PasswordRequestForm = Depends()):
    # Verify the OTP provided by the user
    print("Verifying OTP")
    client = pymongo.MongoClient(MONGODB_ENDPOINT_URL)
    db = client[AUTH_DB]
    print("Connected to MongoDB!")
    user = db.users.find_one({"username": form_data.username, "otp": otp})
    print("Found user")
    print(user)
    if user is not None and "username" in user:  # Replace with your own validation logic
        # Generate a JWT token
        otp = str(randint(100000, 999999))
        db.users.update_one({"username": user.get("username")}, {"$set": {"otp": otp, "otp_generated_at": datetime.now()}})
        access_token_expires = timedelta(minutes=int(ACCESS_TOKEN_EXPIRE_MINUTES))
        print("Access token expires")
        access_token = create_access_token(
            data={"sub": user.get("username"),
                "email": user.get("email"),
                "studies": user.get("studies"),
                "uid": user.get("uid")}, 
                expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
    else:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid OTP.")
