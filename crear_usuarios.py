import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase = create_client(url, key)

usuarios = [
    {"email": "admin@clinica.com", "password": "Willy123!", "rol_id": 1, "nombre": "Willy Administrador"},
    {"email": "willy@medico.com", "password": "Willy123!", "rol_id": 2, "nombre": "willy vasquez"},
    {"email": "medico@clinica.com", "password": "Willy123!", "rol_id": 2, "nombre": "Dr. Carlos Mendoza"},
    {"email": "bella@paciente.com", "password": "Willy123!", "rol_id": 4, "nombre": "Bella"},
    {"email": "arturooo@paciente.com", "password": "Willy123!", "rol_id": 4, "nombre": "Dayanna Vasquez"},
    {"email": "paciente@gmail.com", "password": "Willy123!", "rol_id": 4, "nombre": "Juan Perez"},
    {"email": "recepcion@clinica.com", "password": "Willy123!", "rol_id": 3, "nombre": "Ana Gomez"},
]

for u in usuarios:
    try:
        res = supabase.auth.admin.create_user({
            "email": u["email"],
            "password": u["password"],
            "email_confirm": True
        })
        user_id = res.user.id
        supabase.table("profiles").insert({
            "id": user_id,
            "email": u["email"],
            "nombre_completo": u["nombre"],
            "rol_id": u["rol_id"],
            "activo": True
        }).execute()
        print(f"✅ Creado: {u['email']}")
    except Exception as e:
        print(f"❌ Error con {u['email']}: {e}")
