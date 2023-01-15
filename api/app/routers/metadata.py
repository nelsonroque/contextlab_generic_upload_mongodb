from typing import Union
from fastapi import FastAPI, APIRouter
from ..lib.depends import *
from ..lib.storage import *
from ..models.base import *
from ..models.schemas import *
from ..lib.users import *

router = APIRouter(
    prefix="/metadata",
    tags=["quality-control"],
    responses={501: {"description": "TBD"}})

# # get unique by field endpoint
@router.post("/unique/{field}")
async def get_unique_fields(field, query: UploadQuery, user: User = Depends(current_active_user)):
    logger.info(f"About to query for unique values in field `{field}` by user = `{user}`.")
    logger.info(f"Query: {query}")
    results, total = query_distinct_values("data", query, field)
    logger.info("Query complete.")
    logger.info(f"Total results: {len(results)}.")
    logger.info("Attempting results validation with Pydantic.")
    results_pr = PaginatedReturn(
        records = results,
        total_records_current_download = len(results),
        total_records = total
    )
    logger.info("Results validated with Pydantic.")
    return results_pr

@router.post("/count/{field}")
async def count_unique_values(field, query: UploadQuery, user: User = Depends(current_active_user)):
    logger.info(f"About to query for unique values in field `{field}` by user = `{user}`.")
    logger.info(f"Query: {query}")

    if query.study_uid in user.studies:
        results, total = query_distinct_values("data", query, field)
        logger.info("Query complete.")
        logger.info(f"Total results: {total}.")
        return total
    else:
        logger.error("Study UID in query does not match study list in API key.")
        raise HTTPException(
            status_code=HTTP_403_FORBIDDEN, 
            detail="`study_uid` does not match API Key"
        )