from django.contrib import admin
from .models import CodigoCadastro, CalendarioSemestre, DocumentoReferencia


@admin.register(CodigoCadastro)
class CodigoCadastroAdmin(admin.ModelAdmin):
    """Admin para gerenciar códigos de cadastro."""

    list_display = ['tipo', 'codigo', 'atualizado_em', 'atualizado_por']
    list_filter = ['tipo']
    search_fields = ['codigo']
    readonly_fields = ['atualizado_em', 'atualizado_por']

    fieldsets = (
        (None, {'fields': ('tipo', 'codigo')}),
        ('Informações de Auditoria', {'fields': ('atualizado_em', 'atualizado_por')}),
    )

    def save_model(self, request, obj, form, change):
        """Registra quem atualizou o código."""
        obj.atualizado_por = request.user
        super().save_model(request, obj, form, change)


@admin.register(CalendarioSemestre)
class CalendarioSemestreAdmin(admin.ModelAdmin):
    """Admin para gerenciar calendário acadêmico."""

    list_display = ['semestre', 'ativo', 'atualizado_em', 'atualizado_por']
    list_filter = ['ativo', 'semestre']
    search_fields = ['semestre']
    readonly_fields = ['atualizado_em', 'atualizado_por']

    fieldsets = (
        ('Informações Gerais', {
            'fields': ('semestre', 'ativo')
        }),
        ('Datas Importantes', {
            'fields': (
                'reuniao_alunos',
                'envio_documentos_fim',
                'avaliacao_continuidade_fim',
                'submissao_monografia_fim',
                'preparacao_bancas_fase1_inicio',
                'preparacao_bancas_fase1_fim',
                'avaliacao_fase1_fim',
                'preparacao_bancas_fase2',
                'defesas_fim',
                'ajustes_finais_fim'
            )
        }),
        ('Auditoria', {
            'fields': ('atualizado_em', 'atualizado_por'),
            'classes': ('collapse',)
        }),
    )

    def save_model(self, request, obj, form, change):
        """Registra quem atualizou o calendário."""
        obj.atualizado_por = request.user
        super().save_model(request, obj, form, change)


@admin.register(DocumentoReferencia)
class DocumentoReferenciaAdmin(admin.ModelAdmin):
    """Admin para gerenciar documentos de referência."""

    list_display = ['get_tipo_display', 'arquivo', 'atualizado_em', 'atualizado_por']
    list_filter = ['tipo']
    search_fields = ['tipo']
    readonly_fields = ['atualizado_em', 'atualizado_por']

    fieldsets = (
        (None, {'fields': ('tipo', 'arquivo')}),
        ('Informações de Auditoria', {'fields': ('atualizado_em', 'atualizado_por')}),
    )

    def save_model(self, request, obj, form, change):
        """Registra quem atualizou o documento."""
        obj.atualizado_por = request.user
        super().save_model(request, obj, form, change)

    def get_tipo_display(self, obj):
        """Retorna o display name do tipo."""
        return obj.get_tipo_display()
    get_tipo_display.short_description = 'Tipo de Documento'
