import os
import uuid
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from .constants import (
    EtapaTCC,
    StatusSolicitacao,
    TipoDocumento,
    StatusDocumento,
    TipoEvento,
    Visibilidade
)


def upload_documento_path(instance, filename):
    """Gera caminho único para upload de documentos."""
    ext = filename.split('.')[-1]
    nome_arquivo = f'{uuid.uuid4()}.{ext}'
    return os.path.join('tccs', str(instance.tcc.id), 'documentos', nome_arquivo)


def validar_tamanho_arquivo(arquivo):
    """Valida que arquivo não exceda 10MB."""
    limite_mb = 10
    if arquivo.size > limite_mb * 1024 * 1024:
        raise ValidationError(f'Arquivo não pode exceder {limite_mb}MB')


def validar_extensao_documento(arquivo):
    """
    Valida extensão do arquivo baseado no tipo de documento.
    Nota: Esta validação é complementar. A validação principal
    está no serializer que tem acesso ao tipo_documento.
    """
    # Aceitar PDF, DOC e DOCX
    # A validação específica por tipo está no serializer
    extensoes_validas = ['pdf', 'doc', 'docx']
    ext = arquivo.name.split('.')[-1].lower()
    if ext not in extensoes_validas:
        raise ValidationError(
            f'Extensão de arquivo "{ext}" não é permitida. '
            f'As extensões válidas são: {", ".join(extensoes_validas)}.'
        )


