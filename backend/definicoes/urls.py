"""URLs do app definicoes."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CodigoCadastroViewSet,
    CalendarioSemestreViewSet,
    DocumentoReferenciaViewSet,
    ConfiguracaoEmailViewSet
)

# Criar router para ViewSets
router = DefaultRouter()
router.register(r'codigos', CodigoCadastroViewSet, basename='codigo')
router.register(r'calendario', CalendarioSemestreViewSet, basename='calendario')
router.register(r'documentos-referencia', DocumentoReferenciaViewSet, basename='documento-referencia')

# Rota especial para configurações de e-mail (singleton)
urlpatterns = [
    path('', include(router.urls)),
    path('email/', ConfiguracaoEmailViewSet.as_view({
        'get': 'list',
        'put': 'update'
    }), name='configuracao-email'),
    path('email/senha-real/', ConfiguracaoEmailViewSet.as_view({
        'get': 'senha_real'
    }), name='configuracao-email-senha-real'),
]
