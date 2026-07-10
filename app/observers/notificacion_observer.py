from abc import ABC, abstractmethod
from datetime import datetime


class Observer(ABC):
    """
    Interfaz que deben implementar todos los observadores.
    Cada uno decide que hacer cuando ocurre un evento.
    """
    @abstractmethod
    def actualizar(self, evento: str, datos: dict):
        pass


class LogNotificacionObserver(Observer):
    """
    Observador simple: registra el evento en la tabla 'notificaciones'
    de Supabase (simulando el envio real de un email/SMS futuro).
    """
    def actualizar(self, evento: str, datos: dict):
        from app.core.database import get_db
        db = get_db()

        mensaje = self._construir_mensaje(evento, datos)

        db.table("notificaciones").insert({
            "evento": evento,
            "mensaje": mensaje,
            "paciente_id": datos.get("paciente_id"),
            "medico_id": datos.get("medico_id"),
            "leida": False
        }).execute()

    def _construir_mensaje(self, evento: str, datos: dict) -> str:
        if evento == "cita_creada":
            return f"Nueva cita programada para el {datos.get('fecha_hora')}. Motivo: {datos.get('motivo')}"
        return f"Evento: {evento}"


class ConsolaNotificacionObserver(Observer):
    """
    Observador simple para desarrollo: solo imprime en consola.
    Util para ver el evento en los logs de uvicorn sin tocar la base de datos.
    """
    def actualizar(self, evento: str, datos: dict):
        print(f"[NOTIFICACION] {datetime.now()} - Evento: {evento} - Datos: {datos}")


class Sujeto:
    """
    El 'Subject' del patron Observer: mantiene la lista de observadores
    y les avisa cuando ocurre un evento, sin saber que hace cada uno.
    """
    def __init__(self):
        self._observadores = []

    def suscribir(self, observador: Observer):
        self._observadores.append(observador)

    def notificar(self, evento: str, datos: dict):
        for observador in self._observadores:
            observador.actualizar(evento, datos)
