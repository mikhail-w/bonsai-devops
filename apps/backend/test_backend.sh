#!/bin/bash

# Clean up any existing containers
docker rm -f bonsai-backend-test 2>/dev/null

# Build the Docker image
echo "Building Docker image..."
docker build -t bonsai-backend -f Dockerfile .

# Run the container with environment variables
echo "Running container..."
docker run -d \
  --name bonsai-backend-test \
  --add-host=host.docker.internal:host-gateway \
  --memory=2g \
  --memory-swap=2g \
  -p 8000:8001 \
  -e DEBUG=True \
  -e DJANGO_SETTINGS_MODULE=backend.settings \
  -e ALLOWED_HOSTS=localhost,127.0.0.1 \
  -e DB_NAME=bonsai_test \
  -e DB_USER=postgres \
  -e DB_PASSWORD=password \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=5432 \
  bonsai-backend

# Wait for container to start
echo "Waiting for container to start..."
sleep 15

# Check container logs
echo "Container logs:"
docker logs bonsai-backend-test

# Check if container is still running
if [ "$(docker ps -q -f name=bonsai-backend-test)" ]; then
    echo "Container is running"
    
    # Check if gunicorn is running
    echo "Checking if gunicorn is running..."
    docker exec bonsai-backend-test ps aux | grep gunicorn
    
    # Check container status
    echo "Container status:"
    docker ps -a | grep bonsai-backend-test
else
    echo "Container failed to start or crashed"
    echo "Last logs:"
    docker logs bonsai-backend-test
fi

# Cleanup
echo "Cleaning up..."
docker stop bonsai-backend-test
docker rm bonsai-backend-test