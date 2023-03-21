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
        "std_out": {
            "format": "%(asctime)s : %(levelname)s : %(module)s : %(funcName)s : %(lineno)d : (Process Details : (%(process)d, %(processName)s), Thread Details : (%(thread)d, %(threadName)s))\nLog : %(message)s",
            "datefmt":"%d-%m-%Y %I:%M:%S"
        },
        "std_out_simple": {
            "format": "[TS: %(asctime)s]\t[NAME: %(name)s]\t[LEVEL: %(levelname)s]\t[MODULES: %(module)s]\t[FUNCTION: %(funcName)s]\t[MSG: %(message)s]",
            "datefmt":"%Y-%m-%dT%H:%M:%S"
        }
    },
}

#logging.config.dictConfig(log_config)
logger = logging.getLogger("app")