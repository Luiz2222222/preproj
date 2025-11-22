/**
 * Componente para análise das avaliações da Fase II pelo coordenador
 * Permite bloquear, desbloquear e aprovar avaliações
 */

import { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Lock,
  Unlock,
  Clock,
  Presentation
} from 'lucide-react';
import type { TCC } from '../../../types';
import { useAvaliacoesFase2 } from '../../../hooks';
import { StatusAvaliacaoFase2, EtapaTCC } from '../../../types/enums';
import { formatarDataCurta } from '../../../utils/datas';
import { Modal } from '../../../componentes/Modal';

interface AnalisarAvaliacoesFase2Props {
  tcc: TCC;
  onAvaliacoesAtualizadas?: () => void;
}

export function AnalisarAvaliacoesFase2({ tcc, onAvaliacoesAtualizadas }: AnalisarAvaliacoesFase2Props) {
  const {
    avaliacoes,
    carregando,
    erro,
    bloquear,
    desbloquear,
    processando
  } = useAvaliacoesFase2({
    tccId: tcc.id,
    autoCarregar: true
  });

  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  // Estados para modais de confirmação
  const [modalBloquear, setModalBloquear] = useState(false);
  const [modalDesbloquear, setModalDesbloquear] = useState(false);

  // Estatísticas das avaliações
  const totalAvaliacoes = avaliacoes.length;
  const avaliacoesPendentes = avaliacoes.filter(a => a.status === StatusAvaliacaoFase2.PENDENTE).length;
  const avaliacoesEnviadas = avaliacoes.filter(a => a.status === StatusAvaliacaoFase2.ENVIADO).length;
  const avaliacoesBloqueadas = avaliacoes.filter(a => a.status === StatusAvaliacaoFase2.BLOQUEADO).length;
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

  return (
    <>
      <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-sm border border-[rgb(var(--cor-borda))] p-6 mb-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Presentation className="h-5 w-5 text-[rgb(var(--cor-info))]" />
          <h3 className="font-semibold text-[rgb(var(--cor-texto-primario))]">Análise das Avaliações - Fase II</h3>
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
            <p className="text-2xl font-bold text-[rgb(var(--cor-texto-secundario))]">{avaliacoesBloqueadas}</p>
          </div>
        </div>

        {/* Alertas */}
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

        {/* Lista de avaliações */}
        <div className="space-y-3 mb-6">
          <h4 className="text-sm font-medium text-[rgb(var(--cor-texto-secundario))]">Avaliações</h4>
          {avaliacoes.map(avaliacao => (
            <div
              key={avaliacao.id}
              className="border border-[rgb(var(--cor-borda))] rounded-lg p-4 hover:bg-[rgb(var(--cor-fundo))]/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="font-medium text-[rgb(var(--cor-texto-primario))]">
                    {avaliacao.avaliador_dados.nome_completo}
                  </p>
                  <p className="text-xs text-[rgb(var(--cor-texto-secundario))]">{avaliacao.avaliador_dados.email}</p>
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
                        {avaliacao.nota_coerencia_conteudo != null ? Number(avaliacao.nota_coerencia_conteudo).toFixed(1) : '-'} / 2.0
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-[rgb(var(--cor-texto-secundario))]">Qualidade:</span>
                      <span className="ml-2 font-medium text-[rgb(var(--cor-texto-primario))]">
                        {avaliacao.nota_qualidade_apresentacao != null ? Number(avaliacao.nota_qualidade_apresentacao).toFixed(1) : '-'} / 2.0
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-[rgb(var(--cor-texto-secundario))]">Domínio:</span>
                      <span className="ml-2 font-medium text-[rgb(var(--cor-texto-primario))]">
                        {avaliacao.nota_dominio_tema != null ? Number(avaliacao.nota_dominio_tema).toFixed(1) : '-'} / 2.5
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                    <div className="text-sm">
                      <span className="text-[rgb(var(--cor-texto-secundario))]">Clareza:</span>
                      <span className="ml-2 font-medium text-[rgb(var(--cor-texto-primario))]">
                        {avaliacao.nota_clareza_fluencia != null ? Number(avaliacao.nota_clareza_fluencia).toFixed(1) : '-'} / 2.5
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-[rgb(var(--cor-texto-secundario))]">Tempo:</span>
                      <span className="ml-2 font-medium text-[rgb(var(--cor-texto-primario))]">
                        {avaliacao.nota_observancia_tempo != null ? Number(avaliacao.nota_observancia_tempo).toFixed(1) : '-'} / 1.0
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-[rgb(var(--cor-texto-secundario))]">Total:</span>
                      <span className="ml-2 font-bold text-[rgb(var(--cor-info))]">
                        {avaliacao.nota_final != null ? Number(avaliacao.nota_final).toFixed(2) : '-'} / 10.0
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

        {/* Ações */}
        <div className="flex flex-wrap gap-3">
          {/* Botão "Fechar para Análise" - só aparece em ANALISE_FINAL_COORDENADOR */}
          {tcc.etapa_atual === EtapaTCC.ANALISE_FINAL_COORDENADOR && !todasBloqueadas && (
            <button
              onClick={() => setModalBloquear(true)}
              disabled={processando || avaliacoesEnviadas !== 3}
              className="px-4 py-2 bg-[rgb(var(--cor-info))] text-white rounded-lg hover:bg-[rgb(var(--cor-info))]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              title="Fechar avaliações para análise final - requer todas as 3 avaliações enviadas"
            >
              {processando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              <span>Fechar para Análise</span>
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
        </div>

        {/* Mensagem informativa */}
        {tcc.etapa_atual === EtapaTCC.ANALISE_FINAL_COORDENADOR && !todasBloqueadas && (
          <p className="mt-3 text-xs text-[rgb(var(--cor-texto-secundario))]">
            {avaliacoesEnviadas === 3
              ? 'Clique em "Fechar para Análise" para bloquear as 3 avaliações e prosseguir para aprovação final.'
              : `Aguarde todas as 3 avaliações serem enviadas (${avaliacoesEnviadas}/3 enviadas).`
            }
          </p>
        )}

        {todasBloqueadas && (
          <p className="mt-3 text-xs text-[rgb(var(--cor-texto-secundario))]">
            Avaliações bloqueadas. Agora você pode aprovar e concluir o TCC.
          </p>
        )}
      </div>

      {/* Modais de confirmação */}
      <Modal
        aberto={modalBloquear}
        aoFechar={() => setModalBloquear(false)}
        titulo="Fechar para Análise"
        mensagem="Deseja fechar as 3 avaliações para análise final? Após esta ação, os avaliadores não poderão mais editar e você poderá aprovar e concluir o TCC."
        tipo="confirmacao"
        textoConfirmar="Fechar para Análise"
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
    </>
  );
}
