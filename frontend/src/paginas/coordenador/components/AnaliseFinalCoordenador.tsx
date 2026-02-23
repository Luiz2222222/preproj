/**
 * Componente para análise final e conclusão do TCC pelo coordenador
 * Mostra NF1, NF2, MF, resultado e permite aprovar e concluir
 */

import { useState } from 'react';
import {
  CheckCircle,
  Award,
  TrendingUp,
  FileCheck,
  Loader2,
  AlertCircle,
  Lock,
  Unlock,
  Clock,
  Presentation
} from 'lucide-react';
import type { TCC } from '../../../types';
import { useAvaliacoesFase2, useCalendarioSemestre } from '../../../hooks';
import { StatusAvaliacaoFase2 } from '../../../types/enums';
import { formatarDataCurta } from '../../../utils/datas';
import api from '../../../servicos/api';
import { Modal } from '../../../componentes/Modal';

// Extrair seção do parecer estruturado
function extractSection(parecer: string, sectionName: string): string {
  const regex = new RegExp(`===\\s*${sectionName}\\s*===\\s*([\\s\\S]*?)(?=\\n===|$)`, 'i');
  const match = parecer.match(regex);
  return match ? match[1].trim() : '';
}

interface AnaliseFinalCoordenadorProps {
  tcc: TCC;
  onConclusao?: () => void;
  somenteLeitura?: boolean;
}

