import { useState } from 'react'
import api from '../servicos/api'
import axios from 'axios'

interface AvaliarDocumentoParams {
  documentoId: number
  status: 'APROVADO' | 'REJEITADO'
  parecer?: string
}

interface UseAcoesProfessorReturn {
  avaliarDocumento: (params: AvaliarDocumentoParams) => Promise<void>
  avaliando: boolean
  erro: string | null
  confirmarContinuidade: (tccId: number) => Promise<void>
  confirmandoContinuidade: boolean
  erroContinuidade: string | null
  enviarTermoAvaliacao: (tccId: number, arquivo: File) => Promise<void>
  enviandoTermo: boolean
  erroTermo: string | null
}

export function useAcoesProfessor(): UseAcoesProfessorReturn {
  const [avaliando, setAvaliando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [confirmandoContinuidade, setConfirmandoContinuidade] = useState(false)
  const [erroContinuidade, setErroContinuidade] = useState<string | null>(null)
  const [enviandoTermo, setEnviandoTermo] = useState(false)
  const [erroTermo, setErroTermo] = useState<string | null>(null)

  const avaliarDocumento = async ({ documentoId, status, parecer }: AvaliarDocumentoParams) => {
    try {
      setAvaliando(true)
      setErro(null)

      await api.patch(`/documentos/${documentoId}/`, {
        status,
        feedback: parecer
      })
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const mensagem = err.response?.data?.detail || 'Erro ao avaliar documento'
        setErro(mensagem)
        throw new Error(mensagem)
      } else {
        setErro('Erro desconhecido ao avaliar documento')
        throw err
      }
    } finally {
      setAvaliando(false)
    }
  }

  const confirmarContinuidade = async (tccId: number) => {
    try {
      setConfirmandoContinuidade(true)
      setErroContinuidade(null)

      await api.post(`/tccs/${tccId}/confirmar_continuidade/`)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const mensagem = err.response?.data?.detail || 'Erro ao confirmar continuidade'
        setErroContinuidade(mensagem)
        throw new Error(mensagem)
      } else {
        setErroContinuidade('Erro desconhecido ao confirmar continuidade')
        throw err
      }
    } finally {
      setConfirmandoContinuidade(false)
    }
  }

  const enviarTermoAvaliacao = async (tccId: number, arquivo: File) => {
    try {
      setEnviandoTermo(true)
      setErroTermo(null)

      const formData = new FormData()
      formData.append('arquivo', arquivo)

      await api.post(`/tccs/${tccId}/enviar_termo_avaliacao/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const mensagem = err.response?.data?.detail || 'Erro ao enviar termo de avaliação'
        setErroTermo(mensagem)
        throw new Error(mensagem)
      } else {
        setErroTermo('Erro desconhecido ao enviar termo de avaliação')
        throw err
      }
    } finally {
      setEnviandoTermo(false)
    }
  }

  return {
    avaliarDocumento,
    avaliando,
    erro,
    confirmarContinuidade,
    confirmandoContinuidade,
    erroContinuidade,
    enviarTermoAvaliacao,
    enviandoTermo,
    erroTermo
  }
}
