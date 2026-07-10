from supabase import create_client, Client
from app.core.config import settings


class SupabaseConnection:
    """
    Patron Singleton: garantiza que exista una unica instancia
    de conexion a Supabase en toda la aplicacion.
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


def get_db() -> Client:
    """
    Funcion de conveniencia para obtener el cliente de Supabase.
    Se usara como dependencia en los endpoints de FastAPI.
    """
    return SupabaseConnection.get_client()
