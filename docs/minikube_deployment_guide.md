# 🚀 Bonsai Project: Comprehensive Minikube Deployment Guide

## 📚 What is Minikube?

Minikube is a tool that enables you to run Kubernetes locally. It creates a
single-node Kubernetes cluster inside a virtual machine on your local machine.
This is particularly useful for:

- Local development and testing of Kubernetes applications
- Learning and experimenting with Kubernetes features
- Testing deployment configurations before moving to production
- CI/CD pipeline testing

### Benefits of Using Minikube in This Project

1. **Local Development Environment**

   - Test your application in a Kubernetes environment without cloud costs
   - Develop and debug in an environment that mirrors production
   - Fast iteration cycles without waiting for cloud deployments

2. **Infrastructure as Code Testing**

   - Validate Kubernetes manifests and configurations locally
   - Test infrastructure changes before applying them to production
   - Ensure consistency between local and production environments

3. **Cost-Effective Testing**

   - No cloud costs during development
   - Ability to test complex Kubernetes features locally
   - Safe environment for experimenting with new configurations

4. **Team Collaboration**
   - Consistent development environment across team members
   - Easy sharing of configurations and troubleshooting steps
   - Simplified onboarding for new team members

## 📋 Prerequisites

Before starting, ensure you have the following installed:

- Docker
- kubectl
- Minikube

### Installation Instructions

#### Install kubectl

```bash
# For Linux
sudo apt-get update && sudo apt-get install -y kubectl

# For macOS
brew install kubectl
```

#### Install Minikube

```bash
# For Linux
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# For macOS
brew install minikube
```

## 🚀 Deployment Process

### 1. Using the Deployment Script

The project includes an automated deployment script
(`infra/k8s/minikube-deploy.sh`) that handles the entire deployment process. To
use it:

```bash
# Make the script executable
chmod +x infra/k8s/minikube-deploy.sh

# Run the deployment script
./infra/k8s/minikube-deploy.sh
```

The script will:

- Start Minikube with sufficient resources (4 CPUs, 4GB RAM)
- Configure the Docker environment
- Build Docker images
- Create Kubernetes namespace
- Set up ConfigMaps and Secrets
- Deploy services and applications

### 2. Manual Deployment Steps

If you prefer to deploy manually, follow these steps:

#### Start Minikube

```bash
# Start with Docker driver
minikube start --driver=docker --cpus=4 --memory=4096

# For WSL2 users
minikube start --driver=docker --container-runtime=docker --force
```

#### Configure Docker Environment

```bash
eval $(minikube docker-env)
```

#### Build Images

```bash
# Build backend image
docker build -t bonsai-backend:latest ./apps/backend

# Build frontend image
docker build -t bonsai-frontend:latest ./apps/frontend
```

#### Deploy Kubernetes Resources

```bash
# Create namespace
kubectl create namespace bonsai
kubectl config set-context --current --namespace=bonsai

# Check current context
kubectl config current-context

# Check all contexts (optional)
kubectl config get-contexts

# Deploy Persistent volume/storage
kubectl apply -f infra/k8s/storage/storage.yaml

# Deploy ConfigMap and Secrets
kubectl apply -f infra/k8s/config/

# Deploy services
kubectl apply -f infra/k8s/services/

# Deploy deployments
kubectl apply -f infra/k8s/deployments/

# Enable and configure ingress
minikube addons enable ingress

# Wait for the Ingress Controller to Be Ready
kubectl get pods -n ingress-nginx
```

#### You should see something like:

```bash
ingress-nginx-controller-xxxxx      1/1     Running   ...
```

#### Apply the Ingress

```bash
kubectl apply -f infra/k8s/ingress/ingress.yaml

```

#### ✅ Step 7: Map bonsai.local in /etc/hosts

Get Minikube IP:

```bash
minikube ip
```

Example result:

```bash
192.168.49.2
```

Now add this entry to your /etc/hosts file (you’ll need sudo):

```bash
sudo nano /etc/hosts
```

