/**
 * Serviços para endpoints da Fase I (Banca e Avaliações)
 */

import api, { extrairMensagemErro } from './api';
import type {
  TCC,
  BancaFase1,
  AvaliacaoFase1,
  AtualizarBancaFase1DTO,
  EnviarAvaliacaoFase1DTO,
  SolicitarAjustesFase1DTO,
  AprovarAvaliacoesFase1DTO,
  ConcluirFormacaoBancaResponse,
  BloquearAvaliacoesResponse,
  DesbloquearAvaliacoesResponse,
  SolicitarAjustesResponse,
  AprovarAvaliacoesResponse
} from '../types';

/**
 * Obter dados da banca da Fase I
 * GET /tccs/{id}/banca-fase1/
 */
export async function obterBancaFase1(tccId: number): Promise<BancaFase1> {
  try {
    const resposta = await api.get<BancaFase1>(`/tccs/${tccId}/banca-fase1/`);
    return resposta.data;
  } catch (erro) {
    const mensagem = extrairMensagemErro(erro);
    throw new Error(mensagem);
  }
}

/**
 * Atualizar composição da banca da Fase I
 * PUT /tccs/{id}/banca-fase1/
 */
export async function atualizarBancaFase1(
  tccId: number,
  dados: AtualizarBancaFase1DTO
): Promise<BancaFase1> {
  try {
    const resposta = await api.put<BancaFase1>(`/tccs/${tccId}/banca-fase1/`, dados);
    return resposta.data;
  } catch (erro) {
    const mensagem = extrairMensagemErro(erro);
    throw new Error(mensagem);
  }
}

/**
 * Concluir formação da banca da Fase I
 * POST /tccs/{id}/banca-fase1/concluir/
 * @param arquivoAnonimo - Arquivo opcional para avaliação anônima (PDF ou Word)
 */
export async function concluirFormacaoBancaFase1(
  tccId: number,
  arquivoAnonimo?: File
): Promise<ConcluirFormacaoBancaResponse> {
  try {
    let dados: any;
    let headers: any = {};

    if (arquivoAnonimo) {
      // Se tem arquivo, usar FormData
      const formData = new FormData();
      formData.append('documento_avaliacao', arquivoAnonimo);
      dados = formData;
      headers['Content-Type'] = 'multipart/form-data';
    }

    const resposta = await api.post<ConcluirFormacaoBancaResponse>(
      `/tccs/${tccId}/banca-fase1/concluir/`,
      dados,
      { headers }
    );
    return resposta.data;
  } catch (erro) {
    const mensagem = extrairMensagemErro(erro);
    throw new Error(mensagem);
  }
}

/**
 * Obter avaliações da Fase I
 * GET /tccs/{id}/avaliacoes-fase1/
 */
export async function obterAvaliacoesFase1(tccId: number): Promise<AvaliacaoFase1[]> {
  try {
    const resposta = await api.get<AvaliacaoFase1[]>(`/tccs/${tccId}/avaliacoes-fase1/`);
    return resposta.data;
  } catch (erro) {
    const mensagem = extrairMensagemErro(erro);
    throw new Error(mensagem);
  }
}

/**
 * Enviar/atualizar avaliação da Fase I
 * POST /tccs/{id}/avaliacoes-fase1/enviar/
 * Retorna: apenas a avaliação atualizada (não um objeto com message)
 */
export async function enviarAvaliacaoFase1(
  tccId: number,
  dados: EnviarAvaliacaoFase1DTO
): Promise<AvaliacaoFase1> {
  try {
    const resposta = await api.post<AvaliacaoFase1>(
      `/tccs/${tccId}/avaliacoes-fase1/enviar/`,
      dados
    );
    return resposta.data;
  } catch (erro) {
    const mensagem = extrairMensagemErro(erro);
    throw new Error(mensagem);
  }
}

/**
 * Bloquear avaliações da Fase I
 * POST /tccs/{id}/avaliacao-fase1/bloquear/
 */
export async function bloquearAvaliacoesFase1(
  tccId: number
): Promise<BloquearAvaliacoesResponse> {
  try {
    const resposta = await api.post<BloquearAvaliacoesResponse>(
      `/tccs/${tccId}/avaliacao-fase1/bloquear/`
    );
    return resposta.data;
  } catch (erro) {
    const mensagem = extrairMensagemErro(erro);
    throw new Error(mensagem);
  }
}

/**
 * Desbloquear avaliações da Fase I
 * POST /tccs/${id}/avaliacao-fase1/desbloquear/
 */
export async function desbloquearAvaliacoesFase1(
  tccId: number
): Promise<DesbloquearAvaliacoesResponse> {
  try {
    const resposta = await api.post<DesbloquearAvaliacoesResponse>(
      `/tccs/${tccId}/avaliacao-fase1/desbloquear/`
    );
    return resposta.data;
  } catch (erro) {
    const mensagem = extrairMensagemErro(erro);
    throw new Error(mensagem);
  }
}

/**
 * Aprovar avaliações da Fase I (parcial ou completa)
 * POST /tccs/{id}/aprovar-avaliacoes-fase1/
 */
export async function aprovarAvaliacoesFase1(
  tccId: number,
  dados?: AprovarAvaliacoesFase1DTO
): Promise<AprovarAvaliacoesResponse> {
  try {
    const resposta = await api.post<AprovarAvaliacoesResponse>(
      `/tccs/${tccId}/aprovar-avaliacoes-fase1/`,
      dados || {}
    );
    return resposta.data;
  } catch (erro) {
    const mensagem = extrairMensagemErro(erro);
    throw new Error(mensagem);
  }
}

/**
 * Solicitar ajustes nas avaliações da Fase I
 * POST /tccs/{id}/solicitar-ajustes-fase1/
 */
export async function solicitarAjustesFase1(
  tccId: number,
  dados: SolicitarAjustesFase1DTO
): Promise<SolicitarAjustesResponse> {
  try {
    const resposta = await api.post<SolicitarAjustesResponse>(
      `/tccs/${tccId}/solicitar-ajustes-fase1/`,
      dados
    );
    return resposta.data;
  } catch (erro) {
    const mensagem = extrairMensagemErro(erro);
    throw new Error(mensagem);
  }
}

/**
 * Coordenador edita diretamente a avaliação de um avaliador na Fase I
 * POST /tccs/{id}/avaliacao-fase1/editar-coordenador/
 */
export async function editarAvaliacaoFase1Coordenador(
  tccId: number,
  avaliadorId: number,
  dados: Partial<EnviarAvaliacaoFase1DTO>
): Promise<AvaliacaoFase1> {
  try {
    const resposta = await api.post<AvaliacaoFase1>(
      `/tccs/${tccId}/avaliacao-fase1/editar-coordenador/`,
      { avaliador_id: avaliadorId, ...dados }
    );
    return resposta.data;
  } catch (erro) {
    const mensagem = extrairMensagemErro(erro);
    throw new Error(mensagem);
  }
}

/**
 * Obter TCCs para avaliar (onde o professor é membro da banca)
 * GET /tccs/avaliar/
 */
export async function obterTCCsParaAvaliar(): Promise<TCC[]> {
  try {
    const resposta = await api.get<TCC[]>('/tccs/avaliar/');
    return resposta.data;
  } catch (erro) {
    const mensagem = extrairMensagemErro(erro);
    throw new Error(mensagem);
  }
}
