from supabase import create_client, Client
from app.core.config import settings


class SupabaseAuthClient:
    """
    Cliente dedicado a operaciones de autenticacion (login, verificar token).
    Separado de la conexion de datos para mantener responsabilidades claras.
    """
    _instance: Client = None

    @classmethod
    def get_client(cls) -> Client:
        if cls._instance is None:
            cls._instance = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_SERVICE_KEY
            )
        return cls._instance


def login_usuario(email: str, password: str):
    """
    Intenta iniciar sesion con email y password.
    Retorna el token de acceso si es exitoso.
    """
    client = SupabaseAuthClient.get_client()
    resultado = client.auth.sign_in_with_password({
        "email": email,
        "password": password
    })
    return resultado


def obtener_usuario_desde_token(token: str):
    """
    Verifica un token y retorna el usuario asociado.
    Se usara en el middleware RBAC para proteger endpoints.
    """
    client = SupabaseAuthClient.get_client()
    resultado = client.auth.get_user(token)
    return resultado
