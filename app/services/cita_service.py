from fastapi import HTTPException
from datetime import time
from app.repositories.cita_repository import CitaRepository
from app.repositories.paciente_repository import PacienteRepository
from app.repositories.medico_repository import MedicoRepository
from app.observers.notificacion_observer import Sujeto, LogNotificacionObserver, ConsolaNotificacionObserver
from app.core.database import get_db

HORA_APERTURA = time(8, 0)
HORA_CIERRE = time(18, 0)


class CitaService:
    """
    Patron Facade: orquesta todo el proceso de negocio para gestionar citas,
    coordinando varios repositorios y aplicando reglas de validacion.
    Tambien actua como 'Subject' del patron Observer, notificando
    a los observadores registrados cuando ocurre un evento importante.
    """

    def __init__(self):
        self.cita_repo = CitaRepository()
        self.paciente_repo = PacienteRepository()
        self.medico_repo = MedicoRepository()
        self.db = get_db()

        self.notificador = Sujeto()
        self.notificador.suscribir(LogNotificacionObserver())
        self.notificador.suscribir(ConsolaNotificacionObserver())

    def _validar_horario_atencion(self, fecha_hora):
        hora = fecha_hora.time()
        if hora < HORA_APERTURA or hora >= HORA_CIERRE:
            raise HTTPException(
                status_code=400,
                detail=f"El horario de atencion es de {HORA_APERTURA.strftime('%H:%M')} a {HORA_CIERRE.strftime('%H:%M')}"
            )

    def crear_cita(self, paciente_id: str, medico_id: str, fecha_hora, motivo: str, creado_por: str):
        self._validar_horario_atencion(fecha_hora)

        paciente = self.paciente_repo.obtener_por_usuario_id(paciente_id)
        if not paciente:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")

        medico = self.medico_repo.obtener_por_usuario_id(medico_id)
        if not medico:
            raise HTTPException(status_code=404, detail="Medico no encontrado")

        datos_cita = {
            "paciente_id": paciente_id,
            "medico_id": medico_id,
            "fecha_hora": fecha_hora.isoformat(),
            "motivo": motivo,
            "estado": "pendiente",
            "creado_por": creado_por
        }
        nueva_cita = self.cita_repo.crear(datos_cita)

        self.notificador.notificar("cita_creada", {
            "cita_id": nueva_cita.get("id") if nueva_cita else None,
            "paciente_id": paciente_id,
            "medico_id": medico_id,
            "fecha_hora": fecha_hora.isoformat(),
            "motivo": motivo
        })

        return nueva_cita

    def crear_cita_paciente(self, paciente_id: str, fecha_hora, motivo: str):
        medico_general = self.medico_repo.obtener_medico_general()
        if not medico_general:
            raise HTTPException(status_code=503, detail="No hay medicos de Medicina General disponibles por ahora")

        return self.crear_cita(
            paciente_id=paciente_id,
            medico_id=medico_general["usuario_id"],
            fecha_hora=fecha_hora,
            motivo=motivo,
            creado_por=paciente_id
        )

    def cancelar_cita_paciente(self, paciente_id: str, cita_id: int):
        cita = self.cita_repo.obtener_por_id(cita_id)
        if not cita:
            raise HTTPException(status_code=404, detail="Cita no encontrada")
        if cita["paciente_id"] != paciente_id:
            raise HTTPException(status_code=403, detail="No puedes cancelar una cita que no es tuya")
        if cita["estado"] != "pendiente":
            raise HTTPException(status_code=400, detail=f"No se puede cancelar una cita en estado '{cita['estado']}'")
        return self.cita_repo.actualizar_estado(cita_id, "cancelada")

    def _validar_cita_del_medico(self, medico_id: str, cita_id: int):
        cita = self.cita_repo.obtener_por_id(cita_id)
        if not cita:
            raise HTTPException(status_code=404, detail="Cita no encontrada")
        if cita["medico_id"] != medico_id:
            raise HTTPException(status_code=403, detail="Esta cita no esta asignada a ti")
        return cita

    def confirmar_cita(self, medico_id: str, cita_id: int):
        cita = self._validar_cita_del_medico(medico_id, cita_id)
        if cita["estado"] != "pendiente":
            raise HTTPException(status_code=400, detail=f"No se puede confirmar una cita en estado '{cita['estado']}'")
        return self.cita_repo.actualizar_estado(cita_id, "confirmada")

    def cancelar_cita_medico(self, medico_id: str, cita_id: int):
        cita = self._validar_cita_del_medico(medico_id, cita_id)
        if cita["estado"] in ("cancelada", "atendida"):
            raise HTTPException(status_code=400, detail=f"No se puede cancelar una cita en estado '{cita['estado']}'")
        return self.cita_repo.actualizar_estado(cita_id, "cancelada")

    def atender_cita(self, medico_id: str, cita_id: int, diagnostico: str, receta: str):
        cita = self._validar_cita_del_medico(medico_id, cita_id)
        if cita["estado"] != "confirmada":
            raise HTTPException(status_code=400, detail="Solo se pueden atender citas confirmadas")
        return self.cita_repo.actualizar(cita_id, {
            "estado": "atendida",
            "diagnostico": diagnostico,
            "receta": receta
        })

    def listar_citas_de_paciente(self, paciente_id: str):
        citas = self.cita_repo.obtener_por_paciente(paciente_id)
        return self._enriquecer_con_nombre_medico(citas)

    def listar_citas_de_medico(self, medico_id: str):
        citas = self.cita_repo.obtener_por_medico(medico_id)
        return self._enriquecer_con_nombre_paciente(citas)

    def _enriquecer_con_nombre_medico(self, citas: list):
        if not citas:
            return citas
        medico_ids = list({c["medico_id"] for c in citas if c.get("medico_id")})
        if not medico_ids:
            return citas
        perfiles = self.db.table("profiles").select("id, nombre_completo").in_("id", medico_ids).execute()
        mapa_nombres = {p["id"]: p["nombre_completo"] for p in perfiles.data}
        for cita in citas:
            cita["medico_nombre"] = mapa_nombres.get(cita.get("medico_id"), "No asignado")
        return citas

    def _enriquecer_con_nombre_paciente(self, citas: list):
        if not citas:
            return citas
        paciente_ids = list({c["paciente_id"] for c in citas if c.get("paciente_id")})
        if not paciente_ids:
            return citas
        perfiles = self.db.table("profiles").select("id, nombre_completo").in_("id", paciente_ids).execute()
        mapa_nombres = {p["id"]: p["nombre_completo"] for p in perfiles.data}
        for cita in citas:
            cita["paciente_nombre"] = mapa_nombres.get(cita.get("paciente_id"), "No identificado")
        return citas
