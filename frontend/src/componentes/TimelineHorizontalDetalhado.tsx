import { EtapaTCC, StatusDocumento, TipoDocumento } from '../types/enums';
import type { TCC, DocumentoTCC } from '../types';

// Definição dos grupos da timeline
interface GrupoTimeline {
  id: string;
  numero: number;
  label: string;
}

const GRUPOS_TIMELINE: GrupoTimeline[] = [
  { id: 'ORIENTACAO', numero: 1, label: 'Orientação' },
  { id: 'DESENVOLVIMENTO', numero: 2, label: 'Desenvolvimento' },
  { id: 'FORMACAO_BANCA', numero: 3, label: 'Formação banca - Fase I' },
  { id: 'AVALIACAO_FASE1', numero: 4, label: 'Avaliação - Fase I' },
  { id: 'AGENDAMENTO_DEFESA', numero: 5, label: 'Agendamento da defesa' },
  { id: 'AVALIACAO_FASE2', numero: 6, label: 'Avaliação - Fase II' },
  { id: 'FINALIZACAO', numero: 7, label: 'Finalização' }
];

interface TimelineHorizontalDetalhadoProps {
  tcc: TCC;
  documentos?: DocumentoTCC[];
  className?: string;
  mostrarNotas?: boolean; // Mostra notas das fases e status final (para visão do aluno)
}

// Mapear etapa para grupo
function obterGrupoAtual(etapa: EtapaTCC): string {
  switch (etapa) {
    case EtapaTCC.INICIALIZACAO:
      return 'ORIENTACAO';
    case EtapaTCC.DESENVOLVIMENTO:
      return 'DESENVOLVIMENTO';
    case EtapaTCC.FORMACAO_BANCA_FASE_1:
      return 'FORMACAO_BANCA';
    case EtapaTCC.AVALIACAO_FASE_1:
    case EtapaTCC.VALIDACAO_FASE_1:
      return 'AVALIACAO_FASE1';
    case EtapaTCC.AGENDAMENTO_APRESENTACAO:
      return 'AGENDAMENTO_DEFESA';
    case EtapaTCC.APRESENTACAO_FASE_2:
      return 'AVALIACAO_FASE2';
    case EtapaTCC.APROVADO:
      return 'FINALIZACAO';
    case EtapaTCC.ANALISE_FINAL_COORDENADOR:
    case EtapaTCC.AGUARDANDO_AJUSTES_FINAIS:
    case EtapaTCC.CONCLUIDO:
      return 'FINALIZACAO';
    case EtapaTCC.DESCONTINUADO:
      return 'DESENVOLVIMENTO';
    case EtapaTCC.REPROVADO_FASE_1:
      return 'AVALIACAO_FASE1';
    case EtapaTCC.REPROVADO_FASE_2:
      return 'AVALIACAO_FASE2';
    default:
      return 'ORIENTACAO';
  }
}

