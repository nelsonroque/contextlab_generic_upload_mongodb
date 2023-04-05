from typing import Union, Annotated
import pymongo
from fastapi import FastAPI, APIRouter, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, Json
from starlette.status import *
import requests

import json
import boto3
from botocore.exceptions import ClientError

from ..lib.db import *
from ..lib.auth import *
from ..lib.storage import query_mongodb_skip_limit_collection
from ..lib.notify import *
from ..lib.constants import *
from ..lib.depends import *
from ..lib.log import *
from ..models.base import (
    User2,
    Study,
    Activity,
    Event,
    Job,
    JobStatus,
    UploadQuery,
    PaginatedReturn,
)
from time import sleep
from datetime import datetime

router = APIRouter(
    prefix="/job", tags=["jobs"], responses={500: {"description": "huge mystery..."}}
)

def update_job_result(uuid, psu):
    query = {"uuid": uuid}
    update = {"$set": {"result": psu}}
    update_one(Settings.LOG_DB, "jobs", query, update)

def update_job_record(uuid, user, status):
    query = {"uuid": uuid}
    update = {
        "$push": {
            "status_checked": {
                "ts": datetime.now(),
                "status": status,
                "user": user.get("uid"),
            }
        }
    }
    # TODO: add a check to see if the job is locked before editing
    update_one(Settings.LOG_DB, "jobs", query, update)

def run_query(token, job_uuid, commons, query):
    print("Querying via /query endpoint")

    collection_to_query = "data"
    user = decode_token(token)
    skip = commons.get("skip")
    limit = commons.get("limit")
    logger.info(f"User: {user}")
    print(f"User: {user}")
    print("Query: ", query)
    logger.info(f"Query: {query}")
    logger.info(f"Commons: {commons}")
    logger.info(f"skip: {skip}")
    logger.info(f"limit: {limit}")
    logger.info(f"About to query (collection = `{collection_to_query}`).")
    query2 = query.dict()
    if query2.get("study_uid") in user.get("studies"):
        results, total, limit = query_mongodb_skip_limit_collection(
            collection_to_query, query, skip, limit
        )
        logger.info("Query complete.")
        logger.info(f"Total results {total}.")

        # TODO: add Teams webhook notification
        # send_teams_webhook(f"Total results for query by user: {user} | {total} records.")
        logger.info(f"Currently returning {len(results)} results (limit = {limit}).")
        logger.info("Attempting results validation with Pydantic.")
        results_pr = PaginatedReturn(
            records=results,
            total_records_current_download=len(results),
            total_records=total,
            skip=int(skip),
            limit=int(limit),
        )
        logger.info("Results validated with Pydantic.")
        return results_pr
    else:
        logger.error("Study UID in query does not match study list in API key.")
        raise HTTPException(
            status_code=HTTP_403_FORBIDDEN, detail="`study_uid` does not match API Key"
        )


def save_json_s3(job_uuid, query_result):
    print("Saving JSON to S3")
    # requests.get("https://www.google.com")
    return "presigned uRL goes here"

def save_json_s3_working(job_uuid, query_result, bucket_name):
    s3_client = boto3.client('s3')
    s3_key = f"{job_uuid}.json"
    s3_body = json.dumps(query_result)

    try:
        s3_client.put_object(Body=s3_body, Bucket=bucket_name, Key=s3_key)
        presigned_url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket_name, 'Key': s3_key},
            ExpiresIn=3600
        )
        return presigned_url
    except ClientError as e:
        print(e)
        return None

def query_upload_s3(
    token, job_uuid, commons, query, message
):  # s3_bucket: str, s3_key: str, db: str, collection: str, query: dict):
    user = decode_token(token)
    update_job_record(job_uuid, user, "about to initiate query")
    print("Query would happen here and take like 5-90 seconds")
    send_sms_twilio_simple(
        "+17868532084", f"Starting job: {job_uuid} - {query} - {token}"
    )
    update_job_record(job_uuid, user, "about to submit query")
    query_result = run_query(token, job_uuid, commons, query)
    print(query_result)
    #sleep(60)
    update_job_record(job_uuid, user, "awakening from sleep")
    send_sms_twilio_simple(
        "+17868532084", f"Job complete: {job_uuid} - {query} - {token}"
    )
    #psu = save_json_s3_working(job_uuid, query_result, Settings.S3_BUCKET)
    psu = save_json_s3(job_uuid, query_result)
    update_job_record(job_uuid, user, "saved to S3")
    print(psu)
    print("S3 pre-signed URL added to job record")
    # update to include presigned URL as 'result' field
    update_job_result(job_uuid, psu)

@router.get("/status/{uuid}", response_model=JobStatus)
async def job_status(uuid, token: Annotated[str, Depends(oauth2_scheme)]):
    # TODO: fix auth
    is_admin = True
    if is_admin:
        print("Updating job status that check is in progress")
        # define the update operation using the $push operator
        user = decode_token(token)
        query = {"uuid": uuid}
        update = {
            "$push": {
                "status_checked": {
                    "ts": datetime.now(),
                    "status": "checking progress",
                    "user": user.get("uid"),
                }
            }
        }
        # TODO: add a check to see if the job is locked before editing

        # update the document with the specified _id
        update_job_record(uuid, user, "checking status")
        job = find_one(Settings.LOG_DB, "jobs", {"uuid": uuid})
        job.pop("_id", None)
        print(job)
        print("Updating job status that check is complete")
        return JobStatus(**job)
    else:
        return "You are not authorized to view this job's status"


# Create things
@router.post("/start/{type}", response_model=Job)
async def create_job(
    query: UploadQuery,
    type: str,
    title: str,
    token: Annotated[str, Depends(oauth2_scheme)],
    background_tasks: BackgroundTasks,
    commons: dict = Depends(common_parameters),
):
    user = decode_token(token)
    print(user)

    if user.get("email") in Settings.ADMIN_EMAILS:
        print("Creating job")
        job_ = Job(
            user_uid=user.get("uid"),
            status_checked=[
                {"ts": datetime.now(), 
                 "status": "starting", 
                 "user": user.get("uid")}
            ],
            title=title,
            type=type,
        )
        # TODO: fix query
        insert_one(Settings.LOG_DB, "jobs", job_.dict())
        print("Job created")
        print("Starting background task to query S3")
        background_tasks.add_task(
            query_upload_s3,
            token=token,
            job_uuid=job_.uuid,
            commons=commons,
            query=query,
            message=title,
        )  # s3_bucket=S3_BUCKET, s3_key=S3_KEY, db=LOG_DB, collection="jobs", query={"uuid": job_.uuid})
        # return f"Job created. Use ID for checking Job Status {job_.uuid}"
        print(job_.dict())
        return job_
    else:
        return "You are not authorized to create a participant"
