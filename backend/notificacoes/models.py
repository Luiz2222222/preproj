from django.db import models
from users.models import Usuario
from tccs.models import TCC
from .constants import TipoNotificacao, PrioridadeNotificacao


class Notificacao(models.Model):
    """
    Modelo para notificações do sistema.
    Cada usuário recebe notificações sobre eventos relevantes.
    """
    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        related_name='notificacoes',
        verbose_name='Usuário'
    )
    tipo = models.CharField(
        max_length=50,
        choices=TipoNotificacao.CHOICES,
        verbose_name='Tipo de Notificação'
    )
    titulo = models.CharField(max_length=255, verbose_name='Título')
    mensagem = models.TextField(verbose_name='Mensagem')
    lida = models.BooleanField(default=False, verbose_name='Lida')
    action_url = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name='URL de Ação',
        help_text='URL para onde o usuário será direcionado ao clicar na notificação'
    )
    metadata = models.JSONField(
        blank=True,
        null=True,
        verbose_name='Metadados',
        help_text='Dados adicionais da notificação em formato JSON'
    )
    tcc = models.ForeignKey(
        TCC,
        on_delete=models.CASCADE,
        related_name='notificacoes',
        blank=True,
        null=True,
        verbose_name='TCC Relacionado'
    )
    prioridade = models.CharField(
        max_length=20,
        choices=PrioridadeNotificacao.CHOICES,
        default=PrioridadeNotificacao.NORMAL,
        verbose_name='Prioridade'
    )
    criado_em = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')
    lido_em = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='Lido em'
    )

    class Meta:
        verbose_name = 'Notificação'
        verbose_name_plural = 'Notificações'
        ordering = ['-criado_em']
        indexes = [
            models.Index(fields=['usuario', '-criado_em']),
            models.Index(fields=['usuario', 'lida']),
            models.Index(fields=['tcc']),
        ]

    def __str__(self):
        return f'{self.usuario.nome_completo} - {self.titulo} ({"Lida" if self.lida else "Não lida"})'

    def marcar_como_lida(self):
        """Marca a notificação como lida."""
        if not self.lida:
            from django.utils import timezone
            self.lida = True
            self.lido_em = timezone.now()
            self.save()


