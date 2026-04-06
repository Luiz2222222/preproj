from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import Usuario, PreferenciasVisuais
from definicoes.models import CodigoCadastro


class UsuarioSerializer(serializers.ModelSerializer):
    """Serializer basico para Usuario."""

    curso_display = serializers.CharField(source='get_curso_display', read_only=True)

    class Meta:
        model = Usuario
        fields = [
            'id', 'email', 'nome_completo', 'tipo_usuario',
            'tratamento', 'departamento', 'afiliacao', 'curso', 'curso_display',
            'date_joined'
        ]
        read_only_fields = ['id', 'date_joined', 'curso_display']


class RegistroAlunoSerializer(serializers.ModelSerializer):
    """Serializer para cadastro de Alumno."""

    senha = serializers.CharField(write_only=True, validators=[validate_password])
    confirmar_senha = serializers.CharField(write_only=True)
    codigo_cadastro = serializers.CharField(write_only=True)

    class Meta:
        model = Usuario
        fields = ['nome_completo', 'email', 'curso', 'codigo_cadastro', 'senha', 'confirmar_senha']

    def validate_curso(self, value):
        """Validar que o curso esta entre as opcoes validas."""
        cursos_validos = [choice[0] for choice in Usuario.CURSO_CHOICES]
        if value not in cursos_validos:
            raise serializers.ValidationError(f'Curso inválido. Opções válidas: {", ".join(cursos_validos)}')
        return value

    def validate(self, attrs):
        if attrs['senha'] != attrs['confirmar_senha']:
            raise serializers.ValidationError({'confirmar_senha': 'As senhas não coincidem.'})

        codigo = attrs.pop('codigo_cadastro')
        if not CodigoCadastro.validar_codigo('ALUNO', codigo):
            raise serializers.ValidationError({'codigo_cadastro': 'Código de cadastro inválido.'})

        attrs.pop('confirmar_senha')
        return attrs

    def create(self, validated_data):
        senha = validated_data.pop('senha')
        validated_data['tipo_usuario'] = 'ALUNO'
        usuario = Usuario.objects.create_user(password=senha, **validated_data)
        return usuario


class RegistroProfessorSerializer(serializers.ModelSerializer):
    """Serializer para cadastro de Professor."""

    senha = serializers.CharField(write_only=True, validators=[validate_password])
    confirmar_senha = serializers.CharField(write_only=True)
    codigo_cadastro = serializers.CharField(write_only=True)
    tratamento_customizado = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Usuario
        fields = [
            'nome_completo', 'email', 'tratamento', 'tratamento_customizado', 'departamento',
            'codigo_cadastro', 'senha', 'confirmar_senha'
        ]

    def validate_tratamento(self, value):
        """Validar que o tratamento esta entre as opcoes validas."""
        tratamentos_validos = [choice[0] for choice in Usuario.TRATAMENTO_CHOICES]
        if value not in tratamentos_validos:
            raise serializers.ValidationError(f'Tratamento inválido. Opções válidas: {", ".join(tratamentos_validos)}')
        return value

    def validate_departamento(self, value):
        """Validar que o departamento esta entre as opcoes validas."""
        departamentos_validos = [choice[0] for choice in Usuario.DEPARTAMENTO_CHOICES]
        if value not in departamentos_validos:
            raise serializers.ValidationError(f'Departamento inválido. Opções válidas: {", ".join(departamentos_validos)}')
        return value

    def validate(self, attrs):
        if attrs['senha'] != attrs['confirmar_senha']:
            raise serializers.ValidationError({'confirmar_senha': 'As senhas não coincidem.'})

        codigo = attrs.pop('codigo_cadastro')
        if not CodigoCadastro.validar_codigo('PROFESSOR', codigo):
            raise serializers.ValidationError({'codigo_cadastro': 'Código de cadastro inválido.'})

        attrs.pop('confirmar_senha')

        # Validar tratamento customizado se "Outro" foi selecionado
        if attrs.get('tratamento') == 'Outro' and not attrs.get('tratamento_customizado'):
            raise serializers.ValidationError({'tratamento_customizado': 'Tratamento customizado é obrigatório quando seleciona "Outro".'})

        # Remover afiliacao se vier no payload (sera forcada no model)
        attrs.pop('afiliacao', None)

        return attrs

    def create(self, validated_data):
        senha = validated_data.pop('senha')
        validated_data['tipo_usuario'] = 'PROFESSOR'
        # afiliacao sera forcada automaticamente no model.save()
        return Usuario.objects.create_user(password=senha, **validated_data)


