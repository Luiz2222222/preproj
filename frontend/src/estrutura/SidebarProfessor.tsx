import { useState, useEffect } from 'react'
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

export function SidebarProfessor() {
  const [orientacoesOpen, setOrientacoesOpen] = useState(true)
  const location = useLocation()
  const pendingActionsCount = usePendingActionsProfessor()

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
            <span className="absolute right-2 h-2 w-2 bg-[rgb(var(--cor-erro))] rounded-full" />
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
            `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              isActive
                ? 'bg-cor-destaque text-[rgb(var(--cor-texto-sobre-destaque))] shadow-sm'
                : 'text-cor-texto hover:bg-cor-fundo'
            }`
          }
        >
          <ClipboardCheck className="h-5 w-5" />
          <span>Participações em bancas</span>
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
