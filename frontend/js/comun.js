// Verificamos que haya una sesion activa; si no, regresamos al login
const token = sessionStorage.getItem('access_token');
const nombreUsuario = sessionStorage.getItem('usuario_nombre');
const rolUsuario = sessionStorage.getItem('usuario_rol');

if (!token) {
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    const bienvenida = document.getElementById('bienvenida');
    if (bienvenida) {
        bienvenida.textContent = `Hola, ${nombreUsuario} (${rolUsuario})`;
    }
});

function cerrarSesion() {
    sessionStorage.clear();
    window.location.href = 'login.html';
}
