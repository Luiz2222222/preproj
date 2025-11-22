from django.db import models
from django.conf import settings
import base64


class CodigoCadastro(models.Model):
    """Armazena os codigos unicos por tipo de usuario."""

    TIPO_CODIGO_CHOICES = [
        ('ALUNO', 'Aluno'),
        ('PROFESSOR', 'Professor'),
        ('AVALIADOR', 'Avaliador Externo'),
    ]

    tipo = models.CharField('Tipo', max_length=20, choices=TIPO_CODIGO_CHOICES, unique=True)
    codigo = models.CharField('Codigo', max_length=100)
    atualizado_em = models.DateTimeField('Atualizado em', auto_now=True)
    atualizado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='codigos_atualizados'
    )

    class Meta:
        verbose_name = 'Codigo de Cadastro'
        verbose_name_plural = 'Codigos de Cadastro'
        ordering = ['tipo']

    def __str__(self):
        return f'Codigo {self.get_tipo_display()}: {self.codigo}'

    @classmethod
    def validar_codigo(cls, tipo, codigo):
        try:
            codigo_obj = cls.objects.get(tipo=tipo)
            return codigo_obj.codigo == codigo
        except cls.DoesNotExist:
            return False


class CalendarioSemestre(models.Model):
    """Armazena as datas-chave do calendário acadêmico."""

    semestre = models.CharField('Semestre', max_length=10)  # ex: "2025.1"
    reuniao_alunos = models.DateField('Reunião com alunos', null=True, blank=True, help_text='Orientações gerais sobre o desenvolvimento do TCC')
    envio_documentos_fim = models.DateField('Prazo final para envio de documentos iniciais', null=True, blank=True)
    avaliacao_continuidade_fim = models.DateField('Prazo final para avaliação de continuidade', null=True, blank=True)
    submissao_monografia_fim = models.DateField('Prazo final para submissão da monografia', null=True, blank=True)
    preparacao_bancas_fase1_inicio = models.DateField('Preparação das bancas (Fase I) - Início', null=True, blank=True)
    preparacao_bancas_fase1_fim = models.DateField('Preparação das bancas (Fase I) - Fim', null=True, blank=True)
    avaliacao_fase1_fim = models.DateField('Avaliação - Fase I', null=True, blank=True)
    preparacao_bancas_fase2 = models.DateField('Preparação das bancas (Fase II)', null=True, blank=True)
    defesas_fim = models.DateField('Apresentação dos trabalhos (Fase II)', null=True, blank=True)
    ajustes_finais_fim = models.DateField('Prazo final para Ajustes Finais', null=True, blank=True)

    # Pesos de Avaliação Fase I (devem somar 10.0)
    peso_resumo = models.DecimalField('Peso - Resumo', max_digits=3, decimal_places=1, default=1.0)
    peso_introducao = models.DecimalField('Peso - Introdução/Relevância', max_digits=3, decimal_places=1, default=2.0)
    peso_revisao = models.DecimalField('Peso - Revisão Bibliográfica', max_digits=3, decimal_places=1, default=2.0)
    peso_desenvolvimento = models.DecimalField('Peso - Desenvolvimento', max_digits=3, decimal_places=1, default=3.5)
    peso_conclusoes = models.DecimalField('Peso - Conclusões', max_digits=3, decimal_places=1, default=1.5)

    # Pesos de Avaliação Fase II (devem somar 10.0)
    peso_coerencia_conteudo = models.DecimalField('Peso - Coerência do Conteúdo', max_digits=3, decimal_places=1, default=2.0)
    peso_qualidade_apresentacao = models.DecimalField('Peso - Qualidade e Estrutura da Apresentação', max_digits=3, decimal_places=1, default=2.0)
    peso_dominio_tema = models.DecimalField('Peso - Domínio e Conhecimento do Tema', max_digits=3, decimal_places=1, default=2.5)
    peso_clareza_fluencia = models.DecimalField('Peso - Clareza e Fluência Verbal', max_digits=3, decimal_places=1, default=2.5)
    peso_observancia_tempo = models.DecimalField('Peso - Observância do Tempo de Apresentação', max_digits=3, decimal_places=1, default=1.0)

    ativo = models.BooleanField('Ativo', default=True)
    atualizado_em = models.DateTimeField('Atualizado em', auto_now=True)
    atualizado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='calendario_atualizado'
    )

    class Meta:
        verbose_name = 'Calendário do Semestre'
        verbose_name_plural = 'Calendários de Semestre'
        ordering = ['-atualizado_em']

    def __str__(self):
        return f'Calendário {self.semestre}'

    @classmethod
    def obter_calendario_atual(cls, semestre=None):
        """Retorna o calendário ativo mais recente."""
        queryset = cls.objects.filter(ativo=True)
        if semestre:
            queryset = queryset.filter(semestre=semestre)
        return queryset.order_by('-atualizado_em').first()


