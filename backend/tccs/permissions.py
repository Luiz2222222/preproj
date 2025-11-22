"""
Permissões customizadas para o app tccs.
Baseadas em tipo_usuario, ignorando is_staff/is_superuser.
"""
from rest_framework import permissions


class IsTCCOwnerOrRelated(permissions.BasePermission):
    """
    Permissão para TCC:
    - Aluno: acesso apenas ao seu próprio TCC
    - Professor: acesso aos TCCs onde é orientador ou coorientador
    - Coordenador: acesso a todos os TCCs
    """

    def has_permission(self, request, view):
        # Usuário deve estar autenticado
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        usuario = request.user

        # Coordenador vê tudo
        if usuario.tipo_usuario == 'COORDENADOR':
            return True

        # Aluno vê apenas seu TCC
        if usuario.tipo_usuario == 'ALUNO':
            return obj.aluno == usuario

        # Professor vê TCCs onde é orientador ou coorientador
        if usuario.tipo_usuario in ['PROFESSOR', 'COORDENADOR']:
            return obj.orientador == usuario or obj.coorientador == usuario

        # Avaliador não tem acesso por enquanto (será adicionado na fase de bancas)
        return False


class IsSolicitacaoOwnerOrCoordenador(permissions.BasePermission):
    """
    Permissao para Solicitacao de Orientacao:
    - Aluno: pode criar e cancelar suas solicitacoes
    - Professor: pode visualizar solicitacoes recebidas (somente leitura)
    - Coordenador: ve todas e pode aprovar/recusar
    """

    def has_permission(self, request, view):
        # Usuario deve estar autenticado
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        usuario = request.user

        # Coordenador ve tudo e pode modificar
        if usuario.tipo_usuario == 'COORDENADOR':
            return True

        # Aluno ve suas proprias solicitacoes (do TCC dele)
        if usuario.tipo_usuario == 'ALUNO':
            return obj.tcc.aluno == usuario

        # Professor ve solicitacoes recebidas (somente leitura)
        if usuario.tipo_usuario == 'PROFESSOR':
            # Apenas metodos seguros (GET, HEAD, OPTIONS)
            if request.method in ['GET', 'HEAD', 'OPTIONS']:
                return obj.professor == usuario
            return False

        return False


class IsDocumentoTCCRelated(permissions.BasePermission):
    """
    Permissão para Documentos do TCC:
    - Segue as mesmas regras do TCC
    - Aluno pode fazer upload
    - Orientador pode visualizar e aprovar
    - Coordenador pode fazer tudo
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        usuario = request.user
        tcc = obj.tcc

        # Coordenador vê tudo
        if usuario.tipo_usuario == 'COORDENADOR':
            return True

        # Aluno vê documentos do seu TCC
        if usuario.tipo_usuario == 'ALUNO':
            # Pode visualizar e fazer upload
            return tcc.aluno == usuario

        # Professor vê documentos dos TCCs onde é orientador/coorientador
        if usuario.tipo_usuario in ['PROFESSOR', 'COORDENADOR']:
            return tcc.orientador == usuario or tcc.coorientador == usuario

        return False


class IsEventoTimelineVisible(permissions.BasePermission):
    """
    Permissão para Eventos da Timeline:
    - Respeita campo visibilidade
    - Aluno vê apenas eventos TODOS
    - Orientador vê TODOS e ORIENTADOR_COORDENADOR
    - Coordenador vê tudo
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        usuario = request.user
        tcc = obj.tcc

        # Coordenador vê tudo
        if usuario.tipo_usuario == 'COORDENADOR':
            return True

        # Verificar se tem acesso ao TCC primeiro
        eh_aluno = tcc.aluno == usuario
        eh_orientador = tcc.orientador == usuario or tcc.coorientador == usuario

        if not (eh_aluno or eh_orientador):
            return False

        # Verificar visibilidade
        from .constants import Visibilidade

        if obj.visibilidade == Visibilidade.TODOS:
            return True

        if obj.visibilidade == Visibilidade.ORIENTADOR_COORDENADOR:
            return eh_orientador

        if obj.visibilidade == Visibilidade.COORDENADOR_APENAS:
            return False

        return False


class IsAluno(permissions.BasePermission):
    """Permissão para verificar se usuário é ALUNO."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.tipo_usuario == 'ALUNO'
        )


class IsProfessor(permissions.BasePermission):
    """Permissão para verificar se usuário é PROFESSOR."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.tipo_usuario == 'PROFESSOR'
        )


class IsCoordenador(permissions.BasePermission):
    """Permissão para verificar se usuário é COORDENADOR."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.tipo_usuario == 'COORDENADOR'
        )


class IsProfessorOrCoordenador(permissions.BasePermission):
    """Permissão para verificar se usuário é PROFESSOR ou COORDENADOR."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.tipo_usuario in ['PROFESSOR', 'COORDENADOR']
        )


class IsProfessorCoordenadorOuAvaliador(permissions.BasePermission):
    """Permissão para verificar se usuário é PROFESSOR, COORDENADOR ou AVALIADOR."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.tipo_usuario in ['PROFESSOR', 'COORDENADOR', 'AVALIADOR']
        )
