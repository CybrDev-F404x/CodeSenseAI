<%doc>
Este es el plano o plantilla que define la estructura que tendrán todos los archivos de migracion.
Su funcion es automatizar la creacion del codigo repetitivo (boilerplate).
</%doc>

"""${message}   ## Mensaje que se le pasa a la funcion alembic

Revision ID: ${up_revision}     ## ID de la revision
Revises: ${down_revision | comma,n}     ## Revision anterior
Create Date: ${create_date}     ## Fecha de creacion

"""
from typing import Sequence, Union  ## Importamos Sequence y Union

from alembic import op  ## Importamos op
import sqlalchemy as sa  ## Importamos sqlalchemy
${imports if imports else ""}  ## Importamos lo que sea necesario

## revision identifiers, used by Alembic.
revision: str = ${repr(up_revision)}  ## ID de la revision
down_revision: Union[str, Sequence[str], None] = ${repr(down_revision)}  ## Revision anterior
branch_labels: Union[str, Sequence[str], None] = ${repr(branch_labels)}  ## Etiquetas de la revision
depends_on: Union[str, Sequence[str], None] = ${repr(depends_on)}  ## Dependencias de la revision


def upgrade() -> None:  ## Funcion que se ejecuta cuando se aplica la migracion
    """Upgrade schema."""  ## Descripcion de la migracion
    ${upgrades if upgrades else "pass"}  ## Codigo que se ejecuta


def downgrade() -> None:  ## Funcion que se ejecuta cuando se revierte la migracion
    """Downgrade schema."""  ## Descripcion de la migracion
    ${downgrades if downgrades else "pass"}  ## Codigo que se ejecuta
