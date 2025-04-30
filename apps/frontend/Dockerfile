# 1. Build React frontend
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install necessary dependencies
RUN apk add --no-cache python3 make g++

# Copy only package.json and package-lock.json first (for cache optimization)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm install -D terser@latest

# Copy the rest of the project files
COPY . .

# Build the React project
RUN npm run build

# 2. Serve it with NGINX
FROM nginx:1.25-alpine

# Remove default Nginx configs
RUN rm -rf /etc/nginx/conf.d/*

# Copy built static files from builder stage
COPY --from=builder /app/dist/ /usr/share/nginx/html/


# Create a runtime environment config
RUN echo "window.ENV = {};" > /usr/share/nginx/html/env-config.js

# Copy nginx 
COPY nginx.conf /etc/nginx/templates/nginx.conf

# Copy envsubst script
COPY env.sh /docker-entrypoint.d/40-envsubst.sh

# Ensure the envsubst script is executable
RUN chmod +x /docker-entrypoint.d/40-envsubst.sh

# Expose port 80
EXPOSE 80

# Command inherited: nginx -g "daemon off;"
