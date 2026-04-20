"""
Define la estructura para almacenar auditorias de codigo. 
Incluye:
1. Enums: Listas cerradas para 'Lenguajes' y 'Estados' (pendiente/fallido/terminado).
2. Modelo Audit: Guarda el fragmento de codigo y su estado actual.
3. Vinculo: Cada auditoria se asocia obligatoriamente a un usuario especifico.
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

# Lenguajes soportados
class LanguageEnum(str, enum.Enum): # Enum para lenguajes
    python = "python"
    csharp = "csharp"

# Estados de la auditoria
class AuditStatusEnum(str, enum.Enum): # Enum para estados
    pending = "pending"
    processing = "processing"
    done = "done"
    failed = "failed"

# Modelo de auditoria
class Audit(Base):
    __tablename__ = "audits" # Nombre de la tabla en la base de datos

    # Columnas

    # id: Columna UUID unica para cada auditoria
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # user_id: Columna user_id para cada auditoria
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    
    # language: Columna language para cada auditoria
    language: Mapped[LanguageEnum] = mapped_column(
        Enum(LanguageEnum), nullable=False
    )

    # code_snippet: Columna code_snippet para cada auditoria
    code_snippet: Mapped[str] = mapped_column(Text, nullable=False)
    
    # status: Columna status para cada auditoria
    status: Mapped[AuditStatusEnum] = mapped_column(
        Enum(AuditStatusEnum), default=AuditStatusEnum.pending, nullable=False
    )

    # created_at: Columna created_at para cada auditoria
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relaciones
    # user: Relacion con la tabla User (uno a muchos)
    user: Mapped["User"] = relationship("User", back_populates="audits")

    # report: Relacion con la tabla Report (uno a uno)
    report: Mapped["Report"] = relationship("Report", back_populates="audit", uselist=False, cascade="all, delete-orphan")
