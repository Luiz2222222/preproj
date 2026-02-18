import { useState, useMemo } from 'react';
import {
  Building2,
  Search,
  Edit2,
  Key,
  AlertCircle,
  Loader2,
  CheckCircle,
  FileCheck,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { MiniTimelineTCC } from '../../componentes/MiniTimelineTCC';
import { useExternosEstatisticas, type ExternoEstatisticas } from '../../hooks/useExternosEstatisticas';
import { editarUsuario, resetarSenhaUsuario } from '../../servicos/usuarios';

const TRATAMENTOS = ['Prof. Dr.', 'Prof. Ms.', 'Prof.', 'Dr.', 'Eng.', 'Outro'];
const AFILIACOES = ['Universidade Federal de Pernambuco', 'UFRPE', 'IFPE', 'Outro'];

export function ExternosPage() {
  const {
    externos,
    carregando: carregandoExternos,
    erro: erroExternos,
    recarregar
  } = useExternosEstatisticas();

  const [busca, setBusca] = useState('');

  // Modal de edição
  const [editandoExterno, setEditandoExterno] = useState<ExternoEstatisticas | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editTratamento, setEditTratamento] = useState('');
  const [editTratamentoCustom, setEditTratamentoCustom] = useState('');
  const [editAfiliacao, setEditAfiliacao] = useState('');
  const [editAfiliacaoCustom, setEditAfiliacaoCustom] = useState('');
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [erroEdicao, setErroEdicao] = useState('');
  const [sucessoEdicao, setSucessoEdicao] = useState('');

  // Modal de reset de senha
  const [resetandoExterno, setResetandoExterno] = useState<ExternoEstatisticas | null>(null);
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [salvandoReset, setSalvandoReset] = useState(false);
  const [erroReset, setErroReset] = useState('');
  const [sucessoReset, setSucessoReset] = useState('');

  const abrirModalEdicao = (ext: ExternoEstatisticas) => {
    setEditandoExterno(ext);
    setEditNome(ext.nome_completo);
    setEditEmail(ext.email);
    setEditTratamento(ext.tratamento || '');
    setEditTratamentoCustom(ext.tratamento_customizado || '');
    setEditAfiliacao(ext.afiliacao || '');
    setEditAfiliacaoCustom(ext.afiliacao_customizada || '');
    setErroEdicao('');
    setSucessoEdicao('');
  };

  const fecharModalEdicao = () => {
    setEditandoExterno(null);
    setErroEdicao('');
    setSucessoEdicao('');
  };

  const salvarEdicao = async () => {
    if (!editandoExterno) return;
    if (!editNome.trim() || !editEmail.trim() || !editAfiliacao) {
      setErroEdicao('Preencha todos os campos obrigatórios.');
      return;
    }
    if (editTratamento === 'Outro' && !editTratamentoCustom.trim()) {
      setErroEdicao('Preencha o tratamento customizado.');
      return;
    }
    if (editAfiliacao === 'Outro' && !editAfiliacaoCustom.trim()) {
      setErroEdicao('Preencha a afiliação customizada.');
      return;
    }

    setSalvandoEdicao(true);
    setErroEdicao('');
    setSucessoEdicao('');
    try {
      await editarUsuario(editandoExterno.id, {
        nome_completo: editNome.trim(),
        email: editEmail.trim(),
        tratamento: editTratamento || undefined,
        tratamento_customizado: editTratamento === 'Outro' ? editTratamentoCustom.trim() : '',
        afiliacao: editAfiliacao || undefined,
        afiliacao_customizada: editAfiliacao === 'Outro' ? editAfiliacaoCustom.trim() : '',
      });
      setSucessoEdicao('Dados atualizados com sucesso!');
      await recarregar();
      setTimeout(() => fecharModalEdicao(), 1200);
    } catch (err: any) {
      setErroEdicao(err.message || 'Erro ao salvar alterações.');
    } finally {
      setSalvandoEdicao(false);
    }
  };

  const abrirModalReset = (ext: ExternoEstatisticas) => {
    setResetandoExterno(ext);
    setNovaSenha('');
    setConfirmarSenha('');
    setMostrarSenha(false);
    setErroReset('');
    setSucessoReset('');
  };

  const fecharModalReset = () => {
    setResetandoExterno(null);
    setErroReset('');
    setSucessoReset('');
  };

  const salvarReset = async () => {
    if (!resetandoExterno) return;
    if (!novaSenha || novaSenha.length < 6) {
      setErroReset('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setErroReset('As senhas não coincidem.');
      return;
    }

    setSalvandoReset(true);
    setErroReset('');
    setSucessoReset('');
    try {
      const res = await resetarSenhaUsuario(resetandoExterno.id, novaSenha);
      setSucessoReset(res.message);
      setTimeout(() => fecharModalReset(), 1500);
    } catch (err: any) {
      setErroReset(err.message || 'Erro ao resetar senha.');
    } finally {
      setSalvandoReset(false);
    }
  };

  const obterAfiliacao = (ext: ExternoEstatisticas) => {
    if (ext.afiliacao === 'Outro' && ext.afiliacao_customizada) return ext.afiliacao_customizada;
    return ext.afiliacao || 'Não informada';
  };

  const estatisticas = useMemo(() => {
    const comBanca = externos.filter(e => e.total_bancas > 0).length;
    const semBanca = externos.filter(e => e.total_bancas === 0).length;
    return {
      total: externos.length,
      comBanca,
      semBanca,
    };
  }, [externos]);

  const externosFiltrados = useMemo(() => {
    if (!busca) return externos;
    return externos.filter(e =>
      e.nome_completo.toLowerCase().includes(busca.toLowerCase()) ||
      e.email.toLowerCase().includes(busca.toLowerCase()) ||
      obterAfiliacao(e).toLowerCase().includes(busca.toLowerCase())
    );
  }, [externos, busca]);

  return (
    <div className="p-6">
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))]">Membros Externos</h1>
        <p className="text-[rgb(var(--cor-texto-secundario))] mt-1">Visualize e gerencie membros externos e suas participações em bancas</p>
      </div>

      {/* Cards de Estatísticas */}
      {!carregandoExternos && !erroExternos && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-[rgb(var(--cor-superficie))] rounded-lg shadow-sm p-4 border border-[rgb(var(--cor-borda))]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[rgb(var(--cor-texto-secundario))] mb-1">Total de Membros</p>
                <p className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))]">{estatisticas.total}</p>
              </div>
              <div className="p-3 bg-[rgb(var(--cor-destaque))]/10 rounded-lg">
                <Building2 className="w-6 h-6 text-[rgb(var(--cor-destaque))]" />
              </div>
            </div>
          </div>

          <div className="bg-[rgb(var(--cor-superficie))] rounded-lg shadow-sm p-4 border border-[rgb(var(--cor-borda))]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[rgb(var(--cor-texto-secundario))] mb-1">Com Bancas</p>
                <p className="text-2xl font-bold text-[rgb(var(--cor-sucesso))]">{estatisticas.comBanca}</p>
              </div>
              <div className="p-3 bg-[rgb(var(--cor-sucesso))]/10 rounded-lg">
                <FileCheck className="w-6 h-6 text-[rgb(var(--cor-sucesso))]" />
              </div>
            </div>
          </div>

          <div className="bg-[rgb(var(--cor-superficie))] rounded-lg shadow-sm p-4 border border-[rgb(var(--cor-borda))]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[rgb(var(--cor-texto-secundario))] mb-1">Sem Bancas</p>
                <p className="text-2xl font-bold text-[rgb(var(--cor-texto-terciario))]">{estatisticas.semBanca}</p>
              </div>
              <div className="p-3 bg-[rgb(var(--cor-borda))]/30 rounded-lg">
                <Building2 className="w-6 h-6 text-[rgb(var(--cor-texto-terciario))]" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barra de ações */}
      <div className="flex justify-between items-center mb-6">
        <div className="relative flex-1 max-w-2xl">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[rgb(var(--cor-icone))] w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar membros externos por nome, email ou afiliação..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[rgb(var(--cor-borda-forte))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:border-transparent bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))]"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-[rgb(var(--cor-superficie))] rounded-lg shadow overflow-hidden">
        {carregandoExternos ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[rgb(var(--cor-icone))] mr-2" />
            <span className="text-[rgb(var(--cor-texto-secundario))]">Carregando membros externos...</span>
          </div>
        ) : erroExternos ? (
          <div className="flex items-center justify-center py-12 text-[rgb(var(--cor-erro))]">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{erroExternos}</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[rgb(var(--cor-superficie-hover))] border-b border-[rgb(var(--cor-borda))]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--cor-texto-terciario))] uppercase tracking-wider">
                    Membro Externo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--cor-texto-terciario))] uppercase tracking-wider">
                    Bancas
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[rgb(var(--cor-texto-terciario))] uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(var(--cor-borda))]">
                {externosFiltrados.map(externo => (
                  <tr key={externo.id}>
                    {/* Coluna Membro */}
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-[rgb(var(--cor-texto-primario))]">{externo.nome_completo}</div>
                      <div className="text-sm text-[rgb(var(--cor-texto-terciario))]">{externo.email}</div>
                      <div className="text-xs text-[rgb(var(--cor-texto-terciario))] mt-1">{obterAfiliacao(externo)}</div>
                    </td>

                    {/* Coluna Bancas */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 mb-3">
                        <FileCheck className="w-5 h-5 text-[rgb(var(--cor-fase2-cabecalho))]" />
                        <span className="text-sm font-medium text-[rgb(var(--cor-texto-primario))]">
                          {externo.total_bancas} {externo.total_bancas === 1 ? 'banca' : 'bancas'}
                        </span>
                      </div>
                      {externo.bancas.length > 0 && (
                        <div className="space-y-4">
                          {externo.bancas.map(tcc => (
                            <MiniTimelineTCC
                              key={`banca-${tcc.id}`}
                              tcc={tcc}
                              tipo="banca"
                            />
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Coluna Ações */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => abrirModalEdicao(externo)}
                        className="text-[rgb(var(--cor-destaque))] hover:text-[rgb(var(--cor-destaque))]/80 mr-3"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => abrirModalReset(externo)}
                        className="text-[rgb(var(--cor-alerta))] hover:text-[rgb(var(--cor-alerta))]/80"
                        title="Resetar Senha"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {externosFiltrados.length === 0 && (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-[rgb(var(--cor-borda-forte))] mx-auto mb-3" />
                <p className="text-[rgb(var(--cor-texto-terciario))] font-medium mb-2">Nenhum membro externo encontrado</p>
                {busca && (
                  <div className="space-y-2">
                    <p className="text-sm text-[rgb(var(--cor-icone))]">Tente fazer uma nova busca</p>
                    <button
                      onClick={() => setBusca('')}
                      className="text-sm text-[rgb(var(--cor-destaque))] hover:text-[rgb(var(--cor-destaque))]/80 font-medium"
                    >
                      Limpar busca
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Edição */}
      {editandoExterno && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-[rgb(var(--cor-borda))]">
              <h2 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))]">
                Editar membro externo
              </h2>
              <button onClick={fecharModalEdicao} className="text-[rgb(var(--cor-icone))] hover:text-[rgb(var(--cor-texto-primario))]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[rgb(var(--cor-texto-secundario))] mb-1">Nome completo *</label>
                <input
                  type="text"
                  value={editNome}
                  onChange={e => setEditNome(e.target.value)}
                  className="w-full px-3 py-2 border border-[rgb(var(--cor-borda-forte))] rounded-lg bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))] focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[rgb(var(--cor-texto-secundario))] mb-1">Email *</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-[rgb(var(--cor-borda-forte))] rounded-lg bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))] focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[rgb(var(--cor-texto-secundario))] mb-1">Tratamento</label>
                <select
                  value={editTratamento}
                  onChange={e => setEditTratamento(e.target.value)}
                  className="w-full px-3 py-2 border border-[rgb(var(--cor-borda-forte))] rounded-lg bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))] focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:border-transparent"
                >
                  <option value="">Selecione...</option>
                  {TRATAMENTOS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {editTratamento === 'Outro' && (
                <div>
                  <label className="block text-sm font-medium text-[rgb(var(--cor-texto-secundario))] mb-1">Tratamento customizado *</label>
                  <input
                    type="text"
                    value={editTratamentoCustom}
                    onChange={e => setEditTratamentoCustom(e.target.value)}
                    className="w-full px-3 py-2 border border-[rgb(var(--cor-borda-forte))] rounded-lg bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))] focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:border-transparent"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[rgb(var(--cor-texto-secundario))] mb-1">Afiliação *</label>
                <select
                  value={editAfiliacao}
                  onChange={e => setEditAfiliacao(e.target.value)}
                  className="w-full px-3 py-2 border border-[rgb(var(--cor-borda-forte))] rounded-lg bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))] focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:border-transparent"
                >
                  <option value="">Selecione...</option>
                  {AFILIACOES.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              {editAfiliacao === 'Outro' && (
                <div>
                  <label className="block text-sm font-medium text-[rgb(var(--cor-texto-secundario))] mb-1">Afiliação customizada *</label>
                  <input
                    type="text"
                    value={editAfiliacaoCustom}
                    onChange={e => setEditAfiliacaoCustom(e.target.value)}
                    className="w-full px-3 py-2 border border-[rgb(var(--cor-borda-forte))] rounded-lg bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))] focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:border-transparent"
                  />
                </div>
              )}

              {erroEdicao && (
                <div className="flex items-center gap-2 text-sm text-[rgb(var(--cor-erro))]">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{erroEdicao}</span>
                </div>
              )}

              {sucessoEdicao && (
                <div className="flex items-center gap-2 text-sm text-[rgb(var(--cor-sucesso))]">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{sucessoEdicao}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-[rgb(var(--cor-borda))]">
              <button
                onClick={fecharModalEdicao}
                className="px-4 py-2 text-sm font-medium text-[rgb(var(--cor-texto-secundario))] hover:text-[rgb(var(--cor-texto-primario))] border border-[rgb(var(--cor-borda-forte))] rounded-lg hover:bg-[rgb(var(--cor-fundo))]"
              >
                Cancelar
              </button>
              <button
                onClick={salvarEdicao}
                disabled={salvandoEdicao}
                className="px-4 py-2 text-sm font-medium text-white bg-[rgb(var(--cor-destaque))] rounded-lg hover:bg-[rgb(var(--cor-destaque))]/90 disabled:opacity-50 flex items-center gap-2"
              >
                {salvandoEdicao && <Loader2 className="w-4 h-4 animate-spin" />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Reset de Senha */}
      {resetandoExterno && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-[rgb(var(--cor-borda))]">
              <h2 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))]">
                Resetar senha
              </h2>
              <button onClick={fecharModalReset} className="text-[rgb(var(--cor-icone))] hover:text-[rgb(var(--cor-texto-primario))]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-[rgb(var(--cor-texto-secundario))]">
                Definir nova senha para <strong className="text-[rgb(var(--cor-texto-primario))]">{resetandoExterno.nome_completo}</strong>
              </p>

              <div>
                <label className="block text-sm font-medium text-[rgb(var(--cor-texto-secundario))] mb-1">Nova senha *</label>
                <div className="relative">
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={novaSenha}
                    onChange={e => setNovaSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-3 py-2 pr-10 border border-[rgb(var(--cor-borda-forte))] rounded-lg bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))] focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--cor-icone))] hover:text-[rgb(var(--cor-texto-primario))]"
                  >
                    {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[rgb(var(--cor-texto-secundario))] mb-1">Confirmar senha *</label>
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={confirmarSenha}
                  onChange={e => setConfirmarSenha(e.target.value)}
                  className="w-full px-3 py-2 border border-[rgb(var(--cor-borda-forte))] rounded-lg bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))] focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:border-transparent"
                />
              </div>

              {erroReset && (
                <div className="flex items-center gap-2 text-sm text-[rgb(var(--cor-erro))]">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{erroReset}</span>
                </div>
              )}

              {sucessoReset && (
                <div className="flex items-center gap-2 text-sm text-[rgb(var(--cor-sucesso))]">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{sucessoReset}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-[rgb(var(--cor-borda))]">
              <button
                onClick={fecharModalReset}
                className="px-4 py-2 text-sm font-medium text-[rgb(var(--cor-texto-secundario))] hover:text-[rgb(var(--cor-texto-primario))] border border-[rgb(var(--cor-borda-forte))] rounded-lg hover:bg-[rgb(var(--cor-fundo))]"
              >
                Cancelar
              </button>
              <button
                onClick={salvarReset}
                disabled={salvandoReset}
                className="px-4 py-2 text-sm font-medium text-white bg-[rgb(var(--cor-alerta))] rounded-lg hover:bg-[rgb(var(--cor-alerta))]/90 disabled:opacity-50 flex items-center gap-2"
              >
                {salvandoReset && <Loader2 className="w-4 h-4 animate-spin" />}
                Resetar senha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
