"""
Representa el resultado final del analisis de codigo generado por la IA.
1. Relacion 1:1: Cada reporte pertenece estrictamente a una sola auditoria.
2. Almacenamiento Flexible: Utiliza columnas especiales de PostgreSQL (JSONB) 
   para guardar diccionarios y listas anidadas con comentarios y sugerencias.
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Report(Base):
    __tablename__ = "reports" # Nombre de la tabla en la base de datos

    # Columnas
    # id: Columna UUID unica para cada reporte
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # audit_id: Columna audit_id para cada reporte
    audit_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("audits.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )
    
    # findings: Columna findings para cada reporte
    findings: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    # score: Columna score para cada reporte
    score: Mapped[float] = mapped_column(Float, nullable=True)

    # created_at: Columna created_at para cada reporte
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relaciones
    # audit: Relacion con la tabla Audit (uno a uno)
    audit: Mapped["Audit"] = relationship("Audit", back_populates="report")
