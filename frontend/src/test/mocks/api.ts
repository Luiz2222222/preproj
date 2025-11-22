import { vi } from 'vitest'

// Mock do módulo api
export const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}

export const extrairMensagemErro = vi.fn((err: any) => {
  return err?.response?.data?.detail || err?.message || 'Erro desconhecido'
})

vi.mock('../../servicos/api', () => ({
  default: mockApi,
  extrairMensagemErro,
}))
