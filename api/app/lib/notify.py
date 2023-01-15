import requests
from .log import logger

async def send_teams_webhook(msg):
    logger.info("STARTING: Send Teams Webhook")

#https://github.com/Delgan/loguru#no-handler-no-formatter-no-filter-one-function-to-rule-them-all
# import notifiers

# params = {
#     "username": "you@gmail.com",
#     "password": "abc123",
#     "to": "dest@gmail.com"
# }

# # Send a single notification
# notifier = notifiers.get_notifier("gmail")
# notifier.notify(message="The application is running!", **params)

# # Be alerted on each error message
# from notifiers.logging import NotificationHandler

# handler = NotificationHandler("gmail", defaults=params)
# logger.add(handler, level="ERROR")