class TCC(models.Model):
    """Modelo principal do TCC."""

    aluno = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tccs_como_aluno',
        limit_choices_to={'tipo_usuario': 'ALUNO'},
        verbose_name='Aluno'
    )
    orientador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tccs_como_orientador',
        limit_choices_to={'tipo_usuario__in': ['PROFESSOR', 'COORDENADOR']},
        verbose_name='Orientador'
    )
    coorientador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tccs_como_coorientador',
        limit_choices_to={'tipo_usuario__in': ['PROFESSOR', 'COORDENADOR', 'AVALIADOR']},
        verbose_name='Coorientador'
    )

    titulo = models.CharField('Título', max_length=500)
    resumo = models.TextField('Resumo', blank=True, null=True)

    etapa_atual = models.CharField(
        'Etapa Atual',
        max_length=50,
        choices=EtapaTCC.CHOICES,
        default=EtapaTCC.INICIALIZACAO
    )

    semestre = models.CharField('Semestre', max_length=20, help_text='Ex: 2025.1')

    # Flags de controle
    flag_continuidade = models.BooleanField(
        'Flag de Continuidade',
        default=False,
        help_text='Orientador aprovou continuidade'
    )
    flag_liberado_avaliacao = models.BooleanField(
        'Flag Liberado para Avaliação',
        default=False,
        help_text='Orientador liberou para formar banca'
    )
    avaliacao_fase1_bloqueada = models.BooleanField(
        'Avaliação Fase 1 Bloqueada',
        default=False,
        help_text='Coordenador bloqueou edições para análise'
    )
    avaliacao_fase2_bloqueada = models.BooleanField(
        'Avaliação Fase 2 Bloqueada',
        default=False,
        help_text='Coordenador bloqueou edições para análise'
    )

    # Liberações manuais por fase (coordenador pode desbloquear prazos)
    liberar_envio_documentos = models.BooleanField(
        'Liberar envio de documentos iniciais',
        default=False,
        help_text='Quando True, ignora o prazo do calendário para documentos iniciais'
    )
    liberar_desenvolvimento = models.BooleanField(
        'Liberar fase de desenvolvimento',
        default=False,
        help_text='Libera envio e avaliação de monografia fora do prazo'
    )
    liberar_continuidade = models.BooleanField(
        'Liberar confirmação de continuidade',
        default=False,
        help_text='Permite confirmar continuidade fora do prazo'
    )
    liberar_fase1 = models.BooleanField(
        'Liberar Avaliação Fase I',
        default=False,
        help_text='Permite ações da Fase I fora do prazo'
    )
    liberar_defesas = models.BooleanField(
        'Liberar Período de Defesas',
        default=False,
        help_text='Permite registrar defesas fora do prazo'
    )
    liberar_fase2 = models.BooleanField(
        'Liberar Avaliação Fase II',
        default=False,
        help_text='Permite ações da Fase II fora do prazo'
    )
    liberar_ajustes_finais = models.BooleanField(
        'Liberar Ajustes Finais',
        default=False,
        help_text='Permite enviar ajustes fora do prazo'
    )

    # Auditoria de liberações
    liberacoes_atualizadas_em = models.DateTimeField(
        'Liberações atualizadas em',
        null=True,
        blank=True,
        help_text='Data da última alteração manual de prazos'
    )
    liberacoes_atualizadas_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='liberacoes_tcc_atualizadas',
        verbose_name='Liberações atualizadas por',
        help_text='Coordenador que alterou as liberações'
    )

    # Dados do coorientador externo (quando não é usuário do sistema)
    coorientador_nome = models.CharField('Nome do Coorientador', max_length=200, blank=True, null=True)
    coorientador_titulacao = models.CharField('Titulação do Coorientador', max_length=100, blank=True, null=True)
    coorientador_afiliacao = models.CharField('Afiliação do Coorientador', max_length=200, blank=True, null=True)
    coorientador_lattes = models.URLField('Lattes do Coorientador', blank=True, null=True)

    # Notas finais e resultado
    nf1 = models.DecimalField(
        'Nota Final Fase I',
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Média das avaliações da monografia (Fase I)'
    )
    nf2 = models.DecimalField(
        'Nota Final Fase II',
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Média das avaliações da apresentação (Fase II)'
    )
    media_final = models.DecimalField(
        'Média Final (MF)',
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='MF = (NF1 + NF2) / 2'
    )

    RESULTADO_CHOICES = [
        ('APROVADO', 'Aprovado'),
        ('REPROVADO', 'Reprovado'),
    ]
    resultado_final = models.CharField(
        'Resultado Final',
        max_length=20,
        choices=RESULTADO_CHOICES,
        null=True,
        blank=True,
        help_text='APROVADO se MF >= 6.0, REPROVADO caso contrário'
    )

    # Timestamps
    criado_em = models.DateTimeField('Criado em', auto_now_add=True)
    atualizado_em = models.DateTimeField('Atualizado em', auto_now=True)

    class Meta:
        verbose_name = 'TCC'
        verbose_name_plural = 'TCCs'
        ordering = ['-criado_em']
        unique_together = [['aluno', 'semestre']]

    def __str__(self):
        return f'{self.titulo} - {self.aluno.nome_completo}'

    def clean(self):
        """Validações do modelo."""
        # Validar que aluno é realmente ALUNO
        if self.aluno and self.aluno.tipo_usuario != 'ALUNO':
            raise ValidationError({'aluno': 'Usuário deve ser do tipo ALUNO'})

        # Validar que orientador é PROFESSOR ou COORDENADOR
        if self.orientador and self.orientador.tipo_usuario not in ['PROFESSOR', 'COORDENADOR']:
            raise ValidationError({'orientador': 'Orientador deve ser PROFESSOR ou COORDENADOR'})

        # Validar que coorientador é PROFESSOR, COORDENADOR ou AVALIADOR
        if self.coorientador and self.coorientador.tipo_usuario not in ['PROFESSOR', 'COORDENADOR', 'AVALIADOR']:
            raise ValidationError({'coorientador': 'Coorientador deve ser PROFESSOR, COORDENADOR ou AVALIADOR'})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class SolicitacaoOrientacao(models.Model):
    """Solicitação de orientação enviada pelo aluno ao professor."""

    tcc = models.ForeignKey(
        TCC,
        on_delete=models.CASCADE,
        related_name='solicitacoes',
        verbose_name='TCC'
    )
    professor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='solicitacoes_recebidas',
        limit_choices_to={'tipo_usuario__in': ['PROFESSOR', 'COORDENADOR']},
        verbose_name='Professor'
    )

    mensagem = models.TextField('Mensagem do Aluno', blank=True, null=True)
    status = models.CharField(
        'Status',
        max_length=20,
        choices=StatusSolicitacao.CHOICES,
        default=StatusSolicitacao.PENDENTE
    )
    resposta_professor = models.TextField('Resposta do Professor', blank=True, null=True)

    # Dados do coorientador informados na solicitação (opcional)
    coorientador_nome = models.CharField('Nome do Coorientador', max_length=200, blank=True, null=True)
    coorientador_titulacao = models.CharField('Titulação', max_length=100, blank=True, null=True)
    coorientador_afiliacao = models.CharField('Afiliação', max_length=200, blank=True, null=True)
    coorientador_lattes = models.URLField('Link Lattes', blank=True, null=True)

    # Timestamps
    criado_em = models.DateTimeField('Criado em', auto_now_add=True)
    respondido_em = models.DateTimeField('Respondido em', blank=True, null=True)

    class Meta:
        verbose_name = 'Solicitação de Orientação'
        verbose_name_plural = 'Solicitações de Orientação'
        ordering = ['-criado_em']

    def __str__(self):
        return f'Solicitação de {self.tcc.aluno.nome_completo} para {self.professor.nome_completo} - {self.get_status_display()}'

    def clean(self):
        """Validações do modelo."""
        # Verificar se já existe solicitação PENDENTE para este TCC
        if self.status == StatusSolicitacao.PENDENTE:
            pendentes = SolicitacaoOrientacao.objects.filter(
                tcc=self.tcc,
                status=StatusSolicitacao.PENDENTE
            ).exclude(pk=self.pk)

            if pendentes.exists():
                raise ValidationError('Já existe uma solicitação pendente para este TCC')

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class DocumentoTCCManager(models.Manager):
    """Manager customizado para DocumentoTCC."""

    def oficiais(self):
        """Retorna apenas documentos com status APROVADO."""
        return self.filter(status=StatusDocumento.APROVADO)


