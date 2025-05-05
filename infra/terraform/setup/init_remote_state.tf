provider "aws" {
  region = "us-east-1"
}

module "terraform_state" {
  source = "../modules/s3_dynamodb"

  state_bucket_name   = "team-bonsai-terraform-state"
  dynamodb_table_name = "team-bonsai-terraform-locks"
  environment         = "prod"
}

output "state_bucket" {
  value       = module.terraform_state.state_bucket_name
  description = "S3 bucket for Bonsai Terraform state"
}

output "dynamodb_table" {
  value       = module.terraform_state.dynamodb_table_name
  description = "DynamoDB table for state locking"
}