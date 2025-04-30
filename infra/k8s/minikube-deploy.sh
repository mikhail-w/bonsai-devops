#!/bin/bash

# Exit on error
set -e

# Set colors for improved output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Script directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Define port numbers
FRONTEND_PORT=8090
BACKEND_PORT=8000

# Function to display messages
log() {
  local level=$1
  local message=$2
  case $level in
    "INFO")
      echo -e "${BLUE}ℹ️ INFO:${NC} $message"
      ;;
    "SUCCESS")
      echo -e "${GREEN}✅ SUCCESS:${NC} $message"
      ;;
    "WARNING")
      echo -e "${YELLOW}⚠️ WARNING:${NC} $message"
      ;;
    "ERROR")
      echo -e "${RED}❌ ERROR:${NC} $message"
      ;;
    *)
      echo "$message"
      ;;
  esac
}

# Display usage information
usage() {
  echo "Usage: $0 [--background]"
  echo "  --background  Run port forwarding in the background"
  exit 1
}

# If help is requested
if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
  usage
fi

# Function to check if running in WSL
check_wsl() {
  if grep -qi microsoft /proc/version; then
    log "INFO" "Running in WSL environment."
    return 0
  else
    log "INFO" "Not running in WSL environment."
    return 1
  fi
}

# Function to check if required commands exist
check_requirements() {
  log "INFO" "Checking requirements..."
  
  local missing_reqs=0
  
  for cmd in minikube kubectl docker; do
    if ! command -v $cmd &> /dev/null; then
      log "ERROR" "$cmd is required but not installed. Please install it first."
      missing_reqs=1
    fi
  done
  
  if [ $missing_reqs -eq 1 ]; then
    log "ERROR" "Missing requirements. Exiting."
    exit 1
  fi
  
  log "SUCCESS" "All requirements satisfied."
}

# Function to verify project structure
verify_project_structure() {
  log "INFO" "Verifying project structure..."
  
  local missing_dirs=0
  
  # Check for essential directories and files
  if [ ! -d "${PROJECT_ROOT}/apps/backend" ]; then
    log "ERROR" "Backend directory not found: ${PROJECT_ROOT}/apps/backend"
    missing_dirs=1
  fi
  
  if [ ! -d "${PROJECT_ROOT}/apps/frontend" ]; then
    log "ERROR" "Frontend directory not found: ${PROJECT_ROOT}/apps/frontend"
    missing_dirs=1
  fi
  
  if [ ! -d "${PROJECT_ROOT}/infra/k8s" ]; then
    log "ERROR" "Kubernetes configs directory not found: ${PROJECT_ROOT}/infra/k8s"
    missing_dirs=1
  fi
  
  if [ $missing_dirs -eq 1 ]; then
    log "ERROR" "Project structure verification failed. Exiting."
    exit 1
  fi
  
  log "SUCCESS" "Project structure verified."
}

# Start Minikube if it's not running
start_minikube() {
  log "INFO" "Checking Minikube status..."
  
  if ! minikube status | grep -q "Running"; then
    log "INFO" "Starting Minikube with 4 CPUs and 4GB RAM..."
    minikube start --driver=docker --cpus=4 --memory=4096
    
    # Wait for Minikube to be fully ready
    local retries=0
    local max_retries=10
    
    while ! minikube status | grep -q "Running"; do
      retries=$((retries+1))
      if [ $retries -gt $max_retries ]; then
        log "ERROR" "Minikube failed to start after $max_retries attempts. Exiting."
        exit 1
      fi
      log "INFO" "Waiting for Minikube to start (attempt $retries/$max_retries)..."
      sleep 5
    done
  else
    log "SUCCESS" "Minikube is already running."
  fi
}

# Configure Docker to use Minikube's daemon
configure_docker() {
  log "INFO" "Configuring Docker to use Minikube's daemon..."
  eval $(minikube docker-env)
  log "SUCCESS" "Docker environment configured."
}

