/**
 * Componente para formação da Banca da Fase I
 * Permite ao coordenador selecionar avaliadores via modal
 */

import { useState, useEffect } from 'react';
import { Users, UserPlus, CheckCircle, XCircle, AlertCircle, Loader2, X, Upload } from 'lucide-react';
import type { TCC } from '../../../types';
import { useBancaFase1 } from '../../../hooks';
import { listarProfessores, type ProfessorListItem } from '../../../servicos/usuarios';
import { TipoMembroBanca } from '../../../types/enums';

interface FormacaoBancaFase1Props {
  tcc: TCC;
  onBancaConcluida?: () => void;
}

type TipoDocumentoAvaliacao = 'ORIGINAL' | 'ANONIMO';

export function FormacaoBancaFase1({ tcc, onBancaConcluida }: FormacaoBancaFase1Props) {
  const { banca, carregando, erro, atualizarBanca, concluirFormacao, processando } = useBancaFase1({
    tccId: tcc.id,
    autoCarregar: true
  });

  const [professores, setProfessores] = useState<ProfessorListItem[]>([]);
  const [carregandoProfessores, setCarregandoProfessores] = useState(true);
  const [erroProfessores, setErroProfessores] = useState<string | null>(null);

  const [avaliadoresSelecionados, setAvaliadoresSelecionados] = useState<number[]>([]);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);

  // Estados para documento de avaliação
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumentoAvaliacao>('ANONIMO');
  const [arquivoAnonimo, setArquivoAnonimo] = useState<File | null>(null);
  const [erroArquivo, setErroArquivo] = useState<string | null>(null);

  // Carregar lista de professores
  useEffect(() => {
    const carregarProfessores = async () => {
      try {
        setCarregandoProfessores(true);
        setErroProfessores(null);
        const lista = await listarProfessores();
        setProfessores(lista);
      } catch (err) {
        setErroProfessores('Erro ao carregar lista de professores');
        console.error(err);
      } finally {
        setCarregandoProfessores(false);
      }
    };

    carregarProfessores();
  }, []);

  // Inicializar seleções com membros existentes
  useEffect(() => {
    if (banca && banca.membros) {
      const avaliadores = banca.membros
        .filter(m => m.tipo === TipoMembroBanca.AVALIADOR)
        .map(m => m.usuario);

      setAvaliadoresSelecionados(avaliadores);
    }
  }, [banca]);

  const validarArquivo = (arquivo: File): string | null => {
    // Validar extensão
    const extensoesPermitidas = ['.pdf', '.doc', '.docx'];
    const nomeArquivo = arquivo.name.toLowerCase();
    const extensaoValida = extensoesPermitidas.some(ext => nomeArquivo.endsWith(ext));

    if (!extensaoValida) {
      return 'Apenas arquivos PDF (.pdf) ou Word (.doc, .docx) são permitidos';
    }

    // Validar tamanho (30MB)
    const limiteMB = 30;
    const limiteBytes = limiteMB * 1024 * 1024;

    if (arquivo.size > limiteBytes) {
      return `Arquivo não pode exceder ${limiteMB}MB`;
    }

    return null;
  };

  const handleArquivoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = event.target.files?.[0];
    setErroArquivo(null);

    if (!arquivo) {
      setArquivoAnonimo(null);
      return;
    }

    const erro = validarArquivo(arquivo);
    if (erro) {
      setErroArquivo(erro);
      setArquivoAnonimo(null);
      event.target.value = '';
      return;
    }

    setArquivoAnonimo(arquivo);
  };

  const handleFormarBanca = async () => {
    try {
      setMensagemSucesso(null);
      setMensagemErro(null);
      setErroArquivo(null);

      // Validar avaliadores
      if (avaliadoresSelecionados.length < 2) {
        setMensagemErro('Selecione pelo menos 2 avaliadores');
        return;
      }

      // Validar arquivo se tipo ANONIMO
      if (tipoDocumento === 'ANONIMO' && !arquivoAnonimo) {
        setErroArquivo('Selecione um arquivo para a versão anônima');
        return;
      }

      // Primeiro atualiza a composição
      await atualizarBanca({
        avaliadores: avaliadoresSelecionados
      });

      // Conclui a formação (com ou sem arquivo)
      await concluirFormacao(arquivoAnonimo || undefined);
      setMensagemSucesso('Banca formada com sucesso! As avaliações foram criadas.');

      setModalAberto(false);

      if (onBancaConcluida) {
        onBancaConcluida();
      }
    } catch (err: any) {
      console.error('Erro ao formar banca:', err);
      setMensagemErro(err?.response?.data?.detail || 'Erro ao formar banca');
      setModalAberto(false);
    }
  };

  const adicionarAvaliador = (profId: number) => {
    if (!avaliadoresSelecionados.includes(profId)) {
      setAvaliadoresSelecionados(prev => [...prev, profId]);
    }
  };

  const removerAvaliador = (profId: number) => {
    setAvaliadoresSelecionados(prev => prev.filter(id => id !== profId));
  };


  // Filtrar professores disponíveis (excluir orientador)
  const professoresDisponiveis = professores.filter(p => p.id !== tcc.orientador);

  const bancaConcluida = banca?.status === 'COMPLETA';

  if (carregando || carregandoProfessores) {
    return (
      <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-sm border border-[rgb(var(--cor-borda))] p-6 mb-6">
        <div className="flex items-center justify-center gap-2 text-[rgb(var(--cor-texto-secundario))]">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Carregando dados da banca...</span>
        </div>
      </div>
    );
  }

  if (erro || erroProfessores) {
    return (
      <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-sm border border-[rgb(var(--cor-borda))] p-6 mb-6">
        <div className="flex items-center gap-2 text-[rgb(var(--cor-erro))]">
          <XCircle className="h-5 w-5" />
          <span>{erro || erroProfessores}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-sm border border-[rgb(var(--cor-borda))] p-6 mb-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-[rgb(var(--cor-destaque))]" />
          <h3 className="font-semibold text-[rgb(var(--cor-texto-primario))]">Formação da Banca - Fase I</h3>
          {bancaConcluida && (
            <span className="ml-auto px-3 py-1 rounded-full text-sm font-medium bg-[rgb(var(--cor-sucesso))]/10 text-[rgb(var(--cor-sucesso))] flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              Concluída
            </span>
          )}
        </div>

        {/* Mensagens de status */}
        {mensagemSucesso && (
          <div className="mb-4 p-3 bg-[rgb(var(--cor-sucesso))]/10 border border-[rgb(var(--cor-sucesso))]/20 rounded-lg flex items-center gap-2 text-[rgb(var(--cor-sucesso))]">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm">{mensagemSucesso}</span>
          </div>
        )}

        {mensagemErro && (
          <div className="mb-4 p-3 bg-[rgb(var(--cor-erro))]/10 border border-[rgb(var(--cor-erro))]/20 rounded-lg flex items-center gap-2 text-[rgb(var(--cor-erro))]">
            <XCircle className="h-5 w-5" />
            <span className="text-sm">{mensagemErro}</span>
          </div>
        )}

        {bancaConcluida && (
          <div className="mb-4 p-3 bg-[rgb(var(--cor-destaque))]/10 border border-[rgb(var(--cor-destaque))]/20 rounded-lg flex items-center gap-2 text-[rgb(var(--cor-destaque))]">
            <AlertCircle className="h-5 w-5" />
            <div className="text-sm">
              <p className="font-medium">Banca formada com sucesso</p>
              {banca?.data_formacao && (
                <p className="text-xs mt-1">
                  Formada em {new Date(banca.data_formacao).toLocaleString('pt-BR')}
                  {banca.formada_por_dados && ` por ${banca.formada_por_dados.nome_completo}`}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Botão para abrir modal */}
        {!bancaConcluida && (
          <div>
            <button
              onClick={() => setModalAberto(true)}
              className="w-full px-4 py-3 bg-[rgb(var(--cor-destaque))] text-white rounded-lg hover:bg-[rgb(var(--cor-destaque))]/90 transition-colors flex items-center justify-center gap-2"
            >
              <UserPlus className="h-5 w-5" />
              <span className="font-medium">Formar banca</span>
            </button>
          </div>
        )}

        {/* Membros atuais (quando banca está concluída) */}
        {bancaConcluida && banca && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-[rgb(var(--cor-texto-secundario))] mb-2">Membros da banca</h4>
            <div className="space-y-2">
              {banca.membros.map(membro => (
                <div key={membro.id} className="p-3 bg-[rgb(var(--cor-fundo))] border border-[rgb(var(--cor-borda))] rounded-lg flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[rgb(var(--cor-texto-primario))]">{membro.usuario_dados.nome_completo}</p>
                    <p className="text-xs text-[rgb(var(--cor-texto-secundario))]">{membro.usuario_dados.email}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    membro.tipo === TipoMembroBanca.ORIENTADOR
                      ? 'bg-[rgb(var(--cor-destaque))]/10 text-[rgb(var(--cor-destaque))]'
                      : 'bg-[rgb(var(--cor-info))]/10 text-[rgb(var(--cor-info))]'
                  }`}>
                    {membro.tipo === TipoMembroBanca.ORIENTADOR ? 'Orientador' : 'Avaliador'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal único de formação de banca */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header do modal */}
            <div className="flex items-center justify-between p-6 border-b border-[rgb(var(--cor-borda))]">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[rgb(var(--cor-destaque))]" />
                <h3 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))]">Formar Banca - Fase I</h3>
              </div>
              <button
                onClick={() => setModalAberto(false)}
                className="p-1 hover:bg-[rgb(var(--cor-fundo))] rounded-lg transition-colors"
                disabled={processando}
              >
                <X className="h-5 w-5 text-[rgb(var(--cor-icone))]" />
              </button>
            </div>

            {/* Conteúdo do modal */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* LINHA 1 - Avaliadores lado a lado */}
              <div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Avaliador 1 */}
                  <div>
                    <label className="block text-xs font-medium text-[rgb(var(--cor-texto-secundario))] mb-1">
                      Avaliador 1
                    </label>
                    <select
                      value={avaliadoresSelecionados[0] || ''}
                      onChange={(e) => {
                        const profId = Number(e.target.value);
                        setAvaliadoresSelecionados(prev => {
                          const newList = [...prev];
                          if (profId) {
                            newList[0] = profId;
                          } else {
                            newList.splice(0, 1);
                          }
                          return newList.filter(Boolean);
                        });
                      }}
                      className="w-full px-3 py-2 border border-[rgb(var(--cor-borda))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))]"
                    >
                      <option value="">Selecione o primeiro avaliador</option>
                      {professoresDisponiveis
                        .filter(p => p.id !== avaliadoresSelecionados[1])
                        .map(prof => (
                          <option key={prof.id} value={prof.id}>
                            {prof.nome_completo}
                            {prof.departamento && ` - ${prof.departamento}`}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Avaliador 2 */}
                  <div>
                    <label className="block text-xs font-medium text-[rgb(var(--cor-texto-secundario))] mb-1">
                      Avaliador 2
                    </label>
                    <select
                      value={avaliadoresSelecionados[1] || ''}
                      onChange={(e) => {
                        const profId = Number(e.target.value);
                        setAvaliadoresSelecionados(prev => {
                          const newList = [...prev];
                          if (profId) {
                            newList[1] = profId;
                          } else if (newList.length > 1) {
                            newList.splice(1, 1);
                          }
                          return newList.filter(Boolean);
                        });
                      }}
                      className="w-full px-3 py-2 border border-[rgb(var(--cor-borda))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))]"
                    >
                      <option value="">Selecione o segundo avaliador</option>
                      {professoresDisponiveis
                        .filter(p => p.id !== avaliadoresSelecionados[0])
                        .map(prof => (
                          <option key={prof.id} value={prof.id}>
                            {prof.nome_completo}
                            {prof.departamento && ` - ${prof.departamento}`}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* LINHA 2 - Documento (largura total) */}
              <div>
                <h4 className="text-sm font-semibold text-[rgb(var(--cor-texto-primario))] uppercase tracking-wide mb-4">Documento para Avaliação</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                  {/* Opção 1: Enviar versão anônima (com upload dentro do card) */}
                  <div className={`p-4 border-2 rounded-lg transition-all min-h-[200px] ${tipoDocumento === 'ANONIMO' ? 'border-[rgb(var(--cor-destaque))] bg-[rgb(var(--cor-destaque))]/5' : 'border-[rgb(var(--cor-borda))]'}`}>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="tipoDocumento"
                        value="ANONIMO"
                        checked={tipoDocumento === 'ANONIMO'}
                        onChange={(e) => setTipoDocumento(e.target.value as TipoDocumentoAvaliacao)}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[rgb(var(--cor-texto-primario))]">Enviar versão anônima (recomendado)</p>
                        <p className="text-xs text-[rgb(var(--cor-texto-secundario))] mt-1">
                          Avaliação duplo-cega: envie uma versão sem identificação do aluno
                        </p>
                      </div>
                    </label>

                    {/* Upload dentro do card */}
                    {tipoDocumento === 'ANONIMO' && (
                      <div className="mt-4 pt-4 border-t border-[rgb(var(--cor-borda))]">
                        <label className="block">
                          <div className="flex items-center gap-2 mb-2">
                            <Upload className="h-4 w-4 text-[rgb(var(--cor-icone))]" />
                            <span className="text-sm font-medium text-[rgb(var(--cor-texto-secundario))]">
                              Arquivo anônimo (PDF ou Word)
                            </span>
                          </div>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleArquivoChange}
                            className="block w-full text-sm text-[rgb(var(--cor-texto-secundario))] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-[rgb(var(--cor-borda))] file:text-sm file:font-medium file:bg-[rgb(var(--cor-fundo))] hover:file:bg-[rgb(var(--cor-fundo))]/70 file:text-[rgb(var(--cor-texto-secundario))] cursor-pointer"
                          />
                          <p className="mt-1 text-xs text-[rgb(var(--cor-texto-secundario))]">
                            Formatos aceitos: PDF, Word (.doc, .docx) • Máx: 30MB
                          </p>
                          {arquivoAnonimo && (
                            <p
                              className="mt-2 text-xs text-[rgb(var(--cor-sucesso))] flex items-center gap-1 max-w-full"
                              title={arquivoAnonimo.name}
                            >
                              <CheckCircle className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{arquivoAnonimo.name}</span>
                            </p>
                          )}
                          {erroArquivo && (
                            <p className="mt-2 text-xs text-[rgb(var(--cor-erro))] flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {erroArquivo}
                            </p>
                          )}
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Opção 2: Usar monografia original */}
                  <label className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-[rgb(var(--cor-fundo))]/50 ${tipoDocumento === 'ORIGINAL' ? 'border-[rgb(var(--cor-destaque))] bg-[rgb(var(--cor-destaque))]/5' : 'border-[rgb(var(--cor-borda))]'}`}>
                    <input
                      type="radio"
                      name="tipoDocumento"
                      value="ORIGINAL"
                      checked={tipoDocumento === 'ORIGINAL'}
                      onChange={(e) => {
                        setTipoDocumento(e.target.value as TipoDocumentoAvaliacao);
                        setArquivoAnonimo(null);
                        setErroArquivo(null);
                      }}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[rgb(var(--cor-texto-primario))]">Usar monografia original do aluno</p>
                      <p className="text-xs text-[rgb(var(--cor-texto-secundario))] mt-1">
                        Os avaliadores terão acesso à monografia enviada pelo aluno
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer do modal */}
            <div className="flex gap-3 p-6 border-t border-[rgb(var(--cor-borda))]">
              <button
                onClick={() => setModalAberto(false)}
                disabled={processando}
                className="flex-1 px-4 py-2 bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-secundario))] rounded-lg hover:bg-[rgb(var(--cor-fundo))]/70 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleFormarBanca}
                disabled={avaliadoresSelecionados.length < 2 || processando}
                className="flex-1 px-4 py-2 bg-[rgb(var(--cor-destaque))] text-white rounded-lg hover:bg-[rgb(var(--cor-destaque))]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
              >
                {processando ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Formando banca...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Formar Banca</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
