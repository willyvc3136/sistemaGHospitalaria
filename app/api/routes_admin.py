from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from app.auth.rbac_middleware import requiere_rol
from app.core.database import get_db
from app.services.usuario_service import UsuarioService

router = APIRouter(prefix="/admin", tags=["Administrador"])


@router.get("/usuarios")
def listar_usuarios(usuario_actual: dict = Depends(requiere_rol("Administrador"))):
    """
    Endpoint protegido: solo usuarios con rol 'Administrador' pueden acceder.
    Retorna la lista completa de perfiles del sistema.
    """
    db = get_db()
    resultado = db.table("profiles").select("*, roles(nombre)").execute()
    return {
        "solicitado_por": usuario_actual["email"],
        "usuarios": resultado.data
    }


class NuevoUsuarioRequest(BaseModel):
    email: str
    password: str
    nombre_completo: str
    rol_id: int
    especialidad: Optional[str] = None
    colegiatura: Optional[str] = None
    fecha_nacimiento: Optional[str] = None
    telefono: Optional[str] = None
    historial_clinico_nro: Optional[str] = None


@router.post("/usuarios")
def crear_usuario(
    datos: NuevoUsuarioRequest,
    usuario_actual: dict = Depends(requiere_rol("Administrador"))
):
    """
    Registra un usuario nuevo completo (Auth + profile + tabla especifica
    segun el rol, usando Factory Method).
    """
    service = UsuarioService()
    datos_extra = {
        "especialidad": datos.especialidad,
        "colegiatura": datos.colegiatura,
        "fecha_nacimiento": datos.fecha_nacimiento,
        "telefono": datos.telefono,
        "historial_clinico_nro": datos.historial_clinico_nro
    }
    resultado = service.registrar_usuario(
        email=datos.email,
        password=datos.password,
        nombre_completo=datos.nombre_completo,
        rol_id=datos.rol_id,
        datos_extra=datos_extra
    )
    return {"mensaje": "Usuario registrado exitosamente", "usuario": resultado}


class ActualizarUsuarioRequest(BaseModel):
    nombre_completo: Optional[str] = None
    activo: Optional[bool] = None


@router.patch("/usuarios/{usuario_id}")
def actualizar_usuario(
    usuario_id: str,
    datos: ActualizarUsuarioRequest,
    usuario_actual: dict = Depends(requiere_rol("Administrador"))
):
    """
    Permite al Administrador editar el nombre o activar/desactivar un usuario.
    """
    db = get_db()
    cambios = {k: v for k, v in datos.dict().items() if v is not None}

    if not cambios:
        raise HTTPException(status_code=400, detail="No se enviaron cambios")

    resultado = db.table("profiles").update(cambios).eq("id", usuario_id).execute()
    if not resultado.data:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return {"mensaje": "Usuario actualizado exitosamente", "usuario": resultado.data[0]}


@router.get("/estadisticas")
def estadisticas_generales(usuario_actual: dict = Depends(requiere_rol("Administrador"))):
    """
    Retorna metricas generales del sistema para el dashboard.
    """
    db = get_db()

    usuarios = db.table("profiles").select("id, rol_id, activo").execute()
    citas = db.table("citas").select("id, estado, monto, pagado").execute()

    total_usuarios = len(usuarios.data)
    total_pacientes = len([u for u in usuarios.data if u["rol_id"] == 4])
    total_medicos = len([u for u in usuarios.data if u["rol_id"] == 2])

    total_citas = len(citas.data)
    citas_atendidas = len([c for c in citas.data if c["estado"] == "atendida"])
    ingresos_totales = sum(c["monto"] for c in citas.data if c["pagado"])

    return {
        "total_usuarios": total_usuarios,
        "total_pacientes": total_pacientes,
        "total_medicos": total_medicos,
        "total_citas": total_citas,
        "citas_atendidas": citas_atendidas,
        "ingresos_totales": round(ingresos_totales, 2)
    }


@router.get("/usuarios/{usuario_id}/detalle")
def detalle_usuario(
    usuario_id: str,
    usuario_actual: dict = Depends(requiere_rol("Administrador"))
):
    """
    Retorna el perfil completo de un usuario, incluyendo sus datos
    especificos si es Medico o Paciente.
    """
    db = get_db()
    perfil = db.table("profiles").select("*, roles(nombre)").eq("id", usuario_id).single().execute()
    if not perfil.data:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    rol_nombre = perfil.data["roles"]["nombre"]
    datos_extra = {}

    if rol_nombre == "Médico":
        medico = db.table("medicos").select("especialidad, colegiatura").eq("usuario_id", usuario_id).single().execute()
        if medico.data:
            datos_extra = medico.data
    elif rol_nombre == "Paciente":
        paciente = db.table("pacientes").select("fecha_nacimiento, telefono, historial_clinico_nro").eq("usuario_id", usuario_id).single().execute()
        if paciente.data:
            datos_extra = paciente.data

    return {**perfil.data, "datos_extra": datos_extra}


class ActualizarDetalleRequest(BaseModel):
    nombre_completo: Optional[str] = None
    especialidad: Optional[str] = None
    colegiatura: Optional[str] = None
    telefono: Optional[str] = None
    fecha_nacimiento: Optional[str] = None


@router.patch("/usuarios/{usuario_id}/detalle")
def actualizar_detalle_usuario(
    usuario_id: str,
    datos: ActualizarDetalleRequest,
    usuario_actual: dict = Depends(requiere_rol("Administrador"))
):
    """
    Actualiza el nombre en profiles y los datos especificos
    en la tabla correspondiente (medicos o pacientes), segun el rol.
    """
    db = get_db()
    perfil = db.table("profiles").select("*, roles(nombre)").eq("id", usuario_id).single().execute()
    if not perfil.data:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if datos.nombre_completo:
        db.table("profiles").update({"nombre_completo": datos.nombre_completo}).eq("id", usuario_id).execute()

    rol_nombre = perfil.data["roles"]["nombre"]

    if rol_nombre == "Médico":
        cambios = {}
        if datos.especialidad is not None:
            cambios["especialidad"] = datos.especialidad
        if datos.colegiatura is not None:
            cambios["colegiatura"] = datos.colegiatura
        if cambios:
            db.table("medicos").update(cambios).eq("usuario_id", usuario_id).execute()

    elif rol_nombre == "Paciente":
        cambios = {}
        if datos.telefono is not None:
            cambios["telefono"] = datos.telefono
        if datos.fecha_nacimiento is not None:
            cambios["fecha_nacimiento"] = datos.fecha_nacimiento
        if cambios:
            db.table("pacientes").update(cambios).eq("usuario_id", usuario_id).execute()

    return {"mensaje": "Usuario actualizado exitosamente"}
