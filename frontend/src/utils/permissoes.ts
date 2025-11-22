/**
 * Helpers para verificação de permissões e bloqueios de prazo
 */
import type { PermissoesTCC } from '../types'

/**
 * Verifica se uma ação está bloqueada com base nas permissões do TCC
 */
export const estaBloqueado = (
  permissoes: PermissoesTCC | undefined,
  chave: keyof PermissoesTCC
): boolean => {
  if (!permissoes) return false
  return !permissoes[chave]
}

/**
 * Mensagens padrão de bloqueio por tipo de ação
 */
export const mensagensBloqueio = {
  envioDocumentos: 'Período de envio de documentos encerrado. Solicite ao coordenador a liberação manual.',
  monografia: 'Período de envio de monografia encerrado. Solicite ao coordenador a liberação manual.',
  continuidade: 'Período de avaliação de continuidade encerrado. Solicite ao coordenador a liberação manual.',
  avaliacaoMonografia: 'Período de solicitação de avaliação encerrado. Solicite ao coordenador a liberação manual.',
  avaliacaoFase1: 'Período de avaliação da Fase I encerrado.',
  defesas: 'Período de registro de defesas encerrado.',
  ajustes: 'Período de envio de ajustes finais encerrado.'
} as const

/**
 * Verifica se uma data já passou
 */
export const prazoExpirado = (data: string | null | undefined): boolean => {
  if (!data) return false

  try {
    const dataLimite = new Date(data)
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    dataLimite.setHours(0, 0, 0, 0)

    return hoje > dataLimite
  } catch {
    return false
  }
}

/**
 * Retorna mensagem de prazo com data formatada
 */
export const mensagemPrazoEncerrado = (data: string | null | undefined, tipo: string): string => {
  if (!data) return `Prazo de ${tipo} não configurado.`

  try {
    const [ano, mes, dia] = data.split('T')[0].split('-')
    return `Prazo de ${tipo} encerrado em ${dia}/${mes}/${ano}.`
  } catch {
    return `Prazo de ${tipo} encerrado.`
  }
}
