"""
Custom authentication class que lê JWT de cookies HttpOnly.
"""
from rest_framework_simplejwt.authentication import JWTAuthentication


class CookieJWTAuthentication(JWTAuthentication):
    """
    Autentica usando JWT de cookies HttpOnly.

    Ordem:
    1. Cookie 'access_token' (prioritário)
    2. Header 'Authorization' (fallback)
    """

    def authenticate(self, request):
        # Tentar cookie primeiro
        raw_token = request.COOKIES.get('access_token')

        # Fallback: header Authorization
        if raw_token is None:
            header = self.get_header(request)
            if header is None:
                return None
            raw_token = self.get_raw_token(header)

        if raw_token is None:
            return None

        # Validar token e retornar user
        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token
