import { createElement, type PropsWithChildren } from 'react'
import clsx from 'clsx'

type NivelTitulo = 1 | 2 | 3 | 4

interface TituloProps extends PropsWithChildren {
  nivel?: NivelTitulo
  className?: string
}

export function Titulo({ nivel = 2, className, children }: TituloProps) {
  const tag = `h${nivel}`
  const mapaTamanho: Record<NivelTitulo, string> = {
    1: 'text-4xl',
    2: 'text-3xl',
    3: 'text-2xl',
    4: 'text-xl',
  }
  return createElement(tag, { className: clsx('font-semibold text-cor-texto', mapaTamanho[nivel], className) }, children)
}

interface ParagrafoProps extends PropsWithChildren {
  destaque?: boolean
  className?: string
}

export function Paragrafo({ destaque = false, className, children }: ParagrafoProps) {
  return (
    <p className={clsx('text-medio leading-relaxed', destaque ? 'font-medium text-cor-texto' : 'text-cor-texto/80', className)}>
      {children}
    </p>
  )
}
