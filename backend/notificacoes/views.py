from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Notificacao, PreferenciasEmail
from .serializers import NotificacaoSerializer, PreferenciasEmailSerializer


class NotificacaoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para listar e gerenciar notificações do usuário autenticado.
    """
    serializer_class = NotificacaoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Retorna apenas notificações do usuário autenticado."""
        return Notificacao.objects.filter(
            usuario=self.request.user
        ).select_related('tcc', 'usuario').order_by('-criado_em')

    @action(detail=False, methods=['get'])
    def nao_lidas(self, request):
        """Retorna apenas notificações não lidas."""
        notificacoes = self.get_queryset().filter(lida=False)
        serializer = self.get_serializer(notificacoes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def count_nao_lidas(self, request):
        """Retorna a contagem de notificações não lidas."""
        count = self.get_queryset().filter(lida=False).count()
        return Response({'count': count})

    @action(detail=True, methods=['post'])
    def marcar_como_lida(self, request, pk=None):
        """Marca uma notificação como lida."""
        notificacao = self.get_object()
        notificacao.lida = True
        notificacao.lido_em = timezone.now()
        notificacao.save()
        serializer = self.get_serializer(notificacao)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def marcar_todas_como_lidas(self, request):
        """Marca todas as notificações do usuário como lidas."""
        notificacoes = self.get_queryset().filter(lida=False)
        count = notificacoes.update(lida=True, lido_em=timezone.now())
        return Response({
            'message': f'{count} notificações marcadas como lidas',
            'count': count
        })

    @action(detail=True, methods=['delete'])
    def deletar(self, request, pk=None):
        """Deleta uma notificação específica."""
        notificacao = self.get_object()
        notificacao.delete()
        return Response(
            {'message': 'Notificação deletada com sucesso'},
            status=status.HTTP_204_NO_CONTENT
        )

    @action(detail=False, methods=['delete'])
    def deletar_lidas(self, request):
        """Deleta todas as notificações lidas do usuário."""
        notificacoes = self.get_queryset().filter(lida=True)
        count = notificacoes.count()
        notificacoes.delete()
        return Response({
            'message': f'{count} notificações deletadas',
            'count': count
        })


class PreferenciasEmailAPIView(generics.RetrieveUpdateAPIView):
    """
    View para visualizar e atualizar preferências de e-mail do usuário autenticado.
    GET /api/preferencias/email/ - Retorna as preferências do usuário
    PUT/PATCH /api/preferencias/email/ - Atualiza as preferências
    """
    serializer_class = PreferenciasEmailSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        """
        Retorna ou cria as preferências de e-mail do usuário autenticado.
        Se o usuário não tiver preferências, cria com valores padrão (todos True).
        """
        preferencias, created = PreferenciasEmail.objects.get_or_create(
            usuario=self.request.user
        )
        return preferencias
