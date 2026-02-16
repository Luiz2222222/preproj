from rest_framework import serializers
from django.utils import timezone
from .models import TCC, SolicitacaoOrientacao, DocumentoTCC, EventoTimeline, BancaFase1, MembroBanca, AvaliacaoFase1, AgendamentoDefesa, AvaliacaoFase2
from .constants import StatusSolicitacao, EtapaTCC
from users.serializers import UsuarioSerializer
from .services import calcular_permissoes_tcc, obter_calendario_para_tcc
from definicoes.serializers import CalendarioSemestreSerializer
import mimetypes


def validar_arquivo_documento(arquivo, extensoes_permitidas, mimes_permitidos, limite_mb=10):
    """
    Função auxiliar para validar arquivos de documentos.

    Args:
        arquivo: Arquivo a ser validado
        extensoes_permitidas: Lista de extensões permitidas (ex: ['.pdf', '.doc', '.docx'])
        mimes_permitidos: Lista de MIME types permitidos
        limite_mb: Tamanho máximo em MB (padrão: 10MB)

    Returns:
        None se válido, ou levanta ValidationError
    """
    if not arquivo:
        return

    nome_arquivo = arquivo.name.lower()

    # Validar extensão
    if not any(nome_arquivo.endswith(ext) for ext in extensoes_permitidas):
        extensoes_str = ', '.join(extensoes_permitidas)
        raise serializers.ValidationError(
            f'Apenas arquivos com extensões {extensoes_str} são permitidos'
        )

    # Verificar MIME type
    content_type = getattr(arquivo, 'content_type', None)
    if content_type and content_type not in mimes_permitidos:
        # Tentar inferir pelo nome do arquivo
        mime_inferido, _ = mimetypes.guess_type(arquivo.name)
        if mime_inferido and mime_inferido not in mimes_permitidos:
            raise serializers.ValidationError(
                'Tipo de arquivo inválido. Verifique o formato do arquivo'
            )

    # Validar tamanho
    if arquivo.size > limite_mb * 1024 * 1024:
        raise serializers.ValidationError(
            f'Arquivo não pode exceder {limite_mb}MB'
        )


