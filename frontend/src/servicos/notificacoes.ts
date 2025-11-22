import api from './api';
import type { Notificacao, NotificacaoResponse, CountNaoLidas } from '../types/notificacoes';

export const notificacoesService = {
  // Listar todas as notificações (paginado)
  listarNotificacoes: async (): Promise<Notificacao[]> => {
    const response = await api.get<NotificacaoResponse>('/notificacoes/');
    return response.data.results;
  },

  // Listar apenas notificações não lidas (retorna array simples, não paginado)
  listarNaoLidas: async (): Promise<Notificacao[]> => {
    const response = await api.get<Notificacao[]>('/notificacoes/nao_lidas/');
    return response.data;
  },

  // Contar notificações não lidas
  contarNaoLidas: async (): Promise<number> => {
    const response = await api.get<CountNaoLidas>('/notificacoes/count_nao_lidas/');
    return response.data.count;
  },

  // Marcar uma notificação como lida
  marcarComoLida: async (id: number): Promise<Notificacao> => {
    const response = await api.post<Notificacao>(
      `/notificacoes/${id}/marcar_como_lida/`
    );
    return response.data;
  },

  // Marcar todas as notificações como lidas
  marcarTodasComoLidas: async (): Promise<{ message: string; count: number }> => {
    const response = await api.post(
      '/notificacoes/marcar_todas_como_lidas/'
    );
    return response.data;
  },

  // Deletar uma notificação
  deletarNotificacao: async (id: number): Promise<void> => {
    await api.delete(`/notificacoes/${id}/deletar/`);
  },

  // Deletar todas as notificações lidas
  deletarLidas: async (): Promise<{ message: string; count: number }> => {
    const response = await api.delete('/notificacoes/deletar_lidas/');
    return response.data;
  },
};
