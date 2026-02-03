from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="CodeSense AI API",
    description="Intelligent Code Audit Platform focused on Python and C#",
    version="1.0.0"
)

# CORS Configuration
origins = [
    "http://localhost:3000",  # React Frontend (Default)
    "http://localhost:5173",  # Vite (Alternative)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "Welcome to CodeSense AI API",
        "status": "active",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "ok"}