// Obter label do sub-estado com lógica completa
function obterLabelSubEstado(tcc: TCC, documentos: DocumentoTCC[] = []): string {
  const etapa = tcc.etapa_atual;

  // Calcular monografia mais recente
  const monografias = documentos.filter(d => d.tipo_documento === TipoDocumento.MONOGRAFIA);
  const ultimaMonografia = monografias.length > 0
    ? monografias.sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())[0]
    : null;

  switch (etapa) {
    // ===== ORIENTAÇÃO =====
    case EtapaTCC.INICIALIZACAO:
      return 'Aguardando aceite de solicitação';

    // ===== DESENVOLVIMENTO =====
    case EtapaTCC.DESENVOLVIMENTO:
      // Monografia aprovada + termo enviado
      if (tcc.flag_liberado_avaliacao) {
        return 'Desenvolvimento escrito concluído';
      }
      // Monografia aprovada + continuidade confirmada + aguardando termo
      if (ultimaMonografia?.status === StatusDocumento.APROVADO && tcc.flag_continuidade && !tcc.flag_liberado_avaliacao) {
        return 'Aguardando envio de solicitação de avaliação';
      }
      // Monografia aprovada mas continuidade pendente - status principal
      // A continuidade pendente será exibida como flag separada
      if (ultimaMonografia?.status === StatusDocumento.APROVADO && !tcc.flag_continuidade) {
        return 'TCC aprovado pelo orientador';
      }
      // Tem monografia mas não foi avaliada
      if (ultimaMonografia && ultimaMonografia.status === StatusDocumento.PENDENTE) {
        return 'Aguardando avaliação do orientador';
      }
      // Monografia rejeitada - aguardando novo envio
      if (ultimaMonografia && ultimaMonografia.status === StatusDocumento.REJEITADO) {
        return 'Aguardando envio de TCC';
      }
      // Sem monografia
      if (!ultimaMonografia) {
        return 'Aguardando envio de TCC';
      }
      // Fallback
      return 'Aguardando envio de TCC';

    case EtapaTCC.DESCONTINUADO:
      return 'TCC descontinuado';

    // ===== FORMAÇÃO BANCA - FASE I =====
    case EtapaTCC.FORMACAO_BANCA_FASE_1:
      // TODO: Quando implementar banca_formada no backend, descomentar:
      // return tcc.banca_formada ? 'Banca Formada' : 'Aguardando Formação da Banca';
      return 'Aguardando formação da banca';

    // ===== AVALIAÇÃO - FASE I =====
    case EtapaTCC.AVALIACAO_FASE_1:
      return 'Banca em avaliação';

    case EtapaTCC.VALIDACAO_FASE_1:
      return 'Aguardando aprovação da coordenação';

    case EtapaTCC.REPROVADO_FASE_1:
      return 'Reprovado';

    // ===== AGENDAMENTO DA DEFESA =====
    case EtapaTCC.AGENDAMENTO_APRESENTACAO:
      // TODO: Quando implementar data_defesa no backend, descomentar:
      // if (tcc.data_defesa && tcc.hora_defesa) {
      //   return `Defesa Agendada ${tcc.data_defesa} ${tcc.hora_defesa}`;
      // }
      return 'Aguardando agendamento';

    // ===== AVALIAÇÃO - FASE II =====
    case EtapaTCC.APRESENTACAO_FASE_2:
      if (tcc.data_defesa && tcc.hora_defesa) {
        return `Defesa agendada: ${tcc.data_defesa} às ${tcc.hora_defesa}`;
      }
      return 'Aguardando avaliação da defesa';

    case EtapaTCC.APROVADO:
      return 'Aprovado na defesa';

    case EtapaTCC.REPROVADO_FASE_2:
      return 'Reprovado';

    // ===== FINALIZAÇÃO =====
    case EtapaTCC.ANALISE_FINAL_COORDENADOR:
      return 'Aguardando análise do coordenador';

    case EtapaTCC.AGUARDANDO_AJUSTES_FINAIS:
      return 'Aguardando ajustes da banca';

    case EtapaTCC.CONCLUIDO:
      return 'Concluído';

    default:
      return '';
  }
}

// Obter status do grupo
function obterStatusGrupo(grupoId: string, grupoAtual: string, etapaAtual: EtapaTCC): string {
  const gruposOrdenados = GRUPOS_TIMELINE.map(g => g.id);
  const indiceAtual = gruposOrdenados.indexOf(grupoAtual);
  const indiceGrupo = gruposOrdenados.indexOf(grupoId);

  // Caso especial: se TCC está CONCLUÍDO, todos os grupos devem aparecer como concluídos
  if (etapaAtual === EtapaTCC.CONCLUIDO) {
    return 'concluido';
  }

  // Caso especial: se TCC está DESCONTINUADO e o grupo é DESENVOLVIMENTO, marcar como problema (vermelho)
  if (etapaAtual === EtapaTCC.DESCONTINUADO && grupoId === 'DESENVOLVIMENTO') {
    return 'problema';
  }

  if (indiceGrupo === indiceAtual) return 'em_andamento';
  if (indiceGrupo < indiceAtual) return 'concluido';
  return 'futuro';
}

// Verificar se TCC está totalmente finalizado (não deve mostrar status ativo)
function isTCCFinalizado(etapaAtual: EtapaTCC): boolean {
  return etapaAtual === EtapaTCC.CONCLUIDO;
}

// Cores do ponto baseadas no status
function getPointColor(status: string): string {
  switch (status) {
    case 'concluido':
      return 'bg-cor-sucesso';
    case 'em_andamento':
      return 'bg-cor-alerta';
    case 'aguardando':
      return 'bg-cor-alerta';
    case 'problema':
      return 'bg-cor-erro';
    default:
      return 'bg-cor-borda';
  }
}

// Cor do texto baseada no status
function getTextColor(status: string): string {
  switch (status) {
    case 'concluido':
      return 'text-cor-sucesso';
    case 'em_andamento':
      return 'text-cor-alerta';
    case 'aguardando':
      return 'text-cor-alerta';
    case 'problema':
      return 'text-cor-erro';
    default:
      return 'text-cor-borda';
  }
}

