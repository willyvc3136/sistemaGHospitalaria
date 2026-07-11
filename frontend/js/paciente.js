const API_URL = window.location.origin.replace('-3000', '-8000').replace(':3000', ':8000');
const HORA_APERTURA = 8;
const HORA_CIERRE = 18;

function generarHorarios() {
    const select = document.getElementById('hora');
    for (let h = HORA_APERTURA; h < HORA_CIERRE; h++) {
        for (let m = 0; m < 60; m += 30) {
            const hora = h.toString().padStart(2, '0');
            const min = m.toString().padStart(2, '0');
            const valor = `${hora}:${min}`;
            select.innerHTML += `<option value="${valor}">${valor}</option>`;
        }
    }
}

async function cargarPerfil() {
    const authToken = sessionStorage.getItem('access_token');
    try {
        const respuesta = await fetch(`${API_URL}/auth/mi-perfil`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const datos = await respuesta.json();
        if (!respuesta.ok) return;

        document.getElementById('perfil-nombre').textContent = datos.nombre_completo;
        document.getElementById('perfil-email').textContent = datos.email;
        document.getElementById('perfil-historial').textContent = datos.historial_clinico_nro ? `Historial: ${datos.historial_clinico_nro}` : '';
        document.getElementById('perfil-inicial').textContent = datos.nombre_completo.charAt(0).toUpperCase();
    } catch (error) {
        console.error('Error cargando perfil:', error);
    }
}

async function cargarCitas() {
    const contenedor = document.getElementById('lista-citas');
    const authToken = sessionStorage.getItem('access_token');

    try {
        const respuesta = await fetch(`${API_URL}/citas/mis-citas`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const datos = await respuesta.json();

        if (!respuesta.ok) {
            contenedor.innerHTML = `<p>Error: ${datos.detail}</p>`;
            return;
        }

        if (datos.citas.length === 0) {
            contenedor.innerHTML = `
                <div class="estado-vacio">
                    <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                    <p>Aún no tienes citas. Reserva la primera arriba.</p>
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
                    <div class="tarjeta-cita-v2-motivo">Dr(a). ${cita.medico_nombre || 'No asignado'} — ${cita.motivo || 'Sin motivo especificado'}</div>
                </div>
                <div class="tarjeta-cita-v2-acciones">
                    <span class="badge-estado ${cita.estado}">${cita.estado}</span>
                    ${cita.estado === 'pendiente' ? `<button class="boton-cancelar" onclick="cancelarCita(${cita.id})">Cancelar</button>` : ''}
                </div>
            </div>
        `).join('');

    } catch (error) {
        contenedor.innerHTML = '<p>Error de conexion con el servidor.</p>';
        console.error(error);
    }
}

async function cancelarCita(citaId) {
    if (!confirm('¿Seguro que quieres cancelar esta cita?')) return;

    const authToken = sessionStorage.getItem('access_token');
    try {
        const respuesta = await fetch(`${API_URL}/citas/${citaId}/cancelar`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const datos = await respuesta.json();

        if (!respuesta.ok) {
            alert('Error: ' + (datos.detail || 'No se pudo cancelar'));
            return;
        }
        cargarCitas();
    } catch (error) {
        alert('Error de conexion con el servidor');
        console.error(error);
    }
}

document.getElementById('form-reservar').addEventListener('submit', async function (e) {
    e.preventDefault();

    const mensaje = document.getElementById('mensaje-resultado');
    mensaje.textContent = '';
    const authToken = sessionStorage.getItem('access_token');

    const fecha = document.getElementById('fecha').value;
    const hora = document.getElementById('hora').value;
    const motivo = document.getElementById('motivo').value;
    const fechaHoraISO = new Date(`${fecha}T${hora}:00`).toISOString();

    try {
        const respuesta = await fetch(`${API_URL}/citas/reservar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ fecha_hora: fechaHoraISO, motivo })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            mensaje.textContent = 'Error: ' + (datos.detail || 'No se pudo reservar la cita');
            mensaje.style.color = '#C94A2C';
            return;
        }

        mensaje.textContent = 'Cita reservada exitosamente';
        mensaje.style.color = '#2F7A4D';
        document.getElementById('form-reservar').reset();
        cargarCitas();

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
    cargarPerfil();
    cargarCitas();
});
