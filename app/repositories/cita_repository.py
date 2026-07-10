from app.core.database import get_db


class CitaRepository:
    """
    Patron Repository: encapsula todo el acceso a datos de la tabla 'citas'.
    """

    def __init__(self):
        self.db = get_db()

    def obtener_todas(self):
        resultado = self.db.table("citas").select("*").execute()
        return resultado.data

    def obtener_por_id(self, cita_id: int):
        resultado = self.db.table("citas").select("*").eq("id", cita_id).single().execute()
        return resultado.data

    def obtener_por_paciente(self, paciente_id: str):
        resultado = self.db.table("citas").select("*").eq("paciente_id", paciente_id).execute()
        return resultado.data

    def obtener_por_medico(self, medico_id: str):
        resultado = self.db.table("citas").select("*").eq("medico_id", medico_id).execute()
        return resultado.data

    def crear(self, datos: dict):
        resultado = self.db.table("citas").insert(datos).execute()
        return resultado.data[0] if resultado.data else None

    def actualizar_estado(self, cita_id: int, nuevo_estado: str):
        resultado = self.db.table("citas").update({"estado": nuevo_estado}).eq("id", cita_id).execute()
        return resultado.data[0] if resultado.data else None
