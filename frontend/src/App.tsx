import { Routes, Route, Navigate } from 'react-router-dom'
import { ProvedorAutenticacao } from './autenticacao'
import { ToastProvider } from './contextos/ToastProvider'
import { NotificacoesProvider } from './contextos/NotificacoesContext'
import { PaginaLogin } from './paginas/PaginaLogin'
import { DashboardAluno } from './paginas/DashboardAluno'
import { MeuTCC, Documentos, Informacoes, IniciarTCC, Configuracoes } from './paginas/aluno'
import { DashboardCoordenador } from './paginas/coordenador/DashboardCoordenador'
import { TCCs } from './paginas/coordenador/TCCs'
import { TCCDetalhe } from './paginas/coordenador/TCCDetalhe'
import { SolicitacoesPendentes } from './paginas/coordenador/SolicitacoesPendentes'
import { ProfessoresPage } from './paginas/coordenador/ProfessoresPage'
import { AlunosPage } from './paginas/coordenador/AlunosPage'
import { ExternosPage } from './paginas/coordenador/ExternosPage'
import { Relatorios } from './paginas/coordenador/Relatorios'
import Planejamento from './paginas/coordenador/Planejamento'
import { ConfiguracoesCoordenador } from './paginas/coordenador/Configuracoes'
import { DashboardProfessor } from './paginas/professor/DashboardProfessor'
import { MeusOrientandosProfessor } from './paginas/professor/MeusOrientandosProfessor'
import { DetalheOrientandoProfessor } from './paginas/professor/DetalheOrientandoProfessor'
import { CoOrientacoesProfessor } from './paginas/professor/CoOrientacoesProfessor'
import { DetalheCoOrientacao } from './paginas/professor/DetalheCoOrientacao'
import { BancasProfessor } from './paginas/professor/BancasProfessor'
import { BancasAvaliacaoDetalhe } from './paginas/professor/BancasAvaliacaoDetalhe'
import { ConfiguracoesProfessor } from './paginas/professor/ConfiguracoesProfessor'
import { DashboardAvaliador } from './paginas/avaliador/DashboardAvaliador'
import { CronogramaAvaliacoes } from './paginas/avaliador/Cronograma'
import { FormularioParecer } from './paginas/avaliador/Parecer'
import { HistoricoParticipacao } from './paginas/avaliador/Historico'
import { ConfiguracoesAvaliador } from './paginas/avaliador/Configuracoes'
import { RotaProtegida } from './componentes/RotaProtegida'
import { EstruturaAluno } from './estrutura/EstruturaAluno'
import { EstruturaCoord } from './estrutura/EstruturaCoord'
import { EstruturaProfessor } from './estrutura/EstruturaProfessor'
import { EstruturaAvaliador } from './estrutura/EstruturaAvaliador'
import { PerfilWrapper } from './paginas/PerfilWrapper'