class DocumentoTCC(models.Model):
    """Documentos anexados ao TCC."""

    tcc = models.ForeignKey(
        TCC,
        on_delete=models.CASCADE,
        related_name='documentos',
        verbose_name='TCC'
    )
    tipo_documento = models.CharField(
        'Tipo de Documento',
        max_length=50,
        choices=TipoDocumento.CHOICES
    )
    arquivo = models.FileField(
        'Arquivo',
        upload_to=upload_documento_path,
        validators=[
            validar_extensao_documento,
            validar_tamanho_arquivo
        ]
    )
    nome_original = models.CharField('Nome Original', max_length=255)
    tamanho = models.IntegerField('Tamanho (bytes)')
    versao = models.IntegerField('Versão', default=1)

    enviado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='documentos_enviados',
        verbose_name='Enviado por'
    )

    status = models.CharField(
        'Status',
        max_length=20,
        choices=StatusDocumento.CHOICES,
        default=StatusDocumento.PENDENTE
    )
    feedback = models.TextField('Feedback', blank=True, null=True)

    criado_em = models.DateTimeField('Criado em', auto_now_add=True)

    objects = DocumentoTCCManager()

    class Meta:
        verbose_name = 'Documento do TCC'
        verbose_name_plural = 'Documentos do TCC'
        ordering = ['-criado_em']

    def __str__(self):
        return f'{self.get_tipo_documento_display()} - {self.tcc.titulo} (v{self.versao})'

    def save(self, *args, **kwargs):
        # Calcular tamanho do arquivo automaticamente
        if self.arquivo and not self.tamanho:
            self.tamanho = self.arquivo.size

        # Salvar nome original automaticamente
        if self.arquivo and not self.nome_original:
            self.nome_original = os.path.basename(self.arquivo.name)

        # Calcular versão automaticamente apenas ao criar (não ao editar)
        if self.pk is None:
            versoes_anteriores = DocumentoTCC.objects.filter(
                tcc=self.tcc,
                tipo_documento=self.tipo_documento
            ).count()
            self.versao = versoes_anteriores + 1

        super().save(*args, **kwargs)


class EventoTimeline(models.Model):
    """Eventos da timeline do TCC."""

    tcc = models.ForeignKey(
        TCC,
        on_delete=models.CASCADE,
        related_name='eventos',
        verbose_name='TCC'
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='eventos_criados',
        verbose_name='Usuário',
        help_text='Usuário que gerou o evento (null se automático)'
    )

    tipo_evento = models.CharField(
        'Tipo de Evento',
        max_length=50,
        choices=TipoEvento.CHOICES
    )
    descricao = models.TextField('Descrição')
    detalhes_json = models.JSONField('Detalhes', blank=True, null=True)

    visibilidade = models.CharField(
        'Visibilidade',
        max_length=30,
        choices=Visibilidade.CHOICES,
        default=Visibilidade.TODOS
    )

    timestamp = models.DateTimeField('Data/Hora', auto_now_add=True)

    class Meta:
        verbose_name = 'Evento da Timeline'
        verbose_name_plural = 'Eventos da Timeline'
        ordering = ['-timestamp']

    def __str__(self):
        return f'{self.get_tipo_evento_display()} - {self.tcc.titulo} ({self.timestamp.strftime("%d/%m/%Y %H:%M")})'


