"""
Constantes e enums utilizados no app tccs.
"""

# Etapas do TCC
class EtapaTCC:
    INICIALIZACAO = 'INICIALIZACAO'
    DESENVOLVIMENTO = 'DESENVOLVIMENTO'
    FORMACAO_BANCA_FASE_1 = 'FORMACAO_BANCA_FASE_1'
    AVALIACAO_FASE_1 = 'AVALIACAO_FASE_1'
    VALIDACAO_FASE_1 = 'VALIDACAO_FASE_1'
    AGENDAMENTO_APRESENTACAO = 'AGENDAMENTO_APRESENTACAO'
    APRESENTACAO_FASE_2 = 'APRESENTACAO_FASE_2'
    APROVADO = 'APROVADO'
    ANALISE_FINAL_COORDENADOR = 'ANALISE_FINAL_COORDENADOR'
    AGUARDANDO_AJUSTES_FINAIS = 'AGUARDANDO_AJUSTES_FINAIS'
    CONCLUIDO = 'CONCLUIDO'
    DESCONTINUADO = 'DESCONTINUADO'
    REPROVADO_FASE_1 = 'REPROVADO_FASE_1'
    REPROVADO_FASE_2 = 'REPROVADO_FASE_2'

    CHOICES = [
        (INICIALIZACAO, 'Inicialização'),
        (DESENVOLVIMENTO, 'Desenvolvimento'),
        (FORMACAO_BANCA_FASE_1, 'Formação de Banca - Fase 1'),
        (AVALIACAO_FASE_1, 'Avaliação - Fase 1'),
        (VALIDACAO_FASE_1, 'Validação - Fase 1'),
        (AGENDAMENTO_APRESENTACAO, 'Agendamento da Apresentação'),
        (APRESENTACAO_FASE_2, 'Apresentação - Fase 2'),
        (APROVADO, 'Aprovado'),
        (ANALISE_FINAL_COORDENADOR, 'Análise Final do Coordenador'),
        (AGUARDANDO_AJUSTES_FINAIS, 'Aguardando Ajustes Finais'),
        (CONCLUIDO, 'Concluído'),
        (DESCONTINUADO, 'Descontinuado'),
        (REPROVADO_FASE_1, 'Reprovado - Fase 1'),
        (REPROVADO_FASE_2, 'Reprovado - Fase 2'),
    ]


# Status de Solicitação de Orientação
class StatusSolicitacao:
    PENDENTE = 'PENDENTE'
    ACEITA = 'ACEITA'
    RECUSADA = 'RECUSADA'
    CANCELADA = 'CANCELADA'

    CHOICES = [
        (PENDENTE, 'Pendente'),
        (ACEITA, 'Aceita'),
        (RECUSADA, 'Recusada'),
        (CANCELADA, 'Cancelada'),
    ]


# Tipos de Documento
class TipoDocumento:
    PLANO_DESENVOLVIMENTO = 'PLANO_DESENVOLVIMENTO'
    TERMO_ACEITE = 'TERMO_ACEITE'
    MONOGRAFIA = 'MONOGRAFIA'
    MONOGRAFIA_AVALIACAO = 'MONOGRAFIA_AVALIACAO'
    TERMO_SOLICITACAO_AVALIACAO = 'TERMO_SOLICITACAO_AVALIACAO'
    APRESENTACAO = 'APRESENTACAO'
    ATA = 'ATA'
    RELATORIO_AVALIACAO = 'RELATORIO_AVALIACAO'
    OUTRO = 'OUTRO'

    CHOICES = [
        (PLANO_DESENVOLVIMENTO, 'Plano de Desenvolvimento'),
        (TERMO_ACEITE, 'Termo de Aceite'),
        (MONOGRAFIA, 'Monografia'),
        (MONOGRAFIA_AVALIACAO, 'Monografia para Avaliação (Anônima)'),
        (TERMO_SOLICITACAO_AVALIACAO, 'Termo de Solicitação de Avaliação'),
        (APRESENTACAO, 'Apresentação'),
        (ATA, 'Ata'),
        (RELATORIO_AVALIACAO, 'Relatório de Avaliação'),
        (OUTRO, 'Outro'),
    ]


# Status de Documento
class StatusDocumento:
    PENDENTE = 'PENDENTE'
    EM_ANALISE = 'EM_ANALISE'
    APROVADO = 'APROVADO'
    REJEITADO = 'REJEITADO'

    CHOICES = [
        (PENDENTE, 'Pendente'),
        (EM_ANALISE, 'Em Análise'),
        (APROVADO, 'Aprovado'),
        (REJEITADO, 'Rejeitado'),
    ]


