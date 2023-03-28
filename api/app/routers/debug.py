from typing import Union
from fastapi import FastAPI, APIRouter
from ..lib.depends import *
from ..lib.storage import *
from ..models.base import *

router = APIRouter(
    prefix="/debug",
    tags=["debug"],
    responses={501: {"description": "TBD"}})

# # get unique by field endpoint
@router.get("/get-collections")
async def get_database_collections():
    collections, col_str = list_mongodb_collections()
    logger.info("Collections: " + col_str)
    return {"collections": collections}

@router.get("/get-mongodb-database-size/{collection}")
async def get_database_collection_size(collection):
    logger.info("Not implemented")
    client = pymongo.MongoClient(MONGODB_ENDPOINT_URL)
    db = client[AUTH_DB]
    collection = db.get_collection(collection)

    # Get the collection size
    collection_size = await collection.estimated_document_count()

    # Return the collection size
    return collection_size
    #return {"status": "Not implemented"}
    # collections, col_str = list_mongodb_collections()
    # logger.info("Collections: " + col_str)
    # return {"collections": collections}