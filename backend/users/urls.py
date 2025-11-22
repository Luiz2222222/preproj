from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegistroAlunoView,
    RegistroProfessorView,
    RegistroAvaliadorView,
    PerfilUsuarioView,
    AtualizarPreferenciasVisuaisView,
    CustomTokenObtainPairView,
    TokenRefreshView,  # ✅ Custom: lê refresh token dos cookies
    LogoutView,
    ListarProfessoresView,
    ProfessoresEstatisticasView,
    ChangePasswordView,
)
from definicoes.views import CodigoCadastroViewSet, CalendarioSemestreViewSet, DocumentoReferenciaViewSet

router = DefaultRouter()
router.register(r'codigos', CodigoCadastroViewSet, basename='codigos')
router.register(r'calendario', CalendarioSemestreViewSet, basename='calendario')
router.register(r'documentos-referencia', DocumentoReferenciaViewSet, basename='documentos-referencia')

urlpatterns = [
    # Autenticação JWT
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),

    # Perfil e preferencias
    path('auth/profile/', PerfilUsuarioView.as_view(), name='perfil_usuario'),
    path('auth/preferencias/', AtualizarPreferenciasVisuaisView.as_view(), name='atualizar_preferencias'),
    path('auth/alterar-senha/', ChangePasswordView.as_view(), name='alterar_senha'),

    # Cadastros
    path('auth/registro/aluno/', RegistroAlunoView.as_view(), name='registro_aluno'),
    path('auth/registro/professor/', RegistroProfessorView.as_view(), name='registro_professor'),
    path('auth/registro/avaliador/', RegistroAvaliadorView.as_view(), name='registro_avaliador'),

    # Listar professores
    path('professores/', ListarProfessoresView.as_view(), name='listar_professores'),
    path('professores/estatisticas/', ProfessoresEstatisticasView.as_view(), name='professores_estatisticas'),

    # Gerenciamento de códigos (coordenador)
    path('config/', include(router.urls)),
]
