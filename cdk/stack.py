from aws_cdk import Stack
from constructs import Construct
import aws_cdk.aws_ec2 as ec2
import aws_cdk.aws_ecs as ecs
import aws_cdk.aws_ecs_patterns as ecs_patterns
import aws_cdk.aws_docdb as docdb

import json

# TODO: read from JSON file
PROJECT_NAME = "GenericStore"
APP_PREFIX = "contextlab-GenericStore"
INSTANCE_CPU_MB = 256
INSTANCE_MEMORY_MB = 512
INSTANCE_COUNT = 2

class GenericStore(Stack):
    def __init__(
        self,
        scope: Construct,
        id: str,
        **kwargs,
    ) -> None:
        super().__init__(scope, id, **kwargs)

        # Get a VPC
        vpc_id = self.node.try_get_context("vpc_id")
        if vpc_id:
            # Look up existing VPC
            self.vpc = ec2.Vpc.from_lookup(self, 'external-vpc', vpc_id=vpc_id)
        else:
            # Create a new VPC
            self.vpc = ec2.Vpc(self, f"{APP_PREFIX}_vpc", max_azs=3)

        # TODO: define role here

        # Create Fargate Cluster
        self.ecs_cluster = ecs.Cluster(
            self,
            f"{APP_PREFIX}_ecs_cluster",
            vpc=self.vpc,
        )

        # Create Fargate Service and ALB
        image = ecs_patterns.ApplicationLoadBalancedTaskImageOptions(
            image=ecs.ContainerImage.from_asset(
                directory="../api",
            )
        )
        self.ecs_service = ecs_patterns.ApplicationLoadBalancedFargateService(
            self,
            f"{APP_PREFIX}_ecs_service",
            cluster=self.ecs_cluster,
            cpu=INSTANCE_CPU_MB,
            memory_limit_mib=INSTANCE_MEMORY_MB,
            desired_count=INSTANCE_COUNT, # increase for horizontal scaling
            task_image_options=image,
         )
         # table with new suggested values
         #https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-cpu-memory-error.html

        # Create DocumentDB Cluster
        # https://docs.aws.amazon.com/cdk/api/v2/python/aws_cdk.aws_docdb/README.html
    #     self.docdbcluster = docdb.DatabaseCluster(self, "contextlab-GenericStore_docdbcluster",
    #         master_user=docdb.Login(
    #         username="context",  # NOTE: 'admin' is reserved by DocumentDB
    #         instance_type=ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
    #         vpc_subnets=ec2.SubnetSelection(
    #         subnet_type=ec2.SubnetType.PUBLIC
    #         ),
    #         vpc=self.vpc,
    # #             export_profiler_logs_to_cloud_watch=True,  # Enable sending profiler logs
    # # export_audit_logs_to_cloud_watch=True,  # Enable sending audit logs
    # # cloud_watch_logs_retention=logs.RetentionDays.THREE_MONTHS,  # Optional - default is to never expire logs
    # # cloud_watch_logs_retention_role=my_logs_publishing_role
    #     ))