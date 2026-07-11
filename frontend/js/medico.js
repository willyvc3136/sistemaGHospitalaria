const API_URL = window.location.origin.replace('-3000', '-8000').replace(':3000', ':8000');
let citaEnAtencion = null;

async function cargarAgenda() {
    const contenedor = document.getElementById('lista-citas');
    const authToken = sessionStorage.getItem('access_token');

    try {
        const respuesta = await fetch(`${API_URL}/citas/mi-agenda`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const datos = await respuesta.json();

        if (!respuesta.ok) {
            contenedor.innerHTML = `<p>Error: ${datos.detail}</p>`;
            return;
        }

        actualizarResumen(datos.citas);

        if (datos.citas.length === 0) {
            contenedor.innerHTML = `
                <div class="estado-vacio">
                    <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                    <p>No tienes citas en tu agenda.</p>
                </div>
            `;
            return;
        }

        contenedor.innerHTML = datos.citas.map(cita => `
            <div class="tarjeta-cita-v2">
                <div class="tarjeta-cita-v2-icono">
                    <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
                </div>
                <div class="tarjeta-cita-v2-info">
                    <div class="tarjeta-cita-v2-fecha">${formatearFecha(cita.fecha_hora)}</div>
                    <div class="tarjeta-cita-v2-motivo">${cita.paciente_nombre || 'Paciente'} — ${cita.motivo || 'Sin motivo especificado'}</div>
                    ${cita.estado === 'atendida' ? `
                        <div class="info-atendida">
                            <strong>Diagnóstico:</strong> ${cita.diagnostico || '-'}<br>
                            <strong>Receta:</strong> ${cita.receta || '-'}
                        </div>
                    ` : ''}
                </div>
                <div class="tarjeta-cita-v2-acciones">
                    <span class="badge-estado ${cita.estado}">${cita.estado}</span>
                    <div class="acciones-cita">
                        <button class="boton-cerrar-modal" style="padding:6px 12px; font-size:12.5px;" onclick="verHistorial('${cita.paciente_id}', '${cita.paciente_nombre || 'Paciente'}')">Ver historial</button>
                        ${cita.estado === 'pendiente' ? `
                            <button class="boton-confirmar" onclick="confirmarCita(${cita.id})">Confirmar</button>
                            <button class="boton-cancelar" onclick="cancelarCitaMedico(${cita.id})">Cancelar</button>
                        ` : ''}
                        ${cita.estado === 'confirmada' ? `
                            <button class="boton-atender" onclick="abrirModal(${cita.id})">Atender</button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        contenedor.innerHTML = '<p>Error de conexion con el servidor.</p>';
        console.error(error);
    }
}

function actualizarResumen(citas) {
    document.getElementById('contador-total').textContent = citas.length;
    document.getElementById('contador-pendientes').textContent = citas.filter(c => c.estado === 'pendiente').length;
    document.getElementById('contador-confirmadas').textContent = citas.filter(c => c.estado === 'confirmada').length;

    const atendidas = citas.filter(c => c.estado === 'atendida').length;
    const porConfirmar = citas.filter(c => c.estado === 'pendiente').length;
    document.getElementById('stat-atendidas').textContent = atendidas;
    document.getElementById('stat-pendientes').textContent = porConfirmar;
}

async function confirmarCita(citaId) {
    const authToken = sessionStorage.getItem('access_token');
    try {
        const respuesta = await fetch(`${API_URL}/citas/${citaId}/confirmar`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const datos = await respuesta.json();
        if (!respuesta.ok) {
            alert('Error: ' + (datos.detail || 'No se pudo confirmar'));
            return;
        }
        cargarAgenda();
    } catch (error) {
        alert('Error de conexion con el servidor');
        console.error(error);
    }
}

async function cancelarCitaMedico(citaId) {
    if (!confirm('¿Seguro que quieres cancelar esta cita?')) return;
    const authToken = sessionStorage.getItem('access_token');
    try {
        const respuesta = await fetch(`${API_URL}/citas/${citaId}/cancelar-medico`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const datos = await respuesta.json();
        if (!respuesta.ok) {
            alert('Error: ' + (datos.detail || 'No se pudo cancelar'));
            return;
        }
        cargarAgenda();
    } catch (error) {
        alert('Error de conexion con el servidor');
        console.error(error);
    }
}

function abrirModal(citaId) {
    citaEnAtencion = citaId;
    document.getElementById('modal-atender').classList.add('activo');
}

function cerrarModal() {
    citaEnAtencion = null;
    document.getElementById('form-atender').reset();
    document.getElementById('modal-atender').classList.remove('activo');
}

document.getElementById('form-atender').addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!citaEnAtencion) return;

    const authToken = sessionStorage.getItem('access_token');
    const diagnostico = document.getElementById('diagnostico').value;
    const receta = document.getElementById('receta').value;

    try {
        const respuesta = await fetch(`${API_URL}/citas/${citaEnAtencion}/atender`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ diagnostico, receta })
        });
        const datos = await respuesta.json();
        if (!respuesta.ok) {
            alert('Error: ' + (datos.detail || 'No se pudo registrar la atencion'));
            return;
        }
        cerrarModal();
        cargarAgenda();
    } catch (error) {
        alert('Error de conexion con el servidor');
        console.error(error);
    }
});

function formatearFecha(fechaISO) {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleString('es-PE', { dateStyle: 'long', timeStyle: 'short' });
}


async function verHistorial(pacienteId, nombrePaciente) {
    document.getElementById('historial-titulo').textContent = `Historial de ${nombrePaciente}`;
    document.getElementById('historial-contenido').innerHTML = '<p>Cargando...</p>';
    document.getElementById('modal-historial').classList.add('activo');

    const authToken = sessionStorage.getItem('access_token');
    try {
        const respuesta = await fetch(`${API_URL}/citas/historial-paciente/${pacienteId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const datos = await respuesta.json();

        if (!respuesta.ok) {
            document.getElementById('historial-contenido').innerHTML = `<p>Error: ${datos.detail}</p>`;
            return;
        }

        if (datos.citas.length === 0) {
            document.getElementById('historial-contenido').innerHTML = '<p>Sin citas previas registradas.</p>';
            return;
        }

        document.getElementById('historial-contenido').innerHTML = datos.citas.map(cita => `
            <div class="tarjeta-cita-v2" style="margin-bottom:10px;">
                <div class="tarjeta-cita-v2-info">
                    <div class="tarjeta-cita-v2-fecha">${formatearFecha(cita.fecha_hora)}</div>
                    <div class="tarjeta-cita-v2-motivo">${cita.motivo || 'Sin motivo'}</div>
                    ${cita.estado === 'atendida' ? `
                        <div class="info-atendida">
                            <strong>Diagnóstico:</strong> ${cita.diagnostico || '-'}<br>
                            <strong>Receta:</strong> ${cita.receta || '-'}
                        </div>
                    ` : ''}
                </div>
                <span class="badge-estado ${cita.estado}">${cita.estado}</span>
            </div>
        `).join('');

    } catch (error) {
        document.getElementById('historial-contenido').innerHTML = '<p>Error de conexion con el servidor.</p>';
        console.error(error);
    }
}

function cerrarModalHistorial() {
    document.getElementById('modal-historial').classList.remove('activo');
}

document.addEventListener('DOMContentLoaded', cargarAgenda);
