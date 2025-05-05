terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }

  # Add backend configuration for remote state
  backend "s3" {
    bucket         = "team-bonsai-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "team-bonsai-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = "us-east-1"
}

locals {
  common_tags = {
    Project     = "bonsai"
    Environment = "prod"
    ManagedBy   = "terraform"
    Team        = "team-bonsai"
  }
}

# FETCH SECRET FROM SECRETS MANAGER
data "aws_secretsmanager_secret_version" "db_password" {
  secret_id = "bonsai/db_password"
}

module "network" {
  source = "../../modules/network"

  project_name         = "bonsai"
  vpc_cidr             = "10.0.0.0/16"
  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnet_cidrs = ["10.0.3.0/24", "10.0.4.0/24"]
  availability_zones   = ["us-east-1a", "us-east-1b"]
}

module "eks" {
  source = "../../modules/eks"

  project_name       = "bonsai"
  vpc_id             = module.network.vpc_id
  subnet_ids         = module.network.private_subnet_ids
  kubernetes_version = "1.27"
  instance_types     = ["t3.medium"]
  desired_nodes      = 2
  max_nodes          = 4
  min_nodes          = 1
}

module "rds" {
  source = "../../modules/rds"

  project_name          = "bonsai"
  vpc_id                = module.network.vpc_id
  subnet_ids            = module.network.private_subnet_ids
  eks_security_group_id = module.eks.cluster_security_group_id
  db_username           = "postgres"
  db_password           = data.aws_secretsmanager_secret_version.db_password.secret_string
  multi_az              = false
}

# Trigger infrastructure
