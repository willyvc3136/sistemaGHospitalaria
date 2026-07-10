from fastapi import HTTPException
from app.repositories.cita_repository import CitaRepository
from app.repositories.paciente_repository import PacienteRepository
from app.repositories.medico_repository import MedicoRepository
from app.observers.notificacion_observer import Sujeto, LogNotificacionObserver, ConsolaNotificacionObserver


class CitaService:
    """
    Patron Facade: orquesta todo el proceso de negocio para gestionar citas,
    coordinando varios repositorios y aplicando reglas de validacion.
    Tambien actua como 'Subject' del patron Observer, notificando
    a los observadores registrados cuando ocurre un evento importante.
    """

    def __init__(self):
        self.cita_repo = CitaRepository()
        self.paciente_repo = PacienteRepository()
        self.medico_repo = MedicoRepository()

        # Configuracion del patron Observer: registramos los observadores
        # que queremos que reaccionen a los eventos de citas.
        self.notificador = Sujeto()
        self.notificador.suscribir(LogNotificacionObserver())
        self.notificador.suscribir(ConsolaNotificacionObserver())

    def crear_cita(self, paciente_id: str, medico_id: str, fecha_hora, motivo: str, creado_por: str):
        # Validar que el paciente existe
        paciente = self.paciente_repo.obtener_por_usuario_id(paciente_id)
        if not paciente:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")

        # Validar que el medico existe
        medico = self.medico_repo.obtener_por_usuario_id(medico_id)
        if not medico:
            raise HTTPException(status_code=404, detail="Medico no encontrado")

        # Crear la cita con estado inicial
        datos_cita = {
            "paciente_id": paciente_id,
            "medico_id": medico_id,
            "fecha_hora": fecha_hora.isoformat(),
            "motivo": motivo,
            "estado": "pendiente",
            "creado_por": creado_por
        }
        nueva_cita = self.cita_repo.crear(datos_cita)

        # Patron Observer: notificar a todos los observadores registrados
        self.notificador.notificar("cita_creada", {
            "cita_id": nueva_cita.get("id") if nueva_cita else None,
            "paciente_id": paciente_id,
            "medico_id": medico_id,
            "fecha_hora": fecha_hora.isoformat(),
            "motivo": motivo
        })

        return nueva_cita

    def listar_citas_de_paciente(self, paciente_id: str):
        return self.cita_repo.obtener_por_paciente(paciente_id)

    def listar_citas_de_medico(self, medico_id: str):
        return self.cita_repo.obtener_por_medico(medico_id)
