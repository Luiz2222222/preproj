/**
 * Serviços relacionados a TCCs
 */

import api, { extrairMensagemErro } from './api';
import type { TCC } from '../types';

/**
 * Exporta dados de todos os alunos em formato ZIP
 * @returns Promise<Blob> - Arquivo ZIP para download
 */
export interface OpcoesBaixar {
  dados?: boolean;
  monografia?: boolean;
  documentos?: boolean;
}

export async function exportarDados(opcoes?: OpcoesBaixar): Promise<Blob> {
  const params = new URLSearchParams();
  if (opcoes) {
    if (opcoes.dados !== undefined) params.append('dados', String(opcoes.dados));
    if (opcoes.monografia !== undefined) params.append('monografia', String(opcoes.monografia));
    if (opcoes.documentos !== undefined) params.append('documentos', String(opcoes.documentos));
  }
  const query = params.toString();
  const url = `/tccs/exportar_dados/${query ? `?${query}` : ''}`;
  const response = await api.get(url, { responseType: 'blob' });
  return response.data;
}

/**
 * Helper para fazer download do arquivo ZIP retornado
 * @param blob - Arquivo blob
 * @param nomeArquivo - Nome do arquivo (padrão: dados_tccs.zip)
 */
/**
 * Atualiza dados de um TCC (PATCH parcial)
 * PATCH /api/tccs/{id}/
 */
export async function atualizarTCC(id: number, dados: Partial<TCC>): Promise<TCC> {
  try {
    const resposta = await api.patch<TCC>(`/tccs/${id}/`, dados);
    return resposta.data;
  } catch (erro) {
    const mensagem = extrairMensagemErro(erro);
    throw new Error(mensagem);
  }
}

export function baixarArquivoZip(blob: Blob, nomeArquivo: string = 'dados_tccs.zip'): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Exporta dados de um TCC individual em formato ZIP
 * GET /api/tccs/{id}/exportar-dados/
 */
export async function exportarDadosTCC(tccId: number, opcoes?: OpcoesBaixar): Promise<Blob> {
  const params = new URLSearchParams();
  if (opcoes) {
    if (opcoes.dados !== undefined) params.append('dados', String(opcoes.dados));
    if (opcoes.monografia !== undefined) params.append('monografia', String(opcoes.monografia));
    if (opcoes.documentos !== undefined) params.append('documentos', String(opcoes.documentos));
  }
  const query = params.toString();
  const url = `/tccs/${tccId}/exportar-dados/${query ? `?${query}` : ''}`;
  const response = await api.get(url, { responseType: 'blob' });
  return response.data;
}

/**
 * Verifica se há email configurado para reset de período
 * GET /api/tccs/verificar_email_reset/
 */
export async function verificarEmailReset(): Promise<{ email_configurado: boolean; email: string | null }> {
  const response = await api.get('/tccs/verificar_email_reset/');
  return response.data;
}

/**
 * Resetar período: faz backup, envia por email e apaga dados
 * POST /api/tccs/resetar_periodo/
 */
export async function resetarPeriodo(senha: string, emailDestino?: string): Promise<{ blob: Blob; emailEnviado: boolean }> {
  const response = await api.post('/tccs/resetar_periodo/', {
    senha,
    email_destino: emailDestino || undefined,
  }, {
    responseType: 'blob',
  });

  const emailEnviado = response.headers['x-email-enviado'] === 'true';
  return { blob: response.data, emailEnviado };
}
