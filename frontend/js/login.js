const API_URL = window.location.origin.replace('-3000', '-8000').replace(':3000', ':8000');

const RUTAS_POR_ROL = {
    'Administrador': 'admin.html',
    'Médico': 'medico.html',
    'Recepción': 'recepcion.html',
    'Paciente': 'paciente.html'
};

document.getElementById('form-login').addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const mensajeError = document.getElementById('mensaje-error');
    mensajeError.textContent = '';

    try {
        const respuesta = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            mensajeError.textContent = datos.detail || 'Credenciales invalidas';
            return;
        }

        // Guardamos los datos de la sesion
        sessionStorage.setItem('access_token', datos.access_token);
        sessionStorage.setItem('usuario_email', datos.usuario.email);
        sessionStorage.setItem('usuario_nombre', datos.usuario.nombre_completo);
        sessionStorage.setItem('usuario_rol', datos.usuario.rol);

        // Redirigimos segun el rol
        const ruta = RUTAS_POR_ROL[datos.usuario.rol];
        if (ruta) {
            window.location.href = ruta;
        } else {
            mensajeError.textContent = 'Rol no reconocido';
        }

    } catch (error) {
        mensajeError.textContent = 'Error de conexion con el servidor';
        console.error(error);
    }
});
