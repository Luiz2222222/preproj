/**
 * Componente compartilhado: Painel de Datas Importantes
 * Exibe o card de datas importantes do calendário acadêmico
 * Reutilizado nos dashboards do coordenador e professor
 */

import { Calendar, type LucideIcon } from 'lucide-react'
import type { CalendarioSemestre } from '../types'

export interface DataImportante {
  id: number | string
  titulo: string
  descricao: string
  data: string
  icone: LucideIcon
  cor: string
  temDados?: boolean
}

export interface PainelDatasImportantesProps {
  titulo?: string
  datas: DataImportante[]
  calendario?: CalendarioSemestre | null
  altura?: string
}

// Mapa de cores usando variáveis de tema
const coresBackground: Record<string, string> = {
  blue: 'bg-[rgb(var(--cor-destaque))]/10',
  cyan: 'bg-[rgb(var(--cor-destaque))]/10',
  yellow: 'bg-[rgb(var(--cor-alerta))]/10',
  purple: 'bg-[rgb(var(--cor-fase2-cabecalho))]/10',
  violet: 'bg-[rgb(var(--cor-fase2-cabecalho))]/10',
  orange: 'bg-[rgb(var(--cor-alerta))]/10',
  pink: 'bg-[rgb(var(--cor-erro))]/10',
  green: 'bg-[rgb(var(--cor-sucesso))]/10',
  indigo: 'bg-[rgb(var(--cor-destaque))]/10',
}

const coresTexto: Record<string, string> = {
  blue: 'text-[rgb(var(--cor-destaque))]',
  cyan: 'text-[rgb(var(--cor-destaque))]',
  yellow: 'text-[rgb(var(--cor-alerta))]',
  purple: 'text-[rgb(var(--cor-fase2-cabecalho))]',
  violet: 'text-[rgb(var(--cor-fase2-cabecalho))]',
  orange: 'text-[rgb(var(--cor-alerta))]',
  pink: 'text-[rgb(var(--cor-erro))]',
  green: 'text-[rgb(var(--cor-sucesso))]',
  indigo: 'text-[rgb(var(--cor-destaque))]',
}

export function PainelDatasImportantes({
  titulo,
  datas,
  calendario,
  altura = '',
}: PainelDatasImportantesProps) {
  // Construir título dinamicamente com o semestre
  const tituloFormatado = calendario?.semestre
    ? `Datas do período - ${calendario.semestre}`
    : 'Datas do período'

  return (
    <div className={`bg-[rgb(var(--cor-superficie))] rounded-xl shadow-sm border border-[rgb(var(--cor-borda))] p-6 h-full ${altura}`}>
      <h2 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))] mb-4 flex items-center gap-2">
        <Calendar className="h-5 w-5 text-[rgb(var(--cor-texto-secundario))]" />
        {titulo ?? tituloFormatado}
      </h2>
      <div className="space-y-3">
        {datas.map((data) => {
          const Icone = data.icone
          const bgColorClass = coresBackground[data.cor] || coresBackground.blue
          const textColorClass = coresTexto[data.cor] || coresTexto.blue

          return (
            <div key={data.id} className="flex items-start gap-3">
              <div className={`p-2 ${bgColorClass} rounded-lg`}>
                <Icone className={`h-4 w-4 ${textColorClass}`} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-[rgb(var(--cor-texto-primario))]">{data.titulo}</p>
                    <p className="text-xs text-[rgb(var(--cor-texto-secundario))]">{data.descricao}</p>
                  </div>
                  <span className={`text-sm ${data.temDados ? 'text-[rgb(var(--cor-texto-primario))]/70' : 'text-[rgb(var(--cor-texto-secundario))]/70'}`}>
                    {data.data}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
