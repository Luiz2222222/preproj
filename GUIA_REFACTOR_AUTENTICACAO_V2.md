# 🔐 Guia Completo: Refactor de Autenticação com HttpOnly Cookies (v2 - CORRIGIDO)

> **⚠️ VERSÃO 2**: Corrigida com feedback de segurança (CSRF, is_active, rate limiting)

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [O Que Vai Mudar](#o-que-vai-mudar)
3. [Preparação](#preparação)
4. [Parte 1: Backend (Django)](#parte-1-backend-django)
5. [Parte 2: Frontend (React)](#parte-2-frontend-react)
6. [Parte 3: Melhorias de Segurança](#parte-3-melhorias-de-segurança)
7. [Testes](#testes)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

### O Que Estamos Fazendo?

Migrar de **localStorage** para **HttpOnly Cookies** com **proteções de segurança completas**.

### Por Quê?

| Antes (localStorage) | Depois (HttpOnly Cookies) |
|---------------------|---------------------------|
| ❌ JavaScript pode acessar tokens | ✅ JavaScript NÃO acessa tokens |
| ❌ Vulnerável a XSS | ✅ Protegido contra XSS |
| ❌ "Lembrar-me" não funciona | ✅ "Lembrar-me" funcional |
| ⚠️ Access token 60min | ✅ Access token 10min |
| ❌ Sem rate limiting | ✅ Rate limiting |
| ⚠️ Sem checagem `is_active` | ✅ Checagem `is_active` |
| ⚠️ CSRF mal configurado | ✅ CSRF double-submit |

### Tempo Estimado

- **Backend**: 5 horas (aumentou com correções de segurança)
- **Frontend**: 4 horas
- **Testes e Debug**: 3 horas
- **TOTAL**: ~12 horas

---

## 🔄 O Que Vai Mudar

### Backend
- ✏️ `settings.py` - CSRF correto, CORS, tempo de token
- ✏️ `users/views.py` - login/logout com cookies + checagem `is_active`
- 🆕 `users/authentication.py` - ler JWT de cookies
- 🆕 `users/utils.py` - helper para CSRF e rate limiting

### Frontend
- ✏️ `servicos/api.ts` - cookies + CSRF token
- ✏️ `autenticacao/ProvedorAutenticacao.tsx` - usar cookies
- ✏️ `paginas/PaginaLogin.tsx` - enviar flag "lembrar-me"

---

## 🚀 Preparação

### 1. Criar Branch
```bash
cd "C:\Users\guima\OneDrive\Área de Trabalho\1AAA"
git checkout -b refactor/httponly-cookies-v2
git status
```

### 2. Backup
```bash
cp -r "C:\Users\guima\OneDrive\Área de Trabalho\1AAA" "C:\Users\guima\OneDrive\Área de Trabalho\1AAA_BACKUP"
```

### 3. Instalar Dependências
```bash
cd backend
pip install django-ratelimit==4.1.0
pip freeze > requirements.txt
```

---

## 📦 PARTE 1: Backend (Django)

### PASSO 1.1: Configurar CORS e CSRF (CORRIGIDO)

**Arquivo:** `backend/portal_tcc/settings.py`

**⚠️ IMPORTANTE**: CSRF configuration correta para produção!

```python
# CORS (já existe - verificar)
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5400',
    'http://127.0.0.1:5400',
]
CORS_ALLOW_CREDENTIALS = True  # ✅ Necessário para cookies

# ========== CSRF Configuration (DOUBLE SUBMIT COOKIE) ==========
# ⚠️ ATENÇÃO: Nunca desabilitar CSRF em produção!

CSRF_COOKIE_HTTPONLY = False  # Frontend precisa ler o token
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SECURE = not DEBUG  # HTTPS obrigatório em produção
CSRF_COOKIE_NAME = 'csrftoken'
CSRF_HEADER_NAME = 'HTTP_X_CSRFTOKEN'

CSRF_TRUSTED_ORIGINS = [
    'http://localhost:5400',
    'http://127.0.0.1:5400',
]

# Session/Cookie Configuration
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SECURE = not DEBUG

# ⚠️ NUNCA faça isso em produção:
# CSRF_COOKIE_HTTPONLY = True  ← Frontend não consegue ler
# Comentar MIDDLEWARE CSRF  ← Vulnerabilidade crítica!
```

**Por quê `CSRF_COOKIE_HTTPONLY = False`?**

```
┌─────────────┐          ┌──────────────┐
│   Browser   │          │   Backend    │
└──────┬──────┘          └──────┬───────┘
       │                        │
       │  1. GET /login         │
       ├───────────────────────>│
       │                        │
       │  Set-Cookie: csrftoken │ ← Cookie NÃO HttpOnly
       │<───────────────────────┤    (JS pode ler)
       │                        │
       │  2. JS lê cookie       │
       │  csrftoken = "abc123"  │
       │                        │
       │  3. POST /api/login/   │
       │  Header:               │
       │    X-CSRFToken: abc123 │ ← Envia no header
       ├───────────────────────>│
       │                        │
       │  ✅ Backend valida:    │
       │  Cookie == Header?     │
       │                        │
```

---

### PASSO 1.2: Adicionar Middleware CSRF (NÃO REMOVER!)

**Arquivo:** `backend/portal_tcc/settings.py` (linha ~57)

**VERIFICAR** que o middleware CSRF está ativo:

```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',  # ✅ NUNCA REMOVER!
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
```

**⚠️ AVISO CRÍTICO:**
```python
# ❌ NUNCA FAÇA ISSO (nem em debug):
# MIDDLEWARE = [
#     # 'django.middleware.csrf.CsrfViewMiddleware',  ← COMENTAR = VULNERABILIDADE
# ]

# ✅ Se CSRF der erro, corrija a configuração, não desabilite!
```

---

### PASSO 1.3: Reduzir Tempo do Access Token

**Arquivo:** `backend/portal_tcc/settings.py` (linha ~168)

```python
# Simple JWT
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=10),  # ✅ Era 60
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'AUTH_HEADER_TYPES': ('Bearer',),
}
```

---

### PASSO 1.4: Configurar Rate Limiting (CORRIGIDO)

**Arquivo:** `backend/portal_tcc/settings.py`

**1. Adicionar app:**

```python
INSTALLED_APPS = [
    # ...
    'django_extensions',
    'django_ratelimit',  # ← Adicionar

    # Local apps
    'users',
    # ...
]
```

**2. Configurar handler 429 (NOVO):**

```python
# No final do settings.py
RATELIMIT_VIEW = 'users.views.ratelimited_error'
```

**⚠️ IMPORTANTE**: Rate limiting só em endpoints críticos!

```python
# ✅ Aplicar rate limit em:
# - Login
# - Registro
# - Reset de senha
# - Mudança de senha

# ❌ NÃO aplicar em:
# - GET endpoints (leitura)
# - Refresh token (já tem proteção)
# - Perfil do usuário
```

---

### PASSO 1.5: Criar Custom Authentication Class

**CRIAR:** `backend/users/authentication.py`

```python
"""
Custom authentication class que lê JWT de cookies HttpOnly.
"""
from rest_framework_simplejwt.authentication import JWTAuthentication


class CookieJWTAuthentication(JWTAuthentication):
    """
    Autentica usando JWT de cookies HttpOnly.

    Ordem:
    1. Cookie 'access_token' (prioritário)
    2. Header 'Authorization' (fallback)
    """

    def authenticate(self, request):
        # Tentar cookie primeiro
        raw_token = request.COOKIES.get('access_token')

        # Fallback: header Authorization
        if raw_token is None:
            header = self.get_header(request)
            if header is None:
                return None
            raw_token = self.get_raw_token(header)

        if raw_token is None:
            return None

        # Validar token
        validated_token = self.get_validated_token(raw_token)

        # ✅ NOVO: Verificar is_active
        user = self.get_user(validated_token)

        if not user.is_active:
            # Usuário desativado não pode acessar
            return None

        return user, validated_token
```

**Por quê verificar `is_active` aqui?**

```python
# Cenário: Coordenador desativa usuário
usuario.is_active = False
usuario.save()

# SEM verificação: Usuário continua logado! ❌
# COM verificação: Próxima requisição = 401 ✅
```

---

### PASSO 1.6: Ativar Custom Authentication

**Arquivo:** `backend/portal_tcc/settings.py` (linha ~154)

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'users.authentication.CookieJWTAuthentication',  # ✅ Custom
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}
```

---

### PASSO 1.7: Criar Helpers de Rate Limiting

**CRIAR:** `backend/users/utils.py`

```python
"""
Utilitários para autenticação e segurança.
"""
from django.http import JsonResponse


def ratelimited_error(request, exception):
    """
    Handler customizado para erro 429 (rate limit).
    """
    return JsonResponse({
        'detail': 'Muitas tentativas. Aguarde 1 minuto e tente novamente.',
        'retry_after': 60,
        'type': 'rate_limit_exceeded'
    }, status=429)


def get_client_ip(request):
    """
    Obtém IP real do cliente (considera proxies).
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip
```

---

### PASSO 1.8: Atualizar View de Login (CORRIGIDO)

**Arquivo:** `backend/users/views.py`

**1. Imports no topo:**

```python
from django.conf import settings
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
import logging

logger = logging.getLogger(__name__)
```

**2. SUBSTITUIR `CustomTokenObtainPairView`:**

```python
@method_decorator(
    ratelimit(key='ip', rate='5/m', method='POST', block=True),
    name='dispatch'
)
class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Login com HttpOnly cookies + proteções de segurança.

    Proteções:
    - Rate limiting (5 tentativas/min por IP)
    - Checagem is_active
    - Cookies HttpOnly
    - Support "remember_me"
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        lembrar_me = request.data.get('remember_me', False)

        # ✅ NOVO: Verificar is_active ANTES de autenticar
        try:
            usuario = Usuario.objects.get(email=email)

            if not usuario.is_active:
                logger.warning(
                    f'Tentativa de login de usuário inativo: {email} '
                    f'de IP {request.META.get("REMOTE_ADDR")}'
                )
                return Response({
                    'detail': 'Conta desativada. Entre em contato com o coordenador.'
                }, status=status.HTTP_403_FORBIDDEN)

        except Usuario.DoesNotExist:
            # Não revelar se usuário existe (segurança)
            pass

        # Autenticar normalmente
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            access_token = response.data.get('access')
            refresh_token = response.data.get('refresh')

            try:
                usuario = Usuario.objects.get(email=email)

                # Log de sucesso
                logger.info(
                    f'Login bem-sucedido: {email} de {request.META.get("REMOTE_ADDR")}'
                )

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
                max_age_access = 600 if lembrar_me else None  # 10 min ou sessão
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
        else:
            # Log de falha
            logger.warning(
                f'Falha de login: {email} de {request.META.get("REMOTE_ADDR")}'
            )

        return response
```

**Checklist de segurança:**
- ✅ Rate limiting (5/min)
- ✅ Checagem `is_active`
- ✅ Logging de sucessos/falhas
- ✅ Cookies HttpOnly
- ✅ `remember_me` funcional

---

### PASSO 1.9: Atualizar View de Logout

**Arquivo:** `backend/users/views.py`

```python
class LogoutView(APIView):
    """
    Logout: limpa cookies + blacklist refresh token.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token')

        try:
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()

                logger.info(
                    f'Logout: {request.user.email if request.user.is_authenticated else "unknown"}'
                )

        except Exception as e:
            logger.warning(f'Erro ao blacklist token no logout: {str(e)}')

        # Sempre limpar cookies (mesmo com erro)
        response = Response({
            'message': 'Logout realizado com sucesso'
        }, status=status.HTTP_200_OK)

        response.delete_cookie('access_token', path='/')
        response.delete_cookie('refresh_token', path='/')

        return response
```

---

### PASSO 1.10: Criar View de Refresh Customizada

**Arquivo:** `backend/users/views.py`

```python
from rest_framework_simplejwt.views import TokenRefreshView as BaseTokenRefreshView

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
```

**Arquivo:** `backend/users/urls.py`

Atualizar import:

```python
from .views import TokenRefreshView  # Custom
```

---

### ✅ CHECKPOINT BACKEND

Teste com curl:

```bash
# 1. Login
curl -X POST http://localhost:8111/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "password": "senha123", "remember_me": true}' \
  -c cookies.txt -v

# 2. Endpoint protegido
curl http://localhost:8111/api/auth/profile/ \
  -b cookies.txt -v

# 3. Logout
curl -X POST http://localhost:8111/api/auth/logout/ \
  -b cookies.txt -v
```

---

## ⚛️ PARTE 2: Frontend (React)

### PASSO 2.1: Atualizar API Client com CSRF

**Arquivo:** `frontend/src/servicos/api.ts`

**SUBSTITUIR TODO:**

```typescript
/**
 * API Client com HttpOnly Cookies + CSRF Protection
 */
import axios from 'axios';
import type { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8111/api';
export const MEDIA_URL = import.meta.env.VITE_MEDIA_URL || 'http://localhost:8111/media';

/**
 * Extrai CSRF token do cookie
 */
function getCsrfToken(): string | null {
  const name = 'csrftoken';
  const cookies = document.cookie.split(';');

  for (let cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      return decodeURIComponent(cookieValue);
    }
  }

  return null;
}

// Criar instância do Axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,  // ✅ Cookies automáticos
});

/**
 * Interceptor de REQUEST: adiciona CSRF token
 */
api.interceptors.request.use(
  (config) => {
    // Adicionar CSRF token em requisições mutáveis
    if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
      }
    }
    return config;
  },
  (erro) => Promise.reject(erro)
);

/**
 * Interceptor de RESPONSE: trata erros
 */
api.interceptors.response.use(
  (resposta) => resposta,
  async (erro: AxiosError) => {
    const requisicaoOriginal = erro.config as typeof erro.config & { _retry?: boolean };

    // Erro 401: tentar refresh
    if (erro.response?.status === 401 && !requisicaoOriginal?._retry) {
      requisicaoOriginal._retry = true;

      try {
        await axios.post(
          `${API_BASE_URL}/auth/refresh/`,
          {},
          { withCredentials: true }
        );

        // Repetir requisição
        return api(requisicaoOriginal);
      } catch {
        // Refresh falhou
        window.location.href = '/login';
        return Promise.reject(erro);
      }
    }

    // Erro 403
    if (erro.response?.status === 403) {
      console.error('Acesso negado:', erro.response.data);
    }

    // Erro 429: Rate limit
    if (erro.response?.status === 429) {
      console.error('Muitas tentativas. Aguarde 1 minuto.');
    }

    return Promise.reject(erro);
  }
);

/**
 * Helper para extrair mensagem de erro
 */
export const extrairMensagemErro = (erro: unknown): string => {
  if (axios.isAxiosError(erro)) {
    const dados = erro.response?.data;

    if (dados?.detail) return dados.detail;
    if (dados?.message) return dados.message;

    if (typeof dados === 'object') {
      const primeiroErro = Object.values(dados)[0];
      if (Array.isArray(primeiroErro)) return primeiroErro[0];
      if (typeof primeiroErro === 'string') return primeiroErro;
    }

    // Mensagens padrão
    const status = erro.response?.status;
    if (status === 429) return 'Muitas tentativas. Aguarde 1 minuto.';
    if (status === 404) return 'Recurso não encontrado';
    if (status === 403) return 'Você não tem permissão';
    if (status === 401) return 'Sessão expirada. Faça login';
    if (status === 500) return 'Erro no servidor';
    if (!erro.response) return 'Erro de conexão';
  }

  return 'Erro inesperado';
};

export default api;
```

**O que mudou:**
- ✅ Função `getCsrfToken()` lê do cookie
- ✅ Interceptor REQUEST adiciona `X-CSRFToken` em POST/PUT/DELETE
- ✅ Tratamento de erro 429 (rate limit)

---

### PASSO 2.2: Simplificar Provedor de Autenticação

**Arquivo:** `frontend/src/autenticacao/ProvedorAutenticacao.tsx`

```typescript
import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AutenticacaoContexto } from './autenticacaoContexto'
import { useTema } from '../tema'
import type { UsuarioLogado, RespostaLogin } from './tipos'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8111/api'

