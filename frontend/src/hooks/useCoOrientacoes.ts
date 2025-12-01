/**
 * Hook para buscar TCCs onde o usuário é co-orientador
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { AxiosError } from 'axios';
import api, { extrairMensagemErro } from '../servicos/api';
import type { TCC } from '../types';

interface UseCoOrientacoesResult {
  tccs: TCC[];
  carregando: boolean;
  erro: string | null;
  recarregar: () => Promise<void>;
}

export function useCoOrientacoes(): UseCoOrientacoesResult {
  const [tccs, setTccs] = useState<TCC[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const buscarCoOrientacoes = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    try {
      setCarregando(true);
      setErro(null);

      const resposta = await api.get<TCC[]>('/tccs/minhas-coorientacoes/');

      if (requestId !== requestIdRef.current) return;

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
    await buscarCoOrientacoes();
  }, [buscarCoOrientacoes]);

  useEffect(() => {
    buscarCoOrientacoes();
  }, [buscarCoOrientacoes]);

  return {
    tccs,
    carregando,
    erro,
    recarregar,
  };
}
