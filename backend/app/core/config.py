from pydantic_settings import BaseSettings, SettingsConfigDict
"""
Este codigo utiliza la libreria pydantic-settings para gestionar la configuracion de la app. 
Su funcion es leer variables de entorno (desde un archivo .env) y 
convertirlas en un objeto de Python validado y tipado. 
Asi, se evita tener "valores magicos" o secretos esparcidos por todo el codigo
"""

# Configuracion de la clase Settings: 
# busca automaticamente variables de entorno que coincidan con los nombres de los atributos
class Settings(BaseSettings):
    
    # Configuracion del archivo .env
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost:5432/codesenseai" # URL de conexion a la base de datos

    # Security
    SECRET_KEY: str = "change-me-in-production" # Clave secreta para firmar los JWT
    ALGORITHM: str = "HS256" # Algoritmo de firma
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30 # Tiempo de expiracion del token

    # LLM
    OPENAI_API_KEY: str = "" # Clave API de OpenAI
    GEMINI_API_KEY: str = "" # Clave API de Gemini

# Instancia de Settings
settings = Settings()
