import { useState, useMemo } from 'react';
import {
  GraduationCap,
  Search,
  Edit2,
  Key,
  AlertCircle,
  Loader2,
  CheckCircle,
  BookOpen,
  FileX,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { MiniTimelineTCC } from '../../componentes/MiniTimelineTCC';
import { useAlunosEstatisticas, type AlunoEstatisticas } from '../../hooks/useAlunosEstatisticas';
import { editarUsuario, resetarSenhaUsuario } from '../../servicos/usuarios';

const CURSOS = [
  { value: 'ENGENHARIA_ELETRICA', label: 'Engenharia Elétrica' },
  { value: 'ENGENHARIA_CONTROLE_AUTOMACAO', label: 'Engenharia de Controle e Automação' },
];

export function AlunosPage() {
  const {
    alunos,
    carregando: carregandoAlunos,
    erro: erroAlunos,
    recarregar
  } = useAlunosEstatisticas();

  const [busca, setBusca] = useState('');
  const [filtroCurso, setFiltroCurso] = useState<'todos' | 'ENGENHARIA_ELETRICA' | 'ENGENHARIA_CONTROLE_AUTOMACAO' | 'sem_tcc'>('todos');

  // Modal de edição
  const [editandoAluno, setEditandoAluno] = useState<AlunoEstatisticas | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCurso, setEditCurso] = useState('');
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [erroEdicao, setErroEdicao] = useState('');
  const [sucessoEdicao, setSucessoEdicao] = useState('');

  // Modal de reset de senha
  const [resetandoAluno, setResetandoAluno] = useState<AlunoEstatisticas | null>(null);
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [salvandoReset, setSalvandoReset] = useState(false);
  const [erroReset, setErroReset] = useState('');
  const [sucessoReset, setSucessoReset] = useState('');

  const abrirModalEdicao = (aluno: AlunoEstatisticas) => {
    setEditandoAluno(aluno);
    setEditNome(aluno.nome_completo);
    setEditEmail(aluno.email);
    setEditCurso(aluno.curso || '');
    setErroEdicao('');
    setSucessoEdicao('');
  };

  const fecharModalEdicao = () => {
    setEditandoAluno(null);
    setErroEdicao('');
    setSucessoEdicao('');
  };

  const salvarEdicao = async () => {
    if (!editandoAluno) return;
    if (!editNome.trim() || !editEmail.trim() || !editCurso) {
      setErroEdicao('Preencha todos os campos obrigatórios.');
      return;
    }

    setSalvandoEdicao(true);
    setErroEdicao('');
    setSucessoEdicao('');
    try {
      await editarUsuario(editandoAluno.id, {
        nome_completo: editNome.trim(),
        email: editEmail.trim(),
        curso: editCurso,
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

  const abrirModalReset = (aluno: AlunoEstatisticas) => {
    setResetandoAluno(aluno);
    setNovaSenha('');
    setConfirmarSenha('');
    setMostrarSenha(false);
    setErroReset('');
    setSucessoReset('');
  };

  const fecharModalReset = () => {
    setResetandoAluno(null);
    setErroReset('');
    setSucessoReset('');
  };

  const salvarReset = async () => {
    if (!resetandoAluno) return;
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
      const res = await resetarSenhaUsuario(resetandoAluno.id, novaSenha);
      setSucessoReset(res.message);
      setTimeout(() => fecharModalReset(), 1500);
    } catch (err: any) {
      setErroReset(err.message || 'Erro ao resetar senha.');
    } finally {
      setSalvandoReset(false);
    }
  };

  const estatisticas = useMemo(() => {
    const eletrica = alunos.filter(a => a.curso === 'ENGENHARIA_ELETRICA').length;
    const controle = alunos.filter(a => a.curso === 'ENGENHARIA_CONTROLE_AUTOMACAO').length;
    const semTcc = alunos.filter(a => !a.tcc).length;

    return {
      total: alunos.length,
      eletrica,
      controle,
      semTcc,
    };
  }, [alunos]);

  const alunosFiltrados = useMemo(() => {
    let filtrados = alunos;

    if (busca) {
      filtrados = filtrados.filter(a =>
        a.nome_completo.toLowerCase().includes(busca.toLowerCase()) ||
        a.email.toLowerCase().includes(busca.toLowerCase()) ||
        (a.tcc?.titulo?.toLowerCase().includes(busca.toLowerCase()))
      );
    }

    if (filtroCurso !== 'todos') {
      if (filtroCurso === 'sem_tcc') {
        filtrados = filtrados.filter(a => !a.tcc);
      } else {
        filtrados = filtrados.filter(a => a.curso === filtroCurso);
      }
    }

    return filtrados;
  }, [alunos, busca, filtroCurso]);

  return (
    <div className="p-6">
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))]">Alunos</h1>
        <p className="text-[rgb(var(--cor-texto-secundario))] mt-1">Visualize e gerencie alunos e seus trabalhos de conclusão de curso</p>
      </div>

      {/* Cards de Estatísticas */}
      {!carregandoAlunos && !erroAlunos && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Card Total */}
          <div className="bg-[rgb(var(--cor-superficie))] rounded-lg shadow-sm p-4 border border-[rgb(var(--cor-borda))]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[rgb(var(--cor-texto-secundario))] mb-1">Total de Alunos</p>
                <p className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))]">{estatisticas.total}</p>
              </div>
              <div className="p-3 bg-[rgb(var(--cor-destaque))]/10 rounded-lg">
                <GraduationCap className="w-6 h-6 text-[rgb(var(--cor-destaque))]" />
              </div>
            </div>
          </div>

          {/* Card Eng. Elétrica */}
          <button
            onClick={() => setFiltroCurso(filtroCurso === 'ENGENHARIA_ELETRICA' ? 'todos' : 'ENGENHARIA_ELETRICA')}
            className={`bg-[rgb(var(--cor-superficie))] rounded-lg shadow-sm p-4 border-2 transition-all text-left hover:shadow-md ${
              filtroCurso === 'ENGENHARIA_ELETRICA' ? 'border-[rgb(var(--cor-sucesso))] ring-2 ring-[rgb(var(--cor-sucesso))]/20' : 'border-[rgb(var(--cor-borda))]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[rgb(var(--cor-texto-secundario))] mb-1">Eng. Elétrica</p>
                <p className="text-2xl font-bold text-[rgb(var(--cor-sucesso))]">{estatisticas.eletrica}</p>
              </div>
              <div className="p-3 bg-[rgb(var(--cor-sucesso))]/10 rounded-lg">
                <BookOpen className="w-6 h-6 text-[rgb(var(--cor-sucesso))]" />
              </div>
            </div>
          </button>

          {/* Card Controle e Automação */}
          <button
            onClick={() => setFiltroCurso(filtroCurso === 'ENGENHARIA_CONTROLE_AUTOMACAO' ? 'todos' : 'ENGENHARIA_CONTROLE_AUTOMACAO')}
            className={`bg-[rgb(var(--cor-superficie))] rounded-lg shadow-sm p-4 border-2 transition-all text-left hover:shadow-md ${
              filtroCurso === 'ENGENHARIA_CONTROLE_AUTOMACAO' ? 'border-[rgb(var(--cor-alerta))] ring-2 ring-[rgb(var(--cor-alerta))]/20' : 'border-[rgb(var(--cor-borda))]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[rgb(var(--cor-texto-secundario))] mb-1">Controle e Automação</p>
                <p className="text-2xl font-bold text-[rgb(var(--cor-alerta))]">{estatisticas.controle}</p>
              </div>
              <div className="p-3 bg-[rgb(var(--cor-alerta))]/10 rounded-lg">
                <BookOpen className="w-6 h-6 text-[rgb(var(--cor-alerta))]" />
              </div>
            </div>
          </button>

          {/* Card Sem TCC */}
          <button
            onClick={() => setFiltroCurso(filtroCurso === 'sem_tcc' ? 'todos' : 'sem_tcc')}
            className={`bg-[rgb(var(--cor-superficie))] rounded-lg shadow-sm p-4 border-2 transition-all text-left hover:shadow-md ${
              filtroCurso === 'sem_tcc' ? 'border-[rgb(var(--cor-erro))] ring-2 ring-[rgb(var(--cor-erro))]/20' : 'border-[rgb(var(--cor-borda))]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[rgb(var(--cor-texto-secundario))] mb-1">Sem TCC</p>
                <p className="text-2xl font-bold text-[rgb(var(--cor-erro))]">{estatisticas.semTcc}</p>
              </div>
              <div className="p-3 bg-[rgb(var(--cor-erro))]/10 rounded-lg">
                <FileX className="w-6 h-6 text-[rgb(var(--cor-erro))]" />
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Barra de ações */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[rgb(var(--cor-icone))] w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar alunos por nome, email ou título do TCC..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[rgb(var(--cor-borda-forte))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:border-transparent bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))]"
            />
          </div>

          {/* Badge de filtro ativo */}
          {filtroCurso !== 'todos' && (
            <div className="flex items-center gap-2 px-3 py-2 bg-[rgb(var(--cor-destaque))]/10 border border-[rgb(var(--cor-destaque))]/20 rounded-lg">
              <span className="text-sm text-[rgb(var(--cor-destaque))] font-medium">
                Filtro: {filtroCurso === 'ENGENHARIA_ELETRICA' ? 'Eng. Elétrica' : filtroCurso === 'ENGENHARIA_CONTROLE_AUTOMACAO' ? 'Controle e Automação' : 'Sem TCC'}
              </span>
              <button
                onClick={() => setFiltroCurso('todos')}
                className="text-[rgb(var(--cor-destaque))] hover:text-[rgb(var(--cor-destaque))]/80"
                title="Limpar filtro"
              >
                <AlertCircle className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabela de Alunos */}
      <div className="bg-[rgb(var(--cor-superficie))] rounded-lg shadow overflow-hidden">
        {carregandoAlunos ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[rgb(var(--cor-icone))] mr-2" />
            <span className="text-[rgb(var(--cor-texto-secundario))]">Carregando alunos...</span>
          </div>
        ) : erroAlunos ? (
          <div className="flex items-center justify-center py-12 text-[rgb(var(--cor-erro))]">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{erroAlunos}</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[rgb(var(--cor-superficie-hover))] border-b border-[rgb(var(--cor-borda))]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--cor-texto-terciario))] uppercase tracking-wider">
                    Aluno
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--cor-texto-terciario))] uppercase tracking-wider">
                    TCC
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[rgb(var(--cor-texto-terciario))] uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(var(--cor-borda))]">
                {alunosFiltrados.map(aluno => (
                  <tr key={aluno.id}>
                    {/* Coluna Aluno */}
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-[rgb(var(--cor-texto-primario))]">{aluno.nome_completo}</div>
                      <div className="text-sm text-[rgb(var(--cor-texto-terciario))]">{aluno.email}</div>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        aluno.curso === 'ENGENHARIA_ELETRICA'
                          ? 'bg-[rgb(var(--cor-sucesso))]/10 text-[rgb(var(--cor-sucesso))]'
                          : 'bg-[rgb(var(--cor-alerta))]/10 text-[rgb(var(--cor-alerta))]'
                      }`}>
                        {aluno.curso_display || 'Não informado'}
                      </span>
                    </td>

                    {/* Coluna TCC */}
                    <td className="px-6 py-4">
                      {aluno.tcc ? (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-[rgb(var(--cor-texto-primario))] line-clamp-2" title={aluno.tcc.titulo}>
                            {aluno.tcc.titulo}
                          </p>
                          {aluno.tcc.orientador_nome && (
                            <p className="text-xs text-[rgb(var(--cor-texto-terciario))]">
                              Orientador: {aluno.tcc.orientador_nome}
                            </p>
                          )}
                          <MiniTimelineTCC
                            tcc={{
                              id: aluno.tcc.id,
                              titulo: aluno.tcc.titulo,
                              aluno_nome: aluno.nome_completo,
                              aluno_id: aluno.id,
                              etapa_atual: aluno.tcc.etapa_atual,
                            }}
                            tipo="orientacao"
                            apenasTimeline
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-[rgb(var(--cor-texto-terciario))]">
                          <FileX className="w-4 h-4" />
                          <span className="text-sm">Sem TCC cadastrado</span>
                        </div>
                      )}
                    </td>

                    {/* Coluna Ações */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => abrirModalEdicao(aluno)}
                        className="text-[rgb(var(--cor-destaque))] hover:text-[rgb(var(--cor-destaque))]/80 mr-3"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => abrirModalReset(aluno)}
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

            {alunosFiltrados.length === 0 && (
              <div className="text-center py-12">
                <GraduationCap className="w-12 h-12 text-[rgb(var(--cor-borda-forte))] mx-auto mb-3" />
                <p className="text-[rgb(var(--cor-texto-terciario))] font-medium mb-2">Nenhum aluno encontrado</p>
                {(busca || filtroCurso !== 'todos') && (
                  <div className="space-y-2">
                    <p className="text-sm text-[rgb(var(--cor-icone))]">
                      Tente ajustar os filtros ou fazer uma nova busca
                    </p>
                    <button
                      onClick={() => {
                        setBusca('');
                        setFiltroCurso('todos');
                      }}
                      className="text-sm text-[rgb(var(--cor-destaque))] hover:text-[rgb(var(--cor-destaque))]/80 font-medium"
                    >
                      Limpar todos os filtros
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Edição */}
      {editandoAluno && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-[rgb(var(--cor-borda))]">
              <h2 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))]">
                Editar aluno
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
                <label className="block text-sm font-medium text-[rgb(var(--cor-texto-secundario))] mb-1">Curso *</label>
                <select
                  value={editCurso}
                  onChange={e => setEditCurso(e.target.value)}
                  className="w-full px-3 py-2 border border-[rgb(var(--cor-borda-forte))] rounded-lg bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))] focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:border-transparent"
                >
                  <option value="">Selecione...</option>
                  {CURSOS.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

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
      {resetandoAluno && (
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
                Definir nova senha para <strong className="text-[rgb(var(--cor-texto-primario))]">{resetandoAluno.nome_completo}</strong>
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
