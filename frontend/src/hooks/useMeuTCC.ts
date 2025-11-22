/**
 * Hook para gerenciar o TCC do aluno logado
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { AxiosError } from 'axios';
import api, { extrairMensagemErro } from '../servicos/api';
import type { TCC, RecusaTCC } from '../types';

interface UseMeuTCCResult {
  tcc: TCC | null;
  recusa: RecusaTCC | null;
  carregando: boolean;
  erro: string | null;
  recarregar: () => Promise<void>;
}

export function useMeuTCC(): UseMeuTCCResult {
  const [tcc, setTcc] = useState<TCC | null>(null);
  const [recusa, setRecusa] = useState<RecusaTCC | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const buscarTCC = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    try {
      setCarregando(true);
      setErro(null);

      const resposta = await api.get<TCC | { status: 'RECUSADO'; recusa: RecusaTCC }>('/tccs/meu/');

      // Verificar se a resposta é null (nenhum TCC encontrado)
      if (!resposta.data) {
        if (requestId !== requestIdRef.current) return;
        setTcc(null);
        setRecusa(null);
        setErro(null);
      }
      // Verificar se é uma resposta de recusa
      else if ('status' in resposta.data && resposta.data.status === 'RECUSADO') {
        if (requestId !== requestIdRef.current) return;
        setTcc(null);
        setRecusa(resposta.data.recusa);
      } else {
        // É um TCC normal
        if (requestId !== requestIdRef.current) return;
        setTcc(resposta.data as TCC);
        setRecusa(null);
      }
    } catch (err) {
      const axiosErr = err as AxiosError;

      if (axiosErr?.response?.status === 404) {
        if (requestId !== requestIdRef.current) return;
        setTcc(null);
        setRecusa(null);
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
    await buscarTCC();
  }, [buscarTCC]);

  // Carrega os dados inicialmente
  useEffect(() => {
    buscarTCC();
  }, [buscarTCC]);

  return {
    tcc,
    recusa,
    carregando,
    erro,
    recarregar,
  };
}
