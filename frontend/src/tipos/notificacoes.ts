export interface Notificacao {
  id: number;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  action_url: string | null;
  metadata: Record<string, any> | null;
  tcc: number | null;
  prioridade: string;
  criado_em: string;
  lido_em: string | null;
}

export const TipoNotificacao = {
  DOCUMENTO_ENVIADO: 'documento_enviado',
  SOLICITACAO_APROVADA: 'solicitacao_aprovada',
  SOLICITACAO_RECUSADA: 'solicitacao_recusada',
  BANCA_DEFINIDA: 'banca_definida',
  AVALIACAO_ENVIADA: 'avaliacao_enviada',
  AVALIACAO_APROVADA: 'avaliacao_aprovada',
  RESULTADO_FASE_1: 'resultado_fase_1',
  DEFESA_AGENDADA: 'defesa_agendada',
  RESULTADO_FINAL: 'resultado_final',
  TCC_CONCLUIDO: 'tcc_concluido',
  PRAZO_PROXIMO: 'prazo_proximo',
  MUDANCA_ETAPA: 'mudanca_etapa',
} as const;
export type TipoNotificacao = (typeof TipoNotificacao)[keyof typeof TipoNotificacao];

export const PrioridadeNotificacao = {
  BAIXA: 'baixa',
  NORMAL: 'normal',
  ALTA: 'alta',
  URGENTE: 'urgente',
} as const;
export type PrioridadeNotificacao = (typeof PrioridadeNotificacao)[keyof typeof PrioridadeNotificacao];

export interface NotificacaoResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Notificacao[];
}

export interface CountNaoLidas {
  count: number;
}
