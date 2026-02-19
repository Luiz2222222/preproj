from rest_framework import serializers
from .models import Notificacao, PreferenciasEmail


class NotificacaoSerializer(serializers.ModelSerializer):
    """Serializer para notificações."""

    class Meta:
        model = Notificacao
        fields = [
            'id',
            'tipo',
            'titulo',
            'mensagem',
            'lida',
            'action_url',
            'metadata',
            'tcc',
            'prioridade',
            'criado_em',
            'lido_em'
        ]
        read_only_fields = ['id', 'criado_em', 'lido_em']


class PreferenciasEmailSerializer(serializers.ModelSerializer):
    """Serializer para preferências de e-mail do usuário."""

    class Meta:
        model = PreferenciasEmail
        fields = [
            'id',
            # Preferências de aluno
            'aluno_aceitar_convite_orientador',
            'aluno_ajuste_monografia',
            'aluno_termo_disponivel',
            'aluno_continuidade_aprovada',
            'aluno_resultado_fase_1',
            'aluno_agendamento_defesa',
            'aluno_finalizacao_tcc',
            # Preferências de professor
            'prof_convite_orientacao',
            'prof_receber_monografia',
            'prof_continuidade_aprovada',
            'prof_lembrete_termo',
            'prof_resultado_fase_1',
            'prof_finalizacao_tcc',
            # Preferências de coordenador
            'coord_convite_aluno',
            'coord_monografia_aprovada',
            'coord_termo_enviado',
            'coord_continuidade_aprovada',
            'coord_avaliacoes_fase1_completas',
            'coord_avaliacoes_fase2_completas',
            'coord_defesa_agendada',
            # Metadados
            'criado_em',
            'atualizado_em'
        ]
        read_only_fields = ['id', 'criado_em', 'atualizado_em']
