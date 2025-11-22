"""
Backend de e-mail customizado que usa certifi para certificados SSL.
Resolve problemas de verificação de certificados no Windows.
"""
import ssl
import certifi
from django.core.mail.backends.smtp import EmailBackend as DjangoEmailBackend


class EmailBackend(DjangoEmailBackend):
    """
    Backend SMTP customizado que usa certifi para certificados SSL confiáveis.
    """

    def open(self):
        """
        Abre a conexão SMTP com contexto SSL usando certifi.
        """
        if self.connection:
            return False

        connection_params = {}
        if self.timeout is not None:
            connection_params['timeout'] = self.timeout
        if self.use_ssl:
            connection_params['context'] = self._get_ssl_context()

        try:
            self.connection = self.connection_class(
                self.host, self.port, **connection_params
            )

            # TLS/STARTTLS
            if self.use_tls:
                self.connection.starttls(context=self._get_ssl_context())

            if self.username and self.password:
                self.connection.login(self.username, self.password)

            return True
        except Exception:
            if not self.fail_silently:
                raise
            return False

    def _get_ssl_context(self):
        """
        Cria um contexto SSL usando certifi para certificados confiáveis.
        Em ambiente de desenvolvimento com proxy/firewall, desabilita verificação.
        """
        import os
        from django.conf import settings

        # Criar contexto SSL padrão
        context = ssl.create_default_context(cafile=certifi.where())

        # Em modo DEBUG (desenvolvimento), desabilitar verificação SSL
        # para contornar problemas com proxy/firewall
        if settings.DEBUG:
            context.check_hostname = False
            context.verify_mode = ssl.CERT_NONE

        return context
