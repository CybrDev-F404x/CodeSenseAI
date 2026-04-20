"""add_preferences_to_users

Revision ID: f3a1b2c4d5e6
Revises: e6e0306dc02b

Importa Alembic, SQLAlchemy y el tipo JSONB de PostgreSQL. 
Define que esta migracion va despues de la migracion inicial

"""
from typing import Sequence, Union

# Importaciones de Alembic y SQLAlchemy necesarias para la migracion
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB  # Tipo nativo de PostgreSQL para almacenar JSON


# Identificadores de revision: esta migracion se aplica despues de la migracion inicial
revision: str = 'f3a1b2c4d5e6'
down_revision: Union[str, Sequence[str], None] = 'c1da80205aa8'  # Depende de la migracion inicial
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Agrega la columna 'preferences' a la tabla users
    # Permite almacenar preferencias del usuario en formato JSON (tema e notificaciones)
    # Es opcional (nullable) y tiene un valor por defecto con tema "indigo" y notificaciones activas
    op.add_column(
        'users',
        sa.Column(
            'preferences',
            JSONB,
            nullable=True,  # El campo es opcional, no todos los usuarios necesitan tenerlo
            server_default=sa.text(
                """'{"theme": "indigo", "notifications": {"email": true, "app": true}}'::jsonb"""
            ),  # Valor por defecto: tema indigo con notificaciones de email y app activadas
        ),
    )


def downgrade() -> None:
    # Revierte la migracion eliminando la columna 'preferences' de la tabla users
    op.drop_column('users', 'preferences')
