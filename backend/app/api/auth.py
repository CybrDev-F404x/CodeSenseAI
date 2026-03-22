"""
Este archivo centraliza la logica de acceso a la API mediante dos flujos:
1. Registro (/register): Valida la disponibilidad del email, aplica hash de 
   seguridad a la contraseña y persiste el nuevo perfil en la base de datos.
2. Login (/login): Autentica las credenciales del usuario y, tras la 
   validacion exitosa, emite un token JWT firmado para sesiones seguidas
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.schemas.user import UserCreate, UserRead

# --- Router para el manejo de rutas de autenticacion --- #
router = APIRouter(prefix="/auth", tags=["Auth"])


# --- Registro --- #
@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED) # UserRead elimina la contraseña antes de enviarla por internet
async def register(payload: UserCreate, db: AsyncSession = Depends(get_db)): # payload es el cuerpo de la peticion, db es la sesion de la base de datos
    """Crea una nueva cuenta de usuario"""
    # Verifica si el email ya esta registrado 
    result = await db.execute(select(User).where(User.email == payload.email)) # Ejecuta la consulta para obtener el usuario
    if result.scalar_one_or_none(): # Si el usuario existe, lanza una excepcion
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email ya registrado",
        )
    
    # Crea el usuario con el hash de la contraseña
    user = User(
        email=payload.email, # Email del usuario
        hashed_password=hash_password(payload.password), # Aplica hash a la contraseña
    )
    db.add(user) # Agrega el usuario a la sesion
    await db.flush()   # Obtiene el UUID generado sin cerrar la transaccion
    await db.refresh(user) # Refresca el usuario para obtener el UUID
    return user # Devuelve el usuario creado


# --- Login --- #
@router.post("/login")
async def login(
    form: OAuth2PasswordRequestForm = Depends(), # form es el cuerpo de la peticion, db es la sesion de la base de datos
    db: AsyncSession = Depends(get_db),
):
    """Autentica y devuelve un token JWT"""
    result = await db.execute(select(User).where(User.email == form.username)) # Ejecuta la consulta para obtener el usuario
    user = result.scalar_one_or_none() # Obtiene el usuario

    # Verifica si el usuario existe y si la contraseña es correcta
    if not user or not verify_password(form.password, user.hashed_password): # Si el usuario no existe o la contraseña es incorrecta, lanza una excepcion
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verifica si el usuario esta activo
    if not user.is_active: # Si el usuario no esta activo, lanza una excepcion
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo",
        )

    # Crea el token JWT
    token = create_access_token(subject=user.id) # Crea el token JWT
    return {"access_token": token, "token_type": "bearer"} # Devuelve el token JWT
