# 🌿 Bonsai eCommerce DevOps Capstone Project

Welcome to the official repository for the **Bonsai eCommerce Store** — a full-stack project built as part of Code Platoons DevOps Capstone. This project showcases real-world deployment workflows using modern DevOps practices, Kubernetes orchestration, CI/CD pipelines, Terraform-based infrastructure as code, and a containerized architecture.

> 🌐 Live Demo: [https://www.mwbonsai.com](https://www.mwbonsai.com)

---

## 📦 Tech Stack

- **Frontend**: React + Vite + Chakra UI
- **Backend**: Django + PostgreSQL + Django REST Framework
- **Containerization**: Docker, Docker Compose
- **Orchestration**: Kubernetes (Minikube for local, EKS for production)
- **Infrastructure**: Terraform (EC2, EKS, RDS, S3, IAM, CloudWatch)
- **CI/CD**: GitHub Actions (CI for frontend/backend, deploy to EKS)
- **Cloud Provider**: AWS
- **Application APIs**: Google Maps, Vision API, PayPal integration, Weather API

---

## 📁 Project Structure

```
bonsai/
├── .github/workflows/   # GitHub Actions CI/CD pipelines
├── apps/                # Application code
│   ├── backend/         # Django backend application
│   └── frontend/        # React frontend application
├── docs/                # Project documentation
├── infra/               # Infrastructure configuration
│   ├── k8s/             # Kubernetes manifests
│   └── terraform/       # Infrastructure as Code
├── .env                 # Environment variables (not in version control)
├── .gitignore           # Git ignore rules
├── docker-compose.yml   # Docker Compose configuration
├── LICENSE              # License file
└── README.md            # This file
```

---

## 🚀 Deployment Options

### 🐳 Local Docker Compose

Spin up the entire stack locally using Docker:

```bash
docker-compose up --build
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Admin Panel: `http://localhost:8000/admin`

📖 See [Docker Deployment Guide](./docs/docker_deployment_guide.md)

---

### 🎛️ Minikube (Kubernetes Local Dev)

To simulate production-grade orchestration locally:

```bash
chmod +x infra/k8s/minikube/minikube-deploy.sh
./infra/k8s/minikube/minikube-deploy.sh --background
```

- Frontend: `http://localhost:8090`
- Backend API: `http://localhost:8000`

📖 See [Minikube Guide](./docs/minikube_deployment_guide.md)

---

### ☁️ AWS EKS (Production)

AWS resources are provisioned using Terraform and deployed to an EKS cluster via GitHub Actions:

```bash
cd infra/terraform/environments/production
terraform init
terraform apply
```

Then push changes to trigger CI/CD deployment pipelines.

- CI/CD: `.github/workflows/`
- Infra deploy: `infra-deploy.yml`
- EKS deploy: `deploy.yml`

📖 See [EKS Guide](./docs/eks_deployment_guide.md)

---

## 🔄 CI/CD Workflows

GitHub Actions automate building, testing, security scanning, and deploying:

| Workflow        | Description                                       |
|-----------------|---------------------------------------------------|
| `frontend-ci.yml` | Lint, test, scan, and push React image to Docker Hub |
| `backend-ci.yml`  | Run Django unit tests, scan, and push image to Docker Hub    |
| `infra-deploy.yml`| Format, plan, and apply Terraform infrastructure|
| `deploy.yml`      | Deploy backend/frontend to EKS if CI passes     |

---

## ⚙️ Terraform Infrastructure (AWS)

Key services provisioned:

- **EKS Cluster**: Application orchestration
- **RDS PostgreSQL**: Production-grade DB
- **EC2 (Provisioner)**: Optional jumpbox/dev host
- **S3**: Static/media file hosting
- **IAM**: Secure access for nodes, pods, CI
- **CloudWatch + SNS**: Monitoring and alerting

---

## 🧪 Testing

- Django tests auto-run in `backend-ci.yml`
- React tests auto-run in `frontend-ci.yml`
- Manual testing via Postman and Browser
- Health checks: `/health/` endpoints on all services

---

## 🔐 Secrets & Environment

All secrets are managed using:

- `.env` file (local Docker)
- `secrets.yaml` (Minikube)
- AWS Secrets Manager (EKS)
- GitHub Secrets (CI/CD)

---

## 📈 Monitoring

- **CloudWatch Alarms**: CPU, RDS snapshots
- **Minikube Metrics Server**: `kubectl top`

---


📖 See [Terraform Guide](./docs/terraform_deployment_guide.md)


## 🌱 Features

- 🌳 Browse & buy bonsai plants
- 💳 PayPal payments
- 📸 Google Vision: plant recognition
- 📸 3D models and augmented reality
- 🌤️ OpenWeather: dynamic forecast
- 📍 Google Maps: locate nearby nurseries
- 📝 Blog, Reviews, and Chat

---


## 🧾 License

This project is licensed for educational and portfolio purposes. For commercial use, please contact the author.

---
