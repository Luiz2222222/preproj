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
    ListarCoorientadoresView,
    ProfessoresEstatisticasView,
    AlunosEstatisticasView,
    ExternosEstatisticasView,
    ChangePasswordView,
    EditarUsuarioView,
    ResetarSenhaUsuarioView,
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

    # Listar alunos
    path('alunos/estatisticas/', AlunosEstatisticasView.as_view(), name='alunos_estatisticas'),

    # Listar membros externos
    path('externos/estatisticas/', ExternosEstatisticasView.as_view(), name='externos_estatisticas'),

    # Listar co-orientadores (professores + avaliadores externos)
    path('coorientadores/', ListarCoorientadoresView.as_view(), name='listar_coorientadores'),

    # Gerenciamento de usuarios pelo coordenador
    path('usuarios/<int:usuario_id>/', EditarUsuarioView.as_view(), name='editar_usuario'),
    path('usuarios/<int:usuario_id>/resetar-senha/', ResetarSenhaUsuarioView.as_view(), name='resetar_senha_usuario'),

    # Gerenciamento de códigos (coordenador)
    path('config/', include(router.urls)),
]
