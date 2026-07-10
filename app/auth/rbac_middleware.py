from fastapi import Header, HTTPException, Depends
from app.auth.supabase_client import obtener_usuario_desde_token
from app.core.database import get_db


def obtener_usuario_actual(authorization: str = Header(...)):
    """
    Dependencia de FastAPI: extrae el token del header 'Authorization',
    lo verifica con Supabase, y busca el perfil (con su rol) en la tabla profiles.
    Se usara en cada endpoint protegido.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token no proporcionado correctamente")

    token = authorization.replace("Bearer ", "")

    try:
        resultado = obtener_usuario_desde_token(token)
        user_id = resultado.user.id
    except Exception:
        raise HTTPException(status_code=401, detail="Token invalido o expirado")

    db = get_db()
    perfil = db.table("profiles").select("*, roles(nombre)").eq("id", user_id).single().execute()

    if not perfil.data:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")

    return perfil.data


def requiere_rol(*roles_permitidos: str):
    """
    Patron Strategy: retorna una dependencia que valida si el rol
    del usuario actual esta dentro de los roles permitidos para ese endpoint.
    Uso: Depends(requiere_rol("Administrador", "Medico"))
    """
    def validador(usuario: dict = Depends(obtener_usuario_actual)):
        rol_usuario = usuario["roles"]["nombre"]
        if rol_usuario not in roles_permitidos:
            raise HTTPException(
                status_code=403,
                detail=f"Acceso denegado. Se requiere uno de estos roles: {roles_permitidos}"
            )
        return usuario
    return validador
