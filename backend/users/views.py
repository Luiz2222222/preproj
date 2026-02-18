from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView as BaseTokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings

from .models import Usuario, PreferenciasVisuais
from .serializers import (
    UsuarioSerializer,
    RegistroAlunoSerializer,
    RegistroProfessorSerializer,
    RegistroAvaliadorSerializer,
    PerfilUsuarioSerializer,
    PreferenciasVisuaisSerializer,
    ProfessorListSerializer,
    ProfessorEstatisticasSerializer,
    AlunoEstatisticasSerializer,
    ExternoEstatisticasSerializer,
    ChangePasswordSerializer,
    CoordenadorUpdateSerializer,
    EditarProfessorSerializer,
)


class ListarProfessoresView(APIView):
    """View para listar todos os professores cadastrados."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Retorna lista de professores com dados completos."""
        professores = Usuario.objects.filter(
            tipo_usuario='PROFESSOR'
        ).order_by('nome_completo')

        serializer = ProfessorListSerializer(professores, many=True)
        return Response(serializer.data)


class ListarCoorientadoresView(APIView):
    """View para listar potenciais co-orientadores (professores + avaliadores externos)."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Retorna lista de professores e avaliadores externos."""
        from django.db.models import Q
        coorientadores = Usuario.objects.filter(
            Q(tipo_usuario='PROFESSOR') | Q(tipo_usuario='AVALIADOR')
        ).order_by('nome_completo')

        serializer = ProfessorListSerializer(coorientadores, many=True)
        return Response(serializer.data)


class RegistroAlunoView(generics.CreateAPIView):
    """View para cadastro de Aluno."""

    serializer_class = RegistroAlunoSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        usuario = serializer.save()

        return Response({
            'id': usuario.id,
            'email': usuario.email,
            'nome_completo': usuario.nome_completo,
            'tipo_usuario': usuario.tipo_usuario,
            'message': 'Aluno cadastrado com sucesso!'
        }, status=status.HTTP_201_CREATED)


class RegistroProfessorView(generics.CreateAPIView):
    """View para cadastro de Professor."""

    serializer_class = RegistroProfessorSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        usuario = serializer.save()

        return Response({
            'id': usuario.id,
            'email': usuario.email,
            'nome_completo': usuario.nome_completo,
            'tipo_usuario': usuario.tipo_usuario,
            'message': 'Professor cadastrado com sucesso!'
        }, status=status.HTTP_201_CREATED)


class RegistroAvaliadorView(generics.CreateAPIView):
    """View para cadastro de Avaliador Externo."""

    serializer_class = RegistroAvaliadorSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        usuario = serializer.save()

        return Response({
            'id': usuario.id,
            'email': usuario.email,
            'nome_completo': usuario.nome_completo,
            'tipo_usuario': usuario.tipo_usuario,
            'message': 'Avaliador externo cadastrado com sucesso!'
        }, status=status.HTTP_201_CREATED)


