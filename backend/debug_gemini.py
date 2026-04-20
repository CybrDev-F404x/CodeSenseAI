import os
import json
import urllib.request

# Parser manual de .env para no depender de python-dotenv
def get_api_key():
    try:
        if os.path.exists(".env"):
            with open(".env", "r") as f:
                for line in f:
                    if "GEMINI_API_KEY=" in line:
                        return line.split("=")[1].strip().strip('"').strip("'")
    except Exception as e:
        print(f"Error leyendo .env: {e}")
    return None

api_key = get_api_key()

if not api_key:
    print("Error: No se encontró GEMINI_API_KEY en el archivo .env")
    exit(1)

# Probamos con la URL de la API v1beta
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"

print(f"Consultando modelos disponibles en la API v1beta...")
try:
    with urllib.request.urlopen(url) as response:
        data = json.loads(response.read().decode())
        models = data.get('models', [])
        print("\nModelos habilitados para tu API Key:")
        for m in models:
            if 'generateContent' in m.get('supportedGenerationMethods', []):
                print(f" - {m['name'].replace('models/', '')}")
except Exception as e:
    print(f"Error al conectar con la API: {e}")
