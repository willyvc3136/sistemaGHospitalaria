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
            contenedor.innerHTML = '<p>No tienes citas programadas.</p>';
            return;
        }

        contenedor.innerHTML = datos.citas.map(cita => `
            <div class="tarjeta-cita">
                <div class="fecha">${formatearFecha(cita.fecha_hora)}</div>
                <span class="estado ${cita.estado}">${cita.estado}</span>
                <div class="motivo">${cita.motivo || 'Sin motivo especificado'}</div>
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
            mensaje.style.color = '#d9534f';
            return;
        }

        mensaje.textContent = 'Cita reservada exitosamente';
        mensaje.style.color = '#5cb85c';
        document.getElementById('form-reservar').reset();
        cargarCitas();

    } catch (error) {
        mensaje.textContent = 'Error de conexion con el servidor';
        mensaje.style.color = '#d9534f';
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
