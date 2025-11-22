/**
 * Hook para buscar estatísticas de professores (orientações, co-orientações e bancas)
 * Usado pelo coordenador para visualizar a carga de trabalho dos professores
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { AxiosError } from 'axios';
import api, { extrairMensagemErro } from '../servicos/api';
import type { TCCResumo } from '../componentes/MiniTimelineTCC';

export interface ProfessorEstatisticas {
  id: number;
  nome_completo: string;
  email: string;
  orientacoes: TCCResumo[];  // Inclui orientações e co-orientações com tipo_orientacao
  bancas: TCCResumo[];
  total_orientacoes: number;  // Total de orientações + co-orientações
  total_bancas: number;
}

interface UseProfessoresEstatisticasResult {
  professores: ProfessorEstatisticas[];
  carregando: boolean;
  erro: string | null;
  recarregar: () => Promise<void>;
}

export function useProfessoresEstatisticas(): UseProfessoresEstatisticasResult {
  const [professores, setProfessores] = useState<ProfessorEstatisticas[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const buscarProfessores = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    try {
      setCarregando(true);
      setErro(null);

      const resposta = await api.get<ProfessorEstatisticas[]>('/professores/estatisticas/');

      if (requestId !== requestIdRef.current) return;

      if (Array.isArray(resposta.data)) {
        setProfessores(resposta.data);
      } else {
        setProfessores([]);
      }
    } catch (err) {
      const axiosErr = err as AxiosError;

      if (axiosErr?.response?.status === 404) {
        if (requestId !== requestIdRef.current) return;
        setProfessores([]);
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
    await buscarProfessores();
  }, [buscarProfessores]);

  // Carrega os dados inicialmente
  useEffect(() => {
    buscarProfessores();
  }, [buscarProfessores]);

  return {
    professores,
    carregando,
    erro,
    recarregar,
  };
}
