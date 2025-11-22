/**
 * Hook para gerenciar avaliações da Fase II (Apresentação)
 */

import { useState, useEffect, useCallback } from 'react';
import { extrairMensagemErro } from '../servicos/api';
import {
  obterAvaliacoesFase2,
  enviarAvaliacaoFase2,
  bloquearAvaliacoesFase2,
  desbloquearAvaliacoesFase2,
  aprovarAvaliacoesFase2
} from '../servicos/fase2';
import type {
  AvaliacaoFase2,
  EnviarAvaliacaoFase2DTO
} from '../types';

interface UseAvaliacoesFase2Params {
  tccId: number | null;
  autoCarregar?: boolean;
}

interface UseAvaliacoesFase2Result {
  avaliacoes: AvaliacaoFase2[];
  carregando: boolean;
  erro: string | null;
  recarregar: () => Promise<void>;
  enviar: (dados: EnviarAvaliacaoFase2DTO) => Promise<void>;
  processando: boolean;
  bloquear: () => Promise<{ message: string; avaliacoes_bloqueadas: number }>;
  desbloquear: () => Promise<{ message: string; avaliacoes_desbloqueadas: number }>;
  aprovar: () => Promise<{
    message: string;
    nf1: number;
    media_apresentacao: number;
    nf2: number;
    resultado: string;
    etapa_atual: string;
    etapa_display: string;
  }>;
}

export function useAvaliacoesFase2({
  tccId,
  autoCarregar = true
}: UseAvaliacoesFase2Params): UseAvaliacoesFase2Result {
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoFase2[]>([]);
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

      const dados = await obterAvaliacoesFase2(tccId);
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
    async (dados: EnviarAvaliacaoFase2DTO) => {
      if (!tccId) {
        throw new Error('TCC não definido');
      }

      try {
        setProcessando(true);
        setErro(null);

        await enviarAvaliacaoFase2(tccId, dados);

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

      const resultado = await bloquearAvaliacoesFase2(tccId);

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

      const resultado = await desbloquearAvaliacoesFase2(tccId);

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

  const aprovar = useCallback(async () => {
    if (!tccId) {
      throw new Error('TCC não definido');
    }

    try {
      setProcessando(true);
      setErro(null);

      const resultado = await aprovarAvaliacoesFase2(tccId);

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
  }, [tccId, buscarAvaliacoes]);

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
    processando,
    bloquear,
    desbloquear,
    aprovar,
  };
}
