/**
 * Funções auxiliares para Timeline Vertical Detalhada
 */

import { EtapaTCC, TipoDocumento } from '../types/enums'
import {
  GrupoTimelineDetalhada,
  SubEstadoVisual
} from '../types/timelineDetalhada'
import type { GrupoTimelineInfo, EstadoAtualInfo } from '../types/timelineDetalhada'
import type { TCC } from '../types'

// Interface para os dados do TCC necessários para determinar o sub-estado
export interface DadosTCCTimeline {
  etapa: EtapaTCC
  temDocumentos?: boolean
  temMonografia?: boolean
  temTermoAvaliacao?: boolean
  temFeedback?: boolean
  feedbackPositivo?: boolean
  continuidade_confirmada?: boolean
  liberado_avaliacao?: boolean
  dataDefesa?: string
  horaDefesa?: string
  localDefesa?: string
  bancaFormada?: boolean
  todasNotasSubmetidas?: boolean
  notaAprovada?: boolean
}

// Constantes de progresso para cada sub-estado
const PROGRESSO_ETAPAS = {
  // Orientação
  ENVIO_SOLICITACAO: 5,
  ACEITE_SOLICITACAO: 10,

  // Desenvolvimento
  ENVIO_TCC: 20,
  TCC_APROVADO: 30,
  CONFIRMACAO_CONTINUIDADE: 35,
  ENVIO_TERMO_AVALIACAO: 40,

  // Fase I
  FORMACAO_BANCA: 50,
  AVALIACAO_BANCA: 55,
  ANALISE_COORDENADOR: 60,

  // Fase II
  AGENDAMENTO_DEFESA: 70,
  AVALIACAO_BANCA_FASE2: 80,

  // Finalização
  ANALISE_COORDENADOR_FINAL: 90,
  AJUSTES_FINAIS: 95,
  CONCLUIDO: 100
} as const

// Definir todos os grupos com seus sub-estados
export const GRUPOS_TIMELINE: GrupoTimelineInfo[] = [
  {
    id: GrupoTimelineDetalhada.ORIENTACAO,
    numero: 1,
    label: 'Orientação',
    icone: 'UserCheck',
    subEstados: [
      { id: SubEstadoVisual.ENVIO_SOLICITACAO, label: 'Envio de Solicitação' },
      { id: SubEstadoVisual.ACEITE_SOLICITACAO, label: 'Aceite de Solicitação' }
    ]
  },
  {
    id: GrupoTimelineDetalhada.DESENVOLVIMENTO,
    numero: 2,
    label: 'Desenvolvimento',
    icone: 'FileText',
    subEstados: [
      { id: SubEstadoVisual.ENVIO_TCC, label: 'Envio de TCC' },
      { id: SubEstadoVisual.TCC_APROVADO, label: 'TCC Aprovado' },
      { id: SubEstadoVisual.CONFIRMACAO_CONTINUIDADE, label: 'Confirmação de Continuidade' },
      { id: SubEstadoVisual.ENVIO_TERMO_AVALIACAO, label: 'Envio do Termo de Solicitação de Avaliação' }
    ]
  },
  {
    id: GrupoTimelineDetalhada.FASE_I,
    numero: 3,
    label: 'Fase I',
    icone: 'CheckSquare',
    subEstados: [
      { id: SubEstadoVisual.FORMACAO_BANCA, label: 'Formação da Banca' },
      { id: SubEstadoVisual.AVALIACAO_BANCA, label: 'Avaliação da Banca' },
      { id: SubEstadoVisual.ANALISE_COORDENADOR, label: 'Análise do Coordenador' }
    ]
  },
  {
    id: GrupoTimelineDetalhada.FASE_II,
    numero: 4,
    label: 'Fase II',
    icone: 'Mic',
    subEstados: [
      { id: SubEstadoVisual.AGENDAMENTO_DEFESA, label: 'Agendamento da Defesa' },
      { id: SubEstadoVisual.AVALIACAO_BANCA_FASE2, label: 'Avaliação da Banca' }
    ]
  },
  {
    id: GrupoTimelineDetalhada.FINALIZACAO,
    numero: 5,
    label: 'Finalização',
    icone: 'Award',
    subEstados: [
      { id: SubEstadoVisual.ANALISE_COORDENADOR_FINAL, label: 'Análise do Coordenador' },
      { id: SubEstadoVisual.AJUSTES_FINAIS, label: 'Ajustes Finais' },
      { id: SubEstadoVisual.CONCLUIDO, label: 'Concluído' }
    ]
  }
]