class PerfilUsuarioView(APIView):
    """View para obter e atualizar perfil do usuario autenticado."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Retorna perfil completo do usuario com preferencias visuais."""
        # Garante que o usuario tem preferencias visuais
        preferencias, created = PreferenciasVisuais.objects.get_or_create(
            usuario=request.user,
            defaults={'tema': 'white', 'tamanho_fonte': 'medio'}
        )

        serializer = PerfilUsuarioSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        """Atualiza dados do perfil do coordenador."""
        # Apenas coordenadores podem atualizar seus dados de perfil
        if request.user.tipo_usuario != 'COORDENADOR':
            return Response(
                {'error': 'Apenas coordenadores podem atualizar seus dados de perfil. Entre em contato com o coordenador para alterar seus dados.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = CoordenadorUpdateSerializer(
            request.user,
            data=request.data,
            context={'request': request},
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Retornar dados atualizados usando o PerfilUsuarioSerializer
        response_serializer = PerfilUsuarioSerializer(request.user)
        return Response(response_serializer.data)


class AtualizarPreferenciasVisuaisView(APIView):
    """View para atualizar apenas preferencias visuais do usuario."""

    permission_classes = [permissions.IsAuthenticated]

    def put(self, request):
        """Atualiza preferencias visuais (tema e tamanho_fonte)."""
        preferencias, created = PreferenciasVisuais.objects.get_or_create(
            usuario=request.user,
            defaults={'tema': 'white', 'tamanho_fonte': 'medio'}
        )

        serializer = PreferenciasVisuaisSerializer(
            preferencias,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response({
            'message': 'Preferencias visuais atualizadas com sucesso',
            'preferencias_visuais': serializer.data
        })


class CustomTokenObtainPairView(TokenObtainPairView):
    """View customizada de login que usa HttpOnly cookies e suporta 'lembrar-me'."""

    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        lembrar_me = request.data.get('remember_me', False)

        # Autenticar normalmente
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            access_token = response.data.get('access')
            refresh_token = response.data.get('refresh')

            try:
                usuario = Usuario.objects.get(email=email)

                # Garantir preferências visuais
                preferencias, _ = PreferenciasVisuais.objects.get_or_create(
                    usuario=usuario,
                    defaults={'tema': 'white', 'tamanho_fonte': 'medio'}
                )

                # Resposta: SÓ dados do usuário (sem tokens)
                response.data = {
                    'user': {
                        'id': usuario.id,
                        'email': usuario.email,
                        'nome_completo': usuario.nome_completo,
                        'tipo_usuario': usuario.tipo_usuario,
                        'preferencias_visuais': {
                            'tema': preferencias.tema,
                            'tamanho_fonte': preferencias.tamanho_fonte
                        }
                    }
                }

                # Cookie: Refresh Token
                max_age_refresh = 604800 if lembrar_me else None  # 7 dias ou sessão
                response.set_cookie(
                    key='refresh_token',
                    value=refresh_token,
                    max_age=max_age_refresh,
                    httponly=True,
                    secure=not settings.DEBUG,  # HTTPS em produção
                    samesite='Lax',
                    path='/'
                )

                # Cookie: Access Token
                max_age_access = 3600 if lembrar_me else None  # 60 min ou sessão
                response.set_cookie(
                    key='access_token',
                    value=access_token,
                    max_age=max_age_access,
                    httponly=True,
                    secure=not settings.DEBUG,
                    samesite='Lax',
                    path='/'
                )

            except Usuario.DoesNotExist:
                pass

        return response


class LogoutView(APIView):
    """View para logout que limpa cookies e adiciona refresh token a blacklist."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token')

        try:
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            pass

        # Sempre limpar cookies (mesmo com erro)
        response = Response({
            'message': 'Logout realizado com sucesso'
        }, status=status.HTTP_200_OK)

        response.delete_cookie('access_token', path='/')
        response.delete_cookie('refresh_token', path='/')

        return response


class TokenRefreshView(BaseTokenRefreshView):
    """
    Refresh customizado: lê refresh token do cookie.
    """

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get('refresh_token')

        if not refresh_token:
            return Response({
                'detail': 'Refresh token não encontrado. Faça login novamente.'
            }, status=status.HTTP_401_UNAUTHORIZED)

        # Adicionar ao body (simplejwt espera lá)
        request.data._mutable = True  # Permitir modificar QueryDict
        request.data['refresh'] = refresh_token
        request.data._mutable = False

        # Refresh normal
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            new_access = response.data.get('access')
            new_refresh = response.data.get('refresh')

            # Limpar JSON
            response.data = {'detail': 'Token renovado'}

            # Atualizar access token
            response.set_cookie(
                key='access_token',
                value=new_access,
                max_age=600,
                httponly=True,
                secure=not settings.DEBUG,
                samesite='Lax',
                path='/'
            )

            # Atualizar refresh se vier novo (rotation)
            if new_refresh:
                response.set_cookie(
                    key='refresh_token',
                    value=new_refresh,
                    max_age=604800,
                    httponly=True,
                    secure=not settings.DEBUG,
                    samesite='Lax',
                    path='/'
                )

        return response


class ProfessoresEstatisticasView(APIView):
    """View para listar professores com estatísticas completas de orientações e bancas."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Retorna lista de professores com orientações, co-orientações e bancas."""
        # Verificar se usuário é coordenador
        if request.user.tipo_usuario != 'COORDENADOR':
            return Response(
                {'error': 'Apenas coordenadores podem acessar esta informação'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Otimizar queries com prefetch_related
        from django.db.models import Prefetch
        from tccs.models import TCC, MembroBanca

        professores = Usuario.objects.filter(
            tipo_usuario='PROFESSOR'
        ).prefetch_related(
            # Prefetch de orientações
            Prefetch(
                'tccs_como_orientador',
                queryset=TCC.objects.select_related('aluno').order_by('-id')
            ),
            # Prefetch de co-orientações
            Prefetch(
                'tccs_como_coorientador',
                queryset=TCC.objects.select_related('aluno').order_by('-id')
            ),
            # Prefetch de bancas
            Prefetch(
                'participacoes_banca',
                queryset=MembroBanca.objects.select_related('banca__tcc__aluno').order_by('-id')
            )
        ).order_by('nome_completo')

        serializer = ProfessorEstatisticasSerializer(professores, many=True)
        return Response(serializer.data)


class AlunosEstatisticasView(APIView):
    """View para listar alunos com dados do TCC."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.tipo_usuario != 'COORDENADOR':
            return Response(
                {'error': 'Apenas coordenadores podem acessar esta informação'},
                status=status.HTTP_403_FORBIDDEN
            )

        from django.db.models import Prefetch
        from tccs.models import TCC

        alunos = Usuario.objects.filter(
            tipo_usuario='ALUNO'
        ).prefetch_related(
            Prefetch(
                'tccs_como_aluno',
                queryset=TCC.objects.select_related('orientador', 'coorientador').order_by('-id')
            )
        ).order_by('nome_completo')

        serializer = AlunoEstatisticasSerializer(alunos, many=True)
        return Response(serializer.data)


class ExternosEstatisticasView(APIView):
    """View para listar avaliadores externos com suas bancas."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.tipo_usuario != 'COORDENADOR':
            return Response(
                {'error': 'Apenas coordenadores podem acessar esta informação'},
                status=status.HTTP_403_FORBIDDEN
            )

        from django.db.models import Prefetch
        from tccs.models import MembroBanca

        externos = Usuario.objects.filter(
            tipo_usuario='AVALIADOR'
        ).prefetch_related(
            Prefetch(
                'participacoes_banca',
                queryset=MembroBanca.objects.select_related('banca__tcc__aluno').order_by('-id')
            )
        ).order_by('nome_completo')

        serializer = ExternoEstatisticasSerializer(externos, many=True)
        return Response(serializer.data)


class ChangePasswordView(APIView):
    """View para alteração de senha do usuário autenticado."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """Alterar a senha do usuário."""
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})

        if serializer.is_valid():
            serializer.save()
            return Response(
                {'message': 'Senha alterada com sucesso.'},
                status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EditarUsuarioView(APIView):
    """View para coordenador editar dados de um usuario."""

    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, usuario_id):
        if request.user.tipo_usuario != 'COORDENADOR':
            return Response(
                {'error': 'Apenas coordenadores podem editar usuarios.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            usuario = Usuario.objects.get(id=usuario_id)
        except Usuario.DoesNotExist:
            return Response(
                {'error': 'Usuario nao encontrado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = EditarProfessorSerializer(
            usuario, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response({
            'message': 'Usuario atualizado com sucesso.',
            'usuario': {
                'id': usuario.id,
                'nome_completo': usuario.nome_completo,
                'email': usuario.email,
                'tratamento': usuario.tratamento,
                'tratamento_customizado': usuario.tratamento_customizado,
                'departamento': usuario.departamento,
            }
        })


class ResetarSenhaUsuarioView(APIView):
    """View para coordenador resetar a senha de um usuario."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, usuario_id):
        if request.user.tipo_usuario != 'COORDENADOR':
            return Response(
                {'error': 'Apenas coordenadores podem resetar senhas.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            usuario = Usuario.objects.get(id=usuario_id)
        except Usuario.DoesNotExist:
            return Response(
                {'error': 'Usuario nao encontrado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        nova_senha = request.data.get('nova_senha')
        if not nova_senha or len(nova_senha) < 6:
            return Response(
                {'error': 'A nova senha deve ter pelo menos 6 caracteres.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        usuario.set_password(nova_senha)
        usuario.save()

        return Response({
            'message': f'Senha de {usuario.nome_completo} resetada com sucesso.'
        })
