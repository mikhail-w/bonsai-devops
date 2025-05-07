
# ☁️ DevOps Capstone Bonsai App  — EKS Kubernetes Deployment Guide

This document provides a comprehensive guide for deploying the Bonsai full-stack application to **AWS Elastic Kubernetes Service (EKS)**. This production-grade deployment leverages auto-scaling, secure secrets management, persistent storage, and more.

---

## 📦 Folder Structure (eks/)

```
eks/
├── backend-deployment.yaml
├── backend-hpa.yaml
├── configmap.yaml
├── frontend-deployment.yaml
├── frontend-hpa.yaml
├── nginx-config.yaml
├── secrets.yaml
├── namespace.yaml
```

---

## 🚀 Deployment Overview

### Prerequisites

- AWS EKS cluster (provisioned via Terraform or manually)
- IAM roles for service accounts (for ALB controller and access)
- kubectl configured with your EKS context
- `bonsai` namespace created

---

## 🔁 Deployment Steps

```bash
# Set context to EKS cluster (if not already)
kubectl config use-context <your-eks-context>

# Create namespace
kubectl apply -f eks/namespace.yaml

# Apply secrets and configmap
kubectl apply -f eks/secrets.yaml
kubectl apply -f eks/configmap.yaml

# Apply nginx config (reverse proxy)
kubectl apply -f eks/nginx-config.yaml

# Deploy backend and autoscaler
kubectl apply -f eks/backend-deployment.yaml
kubectl apply -f eks/backend-hpa.yaml

# Deploy frontend and autoscaler
kubectl apply -f eks/frontend-deployment.yaml
kubectl apply -f eks/frontend-hpa.yaml
```

---

## 🔧 EKS Deployment Details

### ✅ Features

- Horizontal Pod Autoscalers for frontend and backend
- Init containers for:
  - DB readiness
  - Django migrations
  - Media file sync
- Persistent volume claims (optional EBS-backed)
- ConfigMaps for environment control
- Secrets for Django and API keys
- ALB/NGINX-based routing for ingress

### 🧠 Health Checks

Both frontend and backend define:
- `readinessProbe`
- `livenessProbe`
- `/health` endpoint

---

## 🔐 Secrets Overview (`secrets.yaml`)

Stores sensitive data like:

- DB credentials
- Django superuser account
- API keys for:
  - PayPal
  - Google Maps
  - Google Vision
  - OpenWeather
- AWS S3 credentials

---

## ⚙️ Autoscaling (`HPA`)

Each service scales between **2–5 replicas** when CPU usage exceeds 70%.

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
```

---

## 📁 Media and Static Handling

Init containers in the backend handle:

- Syncing media from container → PVC
- Ensuring correct directory structure
- Setting permissions (`chmod -R 777`)
- Serving via `/media/` and `/static/` routes

---

## 🌍 NGINX Config (`nginx-config.yaml`)

Reverse proxy rules:

- `/api/*` → backend
- `/media/*`, `/static/*` → backend
- `/` → frontend `index.html`

---

## 🧩 Environment Config (`configmap.yaml`)

Sets development or production mode and client-facing URLs:

- `VITE_API_BASE_URL`
- `VITE_MEDIA_URL`, `VITE_STATIC_URL`
- CORS + CSRF policies
- Django and React flags

---

## 🧪 Validation

```bash
kubectl get pods -n bonsai
kubectl get svc -n bonsai
kubectl get hpa -n bonsai
```

---

## 🔄 Load Balancer URL

After deploying:

```bash
kubectl get svc -n bonsai
```

Update `configmap.yaml` with the external LoadBalancer URL for frontend:

```yaml
DOMAIN_NAME: "your-load-balancer-url"
VITE_API_BASE_URL: "https://your-load-balancer-url"
```

Then re-apply the config:

```bash
kubectl apply -f eks/configmap.yaml
kubectl rollout restart deployment bonsai-frontend -n bonsai
```
