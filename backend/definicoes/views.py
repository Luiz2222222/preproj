from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import CodigoCadastro, CalendarioSemestre, DocumentoReferencia, ConfiguracaoEmail
from .serializers import (
    CodigoCadastroSerializer,
    CalendarioSemestreSerializer,
    DocumentoReferenciaSerializer,
    ConfiguracaoEmailSerializer
)


class IsCoordenador(permissions.BasePermission):
    """Permissão para coordenadores apenas."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.tipo_usuario == 'COORDENADOR'


class IsCoordenadorOrReadOnly(permissions.BasePermission):
    """Permite leitura para todos autenticados, escrita só para coordenador."""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.tipo_usuario == 'COORDENADOR'


class CodigoCadastroViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciar códigos de cadastro (apenas coordenadores)."""

    queryset = CodigoCadastro.objects.all()
    serializer_class = CodigoCadastroSerializer
    permission_classes = [IsCoordenador]
    http_method_names = ['get', 'put', 'patch']

    def perform_update(self, serializer):
        """Registra quem atualizou o código."""
        serializer.save(atualizado_por=self.request.user)


class CalendarioSemestreViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciar calendário acadêmico."""

    queryset = CalendarioSemestre.objects.all().order_by('-atualizado_em')
    serializer_class = CalendarioSemestreSerializer
    permission_classes = [IsCoordenadorOrReadOnly]
    http_method_names = ['get', 'post', 'put', 'patch']

    def perform_create(self, serializer):
        """Registra quem criou o calendário."""
        serializer.save(atualizado_por=self.request.user)

    def perform_update(self, serializer):
        """Registra quem atualizou o calendário."""
        serializer.save(atualizado_por=self.request.user)

    @action(detail=False, methods=['get'], url_path='atual', permission_classes=[permissions.IsAuthenticated])
    def atual(self, request):
        """Retorna o calendário ativo atual."""
        calendario = CalendarioSemestre.obter_calendario_atual()
        if not calendario:
            return Response(
                {'detail': 'Nenhum calendário ativo encontrado.'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = self.get_serializer(calendario)
        return Response(serializer.data)


class DocumentoReferenciaViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciar documentos de referência."""

    queryset = DocumentoReferencia.objects.all()
    serializer_class = DocumentoReferenciaSerializer
    permission_classes = [IsCoordenadorOrReadOnly]
    parser_classes = [MultiPartParser, FormParser]
    http_method_names = ['get', 'post', 'put', 'patch', 'delete']

    def perform_create(self, serializer):
        """Registra quem criou o documento."""
        serializer.save(atualizado_por=self.request.user)

    def perform_update(self, serializer):
        """Registra quem atualizou o documento."""
        serializer.save(atualizado_por=self.request.user)


class ConfiguracaoEmailViewSet(viewsets.ViewSet):
    """
    ViewSet para gerenciar configurações de e-mail do sistema.
    Apenas coordenadores podem acessar.
    """

    permission_classes = [IsCoordenador]

    def list(self, request):
        """GET /api/configuracoes/email/ - Retorna configuração atual."""
        config = ConfiguracaoEmail.obter_configuracao()
        serializer = ConfiguracaoEmailSerializer(config, context={'request': request})
        return Response(serializer.data)

    def update(self, request, pk=None):
        """PUT /api/configuracoes/email/1/ - Atualiza configurações."""
        config = ConfiguracaoEmail.obter_configuracao()
        serializer = ConfiguracaoEmailSerializer(
            config,
            data=request.data,
            partial=True,
            context={'request': request}
        )

        if serializer.is_valid():
            serializer.save(atualizado_por=request.user)
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='senha-real')
    def senha_real(self, request):
        """GET /api/configuracoes/email/senha-real/ - Retorna a senha descriptografada."""
        config = ConfiguracaoEmail.obter_configuracao()
        return Response({'password': config.get_password()})
