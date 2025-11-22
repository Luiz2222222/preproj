import { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Key,
  AlertCircle,
  Loader2,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  FileCheck
} from 'lucide-react';
import { MiniTimelineTCC } from '../../componentes/MiniTimelineTCC';
import { useProfessoresEstatisticas } from '../../hooks/useProfessoresEstatisticas';

export function ProfessoresPage() {
  // Hook para buscar estatísticas de professores
  const {
    professores,
    carregando: carregandoProfessores,
    erro: erroProfessores
  } = useProfessoresEstatisticas();

  const [busca, setBusca] = useState('');
  const [filtroWorkload, setFiltroWorkload] = useState<'todos' | 'disponivel' | 'ocupado' | 'sobrecarregado'>('todos');

  // Calcular estatísticas de carga de trabalho dos professores
  const estatisticas = useMemo(() => {
    const calcularCargaTrabalho = (prof: any) => {
      return prof.total_orientacoes + prof.total_bancas;
    };

    const disponivel = professores.filter(p => calcularCargaTrabalho(p) <= 2).length;
    const ocupado = professores.filter(p => {
      const carga = calcularCargaTrabalho(p);
      return carga >= 3 && carga <= 5;
    }).length;
    const sobrecarregado = professores.filter(p => calcularCargaTrabalho(p) >= 6).length;

    return {
      total: professores.length,
      disponivel,
      ocupado,
      sobrecarregado
    };
  }, [professores]);

  // Filtrar professores por busca e workload
  const professoresFiltrados = useMemo(() => {
    let filtrados = professores;

    // Filtrar por busca
    if (busca) {
      filtrados = filtrados.filter(p =>
        p.nome_completo.toLowerCase().includes(busca.toLowerCase()) ||
        p.email.toLowerCase().includes(busca.toLowerCase())
      );
    }

    // Filtrar por carga de trabalho
    if (filtroWorkload !== 'todos') {
      filtrados = filtrados.filter(p => {
        const carga = p.total_orientacoes + p.total_bancas;
        switch (filtroWorkload) {
          case 'disponivel':
            return carga <= 2;
          case 'ocupado':
            return carga >= 3 && carga <= 5;
          case 'sobrecarregado':
            return carga >= 6;
          default:
            return true;
        }
      });
    }

    return filtrados;
  }, [professores, busca, filtroWorkload]);

  return (
    <div className="p-6">
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))]">Professores</h1>
        <p className="text-[rgb(var(--cor-texto-secundario))] mt-1">Visualize e gerencie professores, suas orientações e participações em bancas</p>
      </div>

      {/* Cards de Estatísticas */}
      {!carregandoProfessores && !erroProfessores && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Card Total */}
          <div className="bg-[rgb(var(--cor-superficie))] rounded-lg shadow-sm p-4 border border-[rgb(var(--cor-borda))]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[rgb(var(--cor-texto-secundario))] mb-1">Total de Professores</p>
                <p className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))]">{estatisticas.total}</p>
              </div>
              <div className="p-3 bg-[rgb(var(--cor-destaque))]/10 rounded-lg">
                <Users className="w-6 h-6 text-[rgb(var(--cor-destaque))]" />
              </div>
            </div>
          </div>

          {/* Card Disponíveis */}
          <button
            onClick={() => setFiltroWorkload(filtroWorkload === 'disponivel' ? 'todos' : 'disponivel')}
            className={`bg-[rgb(var(--cor-superficie))] rounded-lg shadow-sm p-4 border-2 transition-all text-left hover:shadow-md ${
              filtroWorkload === 'disponivel' ? 'border-[rgb(var(--cor-sucesso))] ring-2 ring-[rgb(var(--cor-sucesso))]/20' : 'border-[rgb(var(--cor-borda))]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[rgb(var(--cor-texto-secundario))] mb-1">Disponíveis</p>
                <p className="text-2xl font-bold text-[rgb(var(--cor-sucesso))]">{estatisticas.disponivel}</p>
                <p className="text-xs text-[rgb(var(--cor-texto-terciario))] mt-1">0-2 atribuições</p>
              </div>
              <div className="p-3 bg-[rgb(var(--cor-sucesso))]/10 rounded-lg">
                <CheckCircle className="w-6 h-6 text-[rgb(var(--cor-sucesso))]" />
              </div>
            </div>
          </button>

          {/* Card Ocupados */}
          <button
            onClick={() => setFiltroWorkload(filtroWorkload === 'ocupado' ? 'todos' : 'ocupado')}
            className={`bg-[rgb(var(--cor-superficie))] rounded-lg shadow-sm p-4 border-2 transition-all text-left hover:shadow-md ${
              filtroWorkload === 'ocupado' ? 'border-[rgb(var(--cor-alerta))] ring-2 ring-[rgb(var(--cor-alerta))]/20' : 'border-[rgb(var(--cor-borda))]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[rgb(var(--cor-texto-secundario))] mb-1">Ocupados</p>
                <p className="text-2xl font-bold text-[rgb(var(--cor-alerta))]">{estatisticas.ocupado}</p>
                <p className="text-xs text-[rgb(var(--cor-texto-terciario))] mt-1">3-5 atribuições</p>
              </div>
              <div className="p-3 bg-[rgb(var(--cor-alerta))]/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-[rgb(var(--cor-alerta))]" />
              </div>
            </div>
          </button>

          {/* Card Sobrecarregados */}
          <button
            onClick={() => setFiltroWorkload(filtroWorkload === 'sobrecarregado' ? 'todos' : 'sobrecarregado')}
            className={`bg-[rgb(var(--cor-superficie))] rounded-lg shadow-sm p-4 border-2 transition-all text-left hover:shadow-md ${
              filtroWorkload === 'sobrecarregado' ? 'border-[rgb(var(--cor-erro))] ring-2 ring-[rgb(var(--cor-erro))]/20' : 'border-[rgb(var(--cor-borda))]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[rgb(var(--cor-texto-secundario))] mb-1">Sobrecarregados</p>
                <p className="text-2xl font-bold text-[rgb(var(--cor-erro))]">{estatisticas.sobrecarregado}</p>
                <p className="text-xs text-[rgb(var(--cor-texto-terciario))] mt-1">6+ atribuições</p>
              </div>
              <div className="p-3 bg-[rgb(var(--cor-erro))]/10 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-[rgb(var(--cor-erro))]" />
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
              placeholder="Buscar professores..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[rgb(var(--cor-borda-forte))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:border-transparent bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))]"
            />
          </div>

          {/* Badge de filtro ativo */}
          {filtroWorkload !== 'todos' && (
            <div className="flex items-center gap-2 px-3 py-2 bg-[rgb(var(--cor-destaque))]/10 border border-[rgb(var(--cor-destaque))]/20 rounded-lg">
              <span className="text-sm text-[rgb(var(--cor-destaque))] font-medium">
                Filtro: {filtroWorkload === 'disponivel' ? 'Disponíveis' : filtroWorkload === 'ocupado' ? 'Ocupados' : 'Sobrecarregados'}
              </span>
              <button
                onClick={() => setFiltroWorkload('todos')}
                className="text-[rgb(var(--cor-destaque))] hover:text-[rgb(var(--cor-destaque))]/80"
                title="Limpar filtro"
              >
                <AlertCircle className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <button className="ml-4 px-4 py-2 bg-[rgb(var(--cor-destaque))] text-white rounded-lg hover:bg-[rgb(var(--cor-destaque))]/90 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Adicionar professor
        </button>
      </div>

      {/* Tabela de Professores */}
      <div className="bg-[rgb(var(--cor-superficie))] rounded-lg shadow overflow-hidden">
        {carregandoProfessores ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[rgb(var(--cor-icone))] mr-2" />
            <span className="text-[rgb(var(--cor-texto-secundario))]">Carregando professores...</span>
          </div>
        ) : erroProfessores ? (
          <div className="flex items-center justify-center py-12 text-[rgb(var(--cor-erro))]">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{erroProfessores}</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[rgb(var(--cor-superficie-hover))] border-b border-[rgb(var(--cor-borda))]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--cor-texto-terciario))] uppercase tracking-wider">
                    Professor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--cor-texto-terciario))] uppercase tracking-wider">
                    Orientandos
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
                {professoresFiltrados.map(professor => {
                  const cargaTotal = professor.total_orientacoes + professor.total_bancas;
                  const workloadStatus = cargaTotal <= 2 ? 'disponivel' : cargaTotal <= 5 ? 'ocupado' : 'sobrecarregado';
                  const workloadColors = {
                    disponivel: 'bg-[rgb(var(--cor-sucesso))]/10 text-[rgb(var(--cor-sucesso))]',
                    ocupado: 'bg-[rgb(var(--cor-alerta))]/10 text-[rgb(var(--cor-alerta))]',
                    sobrecarregado: 'bg-[rgb(var(--cor-erro))]/10 text-[rgb(var(--cor-erro))]'
                  };
                  const workloadLabels = {
                    disponivel: 'Disponível',
                    ocupado: 'Ocupado',
                    sobrecarregado: 'Sobrecarregado'
                  };

                  return (
                    <tr key={professor.id}>
                      {/* Coluna Professor */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-sm font-medium text-[rgb(var(--cor-texto-primario))]">{professor.nome_completo}</div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${workloadColors[workloadStatus]}`}>
                            {workloadLabels[workloadStatus]}
                          </span>
                        </div>
                        <div className="text-sm text-[rgb(var(--cor-texto-terciario))]">{professor.email}</div>
                      </td>

                      {/* Coluna Orientandos */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 mb-3">
                          <UserCheck className="w-5 h-5 text-[rgb(var(--cor-destaque))]" />
                          <span className="text-sm font-medium text-[rgb(var(--cor-texto-primario))]">
                            {professor.total_orientacoes} {professor.total_orientacoes === 1 ? 'orientando' : 'orientandos'}
                          </span>
                        </div>
                        {professor.orientacoes.length > 0 && (
                          <div className="space-y-4">
                            {professor.orientacoes.map(tcc => (
                              <MiniTimelineTCC
                                key={`orient-${tcc.id}`}
                                tcc={tcc}
                                tipo={tcc.tipo_orientacao === 'CO_ORIENTADOR' ? 'coorientacao' : 'orientacao'}
                              />
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Coluna Bancas */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 mb-3">
                          <FileCheck className="w-5 h-5 text-[rgb(var(--cor-fase2-cabecalho))]" />
                          <span className="text-sm font-medium text-[rgb(var(--cor-texto-primario))]">
                            {professor.total_bancas} {professor.total_bancas === 1 ? 'banca' : 'bancas'}
                          </span>
                        </div>
                        {professor.bancas.length > 0 && (
                          <div className="space-y-4">
                            {professor.bancas.map(tcc => (
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
                          className="text-[rgb(var(--cor-destaque))] hover:text-[rgb(var(--cor-destaque))]/80 mr-3"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          className="text-[rgb(var(--cor-alerta))] hover:text-[rgb(var(--cor-alerta))]/80"
                          title="Resetar Senha"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {professoresFiltrados.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-[rgb(var(--cor-borda-forte))] mx-auto mb-3" />
                <p className="text-[rgb(var(--cor-texto-terciario))] font-medium mb-2">Nenhum professor encontrado</p>
                {(busca || filtroWorkload !== 'todos') && (
                  <div className="space-y-2">
                    <p className="text-sm text-[rgb(var(--cor-icone))]">
                      Tente ajustar os filtros ou fazer uma nova busca
                    </p>
                    <button
                      onClick={() => {
                        setBusca('');
                        setFiltroWorkload('todos');
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
    </div>
  );
}
