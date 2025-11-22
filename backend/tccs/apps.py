from django.apps import AppConfig


class TccsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'tccs'

    def ready(self):
        """Importar signals quando o app for carregado."""
        import tccs.signals
