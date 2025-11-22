import { useContext } from 'react'
import { TemaContexto } from './temaContexto'

export function useTema() {
  const contexto = useContext(TemaContexto)

  if (!contexto) {
    throw new Error('useTema deve ser usado dentro de um ProvedorTema')
  }

  return contexto
}
