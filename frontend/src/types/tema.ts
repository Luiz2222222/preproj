export type Tema = 'white' | 'dark' | 'black' | 'sigaa'

export type TamanhoFonte = 'pequeno' | 'medio' | 'grande'

export type FamiliaFonte = 'sans' | 'serif' | 'mono'

export interface PreferenciasVisuais {
  tema: Tema
  tamanho_fonte: TamanhoFonte
  familia_fonte?: FamiliaFonte
}
