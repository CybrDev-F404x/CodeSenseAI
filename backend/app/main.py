import os

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import engine, Base
from app import models  # noqa: F401 – asegura que todos los modelos esten registrados 
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.audits import router as audits_router
from app.api.reports import router as reports_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup ---
    # Crea todas las tablas que no existen (conveniencia de desarrollo).
    # En produccion, confia exclusivamente en las migraciones de Alembic.
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # --- Shutdown ---
    await engine.dispose()


app = FastAPI(
    title="CodeSense AI API",
    description="Plataforma inteligente de auditoria de codigo enfocada en Python y C#",
    version="1.0.0",
    lifespan=lifespan,
)

# Configuracion de CORS
# Esto evita que el navegador bloquee las peticiones desde Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "message": "Welcome to CodeSense AI API",
        "status": "active",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
    }


@app.get("/health")
async def health_check():
    return {"status": "ok"}


# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(audits_router, prefix="/api")
app.include_router(reports_router, prefix="/api")
