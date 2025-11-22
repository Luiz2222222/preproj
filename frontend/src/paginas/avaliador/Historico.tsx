import { History, Search, Filter, FileText, Calendar, Award, TrendingUp } from 'lucide-react';

export function HistoricoParticipacao() {
  // Dados mockados (visual-only)
  const estatisticas = [
    { label: 'Total de Participações', valor: '45', icon: Award, color: 'blue' },
    { label: 'Média de Notas Atribuídas', valor: '8.3', icon: TrendingUp, color: 'green' },
    { label: 'Defesas em 2025', valor: '12', icon: Calendar, color: 'purple' },
    { label: 'Pareceres Enviados', valor: '42', icon: FileText, color: 'orange' },
  ];

  const historicoCompleto = [
    {
      id: 1,
      tipo: 'Defesa Final',
      aluno: 'João Silva',
      titulo: 'Sistema de Automação Residencial com IoT',
      orientador: 'Prof. Dr. José Silva',
      data: '15/06/2024',
      nota: 9.0,
      resultado: 'Aprovado',
      parecer: 'Excelente trabalho com contribuição significativa.',
    },
    {
      id: 2,
      tipo: 'Fase I',
      aluno: 'Maria Santos',
      titulo: 'Análise de Eficiência Energética em Sistemas Industriais',
      orientador: 'Profa. Dra. Ana Costa',
      data: '10/06/2024',
      nota: 8.5,
      resultado: 'Aprovado',
      parecer: 'Trabalho bem fundamentado com boa aplicação prática.',
    },
    {
      id: 3,
      tipo: 'Defesa Final',
      aluno: 'Carlos Oliveira',
      titulo: 'Desenvolvimento de Algoritmos para Otimização de Processos',
      orientador: 'Prof. Dr. Roberto Lima',
      data: '05/06/2024',
      nota: 8.0,
      resultado: 'Aprovado com Ressalvas',
      parecer: 'Bom trabalho, mas necessita ajustes na metodologia.',
    },
    {
      id: 4,
      tipo: 'Fase I',
      aluno: 'Ana Paula Costa',
      titulo: 'Aplicação de Redes Neurais em Diagnóstico de Falhas',
      orientador: 'Profa. Dra. Juliana Santos',
      data: '28/05/2024',
      nota: 9.5,
      resultado: 'Aprovado',
      parecer: 'Trabalho excepcional com inovação e rigor científico.',
    },
    {
      id: 5,
      tipo: 'Defesa Final',
      aluno: 'Rafael Mendes',
      titulo: 'Sistema de Monitoramento Inteligente para Indústria 4.0',
      orientador: 'Prof. Dr. Fernando Costa',
      data: '20/05/2024',
      nota: 8.8,
      resultado: 'Aprovado',
      parecer: 'Implementação robusta com resultados expressivos.',
    },
    {
      id: 6,
      tipo: 'Fase I',
      aluno: 'Beatriz Lima',
      titulo: 'Controle Preditivo para Sistemas de Climatização',
      orientador: 'Prof. Dr. Marcos Silva',
      data: '15/05/2024',
      nota: 7.5,
      resultado: 'Aprovado com Ressalvas',
      parecer: 'Conceitos sólidos, mas validação experimental limitada.',
    },
  ];

  const getResultadoBadge = (resultado: string) => {
    if (resultado === 'Aprovado') {
      return <span className="px-2 py-1 bg-[rgb(var(--cor-sucesso))]/10 text-[rgb(var(--cor-sucesso))] rounded text-xs font-medium">Aprovado</span>;
    }
    if (resultado === 'Aprovado com Ressalvas') {
      return <span className="px-2 py-1 bg-[rgb(var(--cor-alerta))]/10 text-[rgb(var(--cor-alerta))] rounded text-xs font-medium">Aprovado com Ressalvas</span>;
    }
    if (resultado === 'Reprovado') {
      return <span className="px-2 py-1 bg-[rgb(var(--cor-erro))]/10 text-[rgb(var(--cor-erro))] rounded text-xs font-medium">Reprovado</span>;
    }
    return <span className="px-2 py-1 bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-primario))] rounded text-xs font-medium">-</span>;
  };

  const getTipoColor = (tipo: string) => {
    if (tipo === 'Fase I') return 'bg-[rgb(var(--cor-info))]/10 text-[rgb(var(--cor-info))]';
    if (tipo === 'Defesa Final') return 'bg-[rgb(var(--cor-destaque))]/10 text-[rgb(var(--cor-destaque))]';
    return 'bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-primario))]';
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))] flex items-center gap-2">
          <History className="h-7 w-7 text-[rgb(var(--cor-sucesso))]" />
          Histórico de Participação
        </h1>
        <p className="text-[rgb(var(--cor-texto-secundario))] mt-1">Visualize seu histórico completo de avaliações</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {estatisticas.map((stat, index) => (
          <div key={index} className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-sm border border-[rgb(var(--cor-borda))] p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${
                stat.color === 'blue' ? 'bg-[rgb(var(--cor-destaque))]' :
                stat.color === 'green' ? 'bg-[rgb(var(--cor-sucesso))]' :
                stat.color === 'purple' ? 'bg-[rgb(var(--cor-info))]' :
                stat.color === 'orange' ? 'bg-[rgb(var(--cor-alerta))]' :
                'bg-[rgb(var(--cor-icone))]'
              }`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
            <h3 className="text-[rgb(var(--cor-texto-secundario))] text-sm font-medium mb-1">{stat.label}</h3>
            <p className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))]">{stat.valor}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-[rgb(var(--cor-superficie))] rounded-lg shadow-sm border border-[rgb(var(--cor-borda))] p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[rgb(var(--cor-icone))]" />
            <input
              type="text"
              disabled
              placeholder="Buscar por aluno ou título..."
              className="w-full pl-10 pr-4 py-2 border border-[rgb(var(--cor-borda))] rounded-lg bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-secundario))] cursor-not-allowed"
            />
          </div>
          <select
            disabled
            className="px-4 py-2 border border-[rgb(var(--cor-borda))] rounded-lg bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-secundario))] cursor-not-allowed"
          >
            <option>Todos os tipos</option>
            <option>Fase I</option>
            <option>Defesa Final</option>
          </select>
          <select
            disabled
            className="px-4 py-2 border border-[rgb(var(--cor-borda))] rounded-lg bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-secundario))] cursor-not-allowed"
          >
            <option>Todos os resultados</option>
            <option>Aprovado</option>
            <option>Aprovado com Ressalvas</option>
            <option>Reprovado</option>
          </select>
          <button
            disabled
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-secundario))] rounded-lg cursor-not-allowed"
          >
            <Filter className="h-4 w-4" />
            Filtros Avançados
          </button>
        </div>
      </div>

      {/* Histórico */}
      <div className="space-y-4">
        {historicoCompleto.map((item) => (
          <div key={item.id} className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-sm border border-[rgb(var(--cor-borda))] p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTipoColor(item.tipo)}`}>
                    {item.tipo}
                  </span>
                  {getResultadoBadge(item.resultado)}
                  <span className="text-xs text-[rgb(var(--cor-texto-secundario))]">{item.data}</span>
                </div>
                <h3 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))]">{item.aluno}</h3>
                <p className="text-sm text-[rgb(var(--cor-texto-secundario))]">{item.titulo}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[rgb(var(--cor-texto-secundario))]">Nota atribuída</p>
                <p className="text-2xl font-bold text-[rgb(var(--cor-sucesso))]">{item.nota.toFixed(1)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <strong className="text-sm text-[rgb(var(--cor-texto-primario))]">Orientador:</strong>
                <p className="text-sm text-[rgb(var(--cor-texto-primario))]">{item.orientador}</p>
              </div>
              <div>
                <strong className="text-sm text-[rgb(var(--cor-texto-primario))]">Data da Defesa:</strong>
                <p className="text-sm text-[rgb(var(--cor-texto-primario))]">{item.data}</p>
              </div>
            </div>

            <div className="p-3 bg-[rgb(var(--cor-fundo))]/50 rounded-lg mb-4">
              <p className="text-sm font-medium text-[rgb(var(--cor-texto-primario))] mb-1">Parecer:</p>
              <p className="text-sm text-[rgb(var(--cor-texto-secundario))]">{item.parecer}</p>
            </div>

            <div className="flex gap-2">
              <button
                disabled
                className="flex-1 px-4 py-2 bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-secundario))] rounded-lg cursor-not-allowed text-sm"
              >
                Ver Parecer Completo
              </button>
              <button
                disabled
                className="flex-1 px-4 py-2 bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-secundario))] rounded-lg cursor-not-allowed text-sm"
              >
                Baixar Documentos
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Paginação (visual-only) */}
      <div className="mt-6 flex justify-center gap-2">
        <button
          disabled
          className="px-3 py-2 border border-[rgb(var(--cor-borda))] rounded-lg bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-secundario))] cursor-not-allowed text-sm"
        >
          Anterior
        </button>
        <button className="px-3 py-2 border border-[rgb(var(--cor-sucesso))] rounded-lg bg-[rgb(var(--cor-sucesso))] text-white text-sm">
          1
        </button>
        <button
          disabled
          className="px-3 py-2 border border-[rgb(var(--cor-borda))] rounded-lg bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))] hover:bg-[rgb(var(--cor-fundo))]/50 text-sm cursor-not-allowed"
        >
          2
        </button>
        <button
          disabled
          className="px-3 py-2 border border-[rgb(var(--cor-borda))] rounded-lg bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))] hover:bg-[rgb(var(--cor-fundo))]/50 text-sm cursor-not-allowed"
        >
          3
        </button>
        <button
          disabled
          className="px-3 py-2 border border-[rgb(var(--cor-borda))] rounded-lg bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-secundario))] cursor-not-allowed text-sm"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
