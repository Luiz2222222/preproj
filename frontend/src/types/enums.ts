/**
 * Enums e constantes do sistema TCC
 */

export const EtapaTCC = {
  INICIALIZACAO: 'INICIALIZACAO',
  DESENVOLVIMENTO: 'DESENVOLVIMENTO',
  FORMACAO_BANCA_FASE_1: 'FORMACAO_BANCA_FASE_1',
  AVALIACAO_FASE_1: 'AVALIACAO_FASE_1',
  VALIDACAO_FASE_1: 'VALIDACAO_FASE_1',
  AGENDAMENTO_APRESENTACAO: 'AGENDAMENTO_APRESENTACAO',
  APRESENTACAO_FASE_2: 'APRESENTACAO_FASE_2',
  APROVADO: 'APROVADO',
  ANALISE_FINAL_COORDENADOR: 'ANALISE_FINAL_COORDENADOR',
  AGUARDANDO_AJUSTES_FINAIS: 'AGUARDANDO_AJUSTES_FINAIS',
  CONCLUIDO: 'CONCLUIDO',
  DESCONTINUADO: 'DESCONTINUADO',
  REPROVADO_FASE_1: 'REPROVADO_FASE_1',
  REPROVADO_FASE_2: 'REPROVADO_FASE_2'
} as const;

export type EtapaTCC = (typeof EtapaTCC)[keyof typeof EtapaTCC];

export const StatusSolicitacao = {
  PENDENTE: 'PENDENTE',
  ACEITA: 'ACEITA',
  RECUSADA: 'RECUSADA',
  CANCELADA: 'CANCELADA'
} as const;

export type StatusSolicitacao = (typeof StatusSolicitacao)[keyof typeof StatusSolicitacao];

export const TipoDocumento = {
  PLANO_DESENVOLVIMENTO: 'PLANO_DESENVOLVIMENTO',
  TERMO_ACEITE: 'TERMO_ACEITE',
  MONOGRAFIA: 'MONOGRAFIA',
  MONOGRAFIA_AVALIACAO: 'MONOGRAFIA_AVALIACAO',
  TERMO_SOLICITACAO_AVALIACAO: 'TERMO_SOLICITACAO_AVALIACAO',
  APRESENTACAO: 'APRESENTACAO',
  ATA: 'ATA',
  RELATORIO_AVALIACAO: 'RELATORIO_AVALIACAO',
  OUTRO: 'OUTRO'
} as const;

export type TipoDocumento = (typeof TipoDocumento)[keyof typeof TipoDocumento];

export const StatusDocumento = {
  PENDENTE: 'PENDENTE',
  EM_ANALISE: 'EM_ANALISE',
  APROVADO: 'APROVADO',
  REJEITADO: 'REJEITADO'
} as const;

export type StatusDocumento = (typeof StatusDocumento)[keyof typeof StatusDocumento];

export const TipoEvento = {
  CRIACAO_TCC: 'CRIACAO_TCC',
  SOLICITACAO_ENVIADA: 'SOLICITACAO_ENVIADA',
  SOLICITACAO_ACEITA: 'SOLICITACAO_ACEITA',
  SOLICITACAO_RECUSADA: 'SOLICITACAO_RECUSADA',
  SOLICITACAO_CANCELADA: 'SOLICITACAO_CANCELADA',
  UPLOAD_DOCUMENTO: 'UPLOAD_DOCUMENTO',
  FEEDBACK_ORIENTADOR: 'FEEDBACK_ORIENTADOR',
  APROVACAO_CONTINUIDADE: 'APROVACAO_CONTINUIDADE',
  REPROVACAO_CONTINUIDADE: 'REPROVACAO_CONTINUIDADE',
  LIBERACAO_AVALIACAO: 'LIBERACAO_AVALIACAO',
  FORMACAO_BANCA: 'FORMACAO_BANCA',
  AVALIACAO_ENVIADA: 'AVALIACAO_ENVIADA',
  AVALIACAO_REABERTA: 'AVALIACAO_REABERTA',
  BLOQUEIO_AVALIACOES: 'BLOQUEIO_AVALIACOES',
  DESBLOQUEIO_AVALIACOES: 'DESBLOQUEIO_AVALIACOES',
  SOLICITACAO_AJUSTES: 'SOLICITACAO_AJUSTES',
  APROVACAO_PARCIAL: 'APROVACAO_PARCIAL',
  RESULTADO_FASE_1: 'RESULTADO_FASE_1',
  RESULTADO_FINAL: 'RESULTADO_FINAL',
  VALIDACAO_COORDENADOR: 'VALIDACAO_COORDENADOR',
  AGENDAMENTO_DEFESA: 'AGENDAMENTO_DEFESA',
  DEFESA_REALIZADA: 'DEFESA_REALIZADA',
  AJUSTES_SOLICITADOS: 'AJUSTES_SOLICITADOS',
  CONCLUSAO: 'CONCLUSAO',
  OUTRO: 'OUTRO'
} as const;

