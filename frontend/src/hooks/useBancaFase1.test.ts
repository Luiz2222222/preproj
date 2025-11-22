import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { mockBancaFase1 } from '../test/mocks/mockData'
import { StatusBancaFase1 } from '../types/enums'

// Mock dos serviços ANTES da importação do hook
vi.mock('../servicos/fase1', () => ({
  obterBancaFase1: vi.fn(),
  atualizarBancaFase1: vi.fn(),
  concluirFormacaoBancaFase1: vi.fn(),
}))

// Mock do extrairMensagemErro
vi.mock('../servicos/api', () => ({
  extrairMensagemErro: vi.fn((err: any) => err?.message || 'Erro desconhecido'),
}))

import { useBancaFase1 } from './useBancaFase1'
import * as fase1Service from '../servicos/fase1'

const mockFase1Service = fase1Service as any

describe('useBancaFase1', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve retornar null quando tccId é null', () => {
    const { result } = renderHook(() => useBancaFase1({ tccId: null }))

    expect(result.current.banca).toBeNull()
    expect(result.current.carregando).toBe(false)
  })

  it('deve carregar banca corretamente', async () => {
    mockFase1Service.obterBancaFase1.mockResolvedValueOnce(mockBancaFase1)

    const { result } = renderHook(() => useBancaFase1({ tccId: 2 }))

    expect(result.current.carregando).toBe(true)

    await waitFor(() => {
      expect(result.current.carregando).toBe(false)
    })

    expect(result.current.banca).toEqual(mockBancaFase1)
    expect(result.current.erro).toBeNull()
    expect(mockFase1Service.obterBancaFase1).toHaveBeenCalledWith(2)
  })

  it('deve atualizar banca com sucesso', async () => {
    const bancaInicial = { ...mockBancaFase1 }

    mockFase1Service.obterBancaFase1.mockResolvedValueOnce(bancaInicial)

    const { result } = renderHook(() => useBancaFase1({ tccId: 2 }))

    await waitFor(() => {
      expect(result.current.carregando).toBe(false)
    })

    const bancaAtualizada = {
      ...mockBancaFase1,
      membros: [mockBancaFase1.membros[0]],
    }

    mockFase1Service.atualizarBancaFase1.mockResolvedValueOnce(bancaAtualizada)

    await result.current.atualizarBanca({ avaliadores: [3] })

    await waitFor(() => {
      expect(result.current.processando).toBe(false)
    })

    expect(mockFase1Service.atualizarBancaFase1).toHaveBeenCalledWith(2, { avaliadores: [3] })
    expect(result.current.banca).toEqual(bancaAtualizada)
  })

  it('deve concluir formação com sucesso', async () => {
    const bancaPendente = { ...mockBancaFase1, status: StatusBancaFase1.PENDENTE }
    const bancaConcluida = { ...mockBancaFase1, status: StatusBancaFase1.COMPLETA }

    mockFase1Service.obterBancaFase1.mockResolvedValueOnce(bancaPendente)
    mockFase1Service.concluirFormacaoBancaFase1.mockResolvedValueOnce({
      message: 'Formação concluída',
      banca: bancaConcluida,
    })

    const { result } = renderHook(() => useBancaFase1({ tccId: 2 }))

    await waitFor(() => {
      expect(result.current.carregando).toBe(false)
    })

    expect(result.current.banca?.status).toBe(StatusBancaFase1.PENDENTE)

    await result.current.concluirFormacao()

    await waitFor(() => {
      expect(result.current.processando).toBe(false)
    })

    expect(mockFase1Service.concluirFormacaoBancaFase1).toHaveBeenCalledWith(2, undefined)

    await waitFor(() => {
      expect(result.current.banca?.status).toBe(StatusBancaFase1.COMPLETA)
    })
  })

  it('deve lidar com erro ao carregar banca', async () => {
    const errorMessage = 'Banca não encontrada'
    mockFase1Service.obterBancaFase1.mockRejectedValueOnce(new Error(errorMessage))

    const { result } = renderHook(() => useBancaFase1({ tccId: 2 }))

    await waitFor(() => {
      expect(result.current.carregando).toBe(false)
    })

    expect(result.current.erro).toBe(errorMessage)
    expect(result.current.banca).toBeNull()
  })

  it('deve lidar com erro ao atualizar banca', async () => {
    mockFase1Service.obterBancaFase1.mockResolvedValueOnce(mockBancaFase1)

    const { result } = renderHook(() => useBancaFase1({ tccId: 2 }))

    await waitFor(() => {
      expect(result.current.carregando).toBe(false)
    })

    const errorMessage = 'Não é possível atualizar a banca'
    mockFase1Service.atualizarBancaFase1.mockRejectedValueOnce(new Error(errorMessage))

    await expect(result.current.atualizarBanca({ avaliadores: [3] })).rejects.toThrow()

    await waitFor(() => {
      expect(result.current.processando).toBe(false)
    })

    await waitFor(() => {
      expect(result.current.erro).toBe(errorMessage)
    })
  })

  it('não deve atualizar quando tccId é null', async () => {
    const { result } = renderHook(() => useBancaFase1({ tccId: null }))

    await expect(result.current.atualizarBanca({ avaliadores: [3] })).rejects.toThrow(
      'TCC não definido'
    )

    expect(mockFase1Service.atualizarBancaFase1).not.toHaveBeenCalled()
  })

  it('não deve concluir formação quando tccId é null', async () => {
    const { result } = renderHook(() => useBancaFase1({ tccId: null }))

    await expect(result.current.concluirFormacao()).rejects.toThrow('TCC não definido')

    expect(mockFase1Service.concluirFormacaoBancaFase1).not.toHaveBeenCalled()
  })
})
