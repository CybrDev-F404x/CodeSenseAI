"""
app/services/llm.py

Servicio de análisis de código con IA.
Encapsula toda la lógica de comunicación con Google Gemini:
  1. Construye un prompt estructurado con el código y lenguaje recibidos.
  2. Llama a la API de Gemini con reintentos automáticos (exponential backoff).
  3. Parsea y valida el JSON devuelto.
  4. Lanza LLMError si la API falla persistentemente o la respuesta no es válida.
"""

import json
import re
import logging

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception,
    before_sleep_log,
)

from app.core.config import settings

logger = logging.getLogger(__name__)

# ─── Excepción personalizada ──────────────────────────────────────────────────

class LLMError(Exception):
    """Se lanza cuando el LLM falla o devuelve una respuesta inválida."""


def is_rate_limit_error(exception: Exception) -> bool:
    """Detecta si el error es de cuota excedida (429 RESOURCE_EXHAUSTED)."""
    exc_str = str(exception).upper()
    return "429" in exc_str or "RESOURCE_EXHAUSTED" in exc_str


# ─── Prompts ──────────────────────────────────────────────────────────────────

_SYSTEM_PROMPT = """\
Eres un auditor experto de código. Analiza el fragmento de código en {language} y responde \
ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown, sin bloques de código. \
El JSON debe tener exactamente esta estructura:

{{
  "issues": [
    {{
      "type": "security | performance | style | runtime",
      "severity": "high | medium | low",
      "line": <número de línea entero o null>,
      "message": "<descripción clara del problema en español>"
    }}
  ],
  "summary": "<resumen breve con cantidad de problemas encontrados>",
  "score": <número decimal entre 0.0 y 10.0, donde 10 es código perfecto>
}}

Reglas:
- Si no hay problemas, devuelve "issues": [] y "score" entre 8.5 y 10.0.
- Sé específico en los mensajes: menciona el patrón problemático, no solo la categoría.
- Prioriza problemas de seguridad (inyección SQL, eval, hardcoded secrets, etc.).
- El score refleja la calidad general: 0-4 (crítico), 4-6 (mejorable), 6-8 (aceptable), 8-10 (bueno).
"""

_USER_PROMPT = """\
Lenguaje: {language}

Código a auditar:
```{language}
{code}
```
"""


# ─── Funciones de apoyo ───────────────────────────────────────────────────────

@retry(
    retry=retry_if_exception(is_rate_limit_error),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=2, min=15, max=60),
    before_sleep=before_sleep_log(logger, logging.WARNING),
    reraise=True,
)
async def _call_gemini_with_retry(llm: ChatGoogleGenerativeAI, messages: list) -> str:
    """Envuelve la llamada a Gemini con lógica de reintento para cuotas."""
    response = await llm.ainvoke(messages)
    content = response.content
    
    # Si la respuesta es una lista (común en versiones nuevas de LangChain/Gemini), la unimos
    if isinstance(content, list):
        text_parts = []
        for part in content:
            if isinstance(part, str):
                text_parts.append(part)
            elif isinstance(part, dict) and "text" in part:
                text_parts.append(part["text"])
        content = "".join(text_parts)
    
    return content.strip()


# ─── Función principal ────────────────────────────────────────────────────────

async def analyze_code(language: str, code_snippet: str) -> dict:
    """
    Analiza *code_snippet* usando Gemini y devuelve un dict con:
      - issues: list[dict]  (type, severity, line, message)
      - summary: str
      - score: float

    Lanza LLMError si algo falla tras los reintentos.
    """
    if not settings.GEMINI_API_KEY:
        raise LLMError("GEMINI_API_KEY no configurada en el entorno.")

    # Usamos gemini-flash-latest que es el alias estable confirmado en el debug.
    llm = ChatGoogleGenerativeAI(
        model="gemini-flash-latest",
        google_api_key=settings.GEMINI_API_KEY,
        temperature=0.2,
        max_retries=0, 
    )

    system_text = _SYSTEM_PROMPT.format(language=language)
    user_text = _USER_PROMPT.format(language=language, code=code_snippet)

    try:
        raw = await _call_gemini_with_retry(
            llm, [HumanMessage(content=f"{system_text}\n\n{user_text}")]
        )
    except Exception as exc:
        if is_rate_limit_error(exc):
            logger.error("Cuota de Gemini agotada tras varios reintentos: %s", exc)
            raise LLMError(
                "Has excedido la cuota de la IA. Por favor, espera un minuto e inténtalo de nuevo."
            ) from exc
        
        logger.error("Error llamando a Gemini: %s", exc)
        raise LLMError(f"Error de comunicación con la IA: {exc}") from exc

    # Extraer JSON aunque el modelo envuelva la respuesta en markdown
    json_match = re.search(r"\{.*\}", raw, re.DOTALL)
    if not json_match:
        logger.error("Gemini devolvió respuesta sin JSON: %s", raw[:200])
        raise LLMError("La IA no devolvió un JSON válido.")

    try:
        result = json.loads(json_match.group())
    except json.JSONDecodeError as exc:
        logger.error("JSON inválido de Gemini: %s", raw[:200])
        raise LLMError(f"JSON inválido en la respuesta de la IA: {exc}") from exc

    # Validación mínima de estructura
    if "issues" not in result or "score" not in result:
        raise LLMError("La respuesta de la IA no tiene la estructura esperada (issues/score).")

    # Asegurar que score sea float y esté en rango
    try:
        result["score"] = max(0.0, min(10.0, float(result["score"])))
    except (TypeError, ValueError):
        result["score"] = 5.0

    result.setdefault("summary", f"{len(result['issues'])} problema(s) encontrado(s).")

    return result
