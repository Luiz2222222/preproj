export interface PreferenciasVisuais {
  tema: 'white' | 'black' | 'dark' | 'sigaa'
  tamanho_fonte: 'pequeno' | 'medio' | 'grande'
}

export interface UsuarioLogado {
  id: number
  email: string
  nome_completo: string
  tipo_usuario: 'ALUNO' | 'PROFESSOR' | 'AVALIADOR' | 'COORDENADOR'
  tratamento?: string
  departamento?: string
  afiliacao?: string
  curso?: string
  preferencias_visuais?: PreferenciasVisuais
}

export interface TokensAutenticacao {
  access: string
  refresh: string
}

export interface RespostaLogin {
  user: UsuarioLogado  // ✅ Não mais "access" e "refresh" no JSON
}

export interface ContextoAutenticacao {
  usuario: UsuarioLogado | null
  tokens: TokensAutenticacao | null
  carregando: boolean
  login: (email: string, senha: string, lembrarMe?: boolean) => Promise<void>  // ✅ Adicionado lembrarMe
  logout: () => Promise<void>
  atualizarToken: () => Promise<void>
  estaAutenticado: boolean
}
