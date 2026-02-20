/**
 * Tipos e interfaces relacionados ao TCC
 */

import type { Usuario } from './usuario';
import type {
  EtapaTCC,
  StatusSolicitacao,
  TipoDocumento,
  StatusDocumento,
  TipoEvento,
  Visibilidade,
  StatusBancaFase1,
  TipoMembroBanca,
  StatusAvaliacaoFase1,
  IndicadoPor
} from './enums';
import type { PermissoesTCC, CalendarioSemestre } from './calendario';

export interface TCC {
  id: number;
  aluno: number;
  aluno_dados: Usuario;
  orientador: number | null;
  orientador_dados: Usuario | null;
  coorientador: number | null;
  coorientador_dados: Usuario | null;
  titulo: string;
  resumo: string;
  etapa_atual: EtapaTCC;
  etapa_display: string;
  semestre: string;
  flag_continuidade: boolean;
  flag_liberado_avaliacao: boolean;
  avaliacao_fase1_bloqueada: boolean;
  avaliacao_fase2_bloqueada: boolean;
  // Flags de liberação de prazo
  liberar_envio_documentos?: boolean;
  liberar_desenvolvimento?: boolean;
  liberar_continuidade?: boolean;
  liberar_fase1?: boolean;
  liberar_defesas?: boolean;
  liberar_fase2?: boolean;
  liberar_ajustes_finais?: boolean;
  // Notas finais e resultado
  nf1: number | null;
  nf2: number | null;
  media_final: number | null;
  resultado_final: string | null;
  // Coorientador externo
  coorientador_nome: string;
  coorientador_titulacao: string;
  coorientador_afiliacao: string;
  coorientador_lattes: string;
  solicitacao_pendente_id: number | null;
  // Campos de recusa
  solicitacao_recusada: boolean;
  parecer_recusa: string | null;
  data_recusa: string | null;
  criado_em: string;
  atualizado_em: string;
  // Lista de documentos (opcional)
  documentos?: Array<{
    id: number;
    tipo_documento: TipoDocumento;
    tipo_documento_display: string;
    arquivo: string | null;  // Pode ser null quando não há request no contexto
    nome_original: string;
    tamanho: number;
    versao: number;
    status: StatusDocumento;
    status_display: string;
    feedback: string;  // Backend normaliza null para ''
    criado_em: string;
  }>;
  // Campos calculados pelo backend (opcionais até serem implementados em todos os endpoints)
  proxima_data?: string;
  proxima_etapa?: string;
  // Dados da defesa (serão adicionados quando a banca for formada)
  data_defesa?: string;
  hora_defesa?: string;
  local_defesa?: string;
  banca_formada?: boolean;
  // Permissões e calendário (novos campos do sistema de prazos)
  permissoes?: PermissoesTCC;
  calendario_semestre?: CalendarioSemestre | null;

  // Status das avaliações do usuário atual (retornado pelo endpoint /tccs/avaliar/)
  minha_avaliacao_fase1_status?: string | null;
  minha_avaliacao_fase2_status?: string | null;
}

export interface SolicitacaoOrientacao {
  id: number;
  tcc: number;
  tcc_dados?: TCC;
  professor: number;
  professor_dados: Usuario;
  mensagem: string;
  status: StatusSolicitacao;
  status_display: string;
  resposta_professor: string;
  // Dados do coorientador na solicitação
  coorientador_nome: string;
  coorientador_titulacao: string;
  coorientador_afiliacao: string;
  coorientador_lattes: string;
  // Dados do aluno (computados pelo serializer)
  aluno_nome: string;
  aluno_email: string;
  aluno_curso: string | null;
  // Documentos do TCC
  documentos?: Array<{
    id: number;
    tipo: TipoDocumento;
    tipo_display: string;
    nome_original: string;
    versao: number;
    url: string | null;
    criado_em: string;
  }>;
  criado_em: string;
  respondido_em: string | null;
}

export interface DocumentoTCC {
  id: number;
  tcc: number;
  tcc_dados?: TCC;
  tipo_documento: TipoDocumento;
  tipo_display: string;
  arquivo: string;
  nome_original: string;
  tamanho: number;
  tamanho_mb: number;
  versao: number;
  enviado_por: number;
  enviado_por_dados: Usuario;
  status: StatusDocumento;
  status_display: string;
  feedback: string;  // Backend normaliza null para ''
  criado_em: string;
}

export interface EventoTimeline {
  id: number;
  tcc: number;
  tcc_dados?: TCC;
  usuario: number | null;
  usuario_dados: Usuario | null;
  tipo_evento: TipoEvento;
  tipo_display: string;
  descricao: string;
  detalhes_json: Record<string, any> | null;
  visibilidade: Visibilidade;
  visibilidade_display: string;
  timestamp: string;
}

export interface RecusaTCC {
  parecer: string;
  coordenador_nome: string;
  recusado_em: string;
}

