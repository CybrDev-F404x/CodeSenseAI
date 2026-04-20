"""
Implementa `ReportRead` como el modelo de transferencia de datos (DTO) final 
encargado de serializar los resultados del analisis de IA. Su funcion principal 
es la normalizacion de metadatos complejos y la representacion de estructuras 
de datos dinamicas (como diccionarios de retroalimentacion tecnica) en un formato 
JSON consistente para el consumo del cliente.
"""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel

# Esquema para leer reportes
class ReportRead(BaseModel):
    id: uuid.UUID # ID del reporte
    audit_id: uuid.UUID # ID de la auditoria
    findings: dict[str, Any] # Hallazgos del reporte
    score: float | None # Puntuacion del reporte
    created_at: datetime # Fecha de creacion del reporte

    model_config = {"from_attributes": True} # Permite que el esquema se mapee a los atributos del modelo
