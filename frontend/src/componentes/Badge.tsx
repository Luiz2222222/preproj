/**
 * Componente Badge reutilizável
 * Usado para exibir status, etapas, tipos, etc.
 */

import { clsx } from 'clsx'

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral'
  | 'pending'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
  icon?: React.ReactNode
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-[rgb(var(--cor-sucesso))]/10 text-[rgb(var(--cor-sucesso))]',
  warning: 'bg-[rgb(var(--cor-alerta))]/10 text-[rgb(var(--cor-alerta))]',
  error: 'bg-[rgb(var(--cor-erro))]/10 text-[rgb(var(--cor-erro))]',
  info: 'bg-[rgb(var(--cor-destaque))]/10 text-[rgb(var(--cor-destaque))]',
  neutral: 'bg-[rgb(var(--cor-borda))]/10 text-[rgb(var(--cor-texto-secundario))]',
  pending: 'bg-[rgb(var(--cor-alerta))]/10 text-[rgb(var(--cor-alerta))]',
}

export function Badge({ children, variant = 'neutral', className, icon }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-3 py-1 rounded-full text-pequeno font-semibold',
        variantStyles[variant],
        className
      )}
    >
      {icon}
      {children}
    </span>
  )
}
