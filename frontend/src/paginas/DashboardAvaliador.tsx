import { useAutenticacao } from '../autenticacao'
import { LogOut } from 'lucide-react'

export function DashboardAvaliador() {
  const { usuario, logout } = useAutenticacao()

  return (
    <div className="min-h-screen bg-cor-fundo">
      <header className="bg-cor-superficie border-b border-cor-borda">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-cor-texto">Dashboard do Avaliador</h1>
              <p className="text-sm text-cor-texto opacity-75">Bem-vindo(a), {usuario?.nome_completo}</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-cor-destaque text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-cor-superficie rounded-lg p-6 shadow">
          <h2 className="text-lg font-semibold text-cor-texto mb-4">Em desenvolvimento</h2>
          <p className="text-cor-texto opacity-75">
            Esta página está em construção. Em breve você terá acesso às funcionalidades do avaliador.
          </p>
        </div>
      </main>
    </div>
  )
}
