import { useContext } from 'react'
import { AutenticacaoContexto } from './autenticacaoContexto'

export function useAutenticacao() {
  const contexto = useContext(AutenticacaoContexto)

  if (!contexto) {
    throw new Error('useAutenticacao deve ser usado dentro de um ProvedorAutenticacao')
  }

  return contexto
}
