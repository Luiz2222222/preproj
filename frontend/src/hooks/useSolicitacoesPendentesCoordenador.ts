/**
 * Hook para gerenciar solicitações de orientação pendentes (visão coordenador)
 */

import { useState, useEffect, useCallback } from 'react';
import api, { extrairMensagemErro } from '../servicos/api';
import type { SolicitacaoOrientacao } from '../types';

interface UseSolicitacoesPendentesCoordenadorResult {
  solicitacoes: SolicitacaoOrientacao[];
  carregando: boolean;
  erro: string | null;
  recarregar: () => Promise<void>;
}

export function useSolicitacoesPendentesCoordenador(): UseSolicitacoesPendentesCoordenadorResult {
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoOrientacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const buscarSolicitacoes = useCallback(async () => {
    try {
      setCarregando(true);
      setErro(null);

      const resposta = await api.get<SolicitacaoOrientacao[]>('/solicitacoes/pendentes/');
      setSolicitacoes(resposta.data);
    } catch (err) {
      const mensagem = extrairMensagemErro(err);
      setErro(mensagem);
      setSolicitacoes([]);
    } finally {
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
