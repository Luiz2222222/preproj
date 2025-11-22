import type { PropsWithChildren } from 'react'
import clsx from 'clsx'

type TipoAlerta = 'informacao' | 'sucesso' | 'aviso' | 'erro'

interface AlertaProps extends PropsWithChildren {
  tipo?: TipoAlerta
  titulo?: string
  className?: string
}

const ESTILOS_ALERTA: Record<TipoAlerta, string> = {
  informacao: 'bg-cor-destaque/10 text-cor-destaque border-cor-destaque/40',
  sucesso: 'bg-cor-sucesso/10 text-cor-sucesso border-cor-sucesso/40',
  aviso: 'bg-cor-alerta/10 text-cor-alerta border-cor-alerta/40',
  erro: 'bg-cor-erro/10 text-cor-erro border-cor-erro/40',
}

export function Alerta({ tipo = 'informacao', titulo, className, children }: AlertaProps) {
  return (
    <div className={clsx('rounded-padrao border px-4 py-3', ESTILOS_ALERTA[tipo], className)}>
      {titulo && <h3 className="mb-1 font-semibold">{titulo}</h3>}
      <div className="text-pequeno">{children}</div>
    </div>
  )
}
