from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# --- Password hashing --- #
# configurada con el algoritmo bcrypt y deprecated="auto" para que use la version mas reciente
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str: # Declaracion de funcion que recibe un string y devuelve un string
    """Devuelve el hash bcrypt de la contraseña en texto plano"""
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool: # Declaracion de funcion que recibe dos strings y devuelve un booleano
    """Verifica si la contraseña en texto plano coincide con el hash almacenado"""
    return pwd_context.verify(plain, hashed)


# --- JWT --- #
def create_access_token(subject: Any, expires_delta: timedelta | None = None) -> str: # subject es el id del usuario, expires_delta es el tiempo de expiracion
    """Crea un JWT firmado con subject como el claim sub"""
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload = {"sub": str(subject), "exp": expire} # payload es un diccionario que contiene el id del usuario y el tiempo de expiracion
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM) # encode codifica el payload con la clave secreta y el algoritmo


def decode_access_token(token: str) -> str | None: # token es el JWT firmado
    """Decodifica el token y devuelve el claim sub, o None si es invalido"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]) # decode decodifica el token con la clave secreta y el algoritmo
        return payload.get("sub") # get devuelve el claim sub
    except JWTError: # Si el token es invalido, devuelve None
        return None
