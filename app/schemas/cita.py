from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID


class CitaBase(BaseModel):
    """Campos comunes para crear o mostrar una cita."""
    fecha_hora: datetime
    motivo: Optional[str] = None


class CitaCreate(CitaBase):
    """Datos necesarios para crear una nueva cita."""
    paciente_id: UUID
    medico_id: UUID


class CitaResponse(CitaBase):
    """Datos que se retornan al consultar una cita."""
    id: int
    estado: str
    creado_por: UUID
    paciente_id: UUID
    medico_id: UUID

    class Config:
        from_attributes = True
