#!/usr/bin/env python3
"""Reúne los esquemas de supabase/ en un solo archivo aplicable de una vez.

Aplicar ocho archivos a mano en el SQL Editor invita a saltarse uno o a
cambiar el orden, y ambos errores rompen el siguiente esquema. Este script
genera supabase/instalacion_completa.sql con todo en el orden correcto.

    python3 scripts/python/generar_instalacion.py

Volver a ejecutarlo después de tocar cualquier esquema.
"""

from pathlib import Path

# El orden importa: cada esquema se apoya en los anteriores.
ORDEN = [
    ("schema.sql", "Inscripciones, perfiles y bitácora"),
    ("schema_phase2b.sql", "Docentes y grupos, con control de cupo"),
    ("schema_phase3.sql", "Consulta del alumno por folio y correo"),
    ("schema_phase3b.sql", "Permisos del docente sobre sus grupos"),
    ("schema_phase5.sql", "Eventos culturales editables"),
    ("schema_phase6.sql", "Catálogo de cursos editable"),
    ("schema_phase7.sql", "Sesiones y asistencias"),
    ("schema_phase9.sql", "Pagos"),
]

CABECERA = """\
-- ═══════════════════════════════════════════════════════════════════
--  Alliance Française San Cristóbal · INSTALACIÓN COMPLETA
--
--  Los ocho esquemas del proyecto, en el orden correcto de dependencias,
--  reunidos en un solo archivo para poder aplicarlos de una sola vez
--  desde el SQL Editor de Supabase.
--
--  Cómo usarlo:
--    1. Supabase Studio → SQL Editor → New query
--    2. Pegar TODO este archivo
--    3. Run
--
--  Es seguro volver a ejecutarlo: los esquemas usan "if not exists" y
--  "on conflict do nothing" donde corresponde.
--
--  NO EDITAR A MANO. Se genera con:
--      python3 scripts/python/generar_instalacion.py
-- ═══════════════════════════════════════════════════════════════════
"""

RAIZ = Path(__file__).resolve().parents[2]
DESTINO = RAIZ / "supabase" / "instalacion_completa.sql"


def main() -> int:
    partes = [CABECERA]

    for archivo, descripcion in ORDEN:
        origen = RAIZ / "supabase" / archivo
        if not origen.exists():
            print(f"falta {archivo}: no se genera nada")
            return 1
        partes.append(
            "\n-- ───────────────────────────────────────────────────────────────\n"
            f"--  {archivo} — {descripcion}\n"
            "-- ───────────────────────────────────────────────────────────────\n\n"
            + origen.read_text(encoding="utf-8").rstrip()
            + "\n"
        )

    DESTINO.write_text("\n".join(partes), encoding="utf-8")
    lineas = DESTINO.read_text(encoding="utf-8").count("\n")
    print(f"{DESTINO.relative_to(RAIZ)} — {len(ORDEN)} esquemas, {lineas} líneas")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
