from fastapi import APIRouter, Depends
from app.auth.rbac_middleware import requiere_rol
from app.core.database import get_db

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
