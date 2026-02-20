import api from './api';

export interface PreferenciasEmail {
  id: number;
  // Preferências de aluno
  aluno_aceitar_convite_orientador: boolean;
  aluno_ajuste_monografia: boolean;
  aluno_termo_disponivel: boolean;
  aluno_continuidade_aprovada: boolean;
  aluno_resultado_fase_1: boolean;
  aluno_agendamento_defesa: boolean;
  aluno_finalizacao_tcc: boolean;
  // Preferências de professor
  prof_convite_orientacao: boolean;
  prof_receber_monografia: boolean;
  prof_continuidade_aprovada: boolean;
  prof_lembrete_termo: boolean;
  prof_resultado_fase_1: boolean;
  prof_finalizacao_tcc: boolean;
  prof_participacao_banca: boolean;
  // Preferências de avaliador externo
  aval_convite_orientacao: boolean;
  aval_receber_monografia: boolean;
  aval_resultado_fase_1: boolean;
  aval_finalizacao_tcc: boolean;
  aval_participacao_banca: boolean;
  // Preferências de coordenador
  coord_convite_aluno: boolean;
  coord_monografia_aprovada: boolean;
  coord_termo_enviado: boolean;
  coord_continuidade_aprovada: boolean;
  coord_avaliacoes_fase1_completas: boolean;
  coord_avaliacoes_fase2_completas: boolean;
  coord_defesa_agendada: boolean;
  // Metadados
  criado_em: string;
  atualizado_em: string;
}

/**
 * Obtém as preferências de e-mail do usuário autenticado.
 * Se o usuário não tiver preferências cadastradas, o backend cria automaticamente com todos os valores true.
 */
export const obterPreferenciasEmail = async (): Promise<PreferenciasEmail> => {
  const response = await api.get('/notificacoes/preferencias/email/');
  return response.data;
};

/**
 * Atualiza as preferências de e-mail do usuário autenticado.
 */
export const atualizarPreferenciasEmail = async (
  preferencias: Partial<PreferenciasEmail>
): Promise<PreferenciasEmail> => {
  const response = await api.put('/notificacoes/preferencias/email/', preferencias);
  return response.data;
};
