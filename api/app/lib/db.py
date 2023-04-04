# Description: Database functions for MongoDB
import pymongo
from .constants import *
from .log import logger

def validate_query_limit(limit):
    if limit is not None:
        if limit > Settings.QUERY_SKIP_LIMIT:
            limit = Settings.QUERY_SKIP_LIMIT
        elif limit < 0:
            limit = Settings.QUERY_SKIP_LIMIT
        else:
            limit = limit
    else:
        limit = Settings.QUERY_SKIP_LIMIT
    return limit

def init_pymongo(dbname):
    # Connect to MongoDB
    logger.info("Connecting to MongoDB")
    client = pymongo.MongoClient(Settings.MONGODB_ENDPOINT_URL)
    db = client[dbname]
    logger.info(f"Connected to MongoDB | pymongo version: {pymongo.__version__}")
    return client, db
    
def insert_one(dbname, table, query):
    if not dbname or not table:
        raise ValueError("Database name and table name cannot be empty.")

    if not query or not isinstance(query, dict):
        raise ValueError("Query must be a non-empty dictionary.")

    # Connect to MongoDB
    client, db = init_pymongo(dbname)
    collection = db[table]
    db_results = collection.insert_one(query)
    logger.info("Successfully inserted data")
    client.close()
    return str(db_results.inserted_id)

def insert_many(dbname, table, query):
    if not dbname or not table:
        raise ValueError("Database name and table name cannot be empty.")

    if not query or not isinstance(query, dict):
        raise ValueError("Query must be a non-empty dictionary.")

    # Connect to MongoDB
    client, db = init_pymongo(dbname)
    collection = db[table]
    db_results = collection.insert_many(query)
    logger.info("Successfully inserted data")
    client.close()
    return str(db_results.inserted_ids)

def find_one(dbname, table, query):
    if not dbname or not table:
        raise ValueError("Database name and table name cannot be empty.")

    if not query or not isinstance(query, dict):
        raise ValueError("Query must be a non-empty dictionary.")

    # Connect to MongoDB
    client, db = init_pymongo(dbname)
    collection = db[table]
    db_results = collection.find_one(query)

    # If no results, return None
    if not db_results:
        logger.warning("No matching documents found.")
        client.close()
        return None

    logger.info("Successfully found data")
    client.close()
    return db_results

def find_many(dbname, table, query, skip=None, limit=None):
    if not dbname or not table:
        raise ValueError("Database name and table name cannot be empty.")

    if not query or not isinstance(query, dict):
        raise ValueError("Query must be a non-empty dictionary.")

    # Connect to MongoDB
    client, db = init_pymongo(dbname)
    collection = db[table]

    if skip is None and limit is None:
        db_results = collection.find(query)
    else:
        limit = validate_query_limit(limit)
        db_results = collection.find(query).skip(skip).limit(limit)

    # If no results, return None
    if not db_results:
        logger.warning("No matching documents found.")
        client.close()
        return None

    logger.info("Successfully found data")
    client.close()
    return db_results

def update_one(dbname, table, filter_query, update_query):
    if not dbname or not table:
        raise ValueError("Database name and table name cannot be empty.")

    if not filter_query or not isinstance(filter_query, dict):
        raise ValueError("Filter query must be a non-empty dictionary.")

    if not update_query or not isinstance(update_query, dict):
        raise ValueError("Update query must be a non-empty dictionary.")

    # Connect to MongoDB
    client, db = init_pymongo(dbname)
    collection = db[table]
    result = collection.update_one(filter_query, update_query)

    # If no results, return None
    if not result:
        logger.warning("No matching documents found.")
        client.close()
        return None

    logger.info("Successfully updated data")
    client.close()
    return result

def update_many(dbname, table, filter_query, update_query):
    if not dbname or not table:
        raise ValueError("Database name and table name cannot be empty.")

    if not filter_query or not isinstance(filter_query, dict):
        raise ValueError("Filter query must be a non-empty dictionary.")

    if not update_query or not isinstance(update_query, dict):
        raise ValueError("Update query must be a non-empty dictionary.")

    # Connect to MongoDB
    client, db = init_pymongo(dbname)
    collection = db[table]
    result = collection.update_many(filter_query, update_query)

    # If no results, return None
    if not result:
        logger.warning("No matching documents found.")
        client.close()
        return None

    logger.info("Successfully updated data")
    client.close()
    return result

def count(dbname, table, query):
    if not dbname or not table:
        raise ValueError("Database name and table name cannot be empty.")

    if not query or not isinstance(query, dict):
        raise ValueError("Query must be a non-empty dictionary.")

    # Connect to MongoDB
    client, db = init_pymongo(dbname)
    collection = db[table]
    db_results = collection.count_documents(query)
    logger.info("Successfully counted data")
    client.close()
    return {"query": query, "count": db_results}

def count_distinct(dbname, table, field):
    client, db = init_pymongo(dbname)
    collection = db[table]
    db_results = collection.distinct(field)
    count = len(db_results)
    logger.info("Successfully counted distinct entries")
    client.close()
    return {"field": field, "count": count, "distinct": db_results}

def list_collections(dbname):
    client, db = init_pymongo(dbname)
    collection_names = db.list_collection_names()
    collections = ', '.join(collection_names)
    logger.info(f"Collections: {collections}")
    return collection_names

def get_database_size(dbname):
    client, db = init_pymongo(dbname)
    db_stats = db.command("dbstats")
    db_size = db_stats["dataSize"]
    print("Database size:", db_size)
    return {"database": dbname, "size": db_size}

def get_collection_size(dbname, table):
    client, db = init_pymongo(dbname)
    collection = db[table]
    col_stats = collection.stats()
    col_size = col_stats["storageSize"]
    print("Collection size:", col_size)
    return {"database": dbname, "collection": table, "size": col_size}

# def scrub_mongo_id(cursor):
#   ne = []
#   for doc in cursor:
#       del doc['_id']
#       ne.append(doc)
#   return ne

#query_clean = {k: v for k, v in query.dict().items() if v is not None}