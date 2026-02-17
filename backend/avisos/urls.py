from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AvisoViewSet

router = DefaultRouter()
router.register(r'', AvisoViewSet, basename='aviso')

urlpatterns = [
    path('', include(router.urls)),
]
