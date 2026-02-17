from rest_framework import serializers
from .models import Aviso


class AvisoSerializer(serializers.ModelSerializer):
    criado_por_nome = serializers.CharField(
        source='criado_por.nome_completo', read_only=True
    )

    class Meta:
        model = Aviso
        fields = [
            'id',
            'titulo',
            'mensagem',
            'destinatarios',
            'fixado',
            'criado_por',
            'criado_por_nome',
            'criado_em',
            'atualizado_em',
        ]
        read_only_fields = ['id', 'criado_por', 'criado_por_nome', 'criado_em', 'atualizado_em']
