import { createContext } from 'react'
import type { ContextoAutenticacao } from './tipos'

export const AutenticacaoContexto = createContext<ContextoAutenticacao | undefined>(undefined)
