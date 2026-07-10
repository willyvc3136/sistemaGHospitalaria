const API_URL = window.location.origin.replace('-3000', '-8000').replace(':3000', ':8000');

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

        selectPaciente.innerHTML = '<option value="">Selecciona un paciente</option>' +
            datosPacientes.pacientes.map(p =>
                `<option value="${p.usuario_id}">${p.profiles.nombre_completo}</option>`
            ).join('');

        selectMedico.innerHTML = '<option value="">Selecciona un medico</option>' +
            datosMedicos.medicos.map(m =>
                `<option value="${m.usuario_id}">${m.profiles.nombre_completo} (${m.especialidad})</option>`
            ).join('');

    } catch (error) {
        console.error('Error cargando listas:', error);
    }
}

document.getElementById('form-cita').addEventListener('submit', async function (e) {
    e.preventDefault();

    const mensaje = document.getElementById('mensaje-resultado');
    mensaje.textContent = '';
    const authToken = sessionStorage.getItem('access_token');

    const paciente_id = document.getElementById('paciente').value;
    const medico_id = document.getElementById('medico').value;
    const fecha_hora = document.getElementById('fecha_hora').value;
    const motivo = document.getElementById('motivo').value;

    try {
        const respuesta = await fetch(`${API_URL}/citas/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                paciente_id,
                medico_id,
                fecha_hora: new Date(fecha_hora).toISOString(),
                motivo
            })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            mensaje.textContent = 'Error: ' + (datos.detail || 'No se pudo crear la cita');
            mensaje.style.color = '#d9534f';
            return;
        }

        mensaje.textContent = 'Cita creada exitosamente';
        mensaje.style.color = '#5cb85c';
        document.getElementById('form-cita').reset();

    } catch (error) {
        mensaje.textContent = 'Error de conexion con el servidor';
        mensaje.style.color = '#d9534f';
        console.error(error);
    }
});

document.addEventListener('DOMContentLoaded', cargarListas);
