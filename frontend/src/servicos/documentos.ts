import api from './api';

/**
 * Interface para Documento de Referência
 */
export interface DocumentoReferencia {
  id: number;
  tipo: string;
  arquivo: string | null;
  arquivo_url: string | null;
  arquivo_nome: string | null;
  atualizado_em: string;
  atualizado_por: string | null;
}

/**
 * Interface para resposta paginada da API
 */
interface RespostaPaginada<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Lista todos os documentos de referência
 */
export async function listarDocumentosReferencia(): Promise<DocumentoReferencia[]> {
  const response = await api.get<DocumentoReferencia[] | RespostaPaginada<DocumentoReferencia>>('/config/documentos-referencia/');

  // Normalizar resposta: se for array, retorna direto; se for objeto paginado, retorna results
  if (Array.isArray(response.data)) {
    return response.data;
  }

  return response.data.results || [];
}

/**
 * Faz upload de um documento de referência
 */
export async function uploadDocumentoReferencia(
  tipo: string,
  arquivo: File
): Promise<DocumentoReferencia> {
  const formData = new FormData();
  formData.append('tipo', tipo);
  formData.append('arquivo', arquivo);

  const response = await api.post<DocumentoReferencia>('/config/documentos-referencia/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

/**
 * Atualiza um documento de referência existente
 */
export async function atualizarDocumentoReferencia(
  id: number,
  arquivo: File
): Promise<DocumentoReferencia> {
  const formData = new FormData();
  formData.append('arquivo', arquivo);

  const response = await api.patch<DocumentoReferencia>(`/config/documentos-referencia/${id}/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

/**
 * Remove um documento de referência
 */
export async function removerDocumentoReferencia(id: number): Promise<void> {
  await api.delete(`/config/documentos-referencia/${id}/`);
}
