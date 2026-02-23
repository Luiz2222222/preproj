/**
 * Formulário de Avaliação da Fase I (Monografia)
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
import type { AvaliacaoFase1, EnviarAvaliacaoFase1DTO } from '../types';
import { StatusAvaliacaoFase1 } from '../types/enums';
import { formatarDataCurta } from '../utils/datas';
import { TextareaAutoResize } from './TextareaAutoResize';

// Descrições dos critérios da Fase I
const CRITERIOS_FASE1 = {
  resumo: {
    titulo: 'Resumo',
    descricao: 'Apresentação concisa dos pontos relevantes de um texto, fornecendo uma visão rápida e clara do conteúdo e das conclusões do trabalho'
  },
  introducao: {
    titulo: 'Introdução/Relevância do trabalho',
    descricao: 'Contextualização, delimitação do trabalho, justificativa/relevância, objetivos e estrutura do TCC'
  },
  revisao: {
    titulo: 'Revisão Bibliográfica',
    descricao: 'Apresentação de fontes relacionadas ao tema do trabalho, sintetizadas de maneira lógica, destacando-se os princípios conceitos, teorias, dados, etc.'
  },
  desenvolvimento: {
    titulo: 'Desenvolvimento',
    descricao: 'Apresentação lógica e coesa, apresentando um nível de detalhamento/aprofundamento condizente com o que foi proposto nos objetivos'
  },
  conclusoes: {
    titulo: 'Conclusões',
    descricao: 'Apresentação de forma concisa, indicando implicações práticas, limitações ou outras questões que possam afetar a validade das conclusões, recomendações, contribuições e sugestões para futuras continuidades'
  }
};

interface FormularioAvaliacaoFase1Props {
  minhaAvaliacao: AvaliacaoFase1 | null;
  processando: boolean;
  mensagemSucesso: string | null;
  onSalvarRascunho: (dados: EnviarAvaliacaoFase1DTO) => Promise<void>;
  onEnviarAvaliacao: (dados: EnviarAvaliacaoFase1DTO) => Promise<void>;
  onCancelarEnvio: () => Promise<void>;
}

export function FormularioAvaliacaoFase1({
  minhaAvaliacao,
  processando,
  mensagemSucesso,
  onSalvarRascunho,
  onEnviarAvaliacao,
  onCancelarEnvio
}: FormularioAvaliacaoFase1Props) {
  // Notas dos 5 critérios (mantidas como string para permitir entrada com vírgula/ponto)
  const [notaResumo, setNotaResumo] = useState<string>('');
  const [notaIntroducao, setNotaIntroducao] = useState<string>('');
  const [notaRevisao, setNotaRevisao] = useState<string>('');
  const [notaDesenvolvimento, setNotaDesenvolvimento] = useState<string>('');
  const [notaConclusoes, setNotaConclusoes] = useState<string>('');

  // Comentários individuais para cada critério
  const [comentarioResumo, setComentarioResumo] = useState('');
  const [comentarioIntroducao, setComentarioIntroducao] = useState('');
  const [comentarioRevisao, setComentarioRevisao] = useState('');
  const [comentarioDesenvolvimento, setComentarioDesenvolvimento] = useState('');
  const [comentarioConclusoes, setComentarioConclusoes] = useState('');

  // Parecer geral (opcional)
  const [parecerGeral, setParecerGeral] = useState('');

  // Estados para modais
  const [modalAlerta, setModalAlerta] = useState<{ titulo: string; mensagem: string } | null>(null);
  const [modalConfirmacao, setModalConfirmacao] = useState<{ titulo: string; mensagem: string; onConfirm: () => void } | null>(null);

  const pesos = minhaAvaliacao?.pesos_configurados;

  // Verificar permissões
  const podeEditarAvaliacao = minhaAvaliacao?.pode_editar ?? false;
  const podeEditarPrazo = minhaAvaliacao?.tcc_dados?.permissoes?.pode_editar_fase1 ?? true;
  const podeEditar = podeEditarAvaliacao && podeEditarPrazo;
  const estaEnviada = minhaAvaliacao?.status === StatusAvaliacaoFase1.ENVIADO;
  const estaBloqueada = minhaAvaliacao?.status === StatusAvaliacaoFase1.BLOQUEADO || minhaAvaliacao?.status === StatusAvaliacaoFase1.CONCLUIDO;
  const bloqueadoPeloCoordenador = minhaAvaliacao?.tcc_dados?.avaliacao_fase1_bloqueada ?? false;
  const foiAprovada = minhaAvaliacao?.tcc_dados?.nf1 != null;
  const prazosExpirado = !podeEditarPrazo && !bloqueadoPeloCoordenador && !foiAprovada;

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
      setNotaResumo(minhaAvaliacao.nota_resumo !== null ? minhaAvaliacao.nota_resumo.toString().replace('.', ',') : '');
      setNotaIntroducao(minhaAvaliacao.nota_introducao !== null ? minhaAvaliacao.nota_introducao.toString().replace('.', ',') : '');
      setNotaRevisao(minhaAvaliacao.nota_revisao !== null ? minhaAvaliacao.nota_revisao.toString().replace('.', ',') : '');
      setNotaDesenvolvimento(minhaAvaliacao.nota_desenvolvimento !== null ? minhaAvaliacao.nota_desenvolvimento.toString().replace('.', ',') : '');
      setNotaConclusoes(minhaAvaliacao.nota_conclusoes !== null ? minhaAvaliacao.nota_conclusoes.toString().replace('.', ',') : '');

      // Parsear parecer para extrair comentários individuais
      const parecer = minhaAvaliacao.parecer || '';
      if (isParecerEstruturado(parecer)) {
        setComentarioResumo(extractSection(parecer, 'Resumo'));
        setComentarioIntroducao(extractSection(parecer, 'Introdução/Relevância'));
        setComentarioRevisao(extractSection(parecer, 'Revisão Bibliográfica'));
        setComentarioDesenvolvimento(extractSection(parecer, 'Desenvolvimento'));
        setComentarioConclusoes(extractSection(parecer, 'Conclusões'));
        setParecerGeral(extractSection(parecer, 'Parecer Geral'));
      } else {
        setComentarioResumo('');
        setComentarioIntroducao('');
        setComentarioRevisao('');
        setComentarioDesenvolvimento('');
        setComentarioConclusoes('');
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

    const textoResumo = stripHeader(comentarioResumo.trim());
    if (textoResumo) {
      partes.push(`=== Resumo ===\n${textoResumo}`);
    }

    const textoIntroducao = stripHeader(comentarioIntroducao.trim());
    if (textoIntroducao) {
      partes.push(`=== Introdução/Relevância ===\n${textoIntroducao}`);
    }

    const textoRevisao = stripHeader(comentarioRevisao.trim());
    if (textoRevisao) {
      partes.push(`=== Revisão Bibliográfica ===\n${textoRevisao}`);
    }

    const textoDesenvolvimento = stripHeader(comentarioDesenvolvimento.trim());
    if (textoDesenvolvimento) {
      partes.push(`=== Desenvolvimento ===\n${textoDesenvolvimento}`);
    }

    const textoConclusoes = stripHeader(comentarioConclusoes.trim());
    if (textoConclusoes) {
      partes.push(`=== Conclusões ===\n${textoConclusoes}`);
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
    const n1 = converterParaNumero(notaResumo);
    const n2 = converterParaNumero(notaIntroducao);
    const n3 = converterParaNumero(notaRevisao);
    const n4 = converterParaNumero(notaDesenvolvimento);
    const n5 = converterParaNumero(notaConclusoes);

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

    const n1 = converterEClampar(notaResumo, 0, pesos?.peso_resumo ?? 1.0);
    const n2 = converterEClampar(notaIntroducao, 0, pesos?.peso_introducao ?? 2.0);
    const n3 = converterEClampar(notaRevisao, 0, pesos?.peso_revisao ?? 2.0);
    const n4 = converterEClampar(notaDesenvolvimento, 0, pesos?.peso_desenvolvimento ?? 3.5);
    const n5 = converterEClampar(notaConclusoes, 0, pesos?.peso_conclusoes ?? 1.5);

    if (n1 !== null) setNotaResumo(n1.toString().replace('.', ','));
    if (n2 !== null) setNotaIntroducao(n2.toString().replace('.', ','));
    if (n3 !== null) setNotaRevisao(n3.toString().replace('.', ','));
    if (n4 !== null) setNotaDesenvolvimento(n4.toString().replace('.', ','));
    if (n5 !== null) setNotaConclusoes(n5.toString().replace('.', ','));

    await onSalvarRascunho({
      nota_resumo: n1 ?? undefined,
      nota_introducao: n2 ?? undefined,
      nota_revisao: n3 ?? undefined,
      nota_desenvolvimento: n4 ?? undefined,
      nota_conclusoes: n5 ?? undefined,
      parecer: parecer || undefined,
      status: StatusAvaliacaoFase1.PENDENTE
    });
  };

  const handleEnviarAvaliacao = async () => {
    const n1 = converterEClampar(notaResumo, 0, pesos?.peso_resumo ?? 1.0);
    const n2 = converterEClampar(notaIntroducao, 0, pesos?.peso_introducao ?? 2.0);
    const n3 = converterEClampar(notaRevisao, 0, pesos?.peso_revisao ?? 2.0);
    const n4 = converterEClampar(notaDesenvolvimento, 0, pesos?.peso_desenvolvimento ?? 3.5);
    const n5 = converterEClampar(notaConclusoes, 0, pesos?.peso_conclusoes ?? 1.5);

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

        setNotaResumo(n1.toString().replace('.', ','));
        setNotaIntroducao(n2.toString().replace('.', ','));
        setNotaRevisao(n3.toString().replace('.', ','));
        setNotaDesenvolvimento(n4.toString().replace('.', ','));
        setNotaConclusoes(n5.toString().replace('.', ','));

        await onEnviarAvaliacao({
          nota_resumo: n1,
          nota_introducao: n2,
          nota_revisao: n3,
          nota_desenvolvimento: n4,
          nota_conclusoes: n5,
          parecer: parecer,
          status: StatusAvaliacaoFase1.ENVIADO
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
              {minhaAvaliacao.status === StatusAvaliacaoFase1.PENDENTE && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-[rgb(var(--cor-alerta))]/10 text-[rgb(var(--cor-alerta))] flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Rascunho
                </span>
              )}
              {minhaAvaliacao.status === StatusAvaliacaoFase1.ENVIADO && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-[rgb(var(--cor-destaque))]/10 text-[rgb(var(--cor-destaque))] flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Enviada
                </span>
              )}
              {(minhaAvaliacao.status === StatusAvaliacaoFase1.BLOQUEADO || minhaAvaliacao.status === StatusAvaliacaoFase1.CONCLUIDO) && (
                minhaAvaliacao.status === StatusAvaliacaoFase1.CONCLUIDO ? (
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
                  <span>Prazo de avaliação da Fase I encerrado.</span>
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
          {/* 1. Resumo */}
          <div className="bg-[rgb(var(--cor-fundo))] rounded-lg p-4 border border-[rgb(var(--cor-borda))]">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[rgb(var(--cor-fase1-cabecalho))] text-white text-sm font-bold flex items-center justify-center mt-0.5">1</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <p className="text-sm font-semibold text-[rgb(var(--cor-texto-primario))]">{CRITERIOS_FASE1.resumo.titulo} <span className="font-normal text-xs text-[rgb(var(--cor-texto-secundario))] italic">({CRITERIOS_FASE1.resumo.descricao})</span></p>
                  <div className="flex-shrink-0 flex items-center gap-1.5">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={notaResumo}
                      onChange={(e) => setNotaResumo(clampScore(e.target.value, pesos?.peso_resumo ?? 1.0, notaResumo))}
                      disabled={!podeEditar || processando}
                      placeholder="–"
                      className="w-14 h-8 text-center text-sm font-semibold border border-[rgb(var(--cor-borda))] rounded-md focus:ring-2 focus:ring-[rgb(var(--cor-fase1-cabecalho))] focus:border-transparent disabled:bg-[rgb(var(--cor-superficie-hover))] disabled:cursor-not-allowed text-[rgb(var(--cor-texto-primario))] bg-[rgb(var(--cor-superficie))]"
                    />
                    <span className="text-xs text-[rgb(var(--cor-texto-terciario))]">/ {(pesos?.peso_resumo ?? 1.0).toFixed(1).replace('.', ',')}</span>
                  </div>
                </div>
                <TextareaAutoResize
                  value={comentarioResumo}
                  onChange={(e) => setComentarioResumo(e.target.value)}
                  disabled={!podeEditar || processando}
                  rows={2}
                  placeholder="Justifique a nota atribuída..."
                  className="w-full px-3 py-2 text-sm border border-[rgb(var(--cor-borda))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-fase1-cabecalho))] focus:border-transparent disabled:bg-[rgb(var(--cor-superficie-hover))] disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* 2. Introdução */}
          <div className="bg-[rgb(var(--cor-fundo))] rounded-lg p-4 border border-[rgb(var(--cor-borda))]">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[rgb(var(--cor-fase1-cabecalho))] text-white text-sm font-bold flex items-center justify-center mt-0.5">2</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <p className="text-sm font-semibold text-[rgb(var(--cor-texto-primario))]">{CRITERIOS_FASE1.introducao.titulo} <span className="font-normal text-xs text-[rgb(var(--cor-texto-secundario))] italic">({CRITERIOS_FASE1.introducao.descricao})</span></p>
                  <div className="flex-shrink-0 flex items-center gap-1.5">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={notaIntroducao}
                      onChange={(e) => setNotaIntroducao(clampScore(e.target.value, pesos?.peso_introducao ?? 2.0, notaIntroducao))}
                      disabled={!podeEditar || processando}
                      placeholder="–"
                      className="w-14 h-8 text-center text-sm font-semibold border border-[rgb(var(--cor-borda))] rounded-md focus:ring-2 focus:ring-[rgb(var(--cor-fase1-cabecalho))] focus:border-transparent disabled:bg-[rgb(var(--cor-superficie-hover))] disabled:cursor-not-allowed text-[rgb(var(--cor-texto-primario))] bg-[rgb(var(--cor-superficie))]"
                    />
                    <span className="text-xs text-[rgb(var(--cor-texto-terciario))]">/ {(pesos?.peso_introducao ?? 2.0).toFixed(1).replace('.', ',')}</span>
                  </div>
                </div>
                <TextareaAutoResize
                  value={comentarioIntroducao}
                  onChange={(e) => setComentarioIntroducao(e.target.value)}
                  disabled={!podeEditar || processando}
                  rows={2}
                  placeholder="Justifique a nota atribuída..."
                  className="w-full px-3 py-2 text-sm border border-[rgb(var(--cor-borda))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-fase1-cabecalho))] focus:border-transparent disabled:bg-[rgb(var(--cor-superficie-hover))] disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* 3. Revisão Bibliográfica */}
          <div className="bg-[rgb(var(--cor-fundo))] rounded-lg p-4 border border-[rgb(var(--cor-borda))]">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[rgb(var(--cor-fase1-cabecalho))] text-white text-sm font-bold flex items-center justify-center mt-0.5">3</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <p className="text-sm font-semibold text-[rgb(var(--cor-texto-primario))]">{CRITERIOS_FASE1.revisao.titulo} <span className="font-normal text-xs text-[rgb(var(--cor-texto-secundario))] italic">({CRITERIOS_FASE1.revisao.descricao})</span></p>
                  <div className="flex-shrink-0 flex items-center gap-1.5">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={notaRevisao}
                      onChange={(e) => setNotaRevisao(clampScore(e.target.value, pesos?.peso_revisao ?? 2.0, notaRevisao))}
                      disabled={!podeEditar || processando}
                      placeholder="–"
                      className="w-14 h-8 text-center text-sm font-semibold border border-[rgb(var(--cor-borda))] rounded-md focus:ring-2 focus:ring-[rgb(var(--cor-fase1-cabecalho))] focus:border-transparent disabled:bg-[rgb(var(--cor-superficie-hover))] disabled:cursor-not-allowed text-[rgb(var(--cor-texto-primario))] bg-[rgb(var(--cor-superficie))]"
                    />
                    <span className="text-xs text-[rgb(var(--cor-texto-terciario))]">/ {(pesos?.peso_revisao ?? 2.0).toFixed(1).replace('.', ',')}</span>
                  </div>
                </div>
                <TextareaAutoResize
                  value={comentarioRevisao}
                  onChange={(e) => setComentarioRevisao(e.target.value)}
                  disabled={!podeEditar || processando}
                  rows={2}
                  placeholder="Justifique a nota atribuída..."
                  className="w-full px-3 py-2 text-sm border border-[rgb(var(--cor-borda))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-fase1-cabecalho))] focus:border-transparent disabled:bg-[rgb(var(--cor-superficie-hover))] disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* 4. Desenvolvimento */}
          <div className="bg-[rgb(var(--cor-fundo))] rounded-lg p-4 border border-[rgb(var(--cor-borda))]">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[rgb(var(--cor-fase1-cabecalho))] text-white text-sm font-bold flex items-center justify-center mt-0.5">4</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <p className="text-sm font-semibold text-[rgb(var(--cor-texto-primario))]">{CRITERIOS_FASE1.desenvolvimento.titulo} <span className="font-normal text-xs text-[rgb(var(--cor-texto-secundario))] italic">({CRITERIOS_FASE1.desenvolvimento.descricao})</span></p>
                  <div className="flex-shrink-0 flex items-center gap-1.5">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={notaDesenvolvimento}
                      onChange={(e) => setNotaDesenvolvimento(clampScore(e.target.value, pesos?.peso_desenvolvimento ?? 3.5, notaDesenvolvimento))}
                      disabled={!podeEditar || processando}
                      placeholder="–"
                      className="w-14 h-8 text-center text-sm font-semibold border border-[rgb(var(--cor-borda))] rounded-md focus:ring-2 focus:ring-[rgb(var(--cor-fase1-cabecalho))] focus:border-transparent disabled:bg-[rgb(var(--cor-superficie-hover))] disabled:cursor-not-allowed text-[rgb(var(--cor-texto-primario))] bg-[rgb(var(--cor-superficie))]"
                    />
                    <span className="text-xs text-[rgb(var(--cor-texto-terciario))]">/ {(pesos?.peso_desenvolvimento ?? 3.5).toFixed(1).replace('.', ',')}</span>
                  </div>
                </div>
                <TextareaAutoResize
                  value={comentarioDesenvolvimento}
                  onChange={(e) => setComentarioDesenvolvimento(e.target.value)}
                  disabled={!podeEditar || processando}
                  rows={2}
                  placeholder="Justifique a nota atribuída..."
                  className="w-full px-3 py-2 text-sm border border-[rgb(var(--cor-borda))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-fase1-cabecalho))] focus:border-transparent disabled:bg-[rgb(var(--cor-superficie-hover))] disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* 5. Conclusões */}
          <div className="bg-[rgb(var(--cor-fundo))] rounded-lg p-4 border border-[rgb(var(--cor-borda))]">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[rgb(var(--cor-fase1-cabecalho))] text-white text-sm font-bold flex items-center justify-center mt-0.5">5</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <p className="text-sm font-semibold text-[rgb(var(--cor-texto-primario))]">{CRITERIOS_FASE1.conclusoes.titulo} <span className="font-normal text-xs text-[rgb(var(--cor-texto-secundario))] italic">({CRITERIOS_FASE1.conclusoes.descricao})</span></p>
                  <div className="flex-shrink-0 flex items-center gap-1.5">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={notaConclusoes}
                      onChange={(e) => setNotaConclusoes(clampScore(e.target.value, pesos?.peso_conclusoes ?? 1.5, notaConclusoes))}
                      disabled={!podeEditar || processando}
                      placeholder="–"
                      className="w-14 h-8 text-center text-sm font-semibold border border-[rgb(var(--cor-borda))] rounded-md focus:ring-2 focus:ring-[rgb(var(--cor-fase1-cabecalho))] focus:border-transparent disabled:bg-[rgb(var(--cor-superficie-hover))] disabled:cursor-not-allowed text-[rgb(var(--cor-texto-primario))] bg-[rgb(var(--cor-superficie))]"
                    />
                    <span className="text-xs text-[rgb(var(--cor-texto-terciario))]">/ {(pesos?.peso_conclusoes ?? 1.5).toFixed(1).replace('.', ',')}</span>
                  </div>
                </div>
                <TextareaAutoResize
                  value={comentarioConclusoes}
                  onChange={(e) => setComentarioConclusoes(e.target.value)}
                  disabled={!podeEditar || processando}
                  rows={2}
                  placeholder="Justifique a nota atribuída..."
                  className="w-full px-3 py-2 text-sm border border-[rgb(var(--cor-borda))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-fase1-cabecalho))] focus:border-transparent disabled:bg-[rgb(var(--cor-superficie-hover))] disabled:cursor-not-allowed"
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
            disabled={!podeEditar || processando}
            rows={4}
            placeholder="Comentários gerais sobre o trabalho..."
            className="w-full px-3 py-2 text-sm border border-[rgb(var(--cor-borda))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-fase1-cabecalho))] focus:border-transparent disabled:bg-[rgb(var(--cor-superficie-hover))] disabled:cursor-not-allowed"
          />
        </div>

        {/* Nota Total */}
        {notaTotal !== null && (
          <div className="p-4 bg-[rgb(var(--cor-fase1-cabecalho))]/10 rounded-lg border-2 border-[rgb(var(--cor-fase1-cabecalho))]/30">
            <p className="text-center">
              <span className="text-sm font-medium text-[rgb(var(--cor-texto-primario))]">Nota Final (NF1):</span>
              <span className="ml-3 text-3xl font-bold text-[rgb(var(--cor-fase1-cabecalho))]">
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
                disabled={processando || converterParaNumero(notaResumo) === null ||
                          converterParaNumero(notaIntroducao) === null ||
                          converterParaNumero(notaRevisao) === null ||
                          converterParaNumero(notaDesenvolvimento) === null ||
                          converterParaNumero(notaConclusoes) === null}
                className="px-6 py-3 bg-[rgb(var(--cor-fase1-cabecalho))] text-[rgb(var(--cor-texto-sobre-destaque))] rounded-lg hover:bg-[rgb(var(--cor-fase1-cabecalho))]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
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
