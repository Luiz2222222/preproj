import { useState, useEffect, useCallback } from 'react';
import type { AxiosError } from 'axios';
import { buscarCalendarioAtual } from '../servicos/calendario';
import type { CalendarioSemestre } from '../types';

interface UseCalendarioSemestreReturn {
  calendario: CalendarioSemestre | null;
  carregando: boolean;
  erro: string | null;
  recarregar: () => Promise<void>;
}

export function useCalendarioSemestre(): UseCalendarioSemestreReturn {
  const [calendario, setCalendario] = useState<CalendarioSemestre | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setCarregando(true);
      setErro(null);
      const data = await buscarCalendarioAtual();
      setCalendario(data);
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail?: string }>;

      if (axiosErr?.response?.status === 404) {
        // Nenhum calendário configurado ainda; não tratar como erro
        setCalendario(null);
        setErro(null);
      } else {
        setErro(axiosErr?.response?.data?.detail || 'Erro ao carregar calendário');
      }
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return {
    calendario,
    carregando,
    erro,
    recarregar: carregar,
  };
}
