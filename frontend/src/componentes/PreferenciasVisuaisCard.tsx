import { useTema, temasDisponiveis } from '../tema'
import type { NomeTema, TamanhoFonte, FamiliaFonte } from '../tema'
import { Check } from 'lucide-react'

const tamanhosFonte: Array<{ valor: TamanhoFonte; label: string; descricao: string }> = [
  { valor: 'pequeno', label: 'Pequeno', descricao: 'Compacto' },
  { valor: 'medio', label: 'Medio', descricao: 'Padrao' },
  { valor: 'grande', label: 'Grande', descricao: 'Confortavel' },
]

const familiasFonte: Array<{ valor: FamiliaFonte; label: string; descricao: string; preview: string }> = [
  { valor: 'padrao', label: 'Padrão', descricao: 'Sans-serif', preview: 'font-sans' },
  { valor: 'serif', label: 'Serif', descricao: 'Tradicional', preview: 'font-serif' },
  { valor: 'mono', label: 'Monoespaçada', descricao: 'Código', preview: 'font-mono' },
]

export function PreferenciasVisuaisCard() {
  const { temaAtual, tamanhoFonteAtual, familiaFonteAtual, definirTema, definirTamanhoFonte, definirFamiliaFonte } = useTema()

  return (
    <div className="bg-cor-superficie border border-cor-borda rounded-lg p-6 space-y-6">
      {/* Grupo: Tema */}
      <div>
        <h3 className="text-grande font-semibold text-cor-texto mb-4">Tema</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {temasDisponiveis.map((tema) => (
            <div key={tema.nome} className="flex flex-col items-center gap-2">
              <button
                onClick={() => definirTema(tema.nome as NomeTema)}
                className={`
                  relative py-10 px-4 rounded-lg border-2 transition-all flex items-center justify-center w-full
                  ${
                    temaAtual === tema.nome
                      ? 'border-cor-destaque bg-cor-destaque/5'
                      : 'border-cor-borda hover:border-cor-destaque/50'
                  }
                `}
              >
                {temaAtual === tema.nome && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-cor-destaque rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <div className="flex gap-2 justify-center">
                  <div
                    className="w-6 h-6 rounded border-2 border-[rgb(var(--cor-borda-forte))] shadow-sm"
                    style={{ backgroundColor: tema.cores.fundo }}
                  />
                  <div
                    className="w-6 h-6 rounded border-2 border-[rgb(var(--cor-borda-forte))] shadow-sm"
                    style={{ backgroundColor: tema.cores.destaque }}
                  />
                </div>
              </button>
              <h4 className="font-semibold text-pequeno text-cor-texto text-center">{tema.titulo}</h4>
            </div>
          ))}
        </div>
      </div>

      {/* Grupo: Fonte */}
      <div>
        <h3 className="text-grande font-semibold text-cor-texto mb-4">Fonte</h3>
        <div className="space-y-4">
          {/* Subgrupo: Tamanho */}
          <div>
            <h4 className="text-medio font-medium text-cor-texto mb-3">Tamanho</h4>
            <div className="flex gap-3">
              {tamanhosFonte.map((tamanho) => (
                <button
                  key={tamanho.valor}
                  onClick={() => definirTamanhoFonte(tamanho.valor)}
                  className={`
                    flex-1 p-4 rounded-lg border-2 transition-all
                    ${
                      tamanhoFonteAtual === tamanho.valor
                        ? 'border-cor-destaque bg-cor-destaque/5'
                        : 'border-cor-borda hover:border-cor-destaque/50'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-semibold text-medio text-cor-texto">{tamanho.label}</h5>
                      <p className="text-pequeno text-cor-texto opacity-75">{tamanho.descricao}</p>
                    </div>
                    {tamanhoFonteAtual === tamanho.valor && (
                      <div className="w-5 h-5 bg-cor-destaque rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Subgrupo: Tipo */}
          <div>
            <h4 className="text-medio font-medium text-cor-texto mb-3">Tipo</h4>
            <div className="flex gap-3">
              {familiasFonte.map((familia) => (
                <button
                  key={familia.valor}
                  onClick={() => definirFamiliaFonte(familia.valor)}
                  className={`
                    flex-1 p-4 rounded-lg border-2 transition-all
                    ${
                      familiaFonteAtual === familia.valor
                        ? 'border-cor-destaque bg-cor-destaque/5'
                        : 'border-cor-borda hover:border-cor-destaque/50'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className={`font-semibold text-medio text-cor-texto ${familia.preview}`}>
                        {familia.label}
                      </h5>
                      <p className="text-pequeno text-cor-texto opacity-75">{familia.descricao}</p>
                      <p className={`text-pequeno text-cor-texto opacity-60 mt-1 ${familia.preview}`}>
                        Exemplo Aa 123
                      </p>
                    </div>
                    {familiaFonteAtual === familia.valor && (
                      <div className="w-5 h-5 bg-cor-destaque rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}