// Função principal para determinar o estado atual
export function determinarEstadoAtual(dados: DadosTCCTimeline): EstadoAtualInfo {
  const { etapa } = dados

  // Mapeamento de etapas para grupos e sub-estados
  switch (etapa) {
    case EtapaTCC.INICIALIZACAO:
      // Se está em inicialização, orientador foi aceito
      return {
        grupo: GrupoTimelineDetalhada.ORIENTACAO,
        subEstado: SubEstadoVisual.ACEITE_SOLICITACAO,
        progresso: PROGRESSO_ETAPAS.ACEITE_SOLICITACAO,
        statusVisual: 'em_andamento'
      }

    case EtapaTCC.DESENVOLVIMENTO:
      // Verificar os sub-estados de desenvolvimento na ordem correta
      if (dados.temTermoAvaliacao) {
        // Já enviou o termo de avaliação
        return {
          grupo: GrupoTimelineDetalhada.DESENVOLVIMENTO,
          subEstado: SubEstadoVisual.ENVIO_TERMO_AVALIACAO,
          progresso: PROGRESSO_ETAPAS.ENVIO_TERMO_AVALIACAO,
          statusVisual: 'em_andamento'
        }
      }

      if (dados.continuidade_confirmada) {
        // Continuidade confirmada, aguardando envio do termo
        return {
          grupo: GrupoTimelineDetalhada.DESENVOLVIMENTO,
          subEstado: SubEstadoVisual.ENVIO_TERMO_AVALIACAO,
          progresso: PROGRESSO_ETAPAS.ENVIO_TERMO_AVALIACAO,
          statusVisual: 'aguardando'
        }
      }

      if (dados.feedbackPositivo) {
        // TCC foi aprovado pelo orientador
        return {
          grupo: GrupoTimelineDetalhada.DESENVOLVIMENTO,
          subEstado: SubEstadoVisual.TCC_APROVADO,
          progresso: PROGRESSO_ETAPAS.TCC_APROVADO,
          statusVisual: 'em_andamento'
        }
      }

      if (dados.temMonografia) {
        // TCC foi enviado, aguardando aprovação
        return {
          grupo: GrupoTimelineDetalhada.DESENVOLVIMENTO,
          subEstado: SubEstadoVisual.TCC_APROVADO,
          progresso: PROGRESSO_ETAPAS.TCC_APROVADO,
          statusVisual: 'aguardando'
        }
      }

      // Aguardando envio do TCC
      return {
        grupo: GrupoTimelineDetalhada.DESENVOLVIMENTO,
        subEstado: SubEstadoVisual.ENVIO_TCC,
        progresso: PROGRESSO_ETAPAS.ENVIO_TCC,
        statusVisual: 'aguardando'
      }

    case EtapaTCC.FORMACAO_BANCA_FASE_1:
      return {
        grupo: GrupoTimelineDetalhada.FASE_I,
        subEstado: SubEstadoVisual.FORMACAO_BANCA,
        progresso: PROGRESSO_ETAPAS.FORMACAO_BANCA,
        statusVisual: 'em_andamento'
      }

    case EtapaTCC.AVALIACAO_FASE_1:
      return {
        grupo: GrupoTimelineDetalhada.FASE_I,
        subEstado: SubEstadoVisual.AVALIACAO_BANCA,
        progresso: PROGRESSO_ETAPAS.AVALIACAO_BANCA,
        statusVisual: 'em_andamento'
      }

    case EtapaTCC.VALIDACAO_FASE_1:
      return {
        grupo: GrupoTimelineDetalhada.FASE_I,
        subEstado: SubEstadoVisual.ANALISE_COORDENADOR,
        progresso: PROGRESSO_ETAPAS.ANALISE_COORDENADOR,
        statusVisual: 'em_andamento'
      }

    case EtapaTCC.AGENDAMENTO_APRESENTACAO:
      return {
        grupo: GrupoTimelineDetalhada.FASE_II,
        subEstado: SubEstadoVisual.AGENDAMENTO_DEFESA,
        progresso: PROGRESSO_ETAPAS.AGENDAMENTO_DEFESA,
        statusVisual: 'em_andamento',
        informacoesAdicionais: dados.dataDefesa ? {
          data: dados.dataDefesa,
          hora: dados.horaDefesa,
          local: dados.localDefesa
        } : undefined
      }

    case EtapaTCC.APRESENTACAO_FASE_2:
      return {
        grupo: GrupoTimelineDetalhada.FASE_II,
        subEstado: SubEstadoVisual.AVALIACAO_BANCA_FASE2,
        progresso: PROGRESSO_ETAPAS.AVALIACAO_BANCA_FASE2,
        statusVisual: 'em_andamento'
      }

    case EtapaTCC.ANALISE_FINAL_COORDENADOR:
      return {
        grupo: GrupoTimelineDetalhada.FINALIZACAO,
        subEstado: SubEstadoVisual.ANALISE_COORDENADOR_FINAL,
        progresso: PROGRESSO_ETAPAS.ANALISE_COORDENADOR_FINAL,
        statusVisual: 'em_andamento'
      }

    case EtapaTCC.AGUARDANDO_AJUSTES_FINAIS:
      return {
        grupo: GrupoTimelineDetalhada.FINALIZACAO,
        subEstado: SubEstadoVisual.AJUSTES_FINAIS,
        progresso: PROGRESSO_ETAPAS.AJUSTES_FINAIS,
        statusVisual: 'em_andamento'
      }

    case EtapaTCC.CONCLUIDO:
      return {
        grupo: GrupoTimelineDetalhada.FINALIZACAO,
        subEstado: SubEstadoVisual.CONCLUIDO,
        progresso: PROGRESSO_ETAPAS.CONCLUIDO,
        statusVisual: 'concluido'
      }

    // Estados de problema
    case EtapaTCC.DESCONTINUADO:
      return {
        grupo: GrupoTimelineDetalhada.DESENVOLVIMENTO,
        subEstado: SubEstadoVisual.CONFIRMACAO_CONTINUIDADE,
        progresso: PROGRESSO_ETAPAS.CONFIRMACAO_CONTINUIDADE,
        statusVisual: 'problema'
      }

    case EtapaTCC.REPROVADO_FASE_1:
      return {
        grupo: GrupoTimelineDetalhada.FASE_I,
        subEstado: SubEstadoVisual.ANALISE_COORDENADOR,
        progresso: PROGRESSO_ETAPAS.ANALISE_COORDENADOR,
        statusVisual: 'problema'
      }

    case EtapaTCC.REPROVADO_FASE_2:
      return {
        grupo: GrupoTimelineDetalhada.FASE_II,
        subEstado: SubEstadoVisual.AVALIACAO_BANCA_FASE2,
        progresso: PROGRESSO_ETAPAS.AVALIACAO_BANCA_FASE2,
        statusVisual: 'problema'
      }

    default:
      // Default: aguardando envio de solicitação
      return {
        grupo: GrupoTimelineDetalhada.ORIENTACAO,
        subEstado: SubEstadoVisual.ENVIO_SOLICITACAO,
        progresso: PROGRESSO_ETAPAS.ENVIO_SOLICITACAO,
        statusVisual: 'futuro'
      }
  }
}

