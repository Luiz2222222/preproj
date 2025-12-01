import { useState, useEffect, useMemo } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  ClipboardCheck,
  Settings,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { usePendingActionsProfessor } from '../hooks'
import { useNotificacoes } from '../contextos/NotificacoesContext'
import { TipoNotificacao } from '../types/notificacoes'

export function SidebarProfessor() {
  const [orientacoesOpen, setOrientacoesOpen] = useState(true)
  const location = useLocation()
  const pendingActionsCount = usePendingActionsProfessor()
  const { notificacoes } = useNotificacoes()

  // Contar convites de banca não lidos
  const convitesBancaNaoLidos = useMemo(() => {
    return notificacoes.filter(
      n => n.tipo === TipoNotificacao.CONVITE_BANCA && !n.lida
    ).length
  }, [notificacoes])

  // Check if any orientacoes subitem is active
  const isOrientacoesActive = location.pathname.startsWith('/professor/orientacoes')

  // Gerenciar localStorage para marcar dashboards como visitados
  useEffect(() => {
    if (location.pathname === '/professor/dashboard' && pendingActionsCount > 0) {
      localStorage.setItem('professor-dashboard-visited', 'true')
    }
  }, [location.pathname, pendingActionsCount])

  // Verificar se deve mostrar badge
  const shouldShowBadge = (path: string) => {
    if (path === '/professor/dashboard') {
      const visited = localStorage.getItem('professor-dashboard-visited')
      return pendingActionsCount > 0 && visited !== 'true'
    }
    return false
  }

  // Pegar o número do badge
  const getBadgeCount = (path: string): number => {
    if (path === '/professor/dashboard') return pendingActionsCount
    return 0
  }

  // Limpar flag quando há novas pendências
  useEffect(() => {
    if (pendingActionsCount > 0) {
      const visited = localStorage.getItem('professor-dashboard-visited')
      if (visited === 'true') {
        localStorage.removeItem('professor-dashboard-visited')
      }
    }
  }, [pendingActionsCount])

  return (
    <aside className="sticky top-16 h-[calc(100vh-4rem)] w-64 bg-cor-superficie border-r border-cor-borda shadow-sm overflow-y-auto">
      <nav className="p-4 space-y-1">
        {/* Dashboard */}
        <NavLink
          to="/professor/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors relative ${
              isActive
                ? 'bg-cor-destaque text-[rgb(var(--cor-texto-sobre-destaque))] shadow-sm'
                : 'text-cor-texto hover:bg-cor-fundo'
            }`
          }
        >
          <LayoutDashboard className="h-5 w-5" />
          <span>Dashboard</span>
          {shouldShowBadge('/professor/dashboard') && (
            <span className="absolute right-2 min-w-[18px] h-[18px] px-1 bg-[rgb(var(--cor-erro))] rounded-full text-[10px] font-bold text-white flex items-center justify-center">
              {getBadgeCount('/professor/dashboard') > 9 ? '9+' : getBadgeCount('/professor/dashboard')}
            </span>
          )}
        </NavLink>

        {/* Orientações (Expandable) */}
        <div>
          <button
            onClick={() => setOrientacoesOpen(!orientacoesOpen)}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              isOrientacoesActive
                ? 'bg-cor-destaque text-[rgb(var(--cor-texto-sobre-destaque))] shadow-sm'
                : 'text-cor-texto hover:bg-cor-fundo'
            }`}
          >
            <BookOpen className="h-5 w-5" />
            <span className="flex-1 text-left">Orientações</span>
            {orientacoesOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          {/* Subitems */}
          {orientacoesOpen && (
            <div className="ml-6 mt-1 space-y-1">
              <NavLink
                to="/professor/orientacoes/meus-orientandos"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    isActive
                      ? 'bg-cor-destaque/20 text-cor-destaque font-medium'
                      : 'text-cor-texto hover:bg-cor-fundo'
                  }`
                }
              >
                <span>Meus orientandos</span>
              </NavLink>
              <NavLink
                to="/professor/orientacoes/coorientacoes"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    isActive
                      ? 'bg-cor-destaque/20 text-cor-destaque font-medium'
                      : 'text-cor-texto hover:bg-cor-fundo'
                  }`
                }
              >
                <span>Co-orientações</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Participações em bancas */}
        <NavLink
          to="/professor/bancas"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors relative ${
              isActive
                ? 'bg-cor-destaque text-[rgb(var(--cor-texto-sobre-destaque))] shadow-sm'
                : 'text-cor-texto hover:bg-cor-fundo'
            }`
          }
        >
          <ClipboardCheck className="h-5 w-5" />
          <span>Participações em bancas</span>
          {convitesBancaNaoLidos > 0 && (
            <span className="absolute right-2 min-w-[18px] h-[18px] px-1 bg-[rgb(var(--cor-erro))] rounded-full text-[10px] font-bold text-white flex items-center justify-center">
              {convitesBancaNaoLidos > 9 ? '9+' : convitesBancaNaoLidos}
            </span>
          )}
        </NavLink>

        {/* Configurações */}
        <NavLink
          to="/professor/configuracoes"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              isActive
                ? 'bg-cor-destaque text-[rgb(var(--cor-texto-sobre-destaque))] shadow-sm'
                : 'text-cor-texto hover:bg-cor-fundo'
            }`
          }
        >
          <Settings className="h-5 w-5" />
          <span>Configurações</span>
        </NavLink>
      </nav>
    </aside>
  )
}
