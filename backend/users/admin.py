from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    AlunoProxy,
    ProfessorProxy,
    AvaliadorProxy,
    CoordenadorProxy,
)


class BaseUsuarioAdmin(BaseUserAdmin):
    """Classe base para os perfis separados no admin."""

    list_display = ['email', 'nome_completo', 'date_joined']
    list_filter = []
    search_fields = ['email', 'nome_completo']
    ordering = ['-date_joined']
    filter_horizontal = ('groups', 'user_permissions')

    tipo_usuario = None

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if self.tipo_usuario:
            return qs.filter(tipo_usuario=self.tipo_usuario)
        return qs

    def save_model(self, request, obj, form, change):
        if self.tipo_usuario and not change:
            obj.tipo_usuario = self.tipo_usuario
        super().save_model(request, obj, form, change)


@admin.register(AlunoProxy)
class AlunoAdmin(BaseUsuarioAdmin):
    tipo_usuario = 'ALUNO'

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Informacoes Pessoais', {'fields': ('nome_completo',)}),
        ('Curso', {'fields': ('curso',)}),
        ('Datas', {'fields': ('date_joined', 'last_login')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'nome_completo', 'curso', 'password1', 'password2'),
        }),
    )

    list_display = ['email', 'nome_completo', 'curso', 'date_joined']
    list_filter = ['curso']


@admin.register(ProfessorProxy)
class ProfessorAdmin(BaseUsuarioAdmin):
    tipo_usuario = 'PROFESSOR'

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Informacoes Pessoais', {'fields': ('nome_completo', 'tratamento', 'tratamento_customizado')}),
        ('Departamento', {'fields': ('departamento',)}),
        ('Afiliacao', {'fields': ('afiliacao',)}),
        ('Datas', {'fields': ('date_joined', 'last_login')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'nome_completo', 'tratamento', 'tratamento_customizado', 'departamento', 'password1', 'password2'),
        }),
    )

    readonly_fields = ['afiliacao']

    list_display = ['email', 'nome_completo', 'tratamento', 'departamento', 'afiliacao', 'date_joined']


@admin.register(AvaliadorProxy)
class AvaliadorAdmin(BaseUsuarioAdmin):
    tipo_usuario = 'AVALIADOR'

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Informacoes Pessoais', {'fields': ('nome_completo', 'tratamento', 'tratamento_customizado')}),
        ('Afiliacao', {'fields': ('afiliacao', 'afiliacao_customizada')}),
        ('Datas', {'fields': ('date_joined', 'last_login')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'nome_completo', 'tratamento', 'tratamento_customizado', 'afiliacao', 'afiliacao_customizada', 'password1', 'password2'),
        }),
    )

    list_display = ['email', 'nome_completo', 'tratamento', 'afiliacao', 'date_joined']


@admin.register(CoordenadorProxy)
class CoordenadorAdmin(BaseUsuarioAdmin):
    tipo_usuario = 'COORDENADOR'

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Informacoes Pessoais', {'fields': ('nome_completo', 'tratamento', 'tratamento_customizado')}),
        ('Departamento', {'fields': ('departamento',)}),
        ('Datas', {'fields': ('date_joined', 'last_login')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'nome_completo', 'tratamento', 'tratamento_customizado', 'departamento', 'password1', 'password2'),
        }),
    )

    list_display = ['email', 'nome_completo', 'tratamento', 'departamento', 'date_joined']

    def save_model(self, request, obj, form, change):
        obj.tipo_usuario = 'COORDENADOR'
        super().save_model(request, obj, form, change)
