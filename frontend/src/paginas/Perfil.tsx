import { useState, useEffect } from 'react';
import { User, Lock, AlertCircle, Save, Mail } from 'lucide-react';
import { obterPerfil, alterarSenha, atualizarPerfilCoordenador, type PerfilUsuario, type AlterarSenhaData, type AtualizarPerfilCoordenadorData } from '../servicos/usuarios';
import { obterPreferenciasEmail, atualizarPreferenciasEmail, type PreferenciasEmail } from '../servicos/preferencias';
import { useToast } from '../contextos/ToastProvider';
import { formatarCurso } from '../utils/formatadores';
import { ModalConfirmarSenha } from '../componentes/ModalConfirmarSenha';

export function Perfil() {
  const { sucesso, erro } = useToast();
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [alterandoSenha, setAlterandoSenha] = useState(false);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [mostrarModalSenha, setMostrarModalSenha] = useState(false);

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  // Estados para dados editáveis do coordenador
  const [dadosEditaveis, setDadosEditaveis] = useState({
    nome_completo: '',
    email: '',
    tratamento: '',
    tratamento_customizado: '',
    departamento: '',
  });

  // Estados para preferências de e-mail
  const [preferenciasEmail, setPreferenciasEmail] = useState<PreferenciasEmail | null>(null);
  const [carregandoPreferencias, setCarregandoPreferencias] = useState(false);
  const [salvandoPreferencia, setSalvandoPreferencia] = useState(false);

  useEffect(() => {
    carregarPerfil();
    carregarPreferenciasEmail();
  }, []);

  const carregarPerfil = async () => {
    try {
      setCarregando(true);
      const dados = await obterPerfil();
      setPerfil(dados);

      // Preencher dados editáveis se for coordenador
      if (dados.tipo_usuario === 'COORDENADOR') {
        setDadosEditaveis({
          nome_completo: dados.nome_completo || '',
          email: dados.email || '',
          tratamento: dados.tratamento || '',
          tratamento_customizado: dados.tratamento_customizado || '',
          departamento: dados.departamento || '',
        });
      }
    } catch (err: any) {
      erro(err.message || 'Erro ao carregar perfil');
    } finally {
      setCarregando(false);
    }
  };

  const handleAlterarSenha = async (e: React.FormEvent) => {
    e.preventDefault();

    if (novaSenha !== confirmarSenha) {
      erro('As senhas não coincidem');
      return;
    }

    try {
      setAlterandoSenha(true);
      const dados: AlterarSenhaData = {
        senha_atual: senhaAtual,
        nova_senha: novaSenha,
        confirmar_senha: confirmarSenha,
      };

      await alterarSenha(dados);
      sucesso('Senha alterada com sucesso');

      // Limpar campos
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
    } catch (err: any) {
      erro(err.message || 'Erro ao alterar senha');
    } finally {
      setAlterandoSenha(false);
    }
  };

  const handleSalvarPerfil = () => {
    // Validações básicas
    if (!dadosEditaveis.nome_completo.trim()) {
      erro('Nome completo é obrigatório');
      return;
    }
    if (!dadosEditaveis.email.trim()) {
      erro('E-mail é obrigatório');
      return;
    }
    if (!dadosEditaveis.tratamento) {
      erro('Tratamento é obrigatório');
      return;
    }
    if (dadosEditaveis.tratamento === 'Outro' && !dadosEditaveis.tratamento_customizado.trim()) {
      erro('Tratamento customizado é obrigatório quando seleciona "Outro"');
      return;
    }
    if (!dadosEditaveis.departamento) {
      erro('Departamento é obrigatório');
      return;
    }

    // Abrir modal para confirmar senha
    setMostrarModalSenha(true);
  };

  const handleConfirmarSenha = async (senha: string) => {
    try {
      setSalvandoPerfil(true);

      const dadosAtualizacao: AtualizarPerfilCoordenadorData = {
        nome_completo: dadosEditaveis.nome_completo,
        email: dadosEditaveis.email,
        tratamento: dadosEditaveis.tratamento,
        departamento: dadosEditaveis.departamento,
        senha_atual: senha,
      };

      // Adicionar tratamento_customizado se "Outro" foi selecionado
      if (dadosEditaveis.tratamento === 'Outro') {
        dadosAtualizacao.tratamento_customizado = dadosEditaveis.tratamento_customizado;
      }

      const perfilAtualizado = await atualizarPerfilCoordenador(dadosAtualizacao);
      setPerfil(perfilAtualizado);

      // Atualizar também dadosEditaveis com os valores retornados
      setDadosEditaveis({
        nome_completo: perfilAtualizado.nome_completo || '',
        email: perfilAtualizado.email || '',
        tratamento: perfilAtualizado.tratamento || '',
        tratamento_customizado: perfilAtualizado.tratamento_customizado || '',
        departamento: perfilAtualizado.departamento || '',
      });

      sucesso('Perfil atualizado com sucesso');
      setMostrarModalSenha(false);
    } catch (err: any) {
      erro(err.message || 'Erro ao atualizar perfil');
    } finally {
      setSalvandoPerfil(false);
    }
  };

  const carregarPreferenciasEmail = async () => {
    try {
      setCarregandoPreferencias(true);
      const dados = await obterPreferenciasEmail();
      setPreferenciasEmail(dados);
    } catch (err: any) {
      erro(err.message || 'Erro ao carregar preferências de e-mail');
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
      await carregarPreferenciasEmail();
      erro(err.message || 'Erro ao atualizar preferência');
    } finally {
      setSalvandoPreferencia(false);
    }
  };

  const getTipoUsuarioDisplay = (tipo: string) => {
    const tipos: Record<string, string> = {
      'ALUNO': 'Aluno',
      'PROFESSOR': 'Professor',
      'COORDENADOR': 'Coordenador',
      'AVALIADOR': 'Avaliador Externo'
    };
    return tipos[tipo] || tipo;
  };

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-cor-texto">Carregando...</div>
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-cor-texto">Erro ao carregar perfil</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Título */}
      <div>
        <h1 className="text-3xl font-bold text-cor-texto">Meu Perfil</h1>
        <p className="text-cor-texto-secundario mt-1">
          Visualize seus dados e altere sua senha
        </p>
      </div>

      {/* Card de Dados do Usuário */}
      <div className="bg-cor-superficie border border-cor-borda rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <User className="h-6 w-6 text-cor-icone" />
            <h2 className="text-xl font-semibold text-cor-texto">Dados Cadastrais</h2>
          </div>
          {perfil.tipo_usuario === 'COORDENADOR' && (
            <button
              onClick={handleSalvarPerfil}
              disabled={salvandoPerfil}
              className="flex items-center gap-2 px-4 py-2 bg-cor-destaque text-[rgb(var(--cor-texto-sobre-destaque))] rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              {salvandoPerfil ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nome Completo */}
          <div>
            <label className="block text-sm font-medium text-cor-texto-secundario mb-1">
              Nome Completo
            </label>
            {perfil.tipo_usuario === 'COORDENADOR' ? (
              <input
                type="text"
                value={dadosEditaveis.nome_completo}
                onChange={(e) => setDadosEditaveis({ ...dadosEditaveis, nome_completo: e.target.value })}
                className="w-full px-4 py-2 bg-cor-fundo border border-cor-borda rounded-lg text-cor-texto focus:outline-none focus:ring-2 focus:ring-[rgb(var(--cor-destaque))]"
              />
            ) : (
              <div className="px-4 py-2 bg-cor-fundo border border-cor-borda rounded-lg text-cor-texto opacity-60">
                {perfil.nome_completo}
              </div>
            )}
          </div>

          {/* E-mail */}
          <div>
            <label className="block text-sm font-medium text-cor-texto-secundario mb-1">
              E-mail
            </label>
            {perfil.tipo_usuario === 'COORDENADOR' ? (
              <input
                type="email"
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="none"
                value={dadosEditaveis.email}
                onChange={(e) => setDadosEditaveis({ ...dadosEditaveis, email: e.target.value })}
                className="w-full px-4 py-2 bg-cor-fundo border border-cor-borda rounded-lg text-cor-texto focus:outline-none focus:ring-2 focus:ring-[rgb(var(--cor-destaque))]"
              />
            ) : (
              <div className="px-4 py-2 bg-cor-fundo border border-cor-borda rounded-lg text-cor-texto opacity-60">
                {perfil.email}
              </div>
            )}
          </div>

          {/* Tipo de Usuário */}
          <div>
            <label className="block text-sm font-medium text-cor-texto-secundario mb-1">
              Tipo de Usuário
            </label>
            <div className="px-4 py-2 bg-cor-fundo border border-cor-borda rounded-lg text-cor-texto opacity-60">
              {getTipoUsuarioDisplay(perfil.tipo_usuario)}
            </div>
          </div>

          {/* Tratamento (apenas para coordenador) */}
          {perfil.tipo_usuario === 'COORDENADOR' && (
            <div>
              <label className="block text-sm font-medium text-cor-texto-secundario mb-1">
                Tratamento
              </label>
              <select
                value={dadosEditaveis.tratamento}
                onChange={(e) => setDadosEditaveis({ ...dadosEditaveis, tratamento: e.target.value })}
                className="w-full px-4 py-2 bg-cor-fundo border border-cor-borda rounded-lg text-cor-texto focus:outline-none focus:ring-2 focus:ring-[rgb(var(--cor-destaque))]"
              >
                <option value="">Selecione...</option>
                <option value="Prof. Dr.">Prof. Dr.</option>
                <option value="Prof. Ms.">Prof. Ms.</option>
                <option value="Prof.">Prof.</option>
                <option value="Dr.">Dr.</option>
                <option value="Eng.">Eng.</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
          )}

          {/* Tratamento Customizado (apenas se "Outro" for selecionado) */}
          {perfil.tipo_usuario === 'COORDENADOR' && dadosEditaveis.tratamento === 'Outro' && (
            <div>
              <label className="block text-sm font-medium text-cor-texto-secundario mb-1">
                Tratamento Customizado
              </label>
              <input
                type="text"
                value={dadosEditaveis.tratamento_customizado}
                onChange={(e) => setDadosEditaveis({ ...dadosEditaveis, tratamento_customizado: e.target.value })}
                className="w-full px-4 py-2 bg-cor-fundo border border-cor-borda rounded-lg text-cor-texto focus:outline-none focus:ring-2 focus:ring-[rgb(var(--cor-destaque))]"
                placeholder="Ex: M.Sc., Ph.D., etc."
              />
            </div>
          )}

          {/* Departamento (apenas para coordenador) */}
          {perfil.tipo_usuario === 'COORDENADOR' && (
            <div>
              <label className="block text-sm font-medium text-cor-texto-secundario mb-1">
                Departamento
              </label>
              <select
                value={dadosEditaveis.departamento}
                onChange={(e) => setDadosEditaveis({ ...dadosEditaveis, departamento: e.target.value })}
                className="w-full px-4 py-2 bg-cor-fundo border border-cor-borda rounded-lg text-cor-texto focus:outline-none focus:ring-2 focus:ring-[rgb(var(--cor-destaque))]"
              >
                <option value="">Selecione...</option>
                <option value="Departamento de Engenharia Elétrica">Departamento de Engenharia Elétrica</option>
                <option value="Departamento de Controle e Automação">Departamento de Controle e Automação</option>
              </select>
            </div>
          )}

          {/* Curso (apenas para aluno) */}
          {perfil.curso && (
            <div>
              <label className="block text-sm font-medium text-cor-texto-secundario mb-1">
                Curso
              </label>
              <div className="px-4 py-2 bg-cor-fundo border border-cor-borda rounded-lg text-cor-texto opacity-60">
                {perfil.curso_display || formatarCurso(perfil.curso)}
              </div>
            </div>
          )}

          {/* Departamento (apenas para professor - read-only) */}
          {perfil.tipo_usuario === 'PROFESSOR' && perfil.departamento && (
            <div>
              <label className="block text-sm font-medium text-cor-texto-secundario mb-1">
                Departamento
              </label>
              <div className="px-4 py-2 bg-cor-fundo border border-cor-borda rounded-lg text-cor-texto opacity-60">
                {perfil.departamento}
              </div>
            </div>
          )}

          {/* Afiliação (apenas para avaliador) */}
          {perfil.afiliacao && (
            <div>
              <label className="block text-sm font-medium text-cor-texto-secundario mb-1">
                Afiliação
              </label>
              <div className="px-4 py-2 bg-cor-fundo border border-cor-borda rounded-lg text-cor-texto opacity-60">
                {perfil.afiliacao}
              </div>
            </div>
          )}
        </div>

        {/* Aviso - apenas para não-coordenadores */}
        {perfil.tipo_usuario !== 'COORDENADOR' && (
          <div className="flex items-start gap-2 p-4 bg-[rgb(var(--cor-alerta))]/10 border border-[rgb(var(--cor-alerta))]/30 rounded-lg mt-4">
            <AlertCircle className="h-5 w-5 text-[rgb(var(--cor-alerta))] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-cor-texto">
                <strong>Atenção:</strong> Para alterar seus dados cadastrais (nome, e-mail, curso, etc.),
                entre em contato com o coordenador do curso.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Card de Alteração de Senha */}
      <div className="bg-cor-superficie border border-cor-borda rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Lock className="h-6 w-6 text-cor-icone" />
          <h2 className="text-xl font-semibold text-cor-texto">Alterar Senha</h2>
        </div>

        <form onSubmit={handleAlterarSenha} className="space-y-4">
          <div>
            <label htmlFor="senha-atual" className="block text-sm font-medium text-cor-texto mb-1">
              Senha Atual
            </label>
            <input
              id="senha-atual"
              type="password"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              required
              className="w-full px-4 py-2 bg-cor-fundo border border-cor-borda rounded-lg text-cor-texto focus:outline-none focus:ring-2 focus:ring-[rgb(var(--cor-destaque))]"
              placeholder="Digite sua senha atual"
            />
          </div>

          <div>
            <label htmlFor="nova-senha" className="block text-sm font-medium text-cor-texto mb-1">
              Nova Senha
            </label>
            <input
              id="nova-senha"
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              required
              className="w-full px-4 py-2 bg-cor-fundo border border-cor-borda rounded-lg text-cor-texto focus:outline-none focus:ring-2 focus:ring-[rgb(var(--cor-destaque))]"
              placeholder="Digite a nova senha"
            />
          </div>

          <div>
            <label htmlFor="confirmar-senha" className="block text-sm font-medium text-cor-texto mb-1">
              Confirmar Nova Senha
            </label>
            <input
              id="confirmar-senha"
              type="password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              required
              className="w-full px-4 py-2 bg-cor-fundo border border-cor-borda rounded-lg text-cor-texto focus:outline-none focus:ring-2 focus:ring-[rgb(var(--cor-destaque))]"
              placeholder="Confirme a nova senha"
            />
          </div>

          <button
            type="submit"
            disabled={alterandoSenha}
            className="w-full px-4 py-2 bg-cor-destaque text-[rgb(var(--cor-texto-sobre-destaque))] rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {alterandoSenha ? 'Alterando...' : 'Alterar Senha'}
          </button>
        </form>
      </div>

      {/* Card de Preferências de E-mail */}
      <div className="bg-cor-superficie border border-cor-borda rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Mail className="h-6 w-6 text-cor-icone" />
          <h2 className="text-xl font-semibold text-cor-texto">Preferências de E-mail</h2>
        </div>

        {carregandoPreferencias ? (
          <div className="text-cor-texto-secundario">Carregando preferências...</div>
        ) : preferenciasEmail ? (
          <div className="space-y-6">

            {/* Preferências de Aluno */}
            {perfil?.tipo_usuario === 'ALUNO' && (
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-cor-texto">Notificações de Aluno</h3>
                <div className="space-y-3">
                  <PreferenciaSwitch
                    label="Convite de orientador aceito"
                    descricao="Notificar quando solicitação de orientação for aprovada"
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
            {perfil?.tipo_usuario === 'PROFESSOR' && (
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-cor-texto">Notificações de Professor</h3>
                <div className="space-y-3">
                  <PreferenciaSwitch
                    label="Recebimento de monografia"
                    descricao="Notificar quando orientando enviar monografia"
                    checked={preferenciasEmail.prof_receber_monografia}
                    onChange={(valor) => handleTogglePreferencia('prof_receber_monografia', valor)}
                    disabled={salvandoPreferencia}
                  />
                  <PreferenciaSwitch
                    label="Decisão de continuidade"
                    descricao="Notificar quando aprovar/rejeitar continuidade"
                    checked={preferenciasEmail.prof_continuidade_aprovada}
                    onChange={(valor) => handleTogglePreferencia('prof_continuidade_aprovada', valor)}
                    disabled={salvandoPreferencia}
                  />
                  <PreferenciaSwitch
                    label="Lembrete de termo"
                    descricao="Notificar sobre prazos de termo de solicitação"
                    checked={preferenciasEmail.prof_lembrete_termo}
                    onChange={(valor) => handleTogglePreferencia('prof_lembrete_termo', valor)}
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

            {/* Preferências de Coordenador */}
            {perfil?.tipo_usuario === 'COORDENADOR' && (
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
                    label="Avaliações Fase I completas"
                    descricao="Notificar quando todas avaliações da Fase I forem enviadas"
                    checked={preferenciasEmail.coord_avaliacoes_fase1_completas}
                    onChange={(valor) => handleTogglePreferencia('coord_avaliacoes_fase1_completas', valor)}
                    disabled={salvandoPreferencia}
                  />
                  <PreferenciaSwitch
                    label="Avaliações Fase II completas"
                    descricao="Notificar quando todas avaliações da Fase II forem enviadas"
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
        ) : (
          <div className="text-cor-texto-secundario">Erro ao carregar preferências</div>
        )}
      </div>

      {/* Modal de Confirmação de Senha */}
      <ModalConfirmarSenha
        aberto={mostrarModalSenha}
        onFechar={() => setMostrarModalSenha(false)}
        onConfirmar={handleConfirmarSenha}
        carregando={salvandoPerfil}
      />
    </div>
  );
}

// Componente auxiliar para os switches de preferências
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
