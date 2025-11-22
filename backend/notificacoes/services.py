"""
Serviços para criação e gerenciamento de notificações.
"""
from .models import Notificacao
from .constants import PrioridadeNotificacao
from .email_service import deve_enviar_email, enviar_email
import logging

logger = logging.getLogger(__name__)


def criar_notificacao(
    usuario,
    tipo,
    titulo,
    mensagem,
    action_url=None,
    metadata=None,
    tcc_id=None,
    prioridade=PrioridadeNotificacao.NORMAL
):
    """
    Cria uma notificação para um usuário específico.

    Args:
        usuario: Instância do model Usuario
        tipo: String do tipo de notificação (TipoNotificacao)
        titulo: Título da notificação
        mensagem: Texto da mensagem
        action_url: URL opcional para ação ao clicar
        metadata: Dict opcional com dados adicionais
        tcc_id: ID opcional do TCC relacionado
        prioridade: Nível de prioridade (default: NORMAL)

    Returns:
        Instância da Notificacao criada
    """
    return Notificacao.objects.create(
        usuario=usuario,
        tipo=tipo,
        titulo=titulo,
        mensagem=mensagem,
        action_url=action_url,
        metadata=metadata or {},
        tcc_id=tcc_id,
        prioridade=prioridade
    )


def criar_notificacao_em_massa(
    usuarios,
    tipo,
    titulo,
    mensagem,
    action_url=None,
    metadata=None,
    tcc_id=None,
    prioridade=PrioridadeNotificacao.NORMAL
):
    """
    Cria notificações para múltiplos usuários de uma vez (bulk create).

    Args:
        usuarios: Lista de instâncias do model Usuario
        tipo: String do tipo de notificação (TipoNotificacao)
        titulo: Título da notificação
        mensagem: Texto da mensagem
        action_url: URL opcional para ação ao clicar
        metadata: Dict opcional com dados adicionais
        tcc_id: ID opcional do TCC relacionado
        prioridade: Nível de prioridade (default: NORMAL)

    Returns:
        Lista de instâncias de Notificacao criadas
    """
    notificacoes = [
        Notificacao(
            usuario=usuario,
            tipo=tipo,
            titulo=titulo,
            mensagem=mensagem,
            action_url=action_url,
            metadata=metadata or {},
            tcc_id=tcc_id,
            prioridade=prioridade
        )
        for usuario in usuarios
    ]

    return Notificacao.objects.bulk_create(notificacoes)


def criar_notificacao_com_email(
    usuario,
    tipo,
    titulo,
    mensagem,
    campo_preferencia,
    action_url=None,
    metadata=None,
    tcc_id=None,
    prioridade=PrioridadeNotificacao.NORMAL
):
    """
    Cria uma notificação e envia e-mail se o usuário tiver a preferência habilitada.

    Args:
        usuario: Instância do model Usuario
        tipo: String do tipo de notificação (TipoNotificacao)
        titulo: Título da notificação
        mensagem: Texto da mensagem
        campo_preferencia: Nome do campo de preferência de e-mail (ex: 'aluno_aceitar_convite_orientador')
        action_url: URL opcional para ação ao clicar
        metadata: Dict opcional com dados adicionais
        tcc_id: ID opcional do TCC relacionado
        prioridade: Nível de prioridade (default: NORMAL)

    Returns:
        Instância da Notificacao criada
    """
    # Criar notificação
    notificacao = criar_notificacao(
        usuario=usuario,
        tipo=tipo,
        titulo=titulo,
        mensagem=mensagem,
        action_url=action_url,
        metadata=metadata,
        tcc_id=tcc_id,
        prioridade=prioridade
    )

    # Verificar se deve enviar e-mail
    if deve_enviar_email(usuario, campo_preferencia):
        try:
            # Montar corpo do e-mail
            corpo_texto = f"""
Olá {usuario.nome_completo},

{mensagem}

---
Portal TCC
Esta é uma notificação automática. Acesse o sistema para mais detalhes.
            """

            # Enviar e-mail
            enviar_email(
                destinatarios=[usuario.email],
                assunto=f"[Portal TCC] {titulo}",
                corpo_texto=corpo_texto
            )
        except Exception as e:
            logger.error(f"Erro ao enviar e-mail para {usuario.email}: {str(e)}")

    return notificacao


def criar_notificacao_em_massa_com_email(
    usuarios,
    tipo,
    titulo,
    mensagem,
    campo_preferencia,
    action_url=None,
    metadata=None,
    tcc_id=None,
    prioridade=PrioridadeNotificacao.NORMAL
):
    """
    Cria notificações para múltiplos usuários e envia e-mails individualmente
    respeitando as preferências de cada um.

    Args:
        usuarios: Lista de instâncias do model Usuario
        tipo: String do tipo de notificação (TipoNotificacao)
        titulo: Título da notificação
        mensagem: Texto da mensagem
        campo_preferencia: Nome do campo de preferência de e-mail
        action_url: URL opcional para ação ao clicar
        metadata: Dict opcional com dados adicionais
        tcc_id: ID opcional do TCC relacionado
        prioridade: Nível de prioridade (default: NORMAL)

    Returns:
        Lista de instâncias de Notificacao criadas
    """
    # Criar notificações em massa
    notificacoes = criar_notificacao_em_massa(
        usuarios=usuarios,
        tipo=tipo,
        titulo=titulo,
        mensagem=mensagem,
        action_url=action_url,
        metadata=metadata,
        tcc_id=tcc_id,
        prioridade=prioridade
    )

    # Enviar e-mails individualmente respeitando preferências
    for usuario in usuarios:
        if deve_enviar_email(usuario, campo_preferencia):
            try:
                # Montar corpo do e-mail
                corpo_texto = f"""
Olá {usuario.nome_completo},

{mensagem}

---
Portal TCC
Esta é uma notificação automática. Acesse o sistema para mais detalhes.
                """

                # Enviar e-mail
                enviar_email(
                    destinatarios=[usuario.email],
                    assunto=f"[Portal TCC] {titulo}",
                    corpo_texto=corpo_texto
                )
            except Exception as e:
                logger.error(f"Erro ao enviar e-mail para {usuario.email}: {str(e)}")

    return notificacoes
