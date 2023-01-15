from fastapi import Header, HTTPException
from .log import logger
from .constants import *

# TODO: add date param
# TODO: add start_date, end_date, order (asc, desc), format (json, csv)
async def common_parameters(
    skip: int = 0, limit: int = QUERY_SKIP_LIMIT
):
    return {"skip": skip, "limit": limit}

# async def get_token_header(x_token: str = Header()):
#     if x_token != "fake-super-secret-token":
#         raise HTTPException(status_code=400, detail="X-Token header invalid")

# async def get_query_token(token: str):
#     if token != "jessica":
#         raise HTTPException(status_code=400, detail="No Jessica token provided")