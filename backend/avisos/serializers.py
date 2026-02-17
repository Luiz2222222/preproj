from rest_framework import serializers
from .models import Aviso, ComentarioAviso


class ComentarioAvisoSerializer(serializers.ModelSerializer):
    autor_nome = serializers.CharField(source='autor.nome_completo', read_only=True)

    class Meta:
        model = ComentarioAviso
        fields = ['id', 'aviso', 'autor', 'autor_nome', 'texto', 'criado_em']
        read_only_fields = ['id', 'aviso', 'autor', 'autor_nome', 'criado_em']


class AvisoSerializer(serializers.ModelSerializer):
    criado_por_nome = serializers.CharField(
        source='criado_por.nome_completo', read_only=True
    )
    comentarios = ComentarioAvisoSerializer(many=True, read_only=True)

    class Meta:
        model = Aviso
        fields = [
            'id',
            'titulo',
            'mensagem',
            'destinatarios',
            'cor',
            'fixado',
            'criado_por',
            'criado_por_nome',
            'criado_em',
            'atualizado_em',
            'comentarios',
        ]
        read_only_fields = ['id', 'criado_por', 'criado_por_nome', 'criado_em', 'atualizado_em', 'comentarios']
