import { useAutenticacao } from '../autenticacao';
import { Perfil } from './Perfil';
import { EstruturaAluno } from '../estrutura/EstruturaAluno';
import { EstruturaCoord } from '../estrutura/EstruturaCoord';
import { EstruturaProfessor } from '../estrutura/EstruturaProfessor';
import { EstruturaAvaliador } from '../estrutura/EstruturaAvaliador';

export function PerfilWrapper() {
  const { usuario } = useAutenticacao();

  if (!usuario) {
    return null;
  }

  // Renderizar Perfil com o layout apropriado para cada tipo de usuário
  switch (usuario.tipo_usuario) {
    case 'ALUNO':
      return (
        <EstruturaAluno>
          <Perfil />
        </EstruturaAluno>
      );
    case 'PROFESSOR':
      return (
        <EstruturaProfessor>
          <Perfil />
        </EstruturaProfessor>
      );
    case 'COORDENADOR':
      return (
        <EstruturaCoord>
          <Perfil />
        </EstruturaCoord>
      );
    case 'AVALIADOR':
      return (
        <EstruturaAvaliador>
          <Perfil />
        </EstruturaAvaliador>
      );
    default:
      return (
        <EstruturaAluno>
          <Perfil />
        </EstruturaAluno>
      );
  }
}
