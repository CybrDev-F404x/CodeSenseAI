"""
Este codigo configura la conexion asincrona a la base de datos usando SQLAlchemy. 
Crea el "motor" que maneja las conexiones, define la clase base para los modelos (tablas)
"""

from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from .config import settings

# Motor de base de datos
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False, # Cambia a True para ver las consultas SQL y depurar
    pool_pre_ping=True, # Revisa la conexion antes de usarla    
)

# Factoria de sesiones
AsyncSessionLocal = async_sessionmaker(
    bind=engine, # Motor de base de datos
    class_=AsyncSession, # Clase de sesion
    expire_on_commit=False, # No expira la sesion al commit
)


# Crea una clase vacia de la cual heredaran todos los modelos
class Base(DeclarativeBase):
    pass


# Dependencia de FastAPI
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session: # Crea una sesion
        try:
            yield session # Cede el control a la ruta
            await session.commit() # Confirma la transaccion
            
        except Exception: # Si hay un error
            await session.rollback() # Revierte la transaccion
            raise # Lanza la excepcion
