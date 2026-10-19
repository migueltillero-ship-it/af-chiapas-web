#!/usr/bin/env python3
"""Renombra img-NN, actualiza assets/manifest.csv y genera derivados web
(WebP escritorio/móvil + videos ligeros con póster). Uso: python3 scripts/optimizar-recursos.py"""
import csv, os, subprocess, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG, VID = os.path.join(ROOT, 'assets/img'), os.path.join(ROOT, 'assets/video')
WEB_IMG, WEB_VID = os.path.join(IMG, 'web'), os.path.join(VID, 'web')

# nombre nuevo, descripción, orientación, sección
RENAME = {
 'img-01': ('patron-af-tapiz-rojo-logo', 'Logo blanco sobre tapiz rojo con monograma af repetido', 'horizontal', 'fondo contacto / historia'),
 'img-02': ('textil-chiapaneco-logo-claro', 'Textil chiapaneco rojo arriba, papel crema abajo, logo en blanco', 'horizontal', 'fondo bienvenida'),
 'img-03': ('logo-negro-red-vertical', 'Logo rojo sobre negro con red de puntos', 'vertical', 'logos (sin uso)'),
 'img-04': ('logo-rosa-motivo-miniatura', 'Logo con motivo rosa, 160 px (baja resolución)', 'cuadrada', 'logos (sin uso)'),
 'img-05': ('logo-cuatro-versiones-color', 'Cuatro versiones del logo (rojo, blanco, gris)', 'cuadrada', 'logos (sin uso)'),
 'img-06': ('equipo-notre-equipe-campana', 'Cartel "Notre équipe" con cuatro docentes', 'horizontal', 'equipo (docentes)'),
 'img-07': ('logo-horizontal-blanco-minimal', 'Logo horizontal sobre blanco', 'horizontal', 'logos (sin uso)'),
 'img-08': ('logo-vertical-blanco-trama', 'Logo vertical rojo sobre blanco con trama', 'vertical', 'logos (sin uso)'),
 'img-09': ('logo-3d-gris-pizarra', 'Logo 3D sobre pizarra gris', 'horizontal', 'póster video ciclo'),
 'img-10': ('logo-3d-fondo-rojo', 'Logo 3D blanco sobre rojo', 'horizontal', 'logos (sin uso)'),
 'img-11': ('docente-frances-con-pasion-campana', 'Cartel "Français avec passion" con docente', 'horizontal', 'equipo (reserva)'),
 'img-12': ('logo-variantes-fondos', 'Variantes del logo sobre blanco, rojo y negro', 'horizontal', 'logos (sin uso)'),
 'img-13': ('logo-vertical-blanco-linea-roja', 'Logo grande con línea roja sobre blanco', 'horizontal', 'logos (sin uso)'),
 'img-14': ('logo-panoramico-franja-tricolor', 'Logo en franja panorámica con tricolor', 'panorámica', 'logos (sin uso)'),
 'img-15': ('campana-aprende-frances-banner', 'Banner "Aprende francés · vive la experiencia" con 2 personas', 'horizontal', 'promociones'),
 'img-16': ('logo-panoramico-cuero-rojo', 'Logo en relieve sobre cuero rojo', 'panorámica', 'logos (sin uso)'),
 'img-17': ('logo-mapa-chiapas-relieve', 'Logo sobre silueta de Chiapas', 'cuadrada', 'logos (sin uso)'),
 'img-18': ('textil-chiapaneco-logo-rojo-azul', 'Textil chiapaneco con logo blanco', 'horizontal', 'fondo cursos'),
 'img-19': ('logo-catedral-torre-eiffel-linea', 'Logo catedral + Torre Eiffel en línea', 'horizontal', 'logos (sin uso)'),
 'img-20': ('logo-catedral-3d-colores', 'Logo catedral + Torre Eiffel en 3D', 'horizontal', 'logos (sin uso)'),
 'img-21': ('logo-catedral-linea-gris', 'Logo catedral en línea gris', 'horizontal', 'logos (sin uso)'),
 'img-22': ('logo-catedral-azul-marino-plano', 'Logo catedral azul marino plano', 'horizontal', 'logos (sin uso)'),
 'img-23': ('logo-catedral-azul-marino-arco', 'Logo catedral azul marino con arco', 'horizontal', 'logos (sin uso)'),
 'img-24': ('logo-catedral-tinta-acuarela', 'Logo catedral en tinta y acuarela roja', 'horizontal', 'logos (sin uso)'),
 'img-25': ('logo-catedral-3d-ladrillo-a', 'Logo catedral 3D en ladrillo (A)', 'horizontal', 'logos (sin uso)'),
 'img-26': ('logo-catedral-3d-papel-claro', 'Logo catedral 3D sobre papel claro', 'horizontal', 'logos (sin uso)'),
 'img-27': ('logo-horizontal-miniatura-lienzo-vertical', 'Logo muy pequeño en lienzo blanco vertical', 'vertical', 'logos (sin uso)'),
 'img-28': ('docente-miguel-tillero-conoce-a-tu-maestro', 'Cartel "Conoce a tu maestro" Miguel Tillero', 'cuadrada', 'equipo (reserva)'),
 'img-29': ('logo-catedral-3d-ladrillo-b', 'Logo catedral 3D en ladrillo (B)', 'horizontal', 'logos (sin uso)'),
 'img-30': ('logo-catedral-3d-textura-papel', 'Logo catedral 3D con textura de papel', 'horizontal', 'logos (sin uso)'),
 'img-31': ('logo-catedral-linea-fina', 'Logo catedral en línea fina', 'horizontal', 'logos (sin uso)'),
 'img-32': ('logo-catedral-acuarela-roja', 'Logo catedral con acuarela roja sobre papel', 'horizontal', 'logos (sin uso)'),
 'img-33': ('equipo-carteles-docentes', 'Carteles de docentes colgados en pared', 'cuadrada', 'equipo (reserva)'),
 'img-34': ('docente-alejandra-estrada-aula-virtual', 'Retrato de Alejandra Estrada en aula virtual', 'cuadrada', 'equipo (reserva)'),
 'img-35': ('logo-horizontal-rojo-limpio', 'Logo horizontal rojo limpio', 'horizontal', 'logos (sin uso)'),
 'img-36': ('tarjeta-presentacion-director', 'Tarjeta de presentación con datos personales', 'horizontal', 'privado (no publicar)'),
 'img-37': ('fondo-rojo-logo-esquina', 'Fondo rojo liso con logo arriba a la izquierda', 'horizontal', 'fondo exámenes'),
 'img-38': ('campana-aprende-frances-trio', 'Campaña "Aprende francés" con tres jóvenes', 'horizontal', 'promociones'),
 'img-39': ('campana-aprende-frances-claro', 'Campaña "Aprende francés" fondo claro', 'horizontal', 'promociones (reserva)'),
 'img-40': ('logo-af-grande-vertical', 'Logo af grande, formato vertical', 'vertical', 'logos (sin uso)'),
 'img-41': ('logo-af-horizontal-grande', 'Logo af horizontal grande', 'horizontal', 'logos (sin uso)'),
}
USO = {  # otros recursos con sección asignada
 'af-fondo-rojo.jpg': ('Fondo rojo 1920×1001 con logo', 'horizontal', 'fondo promo, exámenes y pie'),
 'campana-2026-1-4.jpg': ('Campaña "Aprende francés en línea"', 'vertical', 'inscripciones'),
 'campana-2026-3-4.jpg': ('Campaña "Francés niños"', 'vertical', 'cursos (niños)'),
 'campana-2026-4-8.jpg': ('Campaña "Cursos particulares"', 'vertical', 'exámenes / cursos particulares'),
 'campana-2026-5-4.jpg': ('Campaña "1ª clase gratis"', 'vertical', 'promociones'),
 'alejandroavendano.jpg': ('Retrato docente', 'cuadrada', 'equipo (reserva)'),
 'fannyfranco.jpg': ('Retrato docente', 'cuadrada', 'equipo (reserva)'),
 'luciarangel.jpg': ('Retrato docente', 'cuadrada', 'equipo (reserva)'),
 'migueltillero.jpg': ('Retrato docente', 'cuadrada', 'equipo (reserva)'),
 'frgsdfg.jpg': ('Campaña "Aprende francés" cuadrada', 'cuadrada', 'promociones (reserva)'),
 'video-alianza-francesa-af.mp4': ('Tapiz rojo con logo (1,4 s)', 'horizontal', 'hero (en bucle ida y vuelta)'),
 'video-alianza-francesa-af1.mp4': ('Logo 3D oscuro (5 s)', 'horizontal', 'nuevo ciclo'),
 'proyeccion.mp4': ('Logo animado sobre blanco (13 s)', 'horizontal', 'historia'),
 'diseno-sin-titulo.mp4': ('Presentación de Miguel Tillero (2:27)', 'horizontal', 'equipo docente'),
 'mi-video.mp4': ('Recopilación de carteles y eventos (2:29)', 'vertical', 'agenda cultural'),
}

