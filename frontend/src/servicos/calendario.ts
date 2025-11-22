import api from './api';
import type { CalendarioSemestre, CodigoCadastro } from '../types/calendario';

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
 * Busca o calendário acadêmico ativo atual
 */
export async function buscarCalendarioAtual(): Promise<CalendarioSemestre> {
  const response = await api.get<CalendarioSemestre>('/config/calendario/atual/');
  return response.data;
}

/**
 * Salva/atualiza o calendário acadêmico
 */
export async function salvarCalendario(
  id: number,
  payload: Partial<CalendarioSemestre>
): Promise<CalendarioSemestre> {
  const response = await api.put<CalendarioSemestre>(`/config/calendario/${id}/`, payload);
  return response.data;
}

/**
 * Cria um novo calendário acadêmico
 */
export async function criarCalendario(
  payload: Partial<CalendarioSemestre>
): Promise<CalendarioSemestre> {
  const response = await api.post<CalendarioSemestre>('/config/calendario/', payload);
  return response.data;
}

/**
 * Lista todos os códigos de cadastro
 * Normaliza a resposta para sempre retornar um array
 */
export async function listarCodigosCadastro(): Promise<CodigoCadastro[]> {
  const response = await api.get<CodigoCadastro[] | RespostaPaginada<CodigoCadastro>>('/config/codigos/');

  // Normalizar resposta: se for array, retorna direto; se for objeto paginado, retorna results
  if (Array.isArray(response.data)) {
    return response.data;
  }

  // Se for objeto paginado, retorna results (ou array vazio se não existir)
  return response.data.results || [];
}

/**
 * Atualiza um código de cadastro específico
 */
export async function atualizarCodigoCadastro(
  id: number,
  codigo: string
): Promise<CodigoCadastro> {
  const response = await api.patch<CodigoCadastro>(`/config/codigos/${id}/`, { codigo });
  return response.data;
}
