/**
 * Componente CardStatus para exibir status/estados
 * Usado em dashboards, resumos, etc.
 */

import { clsx } from 'clsx'
import type { LucideIcon } from 'lucide-react'

export type CardStatusVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral'

interface CardStatusProps {
  titulo: string
  descricao?: string
  variant?: CardStatusVariant
  icone?: LucideIcon
  acao?: React.ReactNode
  className?: string
}

const variantStyles: Record<CardStatusVariant, { bg: string; border: string; iconColor: string }> = {
  success: {
    bg: 'bg-[rgb(var(--cor-sucesso))]/10',
    border: 'border-l-[rgb(var(--cor-sucesso))]',
    iconColor: 'text-[rgb(var(--cor-sucesso))]',
  },
  warning: {
    bg: 'bg-[rgb(var(--cor-alerta))]/10',
    border: 'border-l-[rgb(var(--cor-alerta))]',
    iconColor: 'text-[rgb(var(--cor-alerta))]',
  },
  error: {
    bg: 'bg-[rgb(var(--cor-erro))]/10',
    border: 'border-l-[rgb(var(--cor-erro))]',
    iconColor: 'text-[rgb(var(--cor-erro))]',
  },
  info: {
    bg: 'bg-[rgb(var(--cor-destaque))]/10',
    border: 'border-l-[rgb(var(--cor-destaque))]',
    iconColor: 'text-[rgb(var(--cor-destaque))]',
  },
  neutral: {
    bg: 'bg-[rgb(var(--cor-borda))]/10',
    border: 'border-l-[rgb(var(--cor-borda))]',
    iconColor: 'text-[rgb(var(--cor-texto-secundario))]',
  },
}

export function CardStatus({
  titulo,
  descricao,
  variant = 'neutral',
  icone: Icone,
  acao,
  className,
}: CardStatusProps) {
  const styles = variantStyles[variant]

  return (
    <div
      className={clsx(
        'border-l-4 rounded-lg p-6',
        styles.bg,
        styles.border,
        className
      )}
    >
      <div className="flex items-start gap-4">
        {Icone && (
          <div className="flex-shrink-0">
            <Icone className={clsx('h-6 w-6', styles.iconColor)} />
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-cor-texto mb-1">{titulo}</h3>
          {descricao && (
            <p className="text-medio text-cor-texto opacity-75">{descricao}</p>
          )}
          {acao && <div className="mt-4">{acao}</div>}
        </div>
      </div>
    </div>
  )
}
