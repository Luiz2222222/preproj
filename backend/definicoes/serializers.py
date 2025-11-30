from rest_framework import serializers
from .models import CodigoCadastro, CalendarioSemestre, DocumentoReferencia, ConfiguracaoEmail


class CodigoCadastroSerializer(serializers.ModelSerializer):
    class Meta:
        model = CodigoCadastro
        fields = ['id', 'tipo', 'codigo', 'atualizado_em', 'atualizado_por']
        read_only_fields = ['id', 'atualizado_em', 'atualizado_por']


class CalendarioSemestreSerializer(serializers.ModelSerializer):
    atualizado_por = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = CalendarioSemestre
        fields = [
            'id',
            'semestre',
            'reuniao_alunos',
            'envio_documentos_fim',
            'avaliacao_continuidade_inicio',
            'avaliacao_continuidade_fim',
            'submissao_monografia_fim',
            'preparacao_bancas_fase1_inicio',
            'preparacao_bancas_fase1_fim',
            'avaliacao_fase1_fim',
            'preparacao_bancas_fase2',
            'defesas_fim',
            'ajustes_finais_fim',
            'peso_resumo',
            'peso_introducao',
            'peso_revisao',
            'peso_desenvolvimento',
            'peso_conclusoes',
            'peso_coerencia_conteudo',
            'peso_qualidade_apresentacao',
            'peso_dominio_tema',
            'peso_clareza_fluencia',
            'peso_observancia_tempo',
            'ativo',
            'atualizado_em',
            'atualizado_por'
        ]
        read_only_fields = ['atualizado_em', 'atualizado_por']

    def validate_semestre(self, value):
        """Valida que o semestre não pode estar vazio."""
        if not value or not value.strip():
            raise serializers.ValidationError('O campo semestre é obrigatório.')
        return value.strip()

    def validate(self, data):
        """Valida que a soma dos pesos de avaliação seja exatamente 10.0 para cada fase"""
        instance = self.instance

        # Validar Fase I
        peso_resumo = data.get('peso_resumo', instance.peso_resumo if instance else 1.0)
        peso_introducao = data.get('peso_introducao', instance.peso_introducao if instance else 2.0)
        peso_revisao = data.get('peso_revisao', instance.peso_revisao if instance else 2.0)
        peso_desenvolvimento = data.get('peso_desenvolvimento', instance.peso_desenvolvimento if instance else 3.5)
        peso_conclusoes = data.get('peso_conclusoes', instance.peso_conclusoes if instance else 1.5)

        soma_fase1 = (
            float(peso_resumo) +
            float(peso_introducao) +
            float(peso_revisao) +
            float(peso_desenvolvimento) +
            float(peso_conclusoes)
        )

        if abs(soma_fase1 - 10.0) > 0.01:
            raise serializers.ValidationError(
                f'A soma dos pesos de avaliação da Fase I deve ser exatamente 10.0 (atual: {soma_fase1:.1f})'
            )

        # Validar Fase II
        peso_coerencia = data.get('peso_coerencia_conteudo', instance.peso_coerencia_conteudo if instance else 2.0)
        peso_qualidade = data.get('peso_qualidade_apresentacao', instance.peso_qualidade_apresentacao if instance else 2.0)
        peso_dominio = data.get('peso_dominio_tema', instance.peso_dominio_tema if instance else 2.5)
        peso_clareza = data.get('peso_clareza_fluencia', instance.peso_clareza_fluencia if instance else 2.5)
        peso_tempo = data.get('peso_observancia_tempo', instance.peso_observancia_tempo if instance else 1.0)

        soma_fase2 = (
            float(peso_coerencia) +
            float(peso_qualidade) +
            float(peso_dominio) +
            float(peso_clareza) +
            float(peso_tempo)
        )

        if abs(soma_fase2 - 10.0) > 0.01:
            raise serializers.ValidationError(
                f'A soma dos pesos de avaliação da Fase II deve ser exatamente 10.0 (atual: {soma_fase2:.1f})'
            )

        return data


class DocumentoReferenciaSerializer(serializers.ModelSerializer):
    atualizado_por = serializers.StringRelatedField(read_only=True)
    arquivo_url = serializers.SerializerMethodField()
    arquivo_nome = serializers.SerializerMethodField()

    class Meta:
        model = DocumentoReferencia
        fields = ['id', 'tipo', 'arquivo', 'arquivo_url', 'arquivo_nome', 'atualizado_em', 'atualizado_por']
        read_only_fields = ['id', 'atualizado_em', 'atualizado_por', 'arquivo_url', 'arquivo_nome']

    def get_arquivo_url(self, obj):
        """Retorna a URL do arquivo se existir."""
        if obj.arquivo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.arquivo.url)
            return obj.arquivo.url
        return None

    def get_arquivo_nome(self, obj):
        """Retorna o nome do arquivo se existir."""
        if obj.arquivo:
            return obj.arquivo.name.split('/')[-1]
        return None

    def validate_arquivo(self, value):
        """Valida que o arquivo é PDF ou Word."""
        if value:
            extensoes_permitidas = ['.pdf', '.doc', '.docx']
            nome_arquivo = value.name.lower()
            if not any(nome_arquivo.endswith(ext) for ext in extensoes_permitidas):
                raise serializers.ValidationError(
                    'Apenas arquivos PDF (.pdf) ou Word (.doc, .docx) são permitidos.'
                )
        return value


class ConfiguracaoEmailSerializer(serializers.ModelSerializer):
    """Serializer para configurações de e-mail do sistema."""

    # Campo write-only para receber a senha
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    # Campo read-only para retornar senha mascarada
    password_masked = serializers.SerializerMethodField()

    class Meta:
        model = ConfiguracaoEmail
        fields = [
            'id',
            'email_enabled',
            'email_host',
            'email_port',
            'email_use_tls',
            'email_host_user',
            'password',  # write-only
            'password_masked',  # read-only
            'atualizado_em',
            'atualizado_por'
        ]
        read_only_fields = ['id', 'atualizado_em', 'atualizado_por', 'password_masked']

    def get_password_masked(self, obj):
        """Retorna senha mascarada se existir."""
        if obj.email_host_password:
            return '**********'
        return ''

    def create(self, validated_data):
        """Cria configuração com senha criptografada."""
        password = validated_data.pop('password', None)
        config = ConfiguracaoEmail(**validated_data)

        if password:
            config.set_password(password)

        config.save()
        return config

    def update(self, instance, validated_data):
        """Atualiza configuração, criptografando senha se fornecida."""
        password = validated_data.pop('password', None)

        # Atualizar campos normais
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Atualizar senha se fornecida e não for a máscara
        if password and password != '**********':
            instance.set_password(password)

        instance.save()
        return instance

    def to_representation(self, instance):
        """Customiza representação para incluir senha mascarada."""
        ret = super().to_representation(instance)
        # Remover campo email_host_password da resposta (segurança)
        ret.pop('email_host_password', None)
        return ret
