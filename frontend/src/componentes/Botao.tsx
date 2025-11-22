import type { ButtonHTMLAttributes } from 'react'
import clsx from 'clsx'

type VariacaoBotao = 'principal' | 'secundario' | 'fantasma'

interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variacao?: VariacaoBotao
  carregando?: boolean
}

const ESTILOS_VARIACAO: Record<VariacaoBotao, string> = {
  principal: 'bg-cor-destaque text-cor-fundo hover:opacity-90',
  secundario: 'bg-cor-superficie text-cor-texto border border-cor-borda hover:bg-cor-borda/30',
  fantasma: 'bg-transparent text-cor-texto hover:bg-cor-borda/20',
}

export function Botao({ variacao = 'principal', carregando = false, className, children, disabled, ...resto }: BotaoProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-padrao px-4 py-2 font-medium transition',
        ESTILOS_VARIACAO[variacao],
        className,
      )}
      disabled={disabled || carregando}
      {...resto}
    >
      {carregando ? 'Carregando...' : children}
    </button>
  )
}
