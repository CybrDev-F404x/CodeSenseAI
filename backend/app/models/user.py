
"""
MODELO DE USUARIO (users)

Este archivo define la estructura de la tabla 'users' en PostgreSQL. 
Aqui se dictan las columnas, tipos de datos (texto, fechas, booleanos), 
restricciones y la relacion directa con sus auditorias (tabla Audit)
"""

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users" # Nombre de la tabla en la base de datos

    # Columnas

    # id: Columna UUID unica para cada usuario
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    ) 
    # email: Columna email unica para cada usuario
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True) 

    # full_name: Columna full_name para cada usuario
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # hashed_password: Columna hashed_password para cada usuario
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False) 

    # is_active: Columna is_active para cada usuario
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False) 

    # created_at: Columna created_at para cada usuario
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    ) 

    # preferences: Columna JSONB para preferencias del usuario (tema, notificaciones)
    preferences: Mapped[dict[str, Any] | None] = mapped_column(
        JSONB,
        nullable=True,
        server_default='{"theme": "indigo", "notifications": {"email": true, "app": true}}',
    )

    # Relaciones
    # audits: Relacion con la tabla Audit
    audits: Mapped[list["Audit"]] = relationship("Audit", back_populates="user", cascade="all, delete-orphan")
