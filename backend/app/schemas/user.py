"""
Utiliza Pydantic para aplicar reglas de integridad y asegurar la segregacion de 
campos segun el contexto operacional (Creacion, Actualizacion, Lectura y Login).
Este diseno garantiza la seguridad de la informacion sensible al omitir campos 
criticos (como hashes de contraseñas) en las respuestas salientes hacia el cliente
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr

# Esquema base para usuarios
class UserBase(BaseModel):
    email: EmailStr # Correo electronico del usuario

# Esquema para crear usuarios
class UserCreate(UserBase):
    full_name: str | None = None # Nombre completo del usuario (opcional)
    password: str # Contraseña del usuario

# Esquema para iniciar sesion
class UserLogin(UserBase):
    password: str # Contraseña del usuario

# Esquema para actualizar usuarios
class UserUpdate(BaseModel):
    full_name: str | None = None # Nombre completo del usuario (opcional)
    email: EmailStr | None = None # Correo electronico del usuario (opcional)
    password: str | None = None # Contraseña del usuario (opcional)

# Esquema para leer usuarios
class UserRead(UserBase):
    id: uuid.UUID # ID del usuario
    full_name: str | None # Nombre completo del usuario
    is_active: bool # Estado del usuario
    created_at: datetime # Fecha de creacion del usuario

    model_config = {"from_attributes": True} # Permite que el esquema se mapee a los atributos del modelo
