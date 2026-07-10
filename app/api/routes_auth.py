from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.auth.supabase_client import login_usuario
from app.core.database import get_db

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

    # Buscar el perfil y su rol
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
