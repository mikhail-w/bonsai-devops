#!/bin/bash
set -e

echo "======== EKS Deployment Script ========"

# Check for required tools
if ! command -v envsubst &> /dev/null; then
  echo "envsubst not found, installing gettext package..."
  if command -v apt-get &> /dev/null; then
    sudo apt-get update && sudo apt-get install -y gettext-base
  elif command -v yum &> /dev/null; then
    sudo yum install -y gettext
  elif command -v brew &> /dev/null; then
    brew install gettext
  else
    echo "Error: Cannot install gettext. Please install manually."
    exit 1
  fi
fi

# Set default values
CLUSTER_NAME=${CLUSTER_NAME:-"bonsai-cluster"}
AWS_REGION=${AWS_REGION:-"us-east-1"}
RDS_ENDPOINT=${RDS_ENDPOINT:-"bonsai-db.cvyw6igek2bp.us-east-1.rds.amazonaws.com"}

# Allow overriding values from command line
while [ $# -gt 0 ]; do
  case "$1" in
    --cluster-name=*)
      CLUSTER_NAME="${1#*=}"
      ;;
    --region=*)
      AWS_REGION="${1#*=}"
      ;;
    --rds-endpoint=*)
      RDS_ENDPOINT="${1#*=}"
      ;;
    --skip-build)
      SKIP_BUILD=true
      ;;
    --docker-repo=*)
      DOCKER_REPO="${1#*=}"
      ;;
    *)
      echo "Unknown parameter: $1"
      exit 1
      ;;
  esac
  shift
done

# Set Docker repository if not specified
DOCKER_REPO=${DOCKER_REPO:-"mikhailg215"}

# Define base directory - this should be where the script is run from
BASE_DIR="$(pwd)"
echo "Working directory: $BASE_DIR"
echo "Cluster name: $CLUSTER_NAME"
echo "AWS region: $AWS_REGION"
echo "RDS endpoint: $RDS_ENDPOINT"
echo "Docker repository: $DOCKER_REPO"

# Connect to EKS cluster
echo "Connecting to EKS cluster..."
aws eks update-kubeconfig --name "$CLUSTER_NAME" --region "$AWS_REGION"

# Add this section to install the EBS CSI driver if it's not already installed
echo "Checking if EBS CSI driver is installed..."
if ! kubectl get deployment ebs-csi-controller -n kube-system &> /dev/null; then
  echo "EBS CSI driver not found. Installing it now..."
  
  # 1. Enable IAM OIDC provider for the cluster
  echo "Enabling IAM OIDC provider..."
  eksctl utils associate-iam-oidc-provider --cluster "$CLUSTER_NAME" --approve
  
  # 2. Create IAM role for the EBS CSI driver
  echo "Creating IAM service account for EBS CSI driver..."
  eksctl create iamserviceaccount \
    --name ebs-csi-controller-sa \
    --namespace kube-system \
    --cluster "$CLUSTER_NAME" \
    --attach-policy-arn arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy \
    --approve \
    --role-only \
    --role-name AmazonEKS_EBS_CSI_DriverRole
  
  # 3. Install the EBS CSI driver add-on
  echo "Installing EBS CSI driver add-on..."
  eksctl create addon \
    --name aws-ebs-csi-driver \
    --cluster "$CLUSTER_NAME" \
    --service-account-role-arn arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/AmazonEKS_EBS_CSI_DriverRole \
    --force
  
  # Wait for the EBS CSI driver to be ready
  echo "Waiting for EBS CSI driver to be ready..."
  kubectl wait --for=condition=available --timeout=5m deployment/ebs-csi-controller -n kube-system || true
  
  echo "EBS CSI driver installation completed."
else
  echo "EBS CSI driver is already installed."
fi

# Create namespace
echo "Creating namespace..."
kubectl apply -f "${BASE_DIR}/namespace.yaml"

# Apply storage
echo "Creating storage resources..."
kubectl apply -f "${BASE_DIR}/storage/storage.yaml"

# Initialize with default Load Balancer (temporary - will be updated later)
TEMP_LOAD_BALANCER="http://cluster-endpoint.example.com"

# Create a temporary ConfigMap with placeholders replaced
echo "Preparing ConfigMap..."
TEMP_CONFIG=$(mktemp)
cat "${BASE_DIR}/config/configmap.yaml" > "$TEMP_CONFIG"

# Replace placeholders with actual values
sed -i "s|{{RDS_ENDPOINT}}|$RDS_ENDPOINT|g" "$TEMP_CONFIG"
sed -i "s|{{LOAD_BALANCER_URL}}|$TEMP_LOAD_BALANCER|g" "$TEMP_CONFIG"

# Apply ConfigMap and Secrets
echo "Creating ConfigMap and Secrets..."
kubectl apply -f "$TEMP_CONFIG"
kubectl apply -f "${BASE_DIR}/config/secrets.yaml"

# Apply NGINX configuration
echo "Applying NGINX configuration..."
kubectl apply -f "${BASE_DIR}/config/nginx-config.yaml"

# Inject Docker repository into deployment files
echo "Preparing deployment files with Docker repository..."
export DOCKER_REPO="$DOCKER_REPO"

