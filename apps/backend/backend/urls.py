from django.contrib import admin
from django.urls import path, include

from django.conf import settings
from django.conf.urls.static import static
from health_check import health_view

# from django.views.generic import TemplateView
print("Root URLs are being loaded.")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/products/", include("base.urls.product_urls")),
    path("api/users/", include("base.urls.user_urls")),
    path("api/orders/", include("base.urls.order_urls")),
    path("api/blog/", include("blog.urls")),
    path("api/chatbot/", include("chatbot.urls")),
    path("api/quotes/", include("base.urls.quote_urls")),
    path('health/', health_view, name='health'),
]

# Serve media files
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Serve static files in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
