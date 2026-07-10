const API_URL = window.location.origin.replace('-3000', '-8000').replace(':3000', ':8000');

async function cargarCitas() {
    const contenedor = document.getElementById('lista-citas');
    const token = sessionStorage.getItem('access_token');

    try {
        const respuesta = await fetch(`${API_URL}/citas/mis-citas`, {
            headers: { 'Authorization': `Bearer ${token}` }
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

function formatearFecha(fechaISO) {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleString('es-PE', {
        dateStyle: 'long',
        timeStyle: 'short'
    });
}

document.addEventListener('DOMContentLoaded', cargarCitas);
