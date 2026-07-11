const API_URL = window.location.origin.replace('-3000', '-8000').replace(':3000', ':8000');

document.getElementById('form-registro').addEventListener('submit', async function (e) {
    e.preventDefault();

    const mensaje = document.getElementById('mensaje-resultado');
    mensaje.textContent = '';

    const cuerpo = {
        nombre_completo: document.getElementById('nombre_completo').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        fecha_nacimiento: document.getElementById('fecha_nacimiento').value,
        telefono: document.getElementById('telefono').value || null
    };

    try {
        const respuesta = await fetch(`${API_URL}/auth/registro-paciente`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cuerpo)
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            mensaje.textContent = 'Error: ' + (datos.detail || 'No se pudo completar el registro');
            mensaje.style.color = '#d9534f';
            return;
        }

        mensaje.textContent = 'Cuenta creada. Redirigiendo al inicio de sesion...';
        mensaje.style.color = '#5cb85c';

        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);

    } catch (error) {
        mensaje.textContent = 'Error de conexion con el servidor';
        mensaje.style.color = '#d9534f';
        console.error(error);
    }
});