export type TipoEvento = (typeof TipoEvento)[keyof typeof TipoEvento];

export const Visibilidade = {
  TODOS: 'TODOS',
  ORIENTADOR_COORDENADOR: 'ORIENTADOR_COORDENADOR',
  COORDENADOR_APENAS: 'COORDENADOR_APENAS'
} as const;

export type Visibilidade = (typeof Visibilidade)[keyof typeof Visibilidade];

// Enums para Fase I
export const StatusBancaFase1 = {
  PENDENTE: 'PENDENTE',
  COMPLETA: 'COMPLETA'
} as const;

export type StatusBancaFase1 = (typeof StatusBancaFase1)[keyof typeof StatusBancaFase1];

export const TipoMembroBanca = {
  ORIENTADOR: 'ORIENTADOR',
  AVALIADOR: 'AVALIADOR'
} as const;

export type TipoMembroBanca = (typeof TipoMembroBanca)[keyof typeof TipoMembroBanca];

export const StatusAvaliacaoFase1 = {
  PENDENTE: 'PENDENTE',
  ENVIADO: 'ENVIADO',
  BLOQUEADO: 'BLOQUEADO',
  CONCLUIDO: 'CONCLUIDO'
} as const;

export type StatusAvaliacaoFase1 = (typeof StatusAvaliacaoFase1)[keyof typeof StatusAvaliacaoFase1];

export const IndicadoPor = {
  ORIENTADOR: 'ORIENTADOR',
  COORDENADOR: 'COORDENADOR'
} as const;

export type IndicadoPor = (typeof IndicadoPor)[keyof typeof IndicadoPor];

// Enums para Fase II
export const StatusAvaliacaoFase2 = {
  PENDENTE: 'PENDENTE',
  ENVIADO: 'ENVIADO',
  BLOQUEADO: 'BLOQUEADO',
  CONCLUIDO: 'CONCLUIDO'
} as const;

export type StatusAvaliacaoFase2 = (typeof StatusAvaliacaoFase2)[keyof typeof StatusAvaliacaoFase2];

// Labels amigáveis para exibição
export const EtapaTCCLabels: Record<EtapaTCC, string> = {
  [EtapaTCC.INICIALIZACAO]: 'Inicialização',
  [EtapaTCC.DESENVOLVIMENTO]: 'Desenvolvimento',
  [EtapaTCC.FORMACAO_BANCA_FASE_1]: 'Formação de banca - Fase 1',
  [EtapaTCC.AVALIACAO_FASE_1]: 'Avaliação - Fase 1',
  [EtapaTCC.VALIDACAO_FASE_1]: 'Validação - Fase 1',
  [EtapaTCC.AGENDAMENTO_APRESENTACAO]: 'Agendamento da apresentação',
  [EtapaTCC.APRESENTACAO_FASE_2]: 'Apresentação - Fase 2',
  [EtapaTCC.APROVADO]: 'Aprovado',
  [EtapaTCC.ANALISE_FINAL_COORDENADOR]: 'Análise final do coordenador',
  [EtapaTCC.AGUARDANDO_AJUSTES_FINAIS]: 'Aguardando ajustes finais',
  [EtapaTCC.CONCLUIDO]: 'Concluído',
  [EtapaTCC.DESCONTINUADO]: 'Descontinuado',
  [EtapaTCC.REPROVADO_FASE_1]: 'Reprovado - Fase 1',
  [EtapaTCC.REPROVADO_FASE_2]: 'Reprovado - Fase 2'
};

