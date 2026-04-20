"""
Implementa la segregacion de esquemas mediante:
- `AuditCreate`: Modelo de entrada estricto que valida los parametros 
  requeridos (lenguaje y fragmento de codigo) para iniciar el analisis.
  
- `AuditRead`: Modelo de salida que extiende la informacion procesada, 
  incorporando metadatos del sistema como identificadores unicos (ID) 
  y estados de ejecucion (status)
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from ..models.audit import AuditStatusEnum, LanguageEnum

# Esquema para crear auditorias
class AuditCreate(BaseModel):
    language: LanguageEnum # Lenguaje de programacion
    code_snippet: str = Field(..., max_length=5000, description="Fragmento de codigo a analizar") # Fragmento de codigo a analizar

# Esquema para leer auditorias
class AuditRead(BaseModel):
    id: uuid.UUID # ID de la auditoria
    user_id: uuid.UUID # ID del usuario
    language: LanguageEnum # Lenguaje de programacion
    code_snippet: str # Fragmento de codigo
    status: AuditStatusEnum # Estado de la auditoria
    created_at: datetime # Fecha de creacion de la auditoria

    model_config = {"from_attributes": True} # Permite que el esquema se mapee a los atributos del modelo
