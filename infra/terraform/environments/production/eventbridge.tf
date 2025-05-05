# IAM role for Lambda function
resource "aws_iam_role" "backup_lambda_role" {
  name = "${var.project_name}-backup-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# Attach policies to Lambda role
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.backup_lambda_role.name
}

resource "aws_iam_role_policy" "lambda_rds_policy" {
  name = "${var.project_name}-lambda-rds-policy"
  role = aws_iam_role.backup_lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rds:CreateDBSnapshot",
          "rds:DescribeDBSnapshots",
          "rds:DeleteDBSnapshot",
          "rds:DescribeDBInstances"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.alerts.arn
      }
    ]
  })
}

# Lambda function for RDS backup and cleanup
resource "aws_lambda_function" "rds_backup" {
  filename      = "${path.module}/lambda/rds_backup.zip"
  function_name = "${var.project_name}-rds-backup"
  role          = aws_iam_role.backup_lambda_role.arn
  handler       = "index.handler"
  runtime       = "python3.9"
  timeout       = 300

  environment {
    variables = {
      DB_INSTANCE_ID = module.rds.db_instance_id
      SNS_TOPIC_ARN  = aws_sns_topic.alerts.arn
      PROJECT_NAME   = var.project_name
    }
  }

  tags = local.common_tags
}

# EventBridge rule to trigger backup daily
resource "aws_cloudwatch_event_rule" "daily_backup" {
  name                = "${var.project_name}-daily-backup"
  description         = "Trigger RDS backup daily"
  schedule_expression = "cron(0 2 * * ? *)" # Run at 2 AM UTC daily

  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "lambda_backup" {
  rule      = aws_cloudwatch_event_rule.daily_backup.name
  target_id = "TriggerLambdaFunction"
  arn       = aws_lambda_function.rds_backup.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.rds_backup.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.daily_backup.arn
}