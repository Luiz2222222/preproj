import { useState } from 'react'
import { XCircle, X, AlertCircle } from 'lucide-react'
import type { SolicitacaoOrientacao } from '../types'

interface ModalRecusarSolicitacaoProps {
  solicitacao: SolicitacaoOrientacao
  onClose: () => void
  onConfirm: (parecer: string) => void
  carregando?: boolean
}

export function ModalRecusarSolicitacao({
  solicitacao,
  onClose,
  onConfirm,
  carregando = false
}: ModalRecusarSolicitacaoProps) {
  const [parecer, setParecer] = useState('')
  const [erro, setErro] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const parecerTrimmed = parecer.trim()
    if (!parecerTrimmed) {
      setErro('O parecer é obrigatório')
      return
    }

    if (parecerTrimmed.length < 10) {
      setErro('O parecer deve ter no mínimo 10 caracteres')
      return
    }

    setErro('')
    onConfirm(parecerTrimmed)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[rgb(var(--cor-superficie))] rounded-2xl shadow-2xl max-w-md w-full border border-[rgb(var(--cor-borda))]">
        {/* Cabeçalho */}
        <div className="p-6 pb-4 border-b border-[rgb(var(--cor-borda))]">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[rgb(var(--cor-erro))]/10 rounded-full">
                <XCircle className="h-6 w-6 text-[rgb(var(--cor-erro))]" />
              </div>
              <h3 className="text-xl font-bold text-[rgb(var(--cor-texto-primario))]">Recusar Solicitação</h3>
            </div>
            <button
              onClick={onClose}
              disabled={carregando}
              className="text-[rgb(var(--cor-texto-secundario))] hover:text-[rgb(var(--cor-texto-primario))] transition-colors disabled:opacity-50"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-[rgb(var(--cor-texto-secundario))] mb-6">
            Você está prestes a recusar a solicitação de orientação de{' '}
            <strong>{solicitacao.aluno_nome}</strong>. O aluno receberá uma notificação com o
            parecer que você fornecer abaixo.
          </p>

          {/* Campo de parecer */}
          <div className="mb-6">
            <label htmlFor="parecer" className="block text-sm font-medium text-[rgb(var(--cor-texto-primario))] mb-2">
              Parecer da Coordenação <span className="text-[rgb(var(--cor-erro))]">*</span>
            </label>
            <textarea
              id="parecer"
              value={parecer}
              onChange={(e) => {
                setParecer(e.target.value)
                if (erro) setErro('')
              }}
              disabled={carregando}
              rows={5}
              placeholder="Explique o motivo da recusa. O aluno receberá esta mensagem..."
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-erro))] focus:border-[rgb(var(--cor-erro))] resize-none ${
                erro ? 'border-[rgb(var(--cor-erro))]' : 'border-[rgb(var(--cor-borda))]'
              } disabled:opacity-50 disabled:bg-[rgb(var(--cor-superficie-hover))]`}
            />
            {erro && (
              <div className="flex items-center gap-2 mt-2 text-sm text-[rgb(var(--cor-erro))]">
                <AlertCircle className="h-4 w-4" />
                <span>{erro}</span>
              </div>
            )}
            <p className="text-xs text-[rgb(var(--cor-texto-terciario))] mt-1">
              Mínimo de 10 caracteres. Seja claro e objetivo.
            </p>
          </div>

          <div className="bg-[rgb(var(--cor-erro))]/10 border border-[rgb(var(--cor-erro))]/30 rounded-lg p-4 mb-6">
            <p className="text-sm text-[rgb(var(--cor-erro))]">
              <strong>Atenção:</strong> Esta ação não pode ser desfeita. O TCC voltará para a etapa
              inicial e o aluno precisará fazer uma nova solicitação.
            </p>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={carregando}
              className="flex-1 py-2.5 px-4 border border-[rgb(var(--cor-borda))] rounded-lg text-[rgb(var(--cor-texto-primario))] hover:bg-[rgb(var(--cor-superficie-hover))] transition-colors font-medium disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={carregando || !parecer.trim()}
              className="flex-1 py-2.5 px-4 bg-[rgb(var(--cor-erro))] text-white rounded-lg hover:bg-[rgb(var(--cor-erro))]/90 disabled:opacity-50 font-medium transition-colors flex items-center justify-center gap-2"
            >
              {carregando ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Recusando...</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  <span>Recusar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
