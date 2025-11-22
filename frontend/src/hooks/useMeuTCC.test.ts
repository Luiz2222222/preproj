import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { mockTCCPendente, mockTCCDesenvolvimento } from '../test/mocks/mockData'

// Mock do módulo api ANTES da importação do hook
vi.mock('../servicos/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
  extrairMensagemErro: vi.fn((err: any) => err?.message || 'Erro desconhecido'),
}))

import { useMeuTCC } from './useMeuTCC'
import api from '../servicos/api'

const mockApi = api as any

describe('useMeuTCC', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve retornar null quando não há TCC', async () => {
    mockApi.get.mockResolvedValueOnce({ data: null } as any)

    const { result } = renderHook(() => useMeuTCC())

    expect(result.current.carregando).toBe(true)

    await waitFor(() => {
      expect(result.current.carregando).toBe(false)
    })

    expect(result.current.tcc).toBeNull()
    expect(result.current.erro).toBeNull()
    expect(mockApi.get).toHaveBeenCalledWith('/tccs/meu/')
  })

  it('deve carregar TCC pendente corretamente', async () => {
    mockApi.get.mockResolvedValueOnce({ data: mockTCCPendente } as any)

    const { result } = renderHook(() => useMeuTCC())

    await waitFor(() => {
      expect(result.current.carregando).toBe(false)
    })

    expect(result.current.tcc).toEqual(mockTCCPendente)
    expect(result.current.tcc?.solicitacao_pendente_id).toBe(1)
    expect(result.current.erro).toBeNull()
  })

  it('deve carregar TCC em desenvolvimento corretamente', async () => {
    mockApi.get.mockResolvedValueOnce({ data: mockTCCDesenvolvimento } as any)

    const { result } = renderHook(() => useMeuTCC())

    await waitFor(() => {
      expect(result.current.carregando).toBe(false)
    })

    expect(result.current.tcc).toEqual(mockTCCDesenvolvimento)
    expect(result.current.tcc?.orientador_dados?.nome_completo).toBe('Professor Teste')
    expect(result.current.tcc?.solicitacao_pendente_id).toBeNull()
    expect(result.current.erro).toBeNull()
  })

  it('deve lidar com erro de rede', async () => {
    const errorMessage = 'Erro de conexão'
    mockApi.get.mockRejectedValueOnce(new Error(errorMessage))

    const { result } = renderHook(() => useMeuTCC())

    await waitFor(() => {
      expect(result.current.carregando).toBe(false)
    })

    expect(result.current.tcc).toBeNull()
    expect(result.current.erro).toBeTruthy()
  })

  it('deve permitir recarregar os dados', async () => {
    mockApi.get.mockResolvedValueOnce({ data: mockTCCPendente } as any)

    const { result } = renderHook(() => useMeuTCC())

    await waitFor(() => {
      expect(result.current.carregando).toBe(false)
    })

    // Simular mudança de dados
    mockApi.get.mockResolvedValueOnce({ data: mockTCCDesenvolvimento } as any)

    await result.current.recarregar()

    await waitFor(() => {
      expect(result.current.tcc).toEqual(mockTCCDesenvolvimento)
    })

    expect(mockApi.get).toHaveBeenCalledTimes(2)
  })
})
