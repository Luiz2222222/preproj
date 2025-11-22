"""
Serviço de envio de e-mails para notificações do sistema.
"""
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def deve_enviar_email(usuario, campo_preferencia):
    """
    Verifica se o usuário deseja receber e-mail para um tipo específico de notificação.

    Args:
        usuario: Instância do modelo Usuario
        campo_preferencia (str): Nome do campo de preferência (ex: 'aluno_aceitar_convite_orientador')

    Returns:
        bool: True se o usuário deseja receber e-mail, False caso contrário
    """
    try:
        # Importação local para evitar circular import
        from .models import PreferenciasEmail

        # Obter ou criar preferências do usuário (defaults são todos True)
        preferencias, created = PreferenciasEmail.objects.get_or_create(usuario=usuario)

        # Verificar se o campo existe e retornar seu valor
        if hasattr(preferencias, campo_preferencia):
            return getattr(preferencias, campo_preferencia)
        else:
            logger.warning(f"Campo de preferência '{campo_preferencia}' não existe. Retornando False.")
            return False

    except Exception as e:
        logger.error(f"Erro ao verificar preferência de e-mail: {str(e)}")
        # Em caso de erro, não enviar e-mail para evitar spam
        return False


def enviar_email(destinatarios, assunto, corpo_texto, corpo_html=None):
    """
    Envia e-mail para os destinatários especificados.

    Args:
        destinatarios (list): Lista de endereços de e-mail dos destinatários
        assunto (str): Assunto do e-mail
        corpo_texto (str): Corpo do e-mail em texto plano
        corpo_html (str, optional): Corpo do e-mail em HTML

    Returns:
        bool: True se o e-mail foi enviado com sucesso, False caso contrário
    """
    # Verificar se o envio de e-mails está habilitado
    if not settings.EMAIL_ENABLED:
        logger.info(f"E-mail desabilitado. Assunto: {assunto}, Destinatários: {destinatarios}")
        return False

    # Validar destinatários
    if not destinatarios:
        logger.warning("Tentativa de enviar e-mail sem destinatários")
        return False

    # Garantir que destinatarios seja uma lista
    if isinstance(destinatarios, str):
        destinatarios = [destinatarios]

    try:
        # Enviar e-mail
        send_mail(
            subject=assunto,
            message=corpo_texto,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=destinatarios,
            html_message=corpo_html,
            fail_silently=False,
        )

        logger.info(f"E-mail enviado com sucesso. Assunto: {assunto}, Destinatários: {len(destinatarios)}")
        return True

    except Exception as e:
        logger.error(f"Erro ao enviar e-mail. Assunto: {assunto}, Erro: {str(e)}")
        return False
