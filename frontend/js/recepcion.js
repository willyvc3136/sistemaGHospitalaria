const API_URL = window.location.origin.replace('-3000', '-8000').replace(':3000', ':8000');
let listaMedicosGlobal = [];
let filtroActual = 'todas';
let directorioCompleto = [];

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
    const selectMedico = document.getElementById('medico');
    const authToken = sessionStorage.getItem('access_token');
    try {
        const respMedicos = await fetch(`${API_URL}/citas/lista-medicos`, { headers: { 'Authorization': `Bearer ${authToken}` } });
        const datosMedicos = await respMedicos.json();
        listaMedicosGlobal = datosMedicos.medicos;
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
        if (!respuesta.ok) { contenedor.innerHTML = `<p>Error: ${datos.detail}</p>`; return; }
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
    if (filtroActual !== 'todas') citas = citas.filter(c => c.estado === filtroActual);

    if (citas.length === 0) {
        contenedor.innerHTML = `<div class="estado-vacio"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg><p>No hay citas para mostrar.</p></div>`;
        return;
    }

    const opcionesMedicos = listaMedicosGlobal.map(m => `<option value="${m.usuario_id}">${m.profiles.nombre_completo}</option>`).join('');

    contenedor.innerHTML = citas.map(cita => `
        <div class="tarjeta-cita-v2">
            <div class="tarjeta-cita-v2-icono">
                <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
            </div>
            <div class="tarjeta-cita-v2-info">
                <div class="tarjeta-cita-v2-fecha">${formatearFecha(cita.fecha_hora)}</div>
                <div class="tarjeta-cita-v2-motivo">
                    <span style="cursor:pointer; text-decoration:underline;" onclick="verHistorialRecepcion('${cita.paciente_id}', '${cita.paciente_nombre}')">${cita.paciente_nombre}</span>
                    → Dr(a). ${cita.medico_nombre} — ${cita.motivo || 'Sin motivo'}
                </div>
                <div style="font-size:12.5px; color:var(--texto-suave); margin-top:2px;">S/ ${cita.monto} ${cita.pagado ? '✓ Pagado' : '· Pendiente de pago'}</div>
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
                    ${!cita.pagado ? `<button class="boton-atender" onclick="cobrarCita(${cita.id})">Cobrar</button>` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function filtrarAgenda(estado, boton) {
    filtroActual = estado;
    document.querySelectorAll('[data-filtro]').forEach(b => b.classList.remove('activo'));
    boton.classList.add('activo');
    pintarAgenda();
}

function cambiarTab(tab, boton) {
    document.querySelectorAll('[data-tab]').forEach(b => b.classList.remove('activo'));
    boton.classList.add('activo');
    document.getElementById('tab-agenda').style.display = tab === 'agenda' ? 'block' : 'none';
    document.getElementById('tab-pacientes').style.display = tab === 'pacientes' ? 'block' : 'none';
    if (tab === 'pacientes') cargarDirectorioPacientes();
}

async function cargarDirectorioPacientes() {
    const authToken = sessionStorage.getItem('access_token');
    try {
        const respuesta = await fetch(`${API_URL}/citas/directorio-pacientes`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const datos = await respuesta.json();
        if (!respuesta.ok) return;
        directorioCompleto = datos.pacientes;
        pintarDirectorio();
    } catch (error) {
        console.error(error);
    }
}

function pintarDirectorio() {
    const contenedor = document.getElementById('lista-pacientes-directorio');
    const texto = document.getElementById('buscador-directorio').value.toLowerCase();
    const orden = document.getElementById('orden-directorio').value;

    let lista = directorioCompleto.filter(p => p.profiles.nombre_completo.toLowerCase().includes(texto));
    lista.sort((a, b) => {
        const nombreA = a.profiles.nombre_completo.toLowerCase();
        const nombreB = b.profiles.nombre_completo.toLowerCase();
        return orden === 'az' ? nombreA.localeCompare(nombreB) : nombreB.localeCompare(nombreA);
    });

    if (lista.length === 0) {
        contenedor.innerHTML = '<p>No se encontraron pacientes.</p>';
        return;
    }

    contenedor.innerHTML = lista.map(p => `
        <div class="tarjeta-cita-v2">
            <div class="tarjeta-cita-v2-icono">
                <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a8 8 0 0 1 16 0v1"/></svg>
            </div>
            <div class="tarjeta-cita-v2-info">
                <div class="tarjeta-cita-v2-fecha" style="cursor:pointer; text-decoration:underline;" onclick="verHistorialRecepcion('${p.usuario_id}', '${p.profiles.nombre_completo}')">${p.profiles.nombre_completo}</div>
                <div class="tarjeta-cita-v2-motivo">${p.profiles.email} ${p.telefono ? '— ' + p.telefono : ''}</div>
                <div class="tarjeta-cita-v2-motivo">Historial: ${p.historial_clinico_nro || '-'}</div>
            </div>
        </div>
    `).join('');
}

async function verHistorialRecepcion(pacienteId, nombrePaciente) {
    document.getElementById('historial-recepcion-titulo').textContent = `Historial de ${nombrePaciente}`;
    document.getElementById('historial-recepcion-contenido').innerHTML = '<p>Cargando...</p>';
    document.getElementById('modal-historial-recepcion').classList.add('activo');

    const authToken = sessionStorage.getItem('access_token');
    try {
        const respuesta = await fetch(`${API_URL}/citas/historial-basico/${pacienteId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const datos = await respuesta.json();
        if (!respuesta.ok) {
            document.getElementById('historial-recepcion-contenido').innerHTML = `<p>Error: ${datos.detail}</p>`;
            return;
        }
        if (datos.citas.length === 0) {
            document.getElementById('historial-recepcion-contenido').innerHTML = '<p>Sin citas previas registradas.</p>';
            return;
        }
        document.getElementById('historial-recepcion-contenido').innerHTML = datos.citas.map(cita => `
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
        document.getElementById('historial-recepcion-contenido').innerHTML = '<p>Error de conexion.</p>';
        console.error(error);
    }
}

function cerrarModalHistorialRecepcion() {
    document.getElementById('modal-historial-recepcion').classList.remove('activo');
}

async function confirmarCita(citaId) {
    const authToken = sessionStorage.getItem('access_token');
    try {
        const respuesta = await fetch(`${API_URL}/citas/${citaId}/confirmar-recepcion`, { method: 'POST', headers: { 'Authorization': `Bearer ${authToken}` } });
        const datos = await respuesta.json();
        if (!respuesta.ok) { alert('Error: ' + datos.detail); return; }
        cargarAgenda();
    } catch (error) { alert('Error de conexion'); console.error(error); }
}

async function cancelarCita(citaId) {
    if (!confirm('¿Cancelar esta cita?')) return;
    const authToken = sessionStorage.getItem('access_token');
    try {
        const respuesta = await fetch(`${API_URL}/citas/${citaId}/cancelar-recepcion`, { method: 'POST', headers: { 'Authorization': `Bearer ${authToken}` } });
        const datos = await respuesta.json();
        if (!respuesta.ok) { alert('Error: ' + datos.detail); return; }
        cargarAgenda();
    } catch (error) { alert('Error de conexion'); console.error(error); }
}

async function cobrarCita(citaId) {
    if (!confirm('¿Confirmar el cobro de esta cita?')) return;
    const authToken = sessionStorage.getItem('access_token');
    try {
        const respuesta = await fetch(`${API_URL}/citas/${citaId}/cobrar`, { method: 'POST', headers: { 'Authorization': `Bearer ${authToken}` } });
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
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
            body: JSON.stringify({ nuevo_medico_id: nuevoMedicoId })
        });
        const datos = await respuesta.json();
        if (!respuesta.ok) { alert('Error: ' + datos.detail); return; }
        cargarAgenda();
    } catch (error) { alert('Error de conexion'); console.error(error); }
}

let temporizadorBusqueda = null;

function inicializarAutocompletado() {
    const inputBusqueda = document.getElementById('paciente_busqueda');
    const inputOculto = document.getElementById('paciente');
    const lista = document.getElementById('autocompletar-lista');

    inputBusqueda.addEventListener('input', function () {
        inputOculto.value = '';
        const texto = this.value.trim();
        clearTimeout(temporizadorBusqueda);
        if (texto.length < 2) { lista.classList.remove('activa'); return; }

        temporizadorBusqueda = setTimeout(async () => {
            const authToken = sessionStorage.getItem('access_token');
            try {
                const respuesta = await fetch(`${API_URL}/citas/buscar-pacientes?q=${encodeURIComponent(texto)}`, { headers: { 'Authorization': `Bearer ${authToken}` } });
                const datos = await respuesta.json();
                lista.innerHTML = datos.pacientes.length === 0
                    ? '<div class="autocompletar-vacio">Sin coincidencias</div>'
                    : datos.pacientes.map(p => `<div class="autocompletar-item" data-id="${p.usuario_id}" data-nombre="${p.nombre_completo}">${p.nombre_completo}</div>`).join('');
                lista.classList.add('activa');
                lista.querySelectorAll('.autocompletar-item').forEach(item => {
                    item.addEventListener('click', function () {
                        inputBusqueda.value = this.dataset.nombre;
                        inputOculto.value = this.dataset.id;
                        lista.classList.remove('activa');
                    });
                });
            } catch (error) { console.error(error); }
        }, 300);
    });

    document.addEventListener('click', function (e) {
        if (!e.target.closest('.autocompletar-contenedor')) lista.classList.remove('activa');
    });
}

function abrirModalCita() { document.getElementById('modal-cita').classList.add('activo'); }
function cerrarModalCita() {
    document.getElementById('form-cita').reset();
    document.getElementById('mensaje-resultado').textContent = '';
    document.getElementById('modal-cita').classList.remove('activo');
}

function abrirModalPaciente() { document.getElementById('modal-nuevo-paciente').classList.add('activo'); }
function cerrarModalPaciente() {
    document.getElementById('form-nuevo-paciente').reset();
    document.getElementById('np_mensaje').textContent = '';
    document.getElementById('modal-nuevo-paciente').classList.remove('activo');
}

document.getElementById('form-nuevo-paciente').addEventListener('submit', async function (e) {
    e.preventDefault();
    const mensaje = document.getElementById('np_mensaje');
    mensaje.textContent = '';
    const cuerpo = {
        nombre_completo: document.getElementById('np_nombre').value,
        email: document.getElementById('np_email').value,
        password: document.getElementById('np_password').value,
        fecha_nacimiento: document.getElementById('np_fecha_nacimiento').value,
        telefono: document.getElementById('np_telefono').value || null
    };
    try {
        const respuesta = await fetch(`${API_URL}/auth/registro-paciente`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo)
        });
        const datos = await respuesta.json();
        if (!respuesta.ok) { mensaje.textContent = 'Error: ' + (datos.detail || 'No se pudo registrar'); mensaje.style.color = '#C94A2C'; return; }
        document.getElementById('paciente_busqueda').value = cuerpo.nombre_completo;
        document.getElementById('paciente').value = datos.usuario.id;
        cerrarModalPaciente();
    } catch (error) { mensaje.textContent = 'Error de conexion'; mensaje.style.color = '#C94A2C'; console.error(error); }
});

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
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
            body: JSON.stringify({ paciente_id, medico_id, fecha_hora, motivo })
        });
        const datos = await respuesta.json();
        if (!respuesta.ok) { mensaje.textContent = 'Error: ' + (datos.detail || 'No se pudo crear la cita'); mensaje.style.color = '#C94A2C'; return; }
        mensaje.textContent = 'Cita creada exitosamente';
        mensaje.style.color = '#2F7A4D';
        setTimeout(() => { cerrarModalCita(); cargarAgenda(); }, 800);
    } catch (error) { mensaje.textContent = 'Error de conexion'; mensaje.style.color = '#C94A2C'; console.error(error); }
});

function formatearFecha(fechaISO) {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleString('es-PE', { dateStyle: 'long', timeStyle: 'short' });
}

document.addEventListener('DOMContentLoaded', () => {
    generarHorarios();
    cargarListas();
    cargarAgenda();
    inicializarAutocompletado();
    document.getElementById('buscador-directorio').addEventListener('input', pintarDirectorio);
    document.getElementById('orden-directorio').addEventListener('change', pintarDirectorio);
});
