import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    """
    Configuración centralizada del proyecto.
    Cualquier parte de la app que necesite una variable de entorno
    la debe pedir aquí, en vez de leer el .env directamente.
    """
    SUPABASE_URL: str = os.environ.get("SUPABASE_URL")
    SUPABASE_SERVICE_KEY: str = os.environ.get("SUPABASE_SERVICE_KEY")

settings = Settings()
