import { useState, useEffect } from 'react';
import { obterPreferenciasEmail, atualizarPreferenciasEmail, type PreferenciasEmail } from '../servicos/preferencias';
import { obterPerfil, type PerfilUsuario } from '../servicos/usuarios';
import { useToast } from '../contextos/ToastProvider';

interface PreferenciaSwitchProps {
  label: string;
  descricao: string;
  checked: boolean;
  onChange: (valor: boolean) => void;
  disabled?: boolean;
}

function PreferenciaSwitch({ label, descricao, checked, onChange, disabled }: PreferenciaSwitchProps) {
  return (
    <div className="flex items-start justify-between p-3 bg-cor-fundo border border-cor-borda rounded-lg">
      <div className="flex-1">
        <label className="block text-sm font-medium text-cor-texto cursor-pointer">
          {label}
        </label>
        <p className="text-xs text-cor-texto-secundario mt-1">{descricao}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
          transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${checked ? 'bg-cor-destaque' : 'bg-gray-400'}
        `}
      >
        <span
          aria-hidden="true"
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0
            transition duration-200 ease-in-out
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
}

export function PreferenciasEmailCard() {
  const { sucesso, erro } = useToast();
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [preferenciasEmail, setPreferenciasEmail] = useState<PreferenciasEmail | null>(null);
  const [carregandoPreferencias, setCarregandoPreferencias] = useState(true);
  const [salvandoPreferencia, setSalvandoPreferencia] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [perfilData, preferenciasData] = await Promise.all([
        obterPerfil(),
        obterPreferenciasEmail(),
      ]);
      setPerfil(perfilData);
      setPreferenciasEmail(preferenciasData);
    } catch (err: any) {
      erro(err.message || 'Erro ao carregar dados');
    } finally {
      setCarregandoPreferencias(false);
    }
  };

  const handleTogglePreferencia = async (campo: keyof PreferenciasEmail, valor: boolean) => {
    if (!preferenciasEmail) return;

    try {
      setSalvandoPreferencia(true);

      // Atualizar estado local imediatamente para feedback visual
      setPreferenciasEmail({
        ...preferenciasEmail,
        [campo]: valor,
      });

      // Salvar no backend
      const dadosAtualizados = await atualizarPreferenciasEmail({
        [campo]: valor,
      });

      setPreferenciasEmail(dadosAtualizados);
      sucesso('Preferência atualizada com sucesso');
    } catch (err: any) {
      // Reverter em caso de erro
      await carregarDados();
      erro(err.message || 'Erro ao atualizar preferência');
    } finally {
      setSalvandoPreferencia(false);
    }
  };

  if (carregandoPreferencias) {
    return (
      <div className="bg-cor-superficie border border-cor-borda rounded-lg p-6">
        <div className="text-cor-texto-secundario">Carregando preferências...</div>
      </div>
    );
  }

  if (!preferenciasEmail || !perfil) {
    return null;
  }

  return (
    <div className="bg-cor-superficie border border-cor-borda rounded-lg p-6">
      <div className="space-y-6">

        {/* Preferências de Aluno */}
        {perfil.tipo_usuario === 'ALUNO' && (
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-cor-texto">Notificações de Aluno</h3>
            <div className="space-y-3">
              <PreferenciaSwitch
                label="Convite de orientação"
                descricao="Notificar quando solicitação de orientação for analisada"
                checked={preferenciasEmail.aluno_aceitar_convite_orientador}
                onChange={(valor) => handleTogglePreferencia('aluno_aceitar_convite_orientador', valor)}
                disabled={salvandoPreferencia}
              />
              <PreferenciaSwitch
                label="Ajustes na monografia"
                descricao="Notificar quando orientador solicitar ajustes na monografia"
                checked={preferenciasEmail.aluno_ajuste_monografia}
                onChange={(valor) => handleTogglePreferencia('aluno_ajuste_monografia', valor)}
                disabled={salvandoPreferencia}
              />
              <PreferenciaSwitch
                label="Termo de solicitação disponível"
                descricao="Notificar quando coordenador disponibilizar termo de solicitação"
                checked={preferenciasEmail.aluno_termo_disponivel}
                onChange={(valor) => handleTogglePreferencia('aluno_termo_disponivel', valor)}
                disabled={salvandoPreferencia}
              />
              <PreferenciaSwitch
                label="Decisão de continuidade"
                descricao="Notificar sobre decisão de continuidade do orientador"
                checked={preferenciasEmail.aluno_continuidade_aprovada}
                onChange={(valor) => handleTogglePreferencia('aluno_continuidade_aprovada', valor)}
                disabled={salvandoPreferencia}
              />
              <PreferenciaSwitch
                label="Resultado Fase I"
                descricao="Notificar quando resultado da Fase I estiver disponível"
                checked={preferenciasEmail.aluno_resultado_fase_1}
                onChange={(valor) => handleTogglePreferencia('aluno_resultado_fase_1', valor)}
                disabled={salvandoPreferencia}
              />
              <PreferenciaSwitch
                label="Agendamento de defesa"
                descricao="Notificar quando defesa for agendada"
                checked={preferenciasEmail.aluno_agendamento_defesa}
                onChange={(valor) => handleTogglePreferencia('aluno_agendamento_defesa', valor)}
                disabled={salvandoPreferencia}
              />
              <PreferenciaSwitch
                label="Finalização do TCC"
                descricao="Notificar quando TCC for finalizado"
                checked={preferenciasEmail.aluno_finalizacao_tcc}
                onChange={(valor) => handleTogglePreferencia('aluno_finalizacao_tcc', valor)}
                disabled={salvandoPreferencia}
              />
            </div>
          </div>
        )}

        {/* Preferências de Professor */}
        {perfil.tipo_usuario === 'PROFESSOR' && (
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-cor-texto">Notificações de Professor</h3>
            <div className="space-y-3">
              <PreferenciaSwitch
                label="Convite de orientação"
                descricao="Notificar quando orientação for aprovada"
                checked={preferenciasEmail.prof_convite_orientacao}
                onChange={(valor) => handleTogglePreferencia('prof_convite_orientacao', valor)}
                disabled={salvandoPreferencia}
              />
              <PreferenciaSwitch
                label="Recebimento de monografia"
                descricao="Notificar quando orientando enviar monografia"
                checked={preferenciasEmail.prof_receber_monografia}
                onChange={(valor) => handleTogglePreferencia('prof_receber_monografia', valor)}
                disabled={salvandoPreferencia}
              />
              <PreferenciaSwitch
                label="Lembrete de aprovação de continuidade"
                descricao="Notificar 1 dia antes da confirmação de continuidade"
                checked={preferenciasEmail.prof_continuidade_aprovada}
                onChange={(valor) => handleTogglePreferencia('prof_continuidade_aprovada', valor)}
                disabled={salvandoPreferencia}
              />
              <PreferenciaSwitch
                label="Lembrete de envio de termo de solicitação de avaliação"
                descricao="Notificar 1 dia antes do prazo limite de envio do termo de solicitação de avaliação"
                checked={preferenciasEmail.prof_lembrete_termo}
                onChange={(valor) => handleTogglePreferencia('prof_lembrete_termo', valor)}
                disabled={salvandoPreferencia}
              />
              <PreferenciaSwitch
                label="Participação em banca"
                descricao="Notificar quando for adicionado a uma banca"
                checked={preferenciasEmail.prof_participacao_banca}
                onChange={(valor) => handleTogglePreferencia('prof_participacao_banca', valor)}
                disabled={salvandoPreferencia}
              />
              <PreferenciaSwitch
                label="Resultado Fase I"
                descricao="Notificar quando todas avaliações da Fase I forem concluídas"
                checked={preferenciasEmail.prof_resultado_fase_1}
                onChange={(valor) => handleTogglePreferencia('prof_resultado_fase_1', valor)}
                disabled={salvandoPreferencia}
              />
              <PreferenciaSwitch
                label="Finalização do TCC"
                descricao="Notificar quando TCC de orientando for finalizado"
                checked={preferenciasEmail.prof_finalizacao_tcc}
                onChange={(valor) => handleTogglePreferencia('prof_finalizacao_tcc', valor)}
                disabled={salvandoPreferencia}
              />
            </div>
          </div>
        )}

        {/* Preferências de Avaliador Externo */}
        {perfil.tipo_usuario === 'AVALIADOR' && (
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-cor-texto">Notificações de Avaliador</h3>
            <div className="space-y-3">
              <PreferenciaSwitch
                label="Convite de co-orientação"
                descricao="Notificar quando co-orientação for aprovada"
                checked={preferenciasEmail.aval_convite_orientacao}
                onChange={(valor) => handleTogglePreferencia('aval_convite_orientacao', valor)}
                disabled={salvandoPreferencia}
              />
              <PreferenciaSwitch
                label="Recebimento de monografia"
                descricao="Notificar quando orientando enviar monografia"
                checked={preferenciasEmail.aval_receber_monografia}
                onChange={(valor) => handleTogglePreferencia('aval_receber_monografia', valor)}
                disabled={salvandoPreferencia}
              />
              <PreferenciaSwitch
                label="Participação em banca"
                descricao="Notificar quando for adicionado a uma banca"
                checked={preferenciasEmail.aval_participacao_banca}
                onChange={(valor) => handleTogglePreferencia('aval_participacao_banca', valor)}
                disabled={salvandoPreferencia}
              />
              <PreferenciaSwitch
                label="Resultado Fase I"
                descricao="Notificar quando todas avaliações da Fase I forem concluídas"
                checked={preferenciasEmail.aval_resultado_fase_1}
                onChange={(valor) => handleTogglePreferencia('aval_resultado_fase_1', valor)}
                disabled={salvandoPreferencia}
              />
              <PreferenciaSwitch
                label="Finalização do TCC"
                descricao="Notificar quando TCC de co-orientando for finalizado"
                checked={preferenciasEmail.aval_finalizacao_tcc}
                onChange={(valor) => handleTogglePreferencia('aval_finalizacao_tcc', valor)}
                disabled={salvandoPreferencia}
              />
            </div>
          </div>
        )}

        {/* Preferências de Coordenador */}
        {perfil.tipo_usuario === 'COORDENADOR' && (
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-cor-texto">Notificações do sistema</h3>
            <div className="space-y-3">
              <PreferenciaSwitch
                label="Convite de aluno"
                descricao="Notificar quando aluno solicitar orientação"
                checked={preferenciasEmail.coord_convite_aluno}
                onChange={(valor) => handleTogglePreferencia('coord_convite_aluno', valor)}
                disabled={salvandoPreferencia}
              />
              <PreferenciaSwitch
                label="Monografia aprovada"
                descricao="Notificar quando orientador aprovar monografia"
                checked={preferenciasEmail.coord_monografia_aprovada}
                onChange={(valor) => handleTogglePreferencia('coord_monografia_aprovada', valor)}
                disabled={salvandoPreferencia}
              />
              <PreferenciaSwitch
                label="Termo enviado"
                descricao="Notificar quando aluno enviar termo de solicitação"
                checked={preferenciasEmail.coord_termo_enviado}
                onChange={(valor) => handleTogglePreferencia('coord_termo_enviado', valor)}
                disabled={salvandoPreferencia}
              />
              <PreferenciaSwitch
                label="Decisão de continuidade"
                descricao="Notificar quando orientador aprovar/rejeitar continuidade"
                checked={preferenciasEmail.coord_continuidade_aprovada}
                onChange={(valor) => handleTogglePreferencia('coord_continuidade_aprovada', valor)}
                disabled={salvandoPreferencia}
              />
              <PreferenciaSwitch
                label="Resultado Fase I"
                descricao="Notificar quando resultado da Fase I estiver disponível"
                checked={preferenciasEmail.coord_avaliacoes_fase1_completas}
                onChange={(valor) => handleTogglePreferencia('coord_avaliacoes_fase1_completas', valor)}
                disabled={salvandoPreferencia}
              />
              <PreferenciaSwitch
                label="Finalização do TCC"
                descricao="Notificar quando TCC for finalizado"
                checked={preferenciasEmail.coord_avaliacoes_fase2_completas}
                onChange={(valor) => handleTogglePreferencia('coord_avaliacoes_fase2_completas', valor)}
                disabled={salvandoPreferencia}
              />
              <PreferenciaSwitch
                label="Defesa agendada"
                descricao="Notificar quando defesa for agendada"
                checked={preferenciasEmail.coord_defesa_agendada}
                onChange={(valor) => handleTogglePreferencia('coord_defesa_agendada', valor)}
                disabled={salvandoPreferencia}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
