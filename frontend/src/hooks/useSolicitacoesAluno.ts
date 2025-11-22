/**
 * Hook para gerenciar solicitações de orientação do aluno
 */

import { useState, useCallback } from 'react';
import api, { extrairMensagemErro } from '../servicos/api';

interface UseSolicitacoesAlunoResult {
  cancelarSolicitacao: (solicitacaoId: number) => Promise<void>;
  cancelando: boolean;
  erro: string | null;
}

export function useSolicitacoesAluno(): UseSolicitacoesAlunoResult {
  const [cancelando, setCancelando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const cancelarSolicitacao = useCallback(async (solicitacaoId: number) => {
    try {
      setCancelando(true);
      setErro(null);

      await api.delete(`/solicitacoes/${solicitacaoId}/cancelar/`);
    } catch (err) {
      const mensagem = extrairMensagemErro(err);
      setErro(mensagem);
      throw err;
    } finally {
      setCancelando(false);
    }
  }, []);

  return {
    cancelarSolicitacao,
    cancelando,
    erro,
  };
}
