"""Serviços de cálculo de permissões e prazos para TCCs."""

from django.utils import timezone
from definicoes.models import CalendarioSemestre
from .constants import StatusDocumento, TipoDocumento


def obter_calendario_para_tcc(tcc):
    """Busca o calendário correspondente ao semestre do TCC."""
    # Tenta usar o semestre do TCC se existir
    semestre = getattr(tcc, 'semestre', None)
    calendario = CalendarioSemestre.obter_calendario_atual(semestre)

    # Se não encontrou, tenta o calendário ativo geral
    if not calendario and semestre:
        calendario = CalendarioSemestre.obter_calendario_atual()

    return calendario


def monografia_aprovada(tcc):
    """Verifica se existe monografia aprovada no TCC."""
    return tcc.documentos.filter(
        tipo_documento=TipoDocumento.MONOGRAFIA,
        status=StatusDocumento.APROVADO
    ).exists()


def calcular_permissoes_tcc(tcc):
    """
    Calcula as permissões de ações baseadas em prazos e liberações manuais.

    Retorna dict com booleanos indicando se cada ação está permitida.
    """
    calendario = obter_calendario_para_tcc(tcc)
    hoje = timezone.localdate()

    permissoes = {}

    # Envio de documentos iniciais
    if tcc.liberar_envio_documentos:
        permissoes['pode_enviar_documentos_iniciais'] = True
    elif not calendario or not calendario.envio_documentos_fim:
        permissoes['pode_enviar_documentos_iniciais'] = True
    else:
        permissoes['pode_enviar_documentos_iniciais'] = hoje <= calendario.envio_documentos_fim

    # Desenvolvimento (envio de monografia)
    if tcc.liberar_desenvolvimento:
        permissoes['pode_enviar_monografia'] = True
        permissoes['pode_solicitar_avaliacao'] = True
    elif not calendario or not calendario.submissao_monografia_fim:
        permissoes['pode_enviar_monografia'] = True
        permissoes['pode_solicitar_avaliacao'] = True
    else:
        dentro_prazo = hoje <= calendario.submissao_monografia_fim
        permissoes['pode_enviar_monografia'] = dentro_prazo
        permissoes['pode_solicitar_avaliacao'] = dentro_prazo

    # Confirmação de continuidade
    # Regra: só pode confirmar se monografia foi aprovada OU tem liberação manual
    # E o prazo não expirou
    if tcc.liberar_continuidade:
        permissoes['pode_confirmar_continuidade'] = True
    elif not monografia_aprovada(tcc):
        permissoes['pode_confirmar_continuidade'] = False
    elif not calendario or not calendario.avaliacao_continuidade_fim:
        permissoes['pode_confirmar_continuidade'] = True
    else:
        permissoes['pode_confirmar_continuidade'] = hoje <= calendario.avaliacao_continuidade_fim

    # Fase I - Permissão para avaliadores enviarem/editarem avaliações
    # Considera: liberação manual OU (prazo não expirado E não bloqueado pelo coordenador)
    if tcc.liberar_fase1:
        # Coordenador liberou manualmente
        permissoes['pode_editar_fase1'] = not tcc.avaliacao_fase1_bloqueada
    elif tcc.avaliacao_fase1_bloqueada:
        # Bloqueado pelo coordenador
        permissoes['pode_editar_fase1'] = False
    elif not calendario or not calendario.avaliacao_fase1_fim:
        # Sem calendário configurado = permitir
        permissoes['pode_editar_fase1'] = True
    else:
        # Dentro do prazo?
        permissoes['pode_editar_fase1'] = hoje <= calendario.avaliacao_fase1_fim

    # Defesas (Fase II)
    if tcc.liberar_defesas:
        permissoes['pode_registrar_defesa'] = True
    elif not calendario or not calendario.defesas_fim:
        permissoes['pode_registrar_defesa'] = True
    else:
        permissoes['pode_registrar_defesa'] = hoje <= calendario.defesas_fim

    # Fase II - Permissão para avaliadores enviarem/editarem avaliações de apresentação
    # Considera: liberação manual OU (prazo não expirado E não bloqueado pelo coordenador)
    if tcc.liberar_fase2:
        # Coordenador liberou manualmente
        permissoes['pode_editar_fase2'] = not tcc.avaliacao_fase2_bloqueada
    elif tcc.avaliacao_fase2_bloqueada:
        # Bloqueado pelo coordenador
        permissoes['pode_editar_fase2'] = False
    elif not calendario or not calendario.defesas_fim:
        # Sem calendário configurado = permitir
        permissoes['pode_editar_fase2'] = True
    else:
        # Dentro do prazo?
        permissoes['pode_editar_fase2'] = hoje <= calendario.defesas_fim

    # Ajustes Finais
    if tcc.liberar_ajustes_finais:
        permissoes['pode_enviar_ajustes'] = True
    elif not calendario or not calendario.ajustes_finais_fim:
        permissoes['pode_enviar_ajustes'] = True
    else:
        permissoes['pode_enviar_ajustes'] = hoje <= calendario.ajustes_finais_fim

    return permissoes