# Build Docker images
build_images() {
  log "INFO" "Building Docker images..."
  
  log "INFO" "Building backend image..."
  if [ -f "${PROJECT_ROOT}/apps/backend/Dockerfile" ]; then
    docker build -t bonsai-backend:latest "${PROJECT_ROOT}/apps/backend"
    log "SUCCESS" "Backend image built successfully."
  else
    log "ERROR" "Backend Dockerfile not found. Exiting."
    exit 1
  fi
  
  log "INFO" "Building frontend image..."
  if [ -f "${PROJECT_ROOT}/apps/frontend/Dockerfile" ]; then
    docker build -t bonsai-frontend:latest "${PROJECT_ROOT}/apps/frontend"
    log "SUCCESS" "Frontend image built successfully."
  else
    log "ERROR" "Frontend Dockerfile not found. Exiting."
    exit 1
  fi
}

# Create or update Kubernetes resources
setup_kubernetes_resources() {
  log "INFO" "Setting up Kubernetes resources..."
  
  # Create namespace if it doesn't exist
  log "INFO" "Creating namespace 'bonsai'..."
  kubectl create namespace bonsai 2>/dev/null || true
  kubectl config set-context --current --namespace=bonsai
  
  # Update ConfigMap with URLs for port forwarding access
  log "INFO" "Creating/Updating ConfigMap..."
  
  cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: bonsai-config
  namespace: bonsai
data:
  # Environment
  ENVIRONMENT: "development"
  DOMAIN_NAME: "localhost"
  DEBUG: "True"
  
  # API URLs - configured for port forwarding
  API_BASE_URL: "http://localhost:${BACKEND_PORT}"
  VITE_API_BASE_URL: "http://localhost:${BACKEND_PORT}"
  VITE_API_URL: "http://localhost:${BACKEND_PORT}/api"
  VITE_MEDIA_URL: "http://localhost:${BACKEND_PORT}/media"
  VITE_STATIC_URL: "http://localhost:${BACKEND_PORT}/static"
  
  # Database
  DB_NAME: "bonsai_store"
  DB_USER: "postgres"
  DB_HOST: "bonsai-postgres"
  DB_PORT: "5432"
  
  # Security - configured for external access
  ALLOWED_HOSTS: "localhost,127.0.0.1,backend,bonsai-backend,bonsai.local,*.local,*"
  CORS_ALLOWED_ORIGINS: "http://localhost:${FRONTEND_PORT},http://127.0.0.1:${FRONTEND_PORT},http://localhost:${BACKEND_PORT},http://127.0.0.1:${BACKEND_PORT},http://localhost:*,http://127.0.0.1:*,*"
  CSRF_TRUSTED_ORIGINS: "http://localhost:${FRONTEND_PORT},http://127.0.0.1:${FRONTEND_PORT},http://localhost:${BACKEND_PORT},http://127.0.0.1:${BACKEND_PORT},http://localhost:*,http://127.0.0.1:*,*"
  
  # Authentication
  VITE_AUTH_TOKEN_KEY: "bonsai_auth_token"
  VITE_REFRESH_TOKEN_KEY: "bonsai_refresh_token"
  
  # Feature flags
  VITE_ENABLE_CHAT: "true"
  VITE_ENABLE_REVIEWS: "true"
  VITE_ENABLE_BLOG: "true"
  
  # Data loading
  LOAD_INITIAL_DATA: "True"
EOF
  log "SUCCESS" "ConfigMap created/updated."
  
  # Apply storage resources
  if [ -d "${PROJECT_ROOT}/infra/k8s/storage" ]; then
    log "INFO" "Creating Storage resources..."
    kubectl apply -f "${PROJECT_ROOT}/infra/k8s/storage/"
    log "SUCCESS" "Storage resources created."
  else
    log "WARNING" "Storage directory not found: ${PROJECT_ROOT}/infra/k8s/storage"
    log "INFO" "Applying individual storage configuration..."
    kubectl apply -f - <<EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-data-pvc
  namespace: bonsai
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: media-pvc
  namespace: bonsai
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 1Gi
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: static-pvc
  namespace: bonsai
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 500Mi
EOF
    log "SUCCESS" "Storage configuration applied."
  fi
  
  # Apply services
  log "INFO" "Creating Services..."
  
  # Backend Service
  cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Service
metadata:
  name: bonsai-backend
  namespace: bonsai
  labels:
    app: bonsai-backend
    tier: backend
spec:
  ports:
    - port: 8000
      targetPort: 8000
      name: http
  selector:
    app: bonsai-backend
    tier: backend
EOF

  # Frontend Service
  cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Service
metadata:
  name: bonsai-frontend
  namespace: bonsai
  labels:
    app: bonsai-frontend
    tier: frontend
spec:
  ports:
    - port: 80
      targetPort: 80
      name: http
  selector:
    app: bonsai-frontend
    tier: frontend
EOF

  # Postgres Service
  cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Service
metadata:
  name: bonsai-postgres
  namespace: bonsai
  labels:
    app: bonsai
    tier: database
spec:
  ports:
    - port: 5432
      targetPort: 5432
  selector:
    app: bonsai
    tier: database
EOF
  
  log "SUCCESS" "Services created."
  
  # Apply deployments
  if [ -d "${PROJECT_ROOT}/infra/k8s/deployments" ]; then
    log "INFO" "Creating Deployments..."
    kubectl apply -f "${PROJECT_ROOT}/infra/k8s/deployments/"
    log "SUCCESS" "Deployments created."
  else
    log "ERROR" "Deployments directory not found: ${PROJECT_ROOT}/infra/k8s/deployments"
    exit 1
  fi
}

