import { Navigate } from 'react-router-dom'
import { useAutenticacao } from '../autenticacao'
import type { ReactNode } from 'react'

interface RotaProtegidaProps {
  children: ReactNode
  tiposPermitidos?: string[]
}

export function RotaProtegida({ children, tiposPermitidos }: RotaProtegidaProps) {
  const { estaAutenticado, usuario, carregando } = useAutenticacao()

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cor-fundo">
        <div className="text-cor-texto">Carregando...</div>
      </div>
    )
  }

  if (!estaAutenticado) {
    return <Navigate to="/login" replace />
  }

  if (tiposPermitidos && usuario && !tiposPermitidos.includes(usuario.tipo_usuario)) {
    // Usuario autenticado mas sem permissao para esta rota
    // Redireciona para a rota do seu perfil
    const rotaPorTipo: Record<string, string> = {
      'ALUNO': '/aluno',
      'PROFESSOR': '/professor',
      'COORDENADOR': '/dashboard',
      'AVALIADOR': '/avaliador',
    }
    const rotaCorreta = rotaPorTipo[usuario.tipo_usuario] || '/aluno'
    return <Navigate to={rotaCorreta} replace />
  }

  return <>{children}</>
}
