export type NomeTema = 'white' | 'black' | 'dark' | 'sigaa'

export type TamanhoFonte = 'pequeno' | 'medio' | 'grande'

export type FamiliaFonte = 'padrao' | 'serif' | 'mono'

export interface PreferenciasVisuais {
  tema: NomeTema
  tamanhoFonte: TamanhoFonte
  familiaFonte: FamiliaFonte
}
