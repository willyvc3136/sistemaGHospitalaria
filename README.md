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
- [ ] Row Level Security (RLS) activado en todas las tablas
- [ ] Endpoints adicionales de Médico (diagnósticos, recetas)
- [ ] Endpoints adicionales de Administrador (editar/desactivar usuarios)
