from datetime import datetime, timedelta
from typing import Annotated, Optional, List

from fastapi import Depends, FastAPI, HTTPException, status, Form
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, Field
from pydantic.dataclasses import dataclass
import pymongo
import uuid
import string
import random
from pymongo import IndexModel, ASCENDING, DESCENDING


def gen_uid(len=8):
    # available for search
    lower = string.ascii_lowercase
    upper = string.ascii_uppercase
    num = string.digits
    all = lower + upper + num
    temp = random.sample(all, len)
    password = "".join(temp)
    return password


def gen_uuid_str():
    return str(uuid.uuid4())


# to get a string like this run:
# openssl rand -hex 32
SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
DEV_DB_USERNAME = "devy"
DEV_DB_PASSWORD = "V9ffFl3k9lpSCc0E"
DEV_DB_CLUSTERID = "sandbox.1zci5.mongodb.net"
MONGODB_ENDPOINT_URL = f"mongodb+srv://{DEV_DB_USERNAME}:{DEV_DB_PASSWORD}@{DEV_DB_CLUSTERID}/?retryWrites=true&w=majority"
DB_NAME = "contextlab-jwt-auth-v1"

class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: str | None = None
    studies: List[str] | None = None


class User(BaseModel):
    created_utc: datetime = Field(default_factory=datetime.now)
    uid: Optional[str] = Field(default_factory=gen_uid)
    username: str
    email: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    affiliation: str | None = None
    disabled: bool | None = True

    class Config:
        indexes = [
            IndexModel([("uid", ASCENDING)], unique=True),
            IndexModel([("email", ASCENDING)], unique=True),
        ]


class UserInDB(User):
    hashed_password: str


@dataclass
class AdditionalUserDataForm:
    email: str = Form()
    phone_number: str = Form()
    first_name: str | None = Form(None)
    last_name: str | None = Form(None)
    affiliation: str | None = Form(None)


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
app = FastAPI()
client = pymongo.MongoClient(MONGODB_ENDPOINT_URL)
db = client[DB_NAME]
db.users.create_index([('uid', ASCENDING)], unique=True)
db.users.create_index([('email', ASCENDING)], unique=True)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_user(db, form_data: OAuth2PasswordRequestForm, additional_data: AdditionalUserDataForm):
    new_user = {
        "username": form_data.username,
        "hashed_password": get_password_hash(form_data.password),
        "email": additional_data.email,
        "phone_number": additional_data.phone_number,
        "first_name": additional_data.first_name,
        "last_name": additional_data.last_name,
        "affiliation": additional_data.affiliation,
    }
    db_user = UserInDB(**new_user)
    try:
        db.users.insert_one(db_user.dict())
    except pymongo.errors.DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username already registered",
        )
    return db_user


def get_password_hash(password):
    ph = pwd_context.hash(password)
    print(f"Password: {password}")
    print(f"Hashed Password: {ph}")
    return ph


def get_user(db, username: str):
    user = db.users.find_one({"username": username})
    return UserInDB(**user)


def get_user_otp(db, otp: str):
    user = db.users.find_one({"otp": otp})
    return UserInDB(**user)


def authenticate_user(db, username: str, password: str):
    user = get_user(db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


def authenticate_otp(db, otp: str):
    user = get_user_otp(db, otp)
    if not user:
        return False
    return user


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = get_user(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)]
):
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


@app.post("/sign-up/")
async def sign_up(
    form_data: OAuth2PasswordRequestForm = Depends(),
    additional_data: AdditionalUserDataForm = Depends(),
):
    print("Connecting to MongoDB")
    user = create_user(db, form_data, additional_data)
    print("Inserted record into MongoDB")
    return {"msg": "User created successfully"}

@app.post("/whoami")
async def login_for_access_token_otp(token: Annotated[str, Depends(oauth2_scheme)]):
    return token

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/users/me/", response_model=User)
async def read_users_me(
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    return current_user


@app.get("/users/me/events/")
async def read_own_items(
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    events = db.events.find({"user_uid": current_user.uid})
    return [event for event in events]
