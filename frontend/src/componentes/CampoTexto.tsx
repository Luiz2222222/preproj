import type { InputHTMLAttributes } from 'react'
import clsx from 'clsx'

interface CampoTextoProps extends InputHTMLAttributes<HTMLInputElement> {
  rotulo?: string
  mensagemAjuda?: string
  mensagemErro?: string
}

export function CampoTexto({ rotulo, mensagemAjuda, mensagemErro, className, id, ...resto }: CampoTextoProps) {
  const identificador = id ?? `campo-${Math.random().toString(36).slice(2, 9)}`
  const temErro = Boolean(mensagemErro)

  return (
    <div className={clsx('flex flex-col gap-2', className)}>
      {rotulo && (
        <label htmlFor={identificador} className="text-medio font-medium">
          {rotulo}
        </label>
      )}
      <input
        id={identificador}
        className={clsx(
          'rounded-padrao border px-3 py-2 text-medio outline-none transition focus:ring-2',
          temErro
            ? 'border-cor-erro focus:border-cor-erro focus:ring-cor-erro/60'
            : 'border-cor-borda focus:border-cor-destaque focus:ring-cor-destaque/50',
        )}
        {...resto}
      />
      {mensagemAjuda && !temErro && (
        <span className="text-pequeno text-cor-texto/70">{mensagemAjuda}</span>
      )}
      {temErro && <span className="text-pequeno text-cor-erro">{mensagemErro}</span>}
    </div>
  )
}
