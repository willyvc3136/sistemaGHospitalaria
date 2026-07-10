const API_URL = window.location.origin.replace('-3000', '-8000').replace(':3000', ':8000');

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

        // Guardamos el token y el usuario en el navegador (sessionStorage)
        sessionStorage.setItem('access_token', datos.access_token);
        sessionStorage.setItem('usuario_email', datos.usuario.email);

        // Por ahora, solo confirmamos que funciono (luego redirigimos segun el rol)
        alert('Login exitoso: ' + datos.usuario.email);

    } catch (error) {
        mensajeError.textContent = 'Error de conexion con el servidor';
        console.error(error);
    }
});
