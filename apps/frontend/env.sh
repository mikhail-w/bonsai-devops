#!/bin/sh

# Dynamically set backend routing defaults if not provided
export BACKEND_SERVICE_HOST=${BACKEND_SERVICE_HOST:-bonsai-backend}
export BACKEND_SERVICE_PORT=${BACKEND_SERVICE_PORT:-8000}

echo "Injecting environment variables into nginx.conf..."
envsubst '${BACKEND_SERVICE_HOST} ${BACKEND_SERVICE_PORT}' < /etc/nginx/templates/nginx.conf > /etc/nginx/conf.d/default.conf

echo "NGINX config ready with backend host: ${BACKEND_SERVICE_HOST}:${BACKEND_SERVICE_PORT}"