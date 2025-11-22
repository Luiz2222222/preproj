/**
 * Componente Toast para notificações
 */

import { useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastData {
  id: string
  tipo: ToastType
  mensagem: string
  duracao?: number
}

interface ToastProps {
  toast: ToastData
  onClose: () => void
}

const toastConfig: Record<ToastType, { icone: typeof CheckCircle; bg: string; border: string; iconColor: string }> = {
  success: {
    icone: CheckCircle,
    bg: 'bg-[rgb(var(--cor-sucesso))]/10',
    border: 'border-[rgb(var(--cor-sucesso))]',
    iconColor: 'text-[rgb(var(--cor-sucesso))]',
  },
  error: {
    icone: AlertCircle,
    bg: 'bg-[rgb(var(--cor-erro))]/10',
    border: 'border-[rgb(var(--cor-erro))]',
    iconColor: 'text-[rgb(var(--cor-erro))]',
  },
  warning: {
    icone: AlertTriangle,
    bg: 'bg-[rgb(var(--cor-alerta))]/10',
    border: 'border-[rgb(var(--cor-alerta))]',
    iconColor: 'text-[rgb(var(--cor-alerta))]',
  },
  info: {
    icone: Info,
    bg: 'bg-[rgb(var(--cor-destaque))]/10',
    border: 'border-[rgb(var(--cor-destaque))]',
    iconColor: 'text-[rgb(var(--cor-destaque))]',
  },
}

export function Toast({ toast, onClose }: ToastProps) {
  const config = toastConfig[toast.tipo]
  const Icone = config.icone

  useEffect(() => {
    const duracao = toast.duracao ?? 5000
    if (duracao > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duracao)
      return () => clearTimeout(timer)
    }
  }, [toast.duracao, onClose])

  return (
    <div
      className={clsx(
        'flex items-start gap-3 p-4 rounded-lg border-l-4 shadow-lg min-w-[320px] max-w-[480px] bg-[rgb(var(--cor-superficie))]',
        config.bg,
        config.border,
        'animate-[slideIn_0.3s_ease-out]'
      )}
    >
      <Icone className={clsx('h-5 w-5 flex-shrink-0 mt-0.5', config.iconColor)} />
      <p className="flex-1 text-medio text-[rgb(var(--cor-texto-primario))]">{toast.mensagem}</p>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-[rgb(var(--cor-texto-secundario))] hover:text-[rgb(var(--cor-texto-primario))] transition-colors"
        aria-label="Fechar"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function ToastContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      <div className="pointer-events-auto flex flex-col gap-3">
        {children}
      </div>
    </div>
  )
}
