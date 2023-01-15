#!/bin/bash
cd cdk

# just in case
# pip3 install -r requirements.txt --user

# TODO: wire in notification feature to Teams

# export vars needed for build
export CDK_DEFAULT_ACCOUNT="608905617011"
export CDK_DEFAULT_REGION="us-east-1"
cdk deploy --profile contextlab