class HistoricoRecusa(models.Model):
    """Registra a última recusa de TCC pelo coordenador para exibir ao aluno."""

    aluno = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='historico_recusa',
        verbose_name='Aluno'
    )
    parecer = models.TextField('Parecer do Coordenador')
    coordenador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='recusas_emitidas',
        verbose_name='Coordenador'
    )
    coordenador_nome = models.CharField('Nome do Coordenador', max_length=255)
    recusado_em = models.DateTimeField('Recusado em', auto_now_add=True)

    class Meta:
        verbose_name = 'Histórico de Recusa'
        verbose_name_plural = 'Históricos de Recusa'
        ordering = ['-recusado_em']

    def __str__(self):
        return f'Recusa de {self.aluno.nome_completo} em {self.recusado_em.strftime("%d/%m/%Y %H:%M")}'


class BancaFase1(models.Model):
    """Banca examinadora da Fase I."""

    STATUS_CHOICES = [
        ('PENDENTE', 'Pendente'),
        ('COMPLETA', 'Completa'),
    ]

    tcc = models.OneToOneField(
        TCC,
        on_delete=models.CASCADE,
        related_name='banca_fase1',
        verbose_name='TCC'
    )
    status = models.CharField(
        'Status',
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDENTE'
    )
    data_formacao = models.DateTimeField(
        'Data de Formação',
        null=True,
        blank=True,
        help_text='Data em que a banca foi concluída'
    )
    formada_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='bancas_formadas',
        verbose_name='Formada por'
    )
    documento_avaliacao = models.ForeignKey(
        'DocumentoTCC',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='banca_avaliacao',
        verbose_name='Documento para Avaliação',
        help_text='Monografia anônima para avaliação duplo-cega. Se não especificado, usa a monografia original.'
    )

    criado_em = models.DateTimeField('Criado em', auto_now_add=True)
    atualizado_em = models.DateTimeField('Atualizado em', auto_now=True)

    class Meta:
        verbose_name = 'Banca Fase I'
        verbose_name_plural = 'Bancas Fase I'
        ordering = ['-criado_em']

    def __str__(self):
        return f'Banca {self.get_status_display()} - {self.tcc.titulo}'


class MembroBanca(models.Model):
    """Membro de uma banca examinadora."""

    TIPO_CHOICES = [
        ('ORIENTADOR', 'Orientador'),
        ('AVALIADOR', 'Avaliador'),
    ]

    INDICADO_POR_CHOICES = [
        ('ORIENTADOR', 'Orientador'),
        ('COORDENADOR', 'Coordenador'),
    ]

    banca = models.ForeignKey(
        BancaFase1,
        on_delete=models.CASCADE,
        related_name='membros',
        verbose_name='Banca'
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='participacoes_banca',
        limit_choices_to={'tipo_usuario__in': ['PROFESSOR', 'COORDENADOR', 'AVALIADOR']},
        verbose_name='Membro'
    )
    tipo = models.CharField(
        'Tipo',
        max_length=20,
        choices=TIPO_CHOICES
    )
    indicado_por = models.CharField(
        'Indicado por',
        max_length=20,
        choices=INDICADO_POR_CHOICES
    )
    ordem = models.IntegerField(
        'Ordem',
        help_text='Ordem de apresentação'
    )

    criado_em = models.DateTimeField('Criado em', auto_now_add=True)

    class Meta:
        verbose_name = 'Membro de Banca'
        verbose_name_plural = 'Membros de Banca'
        ordering = ['banca', 'ordem']
        unique_together = [['banca', 'usuario']]

    def __str__(self):
        return f'{self.usuario.nome_completo} - {self.get_tipo_display()}'


