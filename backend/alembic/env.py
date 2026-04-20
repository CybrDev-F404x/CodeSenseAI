"""
se encarga de conectar Alembic con los modelos de Python y con la base de datos real. 
Su trabajo es leer que tablas se han definido en el codigo (usando Base.metadata) 
y compararlas con lo que hay en la base de datos para decidir que cambios (migraciones) debe aplicar
"""

from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

from alembic import context

# Objeto de configuracion de Alembic
config = context.config

# Configuracion de logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Importar settings y todos los modelos para que Alembic pueda detectarlos
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.config import settings
from app.core.database import Base  # noqa: F401
import app.models  # noqa: F401 – registra todos los modelos

"""
Base.metadata es como un catálogo donde SQLAlchemy 
guarda la estructura de todas las clases que heredan de Base
"""
target_metadata = Base.metadata

# Construir una URL sync psycopg2 desde la URL async asyncpg
# Reemplazar: postgresql+asyncpg://... -> postgresql+psycopg2://...
# Esto evita problemas de SSL en Windows que asyncpg tiene con Docker local
_raw_url = settings.DATABASE_URL
_sync_url = (
    _raw_url
    .replace("postgresql+asyncpg://", "postgresql+psycopg2://")
    .split("?")[0] # strip query params (e.g. ?ssl=disable) not needed for psycopg2
)

config.set_main_option("sqlalchemy.url", _sync_url)


def run_migrations_offline() -> None:
    """Ejecuta las migraciones en modo 'offline'"""
    url = config.get_main_option("sqlalchemy.url") # Extrae la direccion de la DB
    context.configure(
        url=url, # Le dice a Alembic donde esta la DB
        target_metadata=target_metadata, # Le dice a Alembic que tablas debe crear
        literal_binds=True, # Usa valores literales en lugar de placeholders
        dialect_opts={"paramstyle": "named"}, # Usa named placeholders
        compare_type=True, # Compara tipos de datos
    )
    with context.begin_transaction(): # Inicia una transaccion
        context.run_migrations() # Ejecuta las migraciones


def run_migrations_online() -> None:
    """Ejecuta las migraciones en modo 'online'"""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}), # Obtiene la configuracion de la DB
        prefix="sqlalchemy.", # Prefijo de las variables de entorno
        poolclass=pool.NullPool, # Clase de pool de conexiones
    )

    with connectable.connect() as connection: # Inicia una transaccion
        context.configure(
            connection=connection, # Conexion a la base de datos
            target_metadata=target_metadata, # Le dice a Alembic que tablas debe crear
            compare_type=True, # Compara tipos de datos
        )
        with context.begin_transaction(): # Inicia una transaccion
            context.run_migrations() # Ejecuta las migraciones


if context.is_offline_mode(): # Verifica si esta en modo offline
    run_migrations_offline() # Ejecuta las migraciones en modo offline
else:
    run_migrations_online() # Ejecuta las migraciones en modo online