# Tipos de Evento para Timeline
class TipoEvento:
    CRIACAO_TCC = 'CRIACAO_TCC'
    SOLICITACAO_ENVIADA = 'SOLICITACAO_ENVIADA'
    SOLICITACAO_ACEITA = 'SOLICITACAO_ACEITA'
    SOLICITACAO_RECUSADA = 'SOLICITACAO_RECUSADA'
    SOLICITACAO_CANCELADA = 'SOLICITACAO_CANCELADA'
    UPLOAD_DOCUMENTO = 'UPLOAD_DOCUMENTO'
    DOCUMENTO_APROVADO = 'DOCUMENTO_APROVADO'
    DOCUMENTO_REJEITADO = 'DOCUMENTO_REJEITADO'
    FEEDBACK_ORIENTADOR = 'FEEDBACK_ORIENTADOR'
    APROVACAO_CONTINUIDADE = 'APROVACAO_CONTINUIDADE'
    REPROVACAO_CONTINUIDADE = 'REPROVACAO_CONTINUIDADE'
    LIBERACAO_AVALIACAO = 'LIBERACAO_AVALIACAO'
    FORMACAO_BANCA = 'FORMACAO_BANCA'
    AVALIACAO_ENVIADA = 'AVALIACAO_ENVIADA'
    AVALIACAO_REABERTA = 'AVALIACAO_REABERTA'
    BLOQUEIO_AVALIACOES = 'BLOQUEIO_AVALIACOES'
    DESBLOQUEIO_AVALIACOES = 'DESBLOQUEIO_AVALIACOES'
    SOLICITACAO_AJUSTES = 'SOLICITACAO_AJUSTES'
    APROVACAO_PARCIAL = 'APROVACAO_PARCIAL'
    RESULTADO_FASE_1 = 'RESULTADO_FASE_1'
    FASE2_CONCLUIDA = 'FASE2_CONCLUIDA'
    RESULTADO_FINAL = 'RESULTADO_FINAL'
    VALIDACAO_COORDENADOR = 'VALIDACAO_COORDENADOR'
    AGENDAMENTO_DEFESA = 'AGENDAMENTO_DEFESA'
    DEFESA_REALIZADA = 'DEFESA_REALIZADA'
    AJUSTES_SOLICITADOS = 'AJUSTES_SOLICITADOS'
    CONCLUSAO = 'CONCLUSAO'
    OUTRO = 'OUTRO'

    CHOICES = [
        (CRIACAO_TCC, 'Criação do TCC'),
        (SOLICITACAO_ENVIADA, 'Solicitação Enviada'),
        (SOLICITACAO_ACEITA, 'Solicitação Aceita'),
        (SOLICITACAO_RECUSADA, 'Solicitação Recusada'),
        (SOLICITACAO_CANCELADA, 'Solicitação Cancelada'),
        (UPLOAD_DOCUMENTO, 'Upload de Documento'),
        (DOCUMENTO_APROVADO, 'Documento Aprovado'),
        (DOCUMENTO_REJEITADO, 'Documento Rejeitado'),
        (FEEDBACK_ORIENTADOR, 'Feedback do Orientador'),
        (APROVACAO_CONTINUIDADE, 'Aprovação de Continuidade'),
        (REPROVACAO_CONTINUIDADE, 'Reprovação de Continuidade'),
        (LIBERACAO_AVALIACAO, 'Liberação para Avaliação'),
        (FORMACAO_BANCA, 'Formação de Banca'),
        (AVALIACAO_ENVIADA, 'Avaliação Enviada'),
        (AVALIACAO_REABERTA, 'Avaliação Reaberta'),
        (BLOQUEIO_AVALIACOES, 'Bloqueio de Avaliações'),
        (DESBLOQUEIO_AVALIACOES, 'Desbloqueio de Avaliações'),
        (SOLICITACAO_AJUSTES, 'Solicitação de Ajustes'),
        (APROVACAO_PARCIAL, 'Aprovação Parcial'),
        (RESULTADO_FASE_1, 'Resultado da Fase I'),
        (FASE2_CONCLUIDA, 'Fase II Concluída'),
        (RESULTADO_FINAL, 'Resultado Final'),
        (VALIDACAO_COORDENADOR, 'Validação do Coordenador'),
        (AGENDAMENTO_DEFESA, 'Agendamento de Defesa'),
        (DEFESA_REALIZADA, 'Defesa Realizada'),
        (AJUSTES_SOLICITADOS, 'Ajustes Solicitados'),
        (CONCLUSAO, 'Conclusão'),
        (OUTRO, 'Outro'),
    ]


# Visibilidade de Eventos
class Visibilidade:
    TODOS = 'TODOS'
    ORIENTADOR_COORDENADOR = 'ORIENTADOR_COORDENADOR'
    COORDENADOR_APENAS = 'COORDENADOR_APENAS'

    CHOICES = [
        (TODOS, 'Visível para Todos'),
        (ORIENTADOR_COORDENADOR, 'Orientador e Coordenador'),
        (COORDENADOR_APENAS, 'Apenas Coordenador'),
    ]