def sh(*a):
    subprocess.run(a, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def renombrar():
    mp = os.path.join(ROOT, 'assets/manifest.csv')
    with open(mp, encoding='utf-8-sig', newline='') as f:
        rows = list(csv.DictReader(f))
    for r in rows:
        old = os.path.basename(r['Nuevo'])
        key = old.rsplit('.', 1)[0]
        if key in RENAME:
            nombre, desc, ori, sec = RENAME[key]
            dst = f'assets/img/{nombre}.jpg'
            if os.path.exists(os.path.join(ROOT, r['Nuevo'])):
                sh('git', '-C', ROOT, 'mv', r['Nuevo'], dst)
            r['Nuevo'] = dst
            r['Descripcion'], r['Orientacion'], r['Seccion'] = desc, ori, sec
        elif old in USO:
            r['Descripcion'], r['Orientacion'], r['Seccion'] = USO[old]
        else:
            r['Descripcion'], r['Orientacion'], r['Seccion'] = ('Logotipo / identidad', 'horizontal', 'logos')
    with open(mp, 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()), quoting=csv.QUOTE_ALL)
        w.writeheader(); w.writerows(rows)

def webp(src, out, w, q, recorte=None):
    im = Image.open(os.path.join(ROOT, src)).convert('RGB')
    if recorte:  # fracción inferior de la imagen (sin el logo de la esquina)
        im = im.crop((0, round(im.height * recorte), im.width, im.height))
    if im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im.save(os.path.join(WEB_IMG, out), 'WEBP', quality=q, method=6)

