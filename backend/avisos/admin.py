from django.contrib import admin
from .models import Aviso, ComentarioAviso


@admin.register(Aviso)
class AvisoAdmin(admin.ModelAdmin):
    list_display = ['id', 'titulo', 'destinatarios', 'fixado', 'criado_por', 'criado_em']
    list_filter = ['fixado', 'criado_em']
    search_fields = ['titulo', 'mensagem']
    readonly_fields = ['criado_em', 'atualizado_em']


@admin.register(ComentarioAviso)
class ComentarioAvisoAdmin(admin.ModelAdmin):
    list_display = ['id', 'aviso', 'autor', 'criado_em']
    list_filter = ['criado_em']
    search_fields = ['texto', 'autor__nome_completo']
    readonly_fields = ['criado_em']
