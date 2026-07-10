from fastapi import APIRouter, Depends
from app.auth.rbac_middleware import requiere_rol
from app.services.cita_service import CitaService
from app.schemas.cita import CitaCreate

router = APIRouter(prefix="/citas", tags=["Citas"])


@router.post("/")
def crear_cita(
    datos: CitaCreate,
    usuario_actual: dict = Depends(requiere_rol("Recepción", "Administrador"))
):
    """
    Crea una nueva cita. Solo Recepcion o Administrador pueden hacerlo.
    """
    service = CitaService()
    nueva_cita = service.crear_cita(
        paciente_id=str(datos.paciente_id),
        medico_id=str(datos.medico_id),
        fecha_hora=datos.fecha_hora,
        motivo=datos.motivo,
        creado_por=usuario_actual["id"]
    )
    return {"mensaje": "Cita creada exitosamente", "cita": nueva_cita}


@router.get("/mis-citas")
def mis_citas(usuario_actual: dict = Depends(requiere_rol("Paciente"))):
    """
    El paciente autenticado puede ver sus propias citas.
    """
    service = CitaService()
    citas = service.listar_citas_de_paciente(usuario_actual["id"])
    return {"citas": citas}


@router.get("/mi-agenda")
def mi_agenda(usuario_actual: dict = Depends(requiere_rol("Médico"))):
    """
    El medico autenticado puede ver su agenda de citas.
    """
    service = CitaService()
    citas = service.listar_citas_de_medico(usuario_actual["id"])
    return {"citas": citas}
