"""
Este modulo centraliza las operaciones CRUD para la cuenta del usuario autenticado:
1. Consulta de Perfil (GET): Recupera la información detallada del usuario actual.
2. Actualización de Datos (PUT): Permite la modificación de campos sensibles
   (nombre, email, contraseña) con validación previa.

Seguridad: Ambas rutas implementan la dependencia 'get_current_user', garantizando
que solo el propietario de la cuenta pueda acceder o modificar su informacion
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import hash_password
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.user import UserRead, UserUpdate

# --- Router para el manejo de rutas de usuarios ---
router = APIRouter(prefix="/users", tags=["Users"])


# --- GET /users/me ---
@router.get("/me", response_model=UserRead) 
async def get_me(current_user: User = Depends(get_current_user)): # current_user es el usuario autenticado
    """Devuelve el perfil del usuario autenticado"""
    return current_user


# --- PUT /users/me ---
@router.put("/me", response_model=UserRead) 
async def update_me( 
    payload: UserUpdate, # payload es el cuerpo de la peticion
    db: AsyncSession = Depends(get_db), # db es la sesion de la base de datos
    current_user: User = Depends(get_current_user), # current_user es el usuario autenticado
):
    """Actualiza el perfil del usuario autenticado"""
    if payload.full_name is not None: # Si el nombre completo no es nulo, se actualiza
        current_user.full_name = payload.full_name

    if payload.email is not None: # Si el email no es nulo, se actualiza
        current_user.email = payload.email
        
    if payload.password is not None: # Si la contraseña no es nula, se actualiza
        current_user.hashed_password = hash_password(payload.password)

    db.add(current_user) # Agrega el usuario a la sesion
    await db.flush() # Obtiene el UUID generado sin cerrar la transaccion
    await db.refresh(current_user) # Refresca el usuario para obtener el UUID
    return current_user # Devuelve el usuario actualizado
