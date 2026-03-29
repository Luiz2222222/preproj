"""
URL configuration for portal_tcc project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('users.urls')),
    path('api/', include('tccs.urls')),
    path('api/notificacoes/', include('notificacoes.urls')),
    path('api/config/', include('definicoes.urls')),
    path('api/avisos/', include('avisos.urls')),
]

# Servir arquivos de mídia (em produção o Nginx faz proxy para cá)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
