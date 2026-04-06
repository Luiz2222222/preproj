from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UsuarioManager(BaseUserManager):
    """Manager customizado para o modelo Usuario."""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('O e-mail é obrigatório')

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('tipo_usuario', 'COORDENADOR')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser deve ter is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser deve ter is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class Usuario(AbstractBaseUser, PermissionsMixin):
    """Modelo unico de usuario para todos os perfis."""

    TIPO_USUARIO_CHOICES = [
        ('ALUNO', 'Aluno'),
        ('PROFESSOR', 'Professor'),
        ('AVALIADOR', 'Avaliador Externo'),
        ('COORDENADOR', 'Coordenador'),
    ]

    CURSO_CHOICES = [
        ('ENGENHARIA_ELETRICA', 'Engenharia Elétrica'),
        ('ENGENHARIA_CONTROLE_AUTOMACAO', 'Engenharia de Controle e Automação'),
    ]

    TRATAMENTO_CHOICES = [
        ('Prof. Dr.', 'Prof. Dr.'),
        ('Prof. Ms.', 'Prof. Ms.'),
        ('Prof.', 'Prof.'),
        ('Dr.', 'Dr.'),
        ('Eng.', 'Eng.'),
        ('Outro', 'Outro'),
    ]

    DEPARTAMENTO_CHOICES = [
        ('Departamento de Engenharia Elétrica', 'Departamento de Engenharia Elétrica'),
        ('Departamento de Controle e Automação', 'Departamento de Controle e Automação'),
    ]

    AFILIACAO_CHOICES = [
        ('Universidade Federal de Pernambuco', 'Universidade Federal de Pernambuco'),
        ('UFRPE', 'UFRPE'),
        ('IFPE', 'IFPE'),
        ('Outro', 'Outro'),
    ]

    email = models.EmailField('Email', unique=True)
    nome_completo = models.CharField('Nome Completo', max_length=200)
    tipo_usuario = models.CharField('Tipo de Usuario', max_length=20, choices=TIPO_USUARIO_CHOICES)

    tratamento = models.CharField('Tratamento', max_length=50, choices=TRATAMENTO_CHOICES, blank=True, null=True)
    tratamento_customizado = models.CharField('Tratamento Customizado', max_length=100, blank=True, null=True)
    departamento = models.CharField('Departamento', max_length=200, choices=DEPARTAMENTO_CHOICES, blank=True, null=True)
    afiliacao = models.CharField('Afiliacao', max_length=200, choices=AFILIACAO_CHOICES, blank=True, null=True)
    afiliacao_customizada = models.CharField('Afiliacao Customizada', max_length=200, blank=True, null=True)
    curso = models.CharField('Curso', max_length=50, choices=CURSO_CHOICES, blank=True, null=True)

    disponivel_para_listas = models.BooleanField('Disponível para seleção em listas', default=True)
    is_staff = models.BooleanField('Staff', default=False)
    date_joined = models.DateTimeField('Data de Cadastro', default=timezone.now)

    objects = UsuarioManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nome_completo']

    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['-date_joined']

    def __str__(self):
        return f'{self.nome_completo} ({self.get_tipo_usuario_display()})'

    def save(self, *args, **kwargs):
        # Forçar afiliacao para professor e coordenador
        if self.tipo_usuario in ['PROFESSOR', 'COORDENADOR']:
            self.afiliacao = 'Universidade Federal de Pernambuco'

        # Validações obrigatórias
        if self.tipo_usuario == 'ALUNO' and not self.curso:
            raise ValueError('Aluno deve ter curso definido')
        if self.tipo_usuario in ['PROFESSOR', 'COORDENADOR'] and not self.departamento:
            raise ValueError('Professor/Coordenador deve ter departamento definido')
        if self.tipo_usuario == 'AVALIADOR' and not self.afiliacao:
            raise ValueError('Avaliador externo deve ter afiliacao definida')

        super().save(*args, **kwargs)


class TipoUsuarioManager(models.Manager):
    """Manager generico para os proxies de usuario."""

    def __init__(self, tipo, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.tipo = tipo

    def get_queryset(self):
        return super().get_queryset().filter(tipo_usuario=self.tipo)


class AlunoProxy(Usuario):
    objects = TipoUsuarioManager('ALUNO')

    class Meta:
        proxy = True
        verbose_name = 'Aluno'
        verbose_name_plural = 'Alunos'


class ProfessorProxy(Usuario):
    objects = TipoUsuarioManager('PROFESSOR')

    class Meta:
        proxy = True
        verbose_name = 'Professor'
        verbose_name_plural = 'Professores'


class AvaliadorProxy(Usuario):
    objects = TipoUsuarioManager('AVALIADOR')

    class Meta:
        proxy = True
        verbose_name = 'Avaliador Externo'
        verbose_name_plural = 'Avaliadores Externos'


class CoordenadorProxy(Usuario):
    objects = TipoUsuarioManager('COORDENADOR')

    class Meta:
        proxy = True
        verbose_name = 'Coordenador'
        verbose_name_plural = 'Coordenadores'


class PreferenciasVisuais(models.Model):
    """Modelo para armazenar preferencias visuais do usuario."""

    TEMA_CHOICES = [
        ('white', 'White'),
        ('black', 'Black'),
        ('dark', 'Dark'),
        ('sigaa', 'Clássico'),
    ]

    TAMANHO_FONTE_CHOICES = [
        ('pequeno', 'Pequeno'),
        ('medio', 'Medio'),
        ('grande', 'Grande'),
    ]

    usuario = models.OneToOneField(
        Usuario,
        on_delete=models.CASCADE,
        related_name='preferencias_visuais',
        verbose_name='Usuario'
    )
    tema = models.CharField(
        'Tema',
        max_length=10,
        choices=TEMA_CHOICES,
        default='white'
    )
    tamanho_fonte = models.CharField(
        'Tamanho da Fonte',
        max_length=10,
        choices=TAMANHO_FONTE_CHOICES,
        default='medio'
    )

    class Meta:
        verbose_name = 'Preferencias Visuais'
        verbose_name_plural = 'Preferencias Visuais'

    def __str__(self):
        return f'Preferencias de {self.usuario.nome_completo}'

