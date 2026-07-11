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
    service = CitaService()
    cita_actualizada = service.cancelar_cita_paciente(usuario_actual["id"], cita_id)
    return {"mensaje": "Cita cancelada exitosamente", "cita": cita_actualizada}


@router.post("/{cita_id}/confirmar")
def confirmar_cita(
    cita_id: int,
    usuario_actual: dict = Depends(requiere_rol("Médico"))
):
    """
    El medico confirma una cita que le fue asignada.
    """
    service = CitaService()
    cita_actualizada = service.confirmar_cita(usuario_actual["id"], cita_id)
    return {"mensaje": "Cita confirmada", "cita": cita_actualizada}


@router.post("/{cita_id}/cancelar-medico")
def cancelar_cita_medico(
    cita_id: int,
    usuario_actual: dict = Depends(requiere_rol("Médico"))
):
    """
    El medico cancela una cita que le fue asignada.
    """
    service = CitaService()
    cita_actualizada = service.cancelar_cita_medico(usuario_actual["id"], cita_id)
    return {"mensaje": "Cita cancelada", "cita": cita_actualizada}


class AtenderCitaRequest(BaseModel):
    diagnostico: str
    receta: Optional[str] = None


@router.post("/{cita_id}/atender")
def atender_cita(
    cita_id: int,
    datos: AtenderCitaRequest,
    usuario_actual: dict = Depends(requiere_rol("Médico"))
):
    """
    El medico marca una cita confirmada como atendida,
    registrando diagnostico y receta.
    """
    service = CitaService()
    cita_actualizada = service.atender_cita(
        usuario_actual["id"], cita_id, datos.diagnostico, datos.receta
    )
    return {"mensaje": "Cita marcada como atendida", "cita": cita_actualizada}


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


@router.get("/historial-paciente/{paciente_id}")
def historial_paciente(
    paciente_id: str,
    usuario_actual: dict = Depends(requiere_rol("Médico", "Administrador"))
):
    """
    Retorna todas las citas pasadas de un paciente especifico,
    para que el medico tenga contexto antes de atenderlo.
    """
    service = CitaService()
    citas = service.listar_citas_de_paciente(paciente_id)
    return {"citas": citas}


@router.get("/agenda-completa")
def agenda_completa(usuario_actual: dict = Depends(requiere_rol("Recepción", "Administrador"))):
    """
    Retorna todas las citas del sistema, con nombre de paciente y medico,
    para que Recepcion tenga vision completa del dia.
    """
    service = CitaService()
    db = get_db()
    resultado = db.table("citas").select("*").order("fecha_hora", desc=False).execute()
    citas = resultado.data

    citas = service._enriquecer_con_nombre_medico(citas)
    citas = service._enriquecer_con_nombre_paciente(citas)

    return {"citas": citas}


@router.post("/{cita_id}/confirmar-recepcion")
def confirmar_cita_recepcion(
    cita_id: int,
    usuario_actual: dict = Depends(requiere_rol("Recepción", "Administrador"))
):
    """
    Recepcion o Administrador confirman una cita pendiente.
    """
    db = get_db()
    cita = db.table("citas").select("*").eq("id", cita_id).single().execute()
    if not cita.data:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    if cita.data["estado"] != "pendiente":
        raise HTTPException(status_code=400, detail=f"No se puede confirmar una cita en estado '{cita.data['estado']}'")

    resultado = db.table("citas").update({"estado": "confirmada"}).eq("id", cita_id).execute()
    return {"mensaje": "Cita confirmada", "cita": resultado.data[0]}


@router.post("/{cita_id}/cancelar-recepcion")
def cancelar_cita_recepcion(
    cita_id: int,
    usuario_actual: dict = Depends(requiere_rol("Recepción", "Administrador"))
):
    """
    Recepcion o Administrador cancelan una cita.
    """
    db = get_db()
    cita = db.table("citas").select("*").eq("id", cita_id).single().execute()
    if not cita.data:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    if cita.data["estado"] in ("cancelada", "atendida"):
        raise HTTPException(status_code=400, detail=f"No se puede cancelar una cita en estado '{cita.data['estado']}'")

    resultado = db.table("citas").update({"estado": "cancelada"}).eq("id", cita_id).execute()
    return {"mensaje": "Cita cancelada", "cita": resultado.data[0]}


class DerivarCitaRequest(BaseModel):
    nuevo_medico_id: str


@router.post("/{cita_id}/derivar")
def derivar_cita(
    cita_id: int,
    datos: DerivarCitaRequest,
    usuario_actual: dict = Depends(requiere_rol("Recepción", "Administrador"))
):
    """
    Recepcion reasigna una cita a otro medico (ej. derivar a un especialista).
    Solo permitido si la cita esta pendiente.
    """
    db = get_db()
    cita = db.table("citas").select("*").eq("id", cita_id).single().execute()
    if not cita.data:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    if cita.data["estado"] != "pendiente":
        raise HTTPException(status_code=400, detail="Solo se pueden derivar citas pendientes")

    resultado = db.table("citas").update({"medico_id": datos.nuevo_medico_id}).eq("id", cita_id).execute()
    return {"mensaje": "Cita derivada exitosamente", "cita": resultado.data[0]}


@router.get("/buscar-pacientes")
def buscar_pacientes(
    q: str = "",
    usuario_actual: dict = Depends(requiere_rol("Recepción", "Administrador"))
):
    """
    Busca pacientes por nombre (coincidencia parcial), para autocompletado.
    Retorna maximo 8 resultados para no sobrecargar la interfaz.
    """
    if len(q.strip()) < 2:
        return {"pacientes": []}

    db = get_db()
    resultado = db.table("profiles").select("id, nombre_completo").eq("rol_id", 4).ilike("nombre_completo", f"%{q}%").limit(8).execute()
    return {"pacientes": [{"usuario_id": p["id"], "nombre_completo": p["nombre_completo"]} for p in resultado.data]}


@router.get("/directorio-pacientes")
def directorio_pacientes(usuario_actual: dict = Depends(requiere_rol("Recepción", "Administrador"))):
    """
    Lista completa de pacientes con sus datos de contacto,
    para consulta rapida desde Recepcion.
    """
    db = get_db()
    resultado = db.table("pacientes").select("usuario_id, fecha_nacimiento, telefono, historial_clinico_nro, profiles(nombre_completo, email)").execute()
    return {"pacientes": resultado.data}
