import uuid

from fastapi import Depends, HTTPException, status 
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User

# --- Esquema de autenticacion para obtener el token --- #
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# --- Dependencia para obtener el usuario actual --- #
async def get_current_user(
    token: str = Depends(oauth2_scheme), # Obtiene el token de la cabecera Authorization
    db: AsyncSession = Depends(get_db), # Obtiene la sesion de la base de datos
) -> User:
    """Dependencia de FastAPI: valida el JWT y devuelve el usuario autenticado"""
    credentials_exception = HTTPException( # Excepcion que se lanza si las credenciales no son validas
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"}, # Cabecera que indica el tipo de autenticacion
    )

    # --- Validacion del token usando security.py --- #
    user_id = decode_access_token(token) # Decodifica el token para obtener el ID del usuario
    if user_id is None: # Si el token no es valido, se lanza la excepcion
        raise credentials_exception

    try:
        uid = uuid.UUID(user_id) # Convierte el ID del usuario a UUID
    except ValueError: # Si el ID del usuario no es valido, se lanza la excepcion
        raise credentials_exception

    # --- Consulta para obtener el usuario de la base de datos --- #
    result = await db.execute(select(User).where(User.id == uid)) # Ejecuta la consulta para obtener el usuario
    user = result.scalar_one_or_none() # Obtiene el usuario 

    if user is None or not user.is_active: # Si el usuario no existe o no esta activo, se lanza la excepcion
        raise credentials_exception

    return user # Devuelve el usuario autenticado
