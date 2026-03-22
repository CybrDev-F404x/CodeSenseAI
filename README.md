# CodeSenseAI

**Plataforma de auditoría inteligente de código** especializada en proyectos **Python** y **C#**, impulsada por modelos de lenguaje (LLM) para detectar problemas, patrones de riesgo y generar reportes técnicos detallados.

---

## 🧩 Stack Tecnológico

| Capa          | Tecnología                                          |
| ------------- | --------------------------------------------------- |
| Backend       | Python 3.12, FastAPI, SQLAlchemy 2 (async), Alembic |
| Base de datos | PostgreSQL 16                                       |
| LLMs          | LangChain (OpenAI / Google Gemini)                  |
| Auth          | JWT (python-jose + passlib/bcrypt)                  |
| Contenedores  | Docker, Docker Compose                              |
| Frontend      | React + Vite _(en desarrollo)_                      |

---

## 📁 Estructura del Proyecto

```
CodeSenseAI/
├── backend/
│   ├── app/
│   │   ├── api/           # Endpoints: Auth, Users, Audits, Reports
│   │   ├── core/          # Configuración, Seguridad (JWT), Base de datos
│   │   ├── models/        # Modelos SQLAlchemy (User, Audit, Report)
│   │   ├── schemas/       # Schemas Pydantic (validación de I/O)
│   │   └── main.py        # Punto de entrada FastAPI & CORS
│   ├── alembic/           # Migraciones de base de datos
│   ├── seed.py            # Script para poblar la BD con datos de prueba
│   ├── requirements.txt
│   └── .env.example       # Template de variables de entorno
├── frontend/              # React + Vite (en desarrollo)
├── docs/
│   └── Project Roadmap.pdf
└── docker-compose.yml     # Orquestación de servicios (PostgreSQL)
```

---

## ⚙️ Configuración del Entorno de Desarrollo

### Requisitos previos

- Python 3.12+
- Docker Desktop
- Node.js 20+ _(para el frontend, cuando esté disponible)_

### 1. Clonar el repositorio

```bash
git clone <url-del-repo>
cd CodeSenseAI
```

### 2. Levantar la base de datos

```bash
docker-compose up -d
```

### 3. Configurar variables de entorno

```bash
cd backend
cp .env.example .env
# Edita .env con tus API Keys de OpenAI o Google Gemini
```

### 4. Instalar dependencias del backend

```bash
cd backend
python -m venv .venv
# Activar el entorno virtual:
# Windows: .venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
```

### 5. Ejecutar migraciones y poblar la base de datos

```bash
# Aplicar esquema a la base de datos
alembic upgrade head

# Insertar usuario demo y auditorías de ejemplo
python seed.py
```

### 6. Arrancar el servidor

```bash
uvicorn app.main:app --reload
```

La API estará disponible en: `http://localhost:8000`  
Documentación Swagger: `http://localhost:8000/docs`

---

## 🗺️ Roadmap Técnico

| Fase | Módulo                                                     | Estado       |
| ---- | ---------------------------------------------------------- | ------------ |
| 0    | Estructura base del proyecto, modelos de BD, configuración | ✅ Completo  |
| 1    | Autenticación (registro, login, JWT)                       | ✅ Completo  |
| 2    | Gestión de auditorías (CRUD y persistencia)                | ✅ Completo  |
| 3    | Motor de Auditoría (Capa de simulación/mocking)            | ✅ Completo  |
| 4    | Integración real con LLMs (LangChain + Agentes)            | 🔄 En curso  |
| 5    | Frontend React — Dashboard de auditorías                   | 🔲 Pendiente |
| 6    | Frontend React — Visualización de reportes                 | 🔲 Pendiente |
| 7    | Despliegue (CI/CD, producción)                             | 🔲 Pendiente |

---

## 📮 Endpoints Principales

### Autenticación (`/auth`)
- `POST /auth/login`: Obtener token JWT.
- `POST /auth/register`: Registrar nuevo usuario.

### Auditorías (`/audits`)
- `POST /audits/`: Enviar código para auditar (genera reporte simulado).
- `GET /audits/`: Listar auditorías del usuario actual.
- `GET /audits/{id}`: Obtener detalle de una auditoría.

### Reportes (`/reports`)
- `GET /reports/`: Listar todos los reportes generados.
- `GET /reports/audit/{audit_id}`: Obtener el reporte detallado de una auditoría específica.

---

## 🧪 Datos de Prueba (Seed)
El script `seed.py` crea automáticamente un usuario de prueba para facilitar el desarrollo:
- **Usuario:** `demo@codesense.ai`
- **Password:** `demo1234`
- Incluye 5 auditorías pre-cargadas en **Python** y **C#** con problemas de seguridad, rendimiento y estilo.
