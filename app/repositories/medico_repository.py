from app.core.database import get_db


class MedicoRepository:
    """
    Patron Repository: encapsula todo el acceso a datos de la tabla 'medicos'.
    """

    def __init__(self):
        self.db = get_db()

    def obtener_todos(self):
        resultado = self.db.table("medicos").select("*").execute()
        return resultado.data

    def obtener_por_id(self, medico_id: int):
        resultado = self.db.table("medicos").select("*").eq("id", medico_id).single().execute()
        return resultado.data

    def obtener_por_usuario_id(self, usuario_id: str):
        resultado = self.db.table("medicos").select("*").eq("usuario_id", usuario_id).single().execute()
        return resultado.data

    def crear(self, datos: dict):
        resultado = self.db.table("medicos").insert(datos).execute()
        return resultado.data[0] if resultado.data else None