// DTOs para criação/atualização
export interface CriarTCCComSolicitacaoDTO {
  titulo: string;
  resumo?: string;
  semestre: string;
  professor: number;
  mensagem?: string;
  coorientador_nome?: string;
  coorientador_titulacao?: string;
  coorientador_afiliacao?: string;
  coorientador_lattes?: string;
}

export interface EnviarDocumentoDTO {
  tipo_documento: TipoDocumento;
  arquivo: File;
}

export interface AceitarRecusarSolicitacaoDTO {
  resposta_professor?: string;
}

// Respostas paginadas
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Tipos para Fase I

export interface MembroBanca {
  id: number;
  usuario: number;
  usuario_dados: Usuario;
  tipo: TipoMembroBanca;
  indicado_por: IndicadoPor;
  ordem: number;
  criado_em: string;
}

export interface BancaFase1 {
  id: number;
  tcc: number;
  tcc_dados?: TCC;
  status: StatusBancaFase1;
  membros: MembroBanca[];
  data_formacao: string | null;
  formada_por: number | null;
  formada_por_dados: Usuario | null;
  criado_em: string;
  atualizado_em: string;
}

export interface PesosConfigurados {
  peso_resumo: number;
  peso_introducao: number;
  peso_revisao: number;
  peso_desenvolvimento: number;
  peso_conclusoes: number;
}

export interface AvaliacaoFase1 {
  id: number;
  tcc: number;
  tcc_dados?: TCC;
  avaliador: number;
  avaliador_dados: Usuario;
  nota_resumo: number | null;
  nota_introducao: number | null;
  nota_revisao: number | null;
  nota_desenvolvimento: number | null;
  nota_conclusoes: number | null;
  nota_final: number | null;
  pesos_configurados: PesosConfigurados | null;
  parecer: string;
  status: StatusAvaliacaoFase1;
  pode_editar: boolean;
  criado_em: string;
  atualizado_em: string;
  enviado_em: string | null;
}

// DTOs para Fase I

export interface AtualizarBancaFase1DTO {
  avaliadores: number[];
}

export interface EnviarAvaliacaoFase1DTO {
  nota_resumo?: number;
  nota_introducao?: number;
  nota_revisao?: number;
  nota_desenvolvimento?: number;
  nota_conclusoes?: number;
  parecer?: string;
  status: StatusAvaliacaoFase1;
}

export interface SolicitarAjustesFase1DTO {
  avaliadores: number[];
  mensagem?: string;
}

export interface AprovarAvaliacoesFase1DTO {
  avaliadores?: number[];
}

// Respostas dos endpoints de Fase I

export interface ConcluirFormacaoBancaResponse {
  message: string;
  banca: BancaFase1;
  etapa_atual: EtapaTCC;
  etapa_display: string;
}

export interface BloquearAvaliacoesResponse {
  message: string;
  avaliacoes_bloqueadas: number;
}

export interface DesbloquearAvaliacoesResponse {
  message: string;
  avaliacoes_desbloqueadas: number;
}

export interface SolicitarAjustesResponse {
  message: string;
  avaliacoes_reabertas: number;
  avaliadores: number[];
  tcc_desbloqueado: boolean;
}

export interface AprovarAvaliacoesParcialResponse {
  message: string;
  tipo: 'parcial';
  avaliacoes_aprovadas: number;
}

export interface AprovarAvaliacoesCompletaResponse {
  message: string;
  tipo: 'completa';
  nf1: number;
  resultado: string;
  etapa_atual: EtapaTCC;
  etapa_display: string;
}

export type AprovarAvaliacoesResponse =
  | AprovarAvaliacoesParcialResponse
  | AprovarAvaliacoesCompletaResponse;

// Tipos para Fase II

export interface PesosConfiguradosFase2 {
  peso_coerencia_conteudo: number;
  peso_qualidade_apresentacao: number;
  peso_dominio_tema: number;
  peso_clareza_fluencia: number;
  peso_observancia_tempo: number;
}

export interface AvaliacaoFase2 {
  id: number;
  tcc: number;
  tcc_dados?: TCC;
  avaliador: number;
  avaliador_dados: Usuario;
  nota_coerencia_conteudo: number | null;
  nota_qualidade_apresentacao: number | null;
  nota_dominio_tema: number | null;
  nota_clareza_fluencia: number | null;
  nota_observancia_tempo: number | null;
  nota_final: number | null;
  pesos_configurados: PesosConfiguradosFase2 | null;
  parecer: string;
  status: string; // StatusAvaliacaoFase2
  pode_editar: boolean;
  criado_em: string;
  atualizado_em: string;
  enviado_em: string | null;
}

// DTOs para Fase II

export interface EnviarAvaliacaoFase2DTO {
  nota_coerencia_conteudo?: number;
  nota_qualidade_apresentacao?: number;
  nota_dominio_tema?: number;
  nota_clareza_fluencia?: number;
  nota_observancia_tempo?: number;
  parecer?: string;
  status: string; // StatusAvaliacaoFase2
}
