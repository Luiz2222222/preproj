/**
 * Serviços para operações da Fase II (Apresentação/Defesa)
 */

import api, { extrairMensagemErro } from './api';
import type {
  AvaliacaoFase2,
  EnviarAvaliacaoFase2DTO
} from '../types';

export interface AgendamentoDefesa {
  id: number;
  tcc: number;
  data: string; // ISO date string
  hora: string; // Time string (HH:MM:SS)
  local: string;
  agendado_por: number;
  criado_em: string;
  atualizado_em: string;
}

export interface AgendamentoDefesaInput {
  data: string; // YYYY-MM-DD
  hora: string; // HH:MM
  local: string;
}

/**
 * Obtém o agendamento de defesa de um TCC
 * Retorna null se ainda não houver agendamento (404 é esperado)
 */
export const obterAgendamentoDefesa = async (tccId: number): Promise<AgendamentoDefesa | null> => {
  const response = await api.get(`/tccs/${tccId}/agendamento-defesa/`, {
    validateStatus: (status) => status === 200 || status === 404,
  });
  return response.status === 404 ? null : response.data;
};

/**
 * Cria ou atualiza o agendamento de defesa
 */
export const agendarDefesa = async (
  tccId: number,
  dados: AgendamentoDefesaInput
): Promise<AgendamentoDefesa> => {
  // Verifica se já existe agendamento
  const agendamentoExistente = await obterAgendamentoDefesa(tccId);

  if (agendamentoExistente) {
    // Se existir, faz PUT para atualizar
    const response = await api.put(`/tccs/${tccId}/agendamento-defesa/`, dados);
    return response.data;
  } else {
    // Se não existir, faz POST para criar
    const response = await api.post(`/tccs/${tccId}/agendamento-defesa/`, dados);
    return response.data;
  }
};

/**
 * Obter avaliações da Fase II (apresentação)
 * GET /tccs/{id}/avaliacoes-fase2/
 */
export async function obterAvaliacoesFase2(tccId: number): Promise<AvaliacaoFase2[]> {
  try {
    const resposta = await api.get<AvaliacaoFase2[]>(`/tccs/${tccId}/avaliacoes-fase2/`);
    return resposta.data;
  } catch (erro) {
    const mensagem = extrairMensagemErro(erro);
    throw new Error(mensagem);
  }
}

/**
 * Enviar/atualizar avaliação da Fase II (apresentação)
 * POST /tccs/{id}/avaliacoes-fase2/enviar/
 * Retorna: apenas a avaliação atualizada (não um objeto com message)
 */
export async function enviarAvaliacaoFase2(
  tccId: number,
  dados: EnviarAvaliacaoFase2DTO
): Promise<AvaliacaoFase2> {
  try {
    const resposta = await api.post<AvaliacaoFase2>(
      `/tccs/${tccId}/avaliacoes-fase2/enviar/`,
      dados
    );
    return resposta.data;
  } catch (erro) {
    const mensagem = extrairMensagemErro(erro);
    throw new Error(mensagem || 'Erro ao enviar avaliação da Fase II');
  }
}

/**
 * Coordenador edita diretamente a avaliação de um avaliador na Fase II
 * POST /tccs/{id}/avaliacao-fase2/editar-coordenador/
 */
export async function editarAvaliacaoFase2Coordenador(
  tccId: number,
  avaliadorId: number,
  dados: Partial<EnviarAvaliacaoFase2DTO>
): Promise<AvaliacaoFase2> {
  try {
    const resposta = await api.post<AvaliacaoFase2>(
      `/tccs/${tccId}/avaliacao-fase2/editar-coordenador/`,
      { avaliador_id: avaliadorId, ...dados }
    );
    return resposta.data;
  } catch (erro) {
    const mensagem = extrairMensagemErro(erro);
    throw new Error(mensagem);
  }
}

/**
 * Bloquear avaliações da Fase II (coordenador)
 * POST /tccs/{id}/avaliacao-fase2/bloquear/
 */
export async function bloquearAvaliacoesFase2(tccId: number): Promise<{ message: string; avaliacoes_bloqueadas: number }> {
  try {
    const resposta = await api.post(`/tccs/${tccId}/avaliacao-fase2/bloquear/`);
    return resposta.data;
  } catch (erro) {
    const mensagem = extrairMensagemErro(erro);
    throw new Error(mensagem || 'Erro ao bloquear avaliações da Fase II');
  }
}

/**
 * Desbloquear avaliações da Fase II (coordenador)
 * POST /tccs/{id}/avaliacao-fase2/desbloquear/
 */
export async function desbloquearAvaliacoesFase2(tccId: number): Promise<{ message: string; avaliacoes_desbloqueadas: number }> {
  try {
    const resposta = await api.post(`/tccs/${tccId}/avaliacao-fase2/desbloquear/`);
    return resposta.data;
  } catch (erro) {
    const mensagem = extrairMensagemErro(erro);
    throw new Error(mensagem || 'Erro ao desbloquear avaliações da Fase II');
  }
}

/**
 * Aprovar avaliações da Fase II e calcular NF2 (coordenador)
 * POST /tccs/{id}/avaliacao-fase2/aprovar/
 */
export async function aprovarAvaliacoesFase2(tccId: number): Promise<{
  message: string;
  nf1: number;
  media_apresentacao: number;
  nf2: number;
  resultado: string;
  etapa_atual: string;
  etapa_display: string;
}> {
  try {
    const resposta = await api.post(`/tccs/${tccId}/avaliacao-fase2/aprovar/`);
    return resposta.data;
  } catch (erro) {
    const mensagem = extrairMensagemErro(erro);
    throw new Error(mensagem || 'Erro ao aprovar avaliações da Fase II');
  }
}
