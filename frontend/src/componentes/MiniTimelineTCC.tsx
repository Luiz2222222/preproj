/**
 * MiniTimelineTCC - Componente compacto para exibir timeline de TCC
 * Usado na tabela de professores para mostrar progresso de orientações e bancas
 */

import { EtapaTCC } from '../types/enums';

// Tipo simplificado para TCC resumido
export interface TCCResumo {
  id: number;
  titulo: string;
  aluno_nome: string;
  aluno_id: number;
  etapa_atual: string; // EtapaTCC
  tipo_orientacao?: 'ORIENTADOR' | 'CO_ORIENTADOR';
}

interface MiniTimelineTCCProps {
  tcc: TCCResumo;
  tipo: 'orientacao' | 'coorientacao' | 'banca';
  className?: string;
  apenasTimeline?: boolean;
}

// Mapear etapa atual para índice de progresso (1-7)
function obterIndiceProgresso(etapa: string): number {
  switch (etapa) {
    case EtapaTCC.INICIALIZACAO:
      return 1;
    case EtapaTCC.DESENVOLVIMENTO:
    case EtapaTCC.DESCONTINUADO:
      return 2;
    case EtapaTCC.FORMACAO_BANCA_FASE_1:
      return 3;
    case EtapaTCC.AVALIACAO_FASE_1:
    case EtapaTCC.VALIDACAO_FASE_1:
    case EtapaTCC.REPROVADO_FASE_1:
      return 4;
    case EtapaTCC.AGENDAMENTO_APRESENTACAO:
      return 5;
    case EtapaTCC.APRESENTACAO_FASE_2:
    case EtapaTCC.APROVADO:
    case EtapaTCC.REPROVADO_FASE_2:
      return 6;
    case EtapaTCC.ANALISE_FINAL_COORDENADOR:
    case EtapaTCC.AGUARDANDO_AJUSTES_FINAIS:
    case EtapaTCC.CONCLUIDO:
      return 7;
    default:
      return 1;
  }
}

// Obter label curto para cada etapa
function obterLabelEtapa(etapa: string): string {
  switch (etapa) {
    case EtapaTCC.INICIALIZACAO:
      return 'Inicialização';
    case EtapaTCC.DESENVOLVIMENTO:
      return 'Desenvolvimento';
    case EtapaTCC.DESCONTINUADO:
      return 'Descontinuado';
    case EtapaTCC.FORMACAO_BANCA_FASE_1:
      return 'Formação banca';
    case EtapaTCC.AVALIACAO_FASE_1:
      return 'Avaliação Fase I';
    case EtapaTCC.VALIDACAO_FASE_1:
      return 'Validação Fase I';
    case EtapaTCC.REPROVADO_FASE_1:
      return 'Reprovado Fase I';
    case EtapaTCC.AGENDAMENTO_APRESENTACAO:
      return 'Agendamento';
    case EtapaTCC.APRESENTACAO_FASE_2:
      return 'Apresentação';
    case EtapaTCC.APROVADO:
      return 'Aprovado';
    case EtapaTCC.REPROVADO_FASE_2:
      return 'Reprovado Fase II';
    case EtapaTCC.ANALISE_FINAL_COORDENADOR:
      return 'Análise final';
    case EtapaTCC.AGUARDANDO_AJUSTES_FINAIS:
      return 'Aguardando ajustes';
    case EtapaTCC.CONCLUIDO:
      return 'Concluído';
    default:
      return 'Em andamento';
  }
}

export const MiniTimelineTCC = ({ tcc, tipo, className = '', apenasTimeline = false }: MiniTimelineTCCProps) => {
  const indiceProgresso = obterIndiceProgresso(tcc.etapa_atual);
  const labelEtapa = obterLabelEtapa(tcc.etapa_atual);
  const isCoorientacao = tipo === 'coorientacao' || tcc.tipo_orientacao === 'CO_ORIENTADOR';

  // Definir cor baseada no tipo
  const corPonto = tipo === 'banca' ? 'bg-[rgb(var(--cor-fase2-cabecalho))]' : 'bg-cor-destaque';
  const corPontoPendente = 'bg-[rgb(var(--cor-borda))]';

  return (
    <div className={`space-y-2 ${className}`}>
      {!apenasTimeline && (
        <>
          {/* Nome do aluno */}
          <div>
            <p className="text-sm font-medium text-cor-texto">
              {tcc.aluno_nome}
            </p>
            {isCoorientacao && (
              <p className="text-xs text-cor-texto/60 mt-0.5">
                Co-orientação
              </p>
            )}
          </div>

          {/* Título do TCC */}
          <p className="text-xs text-cor-texto/80 line-clamp-2" title={tcc.titulo}>
            {tcc.titulo}
          </p>
        </>
      )}

      {/* Timeline com 7 pontos */}
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7].map((numero) => (
          <div
            key={numero}
            className={`
              w-3 h-3 rounded-full transition-all
              ${numero <= indiceProgresso ? corPonto : corPontoPendente}
            `}
            title={`Etapa ${numero}/7`}
          />
        ))}
      </div>

      {/* Status atual */}
      <p className="text-xs text-cor-texto/60">
        {labelEtapa}
      </p>
    </div>
  );
};
