import { PreferenciasVisuaisCard, PreferenciasEmailCard } from '../../componentes'

export function ConfiguracoesPreferencias() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-cor-texto">Preferências Visuais</h2>
        <PreferenciasVisuaisCard />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-cor-texto">Preferências de E-mail</h2>
        <PreferenciasEmailCard />
      </section>
    </div>
  )
}
