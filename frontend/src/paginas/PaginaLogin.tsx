import { useState, useEffect, type FormEvent } from 'react'
import { User, Lock, ChevronRight, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Alerta, ModalCadastro } from '../componentes'
import { useAutenticacao } from '../autenticacao'
import { useTema } from '../tema'

interface ErroLogin {
  mensagem: string
  tipo: 'validacao' | 'api' | 'rede'
}

export function PaginaLogin() {
  const navigate = useNavigate()
  const { login: loginAuth, estaAutenticado, usuario } = useAutenticacao()
  const { temaAtual } = useTema()
  const logoSrc = temaAtual === 'black' || temaAtual === 'dark' ? '/logo-ufpe-dark.png' : '/logo-ufpe.png'

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<ErroLogin | null>(null)
  const [lembrarMe, setLembrarMe] = useState(false)
  const [mostrarModalCadastro, setMostrarModalCadastro] = useState(false)

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (estaAutenticado && usuario) {
      const rotaPorTipo: Record<string, string> = {
        'ALUNO': '/aluno',
        'PROFESSOR': '/professor',
        'COORDENADOR': '/dashboard',
        'AVALIADOR': '/avaliador',
      }
      const rota = rotaPorTipo[usuario.tipo_usuario] || '/aluno'
      navigate(rota, { replace: true })
    }
  }, [estaAutenticado, usuario, navigate])

  const validarCampos = (): boolean => {
    if (!email.trim()) {
      setErro({ mensagem: 'Email eh obrigatorio', tipo: 'validacao' })
      return false
    }
    if (!senha.trim()) {
      setErro({ mensagem: 'Senha eh obrigatoria', tipo: 'validacao' })
      return false
    }
    return true
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErro(null)

    if (!validarCampos()) {
      return
    }

    setCarregando(true)

    try {
      await loginAuth(email, senha, lembrarMe)
      // O redirecionamento sera feito automaticamente pelo AuthProvider
    } catch (error: any) {
      setErro({
        mensagem: error.message || 'Erro ao fazer login. Tente novamente.',
        tipo: 'api',
      })
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen bg-cor-fundo text-cor-texto flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <img src={logoSrc} alt="UFPE" className="h-24 w-auto" />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-cor-texto">
          Portal TCC
        </h2>
        <p className="mt-2 text-center text-sm text-cor-texto opacity-75">
          Sistema de Gestão de Trabalhos de Conclusão de Curso
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-cor-superficie/80 backdrop-blur-sm py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-cor-borda">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {erro && (
              <Alerta tipo="erro" className="mb-4">
                {erro.mensagem}
              </Alerta>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-cor-texto">
                E-mail
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-cor-texto opacity-60" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  spellCheck={false}
                  autoCorrect="off"
                  autoCapitalize="none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={carregando}
                  className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-cor-borda rounded-lg bg-cor-superficie text-cor-texto placeholder-cor-texto placeholder:opacity-40 focus:outline-none focus:ring-2 focus:ring-cor-destaque focus:border-cor-destaque sm:text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Digite seu e-mail"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-cor-texto">
                Senha
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-cor-texto opacity-60" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  disabled={carregando}
                  className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-cor-borda rounded-lg bg-cor-superficie text-cor-texto placeholder-cor-texto placeholder:opacity-40 focus:outline-none focus:ring-2 focus:ring-cor-destaque focus:border-cor-destaque sm:text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Digite sua senha"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={lembrarMe}
                  onChange={(e) => setLembrarMe(e.target.checked)}
                  className="h-4 w-4 text-cor-destaque focus:ring-cor-destaque border-cor-borda rounded transition-colors"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-cor-texto">
                  Lembrar-me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-cor-destaque hover:opacity-90 transition-opacity">
                  Esqueceu a senha?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={carregando}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-[rgb(var(--cor-texto-sobre-destaque))] bg-cor-destaque hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cor-destaque disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {carregando ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Entrando...</span>
                  </>
                ) : (
                  <>
                    <span>Entrar</span>
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-cor-borda"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-cor-superficie text-cor-texto opacity-75">Novo usuario?</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setMostrarModalCadastro(true)}
                  className="w-full flex justify-center py-2.5 px-4 border border-cor-borda rounded-lg shadow-sm text-sm font-medium text-cor-texto bg-cor-superficie hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cor-destaque transition-colors"
                >
                  Cadastrar nova conta
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {mostrarModalCadastro && (
        <ModalCadastro onClose={() => setMostrarModalCadastro(false)} />
      )}
    </div>
  )
}
