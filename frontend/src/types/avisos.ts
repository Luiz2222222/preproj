export interface Aviso {
  id: number
  titulo: string
  mensagem: string
  destinatarios: string[]
  fixado: boolean
  criado_por: number | null
  criado_por_nome: string
  criado_em: string
  atualizado_em: string
}
