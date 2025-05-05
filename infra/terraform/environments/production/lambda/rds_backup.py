import boto3
import json
import os
from datetime import datetime

def handler(event, context):
    rds = boto3.client('rds')
    sns = boto3.client('sns')
    
    db_instance_id = os.environ['DB_INSTANCE_ID']
    sns_topic_arn = os.environ['SNS_TOPIC_ARN']
    project_name = os.environ['PROJECT_NAME']
    
    # Create snapshot
    snapshot_id = f"{project_name}-{db_instance_id}-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    
    try:
        # Create snapshot
        rds.create_db_snapshot(
            DBSnapshotIdentifier=snapshot_id,
            DBInstanceIdentifier=db_instance_id
        )
        
        # Clean up old snapshots (keep last 3)
        snapshots = rds.describe_db_snapshots(
            DBInstanceIdentifier=db_instance_id,
            SnapshotType='manual'
        )['DBSnapshots']
        
        # Sort by creation time and delete oldest
        snapshots.sort(key=lambda x: x['SnapshotCreateTime'])
        if len(snapshots) > 3:
            for snapshot in snapshots[:-3]:
                rds.delete_db_snapshot(
                    DBSnapshotIdentifier=snapshot['DBSnapshotIdentifier']
                )
        
        # Send success notification
        sns.publish(
            TopicArn=sns_topic_arn,
            Subject=f"RDS Backup Success - {project_name}",
            Message=f"Successfully created snapshot: {snapshot_id}"
        )
        
    except Exception as e:
        # Send failure notification
        sns.publish(
            TopicArn=sns_topic_arn,
            Subject=f"RDS Backup FAILED - {project_name}",
            Message=f"Failed to create backup: {str(e)}"
        )
        raise e
    
    return {
        'statusCode': 200,
        'body': json.dumps('Backup completed successfully')
    }