def derivados():
    os.makedirs(WEB_IMG, exist_ok=True); os.makedirs(WEB_VID, exist_ok=True)
    fondos = {  # origen: (nombre, ancho escritorio, calidad)
      'af-fondo-rojo.jpg': ('fondo-rojo', 1600, 70),
      'textil-chiapaneco-logo-claro.jpg': ('textil-claro', 1264, 68),
      'patron-af-tapiz-rojo-logo.jpg': ('tapiz-rojo', 938, 68),
      'textil-chiapaneco-logo-rojo-azul.jpg': ('textil-cursos', 868, 70),
      'fondo-rojo-logo-esquina.jpg': ('fondo-examenes', 1086, 70),
      'logo-3d-gris-pizarra.jpg': ('pizarra', 1024, 70),
    }
    for src, (n, w, q) in fondos.items():
        rc = 0.45 if n == 'fondo-rojo' else None
        webp(f'assets/img/{src}', f'{n}-{w}.webp', w, q, rc)
        webp(f'assets/img/{src}', f'{n}-640.webp', 640, 62, rc)
    camp = {
      'campana-2026-1-4.jpg': 'camp-en-linea', 'campana-2026-3-4.jpg': 'camp-ninos',
      'campana-2026-4-8.jpg': 'camp-particulares', 'campana-2026-5-4.jpg': 'camp-gratis',
      'campana-aprende-frances-banner.jpg': 'camp-banner', 'campana-aprende-frances-trio.jpg': 'camp-trio',
      'equipo-notre-equipe-campana.jpg': 'equipo-notre-equipe',
    }
    for src, n in camp.items():
        webp(f'assets/img/{src}', f'{n}-900.webp', 900, 72)
        webp(f'assets/img/{src}', f'{n}-480.webp', 480, 68)

def videos():
    def poster(src, out, t=0.5):
        sh('ffmpeg', '-y', '-ss', str(t), '-i', src, '-frames:v', '1', '-vf', 'scale=1280:-2', '/tmp/_p.png')
        for w, q in ((1280, 68), (640, 60)):
            im = Image.open('/tmp/_p.png').convert('RGB')
            im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS) if im.width > w else im
            im.save(os.path.join(WEB_VID, f'{out}-{w}.webp'), 'WEBP', quality=q, method=6)
    def enc(src_args, vf, out, crf, ss=None):
        base = ['ffmpeg', '-y', *src_args, '-an', '-vf', vf]
        sh(*base, '-c:v', 'libx264', '-preset', 'slow', '-crf', str(crf), '-pix_fmt', 'yuv420p', '-movflags', '+faststart', os.path.join(WEB_VID, out + '.mp4'))
    src = lambda n: os.path.join(VID, n)
    # Hero: 1,4 s se estira x3 y se encadena ida y vuelta -> bucle continuo de ~8 s
    enc(['-i', src('video-alianza-francesa-af.mp4')],
        'scale=1280:720,setpts=3*PTS,fps=24,split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1:a=0', 'hero-tapiz', 30)
    enc(['-i', src('video-alianza-francesa-af1.mp4')], 'scale=1280:720,fps=24', 'ciclo-logo-oscuro', 31)
    # mi-video: el contenido es un cuadrado 720x720 con barras negras; se recorta y se usa mudo en bucle
    enc(['-i', src('mi-video.mp4')], 'crop=720:720:280:0,fps=24', 'agenda-recopilacion', 31)
    poster(src('video-alianza-francesa-af.mp4'), 'hero-tapiz-poster', 0.7)
    poster(src('video-alianza-francesa-af1.mp4'), 'ciclo-logo-oscuro-poster', 2.5)
    poster(src('diseno-sin-titulo.mp4'), 'presentacion-docente-poster', 9)

if __name__ == '__main__':
    pasos = sys.argv[1:] or ['renombrar', 'img', 'video']
    if 'renombrar' in pasos: renombrar()
    if 'img' in pasos: derivados()
    if 'video' in pasos: videos()