Add this line at the bottom:

```bash
192.168.49.2 bonsai.local
```

Save and close.

## 🔍 Verifying the Deployment

### Check Pod Status

```bash
kubectl get pods -n bonsai
```

### Check Services

```bash
kubectl get services -n bonsai
```

### Check Ingress

```bash
kubectl get ingress -n bonsai
```

### Access the Application

There are several ways to access your application in Minikube:

1. **Using the Ingress (Recommended)**

   ```bash
   # First, ensure ingress is enabled
   minikube addons enable ingress

   # Get the Minikube IP address
   minikube ip

   # Add the following line to your /etc/hosts file (requires sudo/admin privileges)
   # Replace <minikube-ip> with the IP address from the previous command
   sudo echo "<minikube-ip> bonsai.local" >> /etc/hosts

   # Now you can access the application at:
   # Frontend: http://bonsai.local
   # Backend API: http://bonsai.local/api
   ```

2. **Using Port Forwarding**

   ```bash
   # Forward frontend service
   kubectl port-forward service/bonsai-frontend 8090:80 -n bonsai
   # Access at: http://localhost:8090

   # Forward backend service
   kubectl port-forward service/bonsai-backend 8000:8000 -n bonsai
   # Access at: http://localhost:8000
   ```

3. **Using Minikube Service**

   ```bash
   # Open frontend in browser
   minikube service bonsai-frontend -n bonsai

   # Open backend in browser
   minikube service bonsai-backend -n bonsai
   ```

4. **Using Minikube Dashboard**
   ```bash
   # Open the Kubernetes dashboard
   minikube dashboard --url
   # This will open a browser window with the Kubernetes dashboard
   # Navigate to the "Services" section to find service URLs
   ```

### Current Port Configuration

The current configuration uses the following ports:

| Service  | Container Port | Host Port | Access URL            |
| -------- | -------------- | --------- | --------------------- |
| Frontend | 80             | 8090      | http://localhost:8090 |
| Backend  | 8000           | 8000      | http://localhost:8000 |

> **Important**: The backend consistently uses port 8000. Make sure all
> configurations reference this port for backend services.

### Using the Port-Forward Script

For convenience, you can use the included port-forwarding script:

```bash
# Make the script executable
chmod +x kubectl-port-forward.sh

# Run the port-forwarding script
./kubectl-port-forward.sh
```

This script will:

- Set up port forwarding for frontend (8090:80) and backend (8000:8000)
- Update the ConfigMap with proper CORS settings
- Restart the pods to apply the new configuration

## 🛠️ Troubleshooting CORS Issues

### Common CORS Problems

CORS (Cross-Origin Resource Sharing) issues are common when deploying to
Kubernetes, especially with port forwarding. Here's how to resolve them:

1. **Port Mismatch**

   Ensure that all configurations reference the same ports. The backend
   consistently uses port 8000, not 8080.

   Check these files for consistent port references:

   - `infra/k8s/config/configmap.yaml`
   - `infra/k8s/deployments/frontend-deployment.yaml`
   - `infra/k8s/deployments/backend-deployment.yaml`
   - `kubectl-port-forward.sh`
   - Frontend source files (for hardcoded API URLs)

2. **CORS Headers Configuration**

   Ensure the backend allows requests from the frontend origin:

   ```yaml
   CORS_ALLOWED_ORIGINS: 'http://localhost:8090,http://127.0.0.1:8090,http://localhost:8000,http://127.0.0.1:8000,http://bonsai-frontend'
   CORS_ALLOW_ALL_ORIGINS: 'True'
   CSRF_TRUSTED_ORIGINS: 'http://localhost:8090,http://127.0.0.1:8090,http://localhost:8000,http://127.0.0.1:8000'
   ```

## 🛠️ Essential Minikube Commands

### Basic Operations

| Command              | Description               |
| -------------------- | ------------------------- |
| `minikube start`     | Start the cluster         |
| `minikube stop`      | Stop the cluster          |
| `minikube status`    | Check cluster status      |
| `minikube delete`    | Delete the cluster        |
| `minikube dashboard --url` | Open Kubernetes dashboard |

