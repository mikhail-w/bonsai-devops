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