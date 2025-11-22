import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { mockDocumento } from '../test/mocks/mockData'
import { TipoDocumento } from '../types'

// Mock do módulo api ANTES da importação do hook
vi.mock('../servicos/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
  extrairMensagemErro: vi.fn((err: any) => err?.message || 'Erro desconhecido'),
}))

import { useDocumentosTCC } from './useDocumentosTCC'
import api from '../servicos/api'

const mockApi = api as any

describe('useDocumentosTCC', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve retornar array vazio quando tccId é null', () => {
    const { result } = renderHook(() => useDocumentosTCC({ tccId: null }))

    expect(result.current.documentos).toEqual([])
    expect(result.current.carregando).toBe(false)
  })

  it('deve carregar documentos corretamente', async () => {
    const documentos = [mockDocumento]
    mockApi.get.mockResolvedValueOnce({ data: documentos } as any)

    const { result } = renderHook(() => useDocumentosTCC({ tccId: 1 }))

    expect(result.current.carregando).toBe(true)

    await waitFor(() => {
      expect(result.current.carregando).toBe(false)
    })

    expect(result.current.documentos).toEqual(documentos)
    expect(result.current.documentos).toHaveLength(1)
    expect(result.current.erro).toBeNull()
    expect(mockApi.get).toHaveBeenCalledWith('/tccs/1/documentos/')
  })

  it('deve enviar documento com sucesso', async () => {
    mockApi.get.mockResolvedValueOnce({ data: [] } as any)

    const { result } = renderHook(() => useDocumentosTCC({ tccId: 1 }))

    await waitFor(() => {
      expect(result.current.carregando).toBe(false)
    })

    const arquivo = new File(['conteudo'], 'documento.pdf', { type: 'application/pdf' })

    mockApi.post.mockResolvedValueOnce({ data: mockDocumento } as any)
    mockApi.get.mockResolvedValueOnce({ data: [mockDocumento] } as any)

    await result.current.enviarDocumento(TipoDocumento.PLANO_DESENVOLVIMENTO, arquivo)

    await waitFor(() => {
      expect(result.current.enviando).toBe(false)
    })

    expect(mockApi.post).toHaveBeenCalledWith(
      '/tccs/1/documentos/',
      expect.any(FormData),
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    )

    // Deve recarregar a lista após envio
    expect(mockApi.get).toHaveBeenCalledTimes(2)
  })

  it('deve lidar com erro ao enviar documento', async () => {
    mockApi.get.mockResolvedValueOnce({ data: [] } as any)

    const { result } = renderHook(() => useDocumentosTCC({ tccId: 1 }))

    await waitFor(() => {
      expect(result.current.carregando).toBe(false)
    })

    const arquivo = new File(['conteudo'], 'documento.pdf', { type: 'application/pdf' })

    const errorMessage = 'Arquivo muito grande'
    mockApi.post.mockRejectedValueOnce(new Error(errorMessage))

    await expect(
      result.current.enviarDocumento(TipoDocumento.PLANO_DESENVOLVIMENTO, arquivo)
    ).rejects.toThrow()

    await waitFor(() => {
      expect(result.current.enviando).toBe(false)
    })
  })

  it('não deve enviar quando tccId é null', async () => {
    const { result } = renderHook(() => useDocumentosTCC({ tccId: null }))

    const arquivo = new File(['conteudo'], 'documento.pdf', { type: 'application/pdf' })

    await expect(
      result.current.enviarDocumento(TipoDocumento.PLANO_DESENVOLVIMENTO, arquivo)
    ).rejects.toThrow('TCC não definido')

    expect(mockApi.post).not.toHaveBeenCalled()
  })
})