class TCCSerializer(serializers.ModelSerializer):
    """Serializer para TCC com dados aninhados na leitura."""

    aluno_dados = UsuarioSerializer(source='aluno', read_only=True)
    orientador_dados = UsuarioSerializer(source='orientador', read_only=True)
    coorientador_dados = UsuarioSerializer(source='coorientador', read_only=True)
    etapa_display = serializers.CharField(source='get_etapa_atual_display', read_only=True)
    solicitacao_pendente_id = serializers.SerializerMethodField()
    solicitacao_recusada = serializers.SerializerMethodField()
    parecer_recusa = serializers.SerializerMethodField()
    data_recusa = serializers.SerializerMethodField()
    documentos = serializers.SerializerMethodField()
    permissoes = serializers.SerializerMethodField()
    calendario_semestre = serializers.SerializerMethodField()

    class Meta:
        model = TCC
        fields = [
            'id',
            'aluno',
            'aluno_dados',
            'orientador',
            'orientador_dados',
            'coorientador',
            'coorientador_dados',
            'titulo',
            'resumo',
            'etapa_atual',
            'etapa_display',
            'semestre',
            'flag_continuidade',
            'flag_liberado_avaliacao',
            'avaliacao_fase1_bloqueada',
            'avaliacao_fase2_bloqueada',
            'liberar_fase1',
            'liberar_fase2',
            'coorientador_nome',
            'coorientador_titulacao',
            'coorientador_afiliacao',
            'coorientador_lattes',
            'nf1',
            'nf2',
            'media_final',
            'resultado_final',
            'solicitacao_pendente_id',
            'solicitacao_recusada',
            'parecer_recusa',
            'data_recusa',
            'documentos',
            'permissoes',
            'calendario_semestre',
            'criado_em',
            'atualizado_em'
        ]
        read_only_fields = ['criado_em', 'atualizado_em']

    def get_solicitacao_pendente_id(self, obj):
        """Retorna o ID da solicitação pendente, se houver."""
        solicitacao = obj.solicitacoes.filter(status=StatusSolicitacao.PENDENTE).first()
        return solicitacao.id if solicitacao else None

    def get_solicitacao_recusada(self, obj):
        """Verifica se há solicitação recusada e TCC está em inicialização sem orientador."""
        ultima_solicitacao = obj.solicitacoes.order_by('-criado_em').first()
        if (ultima_solicitacao and
            ultima_solicitacao.status == StatusSolicitacao.RECUSADA and
            obj.etapa_atual == EtapaTCC.INICIALIZACAO and
            obj.orientador is None):
            return True
        return False

    def get_parecer_recusa(self, obj):
        """Retorna o parecer da última solicitação recusada."""
        ultima_solicitacao = obj.solicitacoes.filter(
            status=StatusSolicitacao.RECUSADA
        ).order_by('-respondido_em').first()
        return ultima_solicitacao.resposta_professor if ultima_solicitacao else None

    def get_data_recusa(self, obj):
        """Retorna a data da última recusa."""
        ultima_solicitacao = obj.solicitacoes.filter(
            status=StatusSolicitacao.RECUSADA
        ).order_by('-respondido_em').first()
        return ultima_solicitacao.respondido_em if ultima_solicitacao else None

    def get_documentos(self, obj):
        """Retorna lista de documentos do TCC."""
        request = self.context.get('request')
        usuario = request.user if request else None

        # Verificar se usuário é avaliador da banca
        eh_avaliador = False
        if usuario and usuario.tipo_usuario in ['PROFESSOR', 'COORDENADOR']:
            # Verificar se é membro avaliador da banca deste TCC
            eh_avaliador = MembroBanca.objects.filter(
                banca__tcc=obj,
                usuario=usuario,
                tipo='AVALIADOR'
            ).exists()

        # Filtrar documentos baseado no papel do usuário
        if eh_avaliador:
            try:
                banca = BancaFase1.objects.get(tcc=obj)
                if banca.documento_avaliacao:
                    # Retornar APENAS o documento anônimo para avaliação duplo-cega
                    documentos = [banca.documento_avaliacao]
                else:
                    # Se não há documento anônimo, retornar monografia original
                    from .constants import TipoDocumento
                    monografia = obj.documentos.filter(
                        tipo_documento=TipoDocumento.MONOGRAFIA
                    ).order_by('-criado_em').first()
                    documentos = [monografia] if monografia else []
            except BancaFase1.DoesNotExist:
                documentos = []
        else:
            # Para outros usuários (aluno, orientador, coordenador), retornar todos
            documentos = obj.documentos.all().order_by('-criado_em')

        return [{
            'id': doc.id,
            'tipo_documento': doc.tipo_documento,
            'tipo_documento_display': doc.get_tipo_documento_display(),
            'arquivo': request.build_absolute_uri(f'/api/documentos/{doc.id}/download/') if request and doc.arquivo else None,
            'nome_original': doc.nome_original,
            'tamanho': doc.tamanho,
            'versao': doc.versao,
            'status': doc.status,
            'status_display': doc.get_status_display(),
            'feedback': doc.feedback or '',  # Normaliza null para string vazia
            'criado_em': doc.criado_em.isoformat() if doc.criado_em else None,
        } for doc in documentos]

    def get_permissoes(self, obj):
        """Retorna as permissões calculadas para este TCC."""
        return calcular_permissoes_tcc(obj)

    def get_calendario_semestre(self, obj):
        """Retorna o calendário do semestre deste TCC."""
        calendario = obter_calendario_para_tcc(obj)
        if calendario:
            return CalendarioSemestreSerializer(calendario).data
        return None

    def validate(self, data):
        """Validações customizadas."""
        # Se está criando, validar que aluno é do tipo ALUNO
        if not self.instance:
            aluno = data.get('aluno')
            if aluno and aluno.tipo_usuario != 'ALUNO':
                raise serializers.ValidationError({'aluno': 'Usuário deve ser do tipo ALUNO'})

        # Validar que orientador é PROFESSOR ou COORDENADOR (se fornecido)
        orientador = data.get('orientador')
        if orientador and orientador.tipo_usuario not in ['PROFESSOR', 'COORDENADOR']:
            raise serializers.ValidationError({'orientador': 'Orientador deve ser PROFESSOR ou COORDENADOR'})

        # Validar que coorientador é PROFESSOR, COORDENADOR ou AVALIADOR (se fornecido)
        coorientador = data.get('coorientador')
        if coorientador and coorientador.tipo_usuario not in ['PROFESSOR', 'COORDENADOR', 'AVALIADOR']:
            raise serializers.ValidationError({'coorientador': 'Coorientador deve ser PROFESSOR, COORDENADOR ou AVALIADOR'})

        return data

    def validate_titulo(self, value):
        """Validar título."""
        if len(value.strip()) < 3:
            raise serializers.ValidationError('Título deve ter no mínimo 3 caracteres')
        return value.strip()


