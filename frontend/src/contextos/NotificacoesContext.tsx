import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Notificacao } from '../types/notificacoes';
import { notificacoesService } from '../servicos/notificacoes';
import { useAutenticacao } from '../autenticacao';

interface NotificacoesContextData {
  notificacoes: Notificacao[];
  countNaoLidas: number;
  carregando: boolean;
  erro: string | null;
  carregarNotificacoes: () => Promise<void>;
  marcarComoLida: (id: number) => Promise<void>;
  marcarTodasComoLidas: () => Promise<void>;
  deletarNotificacao: (id: number) => Promise<void>;
  deletarLidas: () => Promise<void>;
}

const NotificacoesContext = createContext<NotificacoesContextData>({} as NotificacoesContextData);

export const useNotificacoes = () => {
  const context = useContext(NotificacoesContext);
  if (!context) {
    throw new Error('useNotificacoes deve ser usado dentro de NotificacoesProvider');
  }
  return context;
};

interface NotificacoesProviderProps {
  children: React.ReactNode;
}

export const NotificacoesProvider: React.FC<NotificacoesProviderProps> = ({ children }) => {
  const { estaAutenticado } = useAutenticacao();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [countNaoLidas, setCountNaoLidas] = useState<number>(0);
  const [carregando, setCarregando] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregarNotificacoes = useCallback(async () => {
    try {
      setCarregando(true);
      setErro(null);
      const [notifs, count] = await Promise.all([
        notificacoesService.listarNotificacoes(),
        notificacoesService.contarNaoLidas(),
      ]);
      setNotificacoes(notifs);
      setCountNaoLidas(count);
    } catch (error: any) {
      console.error('Erro ao carregar notificações:', error);
      setErro('Erro ao carregar notificações');
    } finally {
      setCarregando(false);
    }
  }, []);

  const marcarComoLida = useCallback(async (id: number) => {
    try {
      await notificacoesService.marcarComoLida(id);
      setNotificacoes(prev =>
        prev.map(n => (n.id === id ? { ...n, lida: true } : n))
      );
      setCountNaoLidas(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  }, []);

  const marcarTodasComoLidas = useCallback(async () => {
    try {
      await notificacoesService.marcarTodasComoLidas();
      setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
      setCountNaoLidas(0);
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  }, []);

  const deletarNotificacao = useCallback(async (id: number) => {
    try {
      await notificacoesService.deletarNotificacao(id);
      const notif = notificacoes.find(n => n.id === id);
      setNotificacoes(prev => prev.filter(n => n.id !== id));
      if (notif && !notif.lida) {
        setCountNaoLidas(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
    }
  }, [notificacoes]);

  const deletarLidas = useCallback(async () => {
    try {
      await notificacoesService.deletarLidas();
      setNotificacoes(prev => prev.filter(n => !n.lida));
    } catch (error) {
      console.error('Erro ao deletar notificações lidas:', error);
    }
  }, []);

  // Carregar notificações ao montar o componente (somente se autenticado)
  useEffect(() => {
    if (estaAutenticado) {
      carregarNotificacoes();
    }
  }, [estaAutenticado, carregarNotificacoes]);

  // Atualizar notificações periodicamente (a cada 30 segundos, somente se autenticado)
  useEffect(() => {
    if (!estaAutenticado) return;

    const interval = setInterval(() => {
      carregarNotificacoes();
    }, 30000);

    return () => clearInterval(interval);
  }, [estaAutenticado, carregarNotificacoes]);

  return (
    <NotificacoesContext.Provider
      value={{
        notificacoes,
        countNaoLidas,
        carregando,
        erro,
        carregarNotificacoes,
        marcarComoLida,
        marcarTodasComoLidas,
        deletarNotificacao,
        deletarLidas,
      }}
    >
      {children}
    </NotificacoesContext.Provider>
  );
};