// Removido: função getStatusIcon não é mais necessária
// Os círculos sempre exibirão o número da etapa

// Helper para formatar nota com vírgula
const formatarNota = (nota: number | string | null | undefined): string => {
  if (nota === null || nota === undefined) return '-';
  const valor = Number(nota);
  if (Number.isNaN(valor)) return '-';
  return valor.toFixed(2).replace('.', ',');
};

// Obter status final
const getStatusFinal = (etapa: EtapaTCC): { tipo: 'aprovado' | 'reprovado' | 'descontinuado'; label: string } | null => {
  switch (etapa) {
    case EtapaTCC.CONCLUIDO:
      return { tipo: 'aprovado', label: 'Aprovado' };
    case EtapaTCC.REPROVADO_FASE_1:
      return { tipo: 'reprovado', label: 'Reprovado' };
    case EtapaTCC.REPROVADO_FASE_2:
      return { tipo: 'reprovado', label: 'Reprovado' };
    case EtapaTCC.DESCONTINUADO:
      return { tipo: 'descontinuado', label: 'Descontinuado' };
    default:
      return null;
  }
};

export const TimelineHorizontalDetalhado = (props: TimelineHorizontalDetalhadoProps) => {
  const { tcc, documentos = [], className = '', mostrarNotas = false } = props;
  const grupoAtual = obterGrupoAtual(tcc.etapa_atual);
  const subEstadoLabel = obterLabelSubEstado(tcc, documentos);
  const finalizado = isTCCFinalizado(tcc.etapa_atual);
  const statusFinal = getStatusFinal(tcc.etapa_atual);

  // Verificar status da monografia e permissão de continuidade
  const monografias = documentos.filter(d => d.tipo_documento === TipoDocumento.MONOGRAFIA);
  const ultimaMonografia = monografias.length > 0
    ? monografias.sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())[0]
    : null;
  const monografiaAprovada = ultimaMonografia?.status === StatusDocumento.APROVADO;
  const monografiaAvaliada = ultimaMonografia?.status === StatusDocumento.APROVADO || ultimaMonografia?.status === StatusDocumento.REJEITADO;

  // Flag de continuidade pendente:
  // Mostra quando backend libera (data chegou ou monografia aprovada) E não confirmou
  // Só some quando confirmar - não depende de status da monografia
  const podeConfirmar = tcc.permissoes?.pode_confirmar_continuidade === true;
  const continuidadePendente = podeConfirmar && !tcc.flag_continuidade;

  return (
    <div className={`w-full bg-cor-superficie rounded-lg shadow-sm p-6 ${className}`}>
      {/* Badge de status final no canto superior direito */}
      {mostrarNotas && statusFinal && (
        <div className="flex justify-end mb-4">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${
            statusFinal.tipo === 'aprovado'
              ? 'bg-cor-sucesso/10 text-cor-sucesso border border-cor-sucesso/20'
              : statusFinal.tipo === 'reprovado'
              ? 'bg-cor-erro/10 text-cor-erro border border-cor-erro/20'
              : 'bg-cor-borda/20 text-cor-texto border border-cor-borda/40'
          }`}>
            {statusFinal.label}
          </span>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        {/* Linha conectora única - não ultrapassa primeiro e último ponto */}
        <div
          className="absolute top-6 h-0.5 bg-cor-borda/60"
          style={{
            left: 'calc(100% / 14)',
            right: 'calc(100% / 14)'
          }}
        />

        {/* Container para os grupos */}
        <div className="relative flex justify-between items-start">
          {GRUPOS_TIMELINE.map((grupo) => {
            const status = obterStatusGrupo(grupo.id, grupoAtual, tcc.etapa_atual);
            // Se TCC está finalizado, não marcar nenhum grupo como "atual" (ativo)
            const isAtual = !finalizado && grupo.id === grupoAtual;
            const pointColor = getPointColor(status);
            const textColor = getTextColor(status);

            return (
              <div
                key={grupo.id}
                className="flex flex-col items-center relative"
                style={{
                  flex: '0 0 14.28%',
                  maxWidth: '14.28%'
                }}
              >
                {/* Ponto com número da etapa */}
                <div className="relative z-10">
                  <div
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center
                      ${pointColor} text-white font-bold text-sm
                      ${isAtual ? 'ring-4 ring-offset-2 ring-cor-borda/30 scale-110' : ''}
                      transition-all duration-300 transform hover:scale-105
                    `}
                  >
                    {grupo.numero}
                  </div>
                </div>

                {/* Label do grupo */}
                <div className="mt-3 text-center">
                  <p className={`text-xs font-medium ${textColor} ${isAtual ? 'font-bold' : ''}`}>
                    {grupo.label}
                  </p>
                </div>

                {/* Status embaixo - só para grupos já passados ou atual */}
                {(status === 'concluido' || isAtual || status === 'problema') && isAtual && subEstadoLabel && (
                  <div className="mt-2 px-2">
                    <p className={`text-xs text-center ${
                      status === 'problema' ? 'text-cor-erro font-semibold' :
                      isAtual ? 'text-cor-destaque font-medium' :
                      'text-cor-texto'
                    }`}>
                      {subEstadoLabel}
                    </p>
                  </div>
                )}

                {/* Informações adicionais (data de defesa, etc) */}
                {isAtual && tcc.data_defesa && (grupo.id === 'AGENDAMENTO_DEFESA' || grupo.id === 'AVALIACAO_FASE2') && (
                  <div className="mt-2 px-2 py-1 bg-cor-destaque/10 rounded-md">
                    <div className="text-xs text-cor-destaque text-center font-medium">
                      <div>{tcc.data_defesa}</div>
                      {tcc.hora_defesa && (
                        <div>às {tcc.hora_defesa}</div>
                      )}
                      {tcc.local_defesa && (
                        <div className="text-xs text-cor-texto/60 mt-1">
                          {tcc.local_defesa}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Flag de continuidade confirmada - não mostrar se descontinuado */}
                {grupo.id === 'DESENVOLVIMENTO' && tcc.flag_continuidade && isAtual && tcc.etapa_atual !== EtapaTCC.DESCONTINUADO && (
                  <div className="mt-2 flex justify-center">
                    <span className="inline-flex items-center justify-center px-3 py-1 text-xs bg-cor-sucesso/20 text-cor-sucesso rounded-full font-medium mx-auto text-center">
                      Continuidade aprovada
                    </span>
                  </div>
                )}

                {/* Flag de continuidade pendente - não mostrar se descontinuado */}
                {grupo.id === 'DESENVOLVIMENTO' && continuidadePendente && isAtual && tcc.etapa_atual !== EtapaTCC.DESCONTINUADO && (
                  <div className="mt-2 flex justify-center">
                    <span className="inline-flex items-center justify-center px-3 py-1 text-xs bg-cor-alerta/20 text-cor-alerta rounded-full font-medium mx-auto text-center">
                      Aguardando confirmação de continuidade
                    </span>
                  </div>
                )}

                {/* Notas - apenas quando mostrarNotas está ativo */}
                {mostrarNotas && (
                  <>
                    {/* Nota Fase I */}
                    {grupo.id === 'AVALIACAO_FASE1' && tcc.nf1 !== null && (
                      <div className="mt-2 px-1">
                        <div className="bg-cor-destaque/10 rounded-md px-2 py-1 text-center">
                          <p className="text-[10px] text-cor-destaque font-medium">Nota</p>
                          <p className="text-sm font-bold text-cor-destaque">{formatarNota(tcc.nf1)}</p>
                        </div>
                      </div>
                    )}

                    {/* Nota Fase II */}
                    {grupo.id === 'AVALIACAO_FASE2' && tcc.nf2 !== null && (
                      <div className="mt-2 px-1">
                        <div className="bg-purple-100 dark:bg-purple-900/30 rounded-md px-2 py-1 text-center">
                          <p className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">Nota</p>
                          <p className="text-sm font-bold text-purple-600 dark:text-purple-400">{formatarNota(tcc.nf2)}</p>
                        </div>
                      </div>
                    )}

                    {/* Média Final */}
                    {grupo.id === 'FINALIZACAO' && tcc.media_final !== null && (
                      <div className="mt-2 px-1">
                        <div className={`rounded-md px-2 py-1 text-center ${
                          Number(tcc.media_final) >= 6
                            ? 'bg-cor-sucesso/10'
                            : 'bg-cor-erro/10'
                        }`}>
                          <p className={`text-[10px] font-medium ${
                            Number(tcc.media_final) >= 6 ? 'text-cor-sucesso' : 'text-cor-erro'
                          }`}>Média Final</p>
                          <p className={`text-sm font-bold ${
                            Number(tcc.media_final) >= 6 ? 'text-cor-sucesso' : 'text-cor-erro'
                          }`}>{formatarNota(tcc.media_final)}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