class SolicitacaoOrientacaoSerializer(serializers.ModelSerializer):
    """Serializer para Solicitação de Orientação."""

    tcc_dados = TCCSerializer(source='tcc', read_only=True)
    professor_dados = UsuarioSerializer(source='professor', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    aluno_nome = serializers.SerializerMethodField()
    aluno_email = serializers.SerializerMethodField()
    aluno_curso = serializers.SerializerMethodField()
    documentos = serializers.SerializerMethodField()

    class Meta:
        model = SolicitacaoOrientacao
        fields = [
            'id',
            'tcc',
            'tcc_dados',
            'professor',
            'professor_dados',
            'mensagem',
            'status',
            'status_display',
            'resposta_professor',
            'coorientador_nome',
            'coorientador_titulacao',
            'coorientador_afiliacao',
            'coorientador_lattes',
            'aluno_nome',
            'aluno_email',
            'aluno_curso',
            'documentos',
            'criado_em',
            'respondido_em'
        ]
        read_only_fields = ['criado_em', 'respondido_em', 'status']

    def get_aluno_nome(self, obj):
        """Retorna nome completo do aluno."""
        return obj.tcc.aluno.nome_completo if obj.tcc and obj.tcc.aluno else None

    def get_aluno_email(self, obj):
        """Retorna email do aluno."""
        return obj.tcc.aluno.email if obj.tcc and obj.tcc.aluno else None

    def get_aluno_curso(self, obj):
        """Retorna curso do aluno (assumindo que existe no modelo Usuario)."""
        if obj.tcc and obj.tcc.aluno:
            aluno = obj.tcc.aluno
            # Se o modelo Usuario tiver campo 'curso', retornar; caso contrário, retornar departamento
            if hasattr(aluno, 'curso'):
                return aluno.curso
            elif hasattr(aluno, 'departamento'):
                return aluno.departamento
        return None

    def get_documentos(self, obj):
        """Retorna lista de documentos do TCC com URLs."""
        from .models import DocumentoTCC
        if obj.tcc:
            documentos = DocumentoTCC.objects.filter(tcc=obj.tcc).order_by('-criado_em')
            request = self.context.get('request')
            return [{
                'id': doc.id,
                'tipo': doc.tipo_documento,
                'tipo_display': doc.get_tipo_documento_display(),
                'nome_original': doc.nome_original,
                'versao': doc.versao,
                'url': request.build_absolute_uri(f'/api/documentos/{doc.id}/download/') if request and doc.arquivo else None,
                'criado_em': doc.criado_em
            } for doc in documentos]
        return []

    def validate(self, data):
        """Validações customizadas."""
        # Validar que professor é PROFESSOR ou COORDENADOR
        professor = data.get('professor')
        if professor and professor.tipo_usuario not in ['PROFESSOR', 'COORDENADOR']:
            raise serializers.ValidationError({'professor': 'Deve ser PROFESSOR ou COORDENADOR'})

        # Validar que não existe solicitação PENDENTE para o mesmo TCC
        if not self.instance:
            tcc = data.get('tcc')
            pendentes = SolicitacaoOrientacao.objects.filter(
                tcc=tcc,
                status=StatusSolicitacao.PENDENTE
            )
            if pendentes.exists():
                raise serializers.ValidationError('Já existe uma solicitação pendente para este TCC')

        return data


class DocumentoTCCSerializer(serializers.ModelSerializer):
    """Serializer para Documento do TCC."""

    tcc_dados = TCCSerializer(source='tcc', read_only=True)
    enviado_por_dados = UsuarioSerializer(source='enviado_por', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_documento_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    tamanho_mb = serializers.SerializerMethodField()

    class Meta:
        model = DocumentoTCC
        fields = [
            'id',
            'tcc',
            'tcc_dados',
            'tipo_documento',
            'tipo_display',
            'arquivo',
            'nome_original',
            'tamanho',
            'tamanho_mb',
            'versao',
            'enviado_por',
            'enviado_por_dados',
            'status',
            'status_display',
            'feedback',
            'criado_em'
        ]
        read_only_fields = ['nome_original', 'tamanho', 'versao', 'enviado_por', 'criado_em']

    def get_tamanho_mb(self, obj):
        """Retorna tamanho em MB formatado."""
        return round(obj.tamanho / (1024 * 1024), 2)

    def validate(self, data):
        """Validar arquivo baseado no tipo de documento."""
        from .constants import TipoDocumento

        # Obter arquivo e tipo de documento
        arquivo = data.get('arquivo')
        tipo_documento = data.get('tipo_documento')

        if not arquivo or not tipo_documento:
            return data

        # Definir extensões e MIME types baseado no tipo de documento
        if tipo_documento == TipoDocumento.MONOGRAFIA:
            # Para monografia: aceitar apenas Word (.doc, .docx)
            extensoes = ['.doc', '.docx']
            mimes = [
                'application/msword',  # .doc
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'  # .docx
            ]
        else:
            # Para outros tipos (Plano, Termo, Apresentação, etc.): aceitar apenas PDF
            extensoes = ['.pdf']
            mimes = ['application/pdf']

        # Usar função auxiliar unificada
        try:
            validar_arquivo_documento(arquivo, extensoes, mimes)
        except serializers.ValidationError as e:
            # Re-empacotar erro no formato esperado pelo DRF
            raise serializers.ValidationError({'arquivo': str(e.detail[0])})

        return data


class EventoTimelineSerializer(serializers.ModelSerializer):
    """Serializer para Evento da Timeline."""

    tcc_dados = TCCSerializer(source='tcc', read_only=True)
    usuario_dados = UsuarioSerializer(source='usuario', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_evento_display', read_only=True)
    visibilidade_display = serializers.CharField(source='get_visibilidade_display', read_only=True)

    class Meta:
        model = EventoTimeline
        fields = [
            'id',
            'tcc',
            'tcc_dados',
            'usuario',
            'usuario_dados',
            'tipo_evento',
            'tipo_display',
            'descricao',
            'detalhes_json',
            'visibilidade',
            'visibilidade_display',
            'timestamp'
        ]
        read_only_fields = ['timestamp']

    def to_representation(self, instance):
        """Filtrar campos baseado no usuário da requisição."""
        representation = super().to_representation(instance)

        # Se o request está disponível no contexto, podemos filtrar por visibilidade
        request = self.context.get('request')
        if request and request.user:
            usuario = request.user
            visibilidade = instance.visibilidade

            # Lógica de visibilidade
            from .constants import Visibilidade

            if visibilidade == Visibilidade.COORDENADOR_APENAS:
                if usuario.tipo_usuario != 'COORDENADOR':
                    # Ocultar detalhes sensíveis
                    representation['detalhes_json'] = None

            elif visibilidade == Visibilidade.ORIENTADOR_COORDENADOR:
                tcc = instance.tcc
                eh_orientador = tcc.orientador == usuario or tcc.coorientador == usuario
                eh_coordenador = usuario.tipo_usuario == 'COORDENADOR'

                if not (eh_orientador or eh_coordenador):
                    representation['detalhes_json'] = None

        return representation


class CriarTCCSerializer(serializers.Serializer):
    """Serializer para criação de TCC com solicitação de orientação."""

    titulo = serializers.CharField(min_length=3, max_length=500)
    resumo = serializers.CharField(required=False, allow_blank=True)
    semestre = serializers.CharField(max_length=20)
    professor = serializers.IntegerField(help_text='ID do professor orientador')
    mensagem = serializers.CharField(required=False, allow_blank=True)

    # Co-orientador cadastrado no sistema (opcional)
    coorientador = serializers.IntegerField(required=False, allow_null=True, help_text='ID do co-orientador cadastrado')

    # Dados do coorientador externo (opcional - quando não é cadastrado)
    coorientador_nome = serializers.CharField(required=False, allow_blank=True, max_length=200)
    coorientador_titulacao = serializers.CharField(required=False, allow_blank=True, max_length=100)
    coorientador_afiliacao = serializers.CharField(required=False, allow_blank=True, max_length=200)
    coorientador_lattes = serializers.URLField(required=False, allow_blank=True)

    def validate_coorientador(self, value):
        """Validar que co-orientador existe e é do tipo correto."""
        if value is None:
            return None
        from users.models import Usuario
        try:
            coorientador = Usuario.objects.get(id=value)
            if coorientador.tipo_usuario not in ['PROFESSOR', 'COORDENADOR', 'AVALIADOR']:
                raise serializers.ValidationError('Co-orientador deve ser do tipo PROFESSOR, COORDENADOR ou AVALIADOR')
            return coorientador
        except Usuario.DoesNotExist:
            raise serializers.ValidationError('Co-orientador não encontrado')

    def validate_professor(self, value):
        """Validar que professor existe e é do tipo correto."""
        from users.models import Usuario
        try:
            professor = Usuario.objects.get(id=value)
            if professor.tipo_usuario not in ['PROFESSOR', 'COORDENADOR']:
                raise serializers.ValidationError('Professor deve ser do tipo PROFESSOR ou COORDENADOR')
            return professor
        except Usuario.DoesNotExist:
            raise serializers.ValidationError('Professor não encontrado')

    def validate(self, data):
        """Validar dados do TCC."""
        aluno = self.context['request'].user
        semestre = data.get('semestre')

        # Verificar se aluno já tem TCC no semestre
        if TCC.objects.filter(aluno=aluno, semestre=semestre).exists():
            raise serializers.ValidationError({'semestre': 'Você já possui TCC cadastrado neste semestre'})

        # Verificar se orientador e co-orientador não são a mesma pessoa
        professor = data.get('professor')
        coorientador = data.get('coorientador')
        if coorientador and professor and coorientador.id == professor.id:
            raise serializers.ValidationError({'coorientador': 'O co-orientador não pode ser a mesma pessoa que o orientador'})

        return data


# Serializers da Fase I

class MembroBancaSerializer(serializers.ModelSerializer):
    """Serializer para membro de banca."""

    usuario_dados = UsuarioSerializer(source='usuario', read_only=True)

    class Meta:
        model = MembroBanca
        fields = [
            'id',
            'usuario',
            'usuario_dados',
            'tipo',
            'indicado_por',
            'ordem',
            'criado_em'
        ]
        read_only_fields = ['criado_em']


class BancaFase1Serializer(serializers.ModelSerializer):
    """Serializer de leitura para Banca Fase I."""

    membros = MembroBancaSerializer(many=True, read_only=True)
    tcc_dados = TCCSerializer(source='tcc', read_only=True)
    formada_por_dados = UsuarioSerializer(source='formada_por', read_only=True)

    class Meta:
        model = BancaFase1
        fields = [
            'id',
            'tcc',
            'tcc_dados',
            'membros',
            'data_formacao',
            'formada_por',
            'formada_por_dados',
            'status',
            'criado_em',
            'atualizado_em'
        ]
        read_only_fields = ['criado_em', 'atualizado_em', 'data_formacao', 'formada_por']


class AtualizarBancaFase1Serializer(serializers.Serializer):
    """Serializer para atualizar composição da banca."""

    avaliadores = serializers.ListField(
        child=serializers.IntegerField(),
        required=True,
        help_text='Lista de IDs de professores avaliadores'
    )

    documento_avaliacao = serializers.FileField(
        required=False,
        allow_null=True,
        help_text='Documento anônimo para avaliação (PDF ou Word). Se não fornecido, usa a monografia original.'
    )

    def validate_avaliadores(self, value):
        """Validar que avaliadores existem e são professores."""
        from users.models import Usuario

        if len(value) < 2:
            raise serializers.ValidationError('A banca deve ter pelo menos 2 avaliadores')

        for avaliador_id in value:
            try:
                usuario = Usuario.objects.get(id=avaliador_id)
                if usuario.tipo_usuario not in ['PROFESSOR', 'COORDENADOR']:
                    raise serializers.ValidationError(f'Usuário {avaliador_id} não é professor')
            except Usuario.DoesNotExist:
                raise serializers.ValidationError(f'Professor {avaliador_id} não encontrado')

        return value

    def validate_documento_avaliacao(self, value):
        """Validar arquivo de avaliação (PDF ou Word)."""
        if not value:
            return value

        # Extensões e MIME types permitidos para documento de avaliação
        extensoes = ['.pdf', '.doc', '.docx']
        mimes = [
            'application/pdf',
            'application/msword',  # .doc
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'  # .docx
        ]

        # Usar função auxiliar unificada
        validar_arquivo_documento(value, extensoes, mimes)

        return value


class AvaliacaoFase1Serializer(serializers.ModelSerializer):
    """Serializer de leitura para Avaliação Fase I."""

    avaliador_dados = UsuarioSerializer(source='avaliador', read_only=True)
    tcc_dados = TCCSerializer(source='tcc', read_only=True)
    nota_final = serializers.SerializerMethodField()
    pode_editar = serializers.SerializerMethodField()
    pesos_configurados = serializers.SerializerMethodField()

    class Meta:
        model = AvaliacaoFase1
        fields = [
            'id',
            'tcc',
            'tcc_dados',
            'avaliador',
            'avaliador_dados',
            'nota_resumo',
            'nota_introducao',
            'nota_revisao',
            'nota_desenvolvimento',
            'nota_conclusoes',
            'nota_final',
            'pesos_configurados',
            'parecer',
            'status',
            'pode_editar',
            'criado_em',
            'atualizado_em',
            'enviado_em'
        ]
        read_only_fields = ['criado_em', 'atualizado_em', 'enviado_em']

    def get_nota_final(self, obj):
        """Calcula nota final como soma dos 5 critérios."""
        return obj.calcular_nota_total()

    def get_pesos_configurados(self, obj):
        """Retorna os pesos configurados no calendário para este TCC."""
        from definicoes.models import CalendarioSemestre
        calendario = CalendarioSemestre.obter_calendario_atual(obj.tcc.semestre)

        if calendario:
            return {
                'peso_resumo': float(calendario.peso_resumo),
                'peso_introducao': float(calendario.peso_introducao),
                'peso_revisao': float(calendario.peso_revisao),
                'peso_desenvolvimento': float(calendario.peso_desenvolvimento),
                'peso_conclusoes': float(calendario.peso_conclusoes),
            }
        return None

    def get_pode_editar(self, obj):
        """Determina se o avaliador pode editar esta avaliação."""
        request = self.context.get('request')
        if not request or not request.user:
            return False

        # Não pode editar se estiver bloqueada
        if obj.status == 'BLOQUEADO':
            return False

        # Não pode editar se o TCC estiver com avaliações bloqueadas
        if obj.tcc.avaliacao_fase1_bloqueada:
            return False

        # Só o avaliador pode editar sua própria avaliação
        if request.user != obj.avaliador:
            return False

        return True


class AvaliacaoFase1EscritaSerializer(serializers.ModelSerializer):
    """Serializer para criação/atualização de Avaliação Fase I."""

    class Meta:
        model = AvaliacaoFase1
        fields = [
            'nota_resumo',
            'nota_introducao',
            'nota_revisao',
            'nota_desenvolvimento',
            'nota_conclusoes',
            'parecer',
            'status'
        ]

    def validate(self, data):
        """Validar notas conforme os pesos configurados e status."""
        # Obter a instância (se estiver atualizando) para acessar o TCC
        instance = self.instance
        if instance:
            # Obter pesos do calendário do semestre do TCC
            from definicoes.models import CalendarioSemestre
            calendario = CalendarioSemestre.obter_calendario_atual(instance.tcc.semestre)

            if calendario:
                # Validar cada nota contra seu peso máximo
                validacoes = [
                    ('nota_resumo', data.get('nota_resumo'), calendario.peso_resumo, 'Resumo'),
                    ('nota_introducao', data.get('nota_introducao'), calendario.peso_introducao, 'Introdução/Relevância'),
                    ('nota_revisao', data.get('nota_revisao'), calendario.peso_revisao, 'Revisão Bibliográfica'),
                    ('nota_desenvolvimento', data.get('nota_desenvolvimento'), calendario.peso_desenvolvimento, 'Desenvolvimento'),
                    ('nota_conclusoes', data.get('nota_conclusoes'), calendario.peso_conclusoes, 'Conclusões'),
                ]

                for campo, valor, peso_max, nome_campo in validacoes:
                    if valor is not None:
                        if valor < 0:
                            raise serializers.ValidationError({campo: f'{nome_campo} não pode ser negativa'})
                        if valor > float(peso_max):
                            raise serializers.ValidationError({campo: f'{nome_campo} não pode exceder {peso_max}'})

        status_val = data.get('status')
        if status_val and status_val not in ['PENDENTE', 'ENVIADO']:
            raise serializers.ValidationError({'status': 'Status deve ser PENDENTE ou ENVIADO'})

        return data

    def update(self, instance, validated_data):
        """Atualizar avaliação e controlar enviado_em baseado no status."""
        status_val = validated_data.get('status', instance.status)

        # Se está mudando para ENVIADO, registrar timestamp
        if status_val == 'ENVIADO' and instance.status != 'ENVIADO':
            validated_data['enviado_em'] = timezone.now()
        # Se está voltando para PENDENTE, limpar timestamp
        elif status_val == 'PENDENTE':
            validated_data['enviado_em'] = None

        return super().update(instance, validated_data)


# Serializers da Fase II

class AgendamentoDefesaSerializer(serializers.ModelSerializer):
    """Serializer para Agendamento de Defesa."""

    tcc_dados = TCCSerializer(source='tcc', read_only=True)
    agendado_por_dados = UsuarioSerializer(source='agendado_por', read_only=True)

    class Meta:
        model = AgendamentoDefesa
        fields = [
            'id',
            'tcc',
            'tcc_dados',
            'data',
            'hora',
            'local',
            'agendado_por',
            'agendado_por_dados',
            'criado_em',
            'atualizado_em'
        ]
        read_only_fields = ['tcc', 'agendado_por', 'criado_em', 'atualizado_em']

    def validate(self, data):
        """Validações customizadas."""
        # Validar que a data/hora é futura (exceto se já existe agendamento)
        if not self.instance:
            from django.utils import timezone
            from datetime import datetime, time

            data_agendamento = data.get('data')
            hora_agendamento = data.get('hora')

            if data_agendamento and hora_agendamento:
                # Combinar data e hora para comparação
                data_hora_agendamento = datetime.combine(data_agendamento, hora_agendamento)
                data_hora_agendamento = timezone.make_aware(data_hora_agendamento)

                if data_hora_agendamento < timezone.now():
                    raise serializers.ValidationError({
                        'data': 'Data/hora do agendamento não pode ser no passado'
                    })

        return data


class AvaliacaoFase2Serializer(serializers.ModelSerializer):
    """Serializer de leitura para Avaliação Fase II (apresentação)."""

    avaliador_dados = UsuarioSerializer(source='avaliador', read_only=True)
    tcc_dados = TCCSerializer(source='tcc', read_only=True)
    nota_final = serializers.SerializerMethodField()
    pode_editar = serializers.SerializerMethodField()
    pesos_configurados = serializers.SerializerMethodField()

    class Meta:
        model = AvaliacaoFase2
        fields = [
            'id',
            'tcc',
            'tcc_dados',
            'avaliador',
            'avaliador_dados',
            'nota_coerencia_conteudo',
            'nota_qualidade_apresentacao',
            'nota_dominio_tema',
            'nota_clareza_fluencia',
            'nota_observancia_tempo',
            'nota_final',
            'pesos_configurados',
            'parecer',
            'status',
            'pode_editar',
            'criado_em',
            'atualizado_em',
            'enviado_em'
        ]
        read_only_fields = ['criado_em', 'atualizado_em', 'enviado_em']

    def get_nota_final(self, obj):
        """Calcula nota final como soma dos 5 critérios."""
        return obj.calcular_nota_total()

    def get_pesos_configurados(self, obj):
        """Retorna os pesos configurados no calendário para este TCC."""
        from definicoes.models import CalendarioSemestre
        calendario = CalendarioSemestre.obter_calendario_atual(obj.tcc.semestre)

        if calendario:
            return {
                'peso_coerencia_conteudo': float(calendario.peso_coerencia_conteudo),
                'peso_qualidade_apresentacao': float(calendario.peso_qualidade_apresentacao),
                'peso_dominio_tema': float(calendario.peso_dominio_tema),
                'peso_clareza_fluencia': float(calendario.peso_clareza_fluencia),
                'peso_observancia_tempo': float(calendario.peso_observancia_tempo),
            }
        return None

    def get_pode_editar(self, obj):
        """Determina se o avaliador pode editar esta avaliação."""
        request = self.context.get('request')
        if not request or not request.user:
            return False

        # Não pode editar se estiver bloqueada
        if obj.status == 'BLOQUEADO':
            return False

        # Não pode editar se o TCC estiver com avaliações da Fase II bloqueadas
        if obj.tcc.avaliacao_fase2_bloqueada:
            return False

        # Só o avaliador pode editar sua própria avaliação
        if request.user != obj.avaliador:
            return False

        # Validar que a defesa já aconteceu (data/hora já passou)
        try:
            agendamento = obj.tcc.agendamento_defesa
            from django.utils import timezone
            from datetime import datetime

            data_hora_defesa = datetime.combine(agendamento.data, agendamento.hora)
            data_hora_defesa = timezone.make_aware(data_hora_defesa)

            # Só pode avaliar DEPOIS da defesa
            if data_hora_defesa > timezone.now():
                return False
        except Exception:
            # Se não tem agendamento ou erro, não pode editar
            return False

        return True


class AvaliacaoFase2EscritaSerializer(serializers.ModelSerializer):
    """Serializer para criação/atualização de Avaliação Fase II."""

    class Meta:
        model = AvaliacaoFase2
        fields = [
            'nota_coerencia_conteudo',
            'nota_qualidade_apresentacao',
            'nota_dominio_tema',
            'nota_clareza_fluencia',
            'nota_observancia_tempo',
            'parecer',
            'status'
        ]

    def validate(self, data):
        """Validar notas conforme os pesos configurados e status."""
        # Obter a instância (se estiver atualizando) para acessar o TCC
        instance = self.instance
        if instance:
            # Obter pesos do calendário do semestre do TCC
            from definicoes.models import CalendarioSemestre
            calendario = CalendarioSemestre.obter_calendario_atual(instance.tcc.semestre)

            if calendario:
                # Validar cada nota contra seu peso máximo
                validacoes = [
                    ('nota_coerencia_conteudo', data.get('nota_coerencia_conteudo'), calendario.peso_coerencia_conteudo, 'Coerência do Conteúdo'),
                    ('nota_qualidade_apresentacao', data.get('nota_qualidade_apresentacao'), calendario.peso_qualidade_apresentacao, 'Qualidade e Estrutura da Apresentação'),
                    ('nota_dominio_tema', data.get('nota_dominio_tema'), calendario.peso_dominio_tema, 'Domínio e Conhecimento do Tema'),
                    ('nota_clareza_fluencia', data.get('nota_clareza_fluencia'), calendario.peso_clareza_fluencia, 'Clareza e Fluência Verbal'),
                    ('nota_observancia_tempo', data.get('nota_observancia_tempo'), calendario.peso_observancia_tempo, 'Observância do Tempo'),
                ]

                for campo, valor, peso_max, nome_campo in validacoes:
                    if valor is not None:
                        if valor < 0:
                            raise serializers.ValidationError({campo: f'{nome_campo} não pode ser negativa'})
                        if valor > float(peso_max):
                            raise serializers.ValidationError({campo: f'{nome_campo} não pode exceder {peso_max}'})

        status_val = data.get('status')
        if status_val and status_val not in ['PENDENTE', 'ENVIADO']:
            raise serializers.ValidationError({'status': 'Status deve ser PENDENTE ou ENVIADO'})

        return data

    def update(self, instance, validated_data):
        """Atualizar avaliação e controlar enviado_em baseado no status."""
        status_val = validated_data.get('status', instance.status)

        # Se está mudando para ENVIADO, registrar timestamp
        if status_val == 'ENVIADO' and instance.status != 'ENVIADO':
            validated_data['enviado_em'] = timezone.now()
        # Se está voltando para PENDENTE, limpar timestamp
        elif status_val == 'PENDENTE':
            validated_data['enviado_em'] = None

        return super().update(instance, validated_data)
