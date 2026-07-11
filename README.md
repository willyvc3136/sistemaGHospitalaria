# Sistema de Gestión Hospitalaria

Sistema de gestión hospitalaria desarrollado como proyecto de aprendizaje, con 4 roles de usuario (Administrador, Médico, Recepción, Paciente) y 6 patrones de diseño aplicados en un backend real conectado a una base de datos en la nube.

## Stack Tecnológico

- **Backend**: Python + FastAPI
- **Base de datos**: PostgreSQL (vía Supabase)
- **Autenticación**: Supabase Auth (JWT)
- **Frontend**: HTML + CSS + JavaScript (vanilla, sin frameworks)
- **Entorno de desarrollo**: GitHub Codespaces (100% en la nube, sin instalaciones locales)

## Roles del sistema

| Rol | Puede hacer |
|---|---|
| Administrador | Ver todos los usuarios, registrar nuevos usuarios (cualquier rol) |
| Médico | Ver su agenda de citas |
| Recepción | Crear citas nuevas, ver listas de pacientes/médicos |
| Paciente | Ver sus propias citas |

## Estructura del proyecto

## Patrones de diseño aplicados

### 1. Singleton
**Dónde**: `app/core/database.py`
Garantiza una única instancia de conexión a Supabase en toda la aplicación, evitando crear conexiones innecesarias.

### 2. Repository
**Dónde**: `app/repositories/` (paciente, medico, cita)
Encapsula todo el acceso a datos de cada entidad. El resto de la aplicación nunca habla directamente con Supabase, solo a través de estas clases.

### 3. Strategy
**Dónde**: `app/auth/rbac_middleware.py`
La función `requiere_rol(*roles_permitidos)` retorna una validación distinta según los roles permitidos en cada endpoint, sin repetir lógica de autorización.

### 4. Facade
**Dónde**: `app/services/cita_service.py`
`CitaService` orquesta la validación de paciente/médico, la creación de la cita y el disparo de notificaciones,
### 5. Factory Method
**Dónde**: `app/factories/usuario_factory.py`
`UsuarioFactory` decide qué "creador" especializado usar según el rol del nuevo usuario (Médico necesita especialidad/colegiatura, Paciente necesita fecha de nacimiento, etc.), sin condicionales repetidos en el endpoint.

### 6. Observer
**Dónde**: `app/observers/notificacion_observer.py`
Cuando se crea una cita, `CitaService` notifica a los observadores registrados (`LogNotificacionObserver`, `ConsolaNotificacionObserver`) sin conocer los detalles de cada uno.

## Flujo de autenticación

1. El usuario envía email/password a `POST /auth/login`.
2. Supabase Auth valida las credenciales y retorna un JWT.
3. El backend busca el rol del usuario en la tabla `profiles` y lo incluye en la respuesta.
4. El frontend guarda el token y el rol en `sessionStorage`, y redirige al panel correspondiente.
5. En cada petición protegida, el token se envía en el header `Authorization: Bearer <token>`.
6. `rbac_middleware.py` valida el token contra Supabase y verifica que el rol tenga permiso para ese endpoint.

## Endpoints disponibles

### Autenticación
| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| POST | `/auth/login` | Inicia sesión, retorna token y rol | Público |

### Administrador
| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| GET | `/admin/usuarios` | Lista todos los usuarios | Administrador |
| POST | `/admin/usuarios` | Registra un usuario nuevo (Factory Method) | Administrador |

### Citas
| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| POST | `/citas/` | Crea una nueva cita | Recepción, Administrador |
| GET | `/citas/mis-citas` | Lista las citas del paciente autenticado | Paciente |
| GET | `/citas/mi-agenda` | Lista la agenda del médico autenticado | Médico |
| GET | `/citas/lista-pacientes` | Lista de pacientes (para formularios) | Recepción, Administrador |
| GET | `/citas/lista-medicos` | Lista de médicos (para formularios) | Recepción, Administrador |

### Utilidad
| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| GET | `/` | Mensaje de bienvenida | Público |
| GET | `/test-conexion` | Prueba de conexión con Supabase | Público |

## Cómo correr el proyecto

Todo corre dentro de GitHub Codespaces, sin instalaciones locales.

### 1. Backend (API)
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend (interfaz web)
En una terminal aparte:
```bash
cd frontend
python3 -m http.server 3000
```

