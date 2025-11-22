export type TipoUsuario = 'ALUNO' | 'PROFESSOR' | 'COORDENADOR' | 'AVALIADOR'

export interface UsuarioLogado {
  id: number
  nome_completo: string
  email: string
  tipo_usuario: TipoUsuario
  tratamento?: string
}

export interface Tokens {
  access: string
  refresh: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  access: string
  refresh: string
  tipo_usuario: TipoUsuario
  preferencias_visuais?: {
    tema: string
    tamanho_fonte: string
  }
}

export interface RefreshResponse {
  access: string
}
