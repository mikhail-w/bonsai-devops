# DevOps Capstone Bonsai App - Terraform Infrastructure

This folder contains the Infrastructure as Code (IaC) configuration for the Bonsai eCommerce platform using [Terraform](https://www.terraform.io/). The infrastructure provisions AWS resources such as EKS, RDS, S3, DynamoDB, CloudWatch, EventBridge, and automated Lambda backups.

---

## 📁 Project Structure

```
infra/
└── terraform/
    ├── environments/
    │   └── production/
    │       ├── lambda/
    │       │   └── rds_backup.py
    │       ├── cloudwatch.tf
    │       ├── eventbridge.tf
    │       ├── main.tf
    │       ├── outputs.tf
    │       └── variables.tf
    ├── modules/
    │   ├── eks/
    │   │   ├── main.tf
    │   │   ├── outputs.tf
    │   │   └── variables.tf
    │   ├── network/
    │   │   ├── main.tf
    │   │   ├── outputs.tf
    │   │   └── variables.tf
    │   ├── rds/
    │   │   ├── main.tf
    │   │   ├── outputs.tf
    │   │   └── variables.tf
    │   ├── s3_dynamodb/
    │   │   ├── main.tf
    │   │   ├── outputs.tf
    │   │   └── variables.tf
    │   └── setup/
    │       ├── init_remote_state.tf
    │       
    │       

```

---

## ⚙️ Components Overview

### 1. `modules/eks`
- Deploys EKS cluster
- Manages node groups and roles
- Integrates with Kubernetes manifests later applied 

### 2. `modules/network`
- Provisions isolated VPC
- Includes public/private subnets, NAT gateway, internet gateway

### 3. `modules/rds`
- Creates PostgreSQL instance
- Parameterized to allow instance class, subnet group, and security group

### 4. `modules/s3_dynamodb`
- Creates:
  - S3 bucket for storing `.tfstate`
  - DynamoDB table for state locking and prevents race conditions

### 5. `lambda/rds_backup.py`
- AWS Lambda function for automated RDS snapshot backups
- Triggered via EventBridge schedule (defined in `eventbridge.tf`)
- Sends SNS notifications on success/failure
- Keeps only last 3 manual snapshots

### 6. `setup/init_remote_state.tf`
- Used once to initialize S3/DynamoDB remote backend before running root plan


### 7. `cloudwatch.tf`
- Sets up **CloudWatch Log Groups** for capturing logs from:
  - EKS cluster
  - RDS snapshot Lambda
- Enables **log retention policies** (e.g., 7 days, 30 days)
- Integrated with Lambda to store invocation logs and status

### 8. `eventbridge.tf`
- Creates **Amazon EventBridge rule** on a schedule (e.g., daily at midnight)
- Triggers the Lambda function in `lambda/rds_backup.py`
- Ensures consistent backup execution
- Associates **SNS topic** to send email notifications for success/failure

The files cloudwatch.tf and eventbridge.tf work together with  `lambda/` and `rds/` modules to automate daily database snapshots and alerting.


---


Run this to initialize remote state:
```bash
cd infra/terraform/modules/setup
terraform init
terraform apply
```

Then, you can switch to root:
```bash
cd ../../
terraform init
terraform plan
```

---

## 📤 Deployment Steps

```bash
# Step into production environment
cd infra/terraform/environments/production

# Initialize, plan and apply
terraform init
terraform plan
terraform apply
```

---

## 📌 Notes

- Each module is reusable and parameterized with `variables.tf`.
- Lambda relies on environment variables set in `eventbridge.tf`.
- Sensitive values are passed via `terraform.tfvars` or environment variables in CI/CD.
- Designed for extensibility and EKS-managed workloads
---

