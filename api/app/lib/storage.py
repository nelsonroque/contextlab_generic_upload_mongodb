from fastapi import FastAPI, Query, Body, Request, Header, Depends, HTTPException
import datetime
import pymongo
from .constants import *
from .log import logger

def init_pymongo(dbname):
    # Connect to MongoDB
    client = pymongo.MongoClient(MONGODB_ENDPOINT_URL)
    db = client[dbname]

    # Check the version
    version = pymongo.__version__
    logger.info("Connected to MongoDB | pymongo version: %s", version)
    return db

# Establish DocumentDB connection
# TODO: make a dependency
def init_mongodb():
    logger.info("Connecting to MongoDB")
    client = pymongo.MongoClient(MONGODB_ENDPOINT_URL)
    db = client[DATA_DB]
    logger.info("Connected to MongoDB!")
    return client, db

def init_mongodb_collection(table):
    client, db = init_mongodb()
    if table in VALID_COLLECTIONS:
        collection = db[table]
        logger.info(f"Connection complete | {client} | {db} | {collection}.")
        return client, db, collection
    else:
        raise HTTPException(status_code=400, detail=f"Invalid collection: {table}")

def scrub_mongo_id(cursor):
  ne = []
  for doc in cursor:
      del doc['_id']
      ne.append(doc)
  return ne

def insertone_mongodb_collection(db_collection, query):
    client, db, collection = init_mongodb_collection(str(db_collection))
    db_results = collection.insert_one(query.dict())
    logger.info("Successfully inserted data")
    client.close()
    return query

def count_mongodb_collection(db_collection, query):
    client, db, collection = init_mongodb_collection(db_collection)
    rc = collection.count_documents(query)
    logger.info("Counted documents")
    return rc

def list_mongodb_collections():
    client, db = init_mongodb()
    rc = db.list_collection_names()
    collections = ', '.join(rc)
    logger.info(f"Collections: {collections}")
    return rc, collections

def query_mongodb_collection(db_collection, query):
    client, db, collection = init_mongodb_collection(db_collection)
    logger.info(f"Query results for collection: {db_collection}")
    if query is not None:
        query_clean = {k: v for k, v in query.dict().items() if v is not None}
        if len(query_clean.keys()) > 0:
            cursor = collection.find(query_clean)
        else:
            cursor = collection.find(query_clean)
    else:
        cursor = collection.find()
        #raise HTTPException(status_code=400, detail=f"No query supplied")
    data_list = scrub_mongo_id(cursor)
    # cursor_count = cursor.count_documents()
    # logger.info(cursor_count)
    logger.info("Number of items returned")
    logger.info(len(data_list))
    client.close()
    return data_list

def bring_limit_to_limit_if_not(limit):
    logger.info("Attempting to bring limit to limit if not")
    if limit > QUERY_SKIP_LIMIT:
        limit = QUERY_SKIP_LIMIT
    elif limit is None:
        limit = QUERY_SKIP_LIMIT
    else:
        limit = limit
    logger.info("limit is now")
    return limit

def query_mongodb_skip_limit_collection(db_collection, query, skip, limit):
    client, db, collection = init_mongodb_collection(db_collection)
    logger.info(f"Query results for collection: {db_collection}")
    #limit = bring_limit_to_limit_if_not(limit)
    if query is not None:
        query_clean = {k: v for k, v in query.dict().items() if v is not None}        
        if len(query_clean.keys()) > 0:
            cursor = collection.find(query_clean).skip(skip).limit(limit)
        else:
            cursor = collection.find(query_clean).skip(skip).limit(limit)
    else:
        cursor = collection.find().skip(skip).limit(limit)
    data_list = scrub_mongo_id(cursor)
    logger.info(f"Number of items returned: {len(data_list)}")
    client.close()
    total = count_mongodb_collection(db_collection, query_clean)
    return data_list, total, limit

def query_distinct_values(db_collection, query, field):
    client, db, collection = init_mongodb_collection(db_collection)
    logger.info(f"(inside) About to query (collection = `{db_collection}`)")
    if query is None:
        raise HTTPException(status_code=400, detail=f"No query supplied")
    else:
        # sanitize query
        query_clean = {k: v for k, v in query.dict().items() if v is not None}        
        if len(query_clean.keys()) > 0:
            cursor = collection.distinct(
                filter=query_clean, 
                key=field
            )
        else:
            cursor = collection.distinct(
                filter=query_clean, 
                key=field,
            )
    logger.info("Successfully queried")
    data_list = cursor
    logger.info(f"Number of items returned: {len(data_list)}")
    client.close()
    total = count_mongodb_collection(db_collection, query_clean)
    return data_list, total

def query_one_mongodb_collection(db_collection, query):
    client, db, collection = init_mongodb_collection(db_collection)
    logger.info(f"Query results for collection: {db_collection}")
    if query is not None:
        query_clean = {k: v for k, v in query.dict().items() if v is not None}
        if len(query_clean.keys()) > 0:
            cursor = collection.find(query_clean).limit(1)
        else:
            cursor = collection.find(query_clean).limit(1)
    else:
        logger.info("No query supplied")
        cursor = collection.find().limit(1)
        #raise HTTPException(status_code=400, detail=f"No query supplied")

    # clean _id from results
    data_list = scrub_mongo_id(cursor)
    client.close()
    logger.info("MongoDB client closed")

    if len(data_list) == 1 :
        logger.info("list length one!")
        data_list = data_list[0]
    else:
        data_list

    return data_list