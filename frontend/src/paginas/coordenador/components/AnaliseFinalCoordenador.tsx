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

interface AnaliseFinalCoordenadorProps {
  tcc: TCC;
  onConclusao?: () => void;
}

export function AnaliseFinalCoordenador({ tcc, onConclusao }: AnaliseFinalCoordenadorProps) {
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
  const avaliacoesBloqueadas = avaliacoes.filter(a => a.status === StatusAvaliacaoFase2.BLOQUEADO);
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
        {mensagemSucesso && (
          <div className="mb-4 p-3 bg-[rgb(var(--cor-sucesso))]/10 border border-[rgb(var(--cor-sucesso))]/20 rounded-lg flex items-center gap-2 text-[rgb(var(--cor-sucesso))]">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm">{mensagemSucesso}</span>
          </div>
        )}

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-3 bg-[rgb(var(--cor-fundo))] rounded-lg">
            <p className="text-xs text-[rgb(var(--cor-texto-secundario))] mb-1">Total</p>
            <p className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))]">{totalAvaliacoes}</p>
          </div>
          <div className="p-3 bg-[rgb(var(--cor-alerta))]/10 rounded-lg">
            <p className="text-xs text-[rgb(var(--cor-alerta))] mb-1">Pendentes</p>
            <p className="text-2xl font-bold text-[rgb(var(--cor-alerta))]">{avaliacoesPendentes}</p>
          </div>
          <div className="p-3 bg-[rgb(var(--cor-destaque))]/10 rounded-lg">
            <p className="text-xs text-[rgb(var(--cor-destaque))] mb-1">Enviadas</p>
            <p className="text-2xl font-bold text-[rgb(var(--cor-destaque))]">{avaliacoesEnviadas}</p>
          </div>
          <div className="p-3 bg-[rgb(var(--cor-fundo))] rounded-lg">
            <p className="text-xs text-[rgb(var(--cor-texto-secundario))] mb-1">Bloqueadas</p>
            <p className="text-2xl font-bold text-[rgb(var(--cor-texto-secundario))]">{avaliacoesBloqueadas.length}</p>
          </div>
        </div>

        {/* Alertas de status */}
        {existemPendentes && !todasBloqueadas && (
          <div className="mb-4 p-3 bg-[rgb(var(--cor-alerta))]/10 border border-[rgb(var(--cor-alerta))]/20 rounded-lg flex items-center gap-2 text-[rgb(var(--cor-alerta))]">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">
              Existem {avaliacoesPendentes} avaliação(ões) pendente(s). Aguarde todos os envios antes de aprovar.
            </span>
          </div>
        )}

        {todasBloqueadas && (
          <div className="mb-4 p-3 bg-[rgb(var(--cor-destaque))]/10 border border-[rgb(var(--cor-destaque))]/20 rounded-lg flex items-center gap-2 text-[rgb(var(--cor-destaque))]">
            <Lock className="h-5 w-5" />
            <span className="text-sm">
              Todas as avaliações estão bloqueadas para análise.
            </span>
          </div>
        )}

        {/* Notas Finais - só aparecem quando avaliações bloqueadas */}
        {todasBloqueadas && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-[rgb(var(--cor-texto-secundario))] mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Notas Finais
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-[rgb(var(--cor-destaque))]/5 rounded-lg border border-[rgb(var(--cor-destaque))]/20">
              <p className="text-xs text-[rgb(var(--cor-destaque))] mb-1">Nota Final Fase I</p>
              <p className="text-3xl font-bold text-[rgb(var(--cor-destaque))]">
                {formatarNota(nf1)}
              </p>
              <p className="text-xs text-[rgb(var(--cor-destaque))]/80 mt-1">Média da Monografia</p>
            </div>

            <div className="p-4 bg-[rgb(var(--cor-info))]/5 rounded-lg border border-[rgb(var(--cor-info))]/20">
              <p className="text-xs text-[rgb(var(--cor-info))] mb-1">Nota Final Fase II</p>
              <p className="text-3xl font-bold text-[rgb(var(--cor-info))]">
                {formatarNota(nf2)}
              </p>
              <p className="text-xs text-[rgb(var(--cor-info))]/80 mt-1">Média da Apresentação</p>
            </div>

            <div className="p-4 bg-[rgb(var(--cor-info))]/10 rounded-lg border border-[rgb(var(--cor-info))]/30">
              <p className="text-xs text-[rgb(var(--cor-info))] mb-1">Média Final (MF)</p>
              <p className="text-3xl font-bold text-[rgb(var(--cor-info))]">
                {formatarNota(mediaFinal)}
              </p>
              <p className="text-xs text-[rgb(var(--cor-info))]/80 mt-1">(NF1 + NF2) / 2</p>
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
              <p className="text-xs text-[rgb(var(--cor-texto-secundario))] mt-1">
                {resultado === 'APROVADO' ? '✓ MF ≥ 6.0' : resultado === 'REPROVADO' ? '✗ MF < 6.0' : '-'}
              </p>
            </div>
          </div>
        </div>
        )}

        {/* Lista das avaliações */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-[rgb(var(--cor-texto-secundario))] mb-4 flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Avaliações da Banca (Fase II)
          </h4>
          <div className="space-y-3">
            {avaliacoes.map(avaliacao => (
              <div
                key={avaliacao.id}
                className="border border-[rgb(var(--cor-borda))] rounded-lg p-4 hover:bg-[rgb(var(--cor-fundo))]/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Checkbox para solicitar ajustes */}
                    {avaliacao.status === StatusAvaliacaoFase2.BLOQUEADO && (
                      <input
                        type="checkbox"
                        checked={avaliadoresSelecionados.includes(avaliacao.avaliador)}
                        onChange={() => handleToggleAvaliador(avaliacao.avaliador)}
                        className="mt-1 h-4 w-4 text-[rgb(var(--cor-info))] rounded border-[rgb(var(--cor-borda))] focus:ring-[rgb(var(--cor-info))]"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-[rgb(var(--cor-texto-primario))]">
                          {avaliacao.avaliador_dados.nome_completo}
                        </p>
                        {avaliacao.status === StatusAvaliacaoFase2.BLOQUEADO && (
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

                {/* Notas */}
                {avaliacao.status !== StatusAvaliacaoFase2.PENDENTE && (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-2">
                      <div className="text-sm">
                        <span className="text-[rgb(var(--cor-texto-secundario))]">Coerência:</span>
                        <span className="ml-2 font-medium text-[rgb(var(--cor-texto-primario))]">
                          {avaliacao.nota_coerencia_conteudo != null ? Number(avaliacao.nota_coerencia_conteudo).toFixed(1).replace('.', ',') : '-'} / {pesos.coerencia.toFixed(1).replace('.', ',')}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-[rgb(var(--cor-texto-secundario))]">Qualidade:</span>
                        <span className="ml-2 font-medium text-[rgb(var(--cor-texto-primario))]">
                          {avaliacao.nota_qualidade_apresentacao != null ? Number(avaliacao.nota_qualidade_apresentacao).toFixed(1).replace('.', ',') : '-'} / {pesos.qualidade.toFixed(1).replace('.', ',')}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-[rgb(var(--cor-texto-secundario))]">Domínio:</span>
                        <span className="ml-2 font-medium text-[rgb(var(--cor-texto-primario))]">
                          {avaliacao.nota_dominio_tema != null ? Number(avaliacao.nota_dominio_tema).toFixed(1).replace('.', ',') : '-'} / {pesos.dominio.toFixed(1).replace('.', ',')}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                      <div className="text-sm">
                        <span className="text-[rgb(var(--cor-texto-secundario))]">Clareza:</span>
                        <span className="ml-2 font-medium text-[rgb(var(--cor-texto-primario))]">
                          {avaliacao.nota_clareza_fluencia != null ? Number(avaliacao.nota_clareza_fluencia).toFixed(1).replace('.', ',') : '-'} / {pesos.clareza.toFixed(1).replace('.', ',')}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-[rgb(var(--cor-texto-secundario))]">Tempo:</span>
                        <span className="ml-2 font-medium text-[rgb(var(--cor-texto-primario))]">
                          {avaliacao.nota_observancia_tempo != null ? Number(avaliacao.nota_observancia_tempo).toFixed(1).replace('.', ',') : '-'} / {pesos.tempo.toFixed(1).replace('.', ',')}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-[rgb(var(--cor-texto-secundario))]">Total:</span>
                        <span className="ml-2 font-bold text-[rgb(var(--cor-info))]">
                          {avaliacao.nota_final != null ? Number(avaliacao.nota_final).toFixed(2).replace('.', ',') : '-'} / {pesoTotal.toFixed(1).replace('.', ',')}
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {/* Parecer */}
                {avaliacao.parecer && (
                  <div className="p-2 bg-[rgb(var(--cor-fundo))] rounded text-sm text-[rgb(var(--cor-texto-secundario))]">
                    <p className="font-medium text-[rgb(var(--cor-texto-primario))] mb-1">Parecer:</p>
                    <p>{avaliacao.parecer}</p>
                  </div>
                )}

                {/* Timestamps */}
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-[rgb(var(--cor-texto-secundario))]">
                  <span>Criado em: {formatarDataCurta(avaliacao.criado_em)}</span>
                  {avaliacao.enviado_em && (
                    <span>Enviado em: {formatarDataCurta(avaliacao.enviado_em)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ações de bloqueio */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Botão "Fechar para Análise" */}
          {!todasBloqueadas && (
            <button
              onClick={() => setModalBloquear(true)}
              disabled={processandoHook || avaliacoesEnviadas !== 3}
              className="px-4 py-2 bg-[rgb(var(--cor-info))] text-white rounded-lg hover:bg-[rgb(var(--cor-info))]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              title="Fechar avaliações para análise final - requer todas as 3 avaliações enviadas"
            >
              {processandoHook ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              <span>Fechar para Análise</span>
            </button>
          )}

          {/* Botão "Liberar análises" */}
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
        </div>

        {/* Mensagem informativa */}
        {!todasBloqueadas && (
          <p className="mb-6 text-xs text-[rgb(var(--cor-texto-secundario))]">
            {avaliacoesEnviadas === 3
              ? 'Clique em "Fechar para Análise" para bloquear as 3 avaliações e prosseguir para aprovação final.'
              : `Aguarde todas as 3 avaliações serem enviadas (${avaliacoesEnviadas}/3 enviadas).`
            }
          </p>
        )}

        {/* Botões de ação final - só aparecem quando avaliações bloqueadas */}
        {todasBloqueadas && (
        <div className="space-y-3">
          {/* Botão Solicitar Ajustes Finais */}
          <button
            onClick={() => setModalSolicitarAjustes(true)}
            disabled={processando || avaliadoresSelecionados.length === 0}
            className="w-full px-6 py-3 bg-[rgb(var(--cor-alerta))] text-white rounded-lg hover:bg-[rgb(var(--cor-alerta))]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-semibold"
            title={avaliadoresSelecionados.length > 0 ? 'Solicitar ajustes finais aos avaliadores selecionados (TCC irá para AGUARDANDO_AJUSTES_FINAIS)' : 'Selecione pelo menos um avaliador'}
          >
            {processando ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Processando...</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5" />
                <span>Solicitar Ajustes Finais ({avaliadoresSelecionados.length} selecionado{avaliadoresSelecionados.length !== 1 ? 's' : ''})</span>
              </>
            )}
          </button>

          {/* Botão Aprovar e Concluir */}
          <button
            onClick={() => setModalAprovar(true)}
            disabled={processando}
            className="w-full px-6 py-3 bg-gradient-to-r from-[rgb(var(--cor-info))] to-[rgb(var(--cor-destaque))] text-white rounded-lg hover:from-[rgb(var(--cor-info))]/90 hover:to-[rgb(var(--cor-destaque))]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-semibold"
            title="Aprovar e concluir o TCC"
          >
            {processando ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Processando...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                <span>Aprovar e Concluir TCC</span>
              </>
            )}
          </button>

        </div>
        )}
      </div>

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
    </>
  );
}
