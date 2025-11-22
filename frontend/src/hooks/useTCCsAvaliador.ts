/**
 * Hook para buscar TCCs onde o usuário atua como avaliador
 * Usa o endpoint /tccs/ que filtra automaticamente pelo backend baseado no usuário logado
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { AxiosError } from 'axios';
import api, { extrairMensagemErro } from '../servicos/api';
import type { TCC } from '../types';

interface UseTCCsAvaliadorResult {
  tccs: TCC[];
  carregando: boolean;
  erro: string | null;
  recarregar: () => Promise<void>;
}

export function useTCCsAvaliador(): UseTCCsAvaliadorResult {
  const [tccs, setTccs] = useState<TCC[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const buscarTCCs = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    try {
      setCarregando(true);
      setErro(null);

      const resposta = await api.get<TCC[]>('/tccs/');

      if (requestId !== requestIdRef.current) return;

      // O endpoint /tccs/ retorna array de TCCs filtrados pelo backend
      if (Array.isArray(resposta.data)) {
        setTccs(resposta.data);
      } else {
        setTccs([]);
      }
    } catch (err) {
      const axiosErr = err as AxiosError;

      if (axiosErr?.response?.status === 404) {
        if (requestId !== requestIdRef.current) return;
        setTccs([]);
        setErro(null);
      } else {
        if (requestId !== requestIdRef.current) return;
        const mensagem = extrairMensagemErro(err);
        setErro(mensagem);
      }
    } finally {
      if (requestId !== requestIdRef.current) return;
      setCarregando(false);
    }
  }, []);

  const recarregar = useCallback(async () => {
    await buscarTCCs();
  }, [buscarTCCs]);

  // Carrega os dados inicialmente
  useEffect(() => {
    buscarTCCs();
  }, [buscarTCCs]);

  return {
    tccs,
    carregando,
    erro,
    recarregar,
  };
}
