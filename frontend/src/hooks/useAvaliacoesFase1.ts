/**
 * Hook para gerenciar avaliações da Fase I
 */

import { useState, useEffect, useCallback } from 'react';
import { extrairMensagemErro } from '../servicos/api';
import {
  obterAvaliacoesFase1,
  enviarAvaliacaoFase1,
  bloquearAvaliacoesFase1,
  desbloquearAvaliacoesFase1,
  aprovarAvaliacoesFase1,
  solicitarAjustesFase1
} from '../servicos/fase1';
import type {
  AvaliacaoFase1,
  EnviarAvaliacaoFase1DTO,
  SolicitarAjustesFase1DTO,
  AprovarAvaliacoesFase1DTO,
  BloquearAvaliacoesResponse,
  DesbloquearAvaliacoesResponse,
  AprovarAvaliacoesResponse,
  SolicitarAjustesResponse
} from '../types';

interface UseAvaliacoesFase1Params {
  tccId: number | null;
  autoCarregar?: boolean;
}

interface UseAvaliacoesFase1Result {
  avaliacoes: AvaliacaoFase1[];
  carregando: boolean;
  erro: string | null;
  recarregar: () => Promise<void>;
  enviar: (dados: EnviarAvaliacaoFase1DTO) => Promise<void>;
  bloquear: () => Promise<BloquearAvaliacoesResponse>;
  desbloquear: () => Promise<DesbloquearAvaliacoesResponse>;
  aprovar: (dados?: AprovarAvaliacoesFase1DTO) => Promise<AprovarAvaliacoesResponse>;
  solicitarAjustes: (dados: SolicitarAjustesFase1DTO) => Promise<SolicitarAjustesResponse>;
  processando: boolean;
}

export function useAvaliacoesFase1({
  tccId,
  autoCarregar = true
}: UseAvaliacoesFase1Params): UseAvaliacoesFase1Result {
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoFase1[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const buscarAvaliacoes = useCallback(async () => {
    if (!tccId) {
      setAvaliacoes([]);
      return;
    }

    try {
      setCarregando(true);
      setErro(null);

      const dados = await obterAvaliacoesFase1(tccId);
      setAvaliacoes(dados);
    } catch (err) {
      const mensagem = extrairMensagemErro(err);
      setErro(mensagem);
      setAvaliacoes([]);
    } finally {
      setCarregando(false);
    }
  }, [tccId]);

  const recarregar = useCallback(async () => {
    await buscarAvaliacoes();
  }, [buscarAvaliacoes]);

  const enviar = useCallback(
    async (dados: EnviarAvaliacaoFase1DTO) => {
      if (!tccId) {
        throw new Error('TCC não definido');
      }

      try {
        setProcessando(true);
        setErro(null);

        await enviarAvaliacaoFase1(tccId, dados);

        // Recarregar lista após envio bem-sucedido
        await buscarAvaliacoes();
      } catch (err) {
        const mensagem = extrairMensagemErro(err);
        setErro(mensagem);
        throw err;
      } finally {
        setProcessando(false);
      }
    },
    [tccId, buscarAvaliacoes]
  );

  const bloquear = useCallback(async () => {
    if (!tccId) {
      throw new Error('TCC não definido');
    }

    try {
      setProcessando(true);
      setErro(null);

      const resultado = await bloquearAvaliacoesFase1(tccId);

      // Recarregar lista após bloqueio
      await buscarAvaliacoes();

      return resultado;
    } catch (err) {
      const mensagem = extrairMensagemErro(err);
      setErro(mensagem);
      throw err;
    } finally {
      setProcessando(false);
    }
  }, [tccId, buscarAvaliacoes]);

  const desbloquear = useCallback(async () => {
    if (!tccId) {
      throw new Error('TCC não definido');
    }

    try {
      setProcessando(true);
      setErro(null);

      const resultado = await desbloquearAvaliacoesFase1(tccId);

      // Recarregar lista após desbloqueio
      await buscarAvaliacoes();

      return resultado;
    } catch (err) {
      const mensagem = extrairMensagemErro(err);
      setErro(mensagem);
      throw err;
    } finally {
      setProcessando(false);
    }
  }, [tccId, buscarAvaliacoes]);

  const aprovar = useCallback(
    async (dados?: AprovarAvaliacoesFase1DTO) => {
      if (!tccId) {
        throw new Error('TCC não definido');
      }

      try {
        setProcessando(true);
        setErro(null);

        const resultado = await aprovarAvaliacoesFase1(tccId, dados);

        // Recarregar lista após aprovação
        await buscarAvaliacoes();

        return resultado;
      } catch (err) {
        const mensagem = extrairMensagemErro(err);
        setErro(mensagem);
        throw err;
      } finally {
        setProcessando(false);
      }
    },
    [tccId, buscarAvaliacoes]
  );

  const solicitarAjustes = useCallback(
    async (dados: SolicitarAjustesFase1DTO) => {
      if (!tccId) {
        throw new Error('TCC não definido');
      }

      try {
        setProcessando(true);
        setErro(null);

        const resultado = await solicitarAjustesFase1(tccId, dados);

        // Recarregar lista após solicitação de ajustes
        await buscarAvaliacoes();

        return resultado;
      } catch (err) {
        const mensagem = extrairMensagemErro(err);
        setErro(mensagem);
        throw err;
      } finally {
        setProcessando(false);
      }
    },
    [tccId, buscarAvaliacoes]
  );

  useEffect(() => {
    if (autoCarregar && tccId) {
      buscarAvaliacoes();
    }
  }, [autoCarregar, tccId, buscarAvaliacoes]);

  return {
    avaliacoes,
    carregando,
    erro,
    recarregar,
    enviar,
    bloquear,
    desbloquear,
    aprovar,
    solicitarAjustes,
    processando,
  };
}
