import React from 'react';
import { Calendar, Clock, MapPin, Filter, Search } from 'lucide-react';

export function CronogramaAvaliacoes() {
  const [visualizacao, setVisualizacao] = React.useState<'lista' | 'calendario'>('lista');

  // Dados mockados (visual-only)
  const avaliacoes = [
    {
      id: 1,
      tipo: 'Fase I',
      aluno: 'Pedro Costa',
      titulo: 'Otimização de Redes de Distribuição Elétrica',
      orientador: 'Prof. Dr. José Silva',
      data: '22/04/2025',
      hora: '14:00',
      local: 'Sala 301 - Bloco A',
      status: 'confirmada',
      banca: ['Prof. Dr. Ana Lima', 'Prof. Dr. Roberto Souza', 'Você'],
      documentos: ['Monografia', 'Apresentação', 'Termo de Aceite'],
    },
    {
      id: 2,
      tipo: 'Defesa Final',
      aluno: 'Carla Mendes',
      titulo: 'Desenvolvimento de Sistema de Monitoramento Industrial',
      orientador: 'Prof. Dr. Marcos Silva',
      data: '28/04/2025',
      hora: '10:00',
      local: 'Auditório Central',
      status: 'confirmada',
      banca: ['Prof. Dr. Marcos Silva', 'Você', 'Dra. Paula Costa'],
      documentos: ['Monografia Final', 'Apresentação', 'Artigo'],
    },
    {
      id: 3,
      tipo: 'Fase I',
      aluno: 'Ana Paula Santos',
      titulo: 'Aplicação de Machine Learning em Manutenção Preditiva',
      orientador: 'Profa. Dra. Juliana Lima',
      data: '05/05/2025',
      hora: '16:00',
      local: 'Sala 205 - Bloco B',
      status: 'pendente_confirmacao',
      banca: ['Profa. Dra. Juliana Lima', 'Prof. Dr. Carlos Oliveira', 'Você'],
      documentos: ['Monografia Preliminar', 'Apresentação'],
    },
    {
      id: 4,
      tipo: 'Fase I',
      aluno: 'Ricardo Alves',
      titulo: 'Inteligência Artificial Aplicada a Diagnósticos Médicos',
      orientador: 'Prof. Dr. Fernando Costa',
      data: '12/05/2025',
      hora: '14:30',
      local: 'Sala 102 - Bloco C',
      status: 'pendente_confirmacao',
      banca: ['Prof. Dr. Fernando Costa', 'Você', 'Dra. Beatriz Lima'],
      documentos: ['Monografia', 'Apresentação'],
    },
  ];

  const getStatusBadge = (status: string) => {
    if (status === 'confirmada') {
      return <span className="px-2 py-1 bg-[rgb(var(--cor-sucesso))]/10 text-[rgb(var(--cor-sucesso))] rounded text-xs font-medium">Confirmada</span>;
    }
    if (status === 'pendente_confirmacao') {
      return <span className="px-2 py-1 bg-[rgb(var(--cor-alerta))]/10 text-[rgb(var(--cor-alerta))] rounded text-xs font-medium">Pendente Confirmação</span>;
    }
    if (status === 'cancelada') {
      return <span className="px-2 py-1 bg-[rgb(var(--cor-erro))]/10 text-[rgb(var(--cor-erro))] rounded text-xs font-medium">Cancelada</span>;
    }
    return <span className="px-2 py-1 bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-primario))] rounded text-xs font-medium">-</span>;
  };

  const getTipoColor = (tipo: string) => {
    if (tipo === 'Fase I') return 'text-[rgb(var(--cor-info))] bg-[rgb(var(--cor-info))]/10';
    if (tipo === 'Defesa Final') return 'text-[rgb(var(--cor-destaque))] bg-[rgb(var(--cor-destaque))]/10';
    return 'text-[rgb(var(--cor-texto-primario))] bg-[rgb(var(--cor-fundo))]';
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))] flex items-center gap-2">
          <Calendar className="h-7 w-7 text-[rgb(var(--cor-sucesso))]" />
          Cronograma de Avaliações
        </h1>
        <p className="text-[rgb(var(--cor-texto-secundario))] mt-1">Visualize e gerencie suas participações em bancas</p>
      </div>

      {/* Filtros e Controles */}
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
            <option>Todos os status</option>
            <option>Confirmada</option>
            <option>Pendente Confirmação</option>
            <option>Cancelada</option>
          </select>
          <button
            disabled
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-secundario))] rounded-lg cursor-not-allowed"
          >
            <Filter className="h-4 w-4" />
            Filtros Avançados
          </button>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setVisualizacao('lista')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              visualizacao === 'lista'
                ? 'bg-[rgb(var(--cor-sucesso))] text-white'
                : 'bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-primario))] hover:bg-[rgb(var(--cor-fundo))]/50'
            }`}
          >
            Lista
          </button>
          <button
            onClick={() => setVisualizacao('calendario')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              visualizacao === 'calendario'
                ? 'bg-[rgb(var(--cor-sucesso))] text-white'
                : 'bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-primario))] hover:bg-[rgb(var(--cor-fundo))]/50'
            }`}
          >
            Calendário
          </button>
        </div>
      </div>

      {/* Lista de Avaliações */}
      {visualizacao === 'lista' ? (
        <div className="space-y-4">
          {avaliacoes.map((avaliacao) => (
            <div key={avaliacao.id} className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-sm border border-[rgb(var(--cor-borda))] p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTipoColor(avaliacao.tipo)}`}>
                      {avaliacao.tipo}
                    </span>
                    {getStatusBadge(avaliacao.status)}
                  </div>
                  <h3 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))]">{avaliacao.aluno}</h3>
                  <p className="text-sm text-[rgb(var(--cor-texto-secundario))]">{avaliacao.titulo}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-[rgb(var(--cor-icone))]" />
                  <div>
                    <p className="text-[rgb(var(--cor-texto-secundario))]">Data</p>
                    <p className="font-medium text-[rgb(var(--cor-texto-primario))]">{avaliacao.data}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-[rgb(var(--cor-icone))]" />
                  <div>
                    <p className="text-[rgb(var(--cor-texto-secundario))]">Horário</p>
                    <p className="font-medium text-[rgb(var(--cor-texto-primario))]">{avaliacao.hora}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-[rgb(var(--cor-icone))]" />
                  <div>
                    <p className="text-[rgb(var(--cor-texto-secundario))]">Local</p>
                    <p className="font-medium text-[rgb(var(--cor-texto-primario))]">{avaliacao.local}</p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-[rgb(var(--cor-texto-secundario))] mb-2">
                  <strong>Orientador:</strong> {avaliacao.orientador}
                </p>
                <div className="mb-2">
                  <p className="text-sm font-medium text-[rgb(var(--cor-texto-primario))] mb-1">Banca:</p>
                  <div className="flex flex-wrap gap-1">
                    {avaliacao.banca.map((membro, idx) => (
                      <span key={idx} className="px-2 py-1 bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-primario))] rounded text-xs">
                        {membro}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-[rgb(var(--cor-texto-primario))] mb-1">Documentos:</p>
                  <div className="flex flex-wrap gap-1">
                    {avaliacao.documentos.map((doc, idx) => (
                      <span key={idx} className="px-2 py-1 bg-[rgb(var(--cor-destaque))]/10 text-[rgb(var(--cor-destaque))] rounded text-xs">
                        📄 {doc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  disabled
                  className="flex-1 px-4 py-2 bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-secundario))] rounded-lg cursor-not-allowed"
                >
                  Ver Documentos
                </button>
                {avaliacao.status === 'pendente_confirmacao' && (
                  <button
                    disabled
                    className="flex-1 px-4 py-2 bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-secundario))] rounded-lg cursor-not-allowed"
                  >
                    Confirmar Presença
                  </button>
                )}
                <button
                  disabled
                  className="flex-1 px-4 py-2 bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-secundario))] rounded-lg cursor-not-allowed"
                >
                  Preencher Parecer
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Visualização de Calendário (placeholder) */
        <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-sm border border-[rgb(var(--cor-borda))] p-8">
          <div className="text-center">
            <Calendar className="h-16 w-16 text-[rgb(var(--cor-icone))]/50 mx-auto mb-4" />
            <p className="text-[rgb(var(--cor-texto-secundario))]">Visualização de calendário (modo visual-only)</p>
            <p className="text-sm text-[rgb(var(--cor-texto-secundario))]/70 mt-2">
              As avaliações seriam exibidas em um calendário mensal interativo
            </p>
          </div>
          <div className="mt-6 grid grid-cols-7 gap-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia, index) => (
              <div key={index} className="text-center font-semibold text-[rgb(var(--cor-texto-primario))] text-sm p-2">
                {dia}
              </div>
            ))}
            {Array.from({ length: 35 }, (_, i) => (
              <div
                key={i}
                className="aspect-square border border-[rgb(var(--cor-borda))] rounded p-2 text-sm text-[rgb(var(--cor-texto-secundario))] hover:bg-[rgb(var(--cor-fundo))]/50"
              >
                {i > 4 && i < 33 ? i - 4 : ''}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
