import { Calendar, FileText, CheckCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react';

export function DashboardAvaliador() {
  // Mapa de cores PT-BR para classes Tailwind
  const mapaGradiente = {
    verde: 'bg-[rgb(var(--cor-sucesso))]',
    amarelo: 'bg-[rgb(var(--cor-alerta))]',
    azul: 'bg-[rgb(var(--cor-destaque))]',
    roxo: 'bg-[rgb(var(--cor-info))]',
  };

  // Dados mockados (visual-only)
  const stats = [
    { title: 'Defesas Agendadas', value: '3', change: '2 próximas 7 dias', icon: Calendar, cor: 'verde' as const },
    { title: 'Pareceres Pendentes', value: '2', change: 'Prazos próximos', icon: Clock, cor: 'amarelo' as const },
    { title: 'Avaliações Concluídas', value: '12', change: 'Este semestre', icon: CheckCircle, cor: 'azul' as const },
    { title: 'Total Participações', value: '45', change: 'Desde 2020', icon: TrendingUp, cor: 'roxo' as const },
  ];

  const defesasProximas = [
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
      urgencia: 'proxima',
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
      urgencia: 'normal',
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
      urgencia: 'normal',
    },
  ];

  const pareceresPendentes = [
    {
      id: 1,
      aluno: 'Ricardo Alves',
      titulo: 'Inteligência Artificial Aplicada a Diagnósticos Médicos',
      tipo: 'Fase I',
      prazo: '15/04/2025',
      urgente: true,
    },
    {
      id: 2,
      aluno: 'Beatriz Santos',
      titulo: 'Otimização Energética em Edifícios Inteligentes',
      tipo: 'Defesa Final',
      prazo: '20/04/2025',
      urgente: false,
    },
  ];

  const documentosRecentes = [
    { nome: 'Monografia - Pedro Costa.pdf', tipo: 'Monografia', data: '18/04/2025', status: 'novo' },
    { nome: 'Apresentação - Carla Mendes.pdf', tipo: 'Apresentação', data: '19/04/2025', status: 'novo' },
    { nome: 'Ata de Defesa - João Silva.pdf', tipo: 'Ata', data: '10/04/2025', status: 'lido' },
  ];

  const getStatusBadge = (status: string) => {
    if (status === 'confirmada') {
      return <span className="px-2 py-1 bg-[rgb(var(--cor-sucesso))]/10 text-[rgb(var(--cor-sucesso))] rounded text-xs font-medium">Confirmada</span>;
    }
    if (status === 'pendente_confirmacao') {
      return <span className="px-2 py-1 bg-[rgb(var(--cor-alerta))]/10 text-[rgb(var(--cor-alerta))] rounded text-xs font-medium">Pendente Confirmação</span>;
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
        <h1 className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))]">Dashboard - Avaliador Externo</h1>
        <p className="text-[rgb(var(--cor-texto-secundario))]">Acompanhe suas avaliações e participações em bancas</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((card, index) => (
          <div key={index} className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-sm border border-[rgb(var(--cor-borda))] p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${mapaGradiente[card.cor]}`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm text-[rgb(var(--cor-texto-secundario))]">{card.change}</span>
            </div>
            <h3 className="text-[rgb(var(--cor-texto-secundario))] text-sm font-medium mb-1">{card.title}</h3>
            <p className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))]">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Defesas Próximas */}
        <div className="lg:col-span-2 bg-[rgb(var(--cor-superficie))] rounded-xl shadow-sm border border-[rgb(var(--cor-borda))] p-6">
          <h2 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))] mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[rgb(var(--cor-icone))]" />
            Defesas Próximas
          </h2>
          <div className="space-y-3">
            {defesasProximas.map((defesa) => (
              <div
                key={defesa.id}
                className={`border rounded-lg p-4 ${
                  defesa.urgencia === 'proxima' ? 'border-[rgb(var(--cor-sucesso))]/30 bg-[rgb(var(--cor-sucesso))]/5' : 'border-[rgb(var(--cor-borda))]'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getTipoColor(defesa.tipo)}`}>
                        {defesa.tipo}
                      </span>
                      {getStatusBadge(defesa.status)}
                      {defesa.urgencia === 'proxima' && (
                        <span className="px-2 py-1 bg-[rgb(var(--cor-sucesso))]/10 text-[rgb(var(--cor-sucesso))] rounded text-xs font-medium">
                          Próxima
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-[rgb(var(--cor-texto-primario))] text-sm">{defesa.aluno}</h3>
                    <p className="text-xs text-[rgb(var(--cor-texto-secundario))]">{defesa.titulo}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-[rgb(var(--cor-texto-secundario))] mt-2">
                  <div>
                    <strong>Data:</strong> {defesa.data}
                  </div>
                  <div>
                    <strong>Hora:</strong> {defesa.hora}
                  </div>
                  <div className="col-span-2">
                    <strong>Local:</strong> {defesa.local}
                  </div>
                  <div className="col-span-2">
                    <strong>Orientador:</strong> {defesa.orientador}
                  </div>
                </div>
                <button
                  disabled
                  className="w-full mt-3 px-3 py-2 bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-secundario))] rounded-lg cursor-not-allowed text-sm"
                >
                  Ver Detalhes
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Pareceres Pendentes */}
        <div className="lg:col-span-1 bg-[rgb(var(--cor-superficie))] rounded-xl shadow-sm border border-[rgb(var(--cor-borda))] p-6">
          <h2 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))] mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-[rgb(var(--cor-alerta))]" />
            Pareceres Pendentes
          </h2>
          <div className="space-y-3">
            {pareceresPendentes.map((parecer) => (
              <div
                key={parecer.id}
                className={`p-3 rounded-lg border ${
                  parecer.urgente ? 'bg-[rgb(var(--cor-erro))]/5 border-[rgb(var(--cor-erro))]/20' : 'bg-[rgb(var(--cor-alerta))]/5 border-[rgb(var(--cor-alerta))]/20'
                }`}
              >
                <span className={`px-2 py-1 rounded text-xs font-medium ${getTipoColor(parecer.tipo)}`}>
                  {parecer.tipo}
                </span>
                <p className="text-sm font-medium text-[rgb(var(--cor-texto-primario))] mt-2">{parecer.aluno}</p>
                <p className="text-xs text-[rgb(var(--cor-texto-secundario))] mb-2">{parecer.titulo}</p>
                <p className={`text-xs ${parecer.urgente ? 'text-[rgb(var(--cor-erro))]' : 'text-[rgb(var(--cor-alerta))]'}`}>
                  {parecer.urgente ? 'Urgente - ' : 'Prazo: '}
                  {parecer.prazo}
                </p>
                <button
                  disabled
                  className="w-full mt-2 px-3 py-2 bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-secundario))] rounded-lg cursor-not-allowed text-xs"
                >
                  Preencher Parecer
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Documentos Recentes */}
      <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-sm border border-[rgb(var(--cor-borda))] p-6">
        <h2 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))] mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-[rgb(var(--cor-icone))]" />
          Documentos Recentes
        </h2>
        <div className="space-y-2">
          {documentosRecentes.map((doc, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border border-[rgb(var(--cor-borda))] rounded-lg hover:bg-[rgb(var(--cor-fundo))]/50"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-[rgb(var(--cor-icone))]" />
                <div>
                  <p className="text-sm font-medium text-[rgb(var(--cor-texto-primario))]">{doc.nome}</p>
                  <p className="text-xs text-[rgb(var(--cor-texto-secundario))]">
                    {doc.tipo} • {doc.data}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {doc.status === 'novo' && (
                  <span className="px-2 py-1 bg-[rgb(var(--cor-destaque))]/10 text-[rgb(var(--cor-destaque))] rounded text-xs font-medium">Novo</span>
                )}
                <button
                  disabled
                  className="px-3 py-1 bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-secundario))] rounded cursor-not-allowed text-xs"
                >
                  Baixar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
