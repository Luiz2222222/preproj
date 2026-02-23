/**
 * Formulário de Avaliação da Fase II (Apresentação)
 * Baseado no formulário da Fase I
 */

import { useState, useEffect } from 'react';
import {
  Save,
  Send,
  X,
  Lock,
  AlertCircle,
  CheckCircle,
  Loader2,
  Clock,
  Info
} from 'lucide-react';
import type { AvaliacaoFase2, EnviarAvaliacaoFase2DTO } from '../types';
import { StatusAvaliacaoFase2 } from '../types/enums';
import { formatarDataCurta } from '../utils/datas';
import { TextareaAutoResize } from './TextareaAutoResize';

// Descrições dos critérios da Fase II
const CRITERIOS_FASE2 = {
  coerencia: {
    titulo: 'Coerência do conteúdo da apresentação oral com o documento textual',
    descricao: 'Avalia se a apresentação está alinhada com o conteúdo escrito da monografia'
  },
  qualidade: {
    titulo: 'Qualidade e estrutura do material de apresentação',
    descricao: 'Avalia a organização, clareza visual e adequação dos slides/materiais utilizados'
  },
  dominio: {
    titulo: 'Domínio e conhecimento do tema',
    descricao: 'Avalia o conhecimento demonstrado pelo apresentador sobre o tema do trabalho'
  },
  clareza: {
    titulo: 'Clareza e fluência verbal na exposição de ideias',
    descricao: 'Avalia a capacidade de comunicação oral, dicção e organização do discurso'
  },
  tempo: {
    titulo: 'Observância do tempo de apresentação (de 20 a 25 minutos ou definido pela banca)',
    descricao: 'Avalia se o apresentador respeitou o tempo estipulado para a apresentação'
  }
};

interface FormularioAvaliacaoFase2Props {
  minhaAvaliacao: AvaliacaoFase2 | null;
  processando: boolean;
  mensagemSucesso: string | null;
  onSalvarRascunho: (dados: EnviarAvaliacaoFase2DTO) => Promise<void>;
  onEnviarAvaliacao: (dados: EnviarAvaliacaoFase2DTO) => Promise<void>;
  onCancelarEnvio: () => Promise<void>;
}

