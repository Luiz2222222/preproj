import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Bell,
  User,
  LogOut,
  ChevronDown,
  Menu,
  X
} from 'lucide-react'
import { useAutenticacao } from '../autenticacao'
import { useTema } from '../tema'
import { useToast } from '../contextos/ToastProvider'
import { useNotificacoes } from '../contextos/NotificacoesContext'
import PainelNotificacoes from '../componentes/PainelNotificacoes'

export function HeaderCoord() {
  const navigate = useNavigate()
  const { usuario, logout } = useAutenticacao()
  const { temaAtual } = useTema()
  const logoSrc = temaAtual === 'black' || temaAtual === 'dark' ? '/logo-ufpe-dark.png' : '/logo-ufpe.png'
  const { sucesso, erro } = useToast()
  const { countNaoLidas, marcarTodasComoLidas } = useNotificacoes()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const notificationButtonRef = useRef<HTMLButtonElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const userButtonRef = useRef<HTMLButtonElement>(null)

  const handleLogout = async () => {
    try {
      await logout()
      sucesso('Logout realizado com sucesso')
      navigate('/login')
    } catch (error) {
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
    <header className="h-16 bg-cor-superficie border-b border-cor-borda shadow-sm sticky top-0 z-40">
      <div className="h-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-full">
          {/* Logo e Nome do Sistema */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-cor-fundo"
            >
              {mobileMenuOpen ? <X className="h-5 w-5 text-cor-texto" /> : <Menu className="h-5 w-5 text-cor-texto" />}
            </button>

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
                    <p className="text-xs text-cor-texto opacity-60">Coordenador</p>
                  </div>
                  <div
                    className="h-9 w-9 rounded-full flex items-center justify-center text-[rgb(var(--cor-texto-sobre-destaque))] font-semibold shadow-md"
                    style={{ background: 'linear-gradient(135deg,var(--cor-brand-gradient-inicio) 0%,var(--cor-brand-gradient-fim) 100%)' }}
                  >
                    {usuario?.nome_completo?.charAt(0) || 'C'}
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
  )
}
