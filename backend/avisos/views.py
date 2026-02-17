from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Aviso, ComentarioAviso
from .serializers import AvisoSerializer, ComentarioAvisoSerializer
from users.models import Usuario
from notificacoes.services import criar_notificacao_em_massa
from notificacoes.constants import TipoNotificacao


class AvisoViewSet(viewsets.ModelViewSet):
    serializer_class = AvisoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.tipo_usuario == 'COORDENADOR':
            return Aviso.objects.all()
        # SQLite não suporta __contains em JSONField, filtrar em Python
        todos = list(Aviso.objects.all())
        ids = [a.id for a in todos if user.tipo_usuario in (a.destinatarios or [])]
        return Aviso.objects.filter(id__in=ids)

    def create(self, request, *args, **kwargs):
        if request.user.tipo_usuario != 'COORDENADOR':
            return Response(
                {'detail': 'Apenas coordenadores podem criar avisos.'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        aviso = serializer.save(criado_por=request.user)

        # Notificar usuários dos tipos destinatários
        destinatarios = aviso.destinatarios or []
        if destinatarios:
            usuarios_alvo = Usuario.objects.filter(
                tipo_usuario__in=destinatarios
            ).exclude(id=request.user.id)
            if usuarios_alvo.exists():
                criar_notificacao_em_massa(
                    usuarios=list(usuarios_alvo),
                    tipo=TipoNotificacao.MENSAGEM_SISTEMA,
                    titulo=f'Novo aviso: {aviso.titulo}',
                    mensagem=aviso.mensagem[:200],
                )

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        if request.user.tipo_usuario != 'COORDENADOR':
            return Response(
                {'detail': 'Apenas coordenadores podem editar avisos.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        if request.user.tipo_usuario != 'COORDENADOR':
            return Response(
                {'detail': 'Apenas coordenadores podem editar avisos.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.tipo_usuario != 'COORDENADOR':
            return Response(
                {'detail': 'Apenas coordenadores podem apagar avisos.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'], url_path='comentarios')
    def adicionar_comentario(self, request, pk=None):
        aviso = self.get_object()
        texto = request.data.get('texto', '').strip()
        if not texto:
            return Response(
                {'detail': 'O texto do comentário é obrigatório.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        comentario = ComentarioAviso.objects.create(
            aviso=aviso, autor=request.user, texto=texto
        )
        serializer = ComentarioAvisoSerializer(comentario)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path='comentarios/(?P<comentario_id>[0-9]+)')
    def apagar_comentario(self, request, pk=None, comentario_id=None):
        aviso = self.get_object()
        try:
            comentario = aviso.comentarios.get(id=comentario_id)
        except ComentarioAviso.DoesNotExist:
            return Response(
                {'detail': 'Comentário não encontrado.'},
                status=status.HTTP_404_NOT_FOUND
            )
        # Autor do comentário ou coordenador podem apagar
        if comentario.autor != request.user and request.user.tipo_usuario != 'COORDENADOR':
            return Response(
                {'detail': 'Sem permissão para apagar este comentário.'},
                status=status.HTTP_403_FORBIDDEN
            )
        comentario.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
