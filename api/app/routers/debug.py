from typing import Union
from fastapi import FastAPI, APIRouter
from ..lib.depends import *
from ..lib.storage import *
from ..lib.authdb import *
from ..models.base import *

router = APIRouter(
    prefix="/debug",
    tags=["debug"],
    responses={501: {"description": "TBD"}})

# # get unique by field endpoint
@router.get("/collections/{db}")
async def get_database_collections(db: str, token: Annotated[str, Depends(oauth2_scheme)]):
    user = decode_token(token)
    print(user)
    if user.get("email") in ADMIN_EMAILS:
        client = pymongo.MongoClient(MONGODB_ENDPOINT_URL)
        db = client[db]
        rc = db.list_collection_names()
        collections = ', '.join(rc)
        print("Collections: " + collections)
        return {"collections": collections}
    else:
        # return an unauthroized error with response code using fastapi httpexception
        return {"error": "You do not have permission to access this endpoint."}