# Check if we should build and push Docker images
if [ "$SKIP_BUILD" != "true" ]; then
  echo "Building and pushing Docker images..."
  
  echo "Building backend image..."
  docker build -t "$DOCKER_REPO/bonsai-backend:latest" ../../../apps/backend
  
  echo "Building frontend image..."
  docker build -t "$DOCKER_REPO/bonsai-frontend:latest" ../../../apps/frontend
  
  echo "Pushing images..."
  docker push "$DOCKER_REPO/bonsai-backend:latest"
  docker push "$DOCKER_REPO/bonsai-frontend:latest"
else
  echo "Skipping Docker build and push (--skip-build flag provided)"
fi

# Apply services and deployments
echo "Deploying services..."
kubectl apply -f "${BASE_DIR}/services/"

# Apply deployments
echo "Deploying applications..."
envsubst < "${BASE_DIR}/deployments/frontend-deployment.yaml" | kubectl apply -f -
kubectl apply -f "${BASE_DIR}/deployments/backend-deployment.yaml"

# Apply ingress if available
if [ -f "${BASE_DIR}/ingress/ingress.yaml" ]; then
  echo "Deploying ingress..."
  kubectl apply -f "${BASE_DIR}/ingress/ingress.yaml"
fi

# Wait for deployments to be ready
echo "Waiting for deployments to be ready..."
kubectl rollout status deployment/bonsai-backend -n bonsai --timeout=5m
kubectl rollout status deployment/bonsai-frontend -n bonsai --timeout=5m

# Get Load Balancer information
echo "Getting Load Balancer information..."
LOAD_BALANCER=$(kubectl get ingress bonsai-ingress -n bonsai -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")

if [ -z "$LOAD_BALANCER" ]; then
  echo "Trying to get Load Balancer from frontend service..."
  LOAD_BALANCER=$(kubectl get service bonsai-frontend -n bonsai -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")
fi

if [ -n "$LOAD_BALANCER" ]; then
  # Format the Load Balancer URL
  LOAD_BALANCER_URL="http://$LOAD_BALANCER"
  echo "Load Balancer URL: $LOAD_BALANCER_URL"

  # Update ConfigMap with the actual Load Balancer URL
  echo "Updating ConfigMap with actual Load Balancer URL..."
  UPDATED_CONFIG=$(mktemp)
  cat "${BASE_DIR}/config/configmap.yaml" > "$UPDATED_CONFIG"
  
  # Replace placeholders with actual values
  sed -i "s|{{RDS_ENDPOINT}}|$RDS_ENDPOINT|g" "$UPDATED_CONFIG"
  sed -i "s|{{LOAD_BALANCER_URL}}|$LOAD_BALANCER_URL|g" "$UPDATED_CONFIG"
  
  # Apply the updated ConfigMap
  kubectl apply -f "$UPDATED_CONFIG"
  rm "$UPDATED_CONFIG"

  # Restart deployments to pick up new configuration
  echo "Restarting deployments to pick up new configuration..."
  kubectl rollout restart deployment/bonsai-frontend -n bonsai
  kubectl rollout restart deployment/bonsai-backend -n bonsai

  # Wait for deployments to be ready after restart
  echo "Waiting for deployments to be ready after restart..."
  kubectl rollout status deployment/bonsai-backend -n bonsai --timeout=5m
  kubectl rollout status deployment/bonsai-frontend -n bonsai --timeout=5m

  # Check media directory in pods
  echo "Verifying media files in backend pod..."
  BACKEND_POD=$(kubectl get pods -n bonsai -l app=bonsai-backend -o jsonpath="{.items[0].metadata.name}")
  kubectl exec -n bonsai $BACKEND_POD -- sh -c "ls -la /app/media/products/ || echo 'No products directory found'"
else
  echo "WARNING: Could not find Load Balancer URL."
fi

# Clean up temporary files
rm -f "$TEMP_CONFIG"

# Print final status
echo "======== Deployment Complete ========"
if [ -n "$LOAD_BALANCER" ]; then
  echo "Your application should be accessible at: $LOAD_BALANCER_URL"
fi
echo ""
echo "Backend pods:"
kubectl get pods -l app=bonsai-backend -n bonsai
echo ""
echo "Frontend pods:"
kubectl get pods -l app=bonsai-frontend -n bonsai
echo ""
echo "Services:"
kubectl get services -n bonsai
echo ""
echo "Ingress:"
kubectl get ingress -n bonsai
echo ""

# Add instructions for debugging media files
echo ""
echo "To check media files in the backend pod, run:"
echo "kubectl exec -it \$(kubectl get pods -n bonsai -l app=bonsai-backend -o jsonpath='{.items[0].metadata.name}') -n bonsai -- sh -c 'find /app/media -type f | sort'"

echo ""
echo "If images are still not loading, verify your RDS database has correct image paths with:"
echo "kubectl exec -it \$(kubectl get pods -n bonsai -l app=bonsai-backend -o jsonpath='{.items[0].metadata.name}') -n bonsai -- python manage.py shell -c \"from base.models import Product; print('\\n'.join([f'{p.id}: {p.image}' for p in Product.objects.all()[:5]]))\""