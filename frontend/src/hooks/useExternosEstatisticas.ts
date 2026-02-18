import { useState, useEffect, useCallback, useRef } from 'react';
import type { AxiosError } from 'axios';
import api, { extrairMensagemErro } from '../servicos/api';
import type { TCCResumo } from '../componentes/MiniTimelineTCC';

export interface ExternoEstatisticas {
  id: number;
  nome_completo: string;
  email: string;
  tratamento: string | null;
  tratamento_customizado: string | null;
  afiliacao: string | null;
  afiliacao_customizada: string | null;
  bancas: TCCResumo[];
  total_bancas: number;
}

interface UseExternosEstatisticasResult {
  externos: ExternoEstatisticas[];
  carregando: boolean;
  erro: string | null;
  recarregar: () => Promise<void>;
}

export function useExternosEstatisticas(): UseExternosEstatisticasResult {
  const [externos, setExternos] = useState<ExternoEstatisticas[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const buscarExternos = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    try {
      setCarregando(true);
      setErro(null);

      const resposta = await api.get<ExternoEstatisticas[]>('/externos/estatisticas/');

      if (requestId !== requestIdRef.current) return;

      if (Array.isArray(resposta.data)) {
        setExternos(resposta.data);
      } else {
        setExternos([]);
      }
    } catch (err) {
      const axiosErr = err as AxiosError;

      if (axiosErr?.response?.status === 404) {
        if (requestId !== requestIdRef.current) return;
        setExternos([]);
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
    await buscarExternos();
  }, [buscarExternos]);

  useEffect(() => {
    buscarExternos();
  }, [buscarExternos]);

  return {
    externos,
    carregando,
    erro,
    recarregar,
  };
}
