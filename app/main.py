from fastapi import FastAPI
from app.core.database import get_db
from app.api.routes_auth import router as auth_router

app = FastAPI(title="Sistema de Gestion Hospitalaria")

app.include_router(auth_router)


@app.get("/")
def read_root():
    return {"mensaje": "Sistema de Gestion Hospitalaria funcionando"}


@app.get("/test-conexion")
def test_conexion():
    """
    Endpoint de prueba: confirma que FastAPI puede leer datos
    reales desde Supabase.
    """
    db = get_db()
    respuesta = db.table("roles").select("*").execute()
    return {"roles": respuesta.data}
