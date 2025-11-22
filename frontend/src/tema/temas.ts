import type { NomeTema } from './tipos'

export interface DescricaoTema {
  nome: NomeTema
  titulo: string
  descricao: string
  cores: {
    fundo: string
    superficie: string
    texto: string
    destaque: string
  }
}

export const temasDisponiveis: DescricaoTema[] = [
  {
    nome: 'white',
    titulo: 'White',
    descricao: 'Tema claro inspirado na versao atual do portal.',
    cores: {
      fundo: '#FAFAFA',
      superficie: '#FFFFFF',
      texto: '#111827',
      destaque: '#0EA5E9',
    },
  },
  {
    nome: 'black',
    titulo: 'Black',
    descricao: 'Tema de alto contraste com fundo preto.',
    cores: {
      fundo: '#000000',
      superficie: '#111111',
      texto: '#FFFFFF',
      destaque: '#10B981',
    },
  },
  {
    nome: 'dark',
    titulo: 'Dark',
    descricao: 'Variante escura adaptada do portal-tcc-novo.',
    cores: {
      fundo: '#111827',
      superficie: '#1F2937',
      texto: '#F3F4F6',
      destaque: '#818CF8',
    },
  },
  {
    nome: 'sigaa',
    titulo: 'Clássico',
    descricao: 'Paleta inspirada no sistema SIGAA (azul e dourado).',
    cores: {
      fundo: '#E8EEF7',
      superficie: '#FFFFFF',
      texto: '#333333',
      destaque: '#12355B',
    },
  },
]
