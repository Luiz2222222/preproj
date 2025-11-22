/**
 * Hook para buscar todos os TCCs (visão coordenador)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { AxiosError } from 'axios';
import api, { extrairMensagemErro } from '../servicos/api';
import type { TCC } from '../types';

interface UseTCCsCoordenadorResult {
  tccs: TCC[];
  carregando: boolean;
  erro: string | null;
  recarregar: () => Promise<void>;
}

export function useTCCsCoordenador(): UseTCCsCoordenadorResult {
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

      const resposta = await api.get<TCC[]>('/tccs/meu/');

      if (requestId !== requestIdRef.current) return;

      // Para coordenador, o endpoint retorna array completo de TCCs
      if (Array.isArray(resposta.data)) {
        setTccs(resposta.data);
      } else {
        // Fallback: se retornar objeto único, transformar em array
        setTccs([resposta.data as TCC]);
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
