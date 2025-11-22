/**
 * Hook para buscar TCCs onde o professor precisa fazer avaliação
 * Usa o endpoint /tccs/avaliar/ que filtra TCCs onde:
 * - O usuário é membro da banca como AVALIADOR
 * - A banca está com status COMPLETA
 * - O TCC está na etapa APRESENTACAO_FASE_2
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { AxiosError } from 'axios';
import { extrairMensagemErro } from '../servicos/api';
import { obterTCCsParaAvaliar } from '../servicos/fase1';
import type { TCC } from '../types';

interface UseTCCsParaAvaliarResult {
  tccs: TCC[];
  carregando: boolean;
  erro: string | null;
  recarregar: () => Promise<void>;
}

export function useTCCsParaAvaliar(): UseTCCsParaAvaliarResult {
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

      const dados = await obterTCCsParaAvaliar();

      if (requestId !== requestIdRef.current) return;

      setTccs(dados);
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
