import json
import os

# Estructuración de datos institucionales AF Chiapas
catalogo_institucional = {
    "certificaciones_delf_dalf": [
        {"nivel": "A1", "descripcion": "Básico", "precio_mxn": 1445, "meses_aplicacion": ["Septiembre", "Octubre", "Noviembre"]},
        {"nivel": "A2", "descripcion": "Pre-intermedio", "precio_mxn": 1575, "meses_aplicacion": ["Septiembre", "Octubre", "Noviembre"]},
        {"nivel": "B1", "descripcion": "Intermedio", "precio_mxn": 1800, "meses_aplicacion": ["Septiembre", "Octubre", "Noviembre"]},
        {"nivel": "B2", "descripcion": "Avanzado", "precio_mxn": 2500, "meses_aplicacion": ["Septiembre", "Octubre", "Noviembre"]},
        {"nivel": "C1", "descripcion": "Superior", "precio_mxn": 3500, "meses_aplicacion": ["Septiembre", "Noviembre"]},
        {"nivel": "C2", "descripcion": "Superior Avanzado", "precio_mxn": 4000, "meses_aplicacion": ["Septiembre", "Noviembre"]}
    ],
    "oferta_academica": [
        {"segmento": "Educación Infantil (4-11 años)", "programa": "Les Petits Loups / Loustics", "carga_horaria": "2 horas semanales", "objetivo": "Alfabetización temprana y acercamiento oral"},
        {"segmento": "Juventud (11-17 años)", "programa": "Junior / À la Une", "carga_horaria": "3 horas semanales", "objetivo": "Desarrollo A1 a B2"},
        {"segmento": "Adultos (+15 años)", "programa": "Défi", "ritmos": ["Ligero", "Intensivo", "Progresivo", "Sabatino"], "objetivo": "MCER A1 a C2"}
    ],
    "programas_especializados": [
        {"nombre": "Curso de Gastronomía y Turismo", "horas_totales": 48, "sede": "San Cristóbal de Las Casas", "dirigido_a": "Prestadores de servicios turísticos y hostelería"}
    ]
}

# Creación de rutas seguras
ruta_datos = 'C:/AF_Chiapas_Web/src/assets/data'
os.makedirs(ruta_datos, exist_ok=True)

# Exportación del archivo JSON
ruta_archivo = os.path.join(ruta_datos, 'catalogo_oficial.json')
with open(ruta_archivo, 'w', encoding='utf-8') as archivo:
    json.dump(catalogo_institucional, archivo, ensure_ascii=False, indent=4)

print(f"EXITO: Base de datos JSON generada correctamente en {ruta_archivo}")
