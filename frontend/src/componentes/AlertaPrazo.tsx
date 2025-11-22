/**
 * Componente de alerta para prazos encerrados
 */
import { AlertCircle } from 'lucide-react'

interface AlertaPrazoProps {
  mensagem: string
  variant?: 'warning' | 'error' | 'info'
  className?: string
}

export function AlertaPrazo({ mensagem, variant = 'warning', className = '' }: AlertaPrazoProps) {
  const variantStyles = {
    warning: 'bg-[rgb(var(--cor-alerta))]/10 border-[rgb(var(--cor-alerta))]/40 text-[rgb(var(--cor-texto-primario))]',
    error: 'bg-[rgb(var(--cor-erro))]/10 border-[rgb(var(--cor-erro))]/40 text-[rgb(var(--cor-texto-primario))]',
    info: 'bg-[rgb(var(--cor-destaque))]/10 border-[rgb(var(--cor-destaque))]/40 text-[rgb(var(--cor-texto-primario))]'
  }

  const iconStyles = {
    warning: 'text-[rgb(var(--cor-alerta))]',
    error: 'text-[rgb(var(--cor-erro))]',
    info: 'text-[rgb(var(--cor-destaque))]'
  }

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${variantStyles[variant]} ${className}`}>
      <AlertCircle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${iconStyles[variant]}`} />
      <p className="text-sm leading-relaxed">{mensagem}</p>
    </div>
  )
}

export default AlertaPrazo