class AvaliacaoFase1(models.Model):
    """Avaliação de um membro da banca na Fase I."""

    STATUS_CHOICES = [
        ('PENDENTE', 'Pendente'),
        ('ENVIADO', 'Enviado'),
        ('BLOQUEADO', 'Bloqueado'),
        ('CONCLUIDO', 'Concluído'),
    ]

    tcc = models.ForeignKey(
        TCC,
        on_delete=models.CASCADE,
        related_name='avaliacoes_fase1',
        verbose_name='TCC'
    )
    avaliador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='avaliacoes_realizadas',
        limit_choices_to={'tipo_usuario__in': ['PROFESSOR', 'COORDENADOR', 'AVALIADOR']},
        verbose_name='Avaliador'
    )

    # Notas dos 5 critérios (seguem os pesos configurados no calendário)
    nota_resumo = models.DecimalField(
        'Nota - Resumo',
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Nota de 0 até o peso configurado (padrão: 1.0)'
    )
    nota_introducao = models.DecimalField(
        'Nota - Introdução/Relevância',
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Nota de 0 até o peso configurado (padrão: 2.0)'
    )
    nota_revisao = models.DecimalField(
        'Nota - Revisão Bibliográfica',
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Nota de 0 até o peso configurado (padrão: 2.0)'
    )
    nota_desenvolvimento = models.DecimalField(
        'Nota - Desenvolvimento',
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Nota de 0 até o peso configurado (padrão: 3.5)'
    )
    nota_conclusoes = models.DecimalField(
        'Nota - Conclusões',
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Nota de 0 até o peso configurado (padrão: 1.5)'
    )

    parecer = models.TextField('Parecer', blank=True, null=True)

    status = models.CharField(
        'Status',
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDENTE'
    )

    criado_em = models.DateTimeField('Criado em', auto_now_add=True)
    atualizado_em = models.DateTimeField('Atualizado em', auto_now=True)
    enviado_em = models.DateTimeField('Enviado em', null=True, blank=True)

    class Meta:
        verbose_name = 'Avaliação Fase I'
        verbose_name_plural = 'Avaliações Fase I'
        ordering = ['-criado_em']
        unique_together = [['tcc', 'avaliador']]

    def __str__(self):
        return f'Avaliação de {self.avaliador.nome_completo} - {self.tcc.titulo}'

    def calcular_nota_total(self):
        """Calcula a nota total da avaliação (soma dos 5 critérios)."""
        notas = [
            self.nota_resumo or 0,
            self.nota_introducao or 0,
            self.nota_revisao or 0,
            self.nota_desenvolvimento or 0,
            self.nota_conclusoes or 0
        ]
        return sum(notas)

    def clean(self):
        """Validações do modelo."""
        # Obter pesos do calendário do semestre do TCC
        from definicoes.models import CalendarioSemestre
        calendario = CalendarioSemestre.obter_calendario_atual(self.tcc.semestre)

        if calendario:
            # Validar cada nota contra seu peso máximo
            validacoes = [
                ('nota_resumo', self.nota_resumo, calendario.peso_resumo),
                ('nota_introducao', self.nota_introducao, calendario.peso_introducao),
                ('nota_revisao', self.nota_revisao, calendario.peso_revisao),
                ('nota_desenvolvimento', self.nota_desenvolvimento, calendario.peso_desenvolvimento),
                ('nota_conclusoes', self.nota_conclusoes, calendario.peso_conclusoes),
            ]

            for campo, valor, peso_max in validacoes:
                if valor is not None:
                    if valor < 0:
                        raise ValidationError({campo: f'{campo} não pode ser negativa'})
                    if valor > float(peso_max):
                        raise ValidationError({campo: f'{campo} não pode exceder {peso_max}'})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class AgendamentoDefesa(models.Model):
    """Agendamento da defesa (apresentação) do TCC - Fase II."""

    tcc = models.OneToOneField(
        TCC,
        on_delete=models.CASCADE,
        related_name='agendamento_defesa',
        verbose_name='TCC'
    )
    data = models.DateField(
        'Data da Defesa',
        help_text='Data agendada para a apresentação'
    )
    hora = models.TimeField(
        'Horário da Defesa',
        help_text='Horário agendado para a apresentação'
    )
    local = models.CharField(
        'Local da Defesa',
        max_length=200,
        help_text='Sala, auditório ou link online'
    )

    agendado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='defesas_agendadas',
        verbose_name='Agendado por'
    )

    criado_em = models.DateTimeField('Criado em', auto_now_add=True)
    atualizado_em = models.DateTimeField('Atualizado em', auto_now=True)

    class Meta:
        verbose_name = 'Agendamento de Defesa'
        verbose_name_plural = 'Agendamentos de Defesa'
        ordering = ['-criado_em']

    def __str__(self):
        return f'Defesa de {self.tcc.titulo} - {self.data.strftime("%d/%m/%Y")} às {self.hora.strftime("%H:%M")}'


