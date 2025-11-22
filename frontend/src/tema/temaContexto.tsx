import { createContext } from 'react'
import type { NomeTema, TamanhoFonte, FamiliaFonte, PreferenciasVisuais } from './tipos'

export interface TemaContextoDados {
  temaAtual: NomeTema
  tamanhoFonteAtual: TamanhoFonte
  familiaFonteAtual: FamiliaFonte
  definirTema: (novoTema: NomeTema) => void
  definirTamanhoFonte: (novoTamanho: TamanhoFonte) => void
  definirFamiliaFonte: (novaFamilia: FamiliaFonte) => void
  carregarPreferenciasUsuario: () => Promise<PreferenciasVisuais | null>
  salvarPreferenciasUsuario: (preferencias: PreferenciasVisuais) => Promise<void>
}

export const TemaContexto = createContext<TemaContextoDados>({
  temaAtual: 'dark',
  tamanhoFonteAtual: 'medio',
  familiaFonteAtual: 'padrao',
  definirTema: () => undefined,
  definirTamanhoFonte: () => undefined,
  definirFamiliaFonte: () => undefined,
  carregarPreferenciasUsuario: async () => null,
  salvarPreferenciasUsuario: async () => undefined,
})