class PreferenciasEmail(models.Model):
    """
    Preferências de recebimento de e-mails por usuário.
    Cada usuário pode configurar quais tipos de notificações deseja receber por e-mail.
    """
    usuario = models.OneToOneField(
        Usuario,
        on_delete=models.CASCADE,
        related_name='preferencias_email',
        verbose_name='Usuário'
    )

    # ==================== PREFERÊNCIAS ALUNO ====================
    # Notificações relacionadas a solicitações de orientação
    aluno_aceitar_convite_orientador = models.BooleanField(
        default=True,
        verbose_name='Convite de orientação',
        help_text='Notificar quando solicitação de orientação for analisada'
    )
    # Notificações sobre documentos
    aluno_ajuste_monografia = models.BooleanField(
        default=True,
        verbose_name='Ajuste de monografia solicitado',
        help_text='Notificar quando orientador solicitar ajustes na monografia'
    )
    aluno_termo_disponivel = models.BooleanField(
        default=True,
        verbose_name='Termo de solicitação disponível',
        help_text='Notificar quando coordenador disponibilizar termo de solicitação'
    )
    # Notificações sobre continuidade
    aluno_continuidade_aprovada = models.BooleanField(
        default=True,
        verbose_name='Continuidade aprovada/rejeitada',
        help_text='Notificar sobre decisão de continuidade do orientador'
    )
    # Notificações sobre avaliações
    aluno_resultado_fase_1 = models.BooleanField(
        default=True,
        verbose_name='Resultado Fase I',
        help_text='Notificar quando resultado da Fase I estiver disponível'
    )
    # Notificações sobre defesa
    aluno_agendamento_defesa = models.BooleanField(
        default=True,
        verbose_name='Agendamento de defesa',
        help_text='Notificar quando defesa for agendada'
    )
    # Notificações sobre conclusão
    aluno_finalizacao_tcc = models.BooleanField(
        default=True,
        verbose_name='Finalização do TCC',
        help_text='Notificar quando TCC for finalizado'
    )

    # ==================== PREFERÊNCIAS PROFESSOR ====================
    # Notificações sobre orientação
    prof_convite_orientacao = models.BooleanField(
        default=True,
        verbose_name='Convite de orientação',
        help_text='Notificar quando orientação for aprovada'
    )
    # Notificações sobre documentos
    prof_receber_monografia = models.BooleanField(
        default=True,
        verbose_name='Receber monografia',
        help_text='Notificar quando orientando enviar monografia'
    )
    # Notificações sobre continuidade
    prof_continuidade_aprovada = models.BooleanField(
        default=True,
        verbose_name='Lembrete de aprovação de continuidade',
        help_text='Notificar 1 dia antes da confirmação de continuidade'
    )
    # Notificações sobre termos
    prof_lembrete_termo = models.BooleanField(
        default=True,
        verbose_name='Lembrete de envio de termo de solicitação de avaliação',
        help_text='Notificar 1 dia antes do prazo limite de envio do termo de solicitação de avaliação'
    )
    # Notificações sobre avaliações
    prof_resultado_fase_1 = models.BooleanField(
        default=True,
        verbose_name='Resultado Fase I',
        help_text='Notificar quando todas avaliações da Fase I forem concluídas'
    )
    # Notificações sobre conclusão
    prof_finalizacao_tcc = models.BooleanField(
        default=True,
        verbose_name='Finalização do TCC',
        help_text='Notificar quando TCC de orientando for finalizado'
    )
    # Notificações sobre bancas
    prof_participacao_banca = models.BooleanField(
        default=True,
        verbose_name='Participação em banca',
        help_text='Notificar quando for adicionado a uma banca'
    )

    # ==================== PREFERÊNCIAS AVALIADOR EXTERNO ====================
    # Notificações sobre co-orientação
    aval_convite_orientacao = models.BooleanField(
        default=True,
        verbose_name='Convite de co-orientação',
        help_text='Notificar quando co-orientação for aprovada'
    )
    # Notificações sobre documentos
    aval_receber_monografia = models.BooleanField(
        default=True,
        verbose_name='Receber monografia',
        help_text='Notificar quando orientando enviar monografia'
    )
    # Notificações sobre avaliações
    aval_resultado_fase_1 = models.BooleanField(
        default=True,
        verbose_name='Resultado Fase I',
        help_text='Notificar quando todas avaliações da Fase I forem concluídas'
    )
    # Notificações sobre conclusão
    aval_finalizacao_tcc = models.BooleanField(
        default=True,
        verbose_name='Finalização do TCC',
        help_text='Notificar quando TCC de co-orientando for finalizado'
    )
    # Notificações sobre bancas
    aval_participacao_banca = models.BooleanField(
        default=True,
        verbose_name='Participação em banca',
        help_text='Notificar quando for adicionado a uma banca'
    )

    # ==================== PREFERÊNCIAS COORDENADOR ====================
    # Notificações sobre solicitações
    coord_convite_aluno = models.BooleanField(
        default=True,
        verbose_name='Convite de aluno',
        help_text='Notificar quando aluno solicitar orientação'
    )
    # Notificações sobre documentos
    coord_monografia_aprovada = models.BooleanField(
        default=True,
        verbose_name='Monografia aprovada',
        help_text='Notificar quando orientador aprovar monografia'
    )
    coord_termo_enviado = models.BooleanField(
        default=True,
        verbose_name='Termo enviado',
        help_text='Notificar quando aluno enviar termo de solicitação'
    )
    # Notificações sobre continuidade
    coord_continuidade_aprovada = models.BooleanField(
        default=True,
        verbose_name='Continuidade aprovada',
        help_text='Notificar quando orientador aprovar/rejeitar continuidade'
    )
    # Notificações sobre avaliações
    coord_avaliacoes_fase1_completas = models.BooleanField(
        default=True,
        verbose_name='Avaliações Fase I completas',
        help_text='Notificar quando todas avaliações da Fase I forem enviadas'
    )
    coord_avaliacoes_fase2_completas = models.BooleanField(
        default=True,
        verbose_name='Avaliações Fase II completas',
        help_text='Notificar quando todas avaliações da Fase II forem enviadas'
    )
    # Notificações sobre defesa
    coord_defesa_agendada = models.BooleanField(
        default=True,
        verbose_name='Defesa agendada',
        help_text='Notificar quando defesa for agendada'
    )

    criado_em = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')
    atualizado_em = models.DateTimeField(auto_now=True, verbose_name='Atualizado em')

    class Meta:
        verbose_name = 'Preferência de E-mail'
        verbose_name_plural = 'Preferências de E-mail'

    def __str__(self):
        return f'Preferências de e-mail - {self.usuario.nome_completo}'
