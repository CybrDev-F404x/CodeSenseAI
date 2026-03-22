# CodeSenseAI

**Plataforma de auditoría inteligente de código** especializada en proyectos **Python** y **C#**, impulsada por modelos de lenguaje (LLM) para detectar problemas, patrones de riesgo y generar reportes técnicos detallados.

---

## 🧩 Stack Tecnológico

| Capa          | Tecnología                                          |
| ------------- | --------------------------------------------------- |
| Backend       | Python 3.12, FastAPI, SQLAlchemy 2 (async), Alembic |
| Base de datos | PostgreSQL 16                                       |
| LLMs          | OpenAI API / Google Gemini                          |
| Auth          | JWT (python-jose + passlib/bcrypt)                  |
| Contenedores  | Docker, Docker Compose                              |
| Frontend      | React + Vite _(en desarrollo)_                      |

---

## 📁 Estructura del Proyecto

```
CodeSenseAI/
├── backend/
│   ├── app/
│   │   ├── core/          # Configuración, base de datos
│   │   ├── models/        # Modelos SQLAlchemy (User, Audit, Report)
│   │   ├── schemas/       # Schemas Pydantic (validación de I/O)
│   │   └── main.py        # Punto de entrada FastAPI
│   ├── alembic/           # Migraciones de base de datos
│   ├── alembic.ini
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
# Edita .env si necesitas cambiar valores (por defecto ya funciona con docker-compose)
```

### 4. Instalar dependencias del backend

```bash
cd backend
pip install -r requirements.txt
```

### 5. Ejecutar migraciones

```bash
cd backend
alembic upgrade head
```

### 6. Arrancar el servidor

```bash
cd backend
uvicorn app.main:app --reload
```

La API estará disponible en: `http://localhost:8000`  
Documentación Swagger: `http://localhost:8000/docs`

---

## 🗺️ Roadmap Técnico

| Fase | Módulo                                                     | Estado       |
| ---- | ---------------------------------------------------------- | ------------ |
| 0    | Estructura base del proyecto, modelos de BD, configuración | ✅ Completo  |
| 1    | Autenticación (registro, login, JWT)                       | 🔲 Pendiente |
| 2    | Endpoint de análisis de código (upload + LLM)              | 🔲 Pendiente |
| 3    | Generación de reportes estructurados                       | 🔲 Pendiente |
| 4    | Frontend React — Dashboard de auditorías                   | 🔲 Pendiente |
| 5    | Frontend React — Visualización de reportes                 | 🔲 Pendiente |
| 6    | Despliegue (CI/CD, producción)                             | 🔲 Pendiente |

---

## 📮 Endpoints Disponibles (Fase 0)

| Método | Ruta      | Descripción                            |
| ------ | --------- | -------------------------------------- |
| GET    | `/`       | Información de la API                  |
| GET    | `/health` | Health check                           |
| GET    | `/docs`   | Documentación interactiva (Swagger UI) |
