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
