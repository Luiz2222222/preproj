/**
 * Componente para análise das avaliações da Fase I pelo coordenador
 * Layout em colunas lado a lado para facilitar comparação entre avaliadores
 */

import { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Lock,
  Unlock,
  MessageSquare,
  Clock,
  FileText
} from 'lucide-react';
import type { TCC } from '../../../types';
import { useAvaliacoesFase1, useCalendarioSemestre } from '../../../hooks';
import { StatusAvaliacaoFase1 } from '../../../types/enums';
import { formatarDataCurta } from '../../../utils/datas';
import { Modal } from '../../../componentes/Modal';

interface AnalisarAvaliacoesFase1Props {
  tcc: TCC;
  onAvaliacoesAtualizadas?: () => void;
  somenteLeitura?: boolean;
}

// Extrair seção do parecer estruturado
function extractSection(parecer: string, sectionName: string): string {
  const regex = new RegExp(`===\\s*${sectionName}\\s*===\\s*([\\s\\S]*?)(?=\\n===|$)`, 'i');
  const match = parecer.match(regex);
  return match ? match[1].trim() : '';
}

export function AnalisarAvaliacoesFase1({ tcc, onAvaliacoesAtualizadas, somenteLeitura = false }: AnalisarAvaliacoesFase1Props) {
  const { calendario } = useCalendarioSemestre();
  const {
    avaliacoes,
    carregando,
    erro,
    bloquear,
    desbloquear,
    aprovar,
    solicitarAjustes,
    processando
  } = useAvaliacoesFase1({
    tccId: tcc.id,
    autoCarregar: true
  });

  // Pesos do calendário (com fallback para valores padrão e conversão para número)
  const pesos = {
    resumo: Number(calendario?.peso_resumo) || 1.0,
    introducao: Number(calendario?.peso_introducao) || 2.0,
    revisao: Number(calendario?.peso_revisao) || 2.0,
    desenvolvimento: Number(calendario?.peso_desenvolvimento) || 3.5,
    conclusoes: Number(calendario?.peso_conclusoes) || 1.5
  };
  const pesoTotal = pesos.resumo + pesos.introducao + pesos.revisao + pesos.desenvolvimento + pesos.conclusoes;

  const criterios = [
    { label: 'Resumo', campo: 'nota_resumo' as const, peso: pesos.resumo, secao: 'Resumo' },
    { label: 'Introdução', campo: 'nota_introducao' as const, peso: pesos.introducao, secao: 'Introdução/Relevância' },
    { label: 'Revisão', campo: 'nota_revisao' as const, peso: pesos.revisao, secao: 'Revisão Bibliográfica' },
    { label: 'Desenvolvimento', campo: 'nota_desenvolvimento' as const, peso: pesos.desenvolvimento, secao: 'Desenvolvimento' },
    { label: 'Conclusões', campo: 'nota_conclusoes' as const, peso: pesos.conclusoes, secao: 'Conclusões' },
  ];

  const [avaliadoresSelecionados, setAvaliadoresSelecionados] = useState<number[]>([]);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [mostrarModalAjustes, setMostrarModalAjustes] = useState(false);
  const [mensagemAjustes, setMensagemAjustes] = useState('');

  // Estados para modais de confirmação
  const [modalBloquear, setModalBloquear] = useState(false);
  const [modalDesbloquear, setModalDesbloquear] = useState(false);
  const [modalAprovarCompleto, setModalAprovarCompleto] = useState(false);
  const [modalErro, setModalErro] = useState<{ aberto: boolean; mensagem: string }>({ aberto: false, mensagem: '' });

  // Estatísticas das avaliações
  const totalAvaliacoes = avaliacoes.length;
  const avaliacoesPendentes = avaliacoes.filter(a => a.status === StatusAvaliacaoFase1.PENDENTE).length;
  const avaliacoesEnviadas = avaliacoes.filter(a => a.status === StatusAvaliacaoFase1.ENVIADO).length;
  const avaliacoesBloqueadas = avaliacoes.filter(a => a.status === StatusAvaliacaoFase1.BLOQUEADO || a.status === StatusAvaliacaoFase1.CONCLUIDO).length;
  const todasBloqueadas = totalAvaliacoes > 0 && avaliacoesBloqueadas === totalAvaliacoes;
  const existemPendentes = avaliacoesPendentes > 0;

  const handleBloquear = async () => {
    try {
      setMensagemSucesso(null);
      setModalBloquear(false);
      const resultado = await bloquear();
      setMensagemSucesso(`${resultado.avaliacoes_bloqueadas} avaliação(ões) bloqueada(s) com sucesso!`);
      if (onAvaliacoesAtualizadas) {
        onAvaliacoesAtualizadas();
      }
    } catch (err) {
      console.error('Erro ao bloquear avaliações:', err);
    }
  };

  const handleDesbloquear = async () => {
    try {
      setMensagemSucesso(null);
      setModalDesbloquear(false);
      const resultado = await desbloquear();
      setMensagemSucesso(`${resultado.avaliacoes_desbloqueadas} avaliação(ões) desbloqueada(s) com sucesso!`);
      if (onAvaliacoesAtualizadas) {
        onAvaliacoesAtualizadas();
      }
    } catch (err) {
      console.error('Erro ao desbloquear avaliações:', err);
    }
  };

  const handleSolicitarAjustes = async () => {
    if (avaliadoresSelecionados.length === 0) {
      setModalErro({ aberto: true, mensagem: 'Selecione pelo menos um avaliador para solicitar ajustes' });
      return;
    }

    try {
      setMensagemSucesso(null);
      const resultado = await solicitarAjustes({
        avaliadores: avaliadoresSelecionados,
        mensagem: mensagemAjustes || undefined
      });
      setMensagemSucesso(
        `Ajustes solicitados! ${resultado.avaliacoes_reabertas} avaliação(ões) reaberta(s).`
      );
      setMostrarModalAjustes(false);
      setAvaliadoresSelecionados([]);
      setMensagemAjustes('');
      if (onAvaliacoesAtualizadas) {
        onAvaliacoesAtualizadas();
      }
    } catch (err) {
      console.error('Erro ao solicitar ajustes:', err);
    }
  };

  const handleAprovar = async () => {
    try {
      setMensagemSucesso(null);
      setModalAprovarCompleto(false);

      const resultado = await aprovar();

      if (resultado.tipo === 'completa') {
        setMensagemSucesso(
          `Aprovação completa! NF1 = ${resultado.nf1.toFixed(2)}. Resultado: ${resultado.resultado}. Nova etapa: ${resultado.etapa_display}`
        );
      } else {
        setMensagemSucesso(
          `Aprovação parcial! ${resultado.avaliacoes_aprovadas} avaliação(ões) aprovada(s).`
        );
      }

      setAvaliadoresSelecionados([]);
      if (onAvaliacoesAtualizadas) {
        onAvaliacoesAtualizadas();
      }
    } catch (err) {
      console.error('Erro ao aprovar avaliações:', err);
    }
  };

  const toggleAvaliador = (avaliadorId: number) => {
    setAvaliadoresSelecionados(prev =>
      prev.includes(avaliadorId)
        ? prev.filter(id => id !== avaliadorId)
        : [...prev, avaliadorId]
    );
  };

  const getStatusBadge = (status: string) => {
    const config = {
      [StatusAvaliacaoFase1.PENDENTE]: {
        bg: 'bg-[rgb(var(--cor-alerta))]/10',
        text: 'text-[rgb(var(--cor-alerta))]',
        icon: Clock,
        label: 'Pendente'
      },
      [StatusAvaliacaoFase1.ENVIADO]: {
        bg: 'bg-[rgb(var(--cor-destaque))]/10',
        text: 'text-[rgb(var(--cor-destaque))]',
        icon: CheckCircle,
        label: 'Enviado'
      },
      [StatusAvaliacaoFase1.BLOQUEADO]: {
        bg: 'bg-[rgb(var(--cor-fundo))]',
        text: 'text-[rgb(var(--cor-texto-secundario))]',
        icon: Lock,
        label: 'Bloqueado'
      },
      [StatusAvaliacaoFase1.CONCLUIDO]: {
        bg: 'bg-[rgb(var(--cor-sucesso))]/10',
        text: 'text-[rgb(var(--cor-sucesso))]',
        icon: CheckCircle,
        label: 'Concluído'
      }
    };

    const item = config[status as keyof typeof config] || config[StatusAvaliacaoFase1.PENDENTE];
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
          <span>Carregando avaliações...</span>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-sm border border-[rgb(var(--cor-borda))] p-6 mb-6">
        <div className="flex items-center gap-2 text-[rgb(var(--cor-erro))]">
          <XCircle className="h-5 w-5" />
          <span>{erro}</span>
        </div>
      </div>
    );
  }

  if (totalAvaliacoes === 0) {
    return (
      <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-sm border border-[rgb(var(--cor-borda))] p-6 mb-6">
        <div className="flex items-center gap-2 text-[rgb(var(--cor-texto-secundario))]">
          <AlertCircle className="h-5 w-5" />
          <span>Nenhuma avaliação encontrada. A banca precisa ser formada primeiro.</span>
        </div>
      </div>
    );
  }

  // Filtrar avaliações que têm notas (enviadas ou bloqueadas)
  const gridCols = avaliacoes.length === 2 ? 'grid-cols-2' : avaliacoes.length >= 3 ? 'grid-cols-3' : 'grid-cols-1';

  return (
    <>
      <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-sm border border-[rgb(var(--cor-borda))] p-6 mb-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-[rgb(var(--cor-info))]" />
          <h3 className="font-semibold text-[rgb(var(--cor-texto-primario))]">Análise das Avaliações - Fase I</h3>
        </div>

        {/* Mensagem de sucesso */}
        {mensagemSucesso && (
          <div className="mb-4 p-3 bg-[rgb(var(--cor-sucesso))]/10 border border-[rgb(var(--cor-sucesso))]/20 rounded-lg flex items-center gap-2 text-[rgb(var(--cor-sucesso))]">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm">{mensagemSucesso}</span>
          </div>
        )}

        {/* Alertas */}
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

        {/* Colunas lado a lado */}
        <div className={`grid ${gridCols} gap-4 mb-6`}>
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
                  <div className="flex items-center gap-2 min-w-0">
                    {!somenteLeitura && (
                      <input
                        type="checkbox"
                        checked={avaliadoresSelecionados.includes(avaliacao.avaliador)}
                        onChange={() => toggleAvaliador(avaliacao.avaliador)}
                        className="h-4 w-4 text-[rgb(var(--cor-info))] rounded border-[rgb(var(--cor-borda))] focus:ring-[rgb(var(--cor-info))] shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-[rgb(var(--cor-texto-primario))] truncate">
                        {avaliacao.avaliador_dados.nome_completo}
                      </p>
                      <p className="text-xs text-[rgb(var(--cor-texto-secundario))] truncate">{avaliacao.avaliador_dados.email}</p>
                    </div>
                  </div>
                  {getStatusBadge(avaliacao.status)}
                </div>

                {/* Notas por critério */}
                {avaliacao.status !== StatusAvaliacaoFase1.PENDENTE || avaliacao.nota_final != null ? (
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

        {/* Ações */}
        {!somenteLeitura && <div className="flex flex-wrap gap-3">
          {!todasBloqueadas && (
            <button
              onClick={() => setModalBloquear(true)}
              disabled={processando || avaliacoesEnviadas === 0}
              className="px-4 py-2 bg-[rgb(var(--cor-texto-secundario))] text-white rounded-lg hover:bg-[rgb(var(--cor-texto-secundario))]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              title="Bloquear avaliações enviadas para análise"
            >
              {processando ? (
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
              disabled={processando}
              className="px-4 py-2 bg-[rgb(var(--cor-destaque))] text-white rounded-lg hover:bg-[rgb(var(--cor-destaque))]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {processando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Unlock className="h-4 w-4" />
              )}
              <span>Liberar análises</span>
            </button>
          )}

          <button
            onClick={() => setMostrarModalAjustes(true)}
            disabled={processando || avaliadoresSelecionados.length === 0 || !todasBloqueadas}
            className="px-4 py-2 bg-[rgb(var(--cor-alerta))] text-white rounded-lg hover:bg-[rgb(var(--cor-alerta))]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            title="Solicitar ajustes aos avaliadores selecionados"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Solicitar ajustes ({avaliadoresSelecionados.length})</span>
          </button>

          <button
            onClick={() => setModalAprovarCompleto(true)}
            disabled={processando || existemPendentes || !todasBloqueadas}
            className="px-4 py-2 bg-[rgb(var(--cor-info))] text-white rounded-lg hover:bg-[rgb(var(--cor-info))]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            title="Aprovar todas as avaliações e calcular NF1"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Aprovar completo</span>
          </button>
        </div>}

        {/* Resumo de Notas - Fase I */}
        {(() => {
          const todasComNota = avaliacoes.length > 0 && avaliacoes.every(a => a.nota_final != null);
          const fmt = (v: number) => v.toFixed(2).replace('.', ',');
          const media = todasComNota ? avaliacoes.reduce((s, a) => s + Number(a.nota_final), 0) / avaliacoes.length : null;
          const comPeso = media != null ? media * 0.6 : null;
          const aprovada = media != null && media >= 6;
          return (
            <div className="mt-6 pt-4 border-t border-[rgb(var(--cor-borda))]">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
                  <p className="text-xs text-[rgb(var(--cor-info))]">Nota com peso (x0,6)</p>
                  <p className="text-2xl font-bold text-[rgb(var(--cor-info))]">{comPeso != null ? fmt(comPeso) : '-'}</p>
                </div>
                <div className={`p-3 rounded-lg border ${!todasComNota ? 'bg-[rgb(var(--cor-fundo))] border-[rgb(var(--cor-borda))]' : aprovada ? 'bg-[rgb(var(--cor-sucesso))]/5 border-[rgb(var(--cor-sucesso))]/20' : 'bg-[rgb(var(--cor-erro))]/5 border-[rgb(var(--cor-erro))]/20'}`}>
                  <p className="text-xs text-[rgb(var(--cor-texto-secundario))]">Fase I</p>
                  <p className={`text-2xl font-bold ${!todasComNota ? 'text-[rgb(var(--cor-texto-secundario))]' : aprovada ? 'text-[rgb(var(--cor-sucesso))]' : 'text-[rgb(var(--cor-erro))]'}`}>{!todasComNota ? '-' : aprovada ? 'Aprovado' : 'Reprovado'}</p>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Modal de Solicitar Ajustes */}
      {mostrarModalAjustes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 text-[rgb(var(--cor-alerta))]" />
              <h3 className="font-semibold text-[rgb(var(--cor-texto-primario))]">Solicitar Ajustes</h3>
            </div>

            <p className="text-sm text-[rgb(var(--cor-texto-secundario))] mb-4">
              Solicitando ajustes para {avaliadoresSelecionados.length} avaliador(es).
              As avaliações serão reabertas para edição.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-[rgb(var(--cor-texto-secundario))] mb-2">
                Mensagem (opcional)
              </label>
              <textarea
                value={mensagemAjustes}
                onChange={(e) => setMensagemAjustes(e.target.value)}
                rows={4}
                placeholder="Descreva os ajustes necessários..."
                className="w-full px-3 py-2 border border-[rgb(var(--cor-borda))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-alerta))] focus:border-transparent bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))]"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setMostrarModalAjustes(false);
                  setMensagemAjustes('');
                }}
                disabled={processando}
                className="flex-1 px-4 py-2 border border-[rgb(var(--cor-borda))] text-[rgb(var(--cor-texto-secundario))] rounded-lg hover:bg-[rgb(var(--cor-fundo))] disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSolicitarAjustes}
                disabled={processando}
                className="flex-1 px-4 py-2 bg-[rgb(var(--cor-alerta))] text-white rounded-lg hover:bg-[rgb(var(--cor-alerta))]/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {processando ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <span>Solicitar</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modais de confirmação */}
      <Modal
        aberto={modalBloquear}
        aoFechar={() => setModalBloquear(false)}
        titulo="Bloquear Avaliações"
        mensagem="Deseja bloquear todas as avaliações para análise? Os avaliadores não poderão mais editar."
        tipo="confirmacao"
        textoConfirmar="Bloquear"
        aoConfirmar={handleBloquear}
        carregando={processando}
      />

      <Modal
        aberto={modalDesbloquear}
        aoFechar={() => setModalDesbloquear(false)}
        titulo="Desbloquear Avaliações"
        mensagem="Deseja desbloquear as avaliações? Os avaliadores poderão editar novamente."
        tipo="confirmacao"
        textoConfirmar="Desbloquear"
        aoConfirmar={handleDesbloquear}
        carregando={processando}
      />

      <Modal
        aberto={modalAprovarCompleto}
        aoFechar={() => setModalAprovarCompleto(false)}
        titulo="Aprovação Completa"
        mensagem="Deseja aprovar todas as avaliações? Esta ação calculará a nota final da Fase I."
        tipo="confirmacao"
        textoConfirmar="Aprovar Tudo"
        aoConfirmar={handleAprovar}
        carregando={processando}
      />

      <Modal
        aberto={modalErro.aberto}
        aoFechar={() => setModalErro({ aberto: false, mensagem: '' })}
        titulo="Atenção"
        mensagem={modalErro.mensagem}
        tipo="aviso"
      />
    </>
  );
}
