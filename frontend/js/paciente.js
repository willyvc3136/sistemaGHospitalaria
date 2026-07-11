const API_URL = window.location.origin.replace('-3000', '-8000').replace(':3000', ':8000');

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
                    <div class="tarjeta-cita-v2-motivo">${cita.motivo || 'Sin motivo especificado'}</div>
                </div>
                <span class="badge-estado ${cita.estado}">${cita.estado}</span>
            </div>
        `).join('');

    } catch (error) {
        contenedor.innerHTML = '<p>Error de conexion con el servidor.</p>';
        console.error(error);
    }
}

document.getElementById('form-reservar').addEventListener('submit', async function (e) {
    e.preventDefault();

    const mensaje = document.getElementById('mensaje-resultado');
    mensaje.textContent = '';
    const authToken = sessionStorage.getItem('access_token');

    const fecha_hora = document.getElementById('fecha_hora').value;
    const motivo = document.getElementById('motivo').value;

    try {
        const respuesta = await fetch(`${API_URL}/citas/reservar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                fecha_hora: new Date(fecha_hora).toISOString(),
                motivo
            })
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
    return fecha.toLocaleString('es-PE', {
        dateStyle: 'long',
        timeStyle: 'short'
    });
}

document.addEventListener('DOMContentLoaded', cargarCitas);
