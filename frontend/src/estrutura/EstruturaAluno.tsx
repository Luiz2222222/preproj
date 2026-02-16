/**
 * Layout específico para o perfil Aluno
 * Inclui menu lateral com rotas e highlight da rota ativa
 */

import { useState, useRef, useEffect, type PropsWithChildren } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAutenticacao } from '../autenticacao'
import { LogOut, Home, FileText, FolderOpen, Info, RotateCcw, User, ChevronDown, Bell, Settings } from 'lucide-react'
import { useToast } from '../contextos/ToastProvider'
import { useNotificacoes } from '../contextos/NotificacoesContext'
import { usePendingActionsAluno } from '../hooks'
import PainelNotificacoes from '../componentes/PainelNotificacoes'
import api, { extrairMensagemErro } from '../servicos/api'
import { useTema } from '../tema'

const menuItems = [
  { path: '/aluno', label: 'Dashboard', icon: Home },
  { path: '/aluno/meu-tcc', label: 'Meu TCC', icon: FileText },
  { path: '/aluno/documentos', label: 'Documentos', icon: FolderOpen },
  { path: '/aluno/informacoes', label: 'Informações', icon: Info },
  { path: '/aluno/configuracoes', label: 'Configurações', icon: Settings },
]

export function EstruturaAluno({ children }: PropsWithChildren) {
  const location = useLocation()
  const navigate = useNavigate()
  const { usuario, logout } = useAutenticacao()
  const { temaAtual } = useTema()
  const logoSrc = temaAtual === 'black' || temaAtual === 'dark' ? '/logo-ufpe-dark.png' : '/logo-ufpe.png'
  const { sucesso, erro } = useToast()
  const { countNaoLidas, marcarTodasComoLidas } = useNotificacoes()
  const pendingActionsCount = usePendingActionsAluno()
  const [resetando, setResetando] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const notificationButtonRef = useRef<HTMLButtonElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const userButtonRef = useRef<HTMLButtonElement>(null)

  const isAtivo = (path: string) => {
    if (path === '/aluno') {
      return location.pathname === path
    }
    return location.pathname.startsWith(path)
  }

  // Gerenciar localStorage para marcar dashboards como visitados
  useEffect(() => {
    if (location.pathname === '/aluno' && pendingActionsCount > 0) {
      // Marcar como visitado quando o usuário acessa o dashboard
      localStorage.setItem('aluno-dashboard-visited', 'true')
    }
  }, [location.pathname, pendingActionsCount])

  // Verificar se deve mostrar badge (tem pendências e ainda não visitou)
  const shouldShowBadge = (path: string) => {
    if (path === '/aluno') {
      const visited = localStorage.getItem('aluno-dashboard-visited')
      return pendingActionsCount > 0 && visited !== 'true'
    }
    return false
  }

  // Pegar o número do badge
  const getBadgeCount = (path: string): number => {
    if (path === '/aluno') return pendingActionsCount
    return 0
  }

  // Limpar flag de visitado quando o contador muda (nova ação pendente)
  useEffect(() => {
    if (pendingActionsCount > 0) {
      const visited = localStorage.getItem('aluno-dashboard-visited')
      if (visited === 'true') {
        // Se estava visitado mas temos novas pendências, limpar a flag
        localStorage.removeItem('aluno-dashboard-visited')
      }
    }
  }, [pendingActionsCount])

  const getTipoUsuarioDisplay = (tipo: string) => {
    const tipos: Record<string, string> = {
      'ALUNO': 'Aluno',
      'PROFESSOR': 'Professor',
      'COORDENADOR': 'Coordenador',
      'AVALIADOR': 'Avaliador Externo'
    }
    return tipos[tipo] || tipo
  }

  const handleReset = async () => {
    try {
      setResetando(true)
      await api.post('/tccs/reset/')
      sucesso('Ambiente de TCC resetado com sucesso!')
      navigate('/aluno')
      window.location.reload()
    } catch (err) {
      const mensagem = extrairMensagemErro(err)
      erro(mensagem)
    } finally {
      setResetando(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      sucesso('Logout realizado com sucesso')
      navigate('/login')
    } catch (e) {
      erro('Erro ao fazer logout')
    }
  }

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node) &&
        userButtonRef.current &&
        !userButtonRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  return (
    <div className="min-h-screen bg-cor-fundo text-cor-texto transition-colors">
      {/* Header */}
      <header className="h-16 bg-cor-superficie border-b border-cor-borda shadow-sm sticky top-0 z-40">
        <div className="h-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-full">
            {/* Logo e Nome do Sistema */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <img src={logoSrc} alt="UFPE" className="h-10 w-auto" />
                <div>
                  <h1 className="text-lg font-bold text-cor-texto">Portal TCC</h1>
                  <p className="text-xs text-cor-texto opacity-60">DEE/UFPE</p>
                </div>
              </div>
            </div>

            {/* Ações do Header */}
            <div className="flex items-center gap-3">
              {/* Botão Reset (apenas em desenvolvimento) - transparente para gravação */}
              {import.meta.env.DEV && (
                <button
                  onClick={handleReset}
                  disabled={resetando}
                  className="p-2 rounded-lg opacity-0 hover:opacity-100 transition-opacity"
                  title="Resetar dados para teste"
                >
                  <RotateCcw className={`h-5 w-5 text-[rgb(var(--cor-alerta))] ${resetando ? 'animate-spin' : ''}`} />
                </button>
              )}

              {/* Notificações */}
              <div className="relative">
                <button
                  ref={notificationButtonRef}
                  onClick={() => {
                    if (!showNotifications) {
                      marcarTodasComoLidas()
                    }
                    setShowNotifications(!showNotifications)
                  }}
                  className="relative p-2 rounded-lg hover:bg-cor-fundo transition-colors"
                >
                  <Bell className="h-5 w-5 text-cor-texto" />
                  {countNaoLidas > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 bg-[rgb(var(--cor-erro))] rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                      {countNaoLidas > 9 ? '9+' : countNaoLidas}
                    </span>
                  )}
                </button>

                <PainelNotificacoes
                  aberto={showNotifications}
                  onFechar={() => setShowNotifications(false)}
                  anchorEl={notificationButtonRef.current}
                />
              </div>

              {/* Menu do Usuário */}
              <div className="relative">
                <button
                  ref={userButtonRef}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-cor-fundo transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium text-cor-texto">
                        {usuario?.nome_completo || 'Usuário'}
                      </p>
                      <p className="text-xs text-cor-texto opacity-60">
                        {getTipoUsuarioDisplay(usuario?.tipo_usuario || '')}
                      </p>
                    </div>
                    <div
                      className="h-9 w-9 rounded-full text-[rgb(var(--cor-texto-sobre-destaque))] flex items-center justify-center font-semibold shadow-md"
                      style={{ background: 'linear-gradient(135deg,var(--cor-brand-gradient-inicio) 0%,var(--cor-brand-gradient-fim) 100%)' }}
                    >
                      {usuario?.nome_completo?.charAt(0) || 'U'}
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-cor-texto opacity-60" />
                </button>

                {showUserMenu && (
                  <div ref={userMenuRef} className="absolute right-0 mt-2 w-56 bg-cor-superficie rounded-lg shadow-lg border border-cor-borda py-2">
                    <div className="px-4 py-2 border-b border-cor-borda">
                      <p className="text-sm font-medium text-cor-texto">{usuario?.nome_completo}</p>
                      <p className="text-xs text-cor-texto opacity-60">{usuario?.email}</p>
                    </div>
                    <Link
                      to="/perfil"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full px-4 py-2 text-left text-sm text-cor-texto hover:bg-cor-fundo flex items-center gap-2"
                    >
                      <User className="h-4 w-4" />
                      Meu Perfil
                    </Link>
                    <div className="border-t border-cor-borda mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm text-[rgb(var(--cor-erro))] hover:bg-[rgb(var(--cor-erro))]/10 flex items-center gap-2"
                      >
                        <LogOut className="h-4 w-4" />
                        Sair
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <aside className="sticky top-16 h-[calc(100vh-4rem)] w-64 bg-cor-superficie border-r border-cor-borda shadow-sm overflow-y-auto">
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const ativo = isAtivo(item.path)
              const Icon = item.icon

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={
                    ativo
                      ? 'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors bg-cor-destaque text-[rgb(var(--cor-texto-sobre-destaque))] shadow-sm relative'
                      : 'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors text-cor-texto hover:bg-cor-fundo relative'
                  }
                >
                  <Icon className="h-5 w-5" strokeWidth={1.6} />
                  <span>{item.label}</span>
                  {shouldShowBadge(item.path) && (
                    <span className="absolute right-2 min-w-[18px] h-[18px] px-1 bg-[rgb(var(--cor-erro))] rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                      {getBadgeCount(item.path) > 9 ? '9+' : getBadgeCount(item.path)}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-10">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
