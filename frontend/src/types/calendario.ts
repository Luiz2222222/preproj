export interface CalendarioSemestre {
  id: number;
  semestre: string;
  reuniao_alunos: string | null;
  envio_documentos_fim: string | null;
  avaliacao_continuidade_fim: string | null;
  submissao_monografia_fim: string | null;
  preparacao_bancas_fase1_inicio: string | null;
  preparacao_bancas_fase1_fim: string | null;
  avaliacao_fase1_fim: string | null;
  preparacao_bancas_fase2: string | null;
  defesas_fim: string | null;
  ajustes_finais_fim: string | null;
  peso_resumo: number;
  peso_introducao: number;
  peso_revisao: number;
  peso_desenvolvimento: number;
  peso_conclusoes: number;
  peso_coerencia_conteudo: number;
  peso_qualidade_apresentacao: number;
  peso_dominio_tema: number;
  peso_clareza_fluencia: number;
  peso_observancia_tempo: number;
  ativo: boolean;
  atualizado_em: string;
  atualizado_por: string | null;
}

export interface PermissoesTCC {
  pode_enviar_documentos_iniciais: boolean;
  pode_enviar_monografia: boolean;
  pode_confirmar_continuidade: boolean;
  pode_solicitar_avaliacao: boolean;
  pode_editar_fase1: boolean;
  pode_editar_fase2: boolean;
  pode_registrar_defesa: boolean;
  pode_enviar_ajustes: boolean;
}

export interface CodigoCadastro {
  id: number;
  tipo: 'ALUNO' | 'PROFESSOR' | 'AVALIADOR';
  codigo: string;
  atualizado_em: string;
  atualizado_por: string | null;
}
