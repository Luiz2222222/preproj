import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, FileText, History, Settings, ClipboardCheck } from 'lucide-react';

interface SidebarAvaliadorProps {
  isOpen: boolean;
}

export function SidebarAvaliador({ isOpen }: SidebarAvaliadorProps) {
  const menuItems = [
    { path: '/avaliador', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/avaliador/cronograma', label: 'Cronograma', icon: Calendar },
    { path: '/avaliador/parecer', label: 'Parecer', icon: FileText },
    { path: '/avaliador/bancas', label: 'Participações em bancas', icon: ClipboardCheck },
    { path: '/avaliador/historico', label: 'Histórico', icon: History },
    { path: '/avaliador/configuracoes', label: 'Configurações', icon: Settings },
  ];

  if (!isOpen) return null;

  return (
    <aside className="sticky top-16 h-[calc(100vh-4rem)] w-64 bg-cor-superficie border-r border-cor-borda overflow-y-auto">
      <nav className="p-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive
                  ? 'bg-cor-destaque text-[rgb(var(--cor-texto-sobre-destaque))] font-medium'
                  : 'text-cor-texto hover:bg-cor-fundo'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