### 3. Visibilidad de puertos
En la pestaña "PUERTOS" de VS Code, asegúrate de que los puertos **8000** y **3000** estén configurados como **"Public"** (necesario para que el frontend pueda comunicarse con la API sin bloqueos de CORS/autenticación de Codespaces).

## Usuarios de prueba

Todos con contraseña: `Willy123!`

| Email | Rol |
|---|---|
| admin@clinica.com | Administrador |
| willy@medico.com | Médico |
| recepcion@clinica.com | Recepción |
| bella@paciente.com | Paciente |

## Estado del proyecto

- [x] Base de datos en Supabase con RLS pendiente de activar
- [x] Autenticación real con Supabase Auth
- [x] RBAC funcionando y probado en los 4 roles
- [x] Los 6 patrones de diseño implementados y probados
- [x] Frontend funcional para los 4 roles
- [x] Landing page con identidad visual "Vitalis"
- [x] Registro publico de pacientes
- [x] Reserva de cita propia por el paciente (con validacion de horario)
- [x] Ciclo completo de citas: pendiente -> confirmada -> atendida (con diagnostico/receta)
- [x] Panel de Paciente rediseñado (perfil, historial, cancelar cita)
- [x] Panel de Medico rediseñado (agenda, historial clinico del paciente, sidebar)
- [x] Panel de Recepcion rediseñado (agenda completa, confirmar/cancelar/derivar citas)
- [ ] Autocompletado de pacientes en formularios (en vez de desplegable)
- [ ] Scroll interno en listados largos de citas
- [ ] Recepcion puede registrar pacientes nuevos directamente
- [ ] Buscador de citas por nombre de paciente
- [ ] Panel de Administrador rediseñado + editar/desactivar usuarios
- [ ] Row Level Security (RLS) activado en todas las tablas
- [ ] Recuperacion de contrasena

## Cómo retomar el proyecto desde otra PC

Como todo el desarrollo vive en la nube (Codespaces + Supabase), no necesitas instalar nada en la nueva computadora. Solo necesitas un navegador y tu cuenta de GitHub.

### 1. Abrir el Codespace existente
1. Entra a `https://github.com/willyvc3136/sistemaGHospitalaria`
2. Inicia sesión con tu cuenta de GitHub si no lo has hecho.
3. Clic en el botón verde **"Code"** → pestaña **"Codespaces"**.
4. Debería aparecer tu Codespace ya creado (busca un nombre como "symmetrical sniffle" o similar). Haz clic sobre él para reabrirlo.
   - Si no aparece ninguno (por ejemplo, si Codespaces lo eliminó por inactividad prolongada), crea uno nuevo con **"Create codespace on main"** — tu código está a salvo en GitHub de todas formas, solo se recreará el entorno.

### 2. Abrir una terminal
Una vez dentro del editor (se ve como VS Code):
- Menú superior → **Terminal** → **New Terminal**
- O el atajo `` Ctrl + ` ``

### 3. Levantar el backend
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Abrir una segunda terminal para el frontend
Con el ícono **"+"** en el panel de terminal (para no interrumpir el backend que quedó corriendo), y ahí:
```bash
cd frontend
python3 -m http.server 3000
```

### 5. Hacer los puertos públicos
En la pestaña **"PUERTOS"**, cambia la visibilidad de los puertos **8000** y **3000** a **"Public"** (clic derecho sobre cada uno → Port Visibility → Public). Esto es necesario cada vez que se crea o reinicia el Codespace.

### 6. Abrir la aplicación
Clic en el ícono de globo junto al puerto **3000** en la pestaña "PUERTOS" — se abrirá el login del sistema en una nueva pestaña del navegador.

### Nota sobre el archivo `.env`
El archivo `.env` (con las credenciales de Supabase) **no se sube a GitHub** por seguridad. Si abres el proyecto en un Codespace completamente nuevo (no el mismo de siempre), tendrás que recrearlo manualmente:
```bash
cat > .env << 'EOF_ENV'
SUPABASE_URL=https://wqvztguntuazimwfsjkx.supabase.co
SUPABASE_SERVICE_KEY=tu-clave-secreta-aqui
EOF_ENV
```
(Reemplaza la clave por la real, disponible en Supabase → Project Settings → API → Secret keys). Si sigues usando el **mismo** Codespace de siempre, el `.env` ya está guardado ahí y no necesitas hacer nada.
