/**
 * Hook para gerenciar banca da Fase I
 */

import { useState, useEffect, useCallback } from 'react';
import { extrairMensagemErro } from '../servicos/api';
import {
  obterBancaFase1,
  atualizarBancaFase1,
  concluirFormacaoBancaFase1
} from '../servicos/fase1';
import type { BancaFase1, AtualizarBancaFase1DTO } from '../types';

interface UseBancaFase1Params {
  tccId: number | null;
  autoCarregar?: boolean;
}

interface UseBancaFase1Result {
  banca: BancaFase1 | null;
  carregando: boolean;
  erro: string | null;
  recarregar: () => Promise<void>;
  atualizarBanca: (dados: AtualizarBancaFase1DTO) => Promise<void>;
  concluirFormacao: (arquivoAnonimo?: File) => Promise<void>;
  processando: boolean;
}

export function useBancaFase1({
  tccId,
  autoCarregar = true
}: UseBancaFase1Params): UseBancaFase1Result {
  const [banca, setBanca] = useState<BancaFase1 | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const buscarBanca = useCallback(async () => {
    if (!tccId) {
      setBanca(null);
      return;
    }

    try {
      setCarregando(true);
      setErro(null);

      const dados = await obterBancaFase1(tccId);
      setBanca(dados);
    } catch (err) {
      const mensagem = extrairMensagemErro(err);
      setErro(mensagem);
      setBanca(null);
    } finally {
      setCarregando(false);
    }
  }, [tccId]);

  const recarregar = useCallback(async () => {
    await buscarBanca();
  }, [buscarBanca]);

  const atualizarBanca = useCallback(
    async (dados: AtualizarBancaFase1DTO) => {
      if (!tccId) {
        throw new Error('TCC não definido');
      }

      try {
        setProcessando(true);
        setErro(null);

        const bancaAtualizada = await atualizarBancaFase1(tccId, dados);
        setBanca(bancaAtualizada);
      } catch (err) {
        const mensagem = extrairMensagemErro(err);
        setErro(mensagem);
        throw err;
      } finally {
        setProcessando(false);
      }
    },
    [tccId]
  );

  const concluirFormacao = useCallback(async (arquivoAnonimo?: File) => {
    if (!tccId) {
      throw new Error('TCC não definido');
    }

    try {
      setProcessando(true);
      setErro(null);

      const resposta = await concluirFormacaoBancaFase1(tccId, arquivoAnonimo);
      setBanca(resposta.banca);
    } catch (err) {
      const mensagem = extrairMensagemErro(err);
      setErro(mensagem);
      throw err;
    } finally {
      setProcessando(false);
    }
  }, [tccId]);

  useEffect(() => {
    if (autoCarregar && tccId) {
      buscarBanca();
    }
  }, [autoCarregar, tccId, buscarBanca]);

  return {
    banca,
    carregando,
    erro,
    recarregar,
    atualizarBanca,
    concluirFormacao,
    processando,
  };
}
