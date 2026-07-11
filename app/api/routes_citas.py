from fastapi import APIRouter, Depends
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.auth.rbac_middleware import requiere_rol
from app.services.cita_service import CitaService
from app.schemas.cita import CitaCreate
from app.core.database import get_db

router = APIRouter(prefix="/citas", tags=["Citas"])


@router.post("/")
def crear_cita(
    datos: CitaCreate,
    usuario_actual: dict = Depends(requiere_rol("Recepción", "Administrador"))
):
    service = CitaService()
    nueva_cita = service.crear_cita(
        paciente_id=str(datos.paciente_id),
        medico_id=str(datos.medico_id),
        fecha_hora=datos.fecha_hora,
        motivo=datos.motivo,
        creado_por=usuario_actual["id"]
    )
    return {"mensaje": "Cita creada exitosamente", "cita": nueva_cita}


class CitaPacienteRequest(BaseModel):
    fecha_hora: datetime
    motivo: Optional[str] = None


@router.post("/reservar")
def reservar_cita_propia(
    datos: CitaPacienteRequest,
    usuario_actual: dict = Depends(requiere_rol("Paciente"))
):
    service = CitaService()
    nueva_cita = service.crear_cita_paciente(
        paciente_id=usuario_actual["id"],
        fecha_hora=datos.fecha_hora,
        motivo=datos.motivo
    )
    return {"mensaje": "Cita reservada exitosamente", "cita": nueva_cita}


@router.post("/{cita_id}/cancelar")
def cancelar_cita(
    cita_id: int,
    usuario_actual: dict = Depends(requiere_rol("Paciente"))
):
    """
    El paciente cancela una de sus propias citas, si esta pendiente.
    """
    service = CitaService()
    cita_actualizada = service.cancelar_cita_paciente(usuario_actual["id"], cita_id)
    return {"mensaje": "Cita cancelada exitosamente", "cita": cita_actualizada}


@router.get("/mis-citas")
def mis_citas(usuario_actual: dict = Depends(requiere_rol("Paciente"))):
    service = CitaService()
    citas = service.listar_citas_de_paciente(usuario_actual["id"])
    return {"citas": citas}


@router.get("/mi-agenda")
def mi_agenda(usuario_actual: dict = Depends(requiere_rol("Médico"))):
    service = CitaService()
    citas = service.listar_citas_de_medico(usuario_actual["id"])
    return {"citas": citas}


@router.get("/lista-pacientes")
def lista_pacientes(usuario_actual: dict = Depends(requiere_rol("Recepción", "Administrador"))):
    db = get_db()
    resultado = db.table("pacientes").select("usuario_id, profiles(nombre_completo)").execute()
    return {"pacientes": resultado.data}


@router.get("/lista-medicos")
def lista_medicos(usuario_actual: dict = Depends(requiere_rol("Recepción", "Administrador"))):
    db = get_db()
    resultado = db.table("medicos").select("usuario_id, especialidad, profiles(nombre_completo)").execute()
    return {"medicos": resultado.data}
