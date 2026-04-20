# Documentación Final — CodeSense AI

> **Proyecto Final de Desarrollo de Software**  
> Autor: **Frankoris Rodriguez Ortiz** | Año: **2026**

---

## Tabla de Contenidos

1. [Visión General del Proyecto](#1-visión-general-del-proyecto)
2. [Capturas de Pantalla](#2-capturas-de-pantalla)
3. [Arquitectura del Sistema](#3-arquitectura-del-sistema)
4. [Flujo de Auditoría con IA](#4-flujo-de-auditoría-con-ia)
5. [Stack Tecnológico](#5-stack-tecnológico)
6. [Estructura del Proyecto](#6-estructura-del-proyecto)
7. [Modelo de Base de Datos](#7-modelo-de-base-de-datos)
8. [Referencia de la API REST](#8-referencia-de-la-api-rest)
9. [Sistema de Temas](#9-sistema-de-temas)
10. [Instalación y Configuración](#10-instalación-y-configuración)
11. [Variables de Entorno](#11-variables-de-entorno)
12. [Migraciones de Base de Datos](#12-migraciones-de-base-de-datos)
13. [Scripts Disponibles](#13-scripts-disponibles)
14. [Decisiones de Diseño](#14-decisiones-de-diseño)
15. [Autor](#15-autor)

---

## 1. Visión General del Proyecto

**CodeSense AI** es una plataforma web de auditoría inteligente de código fuente impulsada por **Google Gemini** (IA generativa). Permite a desarrolladores individuales y equipos de software analizar fragmentos de código en **Python** y **C#**, detectando automáticamente vulnerabilidades de seguridad, problemas de rendimiento, deuda técnica y malas prácticas.

### ¿Qué hace CodeSense AI?

El usuario pega su código en la plataforma, selecciona el lenguaje de programación, y el motor de inteligencia artificial lo analiza en tiempo real. El sistema devuelve:

- Una lista de **issues** categorizados por tipo (`security`, `performance`, `style`, `runtime`) y severidad (`high`, `medium`, `low`).
- Un **resumen narrativo** con la descripción general de los hallazgos.
- Un **Health Score** del `0.0` al `10.0` que representa la calidad global del código.
- El historial completo queda almacenado en la cuenta del usuario con **aislamiento total de datos** entre cuentas (multi-tenancy).

### Características Principales

| Área               | Funcionalidad                                                  |
| ------------------ | -------------------------------------------------------------- |
| 🤖 **IA Real**     | Integración directa con Google Gemini `gemini-flash-latest`    |
| 🔐 **Seguridad**   | Autenticación JWT Bearer + hash Bcrypt                         |
| 📊 **Dashboard**   | Métricas en tiempo real con gráficos de actividad              |
| 📋 **Historial**   | Todas las auditorías con filtros y búsqueda                    |
| 📄 **Reportes**    | Viewer de código con líneas problemáticas resaltadas           |
| 📤 **Exportación** | Descarga de auditorías en formato CSV (BOM UTF-8)              |
| 🎨 **Temas**       | 5 paletas de color persistidas por usuario en base de datos    |
| ♻️ **Reintentos**  | Backoff exponencial automático ante errores de cuota de Gemini |
| 🗑️ **Soft Delete** | Desactivación de cuenta sin perder historial de auditorías     |

---

## 2. Capturas de Pantalla

### Página de Inicio de Sesión

La pantalla de login presenta un diseño premium con el logo de CodeSenseAI, campos de autenticación y opción de registro para nuevos usuarios.

![Login Page](./images/login_page.png)

---

### Dashboard Principal

El dashboard muestra las métricas clave del usuario: total de auditorías, auditorías pendientes, score promedio y total de reportes. Incluye un gráfico de barras con la actividad semanal y la tabla de auditorías recientes.

![Dashboard Page](./images/dashboard_page.png)

---

### Nueva Auditoría

La página de nueva auditoría permite seleccionar el lenguaje (Python o C#), pegar el fragmento de código y enviarlo para análisis. El sistema procesa el código con Gemini y actualiza el resultado en tiempo real.

![New Audit Page](./images/new_audit_page.png)

---

### Mis Auditorías

Vista de historial completo de auditorías del usuario con filtros por lenguaje, estado y búsqueda libre. Incluye un botón de exportación a CSV.

![My Audits Page](./images/my_audits_page.png)

---

### Reportes

Vista detallada de los reportes generados por la IA, con el código fuente resaltado por líneas y la lista de issues clasificados por tipo y severidad.

![Reports Page](./images/reports_page.png)

---

### Configuración

La página de Settings permite al usuario gestionar su perfil, cambiar contraseña, seleccionar tema de color y configurar notificaciones.

![Settings Page](./images/settings_page.png)

---

### Perfil de Usuario

Vista del perfil del usuario con datos personales, estadísticas de uso y opciones de personalización de la cuenta.

![Profile Page](./images/profile_page.png)

---

## 3. Arquitectura del Sistema

CodeSenseAI utiliza una arquitectura cliente-servidor desacoplada de tres capas: **Frontend SPA**, **Backend API REST**, y servicios externos (**Gemini AI** + **PostgreSQL**).

![Architecture Diagram](./images/architecture_diagram.png)

### Capa Frontend (React SPA)

- **Framework:** React 18 con TypeScript compilado por Vite (`localhost:5173`)
- **Routing:** React Router v6 con rutas protegidas (`<ProtectedRoute />`)
- **Estado global:** Context API (`AuthContext`) para la sesión del usuario
- **HTTP Client:** Axios con interceptors automáticos para inyección de JWT
- **Temas:** CSS Custom Properties aplicadas dinámicamente en `:root`

### Capa Backend (FastAPI)

- **Framework:** FastAPI sobre Uvicorn (`localhost:8000`)
- **ORM:** SQLAlchemy 2.0 asíncrono con `asyncpg` como driver
- **Autenticación:** JWT Bearer tokens firmados con HS256
- **Routers:** `/auth`, `/users`, `/audits`, `/reports`
- **Servicio IA:** `app/services/llm.py` encapsula toda la lógica de Gemini

### Servicios Externos

- **Google Gemini** (`gemini-flash-latest`): Motor de análisis de código
- **PostgreSQL 16**: Base de datos relacional en contenedor Docker

---

## 4. Flujo de Auditoría con IA

El siguiente diagrama ilustra el ciclo completo desde que el usuario envía código hasta que recibe los resultados del análisis de IA:

![AI Audit Flow](./images/ai_flow_diagram.png)

### Descripción del Flujo

```
1. Usuario → POST /audits/  (código + lenguaje + JWT)
      │
2. FastAPI → valida JWT → identifica usuario
      │
3. DB → INSERT audit (status='processing', UUID)
      │
4. llm.py → construye prompt estructurado → ChatGoogleGenerativeAI
      │
5. Gemini API → responde JSON con issues/summary/score
   ├── [Error 429] → Tenacity retry: 3 intentos, backoff 15-60s
   └── [Falla total] → audit.status='failed', HTTP 502
      │
6. Parsear y validar JSON (regex + json.loads + validación estructura)
      │
7. DB → INSERT report (findings JSONB, score)
      │
8. DB → UPDATE audit (status='done')
      │
9. Response → AuditRead schema → Frontend actualiza UI
```

### Prompt del Sistema para Gemini

El servicio LLM construye un prompt muy específico que:

- Instruye a Gemini a actuar como **auditor experto de código**
- Exige respuesta **solo en JSON válido** (sin texto adicional ni markdown)
- Especifica exactamente la **estructura del JSON** esperada
- Define reglas de scoring: `0-4` crítico, `4-6` mejorable, `6-8` aceptable, `8-10` bueno
- Prioriza la detección de problemas de **seguridad** (SQL injection, eval, secrets hardcodeados)

---

## 5. Stack Tecnológico

### Backend

| Tecnología           | Versión | Rol                                            |
| -------------------- | ------- | ---------------------------------------------- |
| **Python**           | 3.14+   | Lenguaje base                                  |
| **FastAPI**          | 0.115+  | Framework web asíncrono                        |
| **SQLAlchemy**       | 2.0     | ORM async con soporte para PostgreSQL          |
| **asyncpg**          | —       | Driver PostgreSQL nativo async                 |
| **Alembic**          | —       | Gestión de migraciones de BD                   |
| **Pydantic v2**      | —       | Validación y serialización de datos            |
| **python-jose**      | —       | Generación y validación de tokens JWT          |
| **passlib + bcrypt** | —       | Hash seguro de contraseñas                     |
| **LangChain-Google** | —       | Cliente para Google Gemini API                 |
| **Tenacity**         | —       | Reintentos automáticos con backoff exponencial |
| **PostgreSQL**       | 16      | Base de datos relacional (en Docker)           |
| **uvicorn**          | —       | Servidor ASGI de producción/desarrollo         |

### Frontend

| Tecnología                  | Versión | Rol                                        |
| --------------------------- | ------- | ------------------------------------------ |
| **React**                   | 18      | Framework UI basado en componentes         |
| **TypeScript**              | 5+      | Tipado estático para JavaScript            |
| **Vite**                    | 6+      | Bundler y servidor de desarrollo           |
| **React Router**            | v6      | Enrutamiento SPA declarativo               |
| **Axios**                   | —       | Cliente HTTP con interceptors JWT          |
| **Tailwind CSS**            | v4      | Utilidades CSS con sistema de temas custom |
| **react-hot-toast**         | —       | Notificaciones toast globales              |
| **Google Material Symbols** | —       | Iconografía (fuente variable)              |

### Infraestructura

| Herramienta                 | Uso                          |
| --------------------------- | ---------------------------- |
| **Docker + Docker Compose** | Contenedor de PostgreSQL 16  |
| **Google AI Studio**        | API Key para acceso a Gemini |

---

## 6. Estructura del Proyecto

```
CodeSenseAI/
│
├── backend/
│   ├── .env                        # Variables de entorno (no commitear)
│   ├── .env.example                # Plantilla de variables de entorno
│   ├── requirements.txt            # Dependencias Python
│   ├── alembic.ini                 # Configuración de Alembic
│   ├── alembic/                    # Directorio de migraciones
│   │   └── versions/               # Archivos de migración individuales
│   └── app/
│       ├── main.py                 # Punto de entrada FastAPI + lifespan + CORS
│       ├── core/
│       │   ├── config.py           # Settings desde .env (pydantic-settings)
│       │   ├── database.py         # Motor async + sesión get_db()
│       │   └── security.py         # Bcrypt hash + JWT create/verify
│       ├── models/
│       │   ├── user.py             # Tabla `users` (SQLAlchemy)
│       │   ├── audit.py            # Tabla `audits` + Enums de status/language
│       │   └── report.py           # Tabla `reports`
│       ├── schemas/
│       │   ├── user.py             # UserCreate / UserUpdate / UserRead
│       │   ├── audit.py            # AuditCreate / AuditRead
│       │   └── report.py           # ReportRead
│       ├── api/
│       │   ├── deps.py             # Dependencia get_current_user (JWT → User)
│       │   ├── auth.py             # POST /auth/register y /auth/login
│       │   ├── users.py            # GET/PUT/DELETE /users/me
│       │   ├── audits.py           # CRUD completo de auditorías
│       │   └── reports.py          # GET /reports/ y /reports/audit/{id}
│       └── services/
│           └── llm.py              # Motor Gemini: prompt + retry + parsing
│
├── frontend/
│   └── src/
│       ├── App.tsx                 # Rutas + AuthProvider + Toaster global
│       ├── main.tsx                # Aplica tema guardado ANTES del render
│       ├── index.css               # CSS global + tokens semánticos de temas
│       ├── context/
│       │   └── AuthContext.tsx     # Estado global de sesión (login/logout/user)
│       ├── services/
│       │   └── api.ts              # Axios + interceptors JWT + servicios tipados
│       ├── utils/
│       │   └── theme.ts            # 5 temas definidos + applyTheme()
│       ├── components/
│       │   ├── DashboardLayout.tsx # Layout principal con sidebar
│       │   ├── Sidebar.tsx         # Navegación lateral con items activos
│       │   ├── ProtectedRoute.tsx  # Guard de rutas autenticadas
│       │   └── ui/                 # Componentes reutilizables (Button, Card, Input)
│       └── pages/                  # 10 páginas de la aplicación
│           ├── LoginPage.tsx
│           ├── RegisterPage.tsx
│           ├── DashboardPage.tsx
│           ├── NewAuditPage.tsx
│           ├── MyAuditsPage.tsx
│           ├── AuditDetailPage.tsx
│           ├── ReportsPage.tsx
│           ├── ProfilePage.tsx
│           ├── SettingsPage.tsx
│           └── NotFoundPage.tsx
│
├── docker-compose.yml              # Servicio PostgreSQL 16 en Docker
├── README.md                       # Guía rápida del proyecto
└── docs/
    └── DOCUMENTATION.md            # Este archivo (documentación completa)
```

---

## 7. Modelo de Base de Datos

![Database ERD](./images/database_erd.png)

### Tabla: `users`

| Columna           | Tipo           | Restricciones                 | Descripción                                     |
| ----------------- | -------------- | ----------------------------- | ----------------------------------------------- |
| `id`              | `UUID`         | PK, DEFAULT gen_random_uuid() | Identificador único del usuario                 |
| `email`           | `VARCHAR(255)` | UNIQUE, NOT NULL              | Correo electrónico (credencial)                 |
| `full_name`       | `VARCHAR(255)` | —                             | Nombre completo                                 |
| `hashed_password` | `VARCHAR(255)` | NOT NULL                      | Contraseña cifrada con bcrypt                   |
| `is_active`       | `BOOLEAN`      | DEFAULT true                  | Soft-delete (false = cuenta desactivada)        |
| `preferences`     | `JSONB`        | DEFAULT '{}'                  | Preferencias de interfaz (tema, notificaciones) |
| `created_at`      | `TIMESTAMPTZ`  | DEFAULT now()                 | Fecha de registro                               |

### Tabla: `audits`

| Columna        | Tipo          | Restricciones                  | Descripción                                       |
| -------------- | ------------- | ------------------------------ | ------------------------------------------------- |
| `id`           | `UUID`        | PK, DEFAULT gen_random_uuid()  | Identificador único de la auditoría               |
| `user_id`      | `UUID`        | FK → users.id (CASCADE DELETE) | Propietario de la auditoría                       |
| `language`     | `ENUM`        | NOT NULL                       | Lenguaje: `python` o `csharp`                     |
| `code_snippet` | `TEXT`        | NOT NULL                       | Fragmento de código a analizar                    |
| `status`       | `ENUM`        | DEFAULT 'pending'              | Estado: `pending`, `processing`, `done`, `failed` |
| `created_at`   | `TIMESTAMPTZ` | DEFAULT now()                  | Fecha de creación                                 |

### Tabla: `reports`

| Columna      | Tipo          | Restricciones                          | Descripción                      |
| ------------ | ------------- | -------------------------------------- | -------------------------------- |
| `id`         | `UUID`        | PK, DEFAULT gen_random_uuid()          | Identificador único del reporte  |
| `audit_id`   | `UUID`        | FK UNIQUE → audits.id (CASCADE DELETE) | Auditoría asociada (1:1)         |
| `findings`   | `JSONB`       | NOT NULL                               | Resultados del análisis IA       |
| `score`      | `FLOAT`       | CHECK (0.0-10.0)                       | Puntuación de calidad del código |
| `created_at` | `TIMESTAMPTZ` | DEFAULT now()                          | Fecha de generación              |

### Estructura del campo `findings` (JSONB)

```json
{
  "issues": [
    {
      "type": "security | performance | style | runtime",
      "severity": "high | medium | low",
      "line": 12,
      "message": "Descripción clara del problema en español"
    }
  ],
  "summary": "Se encontraron 3 problemas: 1 crítico, 2 de estilo.",
  "score": 6.5
}
```

### Relaciones

```
users ──(1:N)──► audits ──(1:1)──► reports
```

- Un usuario puede tener **muchas** auditorías.
- Cada auditoría tiene **exactamente un** reporte.
- El `CASCADE DELETE` en ambas FK garantiza que al borrar un usuario se eliminan sus auditorías y reportes, y al borrar una auditoría se elimina su reporte.

---

## 8. Referencia de la API REST

La API cuenta con documentación interactiva generada automáticamente por FastAPI:

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

### Endpoints Generales

| Método | Ruta      | Auth | Descripción                     |
| ------ | --------- | ---- | ------------------------------- |
| `GET`  | `/`       | ❌   | Mensaje de bienvenida + versión |
| `GET`  | `/health` | ❌   | Health check del servidor       |

### Autenticación (`/auth`)

| Método | Ruta             | Auth | Descripción                         |
| ------ | ---------------- | ---- | ----------------------------------- |
| `POST` | `/auth/register` | ❌   | Registro de nuevo usuario           |
| `POST` | `/auth/login`    | ❌   | Inicio de sesión → JWT Bearer token |

**Request `/auth/register`:**

```json
{
  "email": "usuario@ejemplo.com",
  "full_name": "Juan Pérez",
  "password": "ContraseñaSegura123!"
}
```

**Response `/auth/login`:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Usuarios (`/users`) — Requiere JWT

| Método   | Ruta        | Descripción                                         |
| -------- | ----------- | --------------------------------------------------- |
| `GET`    | `/users/me` | Perfil completo del usuario autenticado             |
| `PUT`    | `/users/me` | Actualizar nombre, email, contraseña o preferencias |
| `DELETE` | `/users/me` | Soft-delete de la cuenta (`is_active=False`)        |

**Request `PUT /users/me` (preferencias/tema):**

```json
{
  "preferences": {
    "theme": "inkblack",
    "notifications": true
  }
}
```

### Auditorías (`/audits`) — Requiere JWT

| Método   | Ruta           | Descripción                              |
| -------- | -------------- | ---------------------------------------- |
| `POST`   | `/audits/`     | Crear auditoría → analizar con Gemini IA |
| `GET`    | `/audits/`     | Listar todas las auditorías del usuario  |
| `GET`    | `/audits/{id}` | Detalle de una auditoría específica      |
| `DELETE` | `/audits/{id}` | Eliminar auditoría y su reporte asociado |

**Request `POST /audits/`:**

```json
{
  "language": "python",
  "code_snippet": "import os\npassword = 'admin123'\nos.system(f'login {password}')"
}
```

**Response `POST /audits/` (201 Created):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "language": "python",
  "code_snippet": "...",
  "status": "done",
  "created_at": "2026-04-13T20:00:00Z"
}
```

### Reportes (`/reports`) — Requiere JWT

| Método | Ruta                  | Descripción                         |
| ------ | --------------------- | ----------------------------------- |
| `GET`  | `/reports/`           | Todos los reportes del usuario      |
| `GET`  | `/reports/audit/{id}` | Reporte de una auditoría específica |

**Response `GET /reports/audit/{id}`:**

```json
{
  "id": "abc123...",
  "audit_id": "550e8400...",
  "findings": {
    "issues": [
      {
        "type": "security",
        "severity": "high",
        "line": 2,
        "message": "Contraseña hardcodeada en el código fuente. Usar variables de entorno."
      }
    ],
    "summary": "1 problema crítico de seguridad detectado.",
    "score": 2.5
  },
  "score": 2.5,
  "created_at": "2026-04-13T20:00:05Z"
}
```

### Códigos de Error

| Código                     | Situación                                      |
| -------------------------- | ---------------------------------------------- |
| `401 Unauthorized`         | Token JWT ausente, inválido o expirado         |
| `403 Forbidden`            | El recurso no pertenece al usuario autenticado |
| `404 Not Found`            | Auditoría o reporte no encontrado              |
| `422 Unprocessable Entity` | Error de validación en el payload              |
| `502 Bad Gateway`          | Fallo en la comunicación con Google Gemini     |

---

## 9. Sistema de Temas

CodeSenseAI implementa un sistema de temas dinámico basado en **CSS Custom Properties** que se aplican al `:root` del documento sin necesidad de re-renderizar React.

![Theme Showcase](./images/theme_showcase.png)

### Los 5 Temas Disponibles

| Tema                   | Background | Accent    | Estilo           |
| ---------------------- | ---------- | --------- | ---------------- |
| **Indigo** _(default)_ | `#0a0316`  | `#6366f1` | Dark, premium    |
| **White**              | `#f8fafc`  | `#2563eb` | Light, limpio    |
| **Deep Crimson**       | `#1a0005`  | `#8F0013` | Agresivo, alerta |
| **Ink Black**          | `#040B20`  | `#38BDF8` | Cyber, técnico   |
| **Onyx**               | `#070A0D`  | `#14B8A6` | Minimal, hacker  |

**Tokens CSS disponibles:**

- `--color-bg-base` — Fondo de página
- `--color-surface` — Fondo de cards/paneles
- `--color-accent` — Color de acción principal (botones, links)
- `--color-accent-subtle` — Tina suave del accent (backgrounds hover)
- `--color-text-primary` — Texto principal
- `--color-text-muted` — Texto secundario/labels
- `--color-border` — Bordes de cards e inputs

### Persistencia por Usuario

El tema activo se guarda en el campo `preferences` JSONB de la tabla `users` en la base de datos, garantizando que la preferencia persiste entre sesiones y dispositivos.

```typescript
// Al cambiar de tema
await userService.updateMe({
  preferences: { theme: selectedTheme },
});
```

El tema también se aplica de forma **ultra rápida en `main.tsx`** —antes de que React monte el DOM— para evitar cualquier flash de tema incorrecto (FOUC):

```typescript
// main.tsx
applyStoredTheme(); // Lee localStorage y aplica tema ANTES del render
ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
```

---

## 10. Instalación y Configuración

### Prerrequisitos

- [Python 3.14+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Cuenta en [Google AI Studio](https://aistudio.google.com/) para obtener la `GEMINI_API_KEY`

---

### Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/CodeSenseAI.git
cd CodeSenseAI
```

---

### Paso 2: Levantar la Base de Datos

```bash
# Inicia PostgreSQL 16 en docker (localhost:5433)
docker-compose up -d

# Verificar que el contenedor está corriendo
docker-compose ps
```

---

### Paso 3: Configurar el Backend

```bash
cd backend

# 1. Crear entorno virtual
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Linux/Mac

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Copiar y editar variables de entorno
copy .env.example .env
# ← Editar .env con tus valores (ver sección Variables de Entorno)
```

---

### Paso 4: Ejecutar Migraciones

```bash
# Con el entorno virtual activo, dentro de /backend
alembic upgrade head
```

---

### Paso 5: Iniciar el Backend

```bash
# Dentro de /backend, con .venv activo
uvicorn app.main:app --reload
```

El backend queda disponible en: `http://localhost:8000`  
Swagger UI en: `http://localhost:8000/docs`

---

### Paso 6: Configurar e Iniciar el Frontend

```bash
cd ../frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación queda disponible en: `http://localhost:5173`

---

## 11. Variables de Entorno

Crea el archivo `backend/.env` con las siguientes variables:

```env
# ── Base de datos ──────────────────────────────────────────────────────────────
# Puerto 5433 coincide con el mapeado en docker-compose.yml
DATABASE_URL=postgresql+asyncpg://codesense:codesense123@localhost:5433/codesenseai

# ── Seguridad JWT ──────────────────────────────────────────────────────────────
# Genera una clave aleatoria segura: python -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=tu-clave-secreta-muy-larga-y-aleatoria
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# ── Integraciones IA ───────────────────────────────────────────────────────────
# Obtén tu key en: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=tu-api-key-de-google-ai-studio

# Opcional — no implementado en v1.0
OPENAI_API_KEY=
```

> ⚠️ **IMPORTANTE:** El archivo `.env` está en `.gitignore` y **nunca debe subirse al repositorio**. Contiene credenciales sensibles.

---

## 12. Migraciones de Base de Datos

El proyecto usa **Alembic** para gestionar la evolución del esquema de base de datos de forma versionada y reproducible.

```bash
# Aplicar todas las migraciones pendientes
alembic upgrade head

# Ver el historial de migraciones aplicadas
alembic history --verbose

# Generar nueva migración automática (tras modificar un modelo SQLAlchemy)
alembic revision --autogenerate -m "descripcion del cambio"

# Revertir la última migración
alembic downgrade -1

# Revertir todas las migraciones (base)
alembic downgrade base
```

### Historial de Migraciones

| Revisión       | Fecha      | Descripción                                            |
| -------------- | ---------- | ------------------------------------------------------ |
| `c1da80205aa8` | 2026-02-25 | Migración inicial: tablas `users`, `audits`, `reports` |
| `e6e0306dc02b` | 2026-03-06 | Agrega columna `full_name` a la tabla `users`          |

---

## 13. Scripts Disponibles

### Backend

```bash
# Iniciar con auto-reload (desarrollo)
uvicorn app.main:app --reload

# Puerto específico
uvicorn app.main:app --reload --port 8000

# Modo producción (sin reload)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Frontend

```bash
# Servidor de desarrollo (con HMR)
npm run dev

# Build de producción optimizado
npm run build

# Preview del bundle de producción
npm run preview

# Verificación de tipos TypeScript
npm run type-check
```

### Docker

```bash
# Iniciar servicios en background
docker-compose up -d

# Ver logs del contenedor de PostgreSQL
docker-compose logs -f postgres

# Detener servicios
docker-compose down

# Detener y eliminar volúmenes (⚠️ borra todos los datos de la BD)
docker-compose down -v

# Reiniciar solo PostgreSQL
docker-compose restart postgres
```

---

## 14. Decisiones de Diseño

### ¿Por qué FastAPI y no Django/Flask?

FastAPI fue elegido por su soporte nativo para **async/await**, que es fundamental para no bloquear el servidor mientras espera la respuesta de la API de Gemini (que puede tomar varios segundos). Además ofrece validación automática con Pydantic y documentación Swagger generada automáticamente.

### ¿Por qué SQLAlchemy 2.0 async + asyncpg?

El driver `asyncpg` es el más rápido disponible para PostgreSQL en Python, y la capa async de SQLAlchemy 2.0 permite ejecutar múltiples consultas en paralelo sin bloquear el event loop de FastAPI.

### ¿Por qué React Context API y no Redux?

El estado global de CodeSenseAI se limita a dos preocupaciones: **sesión del usuario** (AuthContext) y el **tema activo** (CSS variables en `:root`). Para este scope, Redux sería over-engineering. El Context API en combinación con un provider único es más que suficiente y mantiene el bundle más liviano.

### ¿Por qué JSONB para `findings` y `preferences`?

El schema de los findings puede evolucionar conforme se amplíen los tipos de análisis de IA. Usar JSONB en PostgreSQL permite flexibilidad de esquema sin necesidad de migraciones cada vez que se agrega un campo al resultado de Gemini. Además, PostgreSQL indexa JSONB eficientemente.

### ¿Por qué Tenacity para los reintentos?

La API de Google Gemini tiene límites de cuota por minuto (RPM). Tenacity permite implementar un backoff exponencial configurable (2x, mínimo 15s, máximo 60s) de forma declarativa con el decorador `@retry`, sin contaminar la lógica de negocio principal.

### ¿Por qué CSS Custom Properties (variables CSS) para los temas?

Escribir todos los tokens de tema en `:root` via JavaScript es la técnica más eficiente: **cero re-renders de React**, el navegador actualiza todos los estilos de golpe al cambiar una propiedad CSS, y funciona con cualquier selector de CSS en cualquier componente sin necesidad de pasar props.

---

## 15. Autor

```
╔═══════════════════════════════════════════════╗
║          CodeSense AI — v1.0.0                ║
║                                               ║
║  Autor:   Frankoris Rodriguez Ortiz           ║
║  Proyecto: Final — Desarrollo de Software     ║
║  Año:     2026                                ║
║                                               ║
║  Backend:  FastAPI + Python 3.14              ║
║  Frontend: React 18 + TypeScript + Vite       ║
║  AI:       Google Gemini (gemini-flash-latest)║
║  DB:       PostgreSQL 16                      ║
╚═══════════════════════════════════════════════╝
```

---

_Documentación creada el 13 de Abril de 2026._