interface ProvedorAutenticacaoProps {
  children: ReactNode
}

export function ProvedorAutenticacao({ children }: ProvedorAutenticacaoProps) {
  const navigate = useNavigate()
  const { definirTema, definirTamanhoFonte } = useTema()

  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    buscarPerfilUsuario()
  }, [])

  const buscarPerfilUsuario = async () => {
    try {
      const resposta = await fetch(`${API_BASE_URL}/auth/profile/`, {
        credentials: 'include',
      })

      if (resposta.ok) {
        const dados: UsuarioLogado = await resposta.json()
        setUsuario(dados)

        if (dados.preferencias_visuais) {
          definirTema(dados.preferencias_visuais.tema)
          definirTamanhoFonte(dados.preferencias_visuais.tamanho_fonte)
        }
      } else if (resposta.status === 401) {
        // Tentar refresh
        try {
          const refreshResp = await fetch(`${API_BASE_URL}/auth/refresh/`, {
            method: 'POST',
            credentials: 'include',
          })

          if (refreshResp.ok) {
            await buscarPerfilUsuario()
          } else {
            setUsuario(null)
          }
        } catch {
          setUsuario(null)
        }
      }
    } catch (erro) {
      console.error('Erro ao buscar perfil:', erro)
      setUsuario(null)
    } finally {
      setCarregando(false)
    }
  }

  const login = useCallback(async (email: string, senha: string, lembrarMe: boolean = false) => {
    setCarregando(true)

    try {
      const resposta = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password: senha,
          remember_me: lembrarMe
        }),
      })

      if (!resposta.ok) {
        const dados = await resposta.json()
        throw new Error(dados.detail || 'Email ou senha inválidos')
      }

      const dados: RespostaLogin = await resposta.json()
      setUsuario(dados.user)

      if (dados.user.preferencias_visuais) {
        definirTema(dados.user.preferencias_visuais.tema)
        definirTamanhoFonte(dados.user.preferencias_visuais.tamanho_fonte)
      }

      redirecionarPorTipo(dados.user.tipo_usuario)
    } catch (erro) {
      setCarregando(false)
      throw erro
    }
  }, [definirTema, definirTamanhoFonte, navigate])

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout/`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch (erro) {
      console.error('Erro ao fazer logout:', erro)
    } finally {
      setUsuario(null)
      navigate('/login')
    }
  }, [navigate])

  const redirecionarPorTipo = (tipoUsuario: string) => {
    const rotas: Record<string, string> = {
      'ALUNO': '/aluno',
      'PROFESSOR': '/professor',
      'COORDENADOR': '/dashboard',
      'AVALIADOR': '/avaliador',
    }
    navigate(rotas[tipoUsuario] || '/aluno')
  }

  const estaAutenticado = useMemo(() => !!usuario, [usuario])

  const contexto = useMemo(
    () => ({
      usuario,
      tokens: null,
      carregando,
      login,
      logout,
      atualizarToken: async () => {},
      estaAutenticado,
    }),
    [usuario, carregando, login, logout, estaAutenticado]
  )

  return (
    <AutenticacaoContexto.Provider value={contexto}>
      {children}
    </AutenticacaoContexto.Provider>
  )
}
```

