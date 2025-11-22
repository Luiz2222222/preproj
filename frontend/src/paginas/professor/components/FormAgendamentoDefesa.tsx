import { useState, useEffect } from 'react';
import { agendarDefesa, obterAgendamentoDefesa } from '../../../servicos/fase2';
import type { AgendamentoDefesaInput, AgendamentoDefesa } from '../../../servicos/fase2';

interface FormAgendamentoDefesaProps {
  tccId: number;
  onSucesso?: () => void;
}

export default function FormAgendamentoDefesa({ tccId, onSucesso }: FormAgendamentoDefesaProps) {
  const [carregando, setCarregando] = useState(false);
  const [agendamentoExistente, setAgendamentoExistente] = useState<AgendamentoDefesa | null>(null);
  const [dados, setDados] = useState<AgendamentoDefesaInput>({
    data: '',
    hora: '',
    local: '',
  });
  const [erro, setErro] = useState<string | null>(null);

  // Carregar agendamento existente (se houver)
  useEffect(() => {
    const carregarAgendamento = async () => {
      try {
        const agendamento = await obterAgendamentoDefesa(tccId);

        // Se existe agendamento, preencher formulário
        if (agendamento) {
          setAgendamentoExistente(agendamento);
          setDados({
            data: agendamento.data,
            hora: agendamento.hora.substring(0, 5), // HH:MM:SS -> HH:MM
            local: agendamento.local,
          });
        }
      } catch (error: any) {
        console.error('Erro ao carregar agendamento:', error);
      }
    };

    carregarAgendamento();
  }, [tccId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      // Validações
      if (!dados.data || !dados.hora || !dados.local.trim()) {
        setErro('Todos os campos são obrigatórios');
        setCarregando(false);
        return;
      }

      // Validar que data/hora não está no passado
      const agora = new Date();
      const dataHoraAgendamento = new Date(`${dados.data}T${dados.hora}`);

      if (dataHoraAgendamento < agora) {
        setErro('Data/hora do agendamento não pode ser no passado');
        setCarregando(false);
        return;
      }

      const agendamento = await agendarDefesa(tccId, dados);

      // Atualizar estado local com o agendamento criado/atualizado
      setAgendamentoExistente(agendamento);

      // Sincronizar formulário com os dados retornados do backend
      // (backend pode normalizar hora para HH:MM:SS, então extraímos HH:MM)
      setDados({
        data: agendamento.data,
        hora: agendamento.hora.substring(0, 5), // HH:MM:SS -> HH:MM
        local: agendamento.local,
      });

      if (onSucesso) {
        onSucesso();
      }
    } catch (error: any) {
      console.error('Erro ao agendar defesa:', error);
      setErro(error.response?.data?.detail || 'Erro ao agendar defesa');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="bg-cor-superficie p-6 rounded-lg border border-cor-borda">
      <h3 className="text-lg font-semibold text-cor-texto mb-4">
        {agendamentoExistente ? 'Editar Agendamento de Defesa' : 'Agendar Defesa'}
      </h3>

      {erro && (
        <div className="mb-4 p-3 bg-cor-erro/10 border border-cor-erro rounded text-cor-erro text-sm">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Data */}
        <div>
          <label htmlFor="data" className="block text-sm font-medium text-cor-texto mb-1">
            Data da Defesa *
          </label>
          <input
            type="date"
            id="data"
            value={dados.data}
            onChange={(e) => setDados({ ...dados, data: e.target.value })}
            className="w-full px-3 py-2 border border-cor-borda rounded-md focus:outline-none focus:ring-2 focus:ring-cor-destaque bg-cor-fundo text-cor-texto"
            required
            disabled={carregando}
          />
        </div>

        {/* Horário */}
        <div>
          <label htmlFor="hora" className="block text-sm font-medium text-cor-texto mb-1">
            Horário da Defesa *
          </label>
          <input
            type="time"
            id="hora"
            value={dados.hora}
            onChange={(e) => setDados({ ...dados, hora: e.target.value })}
            className="w-full px-3 py-2 border border-cor-borda rounded-md focus:outline-none focus:ring-2 focus:ring-cor-destaque bg-cor-fundo text-cor-texto"
            required
            disabled={carregando}
          />
        </div>

        {/* Local */}
        <div>
          <label htmlFor="local" className="block text-sm font-medium text-cor-texto mb-1">
            Local da Defesa *
          </label>
          <input
            type="text"
            id="local"
            value={dados.local}
            onChange={(e) => setDados({ ...dados, local: e.target.value })}
            placeholder="Ex: Sala 301, Auditório, Link Zoom"
            className="w-full px-3 py-2 border border-cor-borda rounded-md focus:outline-none focus:ring-2 focus:ring-cor-destaque bg-cor-fundo text-cor-texto placeholder-cor-texto/50"
            required
            disabled={carregando}
          />
          <p className="mt-1 text-xs text-cor-texto/60">
            Informe a sala, auditório ou link online para a defesa
          </p>
        </div>

        {/* Botão de Submit */}
        <button
          type="submit"
          disabled={carregando}
          className="w-full bg-cor-destaque text-white py-2 px-4 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {carregando
            ? 'Salvando...'
            : agendamentoExistente
            ? 'Atualizar Agendamento'
            : 'Confirmar Agendamento'}
        </button>
      </form>

      {agendamentoExistente && (
        <div className="mt-4 p-3 bg-cor-alerta/10 border border-cor-alerta rounded text-sm text-cor-alerta">
          <strong>Atenção:</strong> Você pode editar o agendamento enquanto:
          <ul className="mt-1 ml-4 list-disc">
            <li>As avaliações da Fase II não estiverem todas bloqueadas</li>
            <li>OU o prazo de defesa não tiver expirado</li>
          </ul>
        </div>
      )}
    </div>
  );
}
