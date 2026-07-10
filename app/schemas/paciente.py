from pydantic import BaseModel
from datetime import date
from typing import Optional
from uuid import UUID


class PacienteBase(BaseModel):
    """Campos comunes para crear o mostrar un paciente."""
    fecha_nacimiento: date
    telefono: Optional[str] = None
    historial_clinico_nro: Optional[str] = None


class PacienteCreate(PacienteBase):
    """Datos necesarios para registrar un nuevo paciente."""
    usuario_id: UUID


class PacienteResponse(PacienteBase):
    """Datos que se retornan al consultar un paciente."""
    id: int
    usuario_id: UUID

    class Config:
        from_attributes = True