---

### PASSO 2.3: Atualizar Página de Login

**Arquivo:** `frontend/src/paginas/PaginaLogin.tsx`

Linha 60 - handleSubmit:

```typescript
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault()
  setErro(null)

  if (!validarCampos()) return

  setCarregando(true)

  try {
    await loginAuth(email, senha, lembrarMe)  // ✅ Passar lembrarMe
  } catch (error: any) {
    setErro({
      mensagem: error.message || 'Erro ao fazer login',
      tipo: 'api',
    })
    setCarregando(false)
  }
}
```

---

### PASSO 2.4: Atualizar Tipos

**Arquivo:** `frontend/src/autenticacao/tipos.ts`

```typescript
export interface RespostaLogin {
  user: UsuarioLogado  // ✅ Não mais "access" e "refresh"
}
```

---

## 🔒 PARTE 3: Melhorias de Segurança

### Melhoria 1: Verificar is_active em Todas as Requisições

**Já implementado** em `CookieJWTAuthentication.authenticate()`

### Melhoria 2: Logging de Segurança

**Arquivo:** `backend/portal_tcc/settings.py`

```python
# Logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'WARNING',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'security.log',
            'formatter': 'verbose',
        },
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'users': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
```

Criar pasta:
```bash
mkdir backend/logs
```

