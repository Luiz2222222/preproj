import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { mockEvento } from '../test/mocks/mockData'
import { TipoEvento } from '../types'

// Mock do módulo api ANTES da importação do hook
vi.mock('../servicos/api', () => ({
  default: {
    get: vi.fn(),
  },
  extrairMensagemErro: vi.fn((err: any) => err?.message || 'Erro desconhecido'),
}))

import { useTimelineTCC } from './useTimelineTCC'
import api from '../servicos/api'

const mockApi = api as any

describe('useTimelineTCC', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve retornar array vazio quando tccId é null', () => {
    const { result } = renderHook(() => useTimelineTCC({ tccId: null }))

    expect(result.current.eventos).toEqual([])
    expect(result.current.carregando).toBe(false)
  })

  it('deve carregar eventos da timeline corretamente', async () => {
    const eventos = [
      mockEvento,
      {
        ...mockEvento,
        id: 2,
        tipo_evento: TipoEvento.SOLICITACAO_ENVIADA,
        tipo_display: 'Solicitação Enviada',
        descricao: 'Solicitação enviada ao professor',
      },
    ]
    mockApi.get.mockResolvedValueOnce({ data: eventos } as any)

    const { result } = renderHook(() => useTimelineTCC({ tccId: 1 }))

    expect(result.current.carregando).toBe(true)

    await waitFor(() => {
      expect(result.current.carregando).toBe(false)
    })

    expect(result.current.eventos).toEqual(eventos)
    expect(result.current.eventos).toHaveLength(2)
    expect(result.current.erro).toBeNull()
    expect(mockApi.get).toHaveBeenCalledWith('/tccs/1/timeline/')
  })

  it('deve lidar com erro ao carregar timeline', async () => {
    const errorMessage = 'Erro ao carregar timeline'
    mockApi.get.mockRejectedValueOnce(new Error(errorMessage))

    const { result } = renderHook(() => useTimelineTCC({ tccId: 1 }))

    await waitFor(() => {
      expect(result.current.carregando).toBe(false)
    })

    expect(result.current.eventos).toEqual([])
    expect(result.current.erro).toBeTruthy()
  })

  it('deve permitir recarregar timeline', async () => {
    mockApi.get.mockResolvedValueOnce({ data: [mockEvento] } as any)

    const { result } = renderHook(() => useTimelineTCC({ tccId: 1 }))

    await waitFor(() => {
      expect(result.current.carregando).toBe(false)
    })

    expect(result.current.eventos).toHaveLength(1)

    // Adicionar novo evento
    const novosEventos = [
      mockEvento,
      {
        ...mockEvento,
        id: 2,
        tipo_evento: TipoEvento.UPLOAD_DOCUMENTO,
        descricao: 'Documento enviado',
      },
    ]
    mockApi.get.mockResolvedValueOnce({ data: novosEventos } as any)

    await result.current.recarregar()

    await waitFor(() => {
      expect(result.current.eventos).toHaveLength(2)
    })

    expect(mockApi.get).toHaveBeenCalledTimes(2)
  })

  it('não deve carregar automaticamente se autoCarregar for false', () => {
    const { result } = renderHook(() =>
      useTimelineTCC({ tccId: 1, autoCarregar: false })
    )

    expect(result.current.carregando).toBe(false)
    expect(result.current.eventos).toEqual([])
    expect(mockApi.get).not.toHaveBeenCalled()
  })
})
