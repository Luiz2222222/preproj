/**
 * Hook para gerenciar documentos do TCC
 */

import { useState, useEffect, useCallback } from 'react';
import api, { extrairMensagemErro } from '../servicos/api';
import type { DocumentoTCC, TipoDocumento } from '../types';

interface UseDocumentosTCCParams {
  tccId: number | null;
  autoCarregar?: boolean;
}

interface UseDocumentosTCCResult {
  documentos: DocumentoTCC[];
  carregando: boolean;
  erro: string | null;
  recarregar: () => Promise<void>;
  enviarDocumento: (tipoDocumento: TipoDocumento, arquivo: File) => Promise<void>;
  enviando: boolean;
}

export function useDocumentosTCC({
  tccId,
  autoCarregar = true
}: UseDocumentosTCCParams): UseDocumentosTCCResult {
  const [documentos, setDocumentos] = useState<DocumentoTCC[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const buscarDocumentos = useCallback(async () => {
    if (!tccId) {
      setDocumentos([]);
      return;
    }

    try {
      setCarregando(true);
      setErro(null);

      const resposta = await api.get<DocumentoTCC[]>(`/tccs/${tccId}/documentos/`);
      // Backend retorna lista simples, não paginada
      setDocumentos(resposta.data || []);
    } catch (err) {
      const mensagem = extrairMensagemErro(err);
      setErro(mensagem);
      setDocumentos([]);
    } finally {
      setCarregando(false);
    }
  }, [tccId]);

  const recarregar = useCallback(async () => {
    await buscarDocumentos();
  }, [buscarDocumentos]);

  const enviarDocumento = useCallback(
    async (tipoDocumento: TipoDocumento, arquivo: File) => {
      if (!tccId) {
        throw new Error('TCC não definido');
      }

      try {
        setEnviando(true);
        setErro(null);

        const formData = new FormData();
        formData.append('tipo_documento', tipoDocumento);
        formData.append('arquivo', arquivo);

        await api.post(`/tccs/${tccId}/documentos/`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        // Recarregar lista após envio bem-sucedido
        await buscarDocumentos();
      } catch (err) {
        const mensagem = extrairMensagemErro(err);
        setErro(mensagem);
        throw err;
      } finally {
        setEnviando(false);
      }
    },
    [tccId, buscarDocumentos]
  );

  useEffect(() => {
    if (autoCarregar && tccId) {
      buscarDocumentos();
    }
  }, [autoCarregar, tccId, buscarDocumentos]);

  return {
    documentos,
    carregando,
    erro,
    recarregar,
    enviarDocumento,
    enviando,
  };
}
