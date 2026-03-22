"""
Este router administra el ciclo de vida completo de los analisis de codigo:
1. Orquestacion de Auditorias: Recibe, almacena y recupera los envios del usuario.
2. Aislamiento de Datos (Multi-tenancy): Garantiza mediante 'get_current_user' 
   que cada usuario acceda exclusivamente a sus propios reportes.
3. Capa de Simulacion (Mocking): Implementa una generacion de resultados 
   predefinidos, facilitando el desarrollo del frontend y las pruebas 
   antes de la integracion final con el motor de IA
"""

import random
import uuid as uuid_module

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.audit import Audit, AuditStatusEnum
from app.models.report import Report
from app.schemas.audit import AuditCreate, AuditRead

# --- Router para el manejo de rutas de auditorias ---
router = APIRouter(prefix="/audits", tags=["Audits"])

# --- Generacion de reportes simulados --- #
def _simulate_report(audit_id: uuid_module.UUID) -> Report:
    """Genera un reporte simulado con findings estaticos para demostracion"""
    findings = {
        "issues": [
            {
                "type": "security",
                "severity": "high",
                "line": random.randint(1, 50),
                "message": "Uso de eval() detectado — riesgo de ejecucion arbitraria de codigo.",
            },
            {
                "type": "style",
                "severity": "low",
                "line": random.randint(51, 100),
                "message": "Nombre de variable no sigue convención snake_case.",
            },
            {
                "type": "performance",
                "severity": "medium",
                "line": random.randint(10, 40),
                "message": "Bucle anidado O(n²) — considere optimizar con un diccionario.",
            },
        ],
        "summary": "3 problemas encontrados: 1 critico, 1 medio, 1 bajo.",
    }
    score = round(random.uniform(4.5, 9.5), 2) # Genera un puntaje aleatorio entre 4.5 y 9.5
    return Report(audit_id=audit_id, findings=findings, score=score) # Devuelve el reporte simulado


# --- POST /audits/ ---
@router.post("/", response_model=AuditRead, status_code=status.HTTP_201_CREATED) # AuditRead elimina la contraseña antes de enviarla por internet
async def create_audit(
    payload: AuditCreate, # payload es el cuerpo de la peticion
    db: AsyncSession = Depends(get_db), # db es la sesion de la base de datos
    current_user: User = Depends(get_current_user), # current_user es el usuario autenticado
):
    """Crea una nueva auditoria y genera un reporte simulado"""
    audit = Audit(
        user_id=current_user.id, # ID del usuario
        language=payload.language, # Lenguaje del codigo
        code_snippet=payload.code_snippet, # Codigo a auditar
        status=AuditStatusEnum.done, # Estado de la auditoria
    )
    db.add(audit)
    await db.flush() # Obtiene el UUID asignado sin cerrar la transaccion

    report = _simulate_report(audit.id) # Genera el reporte simulado
    db.add(report) # Agrega el reporte a la sesion
    await db.flush() # Obtiene el UUID asignado sin cerrar la transaccion
    await db.refresh(audit) # Refresca la auditoria para obtener el UUID
    return audit


# --- GET /audits/ ---
@router.get("/", response_model=list[AuditRead]) # AuditRead elimina la contraseña antes de enviarla por internet
async def list_audits(
    db: AsyncSession = Depends(get_db), # db es la sesion de la base de datos
    current_user: User = Depends(get_current_user), # current_user es el usuario autenticado
):
    """Lista todas las auditorias del usuario autenticado"""
    result = await db.execute(
        select(Audit) # Selecciona la auditoria
        .where(Audit.user_id == current_user.id) # Filtra por el usuario autenticado
        .order_by(Audit.created_at.desc()) # Ordena por fecha de creacion descendente
    )
    return result.scalars().all() # Devuelve todas las auditorias del usuario autenticado


# --- GET /audits/{id} ---
@router.get("/{audit_id}", response_model=AuditRead) # AuditRead elimina la contraseña antes de enviarla por internet
async def get_audit(
    audit_id: uuid_module.UUID, # audit_id es el ID de la auditoria
    db: AsyncSession = Depends(get_db), # db es la sesion de la base de datos
    current_user: User = Depends(get_current_user), # current_user es el usuario autenticado
):
    """Devuelve una auditoria especifica (solo si pertenece al usuario)"""
    result = await db.execute(
        select(Audit).where(Audit.id == audit_id, Audit.user_id == current_user.id) # Selecciona la auditoria y filtra por el usuario autenticado
    )
    audit = result.scalar_one_or_none() # Obtiene la auditoria
    if not audit: # Si la auditoria no existe, lanza una excepcion
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Auditoria no encontrada")
    return audit


# --- DELETE /audits/{id} ---
@router.delete("/{audit_id}", status_code=status.HTTP_204_NO_CONTENT) # status_code=status.HTTP_204_NO_CONTENT indica que no se devuelve nada
async def delete_audit(
    audit_id: uuid_module.UUID, # audit_id es el ID de la auditoria
    db: AsyncSession = Depends(get_db), # db es la sesion de la base de datos
    current_user: User = Depends(get_current_user), # current_user es el usuario autenticado
):
    """Elimina una auditoria y su reporte asociado"""
    result = await db.execute(
        select(Audit).where(Audit.id == audit_id, Audit.user_id == current_user.id) # Selecciona la auditoria y filtra por el usuario autenticado
    )
    audit = result.scalar_one_or_none() # Obtiene la auditoria
    if not audit: # Si la auditoria no existe, lanza una excepcion
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Auditoria no encontrada")
    await db.delete(audit) # Elimina la auditoria