### Networking

| Command                           | Description                           |
| --------------------------------- | ------------------------------------- |
| `minikube tunnel`                 | Create route to LoadBalancer services |
| `minikube service <service-name>` | Open service URL in browser           |
| `minikube ip`                     | Get cluster IP address                |
| `minikube service list`           | List all service URLs                 |

### Debugging

| Command                                    | Description                  |
| ------------------------------------------ | ---------------------------- |
| `kubectl logs <pod-name>`                  | View pod logs                |
| `kubectl describe pod <pod-name>`          | Get detailed pod information |
| `kubectl exec -it <pod-name> -- /bin/bash` | Access pod shell             |
| `minikube logs`                            | View Minikube logs           |

### Configuration

| Command                             | Description                |
| ----------------------------------- | -------------------------- |
| `minikube config view`              | View current configuration |
| `minikube config set <key> <value>` | Set configuration value    |
| `minikube addons list`              | List available add-ons     |
| `minikube addons enable <addon>`    | Enable an add-on           |

## 🔧 Troubleshooting

### Common Issues and Solutions

1. **Pod Stuck in Pending State**

   ```bash
   kubectl describe pod <pod-name>
   kubectl get events --sort-by='.lastTimestamp'
   ```

2. **Image Pull Errors**

   ```bash
   # Ensure you're using Minikube's Docker daemon
   eval $(minikube docker-env)
   # Rebuild images
   docker build -t bonsai-backend:latest ./apps/backend
   docker build -t bonsai-frontend:latest ./apps/frontend
   ```

3. **Ingress Not Working**

   ```bash
   # Check ingress controller
   kubectl get pods -n ingress-nginx
   # Verify ingress configuration
   kubectl describe ingress -n bonsai
   ```

4. **Resource Issues**

   ```bash
   # Check resource usage
   kubectl top nodes
   kubectl top pods -n bonsai
   ```

5. **Storage Provisioner Issues**

   If you encounter errors with the storage provisioner during startup:

   ```bash
   # Delete the minikube cluster
   minikube delete

   # Start minikube with storage add-on disabled initially
   minikube start --driver=docker --cpus=4 --memory=4096 --disable-optimizations

   # Wait for the cluster to fully start, then manually enable the storage provisioner
   minikube addons enable storage-provisioner
   minikube addons enable default-storageclass

   # Then run your deployment script
   ./infra/k8s/minikube-deploy.sh
   ```

## 📈 Monitoring and Maintenance

### View Resource Usage

```bash
# Enable metrics server
minikube addons enable metrics-server

# View resource usage
kubectl top nodes
kubectl top pods -n bonsai
```

### Clean Up Resources

```bash
# Delete unused resources
kubectl delete pod <pod-name> -n bonsai
kubectl delete service <service-name> -n bonsai
kubectl delete deployment <deployment-name> -n bonsai
```

### Update Deployments

```bash
# Update image
kubectl set image deployment/<deployment-name> <container-name>=<new-image> -n bonsai

# Rollback deployment
kubectl rollout undo deployment/<deployment-name> -n bonsai
```

## 🔄 Continuous Integration

For CI/CD pipelines, you can use the following commands in your pipeline:

```bash
# Start Minikube
minikube start --driver=docker --cpus=4 --memory=4096

# Deploy application
./infra/k8s/minikube-deploy.sh

# Run tests
kubectl exec -it <test-pod-name> -n bonsai -- /bin/bash -c "run-tests.sh"

# Clean up
minikube delete
```

## 📚 Additional Resources

