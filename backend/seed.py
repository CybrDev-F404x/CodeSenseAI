"""
seed.py – Inserta datos simulados en la base de datos para demostracion.

Uso:
    cd backend
    .venv\\Scripts\\activate      (Windows)
    python seed.py
"""
import asyncio
import uuid
import random
import sys
import os

# Asegura que el modulo app sea encontrado
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy import select

from app.core.config import settings
from app.core.security import hash_password
from app.models.user import User
from app.models.audit import Audit, AuditStatusEnum, LanguageEnum
from app.models.report import Report
from app import models  # noqa: F401 – registra todos los modelos


# ─── Datos de demostracion ────────────────────────────────────────────────────

DEMO_EMAIL = "demo@codesense.ai"
DEMO_PASSWORD = "demo1234"
DEMO_FULL_NAME = "Usuario Demo"

SNIPPETS = [
    {
        "language": LanguageEnum.python,
        "code": (
            "import os\n"
            "user_input = input('Enter expression: ')\n"
            "result = eval(user_input)  # vulnerable\n"
            "print(result)\n"
        ),
        "status": AuditStatusEnum.done,
    },
    {
        "language": LanguageEnum.python,
        "code": (
            "def fibonacci(n):\n"
            "    if n <= 1:\n"
            "        return n\n"
            "    return fibonacci(n-1) + fibonacci(n-2)\n"
            "\n"
            "print(fibonacci(10))\n"
        ),
        "status": AuditStatusEnum.done,
    },
    {
        "language": LanguageEnum.csharp,
        "code": (
            "using System;\n"
            "class Program {\n"
            "    static void Main() {\n"
            "        string[] items = new string[5];\n"
            "        Console.WriteLine(items[10]); // index out of bounds\n"
            "    }\n"
            "}\n"
        ),
        "status": AuditStatusEnum.done,
    },
    {
        "language": LanguageEnum.python,
        "code": (
            "import sqlite3\n"
            "def get_user(username):\n"
            "    conn = sqlite3.connect('db.sqlite3')\n"
            "    cur = conn.cursor()\n"
            "    cur.execute(f\"SELECT * FROM users WHERE name='{username}'\")\n"
            "    return cur.fetchone()\n"
        ),
        "status": AuditStatusEnum.done,
    },
    {
        "language": LanguageEnum.csharp,
        "code": (
            "public class Calculator {\n"
            "    public int Add(int a, int b) => a + b;\n"
            "    public int Subtract(int a, int b) => a - b;\n"
            "    public double Divide(int a, int b) => a / b; // posible div/0\n"
            "}\n"
        ),
        "status": AuditStatusEnum.done,
    },
]

FINDINGS_TEMPLATES = [
    {
        "issues": [
            {"type": "security", "severity": "high", "line": 3, "message": "eval() permite ejecución arbitraria de código. Usar ast.literal_eval()."},
            {"type": "style", "severity": "low", "line": 1, "message": "Import no utilizado: os."},
        ],
        "summary": "2 problemas encontrados: 1 crítico, 1 bajo.",
    },
    {
        "issues": [
            {"type": "performance", "severity": "medium", "line": 4, "message": "Recursión exponencial O(2^n). Usar memoización o iteración."},
        ],
        "summary": "1 problema encontrado: 1 medio.",
    },
    {
        "issues": [
            {"type": "runtime", "severity": "high", "line": 5, "message": "Acceso fuera de límites en el arreglo. Verificar índice antes de acceder."},
        ],
        "summary": "1 problema encontrado: 1 crítico.",
    },
    {
        "issues": [
            {"type": "security", "severity": "high", "line": 5, "message": "Inyección SQL detectada. Usar parámetros preparados con '?'."},
            {"type": "style", "severity": "low", "line": 3, "message": "Conexión no cerrada correctamente. Usar context manager (with)."},
        ],
        "summary": "2 problemas encontrados: 1 crítico, 1 bajo.",
    },
    {
        "issues": [
            {"type": "runtime", "severity": "medium", "line": 4, "message": "División entera cuando b=0 lanza DivideByZeroException."},
            {"type": "style", "severity": "low", "line": 1, "message": "Clase sin documentación XML."},
        ],
        "summary": "2 problemas encontrados: 1 medio, 1 bajo.",
    },
]

SCORES = [5.2, 7.8, 6.0, 4.5, 8.3]


# ─── Logica principal ─────────────────────────────────────────────────────────

async def seed():
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    SessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    async with SessionLocal() as db:
        # Verificar si el usuario demo ya existe
        result = await db.execute(select(User).where(User.email == DEMO_EMAIL))
        existing = result.scalar_one_or_none()

        if existing:
            print(f"⚠️  El usuario '{DEMO_EMAIL}' ya existe. Se omite la creación.")
            user = existing
        else:
            user = User(
                email=DEMO_EMAIL,
                full_name=DEMO_FULL_NAME,
                hashed_password=hash_password(DEMO_PASSWORD),
                is_active=True,
            )
            db.add(user)
            await db.flush()
            print(f"✅  Usuario creado: {DEMO_EMAIL} (password: {DEMO_PASSWORD})")

        # Insertar auditorías y reportes
        for i, snippet_data in enumerate(SNIPPETS):
            audit = Audit(
                user_id=user.id,
                language=snippet_data["language"],
                code_snippet=snippet_data["code"],
                status=snippet_data["status"],
            )
            db.add(audit)
            await db.flush()

            report = Report(
                audit_id=audit.id,
                findings=FINDINGS_TEMPLATES[i],
                score=SCORES[i],
            )
            db.add(report)
            await db.flush()

            print(f"  📋  Auditoría #{i+1} ({snippet_data['language'].value}) → score {SCORES[i]}")

        await db.commit()
        print("\n🎉  Seed completado exitosamente.")
        print(f"   → Login: {DEMO_EMAIL} / {DEMO_PASSWORD}")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
