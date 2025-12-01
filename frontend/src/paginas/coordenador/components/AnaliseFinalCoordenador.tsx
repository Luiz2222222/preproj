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
  AlertCircle
} from 'lucide-react';
import type { TCC } from '../../../types';
import { useAvaliacoesFase2 } from '../../../hooks';
import { StatusAvaliacaoFase2 } from '../../../types/enums';
import api from '../../../servicos/api';
import { Modal } from '../../../componentes/Modal';

interface AnaliseFinalCoordenadorProps {
  tcc: TCC;
  onConclusao?: () => void;
}

export function AnaliseFinalCoordenador({ tcc, onConclusao }: AnaliseFinalCoordenadorProps) {
  const {
    avaliacoes,
    carregando,
    erro
  } = useAvaliacoesFase2({
    tccId: tcc.id,
    autoCarregar: true
  });

  const [processando, setProcessando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [modalAprovar, setModalAprovar] = useState(false);
  const [modalSolicitarAjustes, setModalSolicitarAjustes] = useState(false);
  const [avaliadoresSelecionados, setAvaliadoresSelecionados] = useState<number[]>([]);
  const [mensagemAjustes, setMensagemAjustes] = useState('');

  // Estatísticas
  const avaliacoesBloqueadas = avaliacoes.filter(a => a.status === StatusAvaliacaoFase2.BLOQUEADO);
  const todasBloqueadas = avaliacoes.length === 3 && avaliacoesBloqueadas.length === 3;

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
        <div className="flex items-center gap-2 mb-6">
          <Award className="h-6 w-6 text-[rgb(var(--cor-info))]" />
          <h3 className="text-xl font-bold text-[rgb(var(--cor-texto-primario))]">Análise Final e Conclusão</h3>
        </div>

        {/* Mensagem de sucesso */}
        {mensagemSucesso && (
          <div className="mb-6 p-4 bg-[rgb(var(--cor-sucesso))]/10 border border-[rgb(var(--cor-sucesso))]/20 rounded-lg flex items-center gap-2 text-[rgb(var(--cor-sucesso))]">
            <CheckCircle className="h-5 w-5" />
            <span>{mensagemSucesso}</span>
          </div>
        )}

        {/* Notas Finais */}
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
                className="border border-[rgb(var(--cor-borda))] rounded-lg p-4 bg-[rgb(var(--cor-fundo))]"
              >
                <div className="flex items-start justify-between mb-2">
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
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      avaliacao.status === StatusAvaliacaoFase2.BLOQUEADO
                        ? 'bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-secundario))]'
                        : 'bg-[rgb(var(--cor-alerta))]/10 text-[rgb(var(--cor-alerta))]'
                    }`}>
                      {avaliacao.status === StatusAvaliacaoFase2.BLOQUEADO ? 'Bloqueado' : avaliacao.status}
                    </span>
                    <span className="text-lg font-bold text-[rgb(var(--cor-info))]">
                      {avaliacao.nota_final !== null ? Number(avaliacao.nota_final).toFixed(2).replace('.', ',') : '-'} / 10,0
                    </span>
                  </div>
                </div>

                {/* Detalhes das notas */}
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2 text-xs">
                  <div className="text-[rgb(var(--cor-texto-secundario))]">
                    <span className="block text-[rgb(var(--cor-texto-secundario))]">Coerência:</span>
                    <span className="font-medium">{avaliacao.nota_coerencia_conteudo !== null ? Number(avaliacao.nota_coerencia_conteudo).toFixed(1).replace('.', ',') : '-'}/2,0</span>
                  </div>
                  <div className="text-[rgb(var(--cor-texto-secundario))]">
                    <span className="block text-[rgb(var(--cor-texto-secundario))]">Qualidade:</span>
                    <span className="font-medium">{avaliacao.nota_qualidade_apresentacao !== null ? Number(avaliacao.nota_qualidade_apresentacao).toFixed(1).replace('.', ',') : '-'}/2,0</span>
                  </div>
                  <div className="text-[rgb(var(--cor-texto-secundario))]">
                    <span className="block text-[rgb(var(--cor-texto-secundario))]">Domínio:</span>
                    <span className="font-medium">{avaliacao.nota_dominio_tema !== null ? Number(avaliacao.nota_dominio_tema).toFixed(1).replace('.', ',') : '-'}/2,5</span>
                  </div>
                  <div className="text-[rgb(var(--cor-texto-secundario))]">
                    <span className="block text-[rgb(var(--cor-texto-secundario))]">Clareza:</span>
                    <span className="font-medium">{avaliacao.nota_clareza_fluencia !== null ? Number(avaliacao.nota_clareza_fluencia).toFixed(1).replace('.', ',') : '-'}/2,5</span>
                  </div>
                  <div className="text-[rgb(var(--cor-texto-secundario))]">
                    <span className="block text-[rgb(var(--cor-texto-secundario))]">Tempo:</span>
                    <span className="font-medium">{avaliacao.nota_observancia_tempo !== null ? Number(avaliacao.nota_observancia_tempo).toFixed(1).replace('.', ',') : '-'}/1,0</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerta se não todas bloqueadas */}
        {!todasBloqueadas && (
          <div className="mb-4 p-3 bg-[rgb(var(--cor-alerta))]/10 border border-[rgb(var(--cor-alerta))]/20 rounded-lg flex items-center gap-2 text-[rgb(var(--cor-alerta))]">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">
              Todas as 3 avaliações devem estar bloqueadas antes de aprovar e concluir.
              Use o botão "Fechar para Análise" acima.
            </span>
          </div>
        )}

        {/* Botões de ação */}
        <div className="space-y-3">
          {/* Botão Solicitar Ajustes Finais */}
          {todasBloqueadas && (
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
          )}

          {/* Botão Aprovar e Concluir */}
          <button
          onClick={() => setModalAprovar(true)}
          disabled={processando || !todasBloqueadas}
          className="w-full px-6 py-3 bg-gradient-to-r from-[rgb(var(--cor-info))] to-[rgb(var(--cor-destaque))] text-white rounded-lg hover:from-[rgb(var(--cor-info))]/90 hover:to-[rgb(var(--cor-destaque))]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-semibold"
          title={todasBloqueadas ? 'Aprovar e concluir o TCC' : 'Bloqueie todas as avaliações primeiro'}
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

          <p className="text-xs text-center text-[rgb(var(--cor-texto-secundario))]">
            {todasBloqueadas
              ? 'Você pode solicitar ajustes finais a avaliadores específicos (muda TCC para AGUARDANDO_AJUSTES_FINAIS) ou aprovar e concluir o TCC.'
              : 'Esta ação marcará o TCC como CONCLUÍDO. As notas já foram calculadas automaticamente.'}
          </p>
        </div>
      </div>

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
