const API_URL = window.location.origin.replace('-3000', '-8000').replace(':3000', ':8000');
let usuarioEnEdicion = null;

async function cargarEstadisticas() {
    const authToken = sessionStorage.getItem('access_token');
    try {
        const respuesta = await fetch(`${API_URL}/admin/estadisticas`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const datos = await respuesta.json();
        if (!respuesta.ok) return;

        document.getElementById('stat-usuarios').textContent = datos.total_usuarios;
        document.getElementById('stat-pacientes').textContent = datos.total_pacientes;
        document.getElementById('stat-citas').textContent = datos.total_citas;
        document.getElementById('stat-ingresos').textContent = `S/ ${datos.ingresos_totales}`;
    } catch (error) {
        console.error('Error cargando estadisticas:', error);
    }
}

const NOMBRES_ROL = { 1: 'Administrador', 2: 'Médico', 3: 'Recepción', 4: 'Paciente' };

async function cargarUsuarios() {
    const cuerpo = document.getElementById('cuerpo-tabla-usuarios');
    const authToken = sessionStorage.getItem('access_token');

    try {
        const respuesta = await fetch(`${API_URL}/admin/usuarios`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const datos = await respuesta.json();

        if (!respuesta.ok) {
            cuerpo.innerHTML = `<tr><td colspan="5">Error: ${datos.detail}</td></tr>`;
            return;
        }

        cuerpo.innerHTML = datos.usuarios.map(u => `
            <tr>
                <td>${u.nombre_completo}</td>
                <td>${u.email}</td>
                <td><span class="badge-rol">${u.roles.nombre}</span></td>
                <td><span class="badge-activo ${u.activo ? 'si' : 'no'}">${u.activo ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                    <div class="acciones-usuario">
                        <button class="boton-icono" onclick="abrirModalEditar('${u.id}', '${u.nombre_completo}')">Editar</button>
                        <button class="boton-icono ${u.activo ? 'peligro' : ''}" onclick="cambiarEstado('${u.id}', ${!u.activo})">
                            ${u.activo ? 'Desactivar' : 'Activar'}
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        cuerpo.innerHTML = '<tr><td colspan="5">Error de conexion con el servidor.</td></tr>';
        console.error(error);
    }
}

async function cambiarEstado(usuarioId, nuevoEstado) {
    const authToken = sessionStorage.getItem('access_token');
    try {
        const respuesta = await fetch(`${API_URL}/admin/usuarios/${usuarioId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ activo: nuevoEstado })
        });
        const datos = await respuesta.json();
        if (!respuesta.ok) { alert('Error: ' + datos.detail); return; }
        cargarUsuarios();
    } catch (error) { alert('Error de conexion'); console.error(error); }
}

function abrirModalEditar(usuarioId, nombreActual) {
    usuarioEnEdicion = usuarioId;
    document.getElementById('editar_nombre').value = nombreActual;
    document.getElementById('modal-editar').classList.add('activo');
}

function cerrarModalEditar() {
    usuarioEnEdicion = null;
    document.getElementById('modal-editar').classList.remove('activo');
}

document.getElementById('form-editar').addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!usuarioEnEdicion) return;

    const authToken = sessionStorage.getItem('access_token');
    const nuevoNombre = document.getElementById('editar_nombre').value;

    try {
        const respuesta = await fetch(`${API_URL}/admin/usuarios/${usuarioEnEdicion}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ nombre_completo: nuevoNombre })
        });
        const datos = await respuesta.json();
        if (!respuesta.ok) { alert('Error: ' + datos.detail); return; }
        cerrarModalEditar();
        cargarUsuarios();
    } catch (error) { alert('Error de conexion'); console.error(error); }
});

document.getElementById('rol_id').addEventListener('change', function () {
    document.getElementById('campos-medico').style.display = this.value === '2' ? 'block' : 'none';
    document.getElementById('campos-paciente').style.display = this.value === '4' ? 'block' : 'none';
});

function abrirModalUsuario() {
    document.getElementById('modal-usuario').classList.add('activo');
}

function cerrarModalUsuario() {
    document.getElementById('form-usuario').reset();
    document.getElementById('campos-medico').style.display = 'none';
    document.getElementById('campos-paciente').style.display = 'none';
    document.getElementById('mensaje-resultado').textContent = '';
    document.getElementById('modal-usuario').classList.remove('activo');
}

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
            mensaje.style.color = '#C94A2C';
            return;
        }

        mensaje.textContent = 'Usuario registrado exitosamente';
        mensaje.style.color = '#2F7A4D';
        setTimeout(() => {
            cerrarModalUsuario();
            cargarUsuarios();
            cargarEstadisticas();
        }, 800);

    } catch (error) {
        mensaje.textContent = 'Error de conexion con el servidor';
        mensaje.style.color = '#C94A2C';
        console.error(error);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    cargarEstadisticas();
    cargarUsuarios();
});
