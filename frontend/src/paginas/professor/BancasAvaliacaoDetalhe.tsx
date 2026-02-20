/**
 * Página de detalhe da participação em banca
 * Exibe formulário da Fase selecionada via query param (?fase=1 ou ?fase=2)
 */

import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileText,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Presentation
} from 'lucide-react';
import { useAvaliacoesFase1, useAvaliacoesFase2 } from '../../hooks';
import { useTCCsParaAvaliar } from '../../hooks/useTCCsParaAvaliar';
import { StatusAvaliacaoFase1, StatusAvaliacaoFase2 } from '../../types/enums';
import type { EnviarAvaliacaoFase1DTO, EnviarAvaliacaoFase2DTO } from '../../types';
import { FormularioAvaliacaoFase1 } from '../../componentes/FormularioAvaliacaoFase1';
import { FormularioAvaliacaoFase2 } from '../../componentes/FormularioAvaliacaoFase2';

export function BancasAvaliacaoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tccId = parseInt(id || '0');

  const faseParam = searchParams.get('fase');
  const fase = faseParam === '2' ? 'fase2' : 'fase1';

  const { tccs: tccsParaAvaliar } = useTCCsParaAvaliar();
  const tccAtual = tccsParaAvaliar.find(t => t.id === tccId);
  const [mensagemSucessoFase1, setMensagemSucessoFase1] = useState<string | null>(null);
  const [mensagemSucessoFase2, setMensagemSucessoFase2] = useState<string | null>(null);

  // Hooks para Fase I (carrega apenas se fase selecionada)
  const {
    avaliacoes: avaliacoesFase1,
    carregando: carregandoFase1,
    erro: erroFase1,
    enviar: enviarFase1,
    processando: processandoFase1,
    recarregar: recarregarFase1
  } = useAvaliacoesFase1({
    tccId: tccId,
    autoCarregar: fase === 'fase1'
  });

  // Hooks para Fase II (carrega apenas se fase selecionada)
  const {
    avaliacoes: avaliacoesFase2,
    carregando: carregandoFase2,
    erro: erroFase2,
    enviar: enviarFase2,
    processando: processandoFase2,
    recarregar: recarregarFase2
  } = useAvaliacoesFase2({
    tccId: tccId,
    autoCarregar: fase === 'fase2'
  });

  const minhaAvaliacaoFase1 = avaliacoesFase1.length > 0 ? avaliacoesFase1[0] : null;
  const minhaAvaliacaoFase2 = avaliacoesFase2.length > 0 ? avaliacoesFase2[0] : null;

  const handleVoltar = () => {
    navigate(-1);
  };

  // Handlers para Fase I
  const handleSalvarRascunhoFase1 = async (dados: EnviarAvaliacaoFase1DTO) => {
    try {
      setMensagemSucessoFase1(null);
      await enviarFase1(dados);
      setMensagemSucessoFase1('Rascunho salvo com sucesso!');
      await recarregarFase1();
    } catch (err) {
      console.error('Erro ao salvar rascunho Fase I:', err);
    }
  };

  const handleEnviarAvaliacaoFase1 = async (dados: EnviarAvaliacaoFase1DTO) => {
    try {
      setMensagemSucessoFase1(null);
      await enviarFase1(dados);
      setMensagemSucessoFase1('Avaliação enviada com sucesso!');
      await recarregarFase1();
    } catch (err) {
      console.error('Erro ao enviar avaliação Fase I:', err);
    }
  };

  const handleCancelarEnvioFase1 = async () => {
    if (!minhaAvaliacaoFase1) return;

    try {
      setMensagemSucessoFase1(null);
      await enviarFase1({
        nota_resumo: minhaAvaliacaoFase1.nota_resumo ?? undefined,
        nota_introducao: minhaAvaliacaoFase1.nota_introducao ?? undefined,
        nota_revisao: minhaAvaliacaoFase1.nota_revisao ?? undefined,
        nota_desenvolvimento: minhaAvaliacaoFase1.nota_desenvolvimento ?? undefined,
        nota_conclusoes: minhaAvaliacaoFase1.nota_conclusoes ?? undefined,
        parecer: minhaAvaliacaoFase1.parecer || undefined,
        status: StatusAvaliacaoFase1.PENDENTE
      });
      setMensagemSucessoFase1('Avaliação reaberta para edição.');
      await recarregarFase1();
    } catch (err) {
      console.error('Erro ao cancelar envio Fase I:', err);
    }
  };

  // Handlers para Fase II
  const handleSalvarRascunhoFase2 = async (dados: EnviarAvaliacaoFase2DTO) => {
    try {
      setMensagemSucessoFase2(null);
      await enviarFase2(dados);
      setMensagemSucessoFase2('Rascunho salvo com sucesso!');
      await recarregarFase2();
    } catch (err) {
      console.error('Erro ao salvar rascunho Fase II:', err);
    }
  };

  const handleEnviarAvaliacaoFase2 = async (dados: EnviarAvaliacaoFase2DTO) => {
    try {
      setMensagemSucessoFase2(null);
      await enviarFase2(dados);
      setMensagemSucessoFase2('Avaliação enviada com sucesso!');
      await recarregarFase2();
    } catch (err) {
      console.error('Erro ao enviar avaliação Fase II:', err);
    }
  };

  const handleCancelarEnvioFase2 = async () => {
    if (!minhaAvaliacaoFase2) return;

    try {
      setMensagemSucessoFase2(null);
      await enviarFase2({
        nota_coerencia_conteudo: minhaAvaliacaoFase2.nota_coerencia_conteudo ?? undefined,
        nota_qualidade_apresentacao: minhaAvaliacaoFase2.nota_qualidade_apresentacao ?? undefined,
        nota_dominio_tema: minhaAvaliacaoFase2.nota_dominio_tema ?? undefined,
        nota_clareza_fluencia: minhaAvaliacaoFase2.nota_clareza_fluencia ?? undefined,
        nota_observancia_tempo: minhaAvaliacaoFase2.nota_observancia_tempo ?? undefined,
        parecer: minhaAvaliacaoFase2.parecer || undefined,
        status: StatusAvaliacaoFase2.PENDENTE
      });
      setMensagemSucessoFase2('Avaliação reaberta para edição.');
      await recarregarFase2();
    } catch (err) {
      console.error('Erro ao cancelar envio Fase II:', err);
    }
  };

  const carregando = fase === 'fase1' ? carregandoFase1 : carregandoFase2;
  const erro = fase === 'fase1' ? erroFase1 : erroFase2;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Botão Voltar */}
      <button
        onClick={handleVoltar}
        className="flex items-center gap-2 text-[rgb(var(--cor-texto-secundario))] hover:text-[rgb(var(--cor-texto-primario))] mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Voltar para lista</span>
      </button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          {fase === 'fase1' ? (
            <FileText className="h-8 w-8 text-[rgb(var(--cor-info))]" />
          ) : (
            <Presentation className="h-8 w-8 text-[rgb(var(--cor-info))]" />
          )}
          <div>
            <h1 className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))]">
              {tccAtual?.titulo || `Trabalho #${tccId}`} – {fase === 'fase1' ? 'Fase I' : 'Fase II'}
            </h1>
            <p className="text-sm text-[rgb(var(--cor-texto-secundario))]">
              {fase === 'fase1' ? 'Avaliação da Monografia' : 'Avaliação da Apresentação'}
            </p>
          </div>
        </div>
      </div>

      {carregando ? (
        <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-sm border border-[rgb(var(--cor-borda))] p-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[rgb(var(--cor-icone))] mr-2" />
          <span className="text-[rgb(var(--cor-texto-secundario))]">Carregando avaliação...</span>
        </div>
      ) : erro ? (
        <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-sm border border-[rgb(var(--cor-borda))] p-6">
          <div className="flex items-center gap-2 text-[rgb(var(--cor-erro))]">
            <AlertCircle className="h-5 w-5" />
            <span>{erro}</span>
          </div>
        </div>
      ) : (
        <div>
          {fase === 'fase1' && (
            <FormularioAvaliacaoFase1
              minhaAvaliacao={minhaAvaliacaoFase1}
              processando={processandoFase1}
              mensagemSucesso={mensagemSucessoFase1}
              onSalvarRascunho={handleSalvarRascunhoFase1}
              onEnviarAvaliacao={handleEnviarAvaliacaoFase1}
              onCancelarEnvio={handleCancelarEnvioFase1}
            />
          )}

          {fase === 'fase2' && (
            <FormularioAvaliacaoFase2
              minhaAvaliacao={minhaAvaliacaoFase2}
              processando={processandoFase2}
              mensagemSucesso={mensagemSucessoFase2}
              onSalvarRascunho={handleSalvarRascunhoFase2}
              onEnviarAvaliacao={handleEnviarAvaliacaoFase2}
              onCancelarEnvio={handleCancelarEnvioFase2}
            />
          )}
        </div>
      )}
    </div>
  );
}
