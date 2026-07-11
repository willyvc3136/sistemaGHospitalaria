const API_URL = window.location.origin.replace('-3000', '-8000').replace(':3000', ':8000');
let listaMedicosGlobal = [];
let filtroActual = 'todas';

function generarHorarios() {
    const select = document.getElementById('hora');
    for (let h = 8; h < 18; h++) {
        for (let m = 0; m < 60; m += 30) {
            const valor = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
            select.innerHTML += `<option value="${valor}">${valor}</option>`;
        }
    }
}

async function cargarListas() {
    const selectPaciente = document.getElementById('paciente');
    const selectMedico = document.getElementById('medico');
    const authToken = sessionStorage.getItem('access_token');

    try {
        const [respPacientes, respMedicos] = await Promise.all([
            fetch(`${API_URL}/citas/lista-pacientes`, { headers: { 'Authorization': `Bearer ${authToken}` } }),
            fetch(`${API_URL}/citas/lista-medicos`, { headers: { 'Authorization': `Bearer ${authToken}` } })
        ]);

        const datosPacientes = await respPacientes.json();
        const datosMedicos = await respMedicos.json();
        listaMedicosGlobal = datosMedicos.medicos;

        selectPaciente.innerHTML = '<option value="">Selecciona un paciente</option>' +
            datosPacientes.pacientes.map(p => `<option value="${p.usuario_id}">${p.profiles.nombre_completo}</option>`).join('');

        selectMedico.innerHTML = '<option value="">Selecciona un medico</option>' +
            datosMedicos.medicos.map(m => `<option value="${m.usuario_id}">${m.profiles.nombre_completo} (${m.especialidad})</option>`).join('');

    } catch (error) {
        console.error('Error cargando listas:', error);
    }
}

async function cargarAgenda() {
    const contenedor = document.getElementById('lista-agenda');
    const authToken = sessionStorage.getItem('access_token');

    try {
        const respuesta = await fetch(`${API_URL}/citas/agenda-completa`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const datos = await respuesta.json();

        if (!respuesta.ok) {
            contenedor.innerHTML = `<p>Error: ${datos.detail}</p>`;
            return;
        }

        window.agendaCompleta = datos.citas;
        pintarAgenda();

    } catch (error) {
        contenedor.innerHTML = '<p>Error de conexion con el servidor.</p>';
        console.error(error);
    }
}

function pintarAgenda() {
    const contenedor = document.getElementById('lista-agenda');
    let citas = window.agendaCompleta || [];

    if (filtroActual !== 'todas') {
        citas = citas.filter(c => c.estado === filtroActual);
    }

    if (citas.length === 0) {
        contenedor.innerHTML = `
            <div class="estado-vacio">
                <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                <p>No hay citas para mostrar.</p>
            </div>
        `;
        return;
    }

    const opcionesMedicos = listaMedicosGlobal.map(m =>
        `<option value="${m.usuario_id}">${m.profiles.nombre_completo}</option>`
    ).join('');

    contenedor.innerHTML = citas.map(cita => `
        <div class="tarjeta-cita-v2">
            <div class="tarjeta-cita-v2-icono">
                <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
            </div>
            <div class="tarjeta-cita-v2-info">
                <div class="tarjeta-cita-v2-fecha">${formatearFecha(cita.fecha_hora)}</div>
                <div class="tarjeta-cita-v2-motivo">${cita.paciente_nombre} → Dr(a). ${cita.medico_nombre} — ${cita.motivo || 'Sin motivo'}</div>
                ${cita.estado === 'pendiente' ? `
                    <select class="select-derivar" onchange="derivarCita(${cita.id}, this.value)">
                        <option value="">Derivar a...</option>
                        ${opcionesMedicos}
                    </select>
                ` : ''}
            </div>
            <div class="tarjeta-cita-v2-acciones">
                <span class="badge-estado ${cita.estado}">${cita.estado}</span>
                <div class="acciones-cita">
                    ${cita.estado === 'pendiente' ? `
                        <button class="boton-confirmar" onclick="confirmarCita(${cita.id})">Confirmar</button>
                        <button class="boton-cancelar" onclick="cancelarCita(${cita.id})">Cancelar</button>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function filtrarAgenda(estado, boton) {
    filtroActual = estado;
    document.querySelectorAll('.filtro-boton').forEach(b => b.classList.remove('activo'));
    boton.classList.add('activo');
    pintarAgenda();
}

async function confirmarCita(citaId) {
    const authToken = sessionStorage.getItem('access_token');
    try {
        const respuesta = await fetch(`${API_URL}/citas/${citaId}/confirmar-recepcion`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const datos = await respuesta.json();
        if (!respuesta.ok) { alert('Error: ' + datos.detail); return; }
        cargarAgenda();
    } catch (error) { alert('Error de conexion'); console.error(error); }
}

async function cancelarCita(citaId) {
    if (!confirm('¿Cancelar esta cita?')) return;
    const authToken = sessionStorage.getItem('access_token');
    try {
        const respuesta = await fetch(`${API_URL}/citas/${citaId}/cancelar-recepcion`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const datos = await respuesta.json();
        if (!respuesta.ok) { alert('Error: ' + datos.detail); return; }
        cargarAgenda();
    } catch (error) { alert('Error de conexion'); console.error(error); }
}

async function derivarCita(citaId, nuevoMedicoId) {
    if (!nuevoMedicoId) return;
    const authToken = sessionStorage.getItem('access_token');
    try {
        const respuesta = await fetch(`${API_URL}/citas/${citaId}/derivar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ nuevo_medico_id: nuevoMedicoId })
        });
        const datos = await respuesta.json();
        if (!respuesta.ok) { alert('Error: ' + datos.detail); return; }
        cargarAgenda();
    } catch (error) { alert('Error de conexion'); console.error(error); }
}

document.getElementById('form-cita').addEventListener('submit', async function (e) {
    e.preventDefault();
    const mensaje = document.getElementById('mensaje-resultado');
    mensaje.textContent = '';
    const authToken = sessionStorage.getItem('access_token');

    const paciente_id = document.getElementById('paciente').value;
    const medico_id = document.getElementById('medico').value;
    const fecha = document.getElementById('fecha').value;
    const hora = document.getElementById('hora').value;
    const motivo = document.getElementById('motivo').value;
    const fecha_hora = new Date(`${fecha}T${hora}:00`).toISOString();

    try {
        const respuesta = await fetch(`${API_URL}/citas/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ paciente_id, medico_id, fecha_hora, motivo })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            mensaje.textContent = 'Error: ' + (datos.detail || 'No se pudo crear la cita');
            mensaje.style.color = '#C94A2C';
            return;
        }

        mensaje.textContent = 'Cita creada exitosamente';
        mensaje.style.color = '#2F7A4D';
        document.getElementById('form-cita').reset();
        cargarAgenda();

    } catch (error) {
        mensaje.textContent = 'Error de conexion con el servidor';
        mensaje.style.color = '#C94A2C';
        console.error(error);
    }
});

function formatearFecha(fechaISO) {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleString('es-PE', { dateStyle: 'long', timeStyle: 'short' });
}

document.addEventListener('DOMContentLoaded', () => {
    generarHorarios();
    cargarListas();
    cargarAgenda();
});
