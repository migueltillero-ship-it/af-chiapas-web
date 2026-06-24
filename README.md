# Alliance Française San Cristóbal · AF Virtual

Sitio oficial de la Alliance Française San Cristóbal de Las Casas — la primera **Alliance Française 100% virtual de México**.

## Stack actual (Fase 1)

- HTML/CSS/JS vanilla, sin build step
- Tipografías: Cormorant Garamond, Syne, Space Mono (Google Fonts)
- Iconografía: Font Awesome 6
- Formulario de preinscripción: EmailJS
- PWA: `manifest.webmanifest`
- SEO: `robots.txt`, `sitemap.xml`, Open Graph, JSON-LD

## Estructura

```
.
├── index.html                  # Página principal (canónica)
├── manifest.webmanifest        # PWA manifest
├── robots.txt
├── sitemap.xml
├── scripts/python/             # Generador de catálogo
└── src/
    ├── assets/
    │   ├── brand/              # Logo oficial
    │   ├── data/               # JSON: catalogo_cursos, delf_dalf, eventos, actualidades
    │   ├── img/                # Imágenes
    │   └── media/              # Multimedia
    ├── config/satelites.json
    ├── data/noticias.json
    └── index.html              # Redirige al canónico
```

## Desarrollo local

```bash
# Cualquier servidor estático funciona
python3 -m http.server 8080
# Abrir http://localhost:8080
```

## Próximas fases

- **Fase 2** — Backend (Supabase): auth de alumnos, validación administrativa de preinscripciones, panel admin.
- **Fase 3** — Portal alumno y docente: horarios, calendario, pagos en línea, aula virtual integrada.

## Contacto

- Sede física: Av. La Almolonga 80, Barrio Santa Lucía, San Cristóbal de Las Casas
- Virtual: virtual@alianzafr.edu.mx
- Tel/WhatsApp: +52 967 342 44 56