export function FormularioAvaliacaoFase2({
  minhaAvaliacao,
  processando,
  mensagemSucesso,
  onSalvarRascunho,
  onEnviarAvaliacao,
  onCancelarEnvio
}: FormularioAvaliacaoFase2Props) {
  // Notas dos 5 critérios (mantidas como string para permitir entrada com vírgula/ponto)
  const [notaCoerencia, setNotaCoerencia] = useState<string>('');
  const [notaQualidade, setNotaQualidade] = useState<string>('');
  const [notaDominio, setNotaDominio] = useState<string>('');
  const [notaClareza, setNotaClareza] = useState<string>('');
  const [notaTempo, setNotaTempo] = useState<string>('');

  // Comentários individuais para cada critério (facultativos)
  const [comentarioCoerencia, setComentarioCoerencia] = useState('');
  const [comentarioQualidade, setComentarioQualidade] = useState('');
  const [comentarioDominio, setComentarioDominio] = useState('');
  const [comentarioClareza, setComentarioClareza] = useState('');
  const [comentarioTempo, setComentarioTempo] = useState('');

  // Parecer geral (opcional)
  const [parecerGeral, setParecerGeral] = useState('');

  // Estados para modais
  const [modalAlerta, setModalAlerta] = useState<{ titulo: string; mensagem: string } | null>(null);
  const [modalConfirmacao, setModalConfirmacao] = useState<{ titulo: string; mensagem: string; onConfirm: () => void } | null>(null);

  const pesos = minhaAvaliacao?.pesos_configurados;

  // Verificar permissões
  const podeEditarAvaliacao = minhaAvaliacao?.pode_editar ?? false;
  const podeEditarPrazo = minhaAvaliacao?.tcc_dados?.permissoes?.pode_editar_fase2 ?? true;
  const podeEditar = podeEditarAvaliacao && podeEditarPrazo;
  const estaEnviada = minhaAvaliacao?.status === StatusAvaliacaoFase2.ENVIADO;
  const estaBloqueada = minhaAvaliacao?.status === StatusAvaliacaoFase2.BLOQUEADO || minhaAvaliacao?.status === StatusAvaliacaoFase2.CONCLUIDO;
  const bloqueadoPeloCoordenador = minhaAvaliacao?.tcc_dados?.avaliacao_fase2_bloqueada ?? false;
  const foiAprovada = minhaAvaliacao?.tcc_dados?.etapa_atual === 'CONCLUIDO';
  const prazosExpirado = !podeEditarPrazo && !bloqueadoPeloCoordenador && !foiAprovada;

  // Verificar se a defesa ainda não ocorreu
  const defesaNaoOcorreu = minhaAvaliacao?.status === StatusAvaliacaoFase2.PENDENTE && !podeEditar && !bloqueadoPeloCoordenador && !prazosExpirado;

  // Função para detectar se o parecer tem formato estruturado
  const isParecerEstruturado = (parecer: string): boolean => {
    return /===\s*.+?\s*===/i.test(parecer);
  };

  // Função auxiliar para extrair uma seção do parecer estruturado
  const extractSection = (parecer: string, sectionName: string): string => {
    const regex = new RegExp(`===\\s*${sectionName}\\s*===\\s*([\\s\\S]*?)(?=\\n===|$)`, 'i');
    const match = parecer.match(regex);
    return match ? match[1].trim() : '';
  };

  // Atualizar formulário quando carregar avaliação
  useEffect(() => {
    if (minhaAvaliacao) {
      setNotaCoerencia(minhaAvaliacao.nota_coerencia_conteudo !== null ? minhaAvaliacao.nota_coerencia_conteudo.toString().replace('.', ',') : '');
      setNotaQualidade(minhaAvaliacao.nota_qualidade_apresentacao !== null ? minhaAvaliacao.nota_qualidade_apresentacao.toString().replace('.', ',') : '');
      setNotaDominio(minhaAvaliacao.nota_dominio_tema !== null ? minhaAvaliacao.nota_dominio_tema.toString().replace('.', ',') : '');
      setNotaClareza(minhaAvaliacao.nota_clareza_fluencia !== null ? minhaAvaliacao.nota_clareza_fluencia.toString().replace('.', ',') : '');
      setNotaTempo(minhaAvaliacao.nota_observancia_tempo !== null ? minhaAvaliacao.nota_observancia_tempo.toString().replace('.', ',') : '');

      // Parsear parecer para extrair comentários individuais
      const parecer = minhaAvaliacao.parecer || '';
      if (isParecerEstruturado(parecer)) {
        setComentarioCoerencia(extractSection(parecer, 'Coerência'));
        setComentarioQualidade(extractSection(parecer, 'Qualidade'));
        setComentarioDominio(extractSection(parecer, 'Domínio'));
        setComentarioClareza(extractSection(parecer, 'Clareza'));
        setComentarioTempo(extractSection(parecer, 'Tempo'));
        setParecerGeral(extractSection(parecer, 'Parecer Geral'));
      } else {
        setComentarioCoerencia('');
        setComentarioQualidade('');
        setComentarioDominio('');
        setComentarioClareza('');
        setComentarioTempo('');
        setParecerGeral(parecer);
      }
    }
  }, [minhaAvaliacao]);

  // Função para remover cabeçalhos === ... === do início do texto
  const stripHeader = (texto: string): string => {
    return texto.replace(/^===\s*.+?\s*===\s*/i, '').trim();
  };

  // Construir parecer estruturado combinando todos os comentários
  const construirParecer = () => {
    const partes: string[] = [];

    const textoCoerencia = stripHeader(comentarioCoerencia.trim());
    if (textoCoerencia) {
      partes.push(`=== Coerência ===\n${textoCoerencia}`);
    }

    const textoQualidade = stripHeader(comentarioQualidade.trim());
    if (textoQualidade) {
      partes.push(`=== Qualidade ===\n${textoQualidade}`);
    }

    const textoDominio = stripHeader(comentarioDominio.trim());
    if (textoDominio) {
      partes.push(`=== Domínio ===\n${textoDominio}`);
    }

    const textoClareza = stripHeader(comentarioClareza.trim());
    if (textoClareza) {
      partes.push(`=== Clareza ===\n${textoClareza}`);
    }

    const textoTempo = stripHeader(comentarioTempo.trim());
    if (textoTempo) {
      partes.push(`=== Tempo ===\n${textoTempo}`);
    }

    const textoParecerGeral = stripHeader(parecerGeral.trim());
    if (textoParecerGeral) {
      partes.push(`=== Parecer Geral ===\n${textoParecerGeral}`);
    }

    return partes.join('\n\n');
  };

  // Converter string com vírgula para número
  const converterParaNumero = (valor: string): number | null => {
    if (valor === '') return null;
    const valorNormalizado = valor.replace(',', '.');
    const num = parseFloat(valorNormalizado);
    return isNaN(num) ? null : num;
  };

  // Converter e aplicar clamp (limites)
  const converterEClampar = (valor: string, min: number, max: number): number | null => {
    const num = converterParaNumero(valor);
    if (num === null) return null;
    return Math.max(min, Math.min(num, max));
  };

  // Calcular nota total
  const calcularNotaTotal = () => {
    const n1 = converterParaNumero(notaCoerencia);
    const n2 = converterParaNumero(notaQualidade);
    const n3 = converterParaNumero(notaDominio);
    const n4 = converterParaNumero(notaClareza);
    const n5 = converterParaNumero(notaTempo);

    if (n1 === null || n2 === null || n3 === null || n4 === null || n5 === null) {
      return null;
    }

    return (n1 + n2 + n3 + n4 + n5).toFixed(2);
  };

  const notaTotal = calcularNotaTotal();

  // Função para parsear número brasileiro (com vírgula)
  const parseBR = (valor: string): number | null => {
    if (valor === '') return null;
    const valorNormalizado = valor.replace(',', '.');
    const num = parseFloat(valorNormalizado);
    return isNaN(num) ? null : num;
  };

  // Função clampScore - aceita estados intermediários e formata
  const clampScore = (raw: string, max: number, currentValue: string): string => {
    if (raw === '') return '';

    let cleaned = raw.replace(/[^\d,.]/g, '');
    cleaned = cleaned.replace(/\./g, ',');

    const virgulaCount = (cleaned.match(/,/g) || []).length;
    if (virgulaCount > 1) {
      return currentValue;
    }

    const regex = /^[0-9]{0,2}(,[0-9]{0,2})?$/;
    if (!regex.test(cleaned)) {
      return currentValue;
    }

    const num = parseBR(cleaned);
    if (num !== null && !cleaned.endsWith(',')) {
      const clamped = Math.max(0, Math.min(num, max));
      return clamped.toString().replace('.', ',');
    }

    return cleaned;
  };

  const handleSalvarRascunho = async () => {
    const parecer = construirParecer();

    const n1 = converterEClampar(notaCoerencia, 0, pesos?.peso_coerencia_conteudo ?? 2.0);
    const n2 = converterEClampar(notaQualidade, 0, pesos?.peso_qualidade_apresentacao ?? 2.0);
    const n3 = converterEClampar(notaDominio, 0, pesos?.peso_dominio_tema ?? 2.5);
    const n4 = converterEClampar(notaClareza, 0, pesos?.peso_clareza_fluencia ?? 2.5);
    const n5 = converterEClampar(notaTempo, 0, pesos?.peso_observancia_tempo ?? 1.0);

    if (n1 !== null) setNotaCoerencia(n1.toString().replace('.', ','));
    if (n2 !== null) setNotaQualidade(n2.toString().replace('.', ','));
    if (n3 !== null) setNotaDominio(n3.toString().replace('.', ','));
    if (n4 !== null) setNotaClareza(n4.toString().replace('.', ','));
    if (n5 !== null) setNotaTempo(n5.toString().replace('.', ','));

    await onSalvarRascunho({
      nota_coerencia_conteudo: n1 ?? undefined,
      nota_qualidade_apresentacao: n2 ?? undefined,
      nota_dominio_tema: n3 ?? undefined,
      nota_clareza_fluencia: n4 ?? undefined,
      nota_observancia_tempo: n5 ?? undefined,
      parecer: parecer || undefined,
      status: StatusAvaliacaoFase2.PENDENTE
    });
  };

  const handleEnviarAvaliacao = async () => {
    const n1 = converterEClampar(notaCoerencia, 0, pesos?.peso_coerencia_conteudo ?? 2.0);
    const n2 = converterEClampar(notaQualidade, 0, pesos?.peso_qualidade_apresentacao ?? 2.0);
    const n3 = converterEClampar(notaDominio, 0, pesos?.peso_dominio_tema ?? 2.5);
    const n4 = converterEClampar(notaClareza, 0, pesos?.peso_clareza_fluencia ?? 2.5);
    const n5 = converterEClampar(notaTempo, 0, pesos?.peso_observancia_tempo ?? 1.0);

    if (n1 === null || n2 === null || n3 === null || n4 === null || n5 === null) {
      setModalAlerta({
        titulo: 'Notas incompletas',
        mensagem: 'Por favor, preencha todas as notas antes de enviar.'
      });
      return;
    }

    setModalConfirmacao({
      titulo: 'Confirmar envio',
      mensagem: 'Deseja enviar esta avaliação? Ela ainda poderá ser editada até que o coordenador a bloqueie.',
      onConfirm: async () => {
        const parecer = construirParecer();

        setNotaCoerencia(n1.toString().replace('.', ','));
        setNotaQualidade(n2.toString().replace('.', ','));
        setNotaDominio(n3.toString().replace('.', ','));
        setNotaClareza(n4.toString().replace('.', ','));
        setNotaTempo(n5.toString().replace('.', ','));

        await onEnviarAvaliacao({
          nota_coerencia_conteudo: n1,
          nota_qualidade_apresentacao: n2,
          nota_dominio_tema: n3,
          nota_clareza_fluencia: n4,
          nota_observancia_tempo: n5,
          parecer: parecer,
          status: StatusAvaliacaoFase2.ENVIADO
        });
        setModalConfirmacao(null);
      }
    });
  };

  return (
    <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-sm border border-[rgb(var(--cor-borda))] p-6">
      {/* Mensagem de sucesso */}
      {mensagemSucesso && (
        <div className="mb-6 p-3 bg-[rgb(var(--cor-sucesso))]/10 border border-[rgb(var(--cor-sucesso))]/30 rounded-lg flex items-center gap-2 text-[rgb(var(--cor-sucesso))]">
          <CheckCircle className="h-5 w-5" />
          <span className="text-sm">{mensagemSucesso}</span>
        </div>
      )}

      {/* Status da avaliação */}
      {minhaAvaliacao && (
        <div className="mb-6 p-4 bg-[rgb(var(--cor-fundo))] rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[rgb(var(--cor-texto-primario))]">Status:</span>
              {minhaAvaliacao.status === StatusAvaliacaoFase2.PENDENTE && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-[rgb(var(--cor-alerta))]/10 text-[rgb(var(--cor-alerta))] flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Rascunho
                </span>
              )}
              {minhaAvaliacao.status === StatusAvaliacaoFase2.ENVIADO && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-[rgb(var(--cor-destaque))]/10 text-[rgb(var(--cor-destaque))] flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Enviada
                </span>
              )}
              {(minhaAvaliacao.status === StatusAvaliacaoFase2.BLOQUEADO || minhaAvaliacao.status === StatusAvaliacaoFase2.CONCLUIDO) && (
                minhaAvaliacao.status === StatusAvaliacaoFase2.CONCLUIDO ? (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-[rgb(var(--cor-sucesso))]/10 text-[rgb(var(--cor-sucesso))] flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Concluída
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-[rgb(var(--cor-borda))]/20 text-[rgb(var(--cor-texto-secundario))] flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Bloqueada
                  </span>
                )
              )}
            </div>
            {minhaAvaliacao.enviado_em && (
              <span className="text-xs text-[rgb(var(--cor-texto-terciario))]">
                Enviada em: {formatarDataCurta(minhaAvaliacao.enviado_em)}
              </span>
            )}
          </div>

          {!podeEditar && !foiAprovada && (
            <div className="flex items-center gap-2 text-sm text-[rgb(var(--cor-alerta))] bg-[rgb(var(--cor-alerta))]/10 p-2 rounded mt-2">
              {estaBloqueada || bloqueadoPeloCoordenador ? (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Esta avaliação foi bloqueada pelo coordenador para análise.</span>
                </>
              ) : prazosExpirado ? (
                <>
                  <Clock className="h-4 w-4" />
                  <span>Prazo de avaliação da Fase II encerrado.</span>
                </>
              ) : defesaNaoOcorreu ? (
                <>
                  <Clock className="h-4 w-4" />
                  <span>A avaliação só fica disponível após a defesa/apresentação.</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Você não pode mais editar esta avaliação.</span>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Formulário de Avaliação */}
      <div className="space-y-6">
        {/* Critérios */}
        <div className="space-y-4">
          {/* 1. Coerência */}
          <div className="bg-[rgb(var(--cor-fundo))] rounded-lg p-4 border border-[rgb(var(--cor-borda))]">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[rgb(var(--cor-fase2-cabecalho))] text-white text-sm font-bold flex items-center justify-center mt-0.5">1</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <p className="text-sm font-semibold text-[rgb(var(--cor-texto-primario))]">{CRITERIOS_FASE2.coerencia.titulo} <span className="font-normal text-xs text-[rgb(var(--cor-texto-secundario))] italic">({CRITERIOS_FASE2.coerencia.descricao})</span></p>
                  <div className="flex-shrink-0 flex items-center gap-1.5">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={notaCoerencia}
                      onChange={(e) => setNotaCoerencia(clampScore(e.target.value, pesos?.peso_coerencia_conteudo ?? 2.0, notaCoerencia))}
                      disabled={!podeEditar || processando || estaEnviada}
                      placeholder="–"
                      className="w-14 h-8 text-center text-sm font-semibold border border-[rgb(var(--cor-borda))] rounded-md focus:ring-2 focus:ring-[rgb(var(--cor-fase2-cabecalho))] focus:border-transparent disabled:bg-[rgb(var(--cor-superficie-hover))] disabled:cursor-not-allowed text-[rgb(var(--cor-texto-primario))] bg-[rgb(var(--cor-superficie))]"
                    />
                    <span className="text-xs text-[rgb(var(--cor-texto-terciario))]">/ {(pesos?.peso_coerencia_conteudo ?? 2.0).toFixed(1).replace('.', ',')}</span>
                  </div>
                </div>
                <TextareaAutoResize
                  value={comentarioCoerencia}
                  onChange={(e) => setComentarioCoerencia(e.target.value)}
                  disabled={!podeEditar || processando || estaEnviada}
                  rows={2}
                  placeholder="Comentários sobre este critério..."
                  className="w-full px-3 py-2 text-sm border border-[rgb(var(--cor-borda))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-fase2-cabecalho))] focus:border-transparent disabled:bg-[rgb(var(--cor-superficie-hover))] disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* 2. Qualidade */}
          <div className="bg-[rgb(var(--cor-fundo))] rounded-lg p-4 border border-[rgb(var(--cor-borda))]">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[rgb(var(--cor-fase2-cabecalho))] text-white text-sm font-bold flex items-center justify-center mt-0.5">2</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <p className="text-sm font-semibold text-[rgb(var(--cor-texto-primario))]">{CRITERIOS_FASE2.qualidade.titulo} <span className="font-normal text-xs text-[rgb(var(--cor-texto-secundario))] italic">({CRITERIOS_FASE2.qualidade.descricao})</span></p>
                  <div className="flex-shrink-0 flex items-center gap-1.5">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={notaQualidade}
                      onChange={(e) => setNotaQualidade(clampScore(e.target.value, pesos?.peso_qualidade_apresentacao ?? 2.0, notaQualidade))}
                      disabled={!podeEditar || processando || estaEnviada}
                      placeholder="–"
                      className="w-14 h-8 text-center text-sm font-semibold border border-[rgb(var(--cor-borda))] rounded-md focus:ring-2 focus:ring-[rgb(var(--cor-fase2-cabecalho))] focus:border-transparent disabled:bg-[rgb(var(--cor-superficie-hover))] disabled:cursor-not-allowed text-[rgb(var(--cor-texto-primario))] bg-[rgb(var(--cor-superficie))]"
                    />
                    <span className="text-xs text-[rgb(var(--cor-texto-terciario))]">/ {(pesos?.peso_qualidade_apresentacao ?? 2.0).toFixed(1).replace('.', ',')}</span>
                  </div>
                </div>
                <TextareaAutoResize
                  value={comentarioQualidade}
                  onChange={(e) => setComentarioQualidade(e.target.value)}
                  disabled={!podeEditar || processando || estaEnviada}
                  rows={2}
                  placeholder="Comentários sobre este critério..."
                  className="w-full px-3 py-2 text-sm border border-[rgb(var(--cor-borda))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-fase2-cabecalho))] focus:border-transparent disabled:bg-[rgb(var(--cor-superficie-hover))] disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* 3. Domínio */}
          <div className="bg-[rgb(var(--cor-fundo))] rounded-lg p-4 border border-[rgb(var(--cor-borda))]">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[rgb(var(--cor-fase2-cabecalho))] text-white text-sm font-bold flex items-center justify-center mt-0.5">3</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <p className="text-sm font-semibold text-[rgb(var(--cor-texto-primario))]">{CRITERIOS_FASE2.dominio.titulo} <span className="font-normal text-xs text-[rgb(var(--cor-texto-secundario))] italic">({CRITERIOS_FASE2.dominio.descricao})</span></p>
                  <div className="flex-shrink-0 flex items-center gap-1.5">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={notaDominio}
                      onChange={(e) => setNotaDominio(clampScore(e.target.value, pesos?.peso_dominio_tema ?? 2.5, notaDominio))}
                      disabled={!podeEditar || processando || estaEnviada}
                      placeholder="–"
                      className="w-14 h-8 text-center text-sm font-semibold border border-[rgb(var(--cor-borda))] rounded-md focus:ring-2 focus:ring-[rgb(var(--cor-fase2-cabecalho))] focus:border-transparent disabled:bg-[rgb(var(--cor-superficie-hover))] disabled:cursor-not-allowed text-[rgb(var(--cor-texto-primario))] bg-[rgb(var(--cor-superficie))]"
                    />
                    <span className="text-xs text-[rgb(var(--cor-texto-terciario))]">/ {(pesos?.peso_dominio_tema ?? 2.5).toFixed(1).replace('.', ',')}</span>
                  </div>
                </div>
                <TextareaAutoResize
                  value={comentarioDominio}
                  onChange={(e) => setComentarioDominio(e.target.value)}
                  disabled={!podeEditar || processando || estaEnviada}
                  rows={2}
                  placeholder="Comentários sobre este critério..."
                  className="w-full px-3 py-2 text-sm border border-[rgb(var(--cor-borda))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-fase2-cabecalho))] focus:border-transparent disabled:bg-[rgb(var(--cor-superficie-hover))] disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* 4. Clareza */}
          <div className="bg-[rgb(var(--cor-fundo))] rounded-lg p-4 border border-[rgb(var(--cor-borda))]">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[rgb(var(--cor-fase2-cabecalho))] text-white text-sm font-bold flex items-center justify-center mt-0.5">4</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <p className="text-sm font-semibold text-[rgb(var(--cor-texto-primario))]">{CRITERIOS_FASE2.clareza.titulo} <span className="font-normal text-xs text-[rgb(var(--cor-texto-secundario))] italic">({CRITERIOS_FASE2.clareza.descricao})</span></p>
                  <div className="flex-shrink-0 flex items-center gap-1.5">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={notaClareza}
                      onChange={(e) => setNotaClareza(clampScore(e.target.value, pesos?.peso_clareza_fluencia ?? 2.5, notaClareza))}
                      disabled={!podeEditar || processando || estaEnviada}
                      placeholder="–"
                      className="w-14 h-8 text-center text-sm font-semibold border border-[rgb(var(--cor-borda))] rounded-md focus:ring-2 focus:ring-[rgb(var(--cor-fase2-cabecalho))] focus:border-transparent disabled:bg-[rgb(var(--cor-superficie-hover))] disabled:cursor-not-allowed text-[rgb(var(--cor-texto-primario))] bg-[rgb(var(--cor-superficie))]"
                    />
                    <span className="text-xs text-[rgb(var(--cor-texto-terciario))]">/ {(pesos?.peso_clareza_fluencia ?? 2.5).toFixed(1).replace('.', ',')}</span>
                  </div>
                </div>
                <TextareaAutoResize
                  value={comentarioClareza}
                  onChange={(e) => setComentarioClareza(e.target.value)}
                  disabled={!podeEditar || processando || estaEnviada}
                  rows={2}
                  placeholder="Comentários sobre este critério..."
                  className="w-full px-3 py-2 text-sm border border-[rgb(var(--cor-borda))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-fase2-cabecalho))] focus:border-transparent disabled:bg-[rgb(var(--cor-superficie-hover))] disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* 5. Tempo */}
          <div className="bg-[rgb(var(--cor-fundo))] rounded-lg p-4 border border-[rgb(var(--cor-borda))]">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[rgb(var(--cor-fase2-cabecalho))] text-white text-sm font-bold flex items-center justify-center mt-0.5">5</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <p className="text-sm font-semibold text-[rgb(var(--cor-texto-primario))]">{CRITERIOS_FASE2.tempo.titulo} <span className="font-normal text-xs text-[rgb(var(--cor-texto-secundario))] italic">({CRITERIOS_FASE2.tempo.descricao})</span></p>
                  <div className="flex-shrink-0 flex items-center gap-1.5">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={notaTempo}
                      onChange={(e) => setNotaTempo(clampScore(e.target.value, pesos?.peso_observancia_tempo ?? 1.0, notaTempo))}
                      disabled={!podeEditar || processando || estaEnviada}
                      placeholder="–"
                      className="w-14 h-8 text-center text-sm font-semibold border border-[rgb(var(--cor-borda))] rounded-md focus:ring-2 focus:ring-[rgb(var(--cor-fase2-cabecalho))] focus:border-transparent disabled:bg-[rgb(var(--cor-superficie-hover))] disabled:cursor-not-allowed text-[rgb(var(--cor-texto-primario))] bg-[rgb(var(--cor-superficie))]"
                    />
                    <span className="text-xs text-[rgb(var(--cor-texto-terciario))]">/ {(pesos?.peso_observancia_tempo ?? 1.0).toFixed(1).replace('.', ',')}</span>
                  </div>
                </div>
                <TextareaAutoResize
                  value={comentarioTempo}
                  onChange={(e) => setComentarioTempo(e.target.value)}
                  disabled={!podeEditar || processando || estaEnviada}
                  rows={2}
                  placeholder="Comentários sobre este critério..."
                  className="w-full px-3 py-2 text-sm border border-[rgb(var(--cor-borda))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-fase2-cabecalho))] focus:border-transparent disabled:bg-[rgb(var(--cor-superficie-hover))] disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Parecer Geral (Opcional) */}
        <div className="bg-[rgb(var(--cor-destaque))]/10 rounded-lg p-4 border border-[rgb(var(--cor-destaque))]/30">
          <label className="block text-sm font-medium text-[rgb(var(--cor-texto-primario))] mb-2">
            Parecer Geral (Opcional)
          </label>
          <TextareaAutoResize
            value={parecerGeral}
            onChange={(e) => setParecerGeral(e.target.value)}
            disabled={!podeEditar || processando || estaEnviada}
            rows={4}
            placeholder="Comentários gerais sobre a apresentação..."
            className="w-full px-3 py-2 text-sm border border-[rgb(var(--cor-borda))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-fase2-cabecalho))] focus:border-transparent disabled:bg-[rgb(var(--cor-superficie-hover))] disabled:cursor-not-allowed"
          />
        </div>

        {/* Nota Total */}
        {notaTotal !== null && (
          <div className="p-4 bg-[rgb(var(--cor-fase2-cabecalho))]/10 rounded-lg border-2 border-[rgb(var(--cor-fase2-cabecalho))]/30">
            <p className="text-center">
              <span className="text-sm font-medium text-[rgb(var(--cor-texto-primario))]">Nota Final (NF2):</span>
              <span className="ml-3 text-3xl font-bold text-[rgb(var(--cor-fase2-cabecalho))]">
                {notaTotal.replace('.', ',')}
              </span>
              <span className="text-[rgb(var(--cor-texto-secundario))]"> / 10,0</span>
            </p>
          </div>
        )}

        {/* Ações */}
        <div className="flex flex-wrap gap-3 pt-6 border-t border-[rgb(var(--cor-borda))]">
          {podeEditar && !estaEnviada && (
            <>
              <button
                onClick={handleSalvarRascunho}
                disabled={processando}
                className="px-6 py-3 bg-[rgb(var(--cor-borda-forte))] text-[rgb(var(--cor-texto-sobre-destaque))] rounded-lg hover:bg-[rgb(var(--cor-borda-forte))]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
              >
                {processando ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Save className="h-5 w-5" />
                )}
                <span>Salvar Rascunho</span>
              </button>

              <button
                onClick={handleEnviarAvaliacao}
                disabled={processando || converterParaNumero(notaCoerencia) === null ||
                          converterParaNumero(notaQualidade) === null ||
                          converterParaNumero(notaDominio) === null ||
                          converterParaNumero(notaClareza) === null ||
                          converterParaNumero(notaTempo) === null}
                className="px-6 py-3 bg-[rgb(var(--cor-fase2-cabecalho))] text-[rgb(var(--cor-texto-sobre-destaque))] rounded-lg hover:bg-[rgb(var(--cor-fase2-cabecalho))]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
              >
                {processando ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
                <span>Enviar Avaliação</span>
              </button>
            </>
          )}

          {podeEditar && estaEnviada && (
            <button
              onClick={onCancelarEnvio}
              disabled={processando}
              className="px-6 py-3 bg-[rgb(var(--cor-alerta))] text-[rgb(var(--cor-texto-sobre-destaque))] rounded-lg hover:bg-[rgb(var(--cor-alerta))]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
            >
              {processando ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <X className="h-5 w-5" />
              )}
              <span>Reabrir para Edição</span>
            </button>
          )}
        </div>

        {!podeEditar && !foiAprovada && (
          <div className="p-4 bg-[rgb(var(--cor-fundo))] rounded-lg border border-[rgb(var(--cor-borda))]">
            <p className="text-sm text-[rgb(var(--cor-texto-secundario))] text-center">
              Esta avaliação não pode mais ser editada. Entre em contato com o coordenador se precisar fazer alterações.
            </p>
          </div>
        )}
      </div>

      {/* Modal de Alerta */}
      {modalAlerta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center gap-3 p-6 border-b border-[rgb(var(--cor-borda))]">
              <AlertCircle className="h-6 w-6 text-[rgb(var(--cor-alerta))]" />
              <h3 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))]">{modalAlerta.titulo}</h3>
            </div>
            <div className="p-6">
              <p className="text-[rgb(var(--cor-texto-primario))]">{modalAlerta.mensagem}</p>
            </div>
            <div className="flex justify-end p-6 border-t border-[rgb(var(--cor-borda))]">
              <button
                onClick={() => setModalAlerta(null)}
                className="px-6 py-2 bg-[rgb(var(--cor-destaque))] text-[rgb(var(--cor-texto-sobre-destaque))] rounded-lg hover:bg-[rgb(var(--cor-destaque))]/90 transition-colors font-medium"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação */}
      {modalConfirmacao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center gap-3 p-6 border-b border-[rgb(var(--cor-borda))]">
              <Info className="h-6 w-6 text-[rgb(var(--cor-destaque))]" />
              <h3 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))]">{modalConfirmacao.titulo}</h3>
            </div>
            <div className="p-6">
              <p className="text-[rgb(var(--cor-texto-primario))]">{modalConfirmacao.mensagem}</p>
            </div>
            <div className="flex gap-3 p-6 border-t border-[rgb(var(--cor-borda))]">
              <button
                onClick={() => setModalConfirmacao(null)}
                className="flex-1 px-4 py-2 bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-primario))] rounded-lg hover:bg-[rgb(var(--cor-superficie-hover))] transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={modalConfirmacao.onConfirm}
                className="flex-1 px-4 py-2 bg-[rgb(var(--cor-destaque))] text-[rgb(var(--cor-texto-sobre-destaque))] rounded-lg hover:bg-[rgb(var(--cor-destaque))]/90 transition-colors font-medium"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
