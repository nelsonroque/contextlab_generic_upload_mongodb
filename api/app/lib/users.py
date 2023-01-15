from typing import Optional

from beanie import PydanticObjectId
from fastapi import Depends, Request
from fastapi_users import BaseUserManager, FastAPIUsers
from fastapi_users.authentication import (
    AuthenticationBackend,
    BearerTransport,
    JWTStrategy,
)
from fastapi_users.db import BeanieUserDatabase, ObjectIDIDMixin

from .authdb import User, get_user_db
from .constants import *
from .log import logger

# set secret key for JWT
SECRET = SECRET_USERAUTH

# create user manager class with methods for registration
class UserManager(ObjectIDIDMixin, BaseUserManager[User, PydanticObjectId]):
    reset_password_token_secret = SECRET
    verification_token_secret = SECRET

    async def on_after_register(self, user: User, request: Optional[Request] = None):
        logger.info(f"User {user.id} has registered.")

    async def on_after_forgot_password(
        self, user: User, token: str, request: Optional[Request] = None
    ):
        logger.info(f"User {user.id} has forgot their password. Reset token: {token}")

    async def on_after_request_verify(
        self, user: User, token: str, request: Optional[Request] = None
    ):
        logger.info(f"Verification requested for user {user.id}. Verification token: {token}")

async def get_user_manager(user_db: BeanieUserDatabase = Depends(get_user_db)):
    yield UserManager(user_db)


# determine authentication backend
bearer_transport = BearerTransport(tokenUrl="auth/jwt/login")

# specify JWT strategy
def get_jwt_strategy() -> JWTStrategy:
    seconds = int(JWT_EXPIRY_SECS)
    logger.info(f"New JWT Generated. Expiring in {seconds} seconds.")
    return JWTStrategy(secret=SECRET, lifetime_seconds=seconds)

auth_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)

# create FastAPIUsers instance
fastapi_users = FastAPIUsers[User, PydanticObjectId](get_user_manager, [auth_backend])

# return current active user
current_active_user = fastapi_users.current_user(active=True)