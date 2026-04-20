"""add_preferences_to_users

Revision ID: f3a1b2c4d5e6
Revises: e6e0306dc02b
Create Date: 2026-04-13 17:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision: str = 'f3a1b2c4d5e6'
down_revision: Union[str, Sequence[str], None] = 'e6e0306dc02b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Añade la columna preferences (JSONB) a la tabla users."""
    op.add_column(
        'users',
        sa.Column(
            'preferences',
            JSONB,
            nullable=True,
            server_default=sa.text(
                """'{"theme": "indigo", "notifications": {"email": true, "app": true}}'::jsonb"""
            ),
        ),
    )


def downgrade() -> None:
    """Elimina la columna preferences de la tabla users."""
    op.drop_column('users', 'preferences')
