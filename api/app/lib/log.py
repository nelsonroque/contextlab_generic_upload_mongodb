import logging

# configure logging
log_config = {
    "version":1,
    "root":{
        "handlers" : ["console"],
        "level": "DEBUG"
    },
    "handlers":{
        "console":{
            "formatter": "std_out_simple",
            "class": "logging.StreamHandler",
            "level": "DEBUG"
        }
    },
    "formatters":{
        "std_out_simple": {
            "format": "[TS: %(asctime)s]\t[LINE: %(lineno)d]\t[NAME: %(name)s]\t[LEVEL: %(levelname)s]\t[MODULES: %(module)s]\t[FUNCTION: %(funcName)s]\t[MSG: %(message)s]",
            "datefmt":"%Y-%m-%dT%H:%M:%S"
        }
    },
}

#logging.config.dictConfig(log_config)
logger = logging.getLogger("app")


# import logging
# import logging.handlers

# # configure logging
# log_config = {
#     "version": 1,
#     "root": {
#         "handlers": ["console", "file"],
#         "level": "DEBUG"
#     },
#     "handlers": {
#         "console": {
#             "formatter": "std_out_simple",
#             "class": "logging.StreamHandler",
#             "level": "DEBUG"
#         },
#         "file": {
#             "formatter": "std_out_simple",
#             "class": "logging.handlers.RotatingFileHandler",
#             "filename": "app.log",
#             "maxBytes": 10485760,  # 10 MB
#             "backupCount": 5,
#             "level": "DEBUG"
#         }
#     },
#     "formatters": {
#         "std_out_simple": {
#             "format": "[TS: %(asctime)s]\t[LINE: %(lineno)d]\t[NAME: %(name)s]\t[LEVEL: %(levelname)s]\t[MODULES: %(module)s]\t[FUNCTION: %(funcName)s]\t[MSG: %(message)s]",
#             "datefmt": "%Y-%m-%dT%H:%M:%S"
#         }
#     },
#     "loggers": {
#         "app": {
#             "level": "DEBUG"
#         },
#         "requests": {
#             "level": "WARNING"
#         },
#         "urllib3": {
#             "level": "WARNING"
#         }
#     }
# }

# logging.config.dictConfig(log_config)
# logger = logging.getLogger("app")
