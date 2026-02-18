import { useState, useEffect, useCallback, useRef } from 'react';
import type { AxiosError } from 'axios';
import api, { extrairMensagemErro } from '../servicos/api';

export interface AlunoTCCResumo {
  id: number;
  titulo: string;
  etapa_atual: string;
  orientador_nome: string | null;
  coorientador_nome: string | null;
  semestre: string;
}

export interface AlunoEstatisticas {
  id: number;
  nome_completo: string;
  email: string;
  curso: string | null;
  curso_display: string | null;
  date_joined: string;
  tcc: AlunoTCCResumo | null;
}

interface UseAlunosEstatisticasResult {
  alunos: AlunoEstatisticas[];
  carregando: boolean;
  erro: string | null;
  recarregar: () => Promise<void>;
}

export function useAlunosEstatisticas(): UseAlunosEstatisticasResult {
  const [alunos, setAlunos] = useState<AlunoEstatisticas[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const buscarAlunos = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    try {
      setCarregando(true);
      setErro(null);

      const resposta = await api.get<AlunoEstatisticas[]>('/alunos/estatisticas/');

      if (requestId !== requestIdRef.current) return;

      if (Array.isArray(resposta.data)) {
        setAlunos(resposta.data);
      } else {
        setAlunos([]);
      }
    } catch (err) {
      const axiosErr = err as AxiosError;

      if (axiosErr?.response?.status === 404) {
        if (requestId !== requestIdRef.current) return;
        setAlunos([]);
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
    await buscarAlunos();
  }, [buscarAlunos]);

  useEffect(() => {
    buscarAlunos();
  }, [buscarAlunos]);

  return {
    alunos,
    carregando,
    erro,
    recarregar,
  };
}
