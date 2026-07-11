const API_URL = window.location.origin.replace('-3000', '-8000').replace(':3000', ':8000');
let usuarioEnEdicion = null;
let rolUsuarioEnEdicion = null;

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

let usuariosCompletos = [];
let filtroRolActual = 'todos';

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

        usuariosCompletos = datos.usuarios;
        pintarUsuarios();

    } catch (error) {
        cuerpo.innerHTML = '<tr><td colspan="5">Error de conexion con el servidor.</td></tr>';
        console.error(error);
    }
}

function filtrarUsuarios(rol, boton) {
    filtroRolActual = rol;
    document.querySelectorAll('[data-rol]').forEach(b => b.classList.remove('activo'));
    boton.classList.add('activo');
    pintarUsuarios();
}

function pintarUsuarios() {
    const cuerpo = document.getElementById('cuerpo-tabla-usuarios');
    let lista = usuariosCompletos;
    if (filtroRolActual !== 'todos') {
        lista = lista.filter(u => u.roles.nombre === filtroRolActual);
    }

    if (lista.length === 0) {
        cuerpo.innerHTML = '<tr><td colspan="5">No hay usuarios en esta categoria.</td></tr>';
        return;
    }

    try {
        cuerpo.innerHTML = lista.map(u => `
            <tr>
                <td>${u.nombre_completo}</td>
                <td>${u.email}</td>
                <td><span class="badge-rol">${u.roles.nombre}</span></td>
                <td><span class="badge-activo ${u.activo ? 'si' : 'no'}">${u.activo ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                    <div class="acciones-usuario">
                        <button class="boton-icono" onclick="abrirModalEditar('${u.id}')">Editar</button>
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
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
            body: JSON.stringify({ activo: nuevoEstado })
        });
        const datos = await respuesta.json();
        if (!respuesta.ok) { alert('Error: ' + datos.detail); return; }
        cargarUsuarios();
    } catch (error) { alert('Error de conexion'); console.error(error); }
}

async function abrirModalEditar(usuarioId) {
    usuarioEnEdicion = usuarioId;
    const authToken = sessionStorage.getItem('access_token');

    document.getElementById('editar-campos-medico').style.display = 'none';
    document.getElementById('editar-campos-paciente').style.display = 'none';
    document.getElementById('editar_mensaje').textContent = '';

    try {
        const respuesta = await fetch(`${API_URL}/admin/usuarios/${usuarioId}/detalle`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const datos = await respuesta.json();
        if (!respuesta.ok) { alert('Error: ' + datos.detail); return; }

        rolUsuarioEnEdicion = datos.roles.nombre;
        document.getElementById('editar_nombre').value = datos.nombre_completo;

        if (rolUsuarioEnEdicion === 'Médico') {
            document.getElementById('editar-campos-medico').style.display = 'block';
            document.getElementById('editar_especialidad').value = datos.datos_extra.especialidad || '';
            document.getElementById('editar_colegiatura').value = datos.datos_extra.colegiatura || '';
        } else if (rolUsuarioEnEdicion === 'Paciente') {
            document.getElementById('editar-campos-paciente').style.display = 'block';
            document.getElementById('editar_telefono').value = datos.datos_extra.telefono || '';
            document.getElementById('editar_fecha_nacimiento').value = datos.datos_extra.fecha_nacimiento || '';
        }

        document.getElementById('modal-editar').classList.add('activo');

    } catch (error) {
        alert('Error de conexion con el servidor');
        console.error(error);
    }
}

function cerrarModalEditar() {
    usuarioEnEdicion = null;
    rolUsuarioEnEdicion = null;
    document.getElementById('form-editar').reset();
    document.getElementById('modal-editar').classList.remove('activo');
}

document.getElementById('form-editar').addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!usuarioEnEdicion) return;

    const mensaje = document.getElementById('editar_mensaje');
    mensaje.textContent = '';
    const authToken = sessionStorage.getItem('access_token');

    const cuerpo = { nombre_completo: document.getElementById('editar_nombre').value };

    if (rolUsuarioEnEdicion === 'Médico') {
        cuerpo.especialidad = document.getElementById('editar_especialidad').value;
        cuerpo.colegiatura = document.getElementById('editar_colegiatura').value;
    } else if (rolUsuarioEnEdicion === 'Paciente') {
        cuerpo.telefono = document.getElementById('editar_telefono').value;
        cuerpo.fecha_nacimiento = document.getElementById('editar_fecha_nacimiento').value;
    }

    try {
        const respuesta = await fetch(`${API_URL}/admin/usuarios/${usuarioEnEdicion}/detalle`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
            body: JSON.stringify(cuerpo)
        });
        const datos = await respuesta.json();
        if (!respuesta.ok) {
            mensaje.textContent = 'Error: ' + (datos.detail || 'No se pudo actualizar');
            mensaje.style.color = '#C94A2C';
            return;
        }
        mensaje.textContent = 'Actualizado exitosamente';
        mensaje.style.color = '#2F7A4D';
        setTimeout(() => { cerrarModalEditar(); cargarUsuarios(); }, 700);
    } catch (error) {
        mensaje.textContent = 'Error de conexion';
        mensaje.style.color = '#C94A2C';
        console.error(error);
    }
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
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
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
