# CodeSense AI

> **Plataforma inteligente de auditoría de código** impulsada por Google Gemini.  
> Analiza fragmentos en **Python** y **C#**, detecta vulnerabilidades, deuda técnica y malas prácticas, y genera reportes detallados con un score de calidad del 0 al 10.

---

## Tabla de Contenidos

- [Descripción](#descripción)
- [Características](#características)
- [Stack Tecnológico](#stack-tecnológico)
- [Arquitectura del Proyecto](#arquitectura-del-proyecto)
- [Modelo de Base de Datos](#modelo-de-base-de-datos)
- [API Reference](#api-reference)
- [Instalación y Configuración](#instalación-y-configuración)
- [Variables de Entorno](#variables-de-entorno)
- [Migraciones](#migraciones)
- [Scripts Disponibles](#scripts-disponibles)
- [Autor](#autor)

---

## Descripción

CodeSense AI permite a desarrolladores y equipos de software **auditar fragmentos de código** de forma rápida e inteligente. El usuario pega su código, selecciona el lenguaje, y el motor de IA analiza y devuelve:

- Lista de **issues** clasificados por tipo (`security`, `performance`, `style`, `runtime`) y severidad (`high`, `medium`, `low`)
- Un **resumen** narrativo de los hallazgos
- Un **score de calidad** del 0.0 al 10.0

Todo el historial queda guardado en la cuenta del usuario con aislamiento total de datos entre cuentas.

---

## Características

### Backend
- ✅ API REST completamente **asíncrona** con FastAPI
- ✅ **Autenticación JWT** con tokens Bearer + hash bcrypt
- ✅ **Integración real con Google Gemini** vía LangChain
- ✅ **Reintentos automáticos** con backoff exponencial (Tenacity) ante errores de cuota
- ✅ **Multi-tenancy**: cada usuario accede exclusivamente a sus propios datos
- ✅ **Soft-delete de cuenta**: `is_active=False`, historial preservado
- ✅ **Preferencias de usuario** persistidas en BD (tema, notificaciones)
- ✅ Migraciones de base de datos con **Alembic**
- ✅ PostgreSQL 16 en **Docker**

### Frontend
- ✅ SPA en React 18 + TypeScript con Vite
- ✅ **Sistema de temas** con 5 paletas (Indigo, White, Crimson, Ink Black, Onyx), persistido en BD
- ✅ **10 páginas** completas conectadas a la API real
- ✅ **Exportación de auditorías a CSV** (BOM UTF-8)
- ✅ Filtros funcionales por lenguaje, estado y búsqueda libre
- ✅ Visualizador de código con **líneas problemáticas resaltadas**
- ✅ Health Score en círculo SVG animado
- ✅ Skeleton loaders y estados de carga en todas las páginas
- ✅ Notificaciones toast globales

---

## Stack Tecnológico

### Backend
| Tecnología | Descripción |
|---|---|
| **FastAPI** | Framework web asíncrono |
| **SQLAlchemy 2.0** | ORM async |
| **asyncpg** | Driver PostgreSQL async |
| **Alembic** | Migraciones de base de datos |
| **Pydantic v2** | Validación y serialización |
| **python-jose** | Generación/validación JWT |
| **passlib (bcrypt)** | Hash de contraseñas |
| **LangChain + Gemini** | Motor de análisis IA |
| **Tenacity** | Reintentos con backoff exponencial |
| **PostgreSQL 16** | Base de datos (Docker) |

### Frontend
| Tecnología | Descripción |
|---|---|
| **React 18 + TypeScript** | Framework UI |
| **Vite** | Bundler y dev server |
| **React Router v6** | Enrutamiento SPA |
| **Axios** | Cliente HTTP con interceptors |
| **Tailwind CSS** | Utilidades CSS |
| **react-hot-toast** | Notificaciones |
| **Google Material Symbols** | Iconografía |

---

## Arquitectura del Proyecto

```
CodeSenseAI/
├── backend/
│   ├── app/
│   │   ├── main.py              # Punto de entrada FastAPI
│   │   ├── core/
│   │   │   ├── config.py        # Settings desde .env (pydantic-settings)
│   │   │   ├── database.py      # Motor async + get_db()
│   │   │   └── security.py      # bcrypt + JWT
│   │   ├── models/
│   │   │   ├── user.py          # Tabla users
│   │   │   ├── audit.py         # Tabla audits + Enums
│   │   │   └── report.py        # Tabla reports
│   │   ├── schemas/
│   │   │   ├── user.py          # UserCreate / UserUpdate / UserRead
│   │   │   ├── audit.py         # AuditCreate / AuditRead
│   │   │   └── report.py        # ReportRead
│   │   ├── api/
│   │   │   ├── deps.py          # get_current_user (JWT → User)
│   │   │   ├── auth.py          # /auth/register + /auth/login
│   │   │   ├── users.py         # /users/me (GET, PUT, DELETE)
│   │   │   ├── audits.py        # CRUD de auditorías
│   │   │   └── reports.py       # Consulta de reportes
│   │   └── services/
│   │       └── llm.py           # Motor Gemini + prompt + parsing
│   ├── alembic/                 # Migraciones
│   ├── requirements.txt
│   ├── alembic.ini
│   └── .env                     # Variables de entorno (no commitear)
│
├── frontend/
│   └── src/
│       ├── App.tsx              # Rutas + AuthProvider + Toaster
│       ├── main.tsx             # Aplica tema guardado antes del render
│       ├── context/
│       │   └── AuthContext.tsx  # Estado global de sesión
│       ├── services/
│       │   └── api.ts           # Axios + interceptors + servicios tipados
│       ├── utils/
│       │   └── theme.ts         # 5 temas + applyTheme()
│       ├── components/
│       │   ├── DashboardLayout.tsx
│       │   ├── Sidebar.tsx
│       │   ├── ProtectedRoute.tsx
│       │   └── ui/              # Button, Card, Input
│       └── pages/               # 10 páginas
│
├── docker-compose.yml           # PostgreSQL 16
└── docs/                        # Roadmap + prototipos Stitch
```

---

## Modelo de Base de Datos

```
┌──────────────────────────────────┐
│             users                │
├──────────────────────────────────┤
│ id            UUID (PK)          │
│ email         VARCHAR(255) UNIQUE│
│ full_name     VARCHAR(255)       │
│ hashed_password VARCHAR(255)     │
│ is_active     BOOLEAN            │
│ preferences   JSONB              │
│ created_at    TIMESTAMPTZ        │
└───────────────┬──────────────────┘
                │ 1:N (cascade delete)
                ▼
┌──────────────────────────────────┐
│             audits               │
├──────────────────────────────────┤
│ id            UUID (PK)          │
│ user_id       UUID (FK → users)  │
│ language      ENUM (python|csharp│
│ code_snippet  TEXT               │
│ status        ENUM (pending|     │
│               processing|done|   │
│               failed)            │
│ created_at    TIMESTAMPTZ        │
└───────────────┬──────────────────┘
                │ 1:1 (cascade delete)
                ▼
┌──────────────────────────────────┐
│             reports              │
├──────────────────────────────────┤
│ id            UUID (PK)          │
│ audit_id      UUID (FK, UNIQUE)  │
│ findings      JSONB              │
│ score         FLOAT (0.0–10.0)   │
│ created_at    TIMESTAMPTZ        │
└──────────────────────────────────┘
```

El campo `findings` es un JSONB con la siguiente estructura:
```json
{
  "issues": [
    {
      "type": "security | performance | style | runtime",
      "severity": "high | medium | low",
      "line": 12,
      "message": "Descripción del problema en español"
    }
  ],
  "summary": "N problemas encontrados.",
  "score": 7.4
}
```

---

## API Reference

### Auth
| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/auth/register` | Registro de usuario |
| `POST` | `/auth/login` | Login → JWT Bearer token |

### Users *(requiere JWT)*
| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/users/me` | Perfil completo del usuario |
| `PUT` | `/users/me` | Actualizar nombre, email, password o preferencias |
| `DELETE` | `/users/me` | Soft-delete de la cuenta (`is_active=False`) |

### Audits *(requiere JWT)*
| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/audits/` | Crear auditoría → analizar con Gemini |
| `GET` | `/audits/` | Listar auditorías propias |
| `GET` | `/audits/{id}` | Detalle de una auditoría |
| `DELETE` | `/audits/{id}` | Eliminar auditoría y su reporte |

### Reports *(requiere JWT)*
| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/reports/` | Todos los reportes del usuario |
| `GET` | `/reports/audit/{id}` | Reporte de una auditoría específica |

### General
| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/` | Bienvenida + versión |
| `GET` | `/health` | Health check |

La documentación interactiva de la API está disponible en:
- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

---

## Instalación y Configuración

### Prerrequisitos
- [Python 3.12+](https://www.python.org/)
- [Node.js 18+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Cuenta en [Google AI Studio](https://aistudio.google.com/) para obtener la `GEMINI_API_KEY`

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/CodeSenseAI.git
cd CodeSenseAI
```

### 2. Levantar la base de datos con Docker

```bash
docker-compose up -d
```

Esto inicia PostgreSQL 16 en `localhost:5433` con la base de datos `codesenseai`.

### 3. Configurar el Backend

```bash
cd backend

# Crear entorno virtual
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Linux/Mac

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
copy .env.example .env
# Editar .env con tus valores (ver sección Variables de Entorno)
```

### 4. Ejecutar las migraciones

```bash
# Dentro de /backend con el .venv activo
alembic upgrade head
```

### 5. Iniciar el servidor de desarrollo

```bash
# Dentro de /backend
uvicorn app.main:app --reload
```

El backend estará disponible en `http://localhost:8000`.

### 6. Configurar e iniciar el Frontend

```bash
cd ../frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

El frontend estará disponible en `http://localhost:5173`.

---

## Variables de Entorno

Crea el archivo `backend/.env` con las siguientes variables:

```env
# ── Base de datos ─────────────────────────────────────────────────
# Asegúrate de que el puerto coincida con docker-compose.yml (5433)
DATABASE_URL=postgresql+asyncpg://codesense:codesense123@localhost:5433/codesenseai

# ── Seguridad JWT ─────────────────────────────────────────────────
SECRET_KEY=tu-clave-secreta
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# ── Integraciones LLM ─────────────────────────────────────────────
GEMINI_API_KEY=tu-api-key-de-google-ai-studio
OPENAI_API_KEY=                                  # Opcional, no implementado aún
```

> **Nota:** El archivo `.env` está incluido en `.gitignore` y nunca debe subirse al repositorio.

---

## Migraciones

El proyecto usa **Alembic** para gestionar la evolución del esquema de la base de datos.

```bash
# Aplicar todas las migraciones pendientes
alembic upgrade head

# Ver el historial de migraciones
alembic history

# Generar una nueva migración automáticamente (tras cambiar un modelo)
alembic revision --autogenerate -m "descripcion del cambio"

# Revertir la última migración
alembic downgrade -1
```

### Migraciones aplicadas

| Revisión | Fecha | Descripción |
|---|---|---|
| `c1da80205aa8` | 2026-02-25 | Migración inicial: tablas `users`, `audits`, `reports` |
| `e6e0306dc02b` | 2026-03-06 | Agrega columna `full_name` a `users` |

---

## Scripts Disponibles

### Backend

```bash
# Iniciar servidor de desarrollo (con auto-reload)
uvicorn app.main:app --reload

# Iniciar en un puerto específico
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
# Servidor de desarrollo
npm run dev

# Build de producción
npm run build

# Preview del build de producción
npm run preview

# Verificación de tipos TypeScript
npm run type-check
```

### Docker

```bash
# Levantar los servicios definidos en docker-compose.yml
docker-compose up -d

# Ver logs del contenedor de PostgreSQL
docker-compose logs -f postgres

# Detener los servicios
docker-compose down

# Detener y eliminar volúmenes (borra los datos de la BD)
docker-compose down -v
```

---

## Autor

**Frankoris Rodriguez Ortiz**  
Proyecto Final — Desarrollo de Software  
2026
