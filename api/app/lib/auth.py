from typing import Annotated
import pymongo
from .constants import *
from ..models.auth import *
from .log import logger
from datetime import datetime, timedelta

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

client = pymongo.MongoClient(Settings.MONGODB_ENDPOINT_URL)
db = client[Settings.AUTH_DB]

def create_unique_index(dbname, collection, index_name, index_field):
    db = client[dbname]
    db[collection].create_index([(index_field, ASCENDING)], unique=True)
#     db.users.create_index([('uid', ASCENDING)], unique=True)
# db.users.create_index([('email', ASCENDING)], unique=True)

def get_password_hash(password):
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    ph = pwd_context.hash(password)
    return ph

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
        "studies": []
    }
    print("Creating user in Pydantic...")
    db_user = UserInDB(**new_user)
    print("Pydantic created!")
    try:
        print("Inserting user into MongoDB...")
        db.users.insert_one(db_user.dict())
        print("User inserted!")
    except pymongo.errors.DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username already registered",
        )
    return db_user

def is_admin(token):
    user = decode_token(token)
    if user.get("email") in Settings.ADMIN_EMAILS:
        return True
    else:
        return False

def get_user(db, username: str):
    user = db.users.find_one({"username": username})
    print("User found (get_user)!")
    return user

def find_user_by_email(db, email: str):
    user = db.users.find_one({"email": email})
    print("User found (find_user_by_email)!")
    return user

def get_user_otp(db, otp: str):
    user = db.users.find_one({"otp": otp})
    return user

def authenticate_user(db, username: str, password: str):
    print("Authenticating user...")
    user = get_user(db, username)
    print("User found!")
    if 'username' not in user:
        print("User not found!")
        return False
    if not verify_password(password, user.get("hashed_password")):
        print("User not authenticated!")
        return False
    print("User authenticated!")
    return user


def authenticate_otp(db, otp: str):
    user = get_user_otp(db, otp)
    if not user:
        return False
    return user

def decode_token(token: str):
    tk = jwt.decode(token, Settings.SECRET_KEY, algorithms=[Settings.ALGORITHM])
    return tk

def create_access_token(data: dict, expires_delta: timedelta = None):
    print("Creating access token...")
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, Settings.SECRET_KEY, algorithm=Settings.ALGORITHM)
    print("Access token created!")
    return encoded_jwt


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, Settings.SECRET_KEY, algorithms=[Settings.ALGORITHM])
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

def update_password(db, user_id, email, hashed_password):
    validated_email = db.users.find_one({'uid': user_id, 'email': email})
    if not validated_email:
        return False
    else:
        db.users.update_one({'uid': user_id}, {'$set': {'hashed_password': hashed_password}})
    return True

async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)]
):
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