export function AnaliseFinalCoordenador({ tcc, onConclusao, somenteLeitura = false }: AnaliseFinalCoordenadorProps) {
  const { calendario } = useCalendarioSemestre();
  const {
    avaliacoes,
    carregando,
    erro,
    bloquear,
    desbloquear,
    processando: processandoHook
  } = useAvaliacoesFase2({
    tccId: tcc.id,
    autoCarregar: true
  });

  // Pesos do calendário (com fallback para valores padrão e conversão para número)
  const pesos = {
    coerencia: Number(calendario?.peso_coerencia_conteudo) || 2.0,
    qualidade: Number(calendario?.peso_qualidade_apresentacao) || 2.0,
    dominio: Number(calendario?.peso_dominio_tema) || 2.5,
    clareza: Number(calendario?.peso_clareza_fluencia) || 2.5,
    tempo: Number(calendario?.peso_observancia_tempo) || 1.0
  };
  const pesoTotal = pesos.coerencia + pesos.qualidade + pesos.dominio + pesos.clareza + pesos.tempo;

  const criterios = [
    { label: 'Coerência do Conteúdo', campo: 'nota_coerencia_conteudo' as const, peso: pesos.coerencia, secao: 'Coerência' },
    { label: 'Qualidade da Apresentação', campo: 'nota_qualidade_apresentacao' as const, peso: pesos.qualidade, secao: 'Qualidade' },
    { label: 'Domínio do Tema', campo: 'nota_dominio_tema' as const, peso: pesos.dominio, secao: 'Domínio' },
    { label: 'Clareza e Fluência', campo: 'nota_clareza_fluencia' as const, peso: pesos.clareza, secao: 'Clareza' },
    { label: 'Observância do Tempo', campo: 'nota_observancia_tempo' as const, peso: pesos.tempo, secao: 'Tempo' },
  ];

  const [processando, setProcessando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [modalAprovar, setModalAprovar] = useState(false);
  const [modalSolicitarAjustes, setModalSolicitarAjustes] = useState(false);
  const [modalBloquear, setModalBloquear] = useState(false);
  const [modalDesbloquear, setModalDesbloquear] = useState(false);
  const [avaliadoresSelecionados, setAvaliadoresSelecionados] = useState<number[]>([]);
  const [mensagemAjustes, setMensagemAjustes] = useState('');

  // Estatísticas das avaliações
  const totalAvaliacoes = avaliacoes.length;
  const avaliacoesPendentes = avaliacoes.filter(a => a.status === StatusAvaliacaoFase2.PENDENTE).length;
  const avaliacoesEnviadas = avaliacoes.filter(a => a.status === StatusAvaliacaoFase2.ENVIADO).length;
  const avaliacoesBloqueadas = avaliacoes.filter(a => a.status === StatusAvaliacaoFase2.BLOQUEADO || a.status === StatusAvaliacaoFase2.CONCLUIDO);
  const todasBloqueadas = totalAvaliacoes === 3 && avaliacoesBloqueadas.length === 3;
  const existemPendentes = avaliacoesPendentes > 0;

  // Dados do TCC
  const nf1 = tcc.nf1 ? Number(tcc.nf1) : null;
  const nf2 = tcc.nf2 ? Number(tcc.nf2) : null;
  const mediaFinal = tcc.media_final ? Number(tcc.media_final) : null;
  const resultado = tcc.resultado_final;

  // Formatar número com vírgula como separador decimal (padrão brasileiro)
  const formatarNota = (valor: number | null, casas: number = 2): string => {
    if (valor === null) return '-';
    return valor.toFixed(casas).replace('.', ',');
  };

  const handleAprovarConcluir = async () => {
    try {
      setMensagemSucesso(null);
      setModalAprovar(false);
      setProcessando(true);

      const response = await api.post(`/tccs/${tcc.id}/analise-final/aprovar-concluir/`);

      setMensagemSucesso(
        `TCC aprovado e concluído com sucesso! ${response.data.resultado_final === 'APROVADO' ? '🎉' : ''}`
      );

      if (onConclusao) {
        onConclusao();
      }
    } catch (err: any) {
      console.error('Erro ao aprovar e concluir TCC:', err);
      alert(err.response?.data?.detail || 'Erro ao aprovar e concluir TCC');
    } finally {
      setProcessando(false);
    }
  };

  const handleSolicitarAjustesFinais = async () => {
    try {
      setMensagemSucesso(null);
      setModalSolicitarAjustes(false);
      setProcessando(true);

      const response = await api.post(`/tccs/${tcc.id}/analise-final/solicitar-ajustes-finais/`, {
        avaliadores: avaliadoresSelecionados,
        mensagem: mensagemAjustes
      });

      // Mensagem detalhada mostrando quantas avaliações foram reabertas em cada fase
      const { avaliacoes_reabertas_fase2, avaliacoes_reabertas_fase1 } = response.data;
      let mensagem = `Ajustes finais solicitados para ${avaliadoresSelecionados.length} avaliador(es). `;
      mensagem += `Fase II: ${avaliacoes_reabertas_fase2} avaliação(ões) reaberta(s)`;
      if (avaliacoes_reabertas_fase1 > 0) {
        mensagem += `. Fase I: ${avaliacoes_reabertas_fase1} avaliação(ões) reaberta(s) (apenas avaliadores externos)`;
      }
      mensagem += '. TCC movido para AGUARDANDO_AJUSTES_FINAIS.';

      setMensagemSucesso(mensagem);

      // Limpar seleção
      setAvaliadoresSelecionados([]);
      setMensagemAjustes('');

      if (onConclusao) {
        onConclusao();
      }
    } catch (err: any) {
      console.error('Erro ao solicitar ajustes finais:', err);
      alert(err.response?.data?.detail || 'Erro ao solicitar ajustes finais');
    } finally {
      setProcessando(false);
    }
  };

  const handleToggleAvaliador = (avaliadorId: number) => {
    setAvaliadoresSelecionados(prev =>
      prev.includes(avaliadorId)
        ? prev.filter(id => id !== avaliadorId)
        : [...prev, avaliadorId]
    );
  };

  // Determinar quais fases cada avaliador pode ajustar
  const getFasesAjustaveis = (avaliadorId: number): string => {
    const ehOrientador = tcc.orientador === avaliadorId;
    const ehCoorientador = tcc.coorientador === avaliadorId;

    if (ehOrientador || ehCoorientador) {
      return 'apenas Fase II';
    }
    return 'Fase I e II';
  };

  // Handler para bloquear avaliações
  const handleBloquear = async () => {
    try {
      setMensagemSucesso(null);
      setModalBloquear(false);
      const resultado = await bloquear();
      setMensagemSucesso(`${resultado.avaliacoes_bloqueadas} avaliação(ões) bloqueada(s) com sucesso!`);
      if (onConclusao) {
        onConclusao();
      }
    } catch (err) {
      console.error('Erro ao bloquear avaliações:', err);
    }
  };

  // Handler para desbloquear avaliações
  const handleDesbloquear = async () => {
    try {
      setMensagemSucesso(null);
      setModalDesbloquear(false);
      const resultado = await desbloquear();
      setMensagemSucesso(`${resultado.avaliacoes_desbloqueadas} avaliação(ões) desbloqueada(s) com sucesso!`);
      if (onConclusao) {
        onConclusao();
      }
    } catch (err) {
      console.error('Erro ao desbloquear avaliações:', err);
    }
  };

  // Badge de status da avaliação
  const foiAprovadaFase2 = tcc.etapa_atual === 'CONCLUIDO';

  const getStatusBadge = (status: string) => {
    const config = {
      [StatusAvaliacaoFase2.PENDENTE]: {
        bg: 'bg-[rgb(var(--cor-alerta))]/10',
        text: 'text-[rgb(var(--cor-alerta))]',
        icon: Clock,
        label: 'Pendente'
      },
      [StatusAvaliacaoFase2.ENVIADO]: {
        bg: 'bg-[rgb(var(--cor-destaque))]/10',
        text: 'text-[rgb(var(--cor-destaque))]',
        icon: CheckCircle,
        label: 'Enviado'
      },
      [StatusAvaliacaoFase2.BLOQUEADO]: {
        bg: 'bg-[rgb(var(--cor-fundo))]',
        text: 'text-[rgb(var(--cor-texto-secundario))]',
        icon: Lock,
        label: 'Bloqueado'
      },
      [StatusAvaliacaoFase2.CONCLUIDO]: {
        bg: 'bg-[rgb(var(--cor-sucesso))]/10',
        text: 'text-[rgb(var(--cor-sucesso))]',
        icon: CheckCircle,
        label: 'Concluído'
      }
    };

    const item = config[status as keyof typeof config] || config[StatusAvaliacaoFase2.PENDENTE];
    const Icon = item.icon;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.bg} ${item.text} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {item.label}
      </span>
    );
  };

  if (carregando) {
    return (
      <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-sm border border-[rgb(var(--cor-borda))] p-6 mb-6">
        <div className="flex items-center justify-center gap-2 text-[rgb(var(--cor-texto-secundario))]">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Carregando análise final...</span>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-sm border border-[rgb(var(--cor-borda))] p-6 mb-6">
        <div className="flex items-center gap-2 text-[rgb(var(--cor-erro))]">
          <AlertCircle className="h-5 w-5" />
          <span>{erro}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-sm border border-[rgb(var(--cor-borda))] p-6 mb-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Presentation className="h-6 w-6 text-[rgb(var(--cor-info))]" />
          <h3 className="text-xl font-bold text-[rgb(var(--cor-texto-primario))]">Análise das Avaliações - Fase II</h3>
        </div>

        {/* Mensagem de sucesso */}
        {!somenteLeitura && mensagemSucesso && (
          <div className="mb-4 p-3 bg-[rgb(var(--cor-sucesso))]/10 border border-[rgb(var(--cor-sucesso))]/20 rounded-lg flex items-center gap-2 text-[rgb(var(--cor-sucesso))]">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm">{mensagemSucesso}</span>
          </div>
        )}

        {/* Alertas de status */}
        {!somenteLeitura && existemPendentes && !todasBloqueadas && (
          <div className="mb-4 p-3 bg-[rgb(var(--cor-alerta))]/10 border border-[rgb(var(--cor-alerta))]/20 rounded-lg flex items-center gap-2 text-[rgb(var(--cor-alerta))]">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">
              Existem {avaliacoesPendentes} avaliação(ões) pendente(s). Aguarde todos os envios antes de aprovar.
            </span>
          </div>
        )}

        {!somenteLeitura && todasBloqueadas && (
          <div className="mb-4 p-3 bg-[rgb(var(--cor-destaque))]/10 border border-[rgb(var(--cor-destaque))]/20 rounded-lg flex items-center gap-2 text-[rgb(var(--cor-destaque))]">
            <Lock className="h-5 w-5" />
            <span className="text-sm">
              Todas as avaliações estão bloqueadas para análise.
            </span>
          </div>
        )}

        {/* Lista das avaliações */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-[rgb(var(--cor-texto-secundario))] mb-4 flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Avaliações da Banca (Fase II)
          </h4>
          <div className="space-y-4">
            {avaliacoes.map(avaliacao => {
              const parecer = avaliacao.parecer || '';
              const parecerGeral = extractSection(parecer, 'Parecer Geral') || (parecer.includes('===') ? '' : parecer);

              return (
                <div
                  key={avaliacao.id}
                  className="border border-[rgb(var(--cor-borda))] rounded-lg p-4"
                >
                  {/* Header do avaliador */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      {/* Checkbox para solicitar ajustes */}
                      {!somenteLeitura && (avaliacao.status === StatusAvaliacaoFase2.BLOQUEADO || avaliacao.status === StatusAvaliacaoFase2.CONCLUIDO) && (
                        <input
                          type="checkbox"
                          checked={avaliadoresSelecionados.includes(avaliacao.avaliador)}
                          onChange={() => handleToggleAvaliador(avaliacao.avaliador)}
                          className="mt-1 h-4 w-4 text-[rgb(var(--cor-info))] rounded border-[rgb(var(--cor-borda))] focus:ring-[rgb(var(--cor-info))]"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-[rgb(var(--cor-texto-primario))]">
                            {avaliacao.avaliador_dados.nome_completo}
                          </p>
                          {!somenteLeitura && (avaliacao.status === StatusAvaliacaoFase2.BLOQUEADO || avaliacao.status === StatusAvaliacaoFase2.CONCLUIDO) && (
                            <span className="px-2 py-0.5 bg-[rgb(var(--cor-destaque))]/10 text-[rgb(var(--cor-destaque))] text-xs rounded-full font-medium">
                              {getFasesAjustaveis(avaliacao.avaliador)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[rgb(var(--cor-texto-secundario))]">{avaliacao.avaliador_dados.email}</p>
                      </div>
                    </div>
                    {getStatusBadge(avaliacao.status)}
                  </div>

                  {/* Notas por critério com comentários */}
                  {avaliacao.status !== StatusAvaliacaoFase2.PENDENTE ? (
                    <div className="space-y-2">
                      {criterios.map(criterio => {
                        const nota = avaliacao[criterio.campo];
                        const comentario = extractSection(parecer, criterio.secao);
                        return (
                          <div key={criterio.campo}>
                            <p className="text-sm text-[rgb(var(--cor-texto-secundario))]">
                              {criterio.label}: <span className="font-medium text-[rgb(var(--cor-texto-primario))]">{nota != null ? Number(nota).toFixed(1) : '-'} / {criterio.peso.toFixed(1)}</span>
                            </p>
                            {comentario && (
                              <p className="text-xs text-[rgb(var(--cor-texto-secundario))] mt-0.5 pl-2 border-l-2 border-[rgb(var(--cor-borda))] italic">
                                {comentario}
                              </p>
                            )}
                          </div>
                        );
                      })}

                      {/* Parecer geral */}
                      {parecerGeral && (
                        <div className="mt-2 pt-2 border-t border-[rgb(var(--cor-borda))]">
                          <p className="text-xs text-[rgb(var(--cor-texto-secundario))] pl-2 border-l-2 border-[rgb(var(--cor-info))] italic">
                            {parecerGeral}
                          </p>
                        </div>
                      )}

                      {/* Total */}
                      <div className="flex justify-between text-sm pt-2 border-t border-[rgb(var(--cor-borda))]">
                        <span className="font-semibold text-[rgb(var(--cor-texto-primario))]">Total:</span>
                        <span className="font-bold text-[rgb(var(--cor-info))]">
                          {avaliacao.nota_final != null ? Number(avaliacao.nota_final).toFixed(2) : '-'} / {pesoTotal.toFixed(1)}
                        </span>
                      </div>

                      {/* Data envio */}
                      {avaliacao.enviado_em && (
                        <p className="text-xs text-[rgb(var(--cor-texto-secundario))]">
                          Enviado em: {formatarDataCurta(avaliacao.enviado_em)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-6 text-sm text-[rgb(var(--cor-texto-secundario))]">
                      Aguardando envio
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Ações */}
        {!somenteLeitura && (
        <div className="flex flex-wrap gap-3">
          {!todasBloqueadas && (
            <button
              onClick={() => setModalBloquear(true)}
              disabled={processandoHook || avaliacoesEnviadas !== 3}
              className="px-4 py-2 bg-[rgb(var(--cor-texto-secundario))] text-white rounded-lg hover:bg-[rgb(var(--cor-texto-secundario))]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              title="Fechar avaliações para análise final - requer todas as 3 avaliações enviadas"
            >
              {processandoHook ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              <span>Fechar análises</span>
            </button>
          )}

          {todasBloqueadas && (
            <button
              onClick={() => setModalDesbloquear(true)}
              disabled={processandoHook}
              className="px-4 py-2 bg-[rgb(var(--cor-destaque))] text-white rounded-lg hover:bg-[rgb(var(--cor-destaque))]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {processandoHook ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Unlock className="h-4 w-4" />
              )}
              <span>Liberar análises</span>
            </button>
          )}

          <button
            onClick={() => setModalSolicitarAjustes(true)}
            disabled={processando || avaliadoresSelecionados.length === 0 || !todasBloqueadas}
            className="px-4 py-2 bg-[rgb(var(--cor-alerta))] text-white rounded-lg hover:bg-[rgb(var(--cor-alerta))]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            title="Solicitar ajustes aos avaliadores selecionados"
          >
            <AlertCircle className="h-4 w-4" />
            <span>Solicitar ajustes ({avaliadoresSelecionados.length})</span>
          </button>

          <button
            onClick={() => setModalAprovar(true)}
            disabled={processando || existemPendentes || !todasBloqueadas}
            className="px-4 py-2 bg-[rgb(var(--cor-info))] text-white rounded-lg hover:bg-[rgb(var(--cor-info))]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            title="Aprovar e concluir o TCC"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Aprovar e concluir</span>
          </button>
        </div>
        )}

        {/* Resumo de Notas - Fase II */}
        {(() => {
          const todasComNota = avaliacoes.length > 0 && avaliacoes.every(a => a.nota_final != null);
          const fmt = (v: number) => v.toFixed(2).replace('.', ',');
          const media = todasComNota ? avaliacoes.reduce((s, a) => s + Number(a.nota_final), 0) / avaliacoes.length : null;
          const comPeso = media != null ? media * 0.4 : null;
          const aprovada = media != null && media >= 6;
          return (
            <div className="mt-6 pt-4 border-t border-[rgb(var(--cor-borda))]">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {avaliacoes.map(a => (
                  <div key={a.id} className="p-3 bg-[rgb(var(--cor-fundo))] rounded-lg">
                    <p className="text-xs text-[rgb(var(--cor-texto-secundario))] truncate">{a.avaliador_dados.nome_completo}</p>
                    <p className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))]">{a.nota_final != null ? fmt(Number(a.nota_final)) : '-'}</p>
                  </div>
                ))}
                <div className="p-3 bg-[rgb(var(--cor-destaque))]/5 rounded-lg border border-[rgb(var(--cor-destaque))]/20">
                  <p className="text-xs text-[rgb(var(--cor-destaque))]">Média</p>
                  <p className="text-2xl font-bold text-[rgb(var(--cor-destaque))]">{media != null ? fmt(media) : '-'}</p>
                </div>
                <div className="p-3 bg-[rgb(var(--cor-info))]/5 rounded-lg border border-[rgb(var(--cor-info))]/20">
                  <p className="text-xs text-[rgb(var(--cor-info))]">Nota com peso (x0,4)</p>
                  <p className="text-2xl font-bold text-[rgb(var(--cor-info))]">{comPeso != null ? fmt(comPeso) : '-'}</p>
                </div>
                <div className={`p-3 rounded-lg border ${!todasComNota ? 'bg-[rgb(var(--cor-fundo))] border-[rgb(var(--cor-borda))]' : aprovada ? 'bg-[rgb(var(--cor-sucesso))]/5 border-[rgb(var(--cor-sucesso))]/20' : 'bg-[rgb(var(--cor-erro))]/5 border-[rgb(var(--cor-erro))]/20'}`}>
                  <p className="text-xs text-[rgb(var(--cor-texto-secundario))]">Fase II</p>
                  <p className={`text-2xl font-bold ${!todasComNota ? 'text-[rgb(var(--cor-texto-secundario))]' : aprovada ? 'text-[rgb(var(--cor-sucesso))]' : 'text-[rgb(var(--cor-erro))]'}`}>{!todasComNota ? '-' : aprovada ? 'Aprovado' : 'Reprovado'}</p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Notas Finais - abaixo dos botões (esconde em somenteLeitura pois aparece no topo da página) */}
        {todasBloqueadas && !somenteLeitura && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-[rgb(var(--cor-texto-secundario))] mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Notas Finais
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-[rgb(var(--cor-destaque))]/5 rounded-lg border border-[rgb(var(--cor-destaque))]/20">
              <p className="text-xs text-[rgb(var(--cor-destaque))] mb-1">Média - Fase I</p>
              <p className="text-3xl font-bold text-[rgb(var(--cor-destaque))]">
                {formatarNota(nf1)}
              </p>
            </div>

            <div className="p-4 bg-[rgb(var(--cor-info))]/5 rounded-lg border border-[rgb(var(--cor-info))]/20">
              <p className="text-xs text-[rgb(var(--cor-info))] mb-1">Média - Fase II</p>
              <p className="text-3xl font-bold text-[rgb(var(--cor-info))]">
                {formatarNota(nf2)}
              </p>
            </div>

            <div className="p-4 bg-[rgb(var(--cor-info))]/10 rounded-lg border border-[rgb(var(--cor-info))]/30">
              <p className="text-xs text-[rgb(var(--cor-info))] mb-1">Nota Final</p>
              <p className="text-3xl font-bold text-[rgb(var(--cor-info))]">
                {formatarNota(nf1 != null && nf2 != null ? Number(nf1) * 0.6 + Number(nf2) * 0.4 : null)}
              </p>
            </div>

            <div className={`p-4 rounded-lg border-2 ${
              resultado === 'APROVADO'
                ? 'bg-[rgb(var(--cor-sucesso))]/5 border-[rgb(var(--cor-sucesso))]/30'
                : resultado === 'REPROVADO'
                ? 'bg-[rgb(var(--cor-erro))]/5 border-[rgb(var(--cor-erro))]/30'
                : 'bg-[rgb(var(--cor-fundo))] border-[rgb(var(--cor-borda))]'
            }`}>
              <p className="text-xs text-[rgb(var(--cor-texto-secundario))] mb-1">Resultado</p>
              <p className={`text-2xl font-bold ${
                resultado === 'APROVADO'
                  ? 'text-[rgb(var(--cor-sucesso))]'
                  : resultado === 'REPROVADO'
                  ? 'text-[rgb(var(--cor-erro))]'
                  : 'text-[rgb(var(--cor-texto-secundario))]'
              }`}>
                {resultado || '-'}
              </p>
            </div>
          </div>
        </div>
        )}
      </div>

      {!somenteLeitura && (<>
      {/* Modal de confirmação - Bloquear */}
      <Modal
        aberto={modalBloquear}
        aoFechar={() => setModalBloquear(false)}
        titulo="Fechar para Análise"
        mensagem="Deseja fechar as 3 avaliações para análise final? Após esta ação, os avaliadores não poderão mais editar e você poderá aprovar e concluir o TCC."
        tipo="confirmacao"
        textoConfirmar="Fechar para Análise"
        aoConfirmar={handleBloquear}
        carregando={processandoHook}
      />

      {/* Modal de confirmação - Desbloquear */}
      <Modal
        aberto={modalDesbloquear}
        aoFechar={() => setModalDesbloquear(false)}
        titulo="Liberar Avaliações"
        mensagem="Deseja liberar as avaliações? Os avaliadores poderão editar novamente."
        tipo="confirmacao"
        textoConfirmar="Liberar"
        aoConfirmar={handleDesbloquear}
        carregando={processandoHook}
      />

      {/* Modal de confirmação - Aprovar e Concluir */}
      <Modal
        aberto={modalAprovar}
        aoFechar={() => setModalAprovar(false)}
        titulo="Aprovar e Concluir TCC"
        mensagem={`Confirma a aprovação e conclusão deste TCC?\n\nNF1: ${formatarNota(nf1)}\nNF2: ${formatarNota(nf2)}\nMédia Final: ${formatarNota(mediaFinal)}\nResultado: ${resultado || '-'}`}
        tipo="confirmacao"
        textoConfirmar="Aprovar e Concluir"
        aoConfirmar={handleAprovarConcluir}
        carregando={processando}
      />

      {/* Modal personalizado - Solicitar Ajustes Finais */}
      {modalSolicitarAjustes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[rgb(var(--cor-superficie))] rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))] mb-4">
              Solicitar Ajustes Finais
            </h3>
            <p className="text-sm text-[rgb(var(--cor-texto-secundario))] mb-4">
              Você está solicitando ajustes finais para <strong>{avaliadoresSelecionados.length}</strong> avaliador(es).
              As avaliações selecionadas serão desbloqueadas (Fase II para todos; Fase I apenas para avaliadores externos)
              e o TCC será movido para <strong>AGUARDANDO_AJUSTES_FINAIS</strong>.
              Quando todos reenviarem, o TCC retornará automaticamente para Análise Final.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-[rgb(var(--cor-texto-secundario))] mb-2">
                Mensagem (opcional)
              </label>
              <textarea
                value={mensagemAjustes}
                onChange={(e) => setMensagemAjustes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-[rgb(var(--cor-borda))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-alerta))] focus:border-transparent resize-none bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))]"
                placeholder="Descreva os ajustes necessários..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setModalSolicitarAjustes(false);
                  setMensagemAjustes('');
                }}
                disabled={processando}
                className="flex-1 px-4 py-2 border border-[rgb(var(--cor-borda))] text-[rgb(var(--cor-texto-secundario))] rounded-lg hover:bg-[rgb(var(--cor-fundo))] disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSolicitarAjustesFinais}
                disabled={processando}
                className="flex-1 px-4 py-2 bg-[rgb(var(--cor-alerta))] text-white rounded-lg hover:bg-[rgb(var(--cor-alerta))]/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {processando ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <span>Solicitar Ajustes Finais</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      </>)}
    </>
  );
}
