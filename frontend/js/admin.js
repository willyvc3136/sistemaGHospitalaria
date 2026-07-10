const API_URL = window.location.origin.replace('-3000', '-8000').replace(':3000', ':8000');

async function cargarUsuarios() {
    const contenedor = document.getElementById('lista-usuarios');
    const authToken = sessionStorage.getItem('access_token');

    try {
        const respuesta = await fetch(`${API_URL}/admin/usuarios`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const datos = await respuesta.json();

        if (!respuesta.ok) {
            contenedor.innerHTML = `<p>Error: ${datos.detail}</p>`;
            return;
        }

        contenedor.innerHTML = `
            <table style="width:100%; border-collapse: collapse;">
                <thead>
                    <tr style="text-align:left; border-bottom: 2px solid #eee;">
                        <th style="padding:8px;">Nombre</th>
                        <th style="padding:8px;">Email</th>
                        <th style="padding:8px;">Rol</th>
                        <th style="padding:8px;">Activo</th>
                    </tr>
                </thead>
                <tbody>
                    ${datos.usuarios.map(u => `
                        <tr style="border-bottom: 1px solid #f0f0f0;">
                            <td style="padding:8px;">${u.nombre_completo}</td>
                            <td style="padding:8px;">${u.email}</td>
                            <td style="padding:8px;">${u.roles.nombre}</td>
                            <td style="padding:8px;">${u.activo ? 'Si' : 'No'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        contenedor.innerHTML = '<p>Error de conexion con el servidor.</p>';
        console.error(error);
    }
}

// Mostrar/ocultar campos segun el rol seleccionado
document.getElementById('rol_id').addEventListener('change', function () {
    const campoMedico = document.getElementById('campos-medico');
    const campoPaciente = document.getElementById('campos-paciente');

    campoMedico.style.display = this.value === '2' ? 'block' : 'none';
    campoPaciente.style.display = this.value === '4' ? 'block' : 'none';
});

document.getElementById('form-usuario').addEventListener('submit', async function (e) {
    e.preventDefault();

    const mensaje = document.getElementById('mensaje-resultado');
    mensaje.textContent = '';
    const authToken = sessionStorage.getItem('access_token');

    const cuerpo = {
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        nombre_completo: document.getElementById('nombre_completo').value,
        rol_id: parseInt(document.getElementById('rol_id').value),
        especialidad: document.getElementById('especialidad').value || null,
        colegiatura: document.getElementById('colegiatura').value || null,
        fecha_nacimiento: document.getElementById('fecha_nacimiento').value || null,
        telefono: document.getElementById('telefono').value || null
    };

    try {
        const respuesta = await fetch(`${API_URL}/admin/usuarios`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(cuerpo)
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            mensaje.textContent = 'Error: ' + (datos.detail || 'No se pudo registrar el usuario');
            mensaje.style.color = '#d9534f';
            return;
        }

        mensaje.textContent = 'Usuario registrado exitosamente';
        mensaje.style.color = '#5cb85c';
        document.getElementById('form-usuario').reset();
        cargarUsuarios();

    } catch (error) {
        mensaje.textContent = 'Error de conexion con el servidor';
        mensaje.style.color = '#d9534f';
        console.error(error);
    }
});

document.addEventListener('DOMContentLoaded', cargarUsuarios);