# Apply Kubernetes secrets
apply_secrets() {
  log "INFO" "Creating/Updating Secrets..."
  
  if [ -f "${PROJECT_ROOT}/infra/k8s/config/secrets.yaml" ]; then
    kubectl apply -f "${PROJECT_ROOT}/infra/k8s/config/secrets.yaml"
    log "SUCCESS" "Secrets created/updated."
  else
    log "ERROR" "Secrets file not found: ${PROJECT_ROOT}/infra/k8s/config/secrets.yaml"
    exit 1
  fi
}

# Wait for pods to be ready
wait_for_pods() {
  log "INFO" "Waiting for pods to be ready..."
  
  # Wait for backend pod
  log "INFO" "Waiting for backend pod to be ready..."
  kubectl wait --for=condition=ready pod -l app=bonsai-backend --timeout=300s -n bonsai || {
    log "WARNING" "Backend pod not ready within timeout. Check with 'kubectl get pods -n bonsai'."
  }
  
  # Wait for frontend pod
  log "INFO" "Waiting for frontend pod to be ready..."
  kubectl wait --for=condition=ready pod -l app=bonsai-frontend --timeout=300s -n bonsai || {
    log "WARNING" "Frontend pod not ready within timeout. Check with 'kubectl get pods -n bonsai'."
  }
  
  # Show pod status
  log "INFO" "Current pod status:"
  kubectl get pods -n bonsai
}

