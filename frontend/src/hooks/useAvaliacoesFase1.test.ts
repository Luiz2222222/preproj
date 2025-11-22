import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { mockAvaliacaoFase1 } from '../test/mocks/mockData'
import { StatusAvaliacaoFase1 } from '../types/enums'

// Mock dos serviços ANTES da importação do hook
vi.mock('../servicos/fase1', () => ({
  obterAvaliacoesFase1: vi.fn(),
  enviarAvaliacaoFase1: vi.fn(),
  bloquearAvaliacoesFase1: vi.fn(),
  desbloquearAvaliacoesFase1: vi.fn(),
  aprovarAvaliacoesFase1: vi.fn(),
  solicitarAjustesFase1: vi.fn(),
}))

// Mock do extrairMensagemErro
vi.mock('../servicos/api', () => ({
  extrairMensagemErro: vi.fn((err: any) => err?.message || 'Erro desconhecido'),
}))

import { useAvaliacoesFase1 } from './useAvaliacoesFase1'
import * as fase1Service from '../servicos/fase1'

const mockFase1Service = fase1Service as any

describe('useAvaliacoesFase1', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve retornar array vazio quando tccId é null', () => {
    const { result } = renderHook(() => useAvaliacoesFase1({ tccId: null }))

    expect(result.current.avaliacoes).toEqual([])
    expect(result.current.carregando).toBe(false)
  })

  it('deve carregar avaliações corretamente', async () => {
    const avaliacoes = [mockAvaliacaoFase1]
    mockFase1Service.obterAvaliacoesFase1.mockResolvedValueOnce(avaliacoes)

    const { result } = renderHook(() => useAvaliacoesFase1({ tccId: 2 }))

    expect(result.current.carregando).toBe(true)

    await waitFor(() => {
      expect(result.current.carregando).toBe(false)
    })

    expect(result.current.avaliacoes).toEqual(avaliacoes)
    expect(result.current.avaliacoes).toHaveLength(1)
    expect(result.current.erro).toBeNull()
    expect(mockFase1Service.obterAvaliacoesFase1).toHaveBeenCalledWith(2)
  })

  it('deve enviar avaliação com sucesso', async () => {
    mockFase1Service.obterAvaliacoesFase1.mockResolvedValueOnce([mockAvaliacaoFase1])

    const { result } = renderHook(() => useAvaliacoesFase1({ tccId: 2 }))

    await waitFor(() => {
      expect(result.current.carregando).toBe(false)
    })

    const avaliacaoEnviada = {
      ...mockAvaliacaoFase1,
      status: StatusAvaliacaoFase1.ENVIADO,
      nota_resumo: 0.8,
      nota_introducao: 1.6,
      nota_revisao: 1.6,
      nota_desenvolvimento: 2.8,
      nota_conclusoes: 1.2,
      nota_final: 8.0,
    }

    // enviarAvaliacaoFase1 retorna apenas a avaliação, não um objeto com message
    mockFase1Service.enviarAvaliacaoFase1.mockResolvedValueOnce(avaliacaoEnviada)
    mockFase1Service.obterAvaliacoesFase1.mockResolvedValueOnce([avaliacaoEnviada])

    await result.current.enviar({
      nota_resumo: 0.8,
      nota_introducao: 1.6,
      nota_revisao: 1.6,
      nota_desenvolvimento: 2.8,
      nota_conclusoes: 1.2,
      status: StatusAvaliacaoFase1.ENVIADO,
    })

    await waitFor(() => {
      expect(result.current.processando).toBe(false)
    })

    expect(mockFase1Service.enviarAvaliacaoFase1).toHaveBeenCalledWith(2, {
      nota_resumo: 0.8,
      nota_introducao: 1.6,
      nota_revisao: 1.6,
      nota_desenvolvimento: 2.8,
      nota_conclusoes: 1.2,
      status: StatusAvaliacaoFase1.ENVIADO,
    })

    // Deve recarregar a lista
    expect(mockFase1Service.obterAvaliacoesFase1).toHaveBeenCalledTimes(2)
  })

  it('deve bloquear avaliações com sucesso', async () => {
    mockFase1Service.obterAvaliacoesFase1.mockResolvedValueOnce([mockAvaliacaoFase1])

    const { result } = renderHook(() => useAvaliacoesFase1({ tccId: 2 }))

    await waitFor(() => {
      expect(result.current.carregando).toBe(false)
    })

    const avaliacaoBloqueada = {
      ...mockAvaliacaoFase1,
      status: StatusAvaliacaoFase1.BLOQUEADO,
    }

    mockFase1Service.bloquearAvaliacoesFase1.mockResolvedValueOnce({
      message: 'Avaliações bloqueadas',
      avaliacoes_bloqueadas: 1,
    })
    mockFase1Service.obterAvaliacoesFase1.mockResolvedValueOnce([avaliacaoBloqueada])

    const resultado = await result.current.bloquear()

    await waitFor(() => {
      expect(result.current.processando).toBe(false)
    })

    expect(resultado.avaliacoes_bloqueadas).toBe(1)
    expect(mockFase1Service.bloquearAvaliacoesFase1).toHaveBeenCalledWith(2)
    expect(mockFase1Service.obterAvaliacoesFase1).toHaveBeenCalledTimes(2)
  })

  it('deve desbloquear avaliações com sucesso', async () => {
    const avaliacaoBloqueada = {
      ...mockAvaliacaoFase1,
      status: StatusAvaliacaoFase1.BLOQUEADO,
    }

    mockFase1Service.obterAvaliacoesFase1.mockResolvedValueOnce([avaliacaoBloqueada])

    const { result } = renderHook(() => useAvaliacoesFase1({ tccId: 2 }))

    await waitFor(() => {
      expect(result.current.carregando).toBe(false)
    })

    mockFase1Service.desbloquearAvaliacoesFase1.mockResolvedValueOnce({
      message: 'Avaliações desbloqueadas',
      avaliacoes_desbloqueadas: 1,
    })
    mockFase1Service.obterAvaliacoesFase1.mockResolvedValueOnce([mockAvaliacaoFase1])

    const resultado = await result.current.desbloquear()

    await waitFor(() => {
      expect(result.current.processando).toBe(false)
    })

    expect(resultado.avaliacoes_desbloqueadas).toBe(1)
    expect(mockFase1Service.desbloquearAvaliacoesFase1).toHaveBeenCalledWith(2)
    expect(mockFase1Service.obterAvaliacoesFase1).toHaveBeenCalledTimes(2)
  })

  it('deve aprovar avaliações com sucesso', async () => {
    mockFase1Service.obterAvaliacoesFase1.mockResolvedValueOnce([mockAvaliacaoFase1])

    const { result } = renderHook(() => useAvaliacoesFase1({ tccId: 2 }))

    await waitFor(() => {
      expect(result.current.carregando).toBe(false)
    })

    mockFase1Service.aprovarAvaliacoesFase1.mockResolvedValueOnce({
      message: 'Aprovação completa concluída',
      tipo: 'completa',
      nf1: 7.5,
      resultado: 'APROVADO',
      etapa_atual: 'AGENDAMENTO_APRESENTACAO',
      etapa_display: 'Agendamento da apresentação',
    })
    mockFase1Service.obterAvaliacoesFase1.mockResolvedValueOnce([mockAvaliacaoFase1])

    const resultado = await result.current.aprovar()

    await waitFor(() => {
      expect(result.current.processando).toBe(false)
    })

    expect(resultado.tipo).toBe('completa')
    if (resultado.tipo === 'completa') {
      expect(resultado.nf1).toBe(7.5)
      expect(resultado.etapa_atual).toBe('AGENDAMENTO_APRESENTACAO')
    }
    expect(mockFase1Service.aprovarAvaliacoesFase1).toHaveBeenCalledWith(2, undefined)
    expect(mockFase1Service.obterAvaliacoesFase1).toHaveBeenCalledTimes(2)
  })

  it('deve solicitar ajustes com sucesso', async () => {
    const avaliacaoBloqueada = {
      ...mockAvaliacaoFase1,
      status: StatusAvaliacaoFase1.BLOQUEADO,
    }

    mockFase1Service.obterAvaliacoesFase1.mockResolvedValueOnce([avaliacaoBloqueada])

    const { result } = renderHook(() => useAvaliacoesFase1({ tccId: 2 }))

    await waitFor(() => {
      expect(result.current.carregando).toBe(false)
    })

    mockFase1Service.solicitarAjustesFase1.mockResolvedValueOnce({
      message: 'Ajustes solicitados',
      avaliacoes_reabertas: 1,
      avaliadores: [3],
      tcc_desbloqueado: true,
    })
    mockFase1Service.obterAvaliacoesFase1.mockResolvedValueOnce([mockAvaliacaoFase1])

    const resultado = await result.current.solicitarAjustes({
      avaliadores: [3],
      mensagem: 'Por favor, revisar nota',
    })

    await waitFor(() => {
      expect(result.current.processando).toBe(false)
    })

    expect(resultado.avaliacoes_reabertas).toBe(1)
    expect(resultado.tcc_desbloqueado).toBe(true)
    expect(mockFase1Service.solicitarAjustesFase1).toHaveBeenCalledWith(2, {
      avaliadores: [3],
      mensagem: 'Por favor, revisar nota',
    })
    expect(mockFase1Service.obterAvaliacoesFase1).toHaveBeenCalledTimes(2)
  })

  it('deve lidar com erro ao carregar avaliações', async () => {
    const errorMessage = 'Avaliações não encontradas'
    mockFase1Service.obterAvaliacoesFase1.mockRejectedValueOnce(new Error(errorMessage))

    const { result } = renderHook(() => useAvaliacoesFase1({ tccId: 2 }))

    await waitFor(() => {
      expect(result.current.carregando).toBe(false)
    })

    expect(result.current.erro).toBe(errorMessage)
    expect(result.current.avaliacoes).toEqual([])
  })

  it('não deve enviar quando tccId é null', async () => {
    const { result } = renderHook(() => useAvaliacoesFase1({ tccId: null }))

    await expect(
      result.current.enviar({
        nota_resumo: 0.8,
        status: StatusAvaliacaoFase1.ENVIADO,
      })
    ).rejects.toThrow('TCC não definido')

    expect(mockFase1Service.enviarAvaliacaoFase1).not.toHaveBeenCalled()
  })
})
