import React from 'react';
import { Menu, Bell, User, LogOut } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAutenticacao } from '../autenticacao';
import { useNotificacoes } from '../contextos/NotificacoesContext';
import PainelNotificacoes from '../componentes/PainelNotificacoes';

interface HeaderAvaliadorProps {
  onMenuToggle: () => void;
}

export function HeaderAvaliador({ onMenuToggle }: HeaderAvaliadorProps) {
  const navigate = useNavigate();
  const { usuario, logout } = useAutenticacao();
  const { countNaoLidas, marcarTodasComoLidas } = useNotificacoes();
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const notificationButtonRef = React.useRef<HTMLButtonElement>(null);
  const userMenuRef = React.useRef<HTMLDivElement>(null);
  const userButtonRef = React.useRef<HTMLButtonElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Fechar menu ao clicar fora
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node) &&
        userButtonRef.current &&
        !userButtonRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  return (
    <header className="bg-cor-superficie border-b border-cor-borda sticky top-0 z-30">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo e Menu */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="p-2 hover:bg-cor-fundo rounded-lg transition"
          >
            <Menu className="h-5 w-5 text-cor-texto" />
          </button>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,var(--cor-brand-gradient-inicio) 0%,var(--cor-brand-gradient-fim) 100%)' }}
            >
              <span className="text-[rgb(var(--cor-texto-sobre-destaque))] font-bold text-sm">TCC</span>
            </div>
            <h1 className="text-xl font-bold text-cor-texto">
              Portal TCC
            </h1>
          </div>
        </div>

        {/* Ações do usuário */}
        <div className="flex items-center gap-4">
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
              className="relative p-2 hover:bg-cor-fundo rounded-lg transition"
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

          {/* Menu do usuário */}
          <div className="relative">
            <button
              ref={userButtonRef}
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 px-3 py-2 hover:bg-cor-fundo rounded-lg transition"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,var(--cor-brand-gradient-inicio) 0%,var(--cor-brand-gradient-fim) 100%)' }}
              >
                <User className="h-4 w-4 text-[rgb(var(--cor-texto-sobre-destaque))]" />
              </div>
              <span className="text-sm font-medium text-cor-texto">
                {usuario?.nome_completo?.split(' ')[0] || 'Avaliador'}
              </span>
            </button>

            {showUserMenu && (
              <div ref={userMenuRef} className="absolute right-0 mt-2 w-48 bg-cor-superficie rounded-lg shadow-lg border border-cor-borda py-2">
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
    </header>
  );
}
