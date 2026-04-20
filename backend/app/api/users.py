"""
Este modulo centraliza las operaciones CRUD para la cuenta del usuario autenticado:
1. Consulta de Perfil (GET): Recupera la información detallada del usuario actual.
2. Actualización de Datos (PUT): Permite la modificación de campos sensibles
   (nombre, email, contraseña, preferences) con validación previa.
3. Eliminación de Cuenta (DELETE): Soft-delete — marca is_active=False sin borrar el registro.

Seguridad: Todas las rutas implementan la dependencia 'get_current_user', garantizando
que solo el propietario de la cuenta pueda acceder o modificar su informacion.
"""

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
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
async def get_me(current_user: User = Depends(get_current_user)):
    """Devuelve el perfil del usuario autenticado"""
    return current_user


# --- PUT /users/me ---
@router.put("/me", response_model=UserRead) 
async def update_me( 
    payload: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Actualiza el perfil del usuario autenticado (nombre, email, contraseña, preferences)"""

    if payload.full_name is not None:
        current_user.full_name = payload.full_name

    if payload.email is not None:
        current_user.email = payload.email
        
    if payload.password is not None:
        current_user.hashed_password = hash_password(payload.password)

    if payload.preferences is not None:
        # Merge con las preferences existentes para no borrar campos no enviados
        existing = current_user.preferences or {}
        current_user.preferences = {**existing, **payload.preferences}

    db.add(current_user)
    await db.flush()
    await db.refresh(current_user)
    return current_user


# --- DELETE /users/me ---
@router.delete("/me", status_code=200)
async def delete_me(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Soft-delete de la cuenta del usuario autenticado.
    No elimina el registro de la base de datos — solo pone is_active=False
    para preservar el historial de auditorías e integridad referencial.
    El JWT del cliente detectará 401 en la próxima petición autenticada.
    """
    current_user.is_active = False
    db.add(current_user)
    await db.flush()
    return JSONResponse(
        status_code=200,
        content={"message": "Cuenta desactivada correctamente. Todos tus datos han sido preservados."},
    )
