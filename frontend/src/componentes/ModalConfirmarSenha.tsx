import { useState } from 'react';
import { X, Lock } from 'lucide-react';

interface ModalConfirmarSenhaProps {
  aberto: boolean;
  onFechar: () => void;
  onConfirmar: (senha: string) => void;
  carregando?: boolean;
}

export function ModalConfirmarSenha({ aberto, onFechar, onConfirmar, carregando = false }: ModalConfirmarSenhaProps) {
  const [senha, setSenha] = useState('');

  if (!aberto) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (senha.trim()) {
      onConfirmar(senha);
      setSenha(''); // Limpar campo após confirmar
    }
  };

  const handleFechar = () => {
    setSenha('');
    onFechar();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-cor-superficie rounded-lg shadow-xl max-w-md w-full border border-cor-borda">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-cor-borda">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[rgb(var(--cor-alerta))]/10 rounded-lg">
              <Lock className="h-5 w-5 text-[rgb(var(--cor-alerta))]" />
            </div>
            <h2 className="text-xl font-semibold text-cor-texto">Confirmar Senha</h2>
          </div>
          <button
            onClick={handleFechar}
            disabled={carregando}
            className="p-2 hover:bg-cor-fundo rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-cor-texto" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-cor-texto-secundario">
            Para salvar as alterações, confirme sua senha atual.
          </p>

          <div>
            <label htmlFor="senha-confirmar" className="block text-sm font-medium text-cor-texto mb-2">
              Senha Atual
            </label>
            <input
              id="senha-confirmar"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              autoFocus
              disabled={carregando}
              className="w-full px-4 py-2 bg-cor-fundo border border-cor-borda rounded-lg text-cor-texto focus:outline-none focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] disabled:opacity-50"
              placeholder="Digite sua senha atual"
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleFechar}
              disabled={carregando}
              className="px-4 py-2 border border-cor-borda rounded-lg text-cor-texto hover:bg-cor-fundo transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={carregando || !senha.trim()}
              className="px-4 py-2 bg-cor-destaque text-[rgb(var(--cor-texto-sobre-destaque))] rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {carregando ? 'Confirmando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