// Função para obter status de cada grupo baseado no estado atual
export function obterStatusGrupo(
  grupoId: GrupoTimelineDetalhada,
  estadoAtual: EstadoAtualInfo
): 'concluido' | 'em_andamento' | 'aguardando' | 'futuro' | 'problema' {
  const ordemGrupos = [
    GrupoTimelineDetalhada.ORIENTACAO,
    GrupoTimelineDetalhada.DESENVOLVIMENTO,
    GrupoTimelineDetalhada.FASE_I,
    GrupoTimelineDetalhada.FASE_II,
    GrupoTimelineDetalhada.FINALIZACAO
  ]

  const indiceAtual = ordemGrupos.indexOf(estadoAtual.grupo)
  const indiceGrupo = ordemGrupos.indexOf(grupoId)

  // Se o estado atual é problema, o grupo afetado também é problema
  if (estadoAtual.statusVisual === 'problema' && estadoAtual.grupo === grupoId) {
    return 'problema'
  }

  // Grupo atual
  if (indiceGrupo === indiceAtual) {
    return estadoAtual.statusVisual as any
  }

  // Grupos anteriores
  if (indiceGrupo < indiceAtual) {
    return 'concluido'
  }

  // Grupos futuros
  return 'futuro'
}

// Função auxiliar para extrair dados do TCC
export function extrairDadosTCC(tcc: TCC): DadosTCCTimeline {
  const temMonografia = tcc.documentos?.some(
    doc => doc.tipo_documento === TipoDocumento.MONOGRAFIA
  ) || false

  const temTermoAvaliacao = tcc.documentos?.some(
    doc => doc.tipo_documento === TipoDocumento.TERMO_SOLICITACAO_AVALIACAO
  ) || false

  const temFeedback = tcc.documentos?.some(
    doc => doc.feedback && doc.feedback.trim() !== ''
  ) || false

  // feedbackPositivo apenas para documentos MONOGRAFIA aprovados
  const feedbackPositivo = tcc.documentos?.some(
    doc => doc.tipo_documento === TipoDocumento.MONOGRAFIA && doc.status === 'APROVADO'
  ) || false

  return {
    etapa: tcc.etapa_atual,
    temMonografia,
    temTermoAvaliacao,
    temDocumentos: (tcc.documentos?.length || 0) > 0,
    temFeedback,
    feedbackPositivo,
    continuidade_confirmada: tcc.flag_continuidade || false,
    liberado_avaliacao: tcc.flag_liberado_avaliacao || false,
    dataDefesa: tcc.data_defesa,
    horaDefesa: tcc.hora_defesa,
    localDefesa: tcc.local_defesa,
    bancaFormada: false, // TODO: verificar se existe campo para isso
    todasNotasSubmetidas: false,
    notaAprovada: false
  }
}
