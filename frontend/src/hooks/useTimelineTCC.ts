/**
 * Hook para gerenciar timeline de eventos do TCC
 */

import { useState, useEffect, useCallback } from 'react';
import api, { extrairMensagemErro } from '../servicos/api';
import type { EventoTimeline } from '../types';

interface UseTimelineTCCParams {
  tccId: number | null;
  autoCarregar?: boolean;
}

interface UseTimelineTCCResult {
  eventos: EventoTimeline[];
  carregando: boolean;
  erro: string | null;
  recarregar: () => Promise<void>;
}

export function useTimelineTCC({
  tccId,
  autoCarregar = true,
}: UseTimelineTCCParams): UseTimelineTCCResult {
  const [eventos, setEventos] = useState<EventoTimeline[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const buscarEventos = useCallback(async () => {
    if (!tccId) {
      setEventos([]);
      return;
    }

    try {
      setCarregando(true);
      setErro(null);

      const resposta = await api.get<EventoTimeline[]>(`/tccs/${tccId}/timeline/`);
      // Backend retorna lista simples, não paginada
      setEventos(resposta.data || []);
    } catch (err) {
      const mensagem = extrairMensagemErro(err);
      setErro(mensagem);
      setEventos([]);
    } finally {
      setCarregando(false);
    }
  }, [tccId]);

  const recarregar = useCallback(async () => {
    await buscarEventos();
  }, [buscarEventos]);

  useEffect(() => {
    if (autoCarregar && tccId) {
      buscarEventos();
    }
  }, [autoCarregar, tccId, buscarEventos]);

  return {
    eventos,
    carregando,
    erro,
    recarregar,
  };
}