export function App() {
  return (
    <ToastProvider>
      <ProvedorAutenticacao>
        <NotificacoesProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<PaginaLogin />} />
            <Route path="/coordenador" element={<Navigate to="/dashboard" replace />} />

            {/* Rota de Perfil (disponível para todos os tipos de usuário) */}
            <Route
              path="/perfil"
              element={
                <RotaProtegida tiposPermitidos={['ALUNO', 'PROFESSOR', 'COORDENADOR', 'AVALIADOR']}>
                  <PerfilWrapper />
                </RotaProtegida>
              }
            />

        {/* Rotas do Aluno (com layout) */}
        <Route
          path="/aluno"
          element={
            <RotaProtegida tiposPermitidos={['ALUNO']}>
              <EstruturaAluno>
                <DashboardAluno />
              </EstruturaAluno>
            </RotaProtegida>
          }
        />
        <Route
          path="/aluno/meu-tcc"
          element={
            <RotaProtegida tiposPermitidos={['ALUNO']}>
              <EstruturaAluno>
                <MeuTCC />
              </EstruturaAluno>
            </RotaProtegida>
          }
        />
        <Route
          path="/aluno/documentos"
          element={
            <RotaProtegida tiposPermitidos={['ALUNO']}>
              <EstruturaAluno>
                <Documentos />
              </EstruturaAluno>
            </RotaProtegida>
          }
        />
        <Route
          path="/aluno/configuracoes"
          element={
            <RotaProtegida tiposPermitidos={['ALUNO']}>
              <EstruturaAluno>
                <Configuracoes />
              </EstruturaAluno>
            </RotaProtegida>
          }
        />
        <Route
          path="/aluno/informacoes"
          element={
            <RotaProtegida tiposPermitidos={['ALUNO']}>
              <EstruturaAluno>
                <Informacoes />
              </EstruturaAluno>
            </RotaProtegida>
          }
        />
        <Route
          path="/aluno/iniciar-tcc"
          element={
            <RotaProtegida tiposPermitidos={['ALUNO']}>
              <EstruturaAluno>
                <IniciarTCC />
              </EstruturaAluno>
            </RotaProtegida>
          }
        />
        {/* Rotas do Professor (com layout) */}
        <Route
          path="/professor"
          element={<Navigate to="/professor/dashboard" replace />}
        />
        <Route
          path="/professor/dashboard"
          element={
            <RotaProtegida tiposPermitidos={['PROFESSOR']}>
              <EstruturaProfessor>
                <DashboardProfessor />
              </EstruturaProfessor>
            </RotaProtegida>
          }
        />
        <Route
          path="/professor/orientacoes/meus-orientandos"
          element={
            <RotaProtegida tiposPermitidos={['PROFESSOR']}>
              <EstruturaProfessor>
                <MeusOrientandosProfessor />
              </EstruturaProfessor>
            </RotaProtegida>
          }
        />
        <Route
          path="/professor/orientacoes/meus-orientandos/:id"
          element={
            <RotaProtegida tiposPermitidos={['PROFESSOR']}>
              <EstruturaProfessor>
                <DetalheOrientandoProfessor />
              </EstruturaProfessor>
            </RotaProtegida>
          }
        />
        <Route
          path="/professor/orientacoes/coorientacoes"
          element={
            <RotaProtegida tiposPermitidos={['PROFESSOR']}>
              <EstruturaProfessor>
                <CoOrientacoesProfessor />
              </EstruturaProfessor>
            </RotaProtegida>
          }
        />
        <Route
          path="/professor/orientacoes/coorientacoes/:id"
          element={
            <RotaProtegida tiposPermitidos={['PROFESSOR']}>
              <EstruturaProfessor>
                <DetalheCoOrientacao />
              </EstruturaProfessor>
            </RotaProtegida>
          }
        />
        <Route
          path="/professor/bancas"
          element={
            <RotaProtegida tiposPermitidos={['PROFESSOR']}>
              <EstruturaProfessor>
                <BancasProfessor />
              </EstruturaProfessor>
            </RotaProtegida>
          }
        />
        <Route
          path="/professor/bancas/:id"
          element={
            <RotaProtegida tiposPermitidos={['PROFESSOR']}>
              <EstruturaProfessor>
                <BancasAvaliacaoDetalhe />
              </EstruturaProfessor>
            </RotaProtegida>
          }
        />
        <Route
          path="/professor/configuracoes"
          element={
            <RotaProtegida tiposPermitidos={['PROFESSOR']}>
              <EstruturaProfessor>
                <ConfiguracoesProfessor />
              </EstruturaProfessor>
            </RotaProtegida>
          }
        />

        {/* Rotas do Coordenador (com layout) */}
        <Route
          path="/dashboard"
          element={
            <RotaProtegida tiposPermitidos={['COORDENADOR']}>
              <EstruturaCoord>
                <DashboardCoordenador />
              </EstruturaCoord>
            </RotaProtegida>
          }
        />
        <Route
          path="/tccs"
          element={
            <RotaProtegida tiposPermitidos={['COORDENADOR']}>
              <EstruturaCoord>
                <TCCs />
              </EstruturaCoord>
            </RotaProtegida>
          }
        />
        <Route
          path="/tccs/:id"
          element={
            <RotaProtegida tiposPermitidos={['COORDENADOR']}>
              <EstruturaCoord>
                <TCCDetalhe />
              </EstruturaCoord>
            </RotaProtegida>
          }
        />
        <Route
          path="/solicitacoes"
          element={
            <RotaProtegida tiposPermitidos={['COORDENADOR']}>
              <EstruturaCoord>
                <SolicitacoesPendentes />
              </EstruturaCoord>
            </RotaProtegida>
          }
        />
        {/* Redirecionar /usuarios para /usuarios/professores */}
        <Route path="/usuarios" element={<Navigate to="/usuarios/professores" replace />} />

        <Route
          path="/usuarios/professores"
          element={
            <RotaProtegida tiposPermitidos={['COORDENADOR']}>
              <EstruturaCoord>
                <ProfessoresPage />
              </EstruturaCoord>
            </RotaProtegida>
          }
        />
        <Route
          path="/usuarios/alunos"
          element={
            <RotaProtegida tiposPermitidos={['COORDENADOR']}>
              <EstruturaCoord>
                <AlunosPage />
              </EstruturaCoord>
            </RotaProtegida>
          }
        />
        <Route
          path="/usuarios/externos"
          element={
            <RotaProtegida tiposPermitidos={['COORDENADOR']}>
              <EstruturaCoord>
                <ExternosPage />
              </EstruturaCoord>
            </RotaProtegida>
          }
        />
        <Route
          path="/relatorios"
          element={
            <RotaProtegida tiposPermitidos={['COORDENADOR']}>
              <EstruturaCoord>
                <Relatorios />
              </EstruturaCoord>
            </RotaProtegida>
          }
        />
        <Route
          path="/planejamento"
          element={
            <RotaProtegida tiposPermitidos={['COORDENADOR']}>
              <EstruturaCoord>
                <Planejamento />
              </EstruturaCoord>
            </RotaProtegida>
          }
        />
        <Route
          path="/configuracoes"
          element={
            <RotaProtegida tiposPermitidos={['COORDENADOR']}>
              <EstruturaCoord>
                <ConfiguracoesCoordenador />
              </EstruturaCoord>
            </RotaProtegida>
          }
        />

        {/* Rotas do Avaliador (com layout) */}
        <Route
          path="/avaliador"
          element={
            <RotaProtegida tiposPermitidos={['AVALIADOR']}>
              <EstruturaAvaliador>
                <DashboardAvaliador />
              </EstruturaAvaliador>
            </RotaProtegida>
          }
        />
        <Route
          path="/avaliador/cronograma"
          element={
            <RotaProtegida tiposPermitidos={['AVALIADOR']}>
              <EstruturaAvaliador>
                <CronogramaAvaliacoes />
              </EstruturaAvaliador>
            </RotaProtegida>
          }
        />
        <Route
          path="/avaliador/parecer"
          element={
            <RotaProtegida tiposPermitidos={['AVALIADOR']}>
              <EstruturaAvaliador>
                <FormularioParecer />
              </EstruturaAvaliador>
            </RotaProtegida>
          }
        />
        <Route
          path="/avaliador/historico"
          element={
            <RotaProtegida tiposPermitidos={['AVALIADOR']}>
              <EstruturaAvaliador>
                <HistoricoParticipacao />
              </EstruturaAvaliador>
            </RotaProtegida>
          }
        />
        <Route
          path="/avaliador/bancas"
          element={
            <RotaProtegida tiposPermitidos={['AVALIADOR']}>
              <EstruturaAvaliador>
                <BancasProfessor />
              </EstruturaAvaliador>
            </RotaProtegida>
          }
        />
        <Route
          path="/avaliador/bancas/:id"
          element={
            <RotaProtegida tiposPermitidos={['AVALIADOR']}>
              <EstruturaAvaliador>
                <BancasAvaliacaoDetalhe />
              </EstruturaAvaliador>
            </RotaProtegida>
          }
        />
        <Route
          path="/avaliador/configuracoes"
          element={
            <RotaProtegida tiposPermitidos={['AVALIADOR']}>
              <EstruturaAvaliador>
                <ConfiguracoesAvaliador />
              </EstruturaAvaliador>
            </RotaProtegida>
          }
        />
          </Routes>
        </NotificacoesProvider>
      </ProvedorAutenticacao>
    </ToastProvider>
  )
}