class RegistroAvaliadorSerializer(serializers.ModelSerializer):
    """Serializer para cadastro de Avaliador Externo."""

    senha = serializers.CharField(write_only=True, validators=[validate_password])
    confirmar_senha = serializers.CharField(write_only=True)
    codigo_cadastro = serializers.CharField(write_only=True)
    tratamento_customizado = serializers.CharField(required=False, allow_blank=True)
    afiliacao_customizada = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Usuario
        fields = [
            'nome_completo', 'email', 'tratamento', 'tratamento_customizado',
            'afiliacao', 'afiliacao_customizada',
            'codigo_cadastro', 'senha', 'confirmar_senha'
        ]

    def validate_tratamento(self, value):
        """Validar que o tratamento esta entre as opcoes validas."""
        tratamentos_validos = [choice[0] for choice in Usuario.TRATAMENTO_CHOICES]
        if value not in tratamentos_validos:
            raise serializers.ValidationError(f'Tratamento inválido. Opções válidas: {", ".join(tratamentos_validos)}')
        return value

    def validate_afiliacao(self, value):
        """Validar que a afiliacao esta entre as opcoes validas."""
        afiliacoes_validas = [choice[0] for choice in Usuario.AFILIACAO_CHOICES]
        if value not in afiliacoes_validas:
            raise serializers.ValidationError(f'Afiliação inválida. Opções válidas: {", ".join(afiliacoes_validas)}')
        return value

    def validate(self, attrs):
        if attrs['senha'] != attrs['confirmar_senha']:
            raise serializers.ValidationError({'confirmar_senha': 'As senhas não coincidem.'})

        codigo = attrs.pop('codigo_cadastro')
        if not CodigoCadastro.validar_codigo('AVALIADOR', codigo):
            raise serializers.ValidationError({'codigo_cadastro': 'Código de cadastro inválido.'})

        attrs.pop('confirmar_senha')

        # Validar tratamento customizado se "Outro" foi selecionado
        if attrs.get('tratamento') == 'Outro' and not attrs.get('tratamento_customizado'):
            raise serializers.ValidationError({'tratamento_customizado': 'Tratamento customizado é obrigatório quando seleciona "Outro".'})

        # Validar afiliacao customizada se "Outro" foi selecionado
        if attrs.get('afiliacao') == 'Outro' and not attrs.get('afiliacao_customizada'):
            raise serializers.ValidationError({'afiliacao_customizada': 'Afiliação customizada é obrigatória quando seleciona "Outro".'})

        return attrs

    def create(self, validated_data):
        senha = validated_data.pop('senha')
        validated_data['tipo_usuario'] = 'AVALIADOR'
        return Usuario.objects.create_user(password=senha, **validated_data)


class PreferenciasVisuaisSerializer(serializers.ModelSerializer):
    """Serializer para PreferenciasVisuais."""

    class Meta:
        model = PreferenciasVisuais
        fields = ['tema', 'tamanho_fonte']


class PerfilUsuarioSerializer(serializers.ModelSerializer):
    """Serializer para perfil completo do usuario, incluindo preferencias visuais."""

    preferencias_visuais = PreferenciasVisuaisSerializer(read_only=True)
    curso_display = serializers.CharField(source='get_curso_display', read_only=True)

    class Meta:
        model = Usuario
        fields = [
            'id', 'email', 'nome_completo', 'tipo_usuario',
            'tratamento', 'tratamento_customizado', 'departamento', 'afiliacao', 'curso', 'curso_display',
            'preferencias_visuais'
        ]
        read_only_fields = ['id', 'email', 'tipo_usuario', 'curso_display']


class ProfessorListSerializer(serializers.ModelSerializer):
    """Serializer para listagem de professores (usado em dropdowns)."""

    class Meta:
        model = Usuario
        fields = [
            'id', 'nome_completo', 'email',
            'tratamento', 'tratamento_customizado', 'departamento'
        ]
        read_only_fields = fields


class TCCResumoSerializer(serializers.Serializer):
    """Serializer resumido de TCC para exibição em listas."""

    id = serializers.IntegerField()
    titulo = serializers.CharField()
    aluno_nome = serializers.CharField()
    aluno_id = serializers.IntegerField()
    etapa_atual = serializers.CharField()
    tipo_orientacao = serializers.CharField(required=False)  # ORIENTADOR ou CO_ORIENTADOR


