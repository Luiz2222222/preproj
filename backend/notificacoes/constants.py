"""
Constantes para o sistema de notificações.
"""


class TipoNotificacao:
    """
    Tipos de notificação do sistema.
    Cada tipo define um evento específico que gera notificação para os usuários.
    """

    # ============ DOCUMENTOS ============
    DOCUMENTO_ENVIADO = 'documento_enviado'
    DOCUMENTO_APROVADO = 'documento_aprovado'
    DOCUMENTO_REJEITADO = 'documento_rejeitado'
    TERMO_ENVIADO = 'termo_enviado'

    # ============ SOLICITAÇÕES DE ORIENTAÇÃO ============
    SOLICITACAO_RECEBIDA = 'solicitacao_recebida'
    SOLICITACAO_APROVADA = 'solicitacao_aprovada'
    SOLICITACAO_REJEITADA = 'solicitacao_rejeitada'
    SOLICITACAO_ENCAMINHADA = 'solicitacao_encaminhada'
    CONVITE_ALUNO = 'convite_aluno'

    # ============ BANCA E AVALIAÇÃO ============
    BANCA_FORMADA = 'banca_formada'
    BANCA_DEFINIDA = 'banca_definida'
    CONVITE_BANCA = 'convite_banca'
    AVALIACAO_RECEBIDA = 'avaliacao_recebida'
    AVALIACAO_APROVADA = 'avaliacao_aprovada'
    AVALIACAO_FASE1_COMPLETA = 'avaliacao_fase1_completa'
    AVALIACAO_FASE2_COMPLETA = 'avaliacao_fase2_completa'
    RESULTADO_FASE_1 = 'resultado_fase_1'
    RESULTADO_FASE_2 = 'resultado_fase_2'
    RESULTADO_FINAL = 'resultado_final'

    # ============ PRAZOS ============
    PRAZO_PROXIMO = 'prazo_proximo'
    PRAZO_VENCIDO = 'prazo_vencido'
    PRAZO_DOCUMENTO = 'prazo_documento'
    PRAZO_AVALIACAO = 'prazo_avaliacao'

    # ============ ETAPAS DO TCC ============
    ETAPA_ALTERADA = 'etapa_alterada'
    CONTINUIDADE_APROVADA = 'continuidade_aprovada'
    CONTINUIDADE_REJEITADA = 'continuidade_rejeitada'
    TCC_CRIADO = 'tcc_criado'
    TCC_CONCLUIDO = 'tcc_concluido'

    # ============ COORIENTAÇÃO ============
    CONVITE_COORIENTACAO = 'convite_coorientacao'
    COORIENTACAO_ACEITA = 'coorientacao_aceita'
    COORIENTACAO_RECUSADA = 'coorientacao_recusada'

    # ============ DEFESA ============
    DEFESA_AGENDADA = 'defesa_agendada'
    DEFESA_ALTERADA = 'defesa_alterada'
    DEFESA_CANCELADA = 'defesa_cancelada'

    # ============ AJUSTES ============
    AJUSTES_SOLICITADOS = 'ajustes_solicitados'
    AJUSTES_APROVADOS = 'ajustes_aprovados'

    # ============ SISTEMA ============
    MENSAGEM_SISTEMA = 'mensagem_sistema'
    ALERTA_COORDENADOR = 'alerta_coordenador'

    # Choices para Django model
    CHOICES = [
        # Documentos
        (DOCUMENTO_ENVIADO, 'Documento Enviado'),
        (DOCUMENTO_APROVADO, 'Documento Aprovado'),
        (DOCUMENTO_REJEITADO, 'Documento Rejeitado'),
        (TERMO_ENVIADO, 'Termo Enviado'),

        # Solicitações
        (SOLICITACAO_RECEBIDA, 'Solicitação Recebida'),
        (SOLICITACAO_APROVADA, 'Solicitação Aprovada'),
        (SOLICITACAO_REJEITADA, 'Solicitação Rejeitada'),
        (SOLICITACAO_ENCAMINHADA, 'Solicitação Encaminhada'),
        (CONVITE_ALUNO, 'Convite de Aluno'),

        # Banca
        (BANCA_FORMADA, 'Banca Formada'),
        (BANCA_DEFINIDA, 'Banca Definida'),
        (CONVITE_BANCA, 'Convite para Banca'),
        (AVALIACAO_RECEBIDA, 'Avaliação Recebida'),
        (AVALIACAO_APROVADA, 'Avaliação Aprovada'),
        (AVALIACAO_FASE1_COMPLETA, 'Avaliação Fase I Completa'),
        (AVALIACAO_FASE2_COMPLETA, 'Avaliação Fase II Completa'),
        (RESULTADO_FASE_1, 'Resultado Fase I'),
        (RESULTADO_FASE_2, 'Resultado Fase II'),
        (RESULTADO_FINAL, 'Resultado Final'),

        # Prazos
        (PRAZO_PROXIMO, 'Prazo Próximo'),
        (PRAZO_VENCIDO, 'Prazo Vencido'),
        (PRAZO_DOCUMENTO, 'Prazo de Documento'),
        (PRAZO_AVALIACAO, 'Prazo de Avaliação'),

        # Etapas
        (ETAPA_ALTERADA, 'Etapa Alterada'),
        (CONTINUIDADE_APROVADA, 'Continuidade Aprovada'),
        (CONTINUIDADE_REJEITADA, 'Continuidade Rejeitada'),
        (TCC_CRIADO, 'TCC Criado'),
        (TCC_CONCLUIDO, 'TCC Concluído'),

        # Coorientação
        (CONVITE_COORIENTACAO, 'Convite para Coorientação'),
        (COORIENTACAO_ACEITA, 'Coorientação Aceita'),
        (COORIENTACAO_RECUSADA, 'Coorientação Recusada'),

        # Defesa
        (DEFESA_AGENDADA, 'Defesa Agendada'),
        (DEFESA_ALTERADA, 'Defesa Alterada'),
        (DEFESA_CANCELADA, 'Defesa Cancelada'),

        # Ajustes
        (AJUSTES_SOLICITADOS, 'Ajustes Solicitados'),
        (AJUSTES_APROVADOS, 'Ajustes Aprovados'),

        # Sistema
        (MENSAGEM_SISTEMA, 'Mensagem do Sistema'),
        (ALERTA_COORDENADOR, 'Alerta ao Coordenador'),
    ]


class PrioridadeNotificacao:
    """Níveis de prioridade das notificações."""
    BAIXA = 'baixa'
    NORMAL = 'normal'
    ALTA = 'alta'
    URGENTE = 'urgente'

    CHOICES = [
        (BAIXA, 'Baixa'),
        (NORMAL, 'Normal'),
        (ALTA, 'Alta'),
        (URGENTE, 'Urgente'),
    ]
