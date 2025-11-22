/**
 * Tipos para Timeline Vertical Detalhada com grupos e sub-estados
 */

export const GrupoTimelineDetalhada = {
  ORIENTACAO: 'ORIENTACAO',
  DESENVOLVIMENTO: 'DESENVOLVIMENTO',
  FASE_I: 'FASE_I',
  FASE_II: 'FASE_II',
  FINALIZACAO: 'FINALIZACAO'
} as const

export type GrupoTimelineDetalhada = (typeof GrupoTimelineDetalhada)[keyof typeof GrupoTimelineDetalhada]

export const SubEstadoVisual = {
  // Orientação
  ENVIO_SOLICITACAO: 'ENVIO_SOLICITACAO',
  ACEITE_SOLICITACAO: 'ACEITE_SOLICITACAO',

  // Desenvolvimento
  ENVIO_TCC: 'ENVIO_TCC',
  TCC_APROVADO: 'TCC_APROVADO',
  CONFIRMACAO_CONTINUIDADE: 'CONFIRMACAO_CONTINUIDADE',
  ENVIO_TERMO_AVALIACAO: 'ENVIO_TERMO_AVALIACAO',

  // Fase I
  FORMACAO_BANCA: 'FORMACAO_BANCA',
  AVALIACAO_BANCA: 'AVALIACAO_BANCA',
  ANALISE_COORDENADOR: 'ANALISE_COORDENADOR',

  // Fase II
  AGENDAMENTO_DEFESA: 'AGENDAMENTO_DEFESA',
  AVALIACAO_BANCA_FASE2: 'AVALIACAO_BANCA_FASE2',

  // Finalização
  ANALISE_COORDENADOR_FINAL: 'ANALISE_COORDENADOR_FINAL',
  AJUSTES_FINAIS: 'AJUSTES_FINAIS',
  CONCLUIDO: 'CONCLUIDO'
} as const

export type SubEstadoVisual = (typeof SubEstadoVisual)[keyof typeof SubEstadoVisual]

export interface GrupoTimelineInfo {
  id: GrupoTimelineDetalhada
  numero: number
  label: string
  icone: string
  subEstados: SubEstadoInfo[]
}

export interface SubEstadoInfo {
  id: SubEstadoVisual
  label: string
  descricao?: string
}

export interface EstadoAtualInfo {
  grupo: GrupoTimelineDetalhada
  subEstado: SubEstadoVisual
  progresso: number // 0-100
  statusVisual: 'concluido' | 'em_andamento' | 'aguardando' | 'futuro' | 'problema'
  informacoesAdicionais?: {
    data?: string
    hora?: string
    local?: string
    observacao?: string
    continuidade?: boolean
  }
}