class ProfessorEstatisticasSerializer(serializers.ModelSerializer):
    """Serializer completo com estatísticas de orientações e bancas."""

    orientacoes = serializers.SerializerMethodField()
    bancas = serializers.SerializerMethodField()
    total_orientacoes = serializers.SerializerMethodField()
    total_bancas = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = [
            'id', 'nome_completo', 'email',
            'tratamento', 'tratamento_customizado', 'departamento',
            'disponivel_para_listas',
            'orientacoes', 'bancas',
            'total_orientacoes', 'total_bancas'
        ]

    def get_orientacoes(self, obj):
        """Retorna lista unificada de orientações e co-orientações."""
        resultado = []

        # Usar dados já prefetchados (evita N+1 queries)
        # Orientações principais
        orientacoes = obj.tccs_como_orientador.all()
        for tcc in orientacoes:
            resultado.append({
                'id': tcc.id,
                'titulo': tcc.titulo,
                'aluno_nome': tcc.aluno.nome_completo,
                'aluno_id': tcc.aluno.id,
                'etapa_atual': tcc.etapa_atual,
                'tipo_orientacao': 'ORIENTADOR'
            })

        # Co-orientações
        coorientacoes = obj.tccs_como_coorientador.all()
        for tcc in coorientacoes:
            resultado.append({
                'id': tcc.id,
                'titulo': tcc.titulo,
                'aluno_nome': tcc.aluno.nome_completo,
                'aluno_id': tcc.aluno.id,
                'etapa_atual': tcc.etapa_atual,
                'tipo_orientacao': 'CO_ORIENTADOR'
            })

        return resultado

    def get_bancas(self, obj):
        """Retorna lista de TCCs onde o professor é avaliador de banca (exclui orientador)."""
        participacoes = obj.participacoes_banca.all()

        resultado = []
        for participacao in participacoes:
            if participacao.tipo == 'ORIENTADOR':
                continue
            tcc = participacao.banca.tcc
            resultado.append({
                'id': tcc.id,
                'titulo': tcc.titulo,
                'aluno_nome': tcc.aluno.nome_completo,
                'aluno_id': tcc.aluno.id,
                'etapa_atual': tcc.etapa_atual
            })

        return resultado

    def get_total_orientacoes(self, obj):
        """Total de orientações + co-orientações."""
        orientacoes = list(obj.tccs_como_orientador.all())
        coorientacoes = list(obj.tccs_como_coorientador.all())

        return len(orientacoes) + len(coorientacoes)

    def get_total_bancas(self, obj):
        """Total de participações em bancas (apenas como avaliador)."""
        return len([p for p in obj.participacoes_banca.all() if p.tipo != 'ORIENTADOR'])


class AlunoEstatisticasSerializer(serializers.ModelSerializer):
    """Serializer com dados do aluno e seu TCC."""

    curso_display = serializers.CharField(source='get_curso_display', read_only=True)
    tcc = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = [
            'id', 'nome_completo', 'email', 'curso', 'curso_display',
            'date_joined', 'tcc'
        ]

    def get_tcc(self, obj):
        tccs = obj.tccs_como_aluno.all()
        if not tccs:
            return None
        tcc = tccs[0]
        return {
            'id': tcc.id,
            'titulo': tcc.titulo,
            'etapa_atual': tcc.etapa_atual,
            'orientador_nome': tcc.orientador.nome_completo if tcc.orientador else None,
            'coorientador_nome': tcc.coorientador.nome_completo if tcc.coorientador else None,
            'semestre': tcc.semestre,
        }


