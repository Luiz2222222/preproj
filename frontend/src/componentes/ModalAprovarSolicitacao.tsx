import { CheckCircle, X } from 'lucide-react'
import type { SolicitacaoOrientacao } from '../types'

interface ModalAprovarSolicitacaoProps {
  solicitacao: SolicitacaoOrientacao
  onClose: () => void
  onConfirm: () => void
  carregando?: boolean
}

export function ModalAprovarSolicitacao({
  solicitacao,
  onClose,
  onConfirm,
  carregando = false
}: ModalAprovarSolicitacaoProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[rgb(var(--cor-superficie))] rounded-2xl shadow-2xl max-w-md w-full border border-[rgb(var(--cor-borda))]">
        {/* Cabeçalho */}
        <div className="p-6 pb-4 border-b border-[rgb(var(--cor-borda))]">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[rgb(var(--cor-sucesso))]/10 rounded-full">
                <CheckCircle className="h-6 w-6 text-[rgb(var(--cor-sucesso))]" />
              </div>
              <h3 className="text-xl font-bold text-[rgb(var(--cor-texto-primario))]">Aprovar Solicitação</h3>
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
        <div className="p-6">
          <p className="text-[rgb(var(--cor-texto-secundario))] mb-6">
            Você está prestes a aceitar a solicitação de orientação de{' '}
            <strong>{solicitacao.aluno_nome}</strong>.
          </p>

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
              type="button"
              onClick={onConfirm}
              disabled={carregando}
              className="flex-1 py-2.5 px-4 bg-[rgb(var(--cor-sucesso))] text-white rounded-lg hover:bg-[rgb(var(--cor-sucesso))]/90 disabled:opacity-50 font-medium transition-colors flex items-center justify-center gap-2"
            >
              {carregando ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Aprovando...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Aprovar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
