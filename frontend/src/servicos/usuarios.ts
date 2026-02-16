/**
 * Serviços para endpoints de usuários
 */

import api, { extrairMensagemErro } from './api';

export interface ProfessorListItem {
  id: number;
  nome_completo: string;
  email: string;
  tratamento: string | null;
  tratamento_customizado: string | null;
  departamento: string | null;
}

/**
 * Listar todos os professores cadastrados
 * GET /professores/
 */
export async function listarProfessores(): Promise<ProfessorListItem[]> {
  try {
    const resposta = await api.get<ProfessorListItem[]>('/professores/');
    return resposta.data;
  } catch (erro) {
    const mensagem = extrairMensagemErro(erro);
    throw new Error(mensagem);
  }
}

/**
 * Listar professores e avaliadores externos (para formação de banca)
 * GET /coorientadores/
 */
export async function listarAvaliadores(): Promise<ProfessorListItem[]> {
  try {
    const resposta = await api.get<ProfessorListItem[]>('/coorientadores/');
    return resposta.data;
  } catch (erro) {
    const mensagem = extrairMensagemErro(erro);
    throw new Error(mensagem);
  }
}

export interface AlterarSenhaData {
  senha_atual: string;
  nova_senha: string;
  confirmar_senha: string;
}

export interface AtualizarPerfilCoordenadorData {
  nome_completo: string;
  email: string;
  tratamento?: string;
  tratamento_customizado?: string;
  departamento?: string;
  senha_atual: string;
}

export interface PerfilUsuario {
  id: number;
  email: string;
  nome_completo: string;
  tipo_usuario: string;
  tratamento?: string;
  tratamento_customizado?: string;
  departamento?: string;
  afiliacao?: string;
  curso?: string;
  curso_display?: string;
}

/**
 * Obter dados do perfil do usuário autenticado
 * GET /auth/profile/
 */
export async function obterPerfil(): Promise<PerfilUsuario> {
  try {
    const resposta = await api.get<PerfilUsuario>('/auth/profile/');
    return resposta.data;
  } catch (erro) {
    const mensagem = extrairMensagemErro(erro);
    throw new Error(mensagem);
  }
}

/**
 * Alterar senha do usuário autenticado
 * POST /auth/alterar-senha/
 */
export async function alterarSenha(dados: AlterarSenhaData): Promise<{ message: string }> {
  try {
    const resposta = await api.post<{ message: string }>('/auth/alterar-senha/', dados);
    return resposta.data;
  } catch (erro) {
    const mensagem = extrairMensagemErro(erro);
    throw new Error(mensagem);
  }
}

/**
 * Atualizar perfil do coordenador
 * PUT /auth/profile/
 */
export async function atualizarPerfilCoordenador(dados: AtualizarPerfilCoordenadorData): Promise<PerfilUsuario> {
  try {
    const resposta = await api.put<PerfilUsuario>('/auth/profile/', dados);
    return resposta.data;
  } catch (erro) {
    const mensagem = extrairMensagemErro(erro);
    throw new Error(mensagem);
  }
}
