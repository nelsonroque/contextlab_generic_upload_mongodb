import os
from aws_cdk import App, Environment
from stack import GenericStore

app = App()
GenericStore(
    app, 
    "GenericStore",
    env=Environment(
        account=os.environ["CDK_DEFAULT_ACCOUNT"],
        region=os.environ["CDK_DEFAULT_REGION"],
    )
)
app.synth()