export const StatusSolicitacaoLabels: Record<StatusSolicitacao, string> = {
  [StatusSolicitacao.PENDENTE]: 'Pendente',
  [StatusSolicitacao.ACEITA]: 'Aceita',
  [StatusSolicitacao.RECUSADA]: 'Recusada',
  [StatusSolicitacao.CANCELADA]: 'Cancelada'
};

export const TipoDocumentoLabels: Record<TipoDocumento, string> = {
  [TipoDocumento.PLANO_DESENVOLVIMENTO]: 'Plano de desenvolvimento',
  [TipoDocumento.TERMO_ACEITE]: 'Termo de aceite',
  [TipoDocumento.MONOGRAFIA]: 'Monografia',
  [TipoDocumento.MONOGRAFIA_AVALIACAO]: 'Monografia anônima',
  [TipoDocumento.TERMO_SOLICITACAO_AVALIACAO]: 'Termo de solicitação de avaliação',
  [TipoDocumento.APRESENTACAO]: 'Apresentação',
  [TipoDocumento.ATA]: 'Ata',
  [TipoDocumento.RELATORIO_AVALIACAO]: 'Relatório de avaliação',
  [TipoDocumento.OUTRO]: 'Outro'
};

export const StatusDocumentoLabels: Record<StatusDocumento, string> = {
  [StatusDocumento.PENDENTE]: 'Pendente',
  [StatusDocumento.EM_ANALISE]: 'Em análise',
  [StatusDocumento.APROVADO]: 'Aprovado',
  [StatusDocumento.REJEITADO]: 'Rejeitado'
};

// Cores para cada etapa (para badges e indicadores visuais)
// Labels amigáveis para cursos
export const CursoLabels: Record<string, string> = {
  'ENGENHARIA_ELETRICA': 'Engenharia Elétrica',
  'ENGENHARIA_CONTROLE_AUTOMACAO': 'Engenharia de Controle e Automação'
};

export const EtapaTCCColors: Record<EtapaTCC, string> = {
  [EtapaTCC.INICIALIZACAO]: 'bg-[rgb(var(--cor-borda))]',
  [EtapaTCC.DESENVOLVIMENTO]: 'bg-[rgb(var(--cor-destaque))]',
  [EtapaTCC.FORMACAO_BANCA_FASE_1]: 'bg-[rgb(var(--cor-fase1-cabecalho))]',
  [EtapaTCC.AVALIACAO_FASE_1]: 'bg-[rgb(var(--cor-fase1-cabecalho))]',
  [EtapaTCC.VALIDACAO_FASE_1]: 'bg-[rgb(var(--cor-fase1-cabecalho))]',
  [EtapaTCC.AGENDAMENTO_APRESENTACAO]: 'bg-[rgb(var(--cor-fase2-cabecalho))]',
  [EtapaTCC.APRESENTACAO_FASE_2]: 'bg-[rgb(var(--cor-fase2-cabecalho))]',
  [EtapaTCC.APROVADO]: 'bg-[rgb(var(--cor-sucesso))]',
  [EtapaTCC.ANALISE_FINAL_COORDENADOR]: 'bg-[rgb(var(--cor-alerta))]',
  [EtapaTCC.AGUARDANDO_AJUSTES_FINAIS]: 'bg-[rgb(var(--cor-alerta))]',
  [EtapaTCC.CONCLUIDO]: 'bg-[rgb(var(--cor-sucesso))]',
  [EtapaTCC.DESCONTINUADO]: 'bg-[rgb(var(--cor-erro))]',
  [EtapaTCC.REPROVADO_FASE_1]: 'bg-[rgb(var(--cor-erro))]',
  [EtapaTCC.REPROVADO_FASE_2]: 'bg-[rgb(var(--cor-erro))]'
};
