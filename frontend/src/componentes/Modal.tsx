/**
 * Componente Modal reutilizável
 * Suporta diferentes tipos: sucesso, erro, aviso, confirmação
 */

import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { useEffect } from 'react';

export type TipoModal = 'sucesso' | 'erro' | 'aviso' | 'info' | 'confirmacao';

interface ModalProps {
  aberto: boolean;
  aoFechar: () => void;
  titulo: string;
  mensagem: string;
  tipo?: TipoModal;
  textoConfirmar?: string;
  textoCancelar?: string;
  aoConfirmar?: () => void;
  carregando?: boolean;
}

export function Modal({
  aberto,
  aoFechar,
  titulo,
  mensagem,
  tipo = 'info',
  textoConfirmar = 'OK',
  textoCancelar = 'Cancelar',
  aoConfirmar,
  carregando = false,
}: ModalProps) {
  // Fechar com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !carregando) {
        aoFechar();
      }
    };
    if (aberto) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [aberto, aoFechar, carregando]);

  if (!aberto) return null;

  // Configurações de estilo por tipo
  const configs = {
    sucesso: {
      icone: <CheckCircle className="h-12 w-12" />,
      corIcone: 'text-[rgb(var(--cor-sucesso))]',
      corBotao: 'bg-[rgb(var(--cor-sucesso))] hover:bg-[rgb(var(--cor-sucesso))]/90',
    },
    erro: {
      icone: <XCircle className="h-12 w-12" />,
      corIcone: 'text-[rgb(var(--cor-erro))]',
      corBotao: 'bg-[rgb(var(--cor-erro))] hover:bg-[rgb(var(--cor-erro))]/90',
    },
    aviso: {
      icone: <AlertTriangle className="h-12 w-12" />,
      corIcone: 'text-[rgb(var(--cor-alerta))]',
      corBotao: 'bg-[rgb(var(--cor-alerta))] hover:bg-[rgb(var(--cor-alerta))]/90',
    },
    info: {
      icone: <Info className="h-12 w-12" />,
      corIcone: 'text-[rgb(var(--cor-destaque))]',
      corBotao: 'bg-[rgb(var(--cor-destaque))] hover:bg-[rgb(var(--cor-destaque))]/90',
    },
    confirmacao: {
      icone: <AlertTriangle className="h-12 w-12" />,
      corIcone: 'text-[rgb(var(--cor-alerta))]',
      corBotao: 'bg-[rgb(var(--cor-alerta))] hover:bg-[rgb(var(--cor-alerta))]/90',
    },
  };

  const config = configs[tipo];
  const isConfirmacao = tipo === 'confirmacao' || aoConfirmar;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!carregando ? aoFechar : undefined}
      />

      {/* Modal */}
      <div className="relative bg-[rgb(var(--cor-superficie))] rounded-2xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
        {/* Header com botão fechar */}
        {!carregando && (
          <button
            onClick={aoFechar}
            className="absolute top-4 right-4 text-[rgb(var(--cor-texto-secundario))] hover:text-[rgb(var(--cor-texto-primario))] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Conteúdo */}
        <div className="p-6">
          {/* Ícone */}
          <div className={`flex justify-center mb-4 ${config.corIcone}`}>
            {config.icone}
          </div>

          {/* Título */}
          <h2 className="text-xl font-bold text-[rgb(var(--cor-texto-primario))] text-center mb-2">
            {titulo}
          </h2>

          {/* Mensagem */}
          <p className="text-[rgb(var(--cor-texto-secundario))] text-center mb-6 whitespace-pre-line">
            {mensagem}
          </p>

          {/* Botões */}
          <div className={`flex gap-3 ${isConfirmacao ? 'justify-center' : 'justify-center'}`}>
            {isConfirmacao && (
              <button
                onClick={aoFechar}
                disabled={carregando}
                className="px-6 py-2.5 rounded-lg border border-[rgb(var(--cor-borda))] text-[rgb(var(--cor-texto-primario))] hover:bg-[rgb(var(--cor-superficie-hover))] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {textoCancelar}
              </button>
            )}
            <button
              onClick={aoConfirmar || aoFechar}
              disabled={carregando}
              className={`px-6 py-2.5 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium ${config.corBotao}`}
            >
              {carregando ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processando...
                </span>
              ) : (
                textoConfirmar
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
