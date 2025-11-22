import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AutenticacaoContexto } from './autenticacaoContexto'
import { useTema } from '../tema'
import type { UsuarioLogado, RespostaLogin } from './tipos'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8500/api'

interface ProvedorAutenticacaoProps {
  children: ReactNode
}

export function ProvedorAutenticacao({ children }: ProvedorAutenticacaoProps) {
  const navigate = useNavigate()
  const { definirTema, definirTamanhoFonte } = useTema()

  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    buscarPerfilUsuario()
  }, [])

  const buscarPerfilUsuario = async () => {
    try {
      const resposta = await fetch(`${API_BASE_URL}/auth/profile/`, {
        credentials: 'include',
      })

      if (resposta.ok) {
        const dados: UsuarioLogado = await resposta.json()
        setUsuario(dados)

        if (dados.preferencias_visuais) {
          definirTema(dados.preferencias_visuais.tema)
          definirTamanhoFonte(dados.preferencias_visuais.tamanho_fonte)
        }
      } else if (resposta.status === 401) {
        // Tentar refresh
        try {
          const refreshResp = await fetch(`${API_BASE_URL}/auth/refresh/`, {
            method: 'POST',
            credentials: 'include',
          })

          if (refreshResp.ok) {
            await buscarPerfilUsuario()
          } else {
            setUsuario(null)
          }
        } catch {
          setUsuario(null)
        }
      }
    } catch (erro) {
      console.error('Erro ao buscar perfil:', erro)
      setUsuario(null)
    } finally {
      setCarregando(false)
    }
  }

  const login = useCallback(async (email: string, senha: string, lembrarMe: boolean = false) => {
    setCarregando(true)

    try {
      const resposta = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password: senha,
          remember_me: lembrarMe
        }),
      })

      if (!resposta.ok) {
        const dados = await resposta.json()
        throw new Error(dados.detail || 'Email ou senha inválidos')
      }

      const dados: RespostaLogin = await resposta.json()
      setUsuario(dados.user)

      if (dados.user.preferencias_visuais) {
        definirTema(dados.user.preferencias_visuais.tema)
        definirTamanhoFonte(dados.user.preferencias_visuais.tamanho_fonte)
      }

      setCarregando(false)  // ✅ IMPORTANTE: Define como false após sucesso
      redirecionarPorTipo(dados.user.tipo_usuario)
    } catch (erro) {
      setCarregando(false)
      throw erro
    }
  }, [definirTema, definirTamanhoFonte, navigate])

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout/`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch (erro) {
      console.error('Erro ao fazer logout:', erro)
    } finally {
      setUsuario(null)
      navigate('/login')
    }
  }, [navigate])

  const redirecionarPorTipo = (tipoUsuario: string) => {
    const rotas: Record<string, string> = {
      'ALUNO': '/aluno',
      'PROFESSOR': '/professor',
      'COORDENADOR': '/dashboard',
      'AVALIADOR': '/avaliador',
    }
    navigate(rotas[tipoUsuario] || '/aluno')
  }

  const estaAutenticado = useMemo(() => !!usuario, [usuario])

  const contexto = useMemo(
    () => ({
      usuario,
      tokens: null,
      carregando,
      login,
      logout,
      atualizarToken: async () => {},
      estaAutenticado,
    }),
    [usuario, carregando, login, logout, estaAutenticado]
  )

  return (
    <AutenticacaoContexto.Provider value={contexto}>
      {children}
    </AutenticacaoContexto.Provider>
  )
}