---

## 🧪 Testes

### Teste 1: "Lembrar-me" = TRUE
1. Login com checkbox marcado
2. Fechar navegador
3. Abrir novamente
4. ✅ Deve estar logado

### Teste 2: "Lembrar-me" = FALSE
1. Login SEM checkbox
2. Fechar aba
3. Nova aba
4. ✅ Deve pedir login

### Teste 3: Rate Limiting
```bash
# 6 logins errados seguidos
# ✅ 6º deve retornar 429
```

### Teste 4: CSRF Protection
```bash
# Remover header X-CSRFToken
# ✅ Deve retornar 403 Forbidden
```

### Teste 5: is_active
```python
# Backend shell
usuario = Usuario.objects.get(email='test@test.com')
usuario.is_active = False
usuario.save()

# Tentar fazer requisição
# ✅ Deve retornar 401
```

---

## 🐛 Troubleshooting

### Erro: "CSRF token missing or incorrect"

**Solução:**
1. Verificar cookie `csrftoken` existe (DevTools)
2. Verificar header `X-CSRFToken` sendo enviado
3. Verificar `CSRF_COOKIE_HTTPONLY = False`

**⚠️ NÃO fazer:**
```python
# ❌ NUNCA:
# 'django.middleware.csrf.CsrfViewMiddleware',  # Comentar
```

