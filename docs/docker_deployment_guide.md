# 🌿 Bonsai App - Complete Docker Deployment Guide

Welcome to the comprehensive guide for setting up and running the Bonsai application using Docker! This guide reflects the current state of the project and will walk you through setting up both the **backend (Django)** and **frontend (React/Vite)** components, connecting them with **Docker Compose**, and managing environment variables.

## 📋 Table of Contents

- [🛠️ Prerequisites](#️-prerequisites)
- [📁 Project Structure](#-project-structure)
- [🔐 Environment Setup](#-environment-setup)
- [📦 Backend Setup](#-backend-setup)
  - [Backend Dockerfile](#backend-dockerfile)
  - [Backend Entrypoint Script](#backend-entrypoint-script)
- [🌿 Frontend Setup](#-frontend-setup)
  - [Frontend Dockerfile](#frontend-dockerfile)
  - [Frontend Nginx Configuration](#frontend-nginx-configuration)
  - [Frontend Environment Script](#frontend-environment-script)
- [🔗 Docker Compose Configuration](#-docker-compose-configuration)
  - [Running with Docker Compose](#running-with-docker-compose)
  - [Managing Docker Services](#managing-docker-services)
  - [Important Notes](#important-notes)
- [🌐 Application Access](#-application-access)
  - [Frontend Application](#frontend-application)
  - [Backend Services](#backend-services)
  - [Health Checks](#health-checks)
- [🛠️ Docker Command Reference for Bonsai Project](#️-docker-command-reference-for-bonsai-project)
  - [🭹 Clean Up Docker Resources](#-clean-up-docker-resources)
  - [🚀 Build, Start, and Manage Services (Compose)](#-build-start-and-manage-services-compose)
  - [🔄 Restart and Scale Services](#-restart-and-scale-services)
  - [📜 Viewing Logs](#-viewing-logs)
  - [🛠 Executing Commands Inside Containers](#-executing-commands-inside-containers)
  - [📦 Working with Containers](#-working-with-containers)
  - [🛠️ Copy Files Between Host and Containers](#️-copy-files-between-host-and-containers)
  - [🔍 Inspect Running Containers](#-inspect-running-containers)
  - [📋 Listing Docker Resources](#-listing-docker-resources)



## 🛠️ Prerequisites

Ensure you have the following installed:

- Docker (v20.10+)
- Docker Compose (v2.0+)
- Git
- Node.js (for local development)
- Python (for local development)

## 📁 Project Structure

```
bonsai/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── apps/
│   ├── backend/
│   │   ├── Dockerfile
│   │   ├── .dockerignore
│   │   ├── entrypoint.sh
│   │   ├── requirements.txt
│   │   ├── manage.py
│   │   ├── media/
│   │   ├── staticfiles/
│   │   └── ...
│   └── frontend/
│       ├── Dockerfile
│       ├── .dockerignore
│       ├── nginx.conf
│       ├── env.sh
│       ├── package.json
│       ├── vite.config.js
│       └── ...
├── docker-compose.yml
├── .env
├── .env.example
└── README.md
```

## 🔐 Environment Setup

Create a `.env` file in the project root with the following structure:

```bash
# ===== DATABASE CONFIGURATION =====
DB_NAME=bonsai_store
DB_USER=postgres
DB_PASSWORD=your_db_password_here
DB_HOST=db
DB_PORT=5432

# ===== BACKEND CONFIGURATION =====
# Django settings
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1,backend
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://frontend
LOAD_INITIAL_DATA=True

# Admin credentials
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_EMAIL=admin@example.com
DJANGO_SUPERUSER_PASSWORD=your_admin_password_here

# ===== API CONFIGURATION =====
API_BASE_URL=http://localhost:8000
VITE_API_BASE_URL=http://localhost:8000
VITE_API_URL=${VITE_API_BASE_URL}/api
VITE_MEDIA_URL=${VITE_API_BASE_URL}/media
VITE_STATIC_URL=${VITE_API_BASE_URL}/static

# ===== FRONTEND CONFIGURATION =====
# Third-party API keys
VITE_WEATHER_API_KEY=your_weather_api_key_here
VITE_PAYPAL_CLIENT_ID=your_paypal_client_id_here
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
VITE_GOOGLE_CLOUD_VISION_API_KEY=your_vision_api_key_here

# Feature flags
VITE_ENABLE_CHAT=true
VITE_ENABLE_REVIEWS=true
VITE_ENABLE_BLOG=true


```

## 📦 Backend Setup

### Backend Dockerfile

Create `apps/backend/Dockerfile`:

```dockerfile
# Build stage
FROM python:3.11-alpine AS builder

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    gcc \
    musl-dev \
    postgresql-dev \
    postgresql-client \
    curl \
    libffi-dev \
    bash \
    netcat-openbsd

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy project
COPY . /app/

# Create media and static directories
RUN mkdir -p /app/media /app/staticfiles

# Create non-root user
RUN adduser -D -H -u 1000 appuser && \
    chown -R appuser:appuser /app

# Copy and set up entrypoint script
RUN chmod +x /app/entrypoint.sh && \
    sed -i 's/\r$//' /app/entrypoint.sh

# Switch to non-root user
USER appuser

# Run entrypoint script
ENTRYPOINT ["/app/entrypoint.sh"]

# Default command
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
```

### Backend Entrypoint Script

Create `apps/backend/entrypoint.sh`:

```bash
#!/bin/bash

# Function to check if postgres is up and ready
function postgres_ready(){
python << END
import sys
import psycopg2
try:
    conn = psycopg2.connect(
        dbname="${DB_NAME}",
        user="${DB_USER}",
        password="${DB_PASSWORD}",
        host="${DB_HOST}",
        port="${DB_PORT}"
    )
except psycopg2.OperationalError:
    sys.exit(-1)
sys.exit(0)
END
}

echo "Waiting for PostgreSQL to be ready..."
# Wait for postgres to be ready
until postgres_ready; do
  sleep 2
done
echo "PostgreSQL is ready!"

# Apply database migrations
echo "Applying database migrations..."
python manage.py migrate

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Load initial data if needed - LOAD FIXTURES FIRST BEFORE CREATING SUPERUSER
if [ "${LOAD_INITIAL_DATA}" = "True" ]; then
    echo "Loading initial data..."
    if [ -f "fixtures/users.json" ]; then python manage.py loaddata fixtures/users.json; fi
    if [ -f "fixtures/products.json" ]; then python manage.py loaddata fixtures/products.json; fi
    if [ -f "fixtures/reviews.json" ]; then python manage.py loaddata fixtures/reviews.json; fi
    if [ -f "fixtures/posts.json" ]; then python manage.py loaddata fixtures/posts.json; fi
    if [ -f "fixtures/comments.json" ]; then python manage.py loaddata fixtures/comments.json; fi
fi

# Set admin password correctly - AFTER fixtures are loaded
if [ -n "${DJANGO_SUPERUSER_USERNAME}" ] && [ -n "${DJANGO_SUPERUSER_PASSWORD}" ]; then
    echo "Setting up admin user..."

    python manage.py shell << END
from django.contrib.auth import get_user_model
User = get_user_model()

try:
    # Look for admin user - could be from fixtures or created previously
    admin = User.objects.filter(username='admin').first()

    if admin:
        # Update admin credentials
        admin.set_password('${DJANGO_SUPERUSER_PASSWORD}')
        admin.is_superuser = True
        admin.is_staff = True
        admin.is_active = True
        admin.save()
        print('Admin password updated successfully')
    else:
        # Create a new admin if one doesn't exist
        User.objects.create_superuser(
            username='admin',
            email='admin@mail.com',
            password='${DJANGO_SUPERUSER_PASSWORD}'
        )
        print('New admin user created successfully')
except Exception as e:
    print(f'Error setting up admin: {str(e)}')
END
fi

# Create health check module and view
mkdir -p health_check
echo "from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def health_view(request):
    return HttpResponse('OK', status=200)" > health_check/__init__.py

# Add health check URL pattern to urls.py if it doesn't exist
if ! grep -q "health_check" "backend/urls.py"; then
    # Create a backup of the original file
    cp backend/urls.py backend/urls.py.bak

    # Add import for health_check
    sed -i "s/from django.conf.urls.static import static/from django.conf.urls.static import static\nfrom health_check import health_view/" backend/urls.py

    # Add health check URL pattern
    sed -i "s/\]$/    path('health\/', health_view, name='health'),\n]/" backend/urls.py

    echo "Added health check endpoint to urls.py"
fi

# Execute the command passed to the entrypoint
exec "$@"
```

## 🌿 Frontend Setup

### Frontend Dockerfile

Create `apps/frontend/Dockerfile`:

```dockerfile
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


# Copy nginx
COPY nginx.conf /etc/nginx/templates/nginx.conf

# Copy envsubst script
COPY env.sh /docker-entrypoint.d/40-envsubst.sh

# Ensure the envsubst script is executable
RUN chmod +x /docker-entrypoint.d/40-envsubst.sh

# Expose port 80
EXPOSE 80

# Command inherited: nginx -g "daemon off;"

```

### Frontend Nginx Configuration

Create `apps/frontend/nginx.conf`:

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # Handle React routing and root requests
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;

        # Additional CORS headers
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
        add_header Access-Control-Allow-Headers 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
    }

    # Proxy API requests to the backend
    location /api/ {
        # Use the service name from docker-compose
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 90s;
        proxy_connect_timeout 90s;

        # Add CORS headers
        add_header Access-Control-Allow-Origin '*' always;
        add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS, PUT, DELETE, PATCH' always;
        add_header Access-Control-Allow-Headers 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
        add_header Access-Control-Expose-Headers 'Content-Length,Content-Range' always;

        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin '*';
            add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS, PUT, DELETE, PATCH';
            add_header Access-Control-Allow-Headers 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type 'text/plain charset=UTF-8';
            add_header Content-Length 0;
            return 204;
        }
    }

    # Proxy media files to backend
    location /media/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 90s;
    }

    # Cache static assets
    location /static/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 'healthy\n';
    }

    # Handle static image files
    location ~* \.(jpg|jpeg|png|gif|ico)$ {
        root /usr/share/nginx/html;
        try_files $uri $uri/ =404;
        add_header Access-Control-Allow-Origin *;
        add_header Cache-Control "public, max-age=86400";
        expires 1d;
    }
}
```

### Frontend Environment Script

Create `apps/frontend/env.sh`:

```bash
#!/bin/sh

# Dynamically set backend routing defaults if not provided
export BACKEND_SERVICE_HOST=${BACKEND_SERVICE_HOST:-bonsai-backend}
export BACKEND_SERVICE_PORT=${BACKEND_SERVICE_PORT:-8000}

echo "Injecting environment variables into nginx.conf..."
envsubst '${BACKEND_SERVICE_HOST} ${BACKEND_SERVICE_PORT}' < /etc/nginx/templates/nginx.conf > /etc/nginx/conf.d/default.conf

echo "NGINX config ready with backend host: ${BACKEND_SERVICE_HOST}:${BACKEND_SERVICE_PORT}"
```

## 🔗 Docker Compose Configuration

Create `docker-compose.yml` in the project root:

```yaml
services:
  backend:
    build:
      context: ./apps/backend
      dockerfile: Dockerfile
    env_file:
      - ./.env
    environment:
      - ENVIRONMENT=${ENVIRONMENT}
      - DOMAIN_NAME=${DOMAIN_NAME}
      - DB_NAME=${DB_NAME}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_HOST=${DB_HOST}
      - DB_PORT=${DB_PORT}
      - AWS_RDS_HOST=${AWS_RDS_HOST}
      - AWS_RDS_PORT=${AWS_RDS_PORT}
      - AWS_RDS_DB_NAME=${AWS_RDS_DB_NAME}
      - AWS_RDS_USER=${AWS_RDS_USER}
      - AWS_RDS_PASSWORD=${AWS_RDS_PASSWORD}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - AWS_STORAGE_BUCKET_NAME=${AWS_STORAGE_BUCKET_NAME}
      - AWS_S3_REGION_NAME=${AWS_S3_REGION_NAME}
      - AWS_S3_CUSTOM_DOMAIN=${AWS_S3_CUSTOM_DOMAIN}
      - DJANGO_SUPERUSER_USERNAME=${DJANGO_SUPERUSER_USERNAME}
      - DJANGO_SUPERUSER_EMAIL=${DJANGO_SUPERUSER_EMAIL}
      - DJANGO_SUPERUSER_PASSWORD=${DJANGO_SUPERUSER_PASSWORD}
      - DJANGO_DEBUG=${DEBUG}
      - DJANGO_ALLOWED_HOSTS=${ALLOWED_HOSTS}
      - LOAD_INITIAL_DATA=True
      - API_BASE_URL=${API_BASE_URL}
    volumes:
      - ./apps/backend:/app
      - ./apps/backend/media:/app/media
      - static_volume:/app/staticfiles
    ports:
      - '8000:8000'
    depends_on:
      db:
        condition: service_healthy
    networks:
      - app-network
    dns:
      - 8.8.8.8
      - 8.8.4.4
      - 1.1.1.1
    extra_hosts:
      - 'host.docker.internal:host-gateway'
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:8000/health/']
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  frontend:
    build:
      context: ./apps/frontend
      dockerfile: Dockerfile
    env_file: .env
    environment:
      - ENVIRONMENT=${ENVIRONMENT}
      - DOMAIN_NAME=${DOMAIN_NAME}
      - VITE_API_BASE_URL=${VITE_API_BASE_URL}
      - VITE_API_URL=${VITE_API_URL}
      - VITE_MEDIA_URL=${VITE_MEDIA_URL}
      - VITE_STATIC_URL=${VITE_STATIC_URL}
      - VITE_WEATHER_API_KEY=${VITE_WEATHER_API_KEY}
      - VITE_PAYPAL_CLIENT_ID=${VITE_PAYPAL_CLIENT_ID}
      - VITE_GOOGLE_MAPS_API_KEY=${VITE_GOOGLE_MAPS_API_KEY}
      - VITE_GOOGLE_CLOUD_VISION_API_KEY=${VITE_GOOGLE_CLOUD_VISION_API_KEY}
      # Fixed backend service hostname
      - BACKEND_SERVICE_HOST=backend
    ports:
      - '3000:80'
    depends_on:
      - backend
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost/health']
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 20s

  db:
    image: postgres:13-alpine
    env_file: .env
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - '5432:5432'
    networks:
      - app-network
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${DB_USER}']
      interval: 10s
      timeout: 5s
      retries: 5

networks:
  app-network:
    driver: bridge

volumes:
  postgres_data:
  media_volume:
  static_volume:
```

### Running with Docker Compose

1. Build and start all services:

```bash
docker-compose up --build
```

2. To run in detached mode (in the background):

```bash
docker-compose up -d --build
```

3. The application will be available at:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Admin Interface: http://localhost:8000/admin
- Database: localhost:5432

### Managing Docker Services

1. Stop all services:

```bash
docker-compose down
```

2. Stop services and remove volumes (including database data):

```bash
docker-compose down -v
```

3. Remove all Docker images:

```bash
# Remove all images used by the services
docker-compose down --rmi all

# Remove all images (including unused ones)
docker image prune -a
```

4. View logs:

```bash
# View logs for all services
docker-compose logs

# View logs for specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db
```

5. Rebuild a specific service:

```bash
docker-compose up --build backend
```

### Important Notes

1. The `.env` file is required for all services to function properly. Make sure
   all environment variables are set correctly.

2. The backend service depends on the database being healthy before starting.
   This is handled automatically by Docker Compose.

3. Static and media files are persisted in Docker volumes. If you need to reset
   these, use:

```bash
docker-compose down -v
```

4. For development, changes to the code will be reflected automatically due to
   volume mounts.

5. The database data persists between restarts unless you explicitly remove the
   volume.

## 🌐 Application Access

After starting the containers, you can access the application through the
following endpoints:

### Frontend Application

- Main Application: http://localhost:3000

### Backend Services

- Admin Console: http://localhost:8000/admin
  - Default admin credentials (if using example .env):
    - Username: admin
    - Email: admin@example.com
    - Password: your_admin_password_here
- API Root: http://localhost:8000/api

### Health Checks

The application includes health check endpoints for all services:

- Frontend: http://localhost:3000/health
- Backend: http://localhost:8000/health/
- Database: Automatically checked via Docker health checks

You can monitor the health status using:

```bash
docker-compose ps
```

# 🛠️ Docker Command Reference for Bonsai Project

---

## 🭹 Clean Up Docker Resources

| Command                                                                                                                                         | Meaning                                                                   |
| :---------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------ |
| `docker container prune`                                                                                                                        | Remove all stopped containers                                             |
| `docker image prune -a`                                                                                                                         | Remove all unused images                                                  |
| `docker volume prune`                                                                                                                           | Remove all unused volumes                                                 |
| `docker network prune`                                                                                                                          | Remove all unused networks                                                |
| `docker system prune`                                                                                                                           | Remove unused containers, images, volumes, and networks                   |
| `docker system prune -a`                                                                                                                        | Remove **all** unused containers and images (including non-dangling ones) |
| `docker stop $(docker ps -aq) && docker rm $(docker ps -aq) && docker rmi -f $(docker images -q) && docker volume rm -f $(docker volume ls -q)` | Force stop/remove all containers, images, volumes                         |

---

## 🚀 Build, Start, and Manage Services (Compose)

| Command                                            | Meaning                              |
| :------------------------------------------------- | :----------------------------------- |
| `docker-compose up --build`                        | Build and start all services         |
| `docker-compose up -d`                             | Start all services in detached mode  |
| `docker-compose down`                              | Stop all services                    |
| `docker-compose down -v`                           | Stop all services and remove volumes |
| `docker-compose down && docker-compose up --build` | Rebuild and restart all services     |

---

## 🔄 Restart and Scale Services

| Command                                   | Meaning                                |
| :---------------------------------------- | :------------------------------------- |
| `docker-compose restart backend`          | Restart backend service                |
| `docker-compose restart frontend`         | Restart frontend service               |
| `docker-compose up -d --build backend`    | Rebuild and start backend service      |
| `docker-compose up -d --build frontend`   | Rebuild and start frontend service     |
| `docker-compose up -d --scale backend=2`  | Scale backend service to 2 containers  |
| `docker-compose up -d --scale frontend=3` | Scale frontend service to 3 containers |

---

## 📜 Viewing Logs

| Command                                       | Meaning                         |
| :-------------------------------------------- | :------------------------------ |
| `docker-compose logs -f`                      | View logs for all services      |
| `docker-compose logs -f backend`              | View backend service logs       |
| `docker-compose logs -f frontend`             | View frontend service logs      |
| `docker-compose logs -f --timestamps`         | View logs with timestamps       |
| `docker-compose logs -f --since "2024-01-01"` | View logs since a specific time |
| `docker-compose logs -f --tail=100`           | Show last 100 log lines         |

---

## 🛠 Executing Commands Inside Containers

| Command                                                        | Meaning                              |
| :------------------------------------------------------------- | :----------------------------------- |
| `docker-compose exec backend python manage.py migrate`         | Apply database migrations            |
| `docker-compose exec backend python manage.py createsuperuser` | Create Django admin user             |
| `docker-compose exec db psql -U postgres -d bonsai_store`      | Connect to Postgres database         |
| `docker-compose exec backend sh`                               | Open shell inside backend container  |
| `docker-compose exec frontend sh`                              | Open shell inside frontend container |
| `docker-compose exec db psql -U postgres`                      | Open psql shell inside db container  |

---

## 📦 Working with Containers

| Command                         | Meaning                               |
| :------------------------------ | :------------------------------------ |
| `docker-compose ps`             | Check container status                |
| `docker stats`                  | View container resource usage         |
| `docker inspect <container_id>` | Detailed container info               |
| `docker stats <container_id>`   | Resource usage for specific container |

---

## 🛠️ Copy Files Between Host and Containers

| Command                                                 | Meaning                     |
| :------------------------------------------------------ | :-------------------------- |
| `docker cp <container_id>:<container_path> <host_path>` | Copy from container to host |
| `docker cp <host_path> <container_id>:<container_path>` | Copy from host to container |

---

## 🔍 Inspect Running Containers

| Command                                | Meaning                    |
| :------------------------------------- | :------------------------- |
| `docker-compose exec backend env`      | View environment variables |
| `docker-compose exec frontend env`     | View environment variables |
| `docker-compose exec backend ps aux`   | View running processes     |
| `docker-compose exec frontend ps aux`  | View running processes     |
| `docker-compose exec backend ip addr`  | View network configuration |
| `docker-compose exec frontend ip addr` | View network configuration |
| `docker-compose exec backend df -h`    | View disk usage            |
| `docker-compose exec frontend df -h`   | View disk usage            |

---

## 📋 Listing Docker Resources

| Command                                                      | Meaning                                       |
| :----------------------------------------------------------- | :-------------------------------------------- |
| `docker images`                                              | List all images                               |
| `docker images -a`                                           | List all images including intermediate layers |
| `docker images --no-trunc`                                   | Show full image IDs                           |
| `docker images --format "{{.ID}}: {{.Repository}}:{{.Tag}}"` | Custom format listing                         |
| `docker images --filter "dangling=true"`                     | Show dangling images                          |
| `docker ps`                                                  | List running containers                       |
| `docker ps -a`                                               | List all containers including stopped ones    |
| `docker ps -q`                                               | List container IDs only                       |
| `docker ps --format "{{.ID}}: {{.Names}} - {{.Status}}"`     | Custom format container listing               |
| `docker ps --filter "status=running"`                        | Filter running containers                     |
| `docker ps --filter "name=backend"`                          | Filter by name backend                        |
| `docker ps --filter "ancestor=python:3.11-alpine"`           | Filter by base image                          |
| `docker volume ls`                                           | List all volumes                              |
| `docker volume ls --filter "dangling=true"`                  | List unused volumes                           |
| `docker network ls`                                          | List networks                                 |
| `docker network inspect app-network`                         | Inspect network details                       |
