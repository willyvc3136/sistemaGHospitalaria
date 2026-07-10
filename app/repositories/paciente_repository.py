from app.core.database import get_db


class PacienteRepository:
    """
    Patron Repository: encapsula todo el acceso a datos de la tabla 'pacientes'.
    El resto de la aplicacion no debe hablar con Supabase directamente,
    solo a traves de esta clase.
    """

    def __init__(self):
        self.db = get_db()

    def obtener_todos(self):
        resultado = self.db.table("pacientes").select("*").execute()
        return resultado.data

    def obtener_por_id(self, paciente_id: int):
        resultado = self.db.table("pacientes").select("*").eq("id", paciente_id).single().execute()
        return resultado.data

    def obtener_por_usuario_id(self, usuario_id: str):
        resultado = self.db.table("pacientes").select("*").eq("usuario_id", usuario_id).single().execute()
        return resultado.data

    def crear(self, datos: dict):
        resultado = self.db.table("pacientes").insert(datos).execute()
        return resultado.data[0] if resultado.data else None
