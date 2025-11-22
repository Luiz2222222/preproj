import type { PropsWithChildren } from 'react'
import { Link } from 'react-router-dom'
import { useTema } from '../tema'
import { GraduationCap } from 'lucide-react'

export function EstruturaApp({ children }: PropsWithChildren) {
  const { temaAtual } = useTema()
  const isWhiteTheme = temaAtual === 'white'

  const renderWhiteHeader = () => (
    <header className="h-16 bg-[rgb(var(--cor-superficie))] border-b border-[rgb(var(--cor-borda))] shadow-sm sticky top-0 z-40">
      <div className="h-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-2xl text-[rgb(var(--cor-texto-sobre-destaque))] shadow-[0_12px_32px_-16px_rgba(14,165,233,0.9)]"
                style={{ background: 'linear-gradient(135deg,var(--cor-brand-gradient-inicio) 0%,var(--cor-brand-gradient-fim) 100%)' }}
              >
                <GraduationCap className="h-6 w-6" strokeWidth={1.8} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[rgb(var(--cor-texto-primario))]">Portal TCC</h1>
                <p className="text-xs text-[rgb(var(--cor-texto-terciario))]">DEE/UFPE</p>
              </div>
            </div>
          </div>
          <div className="text-pequeno text-[rgb(var(--cor-texto-terciario))]">
            Área em construção
          </div>
        </div>
      </div>
    </header>
  )

  const renderDefaultHeader = () => (
    <header className="flex items-center justify-between border-b border-cor-borda bg-cor-superficie px-6 py-4">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-cor-texto">
            Portal TCC
          </h1>
          <p className="text-sm text-cor-texto opacity-75">
            DEE/UFPE
          </p>
        </div>
      </div>
      <div className="text-pequeno text-cor-texto/70">
        Área em construção
      </div>
    </header>
  )

  const renderWhiteSidebar = () => (
    <aside className="hidden w-64 bg-[rgb(var(--cor-superficie))] border-r border-[rgb(var(--cor-borda))] shadow-sm p-6 lg:block">
      <nav className="space-y-4">
        <p className="font-semibold uppercase tracking-wide text-[rgb(var(--cor-texto-terciario))] text-pequeno">
          Menu
        </p>
        <ul className="space-y-2">
          <li>
            <Link
              className="transition text-sm font-medium text-[rgb(var(--cor-texto-primario))] hover:bg-[rgb(var(--cor-superficie-hover))] px-3 py-2 rounded-lg flex items-center"
              to="/sandbox"
            >
              Laboratório visual
            </Link>
          </li>
          <li className="text-[rgb(var(--cor-texto-terciario))] text-sm px-3 py-2">
            Dashboard (em breve)
          </li>
          <li className="text-[rgb(var(--cor-texto-terciario))] text-sm px-3 py-2">
            Documentos (em breve)
          </li>
        </ul>
      </nav>
    </aside>
  )

  const renderDefaultSidebar = () => (
    <aside className="hidden w-64 border-r border-cor-borda bg-cor-superficie/70 p-6 lg:block">
      <nav className="space-y-4">
        <p className="font-semibold uppercase tracking-wide text-cor-texto/60 text-pequeno">
          Menu
        </p>
        <ul className="space-y-2">
          <li>
            <Link
              className="transition hover:text-cor-destaque text-medio text-cor-texto/80"
              to="/sandbox"
            >
              Laboratório visual
            </Link>
          </li>
          <li className="text-cor-texto/40 text-medio">
            Dashboard (em breve)
          </li>
          <li className="text-cor-texto/40 text-medio">
            Documentos (em breve)
          </li>
        </ul>
      </nav>
    </aside>
  )

  return (
    <div className={isWhiteTheme
      ? "min-h-screen bg-[rgb(var(--cor-fundo))] text-cor-texto transition-colors font-sans"
      : "min-h-screen bg-cor-fundo text-cor-texto transition-colors"
    }>
      {isWhiteTheme ? renderWhiteHeader() : renderDefaultHeader()}

      <div className="flex min-h-[calc(100vh-4rem)]">
        {isWhiteTheme ? renderWhiteSidebar() : renderDefaultSidebar()}

        <main className="flex-1 p-6 lg:p-10">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
