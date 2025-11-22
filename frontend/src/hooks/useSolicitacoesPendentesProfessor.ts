/**
 * Hook para buscar solicitações pendentes do professor
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { AxiosError } from 'axios';
import api, { extrairMensagemErro } from '../servicos/api';
import type { SolicitacaoOrientacao } from '../types';

interface UseSolicitacoesPendentesProfessorResult {
  solicitacoes: SolicitacaoOrientacao[];
  carregando: boolean;
  erro: string | null;
  recarregar: () => Promise<void>;
}

export function useSolicitacoesPendentesProfessor(): UseSolicitacoesPendentesProfessorResult {
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoOrientacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const buscarSolicitacoes = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    try {
      setCarregando(true);
      setErro(null);

      const resposta = await api.get<SolicitacaoOrientacao[]>('/solicitacoes/pendentes/');

      if (requestId !== requestIdRef.current) return;

      setSolicitacoes(resposta.data);
    } catch (err) {
      const axiosErr = err as AxiosError;

      if (axiosErr?.response?.status === 404) {
        if (requestId !== requestIdRef.current) return;
        setSolicitacoes([]);
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
    await buscarSolicitacoes();
  }, [buscarSolicitacoes]);

  // Carrega os dados inicialmente
  useEffect(() => {
    buscarSolicitacoes();
  }, [buscarSolicitacoes]);


  return {
    solicitacoes,
    carregando,
    erro,
    recarregar,
  };
}
