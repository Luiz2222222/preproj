/**
 * Contexto e Provider para gerenciar toasts/notificações
 */

import { createContext, useContext, useState, useCallback } from 'react'
import { Toast, ToastContainer, type ToastData, type ToastType } from '../componentes/Toast'

interface ToastContextValue {
  mostrarToast: (tipo: ToastType, mensagem: string, duracao?: number) => void
  sucesso: (mensagem: string, duracao?: number) => void
  erro: (mensagem: string, duracao?: number) => void
  aviso: (mensagem: string, duracao?: number) => void
  info: (mensagem: string, duracao?: number) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const removerToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
  }, [])

  const mostrarToast = useCallback((tipo: ToastType, mensagem: string, duracao?: number) => {
    const id = `toast-${Date.now()}-${Math.random()}`
    const novoToast: ToastData = {
      id,
      tipo,
      mensagem,
      duracao,
    }
    setToasts((prevToasts) => [...prevToasts, novoToast])
  }, [])

  const sucesso = useCallback(
    (mensagem: string, duracao?: number) => mostrarToast('success', mensagem, duracao),
    [mostrarToast]
  )

  const erro = useCallback(
    (mensagem: string, duracao?: number) => mostrarToast('error', mensagem, duracao),
    [mostrarToast]
  )

  const aviso = useCallback(
    (mensagem: string, duracao?: number) => mostrarToast('warning', mensagem, duracao),
    [mostrarToast]
  )

  const info = useCallback(
    (mensagem: string, duracao?: number) => mostrarToast('info', mensagem, duracao),
    [mostrarToast]
  )

  return (
    <ToastContext.Provider value={{ mostrarToast, sucesso, erro, aviso, info }}>
      {children}
      <ToastContainer>
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={() => removerToast(toast.id)} />
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider')
  }
  return context
}
