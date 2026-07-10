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

    def obtener_medico_general(self):
        """
        Retorna el primer medico disponible con especialidad 'Medicina General'.
        Usado para asignar automaticamente citas reservadas por pacientes,
        que luego pueden ser derivadas a un especialista por Recepcion.
        """
        resultado = self.db.table("medicos").select("*").ilike("especialidad", "%general%").limit(1).execute()
        return resultado.data[0] if resultado.data else None

    def crear(self, datos: dict):
        resultado = self.db.table("medicos").insert(datos).execute()
        return resultado.data[0] if resultado.data else None
