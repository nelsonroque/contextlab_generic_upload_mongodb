from typing import Union
from fastapi import FastAPI, APIRouter
from ..lib.auth import *
from ..lib.depends import *
from ..lib.storage import *
from ..models.base import *

router = APIRouter(
    prefix="/metadata",
    tags=["quality-control"],
    responses={501: {"description": "TBD"}})

# # get unique by field endpoint
@router.post("/unique/{field}")
async def get_unique_fields(field, query: UploadQuery, token: Annotated[str, Depends(oauth2_scheme)]):
    logger.info(f"Query: {query}")
    user = decode_token(token)
    logger.info(f"About to query for unique values in field `{field}` by user = `{user}`.")
    if query.study_uid in user.get("studies"):
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
    else:
        logger.error("Study UID in query does not match study list in API key.")
        raise HTTPException(
            status_code=HTTP_403_FORBIDDEN, 
            detail="`study_uid` does not match API Key"
        )

@router.post("/count/{field}")
async def count_unique_values(field, query: UploadQuery, token: Annotated[str, Depends(oauth2_scheme)]):
    logger.info(f"Query: {query}")
    user = decode_token(token)
    logger.info(f"About to query for unique values in field `{field}` by user = `{user}`.")
    if query.study_uid in user.get("studies"):
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