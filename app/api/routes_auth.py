from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.auth.supabase_client import login_usuario
from app.core.database import get_db
from app.services.usuario_service import UsuarioService

router = APIRouter(prefix="/auth", tags=["Autenticacion"])


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login")
def login(datos: LoginRequest):
    """
    Endpoint de login. Recibe email y password,
    retorna el token de acceso y el rol del usuario si las credenciales son correctas.
    """
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
    """
    Registro publico: cualquier persona puede crear su cuenta como Paciente.
    El rol siempre es 4 (Paciente), sin excepcion, sin importar lo que se envie.
    """
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
