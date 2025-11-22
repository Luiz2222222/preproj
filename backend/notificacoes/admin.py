from django.contrib import admin
from .models import Notificacao


@admin.register(Notificacao)
class NotificacaoAdmin(admin.ModelAdmin):
    list_display = ['id', 'usuario', 'tipo', 'titulo', 'lida', 'prioridade', 'criado_em']
    list_filter = ['tipo', 'lida', 'prioridade', 'criado_em']
    search_fields = ['titulo', 'mensagem', 'usuario__nome_completo', 'usuario__email']
    readonly_fields = ['criado_em', 'lido_em']
    date_hierarchy = 'criado_em'

    fieldsets = (
        ('Informações Básicas', {
            'fields': ('usuario', 'tipo', 'prioridade')
        }),
        ('Conteúdo', {
            'fields': ('titulo', 'mensagem', 'action_url')
        }),
        ('Relacionamentos', {
            'fields': ('tcc', 'metadata')
        }),
        ('Status', {
            'fields': ('lida', 'criado_em', 'lido_em')
        }),
    )
