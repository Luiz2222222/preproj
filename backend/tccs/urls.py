"""URLs do app tccs."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TCCViewSet,
    SolicitacaoOrientacaoViewSet,
    DocumentoTCCViewSet,
    EventoTimelineViewSet
)

# Criar router para ViewSets
router = DefaultRouter()
router.register(r'tccs', TCCViewSet, basename='tcc')
router.register(r'solicitacoes', SolicitacaoOrientacaoViewSet, basename='solicitacao')
router.register(r'documentos', DocumentoTCCViewSet, basename='documento')
router.register(r'timeline', EventoTimelineViewSet, basename='timeline')

urlpatterns = [
    path('', include(router.urls)),
]
