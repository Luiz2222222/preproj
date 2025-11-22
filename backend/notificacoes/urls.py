from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotificacaoViewSet, PreferenciasEmailAPIView

router = DefaultRouter()
router.register(r'', NotificacaoViewSet, basename='notificacao')

urlpatterns = [
    path('', include(router.urls)),
    path('preferencias/email/', PreferenciasEmailAPIView.as_view(), name='preferencias-email'),
]
