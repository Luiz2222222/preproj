import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Users,
  Calendar,
  Settings,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileSpreadsheet,
  Megaphone,
  UserCheck,
  GraduationCap,
  Building2
} from 'lucide-react'
import { usePendingActionsCoordenador } from '../hooks'

interface MenuItem {
  label: string
  icon: React.ElementType
  path?: string
  submenu?: MenuItem[]
}

export function SidebarCoord() {
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])
  const location = useLocation()
  const pendingCounts = usePendingActionsCoordenador()

  // Gerenciar localStorage para cada página
  useEffect(() => {
    if (location.pathname === '/dashboard' && pendingCounts.total > 0) {
      localStorage.setItem('coord-dashboard-visited', 'true')
    }
    if (location.pathname === '/solicitacoes' && pendingCounts.solicitacoes > 0) {
      localStorage.setItem('coord-solicitacoes-visited', 'true')
    }
    if (location.pathname === '/tccs' && pendingCounts.tccs > 0) {
      localStorage.setItem('coord-tccs-visited', 'true')
    }
  }, [location.pathname, pendingCounts])

  // Verificar se deve mostrar badge
  const shouldShowBadge = (path: string) => {
    if (path === '/dashboard') {
      const visited = localStorage.getItem('coord-dashboard-visited')
      return pendingCounts.total > 0 && visited !== 'true'
    }
    if (path === '/solicitacoes') {
      const visited = localStorage.getItem('coord-solicitacoes-visited')
      return pendingCounts.solicitacoes > 0 && visited !== 'true'
    }
    if (path === '/tccs') {
      const visited = localStorage.getItem('coord-tccs-visited')
      return pendingCounts.tccs > 0 && visited !== 'true'
    }
    return false
  }

  // Pegar o número do badge
  const getBadgeCount = (path: string): number => {
    if (path === '/dashboard') return pendingCounts.total
    if (path === '/solicitacoes') return pendingCounts.solicitacoes
    if (path === '/tccs') return pendingCounts.tccs
    return 0
  }

  // Limpar flags quando há novas pendências
  useEffect(() => {
    if (pendingCounts.total > 0) {
      const visitedDash = localStorage.getItem('coord-dashboard-visited')
      if (visitedDash === 'true') {
        localStorage.removeItem('coord-dashboard-visited')
      }
    }
    if (pendingCounts.solicitacoes > 0) {
      const visitedSol = localStorage.getItem('coord-solicitacoes-visited')
      if (visitedSol === 'true') {
        localStorage.removeItem('coord-solicitacoes-visited')
      }
    }
    if (pendingCounts.tccs > 0) {
      const visitedTccs = localStorage.getItem('coord-tccs-visited')
      if (visitedTccs === 'true') {
        localStorage.removeItem('coord-tccs-visited')
      }
    }
  }, [pendingCounts])

  const menuItems: MenuItem[] = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'TCCs', icon: FileText, path: '/tccs' },
    { label: 'Relatórios', icon: FileSpreadsheet, path: '/relatorios' },
    { label: 'Solicitações', icon: ClipboardList, path: '/solicitacoes' },
    { label: 'Mural de avisos', icon: Megaphone, path: '/avisos' },
    {
      label: 'Usuários',
      icon: Users,
      submenu: [
        { label: 'Professores', icon: UserCheck, path: '/usuarios/professores' },
        { label: 'Alunos', icon: GraduationCap, path: '/usuarios/alunos' },
        { label: 'Membros Externos', icon: Building2, path: '/usuarios/externos' }
      ]
    },
    { label: 'Planejamento', icon: Calendar, path: '/planejamento' },
    { label: 'Configurações', icon: Settings, path: '/configuracoes' }
  ]

  const toggleSubmenu = (label: string) => {
    setExpandedMenus(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    )
  }

  return (
    <aside className="sticky top-16 h-[calc(100vh-4rem)] w-64 bg-cor-superficie border-r border-cor-borda shadow-sm overflow-y-auto">
      <nav className="p-4 space-y-1">
        {menuItems.map((item) => (
          <div key={item.label}>
            {item.submenu ? (
              <>
                <button
                  onClick={() => toggleSubmenu(item.label)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-cor-texto rounded-lg hover:bg-cor-fundo transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 text-cor-texto opacity-60" />
                    <span>{item.label}</span>
                  </div>
                  {expandedMenus.includes(item.label) ? (
                    <ChevronDown className="h-4 w-4 text-cor-texto opacity-60" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-cor-texto opacity-60" />
                  )}
                </button>
                {expandedMenus.includes(item.label) && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.submenu.map((subitem) => (
                      <NavLink
                        key={subitem.path}
                        to={subitem.path || '#'}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                            isActive
                              ? 'bg-cor-destaque text-[rgb(var(--cor-texto-sobre-destaque))] font-medium shadow-sm'
                              : 'text-cor-texto hover:bg-cor-fundo'
                          }`
                        }
                      >
                        <subitem.icon className="h-4 w-4" />
                        <span>{subitem.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <NavLink
                to={item.path || '#'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors relative ${
                    isActive
                      ? 'bg-cor-destaque text-[rgb(var(--cor-texto-sobre-destaque))] shadow-sm'
                      : 'text-cor-texto hover:bg-cor-fundo'
                  }`
                }
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
                {item.path && shouldShowBadge(item.path) && (
                  <span className="absolute right-2 min-w-[18px] h-[18px] px-1 bg-[rgb(var(--cor-erro))] rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                    {getBadgeCount(item.path) > 9 ? '9+' : getBadgeCount(item.path)}
                  </span>
                )}
              </NavLink>
            )}
          </div>
        ))}
      </nav>
    </aside>
  )
}
