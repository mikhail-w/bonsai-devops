#!/bin/sh

# Dynamically set backend routing defaults if not provided
export BACKEND_SERVICE_HOST=${BACKEND_SERVICE_HOST:-bonsai-backend}
export BACKEND_SERVICE_PORT=${BACKEND_SERVICE_PORT:-8000}

echo "Injecting environment variables into nginx.conf..."
envsubst '${BACKEND_SERVICE_HOST} ${BACKEND_SERVICE_PORT}' < /etc/nginx/templates/nginx.conf > /etc/nginx/conf.d/default.conf

# Create JavaScript environment config
cat > /usr/share/nginx/html/env-config.js << EOF
window.ENV = {
  VITE_API_BASE_URL: "${VITE_API_BASE_URL}",
  VITE_API_URL: "${VITE_API_URL}",
  VITE_MEDIA_URL: "${VITE_MEDIA_URL}",
  VITE_STATIC_URL: "${VITE_STATIC_URL}",
  VITE_WEATHER_API_KEY: "${VITE_WEATHER_API_KEY}",
  VITE_PAYPAL_CLIENT_ID: "${VITE_PAYPAL_CLIENT_ID}",
  VITE_GOOGLE_MAPS_API_KEY: "${VITE_GOOGLE_MAPS_API_KEY}",
  VITE_GOOGLE_CLOUD_VISION_API_KEY: "${VITE_GOOGLE_CLOUD_VISION_API_KEY}"
};
EOF

echo "Environment configuration ready"