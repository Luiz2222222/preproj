import { useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Settings,
  ClipboardCheck
} from 'lucide-react'
import { useNotificacoes } from '../contextos/NotificacoesContext'
import { TipoNotificacao } from '../types/notificacoes'

export function SidebarAvaliador() {
  const { notificacoes } = useNotificacoes()

  // Contar convites de banca não lidos
  const convitesBancaNaoLidos = useMemo(() => {
    return notificacoes.filter(
      n => n.tipo === TipoNotificacao.CONVITE_BANCA && !n.lida
    ).length
  }, [notificacoes])

  return (
    <aside className="sticky top-16 h-[calc(100vh-4rem)] w-64 bg-cor-superficie border-r border-cor-borda shadow-sm overflow-y-auto">
      <nav className="p-4 space-y-1">
        {/* Dashboard */}
        <NavLink
          to="/avaliador"
          end
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              isActive
                ? 'bg-cor-destaque text-[rgb(var(--cor-texto-sobre-destaque))] shadow-sm'
                : 'text-cor-texto hover:bg-cor-fundo'
            }`
          }
        >
          <LayoutDashboard className="h-5 w-5" />
          <span>Dashboard</span>
        </NavLink>

        {/* Participações em bancas */}
        <NavLink
          to="/avaliador/bancas"
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

        {/* Co-orientações */}
        <NavLink
          to="/avaliador/coorientacoes"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              isActive
                ? 'bg-cor-destaque text-[rgb(var(--cor-texto-sobre-destaque))] shadow-sm'
                : 'text-cor-texto hover:bg-cor-fundo'
            }`
          }
        >
          <Users className="h-5 w-5" />
          <span>Co-orientações</span>
        </NavLink>

        {/* Configurações */}
        <NavLink
          to="/avaliador/configuracoes"
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
