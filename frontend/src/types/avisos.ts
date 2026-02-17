export interface ComentarioAviso {
  id: number
  aviso: number
  autor: number
  autor_nome: string
  texto: string
  criado_em: string
}

export interface Aviso {
  id: number
  titulo: string
  mensagem: string
  destinatarios: string[]
  cor: string
  fixado: boolean
  criado_por: number | null
  criado_por_nome: string
  criado_em: string
  atualizado_em: string
  comentarios: ComentarioAviso[]
}
