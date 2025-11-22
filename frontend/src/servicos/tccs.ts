/**
 * Serviços relacionados a TCCs
 */

import api from './api';

/**
 * Exporta dados de todos os alunos em formato ZIP
 * @returns Promise<Blob> - Arquivo ZIP para download
 */
export async function exportarDados(): Promise<Blob> {
  const response = await api.get('/tccs/exportar_dados/', {
    responseType: 'blob',
  });

  return response.data;
}

/**
 * Helper para fazer download do arquivo ZIP retornado
 * @param blob - Arquivo blob
 * @param nomeArquivo - Nome do arquivo (padrão: dados_tccs.zip)
 */
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
