from django.apps import AppConfig


class DefinicoesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'definicoes'
    verbose_name = 'Definicoes'

    def ready(self):
        """
        Carrega as configurações de e-mail do banco de dados ao iniciar o servidor.
        Isso garante que o EMAIL_BACKEND seja aplicado automaticamente.
        """
        try:
            from .models import ConfiguracaoEmail
            config = ConfiguracaoEmail.obter_configuracao()
            config.aplicar_configuracao()
        except Exception:
            # Ignora erros durante migrações ou quando o banco ainda não está pronto
            pass
