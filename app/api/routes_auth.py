from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.auth.supabase_client import login_usuario

router = APIRouter(prefix="/auth", tags=["Autenticacion"])


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login")
def login(datos: LoginRequest):
    """
    Endpoint de login. Recibe email y password,
    retorna el token de acceso si las credenciales son correctas.
    """
    try:
        resultado = login_usuario(datos.email, datos.password)
        return {
            "access_token": resultado.session.access_token,
            "usuario": {
                "id": resultado.user.id,
                "email": resultado.user.email
            }
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail="Credenciales invalidas")
