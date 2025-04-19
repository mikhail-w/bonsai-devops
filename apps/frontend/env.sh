#!/bin/sh

# Recreate config file
rm -rf /usr/share/nginx/html/env-config.js
touch /usr/share/nginx/html/env-config.js

# Add assignment 
echo "window._env_ = {" >> /usr/share/nginx/html/env-config.js

# Set default values if environment variables are not set
: "${VITE_API_BASE_URL:=http://localhost:8000}"
: "${VITE_API_URL:=${VITE_API_BASE_URL}/api}"
: "${VITE_MEDIA_URL:=${VITE_API_BASE_URL}/media}"

# Add environment variables with defaults
echo "  VITE_API_BASE_URL: \"${VITE_API_BASE_URL}\"," >> /usr/share/nginx/html/env-config.js
echo "  VITE_API_URL: \"${VITE_API_URL}\"," >> /usr/share/nginx/html/env-config.js
echo "  VITE_MEDIA_URL: \"${VITE_MEDIA_URL}\"," >> /usr/share/nginx/html/env-config.js
echo "  VITE_WEATHER_API_KEY: \"${VITE_WEATHER_API_KEY}\"," >> /usr/share/nginx/html/env-config.js
echo "  VITE_PAYPAL_CLIENT_ID: \"${VITE_PAYPAL_CLIENT_ID}\"," >> /usr/share/nginx/html/env-config.js
echo "  VITE_GOOGLE_MAPS_API_KEY: \"${VITE_GOOGLE_MAPS_API_KEY}\"," >> /usr/share/nginx/html/env-config.js
echo "  VITE_GOOGLE_CLOUD_VISION_API_KEY: \"${VITE_GOOGLE_CLOUD_VISION_API_KEY}\"," >> /usr/share/nginx/html/env-config.js

# Close the object
echo "}" >> /usr/share/nginx/html/env-config.js

# Make the file readable
chmod 644 /usr/share/nginx/html/env-config.js

# Debug output
echo "=== Environment Configuration ==="
echo "VITE_API_BASE_URL: ${VITE_API_BASE_URL}"
echo "VITE_API_URL: ${VITE_API_URL}"
echo "VITE_MEDIA_URL: ${VITE_MEDIA_URL}"
echo "==========================="