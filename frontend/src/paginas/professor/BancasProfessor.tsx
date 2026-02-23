/**
 * Página de listagem de participações em bancas
 * Exibe título do TCC, botão de download e botões de fase (I e II)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  AlertCircle,
  Loader2,
  Download,
  FileText,
  Presentation,
  CheckCircle
} from 'lucide-react';
import { useTCCsParaAvaliar } from '../../hooks/useTCCsParaAvaliar';
import { useAutenticacao } from '../../autenticacao';
import api from '../../servicos/api';
import type { TCC, DocumentoTCC } from '../../types';
import { Modal } from '../../componentes/Modal';

export function BancasProfessor() {
  const navigate = useNavigate();
  const { usuario } = useAutenticacao();
  const [modalErro, setModalErro] = useState<{ aberto: boolean; mensagem: string }>({ aberto: false, mensagem: '' });

  // Carregar TCCs onde sou avaliador
  const { tccs, carregando: carregandoTCCs } = useTCCsParaAvaliar();

  const handleBaixarDocumento = async (tcc: TCC) => {
    try {
      const resposta = await api.get<DocumentoTCC[]>(`/tccs/${tcc.id}/documentos/`);
      if (resposta.data.length > 0 && resposta.data[0].arquivo) {
        window.open(resposta.data[0].arquivo, '_blank');
      }
    } catch (err) {
      console.error('Erro ao carregar documento:', err);
      setModalErro({ aberto: true, mensagem: 'Erro ao baixar documento' });
    }
  };

  const handleAvaliar = (tccId: number, fase: 1 | 2) => {
    const prefixo = usuario?.tipo_usuario === 'AVALIADOR' ? '/avaliador' : '/professor';
    navigate(`${prefixo}/bancas/${tccId}?fase=${fase}`);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))] mb-2">Participações em bancas</h1>
        <p className="text-[rgb(var(--cor-texto-secundario))]">
          TCCs para avaliação anônima – Fase I (Monografia) e Fase II (Apresentação)
        </p>
      </div>

      {/* Lista de TCCs */}
      {carregandoTCCs ? (
        <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-sm border border-[rgb(var(--cor-borda))] p-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[rgb(var(--cor-icone))] mr-2" />
          <span className="text-[rgb(var(--cor-texto-secundario))]">Carregando trabalhos...</span>
        </div>
      ) : tccs.length === 0 ? (
        <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-sm border border-[rgb(var(--cor-borda))] p-8">
          <div className="flex items-center gap-3 text-[rgb(var(--cor-texto-secundario))]">
            <AlertCircle className="h-6 w-6" />
            <div>
              <p className="font-medium">Nenhum trabalho para avaliar</p>
              <p className="text-sm">Você não foi designado como avaliador em nenhuma banca no momento.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {tccs.map((tcc) => (
            <div
              key={tcc.id}
              className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-sm border border-[rgb(var(--cor-borda))] p-6"
            >
              {/* Título + Baixar documento */}
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <h3 className="font-bold text-[rgb(var(--cor-texto-primario))] text-lg">
                  {tcc.titulo}
                </h3>
                <button
                  onClick={() => handleBaixarDocumento(tcc)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[rgb(var(--cor-destaque))] text-white text-sm rounded-lg hover:bg-[rgb(var(--cor-destaque))]/90 transition-colors shrink-0"
                >
                  <Download className="h-4 w-4" />
                  <span>Baixar Monografia</span>
                </button>
              </div>

              {/* Botões de fase */}
              <div className="grid grid-cols-2 gap-3">
                {/* Fase I */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleAvaliar(tcc.id, 1)}
                    className={`flex items-center justify-center gap-2 px-4 py-8 border-2 rounded-lg transition-colors font-medium ${
                      tcc.nf1 != null || tcc.minha_avaliacao_fase1_status === 'ENVIADO' || tcc.minha_avaliacao_fase1_status === 'BLOQUEADO' || tcc.minha_avaliacao_fase1_status === 'CONCLUIDO'
                        ? 'border-[rgb(var(--cor-sucesso))] bg-[rgb(var(--cor-sucesso))]/10 text-[rgb(var(--cor-sucesso))]'
                        : 'border-[rgb(var(--cor-info))] text-[rgb(var(--cor-info))] hover:bg-[rgb(var(--cor-info))]/10'
                    }`}
                  >
                    <FileText className="h-5 w-5" />
                    <span>Fase I – Monografia</span>
                    {(tcc.nf1 != null || tcc.minha_avaliacao_fase1_status === 'ENVIADO' || tcc.minha_avaliacao_fase1_status === 'BLOQUEADO' || tcc.minha_avaliacao_fase1_status === 'CONCLUIDO') && <CheckCircle className="h-5 w-5" />}
                  </button>
                  {tcc.nf1 != null ? (
                    <div className="p-1.5 bg-[rgb(var(--cor-sucesso))]/5 border border-[rgb(var(--cor-sucesso))]/20 rounded-lg flex items-center justify-center gap-1.5 text-xs text-[rgb(var(--cor-sucesso))]">
                      <CheckCircle className="h-3 w-3" />
                      <span>Avaliação aprovada.</span>
                    </div>
                  ) : tcc.avaliacao_fase1_bloqueada ? (
                    <div className="p-1.5 bg-[rgb(var(--cor-alerta))]/5 border border-[rgb(var(--cor-alerta))]/20 rounded-lg flex items-center justify-center gap-1.5 text-xs text-[rgb(var(--cor-alerta))]">
                      <Lock className="h-3 w-3" />
                      <span>Bloqueado para análise do coordenador</span>
                    </div>
                  ) : (tcc.minha_avaliacao_fase1_status === 'ENVIADO' || tcc.minha_avaliacao_fase1_status === 'BLOQUEADO' || tcc.minha_avaliacao_fase1_status === 'CONCLUIDO') ? (
                    <div className="p-1.5 bg-[rgb(var(--cor-destaque))]/5 border border-[rgb(var(--cor-destaque))]/20 rounded-lg flex items-center justify-center gap-1.5 text-xs text-[rgb(var(--cor-destaque))]">
                      <CheckCircle className="h-3 w-3" />
                      <span>Avaliação enviada.</span>
                    </div>
                  ) : null}
                </div>

                {/* Fase II */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleAvaliar(tcc.id, 2)}
                    className={`flex items-center justify-center gap-2 px-4 py-8 border-2 rounded-lg transition-colors font-medium ${
                      tcc.etapa_atual === 'CONCLUIDO' || tcc.minha_avaliacao_fase2_status === 'ENVIADO' || tcc.minha_avaliacao_fase2_status === 'BLOQUEADO' || tcc.minha_avaliacao_fase2_status === 'CONCLUIDO'
                        ? 'border-[rgb(var(--cor-sucesso))] bg-[rgb(var(--cor-sucesso))]/10 text-[rgb(var(--cor-sucesso))]'
                        : 'border-[rgb(var(--cor-info))] text-[rgb(var(--cor-info))] hover:bg-[rgb(var(--cor-info))]/10'
                    }`}
                  >
                    <Presentation className="h-5 w-5" />
                    <span>Fase II – Apresentação</span>
                    {(tcc.etapa_atual === 'CONCLUIDO' || tcc.minha_avaliacao_fase2_status === 'ENVIADO' || tcc.minha_avaliacao_fase2_status === 'BLOQUEADO' || tcc.minha_avaliacao_fase2_status === 'CONCLUIDO') && <CheckCircle className="h-5 w-5" />}
                  </button>
                  {tcc.etapa_atual === 'CONCLUIDO' ? (
                    <div className="p-1.5 bg-[rgb(var(--cor-sucesso))]/5 border border-[rgb(var(--cor-sucesso))]/20 rounded-lg flex items-center justify-center gap-1.5 text-xs text-[rgb(var(--cor-sucesso))]">
                      <CheckCircle className="h-3 w-3" />
                      <span>Avaliação aprovada.</span>
                    </div>
                  ) : tcc.avaliacao_fase2_bloqueada ? (
                    <div className="p-1.5 bg-[rgb(var(--cor-alerta))]/5 border border-[rgb(var(--cor-alerta))]/20 rounded-lg flex items-center justify-center gap-1.5 text-xs text-[rgb(var(--cor-alerta))]">
                      <Lock className="h-3 w-3" />
                      <span>Bloqueado para análise do coordenador</span>
                    </div>
                  ) : (tcc.minha_avaliacao_fase2_status === 'ENVIADO' || tcc.minha_avaliacao_fase2_status === 'BLOQUEADO' || tcc.minha_avaliacao_fase2_status === 'CONCLUIDO') ? (
                    <div className="p-1.5 bg-[rgb(var(--cor-destaque))]/5 border border-[rgb(var(--cor-destaque))]/20 rounded-lg flex items-center justify-center gap-1.5 text-xs text-[rgb(var(--cor-destaque))]">
                      <CheckCircle className="h-3 w-3" />
                      <span>Avaliação enviada.</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de erro */}
      <Modal
        aberto={modalErro.aberto}
        aoFechar={() => setModalErro({ aberto: false, mensagem: '' })}
        titulo="Erro"
        mensagem={modalErro.mensagem}
        tipo="erro"
      />
    </div>
  );
}
