import type { PropsWithChildren, ReactNode } from 'react'
import clsx from 'clsx'

interface CartaoProps extends PropsWithChildren {
  titulo?: ReactNode
  rodape?: ReactNode
  className?: string
}

export function Cartao({ titulo, rodape, className, children }: CartaoProps) {
  return (
    <section className={clsx('rounded-padrao border border-cor-borda bg-cor-superficie p-6 shadow-sm', className)}>
      {titulo && <header className="mb-4 text-grande font-semibold">{titulo}</header>}
      <div className="space-y-4">{children}</div>
      {rodape && <footer className="mt-4 text-pequeno text-cor-texto/70">{rodape}</footer>}
    </section>
  )
}
