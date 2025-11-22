import type { TCC, DocumentoTCC, EventoTimeline, BancaFase1, MembroBanca, AvaliacaoFase1 } from '../../types'
import {
  EtapaTCC,
  StatusDocumento,
  TipoDocumento,
  TipoEvento,
  Visibilidade,
  StatusBancaFase1,
  TipoMembroBanca,
  StatusAvaliacaoFase1,
  IndicadoPor
} from '../../types/enums'

export const mockUsuarioAluno = {
  id: 1,
  email: 'aluno@test.com',
  nome_completo: 'Aluno Teste',
  tipo_usuario: 'ALUNO' as const,
  ativo: true,
  criado_em: '2025-01-01T00:00:00Z',
  atualizado_em: '2025-01-01T00:00:00Z',
  date_joined: '2025-01-01T00:00:00Z',
}

export const mockUsuarioProfessor = {
  id: 2,
  email: 'professor@test.com',
  nome_completo: 'Professor Teste',
  tipo_usuario: 'PROFESSOR' as const,
  ativo: true,
  criado_em: '2025-01-01T00:00:00Z',
  atualizado_em: '2025-01-01T00:00:00Z',
  date_joined: '2025-01-01T00:00:00Z',
  tratamento: 'Prof. Dr.',
  departamento: 'Computação',
}

export const mockTCCPendente: TCC = {
  id: 1,
  aluno: 1,
  aluno_dados: mockUsuarioAluno,
  orientador: null,
  orientador_dados: null,
  coorientador: null,
  coorientador_dados: null,
  titulo: 'TCC de Teste',
  resumo: 'Resumo do TCC de teste',
  etapa_atual: EtapaTCC.INICIALIZACAO,
  etapa_display: 'Inicialização',
  semestre: '2025.1',
  flag_continuidade: false,
  flag_liberado_avaliacao: false,
  avaliacao_fase1_bloqueada: false,
  avaliacao_fase2_bloqueada: false,
  nf1: null,
  nf2: null,
  media_final: null,
  resultado_final: null,
  coorientador_nome: '',
  coorientador_titulacao: '',
  coorientador_afiliacao: '',
  coorientador_lattes: '',
  solicitacao_pendente_id: 1,
  solicitacao_recusada: false,
  parecer_recusa: null,
  data_recusa: null,
  criado_em: '2025-01-01T00:00:00Z',
  atualizado_em: '2025-01-01T00:00:00Z',
}

export const mockTCCDesenvolvimento: TCC = {
  ...mockTCCPendente,
  id: 2,
  orientador: 2,
  orientador_dados: mockUsuarioProfessor,
  etapa_atual: EtapaTCC.DESENVOLVIMENTO,
  etapa_display: 'Desenvolvimento',
  solicitacao_pendente_id: null,
}

export const mockDocumento: DocumentoTCC = {
  id: 1,
  tcc: 1,
  tipo_documento: TipoDocumento.PLANO_DESENVOLVIMENTO,
  tipo_display: 'Plano de Desenvolvimento',
  arquivo: 'tccs/1/documentos/plano.pdf',
  nome_original: 'plano_desenvolvimento.pdf',
  tamanho: 1024000,
  tamanho_mb: 1.0,
  versao: 1,
  enviado_por: 1,
  enviado_por_dados: mockUsuarioAluno,
  status: StatusDocumento.PENDENTE,
  status_display: 'Pendente',
  feedback: '',
  criado_em: '2025-01-01T00:00:00Z',
}

export const mockEvento: EventoTimeline = {
  id: 1,
  tcc: 1,
  usuario: 1,
  usuario_dados: mockUsuarioAluno,
  tipo_evento: TipoEvento.CRIACAO_TCC,
  tipo_display: 'Criação do TCC',
  descricao: 'TCC criado pelo aluno',
  detalhes_json: null,
  visibilidade: Visibilidade.TODOS,
  visibilidade_display: 'Visível para Todos',
  timestamp: '2025-01-01T00:00:00Z',
}

// Mocks para Fase I

export const mockUsuarioAvaliador = {
  id: 3,
  email: 'avaliador@test.com',
  nome_completo: 'Avaliador Teste',
  tipo_usuario: 'PROFESSOR' as const,
  ativo: true,
  criado_em: '2025-01-01T00:00:00Z',
  atualizado_em: '2025-01-01T00:00:00Z',
  date_joined: '2025-01-01T00:00:00Z',
  tratamento: 'Prof. Dr.',
  departamento: 'Computação',
}

export const mockMembroBanca: MembroBanca = {
  id: 1,
  usuario: 2,
  usuario_dados: mockUsuarioProfessor,
  tipo: TipoMembroBanca.ORIENTADOR,
  indicado_por: IndicadoPor.ORIENTADOR,
  ordem: 0,
  criado_em: '2025-01-01T00:00:00Z',
}

export const mockBancaFase1: BancaFase1 = {
  id: 1,
  tcc: 2,
  status: StatusBancaFase1.PENDENTE,
  membros: [mockMembroBanca],
  data_formacao: null,
  formada_por: null,
  formada_por_dados: null,
  criado_em: '2025-01-01T00:00:00Z',
  atualizado_em: '2025-01-01T00:00:00Z',
}

export const mockAvaliacaoFase1: AvaliacaoFase1 = {
  id: 1,
  tcc: 2,
  avaliador: 3,
  avaliador_dados: mockUsuarioAvaliador,
  nota_resumo: null,
  nota_introducao: null,
  nota_revisao: null,
  nota_desenvolvimento: null,
  nota_conclusoes: null,
  nota_final: null,
  pesos_configurados: {
    peso_resumo: 1.0,
    peso_introducao: 2.0,
    peso_revisao: 2.0,
    peso_desenvolvimento: 3.5,
    peso_conclusoes: 1.5,
  },
  parecer: '',
  status: StatusAvaliacaoFase1.PENDENTE,
  pode_editar: true,
  criado_em: '2025-01-01T00:00:00Z',
  atualizado_em: '2025-01-01T00:00:00Z',
  enviado_em: null,
}
