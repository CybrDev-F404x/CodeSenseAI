"""
app/api/audits.py

Orquesta el ciclo completo de auditoría de código:
1. Recibe el código y lenguaje del usuario autenticado.
2. Persiste el Audit con status=processing.
3. Llama al servicio LLM (Gemini) para análisis real.
4. Persiste el Report con los findings reales.
5. Actualiza el Audit a status=done (o failed si el LLM falla).

Multi-tenancy: get_current_user garantiza que cada usuario
acceda exclusivamente a sus propios registros.
"""

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
from app.services.llm import analyze_code, LLMError

router = APIRouter(prefix="/audits", tags=["Audits"])


# ─── POST /audits/ ────────────────────────────────────────────────────────────
@router.post("/", response_model=AuditRead, status_code=status.HTTP_201_CREATED)
async def create_audit(
    payload: AuditCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Crea una nueva auditoría y genera un reporte mediante IA (Gemini)."""

    # 1. Persistir el audit con status=processing
    audit = Audit(
        user_id=current_user.id,
        language=payload.language,
        code_snippet=payload.code_snippet,
        status=AuditStatusEnum.processing,
    )
    db.add(audit)
    await db.flush()  # obtiene el UUID sin cerrar la transacción

    # 2. Llamar al LLM
    try:
        findings = await analyze_code(
            language=payload.language.value,
            code_snippet=payload.code_snippet,
        )
    except LLMError as exc:
        # Marcar como fallido y propagar el error
        audit.status = AuditStatusEnum.failed
        await db.flush()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"El análisis de IA falló: {exc}",
        ) from exc

    # 3. Persistir el reporte con los findings reales
    report = Report(
        audit_id=audit.id,
        findings=findings,
        score=findings.get("score"),
    )
    db.add(report)

    # 4. Marcar el audit como completado
    audit.status = AuditStatusEnum.done
    await db.flush()
    await db.refresh(audit)
    return audit


# ─── GET /audits/ ─────────────────────────────────────────────────────────────
@router.get("/", response_model=list[AuditRead])
async def list_audits(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lista todas las auditorías del usuario autenticado."""
    result = await db.execute(
        select(Audit)
        .where(Audit.user_id == current_user.id)
        .order_by(Audit.created_at.desc())
    )
    return result.scalars().all()


# ─── GET /audits/{audit_id} ───────────────────────────────────────────────────
@router.get("/{audit_id}", response_model=AuditRead)
async def get_audit(
    audit_id: uuid_module.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Devuelve una auditoría específica (solo si pertenece al usuario)."""
    result = await db.execute(
        select(Audit).where(Audit.id == audit_id, Audit.user_id == current_user.id)
    )
    audit = result.scalar_one_or_none()
    if not audit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Auditoría no encontrada")
    return audit


# ─── DELETE /audits/{audit_id} ───────────────────────────────────────────────
@router.delete("/{audit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_audit(
    audit_id: uuid_module.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Elimina una auditoría y su reporte asociado (cascade)."""
    result = await db.execute(
        select(Audit).where(Audit.id == audit_id, Audit.user_id == current_user.id)
    )
    audit = result.scalar_one_or_none()
    if not audit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Auditoría no encontrada")
    await db.delete(audit)
