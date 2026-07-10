import uuid
from app.repositories.paciente_repository import PacienteRepository
from app.repositories.medico_repository import MedicoRepository


class CreadorPerfilBase:
    """
    Clase base del patron Factory Method.
    Cada subclase sabe como completar el registro segun su rol especifico.
    """
    def crear_perfil_especifico(self, usuario_id: str, datos_extra: dict):
        return None


class CreadorPerfilMedico(CreadorPerfilBase):
    def __init__(self):
        self.repo = MedicoRepository()

    def crear_perfil_especifico(self, usuario_id: str, datos_extra: dict):
        datos = {
            "usuario_id": usuario_id,
            "especialidad": datos_extra.get("especialidad") or "General",
            "colegiatura": datos_extra.get("colegiatura") or "",
            "disponibilidad": datos_extra.get("disponibilidad", [])
        }
        return self.repo.crear(datos)


class CreadorPerfilPaciente(CreadorPerfilBase):
    def __init__(self):
        self.repo = PacienteRepository()

    def crear_perfil_especifico(self, usuario_id: str, datos_extra: dict):
        # Si no se proporciona un numero de historial, lo generamos automaticamente
        historial = datos_extra.get("historial_clinico_nro") or f"HC-{uuid.uuid4().hex[:8].upper()}"

        datos = {
            "usuario_id": usuario_id,
            "fecha_nacimiento": datos_extra.get("fecha_nacimiento"),
            "telefono": datos_extra.get("telefono"),
            "historial_clinico_nro": historial
        }
        return self.repo.crear(datos)


class UsuarioFactory:
    """
    Factory Method: dado un nombre de rol, retorna el 'creador'
    especializado que sabe como completar el registro para ese rol.
    """

    _creadores = {
        "Médico": CreadorPerfilMedico,
        "Paciente": CreadorPerfilPaciente,
        "Administrador": CreadorPerfilBase,
        "Recepción": CreadorPerfilBase,
    }

    @classmethod
    def obtener_creador(cls, rol_nombre: str) -> CreadorPerfilBase:
        clase_creadora = cls._creadores.get(rol_nombre, CreadorPerfilBase)
        return clase_creadora()