# Show WSL2-specific instructions for Windows if needed
show_wsl_instructions() {
  if check_wsl; then
    local WSL_IP=$(hostname -I | awk '{print $1}')
    
    log "INFO" "WSL2 detected - Setup for Windows access:"
    echo ""
    echo "To access the application from Windows, run in PowerShell (as Administrator):"
    echo ""
    echo "# Get WSL IP address"
    echo "\$wslIP = \"${WSL_IP}\""
    echo ""
    echo "# Set up port forwarding from Windows to WSL2"
    echo "netsh interface portproxy delete v4tov4 listenport=${FRONTEND_PORT} listenaddress=0.0.0.0"
    echo "netsh interface portproxy delete v4tov4 listenport=${BACKEND_PORT} listenaddress=0.0.0.0"
    echo "netsh interface portproxy add v4tov4 listenport=${FRONTEND_PORT} listenaddress=0.0.0.0 connectport=${FRONTEND_PORT} connectaddress=\$wslIP"
    echo "netsh interface portproxy add v4tov4 listenport=${BACKEND_PORT} listenaddress=0.0.0.0 connectport=${BACKEND_PORT} connectaddress=\$wslIP"
    echo ""
    echo "# Optional: Add firewall rules"
    echo "New-NetFirewallRule -DisplayName \"WSL2 Port ${FRONTEND_PORT}\" -Direction Inbound -Action Allow -Protocol TCP -LocalPort ${FRONTEND_PORT}"
    echo "New-NetFirewallRule -DisplayName \"WSL2 Port ${BACKEND_PORT}\" -Direction Inbound -Action Allow -Protocol TCP -LocalPort ${BACKEND_PORT}"
    echo ""
  fi
}

# Set up port forwarding
setup_port_forwarding() {
  if [ "$1" == "--background" ]; then
    log "INFO" "Setting up port forwarding in background mode..."
    
    # Kill any existing processes on these ports
    log "INFO" "Checking for existing processes on these ports..."
    lsof -ti:${FRONTEND_PORT} | xargs kill -9 2>/dev/null || true
    lsof -ti:${BACKEND_PORT} | xargs kill -9 2>/dev/null || true
    
    # Start port forwarding in the background
    nohup kubectl port-forward -n bonsai deployment/bonsai-frontend ${FRONTEND_PORT}:80 --address 0.0.0.0 > frontend-port-forward.log 2>&1 &
    FRONTEND_PID=$!
    log "SUCCESS" "Frontend port forwarding started (PID: ${FRONTEND_PID})"
    
    nohup kubectl port-forward -n bonsai deployment/bonsai-backend ${BACKEND_PORT}:8000 --address 0.0.0.0 > backend-port-forward.log 2>&1 &
    BACKEND_PID=$!
    log "SUCCESS" "Backend port forwarding started (PID: ${BACKEND_PID})"
    
    log "INFO" "Port forwarding is running in the background."
    log "INFO" "To stop it, run: kill ${FRONTEND_PID} ${BACKEND_PID}"
  else
    log "INFO" "To access your application, run these commands in separate terminals:"
    echo ""
    echo "# Terminal 1 - Frontend"
    echo "kubectl port-forward -n bonsai deployment/bonsai-frontend ${FRONTEND_PORT}:80 --address 0.0.0.0"
    echo ""
    echo "# Terminal 2 - Backend"
    echo "kubectl port-forward -n bonsai deployment/bonsai-backend ${BACKEND_PORT}:8000 --address 0.0.0.0"
    echo ""
    log "WARNING" "You must run these commands to access your application."
  fi
}

# Main execution starts here
main() {
  log "INFO" "🚀 Starting Minikube deployment for Bonsai project..."
  
  check_requirements
  verify_project_structure
  start_minikube
  configure_docker
  build_images
  setup_kubernetes_resources
  apply_secrets
  wait_for_pods
  
  log "SUCCESS" "✅ Deployment completed successfully!"
  echo ""
  log "INFO" "🌐 Access the application at:"
  echo "   Frontend: http://localhost:${FRONTEND_PORT}"
  echo "   Backend API: http://localhost:${BACKEND_PORT}/api"
  echo "   Backend Admin: http://localhost:${BACKEND_PORT}/admin/"
  echo ""
  
  # Show WSL-specific instructions if needed
  show_wsl_instructions
  
  # Set up port forwarding
  setup_port_forwarding "$1"
  
  log "INFO" "📊 View the Kubernetes dashboard with: minikube dashboard"
}

# Execute main function with arguments
main "$@"