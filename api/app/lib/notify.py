import requests
from .log import logger
from .constants import *

# notification clients
from twilio.rest import Client

async def send_teams_webhook(webhook, message):
    logger.info(f"STARTING: Send Teams Webhook to {webhook} with message: {message}")

def send_sms_twilio_simple(phone, message):
    # Compose the message
    logger.info("Message: %s", message)

    # Connect to MongoDB
    #db = init_pymongo(AUTH_DB)

    # Connect to Twilio
    client_twilio = Client(Settings.TWILIO_ACCOUNT_SID, Settings.TWILIO_AUTH_TOKEN)
    logger.info("Connected to Twilio")

    # Send the SMS
    try:
        event_status = "sent"
        message = client_twilio.messages.create(
            body=message, 
            from_=Settings.TWILIO_PHONE_NUMBER, 
            to=phone
        )
        logger.info("SMS sent to %s", phone)
    except:
        event_status = "failed"
        logger.info("Failed to send SMS to %s", phone)