class DocumentoReferencia(models.Model):
    """Armazena documentos de referência/modelo para download."""

    TIPO_DOCUMENTO_CHOICES = [
        ('ORIENTACOES_GERAIS', 'Orientações gerais sobre o TCC'),
        ('TERMO_ACEITE', 'Termo de Aceite de Orientação'),
        ('PLANO_DESENVOLVIMENTO', 'Plano de Desenvolvimento'),
        ('TEMPLATE_WORD', 'Template Word - TCC'),
        ('ABNT_BIBLIOGRAFIA', 'ABNT - Estilo de bibliografia do Word'),
        ('ABNT_BIBLIOGRAFIA_2018', 'ABNT - Estilo de bibliografia do Word 2018'),
    ]

    tipo = models.CharField('Tipo de Documento', max_length=50, choices=TIPO_DOCUMENTO_CHOICES, unique=True)
    arquivo = models.FileField('Arquivo', upload_to='documentos_referencia/')
    atualizado_em = models.DateTimeField('Atualizado em', auto_now=True)
    atualizado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='documentos_atualizados'
    )

    class Meta:
        verbose_name = 'Documento de Referência'
        verbose_name_plural = 'Documentos de Referência'
        ordering = ['tipo']

    def __str__(self):
        return f'{self.get_tipo_display()}'


class ConfiguracaoEmail(models.Model):
    """
    Configurações globais de e-mail do sistema.
    Apenas um registro deve existir.
    """

    # Configuração principal
    email_enabled = models.BooleanField(
        'E-mail habilitado',
        default=False,
        help_text='Ativa/desativa o envio de e-mails pelo sistema'
    )

    # Credenciais SMTP
    email_host = models.CharField(
        'Servidor SMTP',
        max_length=255,
        default='smtp.gmail.com',
        help_text='Endereço do servidor SMTP'
    )

    email_port = models.IntegerField(
        'Porta SMTP',
        default=587,
        help_text='Porta do servidor SMTP'
    )

    email_use_tls = models.BooleanField(
        'Usar TLS',
        default=True,
        help_text='Ativa criptografia TLS para conexão SMTP'
    )

    email_host_user = models.EmailField(
        'E-mail do remetente',
        max_length=255,
        blank=True,
        help_text='Endereço de e-mail usado para enviar mensagens'
    )

    email_host_password = models.CharField(
        'Senha de app',
        max_length=500,
        blank=True,
        help_text='Senha de app do Gmail (será criptografada)'
    )

    # Metadados
    atualizado_em = models.DateTimeField('Atualizado em', auto_now=True)
    atualizado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='config_email_atualizada'
    )

    class Meta:
        verbose_name = 'Configuração de E-mail'
        verbose_name_plural = 'Configurações de E-mail'

    def __str__(self):
        status = 'Ativo' if self.email_enabled else 'Inativo'
        return f'Configuração de E-mail ({status})'

    @classmethod
    def obter_configuracao(cls):
        """Retorna a configuração única, criando se não existir."""
        config, created = cls.objects.get_or_create(pk=1)
        return config

    def _criptografar_senha(self, senha):
        """Criptografa a senha usando base64 (simples, pode ser melhorado)."""
        if not senha:
            return ''
        return base64.b64encode(senha.encode()).decode()

    def _descriptografar_senha(self, senha_criptografada):
        """Descriptografa a senha."""
        if not senha_criptografada:
            return ''
        try:
            return base64.b64decode(senha_criptografada.encode()).decode()
        except Exception:
            return senha_criptografada  # Retorna original se falhar

    def set_password(self, senha):
        """Define a senha criptografada."""
        self.email_host_password = self._criptografar_senha(senha)

    def get_password(self):
        """Retorna a senha descriptografada."""
        return self._descriptografar_senha(self.email_host_password)

    def save(self, *args, **kwargs):
        """Garante que apenas um registro exista (singleton pattern)."""
        self.pk = 1
        super().save(*args, **kwargs)

        # Atualizar settings do Django dinamicamente
        self.aplicar_configuracao()

    def aplicar_configuracao(self):
        """Aplica as configurações ao settings do Django em tempo de execução."""
        from django.conf import settings as django_settings

        # Trocar backend baseado em EMAIL_ENABLED
        if self.email_enabled:
            # Usar backend customizado que resolve problemas de certificados SSL
            django_settings.EMAIL_BACKEND = 'notificacoes.email_backend.EmailBackend'
        else:
            django_settings.EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

        django_settings.EMAIL_ENABLED = self.email_enabled
        django_settings.EMAIL_HOST = self.email_host
        django_settings.EMAIL_PORT = self.email_port
        django_settings.EMAIL_USE_TLS = self.email_use_tls
        django_settings.EMAIL_HOST_USER = self.email_host_user
        # Usar senha descriptografada para o settings
        django_settings.EMAIL_HOST_PASSWORD = self.get_password()

        # Atualizar DEFAULT_FROM_EMAIL se houver usuário configurado
        if self.email_host_user:
            django_settings.DEFAULT_FROM_EMAIL = f'Portal TCC <{self.email_host_user}>'
