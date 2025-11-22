/**
 * Hook para calcular o número de ações pendentes para cada tipo de usuário
 */

import { useMemo } from 'react'
import { useMeuTCC } from './useMeuTCC'
import { useTCCsProfessor } from './useTCCsProfessor'
import { useSolicitacoesPendentesCoordenador } from './useSolicitacoesPendentesCoordenador'
import { useTCCsCoordenador } from './useTCCsCoordenador'
import { EtapaTCC, TipoDocumento, StatusDocumento } from '../types'
import type { TCC } from '../types'
import { estaBloqueado } from '../utils/permissoes'

// Helper para obter última monografia de um TCC
const getUltimaMonografia = (tcc: TCC) => {
  if (!tcc?.documentos) return null
  const monografias = tcc.documentos.filter(doc => doc.tipo_documento === TipoDocumento.MONOGRAFIA)
  if (monografias.length === 0) return null
  return monografias.sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())[0]
}

/**
 * Hook para aluno - calcula se há ação pendente de envio de monografia
 */
export function usePendingActionsAluno() {
  const { tcc } = useMeuTCC()

  const count = useMemo(() => {
    if (!tcc) return 0

    // Lógica extraída de DashboardAluno.tsx (linhas 204-229)
    const ultimaMonografia = getUltimaMonografia(tcc)

    const necessitaEnvioMonografia =
      tcc.etapa_atual === EtapaTCC.DESENVOLVIMENTO &&
      (!ultimaMonografia || ultimaMonografia.status === StatusDocumento.REJEITADO)

    const permiteEnvioMonografia = !estaBloqueado(tcc.permissoes, 'pode_enviar_monografia')

    const podeEnviarMonografia = necessitaEnvioMonografia && permiteEnvioMonografia

    return podeEnviarMonografia ? 1 : 0
  }, [tcc])

  return count
}

/**
 * Hook para professor - calcula monografias pendentes de avaliação
 */
export function usePendingActionsProfessor() {
  const { tccs } = useTCCsProfessor()

  const count = useMemo(() => {
    // Lógica extraída de DashboardProfessor.tsx (linhas 58-64)
    const orientandosComMonografiaPendente = tccs.filter((tcc) => {
      const monografia = getUltimaMonografia(tcc)
      return tcc.etapa_atual === EtapaTCC.DESENVOLVIMENTO &&
             monografia &&
             (monografia.status === StatusDocumento.PENDENTE || monografia.status === StatusDocumento.EM_ANALISE)
    })

    return orientandosComMonografiaPendente.length
  }, [tccs])

  return count
}

/**
 * Hook para coordenador - calcula todas as ações pendentes
 * (solicitações + formação de bancas + validações)
 */
export function usePendingActionsCoordenador() {
  const { solicitacoes } = useSolicitacoesPendentesCoordenador()
  const { tccs } = useTCCsCoordenador()

  const counts = useMemo(() => {
    // Lógica extraída de DashboardCoordenador.tsx (linhas 189-244)

    // Solicitações pendentes
    const solicitacoesPendentes = solicitacoes.length

    // TCCs que precisam de formação de banca
    const tccsPendentesBanca = tccs.filter(tcc => tcc.etapa_atual === EtapaTCC.FORMACAO_BANCA_FASE_1).length

    // TCCs que precisam de validação das avaliações
    const tccsPendentesValidacao = tccs.filter(tcc => tcc.etapa_atual === EtapaTCC.VALIDACAO_FASE_1).length

    // Total de ações pendentes
    const total = solicitacoesPendentes + tccsPendentesBanca + tccsPendentesValidacao

    return {
      total,
      solicitacoes: solicitacoesPendentes,
      bancas: tccsPendentesBanca,
      validacoes: tccsPendentesValidacao,
      tccs: tccsPendentesBanca + tccsPendentesValidacao // TCCs precisando de ação
    }
  }, [solicitacoes, tccs])

  return counts
}
