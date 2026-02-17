import api from './api'
import type { Aviso, ComentarioAviso } from '../types/avisos'

export const avisosService = {
  listar: async (): Promise<Aviso[]> => {
    const response = await api.get('/avisos/')
    const data = response.data
    return Array.isArray(data) ? data : data.results ?? []
  },

  criar: async (data: { titulo: string; mensagem: string; destinatarios: string[]; cor: string; fixado: boolean }): Promise<Aviso> => {
    const response = await api.post<Aviso>('/avisos/', data)
    return response.data
  },

  editar: async (id: number, data: Partial<{ titulo: string; mensagem: string; destinatarios: string[]; cor: string; fixado: boolean }>): Promise<Aviso> => {
    const response = await api.patch<Aviso>(`/avisos/${id}/`, data)
    return response.data
  },

  apagar: async (id: number): Promise<void> => {
    await api.delete(`/avisos/${id}/`)
  },

  comentar: async (avisoId: number, texto: string): Promise<ComentarioAviso> => {
    const response = await api.post<ComentarioAviso>(`/avisos/${avisoId}/comentarios/`, { texto })
    return response.data
  },

  apagarComentario: async (avisoId: number, comentarioId: number): Promise<void> => {
    await api.delete(`/avisos/${avisoId}/comentarios/${comentarioId}/`)
  },
}
