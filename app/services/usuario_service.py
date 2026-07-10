from fastapi import HTTPException
from app.core.database import SupabaseConnection, get_db
from app.factories.usuario_factory import UsuarioFactory


class UsuarioService:
    """
    Orquesta el registro completo de un usuario nuevo:
    1. Crea la cuenta en Supabase Auth
    2. Crea su profile (con rol)
    3. Usa el Factory Method para crear su registro especifico (medico/paciente)
    """

    def __init__(self):
        self.client = SupabaseConnection.get_client()
        self.db = get_db()

    def registrar_usuario(self, email: str, password: str, nombre_completo: str, rol_id: int, datos_extra: dict = None):
        datos_extra = datos_extra or {}

        # 1. Buscar el nombre del rol
        rol = self.db.table("roles").select("nombre").eq("id", rol_id).single().execute()
        if not rol.data:
            raise HTTPException(status_code=400, detail="Rol invalido")
        rol_nombre = rol.data["nombre"]

        # 2. Crear usuario en Supabase Auth
        try:
            resultado_auth = self.client.auth.admin.create_user({
                "email": email,
                "password": password,
                "email_confirm": True
            })
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error creando usuario: {str(e)}")

        usuario_id = resultado_auth.user.id

        # 3. Crear el profile base
        self.db.table("profiles").insert({
            "id": usuario_id,
            "email": email,
            "nombre_completo": nombre_completo,
            "rol_id": rol_id,
            "activo": True
        }).execute()

        # 4. Factory Method: crear el registro especifico segun el rol
        creador = UsuarioFactory.obtener_creador(rol_nombre)
        creador.crear_perfil_especifico(usuario_id, datos_extra)

        return {
            "id": usuario_id,
            "email": email,
            "nombre_completo": nombre_completo,
            "rol": rol_nombre
        }
