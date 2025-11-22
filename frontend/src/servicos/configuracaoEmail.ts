import api from './api';

export interface ConfiguracaoEmail {
  id: number;
  email_enabled: boolean;
  email_host: string;
  email_port: number;
  email_use_tls: boolean;
  email_host_user: string;
  password_masked: string;
  atualizado_em: string;
}

export interface ConfiguracaoEmailInput {
  email_enabled?: boolean;
  email_host?: string;
  email_port?: number;
  email_use_tls?: boolean;
  email_host_user?: string;
  password?: string;
}

export const obterConfiguracaoEmail = async (): Promise<ConfiguracaoEmail> => {
  const response = await api.get('/config/email/');
  return response.data;
};

export const atualizarConfiguracaoEmail = async (
  dados: ConfiguracaoEmailInput
): Promise<ConfiguracaoEmail> => {
  const response = await api.put('/config/email/', dados);
  return response.data;
};

export const obterSenhaReal = async (): Promise<string> => {
  const response = await api.get('/config/email/senha-real/');
  return response.data.password;
};
