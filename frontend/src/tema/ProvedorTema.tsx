import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { TemaContexto } from './temaContexto'
import type { NomeTema, PreferenciasVisuais, TamanhoFonte, FamiliaFonte } from './tipos'

const CHAVE_TEMA = 'tema'
const CHAVE_TAMANHO = 'tamanhoFonte'
const CHAVE_FAMILIA = 'familiaFonte'
const CHAVE_TOKEN_ACESSO = 'tokenAcesso'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8500/api'

const temaPadrao: NomeTema = 'white'
const tamanhoFontePadrao: TamanhoFonte = 'medio'
const familiaFontePadrao: FamiliaFonte = 'padrao'

function obterValorLocal(chave: string): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    return window.localStorage.getItem(chave)
  } catch (erro) {
    console.warn('Nao foi possivel ler localStorage:', erro)
    return null
  }
}

function gravarValorLocal(chave: string, valor: string) {
  if (typeof window === 'undefined') {
    return
  }
  try {
    window.localStorage.setItem(chave, valor)
  } catch (erro) {
    console.warn('Nao foi possivel gravar no localStorage:', erro)
  }
}

function aplicarAtributos(tema: NomeTema, tamanho: TamanhoFonte, familia: FamiliaFonte) {
  if (typeof document === 'undefined') {
    return
  }
  const elementoRaiz = document.documentElement
  elementoRaiz.setAttribute('data-tema', tema)
  elementoRaiz.setAttribute('data-tamanho-fonte', tamanho)
  elementoRaiz.setAttribute('data-familia-fonte', familia)
}

export interface ProvedorTemaProps {
  children: ReactNode
}

export function ProvedorTema({ children }: ProvedorTemaProps) {
  const temaInicial = (obterValorLocal(CHAVE_TEMA) as NomeTema) ?? temaPadrao
  const tamanhoInicial = (obterValorLocal(CHAVE_TAMANHO) as TamanhoFonte) ?? tamanhoFontePadrao
  const familiaInicial = (obterValorLocal(CHAVE_FAMILIA) as FamiliaFonte) ?? familiaFontePadrao

  const [temaAtual, definirTemaEstado] = useState<NomeTema>(temaInicial)
  const [tamanhoFonteAtual, definirTamanhoEstado] = useState<TamanhoFonte>(tamanhoInicial)
  const [familiaFonteAtual, definirFamiliaEstado] = useState<FamiliaFonte>(familiaInicial)

  const salvarPreferenciasUsuario = useCallback(async (preferencias: PreferenciasVisuais) => {
    const token = obterValorLocal(CHAVE_TOKEN_ACESSO)
    if (!token) {
      return
    }

    try {
      const resposta = await fetch(`${API_BASE_URL}/auth/preferencias/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(preferencias),
      })

      if (!resposta.ok) {
        console.warn('Erro ao salvar preferencias no backend:', resposta.statusText)
      }
    } catch (erro) {
      console.warn('Erro ao salvar preferencias:', erro)
    }
  }, [])

  useEffect(() => {
    aplicarAtributos(temaAtual, tamanhoFonteAtual, familiaFonteAtual)
    gravarValorLocal(CHAVE_TEMA, temaAtual)
    gravarValorLocal(CHAVE_TAMANHO, tamanhoFonteAtual)
    gravarValorLocal(CHAVE_FAMILIA, familiaFonteAtual)
  }, [temaAtual, tamanhoFonteAtual, familiaFonteAtual])

  useEffect(() => {
    const sincronizarComBackend = async () => {
      const token = obterValorLocal(CHAVE_TOKEN_ACESSO)
      if (!token) {
        return
      }

      await salvarPreferenciasUsuario({
        tema: temaAtual,
        tamanhoFonte: tamanhoFonteAtual,
        familiaFonte: familiaFonteAtual,
      })
    }

    sincronizarComBackend()
  }, [temaAtual, tamanhoFonteAtual, familiaFonteAtual, salvarPreferenciasUsuario])

  const definirTema = useCallback((novoTema: NomeTema) => {
    definirTemaEstado(novoTema)
  }, [])

  const definirTamanhoFonte = useCallback((novoTamanho: TamanhoFonte) => {
    definirTamanhoEstado(novoTamanho)
  }, [])

  const definirFamiliaFonte = useCallback((novaFamilia: FamiliaFonte) => {
    definirFamiliaEstado(novaFamilia)
  }, [])

  const carregarPreferenciasUsuario = useCallback(async () => {
    return null as PreferenciasVisuais | null
  }, [])

  const contexto = useMemo(
    () => ({
      temaAtual,
      tamanhoFonteAtual,
      familiaFonteAtual,
      definirTema,
      definirTamanhoFonte,
      definirFamiliaFonte,
      carregarPreferenciasUsuario,
      salvarPreferenciasUsuario,
    }),
    [temaAtual, tamanhoFonteAtual, familiaFonteAtual, definirTema, definirTamanhoFonte, definirFamiliaFonte, carregarPreferenciasUsuario, salvarPreferenciasUsuario],
  )

  return <TemaContexto.Provider value={contexto}>{children}</TemaContexto.Provider>
}
