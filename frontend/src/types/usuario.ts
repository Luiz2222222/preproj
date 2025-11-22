/**
 * Tipos e interfaces relacionados a usuários
 */

export type TipoUsuario = 'ALUNO' | 'PROFESSOR' | 'COORDENADOR' | 'AVALIADOR_EXTERNO';

export type Tratamento =
  | 'Prof. Dr.'
  | 'Prof. Ms.'
  | 'Prof.'
  | 'Dr.'
  | 'Eng.'
  | 'Outro';

export type Curso =
  | 'ENGENHARIA_ELETRICA'
  | 'ENGENHARIA_CONTROLE_AUTOMACAO';

export type Departamento =
  | 'Departamento de Engenharia Elétrica'
  | 'Departamento de Controle e Automação';

export type Afiliacao =
  | 'Universidade Federal de Pernambuco'
  | 'UFPE'
  | 'UFRPE'
  | 'IFPE'
  | 'Outro';

export interface Usuario {
  id: number;
  email: string;
  nome_completo: string;
  tipo_usuario: TipoUsuario;
  tratamento?: Tratamento | string;
  departamento?: Departamento | string;
  afiliacao?: Afiliacao | string;
  curso?: Curso;
  curso_display?: string;
  date_joined: string;
}

export interface Professor extends Usuario {
  tipo_usuario: 'PROFESSOR' | 'COORDENADOR';
  tratamento: Tratamento | string;
  departamento: Departamento | string;
  afiliacao: Afiliacao | string;
}

export interface Aluno extends Usuario {
  tipo_usuario: 'ALUNO';
  curso: Curso;
}

export interface PreferenciasVisuais {
  tema: 'White' | 'Black' | 'Dark' | 'Clássico';
  tamanho_fonte: 'pequena' | 'media' | 'grande';
}

export interface UsuarioLogado extends Usuario {
  preferencias_visuais?: PreferenciasVisuais;
}
