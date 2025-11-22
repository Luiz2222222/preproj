export type TipoToast = 'success' | 'info' | 'warning' | 'error'

export interface Toast {
  id: string
  tipo: TipoToast
  titulo: string
  descricao?: string
}