- [Minikube Documentation](https://minikube.sigs.k8s.io/docs/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Project Documentation](./project_readme.md)
- [Troubleshooting Guide](./troubleshooting_guide.md)

## 📊 Using the Minikube Dashboard

The Minikube Dashboard provides a web-based UI for managing your Kubernetes
cluster. Here's how to use it effectively:

### 1. Starting the Dashboard

```bash
# Start the dashboard
minikube dashboard

# If you want to access it from a different machine, use:
minikube dashboard --url
```

### 2. Dashboard Navigation

The dashboard is organized into several main sections:

1. **Overview**

   - Shows cluster health and resource usage
   - Displays running pods, services, and deployments
   - Quick access to logs and shell

2. **Workloads**

   - **Pods**: View and manage running containers
   - **Deployments**: Manage application deployments
   - **Replica Sets**: View and manage replica sets
   - **Stateful Sets**: Manage stateful applications
   - **Daemon Sets**: View and manage daemon sets
   - **Jobs**: Monitor and manage jobs

3. **Services**

   - **Services**: View and manage service endpoints
   - **Ingresses**: Configure and monitor ingress rules
   - **Endpoints**: View service endpoints

4. **Storage**

   - **Persistent Volumes**: Manage storage volumes
   - **Persistent Volume Claims**: View storage claims
   - **Storage Classes**: Configure storage classes

5. **Configuration**
   - **Config Maps**: Manage configuration data
   - **Secrets**: Handle sensitive information
   - **Resource Quotas**: Set resource limits
   - **Limit Ranges**: Configure resource constraints

### 3. Common Dashboard Tasks

#### Viewing Pod Logs

1. Navigate to "Workloads" → "Pods"
2. Click on the pod name
3. Click the "Logs" tab
4. Use the log viewer to:
   - Filter logs
   - Download logs
   - View container logs

#### Accessing Pod Shell

1. Navigate to "Workloads" → "Pods"
2. Click on the pod name
3. Click the "Exec" tab
4. Select the container
5. Click "Connect" to open a shell

#### Scaling Deployments

1. Navigate to "Workloads" → "Deployments"
2. Click on the deployment name
3. Click the "Scale" button
4. Enter the desired number of replicas
5. Click "OK"

#### Viewing Service Details

1. Navigate to "Services"
2. Click on the service name
3. View:
   - Service endpoints
   - Port mappings
   - Selector labels
   - External endpoints

### 4. Dashboard Tips and Tricks

1. **Quick Access**

   - Use the search bar to find resources
   - Use keyboard shortcuts (press '?' to view)
   - Bookmark frequently used views

2. **Resource Management**

   - Monitor resource usage in real-time
   - Set up resource quotas
   - Configure limit ranges

3. **Troubleshooting**

   - View pod events
   - Check container status
   - Monitor resource usage
   - View service endpoints

4. **Security**
   - Manage RBAC policies
   - Configure network policies
   - Handle secrets securely

### 5. Dashboard Best Practices

1. **Regular Monitoring**

   - Check pod health regularly
   - Monitor resource usage
   - Review logs for errors

2. **Resource Management**

   - Set appropriate resource limits
   - Monitor resource quotas
   - Clean up unused resources

3. **Security**

   - Don't expose dashboard publicly
   - Use RBAC for access control
   - Rotate credentials regularly

4. **Maintenance**
   - Keep dashboard up to date
   - Clean up old resources
   - Monitor for deprecated features

### 6. Troubleshooting Dashboard Issues

If you encounter issues with the dashboard:

1. **Dashboard Not Starting**

   ```bash
   # Check Minikube status
   minikube status

   # Restart Minikube
   minikube stop
   minikube start

   # Try starting dashboard with verbose logging
   minikube dashboard --v=5
   ```

2. **Access Issues**

   ```bash
   # Get dashboard URL
   minikube dashboard --url

   # Check if dashboard pod is running
   kubectl get pods -n kubernetes-dashboard

   # View dashboard pod logs
   kubectl logs -n kubernetes-dashboard -l app=kubernetes-dashboard
   ```

3. **Performance Issues**

   ```bash
   # Check resource usage
   kubectl top nodes
   kubectl top pods -n kubernetes-dashboard

   # Restart dashboard
   kubectl rollout restart deployment kubernetes-dashboard -n kubernetes-dashboard
   ```
