from typing import Union
from fastapi import FastAPI, APIRouter
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, Json
from starlette.status import *

from ..models.base import *
from ..lib.log import logger
from ..lib.storage import *
from ..lib.depends import *
from ..lib.notify import *
from ..lib.users import *
from ..lib.authdb import db as auth_db

router = APIRouter(
    prefix="/query",
    tags=["data-access"],
    responses={500: {"description": "huge mystery what is wrong..."}})


@router.post("/allow/{email}")
async def get_upload_by_uid(email: str, study:str, user: User = Depends(current_active_user)):
    if user.email in ["nelsonroquejr@gmail.com", "nelson.roque@ucf.edu"]:
        logger.info("Connecting to MongoDB")
        client = pymongo.MongoClient(MONGODB_ENDPOINT_URL)
        db = client[AUTH_DB]
        logger.info(db)
        logger.info(AUTH_DB)
        logger.info("Connected to MongoDB!")

        user_r = db['User'].find_one({"email": email})
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
            db['User'].update_one({"email": email}, {"$set": user_r})
            return "Success"
        else:
            return {"error": f"User with email: {email} already has access to study: {study}"}
    else:
        return {"error": "You do not have permission to access this endpoint."}

# Query activity data
@router.post("/", response_model = PaginatedReturn)
async def get_uploads_with_skip_limit_filtering(query: UploadQuery, commons: dict = Depends(common_parameters), user: User = Depends(current_active_user)):
    collection_to_query = "data"
    skip = commons.get("skip")
    limit = commons.get("limit")
    logger.info(f"User: {user}")
    logger.info(f"Query: {query}")
    logger.info(f"Commons: {commons}")
    logger.info(f"skip: {skip}")
    logger.info(f"limit: {limit}")
    logger.info(f"About to query (collection = `{collection_to_query}`).")
    if query.study_uid in user.studies:
        results, total, limit = query_mongodb_skip_limit_collection(
            collection_to_query, 
            query, 
            skip, 
            limit
        )
        logger.info("Query complete.")
        logger.info(f"Total results {total}.")

        # TODO: add Teams webhook notification
        #send_teams_webhook(f"Total results for query by user: {user} | {total} records.")
        logger.info(f"Currently returning {len(results)} results (limit = {limit}).")
        logger.info("Attempting results validation with Pydantic.")
        results_pr = PaginatedReturn(
            records = results,
            total_records_current_download = len(results),
            total_records = total,
            skip = int(skip),
            limit = int(limit)
        )
        logger.info("Results validated with Pydantic.")
        return results_pr
    else:
        logger.error("Study UID in query does not match study list in API key.")
        raise HTTPException(
            status_code=HTTP_403_FORBIDDEN, 
            detail="`study_uid` does not match API Key"
        )