class ExternoEstatisticasSerializer(serializers.ModelSerializer):
    """Serializer com dados do avaliador externo e suas bancas."""

    bancas = serializers.SerializerMethodField()
    total_bancas = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = [
            'id', 'nome_completo', 'email',
            'tratamento', 'tratamento_customizado',
            'afiliacao', 'afiliacao_customizada',
            'bancas', 'total_bancas'
        ]

    def get_bancas(self, obj):
        resultado = []
        for participacao in obj.participacoes_banca.all():
            if participacao.tipo == 'ORIENTADOR':
                continue
            tcc = participacao.banca.tcc
            resultado.append({
                'id': tcc.id,
                'titulo': tcc.titulo,
                'aluno_nome': tcc.aluno.nome_completo,
                'aluno_id': tcc.aluno.id,
                'etapa_atual': tcc.etapa_atual,
            })
        return resultado

    def get_total_bancas(self, obj):
        return len([p for p in obj.participacoes_banca.all() if p.tipo != 'ORIENTADOR'])


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer para alteração de senha do usuário."""

    senha_atual = serializers.CharField(write_only=True, required=True)
    nova_senha = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    confirmar_senha = serializers.CharField(write_only=True, required=True)

    def validate_senha_atual(self, value):
        """Validar que a senha atual está correta."""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Senha atual incorreta.')
        return value

    def validate(self, attrs):
        """Validar que a nova senha e confirmação coincidem."""
        if attrs['nova_senha'] != attrs['confirmar_senha']:
            raise serializers.ValidationError({'confirmar_senha': 'As senhas não coincidem.'})
        return attrs

    def save(self):
        """Atualizar a senha do usuário."""
        user = self.context['request'].user
        user.set_password(self.validated_data['nova_senha'])
        user.save()
        return user


class EditarProfessorSerializer(serializers.ModelSerializer):
    """Serializer para coordenador editar dados de um usuario."""

    tratamento_customizado = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    afiliacao_customizada = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Usuario
        fields = [
            'nome_completo', 'email', 'tratamento', 'tratamento_customizado',
            'departamento', 'curso', 'afiliacao', 'afiliacao_customizada'
        ]

    def validate_tratamento(self, value):
        if value:
            tratamentos_validos = [choice[0] for choice in Usuario.TRATAMENTO_CHOICES]
            if value not in tratamentos_validos:
                raise serializers.ValidationError('Tratamento inválido.')
        return value

    def validate_departamento(self, value):
        if value:
            departamentos_validos = [choice[0] for choice in Usuario.DEPARTAMENTO_CHOICES]
            if value not in departamentos_validos:
                raise serializers.ValidationError('Departamento inválido.')
        return value

    def validate_curso(self, value):
        if value:
            cursos_validos = [choice[0] for choice in Usuario.CURSO_CHOICES]
            if value not in cursos_validos:
                raise serializers.ValidationError('Curso inválido.')
        return value

    def validate_afiliacao(self, value):
        if value:
            afiliacoes_validas = [choice[0] for choice in Usuario.AFILIACAO_CHOICES]
            if value not in afiliacoes_validas:
                raise serializers.ValidationError('Afiliação inválida.')
        return value

    def validate_email(self, value):
        user = self.instance
        if Usuario.objects.filter(email=value).exclude(id=user.id).exists():
            raise serializers.ValidationError('Este e-mail já está em uso.')
        return value

    def validate(self, attrs):
        if attrs.get('tratamento') == 'Outro' and not attrs.get('tratamento_customizado'):
            raise serializers.ValidationError({'tratamento_customizado': 'Tratamento customizado é obrigatório quando seleciona "Outro".'})
        return attrs


class CoordenadorUpdateSerializer(serializers.ModelSerializer):
    """Serializer para atualização de dados do coordenador."""

    senha_atual = serializers.CharField(write_only=True, required=True)
    curso_display = serializers.CharField(source='get_curso_display', read_only=True)

    class Meta:
        model = Usuario
        fields = [
            'nome_completo', 'email', 'tratamento', 'tratamento_customizado',
            'departamento', 'senha_atual', 'curso_display'
        ]

    def validate_senha_atual(self, value):
        """Validar que a senha atual está correta."""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Senha atual incorreta.')
        return value

    def validate_tratamento(self, value):
        """Validar que o tratamento está entre as opções válidas."""
        if value:
            tratamentos_validos = [choice[0] for choice in Usuario.TRATAMENTO_CHOICES]
            if value not in tratamentos_validos:
                raise serializers.ValidationError(f'Tratamento inválido. Opções válidas: {", ".join(tratamentos_validos)}')
        return value

    def validate_departamento(self, value):
        """Validar que o departamento está entre as opções válidas."""
        if value:
            departamentos_validos = [choice[0] for choice in Usuario.DEPARTAMENTO_CHOICES]
            if value not in departamentos_validos:
                raise serializers.ValidationError(f'Departamento inválido. Opções válidas: {", ".join(departamentos_validos)}')
        return value

    def validate(self, attrs):
        """Validações adicionais."""
        # Remover senha_atual dos attrs pois não deve ser salva no modelo
        attrs.pop('senha_atual', None)

        # Validar tratamento customizado se "Outro" foi selecionado
        if attrs.get('tratamento') == 'Outro' and not attrs.get('tratamento_customizado'):
            raise serializers.ValidationError({'tratamento_customizado': 'Tratamento customizado é obrigatório quando seleciona "Outro".'})

        return attrs

    def update(self, instance, validated_data):
        """Atualizar os dados do coordenador."""
        instance.nome_completo = validated_data.get('nome_completo', instance.nome_completo)
        instance.email = validated_data.get('email', instance.email)
        instance.tratamento = validated_data.get('tratamento', instance.tratamento)
        instance.tratamento_customizado = validated_data.get('tratamento_customizado', instance.tratamento_customizado)
        instance.departamento = validated_data.get('departamento', instance.departamento)
        instance.save()
        return instance
