"""
Este modulo gestiona la recuperacion de resultados y el historial de analisis:
1. Consulta Individual: Recupera las calificaciones y comentarios detallados de un 
   analisis de codigo especifico mediante su ID.
2. Historial de Usuario: Proporciona una vista consolidada de todas las auditorias 
   realizadas por el usuario autenticado.
   
Seguridad y Rendimiento: Utiliza operaciones de union (JOINs) a nivel de base de 
datos para validar que el usuario tenga permisos sobre el registro solicitado 
en una sola transaccion eficiente.
"""

import uuid as uuid_module

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.audit import Audit
from app.models.report import Report
from app.schemas.report import ReportRead

# --- Router para el manejo de rutas de reportes ---
router = APIRouter(prefix="/reports", tags=["Reports"])

# --- GET /reports/audit/{audit_id} ---
@router.get("/audit/{audit_id}", response_model=ReportRead)
async def get_report_by_audit( # audit_id es el ID de la auditoria
    audit_id: uuid_module.UUID, # audit_id es el ID de la auditoria
    db: AsyncSession = Depends(get_db), # db es la sesion de la base de datos
    current_user: User = Depends(get_current_user), # current_user es el usuario autenticado
):
    """Devuelve el reporte de una auditoria (verifica que pertenezca al usuario)."""
    # Verifica que la auditoria pertenezca al usuario
    audit_result = await db.execute(
        select(Audit).where(Audit.id == audit_id, Audit.user_id == current_user.id) # Selecciona la auditoria y filtra por el usuario autenticado
    )
    if not audit_result.scalar_one_or_none(): # Si la auditoria no existe, lanza una excepcion
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Auditoria no encontrada")

    result = await db.execute(
        select(Report).where(Report.audit_id == audit_id) # Selecciona el reporte y filtra por el ID de la auditoria
    )
    report = result.scalar_one_or_none() # Obtiene el reporte
    if not report: # Si el reporte no existe, lanza una excepcion
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reporte no encontrado")
    return report # Devuelve el reporte


# --- GET /reports/ ---
@router.get("/", response_model=list[ReportRead])
async def list_reports(
    db: AsyncSession = Depends(get_db), # db es la sesion de la base de datos
    current_user: User = Depends(get_current_user), # current_user es el usuario autenticado
):
    """Lista todos los reportes del usuario autenticado."""
    result = await db.execute(
        select(Report) # Selecciona el reporte
        .join(Audit, Report.audit_id == Audit.id) # Une el reporte con la auditoria
        .where(Audit.user_id == current_user.id) # Filtra por el usuario autenticado
        .order_by(Report.created_at.desc()) # Ordena por fecha de creacion descendente
    )
    return result.scalars().all() # Devuelve todos los reportes del usuario autenticado
