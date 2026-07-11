from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.auth.supabase_client import login_usuario
from app.auth.rbac_middleware import requiere_rol
from app.core.database import get_db
from app.services.usuario_service import UsuarioService

router = APIRouter(prefix="/auth", tags=["Autenticacion"])


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login")
def login(datos: LoginRequest):
    try:
        resultado = login_usuario(datos.email, datos.password)
    except Exception:
        raise HTTPException(status_code=401, detail="Credenciales invalidas")

    usuario_id = resultado.user.id

    db = get_db()
    perfil = db.table("profiles").select("*, roles(nombre)").eq("id", usuario_id).single().execute()

    if not perfil.data:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")

    return {
        "access_token": resultado.session.access_token,
        "usuario": {
            "id": resultado.user.id,
            "email": resultado.user.email,
            "nombre_completo": perfil.data["nombre_completo"],
            "rol": perfil.data["roles"]["nombre"]
        }
    }


class RegistroPacienteRequest(BaseModel):
    email: str
    password: str
    nombre_completo: str
    fecha_nacimiento: str
    telefono: Optional[str] = None


@router.post("/registro-paciente")
def registro_paciente(datos: RegistroPacienteRequest):
    service = UsuarioService()
    resultado = service.registrar_usuario(
        email=datos.email,
        password=datos.password,
        nombre_completo=datos.nombre_completo,
        rol_id=4,
        datos_extra={
            "fecha_nacimiento": datos.fecha_nacimiento,
            "telefono": datos.telefono
        }
    )
    return {"mensaje": "Registro exitoso. Ya puedes iniciar sesion.", "usuario": resultado}


@router.get("/mi-perfil")
def mi_perfil(usuario_actual: dict = Depends(requiere_rol("Paciente"))):
    """
    Retorna los datos completos del paciente autenticado
    (union de profile + tabla pacientes).
    """
    db = get_db()
    paciente = db.table("pacientes").select("*").eq("usuario_id", usuario_actual["id"]).single().execute()

    return {
        "nombre_completo": usuario_actual["nombre_completo"],
        "email": usuario_actual["email"],
        "fecha_nacimiento": paciente.data.get("fecha_nacimiento") if paciente.data else None,
        "telefono": paciente.data.get("telefono") if paciente.data else None,
        "historial_clinico_nro": paciente.data.get("historial_clinico_nro") if paciente.data else None
    }
