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
