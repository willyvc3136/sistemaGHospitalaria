from pydantic import BaseModel
from typing import Optional
from uuid import UUID


class MedicoBase(BaseModel):
    """Campos comunes para crear o mostrar un medico."""
    especialidad: str
    colegiatura: str
    disponibilidad: Optional[list] = []


class MedicoCreate(MedicoBase):
    """Datos necesarios para registrar un nuevo medico."""
    usuario_id: UUID


class MedicoResponse(MedicoBase):
    """Datos que se retornan al consultar un medico."""
    id: int
    usuario_id: UUID

    class Config:
        from_attributes = True
