
# DevOps Capstone Project Guide

## Objective

The objective of this capstone project is to provide you an opportunity to apply your knowledge and skills in various technologies and tools studied throughout the course.  
The project involves implementing DevOps practices into a delivery pipeline, focusing on automation, scalability, and efficient deployment on AWS cloud using technologies such as Terraform, Docker, and Kubernetes.  
The class will be split into teams of 3-4 students. Coordinate with your team to determine who will be responsible for each step in the project.  

You can choose amongst yourselves which fullstack application from either your personal or group projects, as long as it is not an application that you’ve deployed in a previous assessment. Or you can choose from one of the following projects provided by previous students:

---

## Project Steps

### Step 1: Project Setup and Prerequisites
- Set up a local development environment.
- One member creates the project on GitHub and grants access to others.
- Your project should consist of at least two repositories:
  1. **Infrastructure repository** for provisioning resources using Terraform.
  2. **Backend repository** for Flask or Django application.
  3. **Frontend repository** for React or NodeJS application.

> *Note:* If combining repositories, ensure separate workflows for building and pushing frontend and backend components to a container registry.

### Step 2: Infrastructure Provisioning
- Use Terraform to provision infrastructure on AWS:
  - EC2 server for provisioning
  - AWS RDS PostgreSQL
  - EKS cluster
- Set up remote state using DynamoDB and an S3 Bucket.
- Store Terraform files in the infrastructure repository.

### Step 3: Dockerization
- Create **multi-stage Dockerfiles** using Alpine at the root of each repo.
- Define dependencies, environment variables, and exposed ports.
- Build Docker images for each service.
- Test Docker images locally (you may need a database container).

### Step 4: Docker Compose
- Place `docker-compose.yml` in the main project repo.
- Write necessary services for app and DB.
- Configure volumes, networks, environment variables.
- Add health checks and service dependencies.
- Test `docker-compose` locally.

### Step 5: Continuous Integration & Continuous Delivery
- Every repo should have a GitHub Actions workflow:
  1. Backend & frontend: Build and push images to DockerHub or GitHub Container Registry.
  2. Infrastructure: CI workflow for Terraform (optional CD step to EKS).
  3. CD: Deploy app to AWS EKS after CI completes.

### Step 6: Orchestration with Kubernetes
- [Recommended] Deploy Django app on Minikube first.
- Use RDS to test DB connections.
- Kubernetes manifests should include:
  - ConfigMap & Secrets
  - Deployments & Services
  - Namespace & Quotas
  - Probes: liveness, readiness, startup (any two)
  - Storage Class (expandable)
  - PV & PVC using AWS Storage Class

### Step 7: Pipeline Optimization
- Add monitoring and alerts:
  - AWS Cloudwatch for EKS and EC2
  - SNS for RDS snapshot success and CPU alarm (50%+)
- Implement automated database backup:
  - Use EventBridge or CRON with `pg_dump`
- Add a workflow for backup cleanup (keep last 3 only).
- Add autoscaling and test its functionality.

### Step 8: Documentation & Diagram
- Document workflow and pipelines clearly.
- Include:
  - High-level flow and detailed subtasks
  - Architecture diagrams and schema maps
  - Rehearsed presentation and assigned parts

---

## Bonus Tasks
1. Write Terraform code for Route53 DNS records:
   - Use `projectname.codeplatoonprojects.org`
   - Don't deploy; just write code
2. Implement and integrate API test suite into pipeline

---

## Key Guidance
- Split into smaller tasks and assign deadlines.
- Document all steps clearly.
- Follow best practices and security.
- Regular check-ins with instructors.
- Use us-east-1 region and `east1-user` for all EKS work.
- Save cost: Use Minikube first, then move to AWS.

---

## Instructor’s Advice
- Ensure EKS volume permission for SC.
- Handle Django migrations properly inside containers.

---

## Capstone Limitations
- Region: `us-east-1` only
- Use user: `east1-user` (generate access/secret key pair)
- Use unique cluster name per team
- Keep keys private (no GitHub check-ins)
- Use RDS minimally, mainly for demos
