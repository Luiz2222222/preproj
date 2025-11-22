/**
 * Módulo de sincronização de tokens entre api.ts e ProvedorAutenticacao
 *
 * Permite que o interceptor do axios notifique o contexto de autenticação
 * quando tokens são renovados, mantendo localStorage e estado React sincronizados
 */

type CallbackAtualizarTokens = (access: string, refresh?: string) => void

let callback: CallbackAtualizarTokens | null = null

/**
 * Registra callback que será chamado quando tokens forem atualizados
 * Deve ser chamado pelo ProvedorAutenticacao no mount
 */
export const registrarCallbackTokens = (cb: CallbackAtualizarTokens) => {
  callback = cb
}

/**
 * Notifica que tokens foram atualizados (chamado por api.ts)
 */
export const notificarTokensAtualizados = (access: string, refresh?: string) => {
  if (callback) {
    callback(access, refresh)
  }
}