class AvaliacaoFase2(models.Model):
    """Avaliação de um membro da banca na Fase II (apresentação/defesa)."""

    STATUS_CHOICES = [
        ('PENDENTE', 'Pendente'),
        ('ENVIADO', 'Enviado'),
        ('BLOQUEADO', 'Bloqueado'),
        ('CONCLUIDO', 'Concluído'),
    ]

    tcc = models.ForeignKey(
        TCC,
        on_delete=models.CASCADE,
        related_name='avaliacoes_fase2',
        verbose_name='TCC'
    )
    avaliador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='avaliacoes_fase2_realizadas',
        limit_choices_to={'tipo_usuario__in': ['PROFESSOR', 'COORDENADOR', 'AVALIADOR']},
        verbose_name='Avaliador'
    )

    # Notas dos 5 critérios da Fase II (seguem os pesos configurados no calendário)
    nota_coerencia_conteudo = models.DecimalField(
        'Nota - Coerência do Conteúdo',
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Coerência do conteúdo da apresentação oral com o documento textual (padrão: 2.0)'
    )
    nota_qualidade_apresentacao = models.DecimalField(
        'Nota - Qualidade e Estrutura da Apresentação',
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Qualidade e estrutura do material de apresentação (padrão: 2.0)'
    )
    nota_dominio_tema = models.DecimalField(
        'Nota - Domínio e Conhecimento do Tema',
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Domínio e conhecimento do tema (padrão: 2.5)'
    )
    nota_clareza_fluencia = models.DecimalField(
        'Nota - Clareza e Fluência Verbal',
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Clareza e fluência verbal na exposição de ideias (padrão: 2.5)'
    )
    nota_observancia_tempo = models.DecimalField(
        'Nota - Observância do Tempo de Apresentação',
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Observância do tempo de apresentação (padrão: 1.0)'
    )

    parecer = models.TextField('Comentários (facultativo)', blank=True, null=True)

    status = models.CharField(
        'Status',
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDENTE'
    )

    criado_em = models.DateTimeField('Criado em', auto_now_add=True)
    atualizado_em = models.DateTimeField('Atualizado em', auto_now=True)
    enviado_em = models.DateTimeField('Enviado em', null=True, blank=True)

    class Meta:
        verbose_name = 'Avaliação Fase II'
        verbose_name_plural = 'Avaliações Fase II'
        ordering = ['-criado_em']
        unique_together = [['tcc', 'avaliador']]

    def __str__(self):
        return f'Avaliação Fase II de {self.avaliador.nome_completo} - {self.tcc.titulo}'

    def calcular_nota_total(self):
        """Calcula a nota total da avaliação (soma dos 5 critérios)."""
        notas = [
            self.nota_coerencia_conteudo or 0,
            self.nota_qualidade_apresentacao or 0,
            self.nota_dominio_tema or 0,
            self.nota_clareza_fluencia or 0,
            self.nota_observancia_tempo or 0
        ]
        return sum(notas)

    def clean(self):
        """Validações do modelo."""
        # Obter pesos do calendário do semestre do TCC
        from definicoes.models import CalendarioSemestre
        calendario = CalendarioSemestre.obter_calendario_atual(self.tcc.semestre)

        if calendario:
            # Validar cada nota contra seu peso máximo
            validacoes = [
                ('nota_coerencia_conteudo', self.nota_coerencia_conteudo, calendario.peso_coerencia_conteudo),
                ('nota_qualidade_apresentacao', self.nota_qualidade_apresentacao, calendario.peso_qualidade_apresentacao),
                ('nota_dominio_tema', self.nota_dominio_tema, calendario.peso_dominio_tema),
                ('nota_clareza_fluencia', self.nota_clareza_fluencia, calendario.peso_clareza_fluencia),
                ('nota_observancia_tempo', self.nota_observancia_tempo, calendario.peso_observancia_tempo),
            ]

            for campo, valor, peso_max in validacoes:
                if valor is not None:
                    if valor < 0:
                        raise ValidationError({campo: f'{campo} não pode ser negativa'})
                    if valor > float(peso_max):
                        raise ValidationError({campo: f'{campo} não pode exceder {peso_max}'})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
