/**
 * Página de listagem de participações em bancas
 * Remove todas as informações identificadoras (aluno, orientador, título)
 * para garantir imparcialidade na avaliação
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  AlertCircle,
  Loader2,
  Download,
  Clock,
  Eye
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

  const handleAvaliar = (tccId: number) => {
    // Usar prefixo correto baseado no tipo de usuário
    const prefixo = usuario?.tipo_usuario === 'AVALIADOR' ? '/avaliador' : '/professor';
    navigate(`${prefixo}/bancas/${tccId}`);
  };

  // Obter status badge para cada TCC
  const obterStatusBadge = (tcc: TCC) => {
    if (tcc.avaliacao_fase1_bloqueada) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-secundario))] flex items-center gap-1">
          <Lock className="h-3 w-3" />
          Bloqueada
        </span>
      );
    }
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-[rgb(var(--cor-alerta))]/10 text-[rgb(var(--cor-alerta))] flex items-center gap-1">
        <Clock className="h-3 w-3" />
        Pendente
      </span>
    );
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
              onClick={() => handleAvaliar(tcc.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleAvaliar(tcc.id)}
              className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-sm border border-[rgb(var(--cor-borda))] p-6 cursor-pointer hover:shadow-md hover:border-[rgb(var(--cor-destaque))]/50 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:ring-offset-2 transition-all"
            >
              {/* Header do card */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-[rgb(var(--cor-texto-primario))] text-xl">
                      Trabalho #{tcc.id}
                    </h3>
                    {obterStatusBadge(tcc)}
                  </div>
                  <p className="text-sm text-[rgb(var(--cor-texto-secundario))] mb-3">
                    Semestre: {tcc.semestre}
                  </p>

                  {/* Bloqueio */}
                  {tcc.avaliacao_fase1_bloqueada && (
                    <div className="mb-3 p-2 bg-[rgb(var(--cor-alerta))]/5 border border-[rgb(var(--cor-alerta))]/20 rounded-lg inline-flex items-center gap-2 text-sm text-[rgb(var(--cor-alerta))]">
                      <Lock className="h-4 w-4" />
                      <span>Bloqueado para análise do coordenador</span>
                    </div>
                  )}

                  {/* Documento anônimo */}
                  <div className="mt-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBaixarDocumento(tcc);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[rgb(var(--cor-destaque))] text-white text-sm rounded-lg hover:bg-[rgb(var(--cor-destaque))]/90 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      <span>Baixar Documento Anônimo</span>
                    </button>
                  </div>
                </div>

                {/* Indicador visual de ação */}
                <div className="ml-4 flex items-center gap-2 text-[rgb(var(--cor-info))]">
                  <Eye className="h-5 w-5" />
                  <span className="text-sm font-medium">Avaliar</span>
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
