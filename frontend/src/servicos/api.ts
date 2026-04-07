/**
 * API Client com HttpOnly Cookies + CSRF Protection
 */
import axios from 'axios';
import type { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8500/api';
export const MEDIA_URL = import.meta.env.VITE_MEDIA_URL || 'http://localhost:8500/media';

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

    // Erro 401: tentar refresh (exceto se já tentou ou se é a própria rota de refresh)
    const isRefreshEndpoint = requisicaoOriginal?.url?.includes('/auth/refresh/');
    if (erro.response?.status === 401 && !requisicaoOriginal?._retry && !isRefreshEndpoint) {
      requisicaoOriginal._retry = true;

      try {
        await axios.post(
          `${API_BASE_URL}/auth/refresh/`,
          {},
          { withCredentials: true }
        );

        // Repetir requisição original uma única vez
        return api(requisicaoOriginal);
      } catch {
        // Refresh falhou → redirecionar para login
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
