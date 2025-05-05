# 1. Build React frontend
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Update packages and install necessary dependencies with patched versions
RUN apk update && apk upgrade --no-cache && \
    apk add --no-cache python3 make g++ \
    curl>=8.9.0-r0 \
    libcurl>=8.9.0-r0 \
    libexpat>=2.6.3-r0 \
    libxml2>=2.11.8-r2 \
    libxslt>=1.1.39-r1 \
    xz-libs>=5.4.5-r1

# Copy only package.json and package-lock.json first (for cache optimization)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm install -D terser@latest

# Copy the rest of the project files
COPY . .

# Build the React project
RUN npm run build

# 2. Serve it with NGINX
FROM nginx:1.26-alpine

# Update packages and remove default Nginx configs
RUN apk update && apk upgrade --no-cache
RUN rm -rf /etc/nginx/conf.d/*

# Install patched versions of vulnerable packages
RUN apk add --no-cache \
    curl>=8.9.0-r0 \
    libcurl>=8.9.0-r0 \
    libexpat>=2.6.3-r0 \
    libxml2>=2.11.8-r2 \
    libxslt>=1.1.39-r1 \
    xz-libs>=5.4.5-r1

# Copy built static files from builder stage
COPY --from=builder /app/dist/ /usr/share/nginx/html/

# Create a runtime environment config
RUN echo "window.ENV = {};" > /usr/share/nginx/html/env-config.js

# Copy nginx configuration
COPY nginx.conf /etc/nginx/templates/nginx.conf

# Copy envsubst script
COPY env.sh /docker-entrypoint.d/40-envsubst.sh

# Ensure the envsubst script is executable
RUN chmod +x /docker-entrypoint.d/40-envsubst.sh

# Expose port 80
EXPOSE 80

# Command inherited: nginx -g "daemon off;"