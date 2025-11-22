import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificacoes } from '../contextos/NotificacoesContext';
import { formatarDataRelativa } from '../utils/formatadores';
import type { Notificacao } from '../types/notificacoes';

interface PainelNotificacoesProps {
  aberto: boolean;
  onFechar: () => void;
  anchorEl: HTMLElement | null;
}

const PainelNotificacoes: React.FC<PainelNotificacoesProps> = ({ aberto, onFechar, anchorEl }) => {
  const navigate = useNavigate();
  const painelRef = useRef<HTMLDivElement>(null);
  const { notificacoes, countNaoLidas, carregando, marcarComoLida, marcarTodasComoLidas, deletarNotificacao } = useNotificacoes();

  // Fechar painel ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        painelRef.current &&
        !painelRef.current.contains(event.target as Node) &&
        anchorEl &&
        !anchorEl.contains(event.target as Node)
      ) {
        onFechar();
      }
    };

    if (aberto) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [aberto, onFechar, anchorEl]);

  const handleClickNotificacao = async (notificacao: Notificacao) => {
    if (!notificacao.lida) {
      await marcarComoLida(notificacao.id);
    }
    onFechar();
    if (notificacao.action_url) {
      navigate(notificacao.action_url);
    }
  };

  const handleMarcarTodasLidas = async () => {
    await marcarTodasComoLidas();
  };

  const handleDeletarNotificacao = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    await deletarNotificacao(id);
  };

  const getPrioridadeCor = (prioridade: string) => {
    switch (prioridade) {
      case 'urgente':
        return 'rgb(var(--cor-erro))';
      case 'alta':
        return 'rgb(var(--cor-alerta))';
      case 'normal':
        return 'rgb(var(--cor-destaque))';
      default:
        return 'rgb(var(--cor-icone))';
    }
  };

  if (!aberto) return null;

  // Calcular posição do painel
  const rect = anchorEl?.getBoundingClientRect();
  const painelStyle: React.CSSProperties = {
    position: 'fixed',
    top: rect ? rect.bottom + 8 : 60,
    right: rect ? window.innerWidth - rect.right : 20,
    width: '400px',
    maxHeight: '500px',
    backgroundColor: 'rgb(var(--cor-superficie))',
    border: '1px solid rgb(var(--cor-borda))',
    borderRadius: '8px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
  };

  const notificacoesExibir = notificacoes.slice(0, 10);

  return (
    <div ref={painelRef} style={painelStyle}>
      {/* Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid rgb(var(--cor-borda))',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'rgb(var(--cor-texto))' }}>
          Notificações {countNaoLidas > 0 && `(${countNaoLidas})`}
        </h3>
        {countNaoLidas > 0 && (
          <button
            onClick={handleMarcarTodasLidas}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgb(var(--cor-destaque))',
              fontSize: '13px',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* Lista de notificações */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {carregando ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'rgb(var(--cor-texto-secundario))' }}>
            Carregando...
          </div>
        ) : notificacoesExibir.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'rgb(var(--cor-texto-secundario))' }}>
            Nenhuma notificação
          </div>
        ) : (
          notificacoesExibir.map(notificacao => (
            <div
              key={notificacao.id}
              onClick={() => handleClickNotificacao(notificacao)}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid rgb(var(--cor-borda))',
                cursor: 'pointer',
                backgroundColor: notificacao.lida
                  ? 'transparent'
                  : 'rgba(var(--cor-destaque) / 0.05)',
                transition: 'background-color 0.2s',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgb(var(--cor-fundo))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = notificacao.lida
                  ? 'transparent'
                  : 'rgba(var(--cor-destaque) / 0.05)';
              }}
            >
              {/* Indicador de prioridade */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '4px',
                  backgroundColor: getPrioridadeCor(notificacao.prioridade),
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: notificacao.lida ? 'normal' : 600,
                      color: 'rgb(var(--cor-texto))',
                      marginBottom: '4px',
                    }}
                  >
                    {notificacao.titulo}
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      color: 'rgb(var(--cor-texto-secundario))',
                      marginBottom: '4px',
                    }}
                  >
                    {notificacao.mensagem}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgb(var(--cor-icone))' }}>
                    {formatarDataRelativa(notificacao.criado_em)}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeletarNotificacao(e, notificacao.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgb(var(--cor-texto-secundario))',
                    fontSize: '18px',
                    cursor: 'pointer',
                    padding: '4px',
                    lineHeight: 1,
                  }}
                  title="Deletar notificação"
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PainelNotificacoes;
