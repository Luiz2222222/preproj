import { useState, useCallback, useEffect } from 'react'
import api from '../servicos/api'
import axios from 'axios'
import type { TCC } from '../types'

interface UseTCCProfessorDetalheReturn {
  tcc: TCC | null
  carregando: boolean
  erro: string | null
  naoEncontrado: boolean
  recarregar: () => Promise<void>
}

export function useTCCProfessorDetalhe(tccId: number | null): UseTCCProfessorDetalheReturn {
  const [tcc, setTcc] = useState<TCC | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [naoEncontrado, setNaoEncontrado] = useState(false)

  const buscarTCC = useCallback(async () => {
    if (!tccId) {
      setTcc(null)
      setCarregando(false)
      setErro(null)
      setNaoEncontrado(false)
      return
    }

    try {
      setCarregando(true)
      setErro(null)
      setNaoEncontrado(false)

      const response = await api.get(`/tccs/${tccId}/`)
      setTcc(response.data)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 404) {
          setNaoEncontrado(true)
          setErro('TCC não encontrado')
        } else {
          setErro(err.response?.data?.detail || 'Erro ao carregar detalhes do TCC')
        }
      } else {
        setErro('Erro desconhecido ao carregar TCC')
      }
      setTcc(null)
    } finally {
      setCarregando(false)
    }
  }, [tccId])

  // Carregar automaticamente quando tccId mudar
  useEffect(() => {
    buscarTCC()
  }, [buscarTCC])

  return {
    tcc,
    carregando,
    erro,
    naoEncontrado,
    recarregar: buscarTCC
  }
}
