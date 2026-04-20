"""Migracion inicial: crea las tablas users, audits y reports.

Revision ID: c1da80205aa8

Importa las herramientas de Alembic y SQLAlchemy, 
y define los identificadores que Alembic usa para rastrear el historial de migraciones
"""
from typing import Sequence, Union

# Importaciones necesarias de SQLAlchemy y Alembic
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op


# Identificadores de revision que Alembic usa para rastrear el historial de migraciones
revision: str = 'c1da80205aa8'
down_revision: Union[str, Sequence[str], None] = None   # No hay migracion anterior (es la inicial)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── users ────────────────────────────────────────────────────────────────
    # Crea la tabla de usuarios con sus campos: id, email, nombre, contrasena,
    # estado activo y fecha de creacion. El email debe ser unico
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("full_name", sa.String(255), nullable=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    # Crea un indice sobre el campo email para acelerar las busquedas por correo
    op.create_index("ix_users_email", "users", ["email"])

    # ── audits ───────────────────────────────────────────────────────────────
    # Define los tipos enumerados que representan el lenguaje de codigo y el estado de la auditoria
    language_enum = postgresql.ENUM("python", "csharp", name="languageenum", create_type=True)
    status_enum = postgresql.ENUM(
        "pending", "processing", "done", "failed",
        name="auditstatusenum",
        create_type=True,
    )

    # Crea la tabla de auditorias vinculada a un usuario. Almacena el fragmento
    # de codigo analizado, el lenguaje, el estado del proceso y la fecha de creacion.
    op.create_table(
        "audits",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),  # Si el usuario se borra, se borran sus auditorias
            nullable=False,
        ),
        # sa.Enum se encargara de crear el tipo automaticamente al crear la tabla
        sa.Column("language", sa.Enum("python", "csharp", name="languageenum"), nullable=False),
        sa.Column("code_snippet", sa.Text(), nullable=False),  # Fragmento de codigo enviado para analizar
        sa.Column(
            "status",
            sa.Enum("pending", "processing", "done", "failed", name="auditstatusenum"),
            nullable=False,
            server_default="pending",  # Por defecto toda auditoria inicia en estado "pendiente"
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    # Crea un indice sobre user_id para acelerar las consultas de auditorias por usuario
    op.create_index("ix_audits_user_id", "audits", ["user_id"])

    # ── reports ──────────────────────────────────────────────────────────────
    # Crea la tabla de reportes vinculada a una auditoria (relacion 1 a 1).
    # Guarda los hallazgos del analisis en formato JSON y una puntuacion opcional.
    op.create_table(
        "reports",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "audit_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("audits.id", ondelete="CASCADE"),  # Si la auditoria se borra, se borra su reporte
            nullable=False,
            unique=True,  # Cada auditoria solo puede tener un reporte
        ),
        sa.Column("findings", postgresql.JSONB(), nullable=False, server_default="{}"),  # Resultados del analisis
        sa.Column("score", sa.Float(), nullable=True),  # Puntuacion de calidad del codigo (puede ser nula)
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    # Crea un indice sobre audit_id para acelerar las busquedas de reportes por auditoria
    op.create_index("ix_reports_audit_id", "reports", ["audit_id"])


def downgrade() -> None:
    # Revierte la migracion eliminando las tablas en orden inverso para respetar las claves foraneas
    op.drop_table("reports")
    op.drop_table("audits")
    op.drop_table("users")

    # Elimina los tipos enumerados personalizados de PostgreSQL si existen
    sa.Enum(name="auditstatusenum").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="languageenum").drop(op.get_bind(), checkfirst=True)