---

### Erro: Cookies não enviados

1. Verificar `withCredentials: true`
2. Verificar `CORS_ALLOW_CREDENTIALS = True`
3. Verificar domínios em `CORS_ALLOWED_ORIGINS`

---

### Erro: Rate limit bloqueando tudo

```python
# Aplicar só em endpoints específicos, não global:

@ratelimit(key='ip', rate='5/m', method='POST')  # ✅ Só neste endpoint
def login_view(request):
    pass
```

---

## 📚 Checklist Final de Segurança

- [x] CSRF middleware ativo
- [x] CSRF double-submit configurado
- [x] HttpOnly cookies
- [x] Secure=True em produção
- [x] SameSite=Lax
- [x] Rate limiting em endpoints críticos
- [x] is_active checado
- [x] Logging de eventos de segurança
- [x] Access token curto (10min)
- [x] Refresh token rotation
- [x] Token blacklist no logout

---

## 🎓 Resumo

### Correções Aplicadas (v2):

1. ✅ **CSRF correto** - Double submit com header X-CSRFToken
2. ✅ **NUNCA desabilitar** middleware CSRF
3. ✅ **is_active check** - Em authentication class + login view
4. ✅ **Rate limiting** - Só endpoints críticos + handler 429
5. ✅ **Logging** - Eventos de segurança
6. ✅ **Avisos claros** - O que NUNCA fazer

---

**BOA SORTE! 🔒**

Este guia agora está **production-ready** com todas as proteções de segurança necessárias.
