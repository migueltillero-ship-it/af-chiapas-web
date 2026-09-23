/* Música de fondo. Arranca cuando el intro termina.
   Los navegadores bloquean el audio automático sin interacción previa: si eso
   pasa, esperamos al primer gesto del visitante y arrancamos ahí. */
window.AFMusic = (function(){
  var audio  = document.getElementById('af-bgm');
  var toggle = document.getElementById('af-bgm-toggle');
  if(!audio || !toggle) return { start:function(){} };

  var VOL = 0.32;                       // ambiente, nunca protagonista
  var KEY = 'af_musica';                // preferencia del visitante
  var armed = false, dead = false;

  audio.volume = 0;
  audio.addEventListener('error', function(){ dead = true; toggle.classList.remove('on'); });

  function fadeIn(){
    var v = 0;
    var t = setInterval(function(){
      v += 0.02;
      if(v >= VOL){ v = VOL; clearInterval(t); }
      try { audio.volume = v; } catch(e){ clearInterval(t); }
    }, 60);
  }

  function paint(playing){
    toggle.innerHTML = playing
      ? '<i class="fa fa-volume-high" aria-hidden="true"></i>'
      : '<i class="fa fa-volume-xmark" aria-hidden="true"></i>';
    toggle.setAttribute('aria-label', playing ? 'Silenciar música' : 'Activar música');
  }

  function play(){
    if(dead) return;
    var p = audio.play();
    if(p && typeof p.then === 'function'){
      p.then(function(){ toggle.classList.add('on'); paint(true); fadeIn(); })
       .catch(function(){ armGesture(); });
    }
  }

  // Si el autoplay se bloquea, el primer clic/tecla/scroll enciende la música.
  function armGesture(){
    if(armed) return;
    armed = true;
    toggle.classList.add('on');
    paint(false);
    var go = function(){
      ['click','keydown','touchstart','wheel'].forEach(function(ev){
        document.removeEventListener(ev, go);
      });
      play();
    };
    ['click','keydown','touchstart','wheel'].forEach(function(ev){
      document.addEventListener(ev, go, { once:false, passive:true });
    });
  }

  toggle.addEventListener('click', function(e){
    e.stopPropagation();
    if(audio.paused){
      try { localStorage.setItem(KEY,'on'); } catch(err){}
      play();
    } else {
      audio.pause();
      paint(false);
      try { localStorage.setItem(KEY,'off'); } catch(err){}
    }
  });

  return {
    start: function(){
      var pref = null;
      try { pref = localStorage.getItem(KEY); } catch(e){}
      // Quien ya la silenció una vez no la vuelve a oír sin pedirlo.
      if(pref === 'off'){ toggle.classList.add('on'); paint(false); return; }
      if(window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches){
        toggle.classList.add('on'); paint(false); return;
      }
      play();
    }
  };
})();

/* Intro de marca. Se ejecuta antes que el resto para que no haya parpadeo.
   Nunca debe dejar la página bloqueada: cualquier fallo cierra el intro. */
(function(){
  var box = document.getElementById('af-intro');
  if(!box) return;
  var vid   = document.getElementById('af-intro-video');
  var skip  = document.getElementById('af-intro-skip');
  var sound = document.getElementById('af-intro-sound');
  var done  = false, failsafe;

  document.body.classList.add('af-intro-lock');

  function close(){
    if(done) return;
    done = true;
    clearTimeout(failsafe);
    box.classList.add('af-intro-out');
    document.body.classList.remove('af-intro-lock');
    setTimeout(function(){ if(box.parentNode) box.parentNode.removeChild(box); }, 700);
    // Al cerrarse el intro entra la música.
    if(window.AFMusic) window.AFMusic.start();
  }

  // Si el visitante pidió menos movimiento, no hay intro que mostrar.
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches){
    close();
    return;
  }

  vid.addEventListener('ended', close);
  vid.addEventListener('error', close);
  skip.addEventListener('click', close);
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') close();
  });

  sound.addEventListener('click', function(){
    vid.muted = !vid.muted;
    sound.innerHTML = vid.muted
      ? '<i class="fa fa-volume-xmark" aria-hidden="true"></i>'
      : '<i class="fa fa-volume-high" aria-hidden="true"></i>';
    sound.setAttribute('aria-label', vid.muted ? 'Activar sonido' : 'Silenciar');
  });

  // Red de seguridad: pase lo que pase, a los 12 s la página queda libre.
  failsafe = setTimeout(close, 12000);

  var p = vid.play();
  if(p && typeof p.catch === 'function'){
    // Si el navegador bloquea el autoplay, entramos directo al sitio.
    p.catch(close);
  }
})();

/* El placeholder de cada banner sólo se muestra si la imagen no llegó. */
(function(){
  document.querySelectorAll('.banner-card').forEach(function(card){
    var img = card.querySelector('img');
    var ph  = card.querySelector('.ph');
    if(!img || !ph) return;
    function ok(){ ph.style.display = 'none'; }
    function fail(){ img.style.display = 'none'; ph.style.display = 'flex'; }
    if(img.complete) { img.naturalWidth > 0 ? ok() : fail(); }
    else { img.addEventListener('load', ok); img.addEventListener('error', fail); }
  });
})();

const EMAILJS_PK  = '_l-edMAynCQQsac40';
const EMAILJS_SID = 'service_9wtrch3';
const EMAILJS_TID = 'template_dtddfpk';

/* ──────────────────── DATOS FALLBACK ──────────────────── */
const STATS = [
  {n:'824',  s:'',  l:'Centros AF en el mundo'},
  {n:'138',  s:'',  l:'Países con presencia'},
  {n:'428K', s:'+', l:'Estudiantes anuales'},
  {n:'31',   s:'',  l:'Sedes en México'},
  {n:'6',    s:'',  l:'Niveles MCER que preparamos'},
  {n:'24/7', s:'',  l:'Tutor IA disponible'}
];

const PORQUE_FALLBACK = [
  {i:'fa-globe',          t:'Idioma del mundo',       d:'29 países francófonos. Lengua de trabajo en ONU, UNESCO y Unión Europea.'},
  {i:'fa-graduation-cap', t:'Universidades de élite', d:'Francia es el 3er destino mundial de estudiantes. Matrícula pública desde €170/año.'},
  {i:'fa-briefcase',      t:'Ventaja profesional',    d:'Diferénciate en diplomacia, moda, gastronomía, aeronáutica y arte.'},
  {i:'fa-certificate',    t:'Diplomas vitalicios',    d:'DELF y DALF no caducan. Reconocidos en más de 170 países.'},
  {i:'fa-map-marked-alt', t:'Preparación DELF certificada',      d:'Te preparamos para DELF/DALF con metodología oficial. El examen se aplica en el centro evaluador de la red.'},
  {i:'fa-users',          t:'300M de hablantes',      d:'Comunidad global de estudiantes, profesionales y artistas francófonos.'}
];

const CURSOS_FALLBACK = [
  {id:'adultos',     i:'fa-user-graduate', n:'Adultos',              e:'15 años en adelante', d:'Metodología comunicativa. Niveles A1 a C2. Preparación DELF incluida.',                    tags:['Regular','Intensivo','Sabatino','Virtual']},
  {id:'junior',      i:'fa-user-friends',  n:'Jóvenes',              e:'11 a 17 años',          d:'Programa Junior con contenidos del entorno adolescente. Hasta DELF B2 Junior.',           tags:['Regular','Sabatino','Virtual']},
  {id:'ninos',       i:'fa-child',         n:'Niños',                e:'4 a 11 años',           d:'Inmersión lúdica y natural. Canciones, cuentos, juegos. Programa DELF Prim.',            tags:['Regular','Sabatino']},
  {id:'empresarial', i:'fa-briefcase',     n:'Empresarial',          e:'Profesionales',         d:'Francés para el mundo corporativo. En sus instalaciones, nuestra sede o virtual.',       tags:['Grupal','Ejecutivo','Virtual']},
  {id:'turismo',     i:'fa-utensils',      n:'Gastronomía y Turismo',e:'Servicios turísticos',  d:'48h de francés aplicado para guías, hoteleros y personal de contacto con francófonos.', tags:['Intensivo']},
  {id:'delf_prep',   i:'fa-certificate',   n:'Preparación DELF/DALF',e:'Candidatos a examen',   d:'Talleres intensivos. Simulacros cronometrados con corrección por docente especializado.',tags:['Taller','Particular','Virtual']}
];

// Opciones de diploma previo: siempre disponibles en el select de nivel,
// tenga o no el curso niveles definidos en el catálogo (tab Catálogo del admin).
const NIVELES_DIPLOMA = [
  {codigo:'delf_diploma', nombre:'Ya tengo un diploma DELF (haremos prueba de posicionamiento)'},
  {codigo:'dalf_diploma', nombre:'Ya tengo un diploma DALF (haremos prueba de posicionamiento)'},
];

// Niveles estándar MCER, usados cuando coordinación no ha definido niveles
// específicos para un curso en el catálogo (tab Catálogo del admin).
const NIVELES_ESTANDAR = [
  {codigo:'A1', nombre:'A1 · Débutant'},
  {codigo:'A2', nombre:'A2 · Élémentaire'},
  {codigo:'B1', nombre:'B1 · Intermédiaire'},
  {codigo:'B2', nombre:'B2 · Avancé'},
  {codigo:'C1', nombre:'C1 · Autonome'},
  {codigo:'C2', nombre:'C2 · Maîtrise'},
];

const DELF = [
  {n:'A1',c:'#4caf50',f:'DELF',desc:'Débutant',       hrs:'~80 h prep'},
  {n:'A2',c:'#8bc34a',f:'DELF',desc:'Élémentaire',    hrs:'~100 h prep'},
  {n:'B1',c:'#ffc107',f:'DELF',desc:'Intermédiaire',  hrs:'~180 h prep'},
  {n:'B2',c:'#ff9800',f:'DELF',desc:'Avancé',         hrs:'~240 h prep'},
  {n:'C1',c:'#f44336',f:'DALF',desc:'Autonome',       hrs:'~360 h prep'},
  {n:'C2',c:'#9c27b0',f:'DALF',desc:'Maîtrise',       hrs:'~450 h prep'}
];

const EVENTOS = [
  {t:'Fête de la Musique 2026',     f:'2026-06-21',h:'18:00',l:'San Cristóbal · presencial', cat:'Música',       libre:true,  modo:'presencial'},
  {t:'Tour de Cine Francés 2026',   f:'2026-10-10',h:'19:00',l:'Por confirmar · SCSC',        cat:'Cine',         libre:true,  modo:'presencial'},
  {t:'Fiesta Nacional Francesa',    f:'2026-07-14',h:'19:00',l:'Alliance Française',          cat:'Diplomacia',   libre:true,  modo:'presencial'},
  {t:'Taller pre-examen DELF/DALF', f:'2026-09-06',h:'09:00',l:'Sede San Cristóbal',          cat:'Preparación',  libre:false, modo:'presencial'},
  {t:'Club de Conversation en Ligne',f:'2026-07-05',h:'19:00',l:'Plataforma AF Virtual',       cat:'Comunidad',    libre:true,  modo:'virtual'},
  {t:'Taller de Cocina Francesa',   f:'2026-07-18',h:'11:00',l:'Sede San Cristóbal',          cat:'Gastronomía',  libre:false, modo:'presencial'}
];

const CICLOS_POR_SEG = {
  adultos:    '24 h regular · 48 h intensivo',
  junior:     '24 h regular',
  ninos:      '18 h por ciclo',
  empresarial:'24 h por ciclo · a convenir',
  turismo:    '36 h por ciclo · 4 módulos',
  delf_prep:  '18 h pre-examen · 3 semanas',
  default:    '24 h por ciclo'
};

const FAQ = [
  {cat:'Ciclos y duración', qs:[
    {q:'¿Cuánto dura un ciclo?',                      a:'6 semanas (~1.5 meses). Es nuestro estándar para todos los programas — niños, adolescentes y adultos. Ciclos cortos = avance visible y posibilidad de ajustar el ritmo en cada bimestre.'},
    {q:'¿Cuántas horas tiene un ciclo?',              a:'Depende del ritmo elegido. Regular: 24 h. Intensivo: 48 h. Super-intensivo: 72 h. Sabatino: 24 h. Niños: 18 h. Junior: 24 h. Turismo y DELF Prep tienen su propia estructura modular.'},
    {q:'¿Cuántos ciclos necesito para un nivel MCER?',a:'En ritmo Regular, ~3 ciclos por nivel (A1, A2…). En Intensivo, 1–2 ciclos. En Super-intensivo, un nivel completo por ciclo. Para B2 (universidad): ~3 años en Regular, ~18 meses en Intensivo.'},
    {q:'¿Los niños y adolescentes también operan en ciclos de 6 semanas?', a:'Sí, mismo modelo. La diferencia es la duración de cada sesión y la metodología — adaptadas a su etapa de desarrollo. Niños: 18 h/ciclo en sesiones cortas. Adolescentes (Junior): 24 h/ciclo.'}
  ]},
  {cat:'Plataforma virtual', qs:[
    {q:'¿Las clases virtuales son grabadas o en vivo?', a:'Todas son en vivo con un profesor certificado. Además, cada sesión se graba y queda disponible 30 días para que puedas repasar.'},
    {q:'¿Necesito un equipo especial?',                 a:'No. Solo una computadora o tableta con cámara, micrófono y conexión estable. La plataforma funciona en navegador, sin instalar nada.'},
    {q:'¿Qué es el tutor IA?',                          a:'Es un asistente disponible 24/7 para practicar conversación, recibir corrección instantánea y resolver dudas entre clase y clase. Diseñado por la AF, no es ChatGPT genérico.'}
  ]},
  {cat:'Inscripciones', qs:[
    {q:'¿Cómo me inscribo?',                a:'Completa el formulario en esta página. Recibirás un folio de seguimiento al instante. Nuestro equipo validará tu solicitud en menos de 24 horas hábiles.'},
    {q:'¿Cuándo sé si fui aceptado?',       a:'En menos de 24 horas hábiles te contactamos por correo y WhatsApp con la confirmación de cupo, horario asignado y datos de pago.'},
    {q:'¿Qué métodos de pago aceptan?',     a:'Transferencia, depósito bancario y tarjeta de débito o crédito. Pago en línea para AF Virtual. Descuento por pago anticipado disponible.'},
    {q:'¿Hay descuentos?',                  a:'Sí — credencial de estudiante, pago anticipado y convenios institucionales. Consulta con tu coordinador.'}
  ]},
  {cat:'Cursos', qs:[
    {q:'¿Necesito saber francés para inscribirme?', a:'No. Tenemos grupos para principiantes absolutos (A1). Si ya sabes algo, te hacemos prueba de nivel gratuita.'},
    {q:'¿Cuánto tiempo tarda llegar al B2?',         a:'Aproximadamente 2.5-3 años en ritmo regular (3h/semana). Con ritmo intensivo o virtual, puede reducirse a 18 meses.'},
    {q:'¿Cuántos alumnos hay por grupo?',            a:'Grupos reducidos de 8 a 15 estudiantes. La modalidad particular es 1 a 1 o micro-grupos de hasta 3.'}
  ]},
  {cat:'Certificaciones DELF/DALF', qs:[
    {q:'¿El diploma DELF caduca?',                        a:'No. DELF y DALF son diplomas vitalicios. Una vez aprobados, su validez es permanente.'},
    {q:'¿Puedo presentar el DELF sin tomar clases con ustedes?', a:'Sí. La inscripción está abierta a cualquier candidato.'},
    {q:'¿Qué nivel necesito para estudiar en Francia?',   a:'B2 para Licenciatura, C1 para Maestría o Doctorado. Te preparamos para que la obtengas; el examen oficial se aplica en el centro evaluador de la red.'},
    {q:'¿Cuándo son las sesiones de examen?',             a:'Septiembre, octubre y noviembre. C1 y C2 solo en septiembre y noviembre. Confirma calendario con la sede.'}
  ]}
];

/* ──────────────────── APP ──────────────────── */
const AF = (() => {
  let cat = null;
  let estado = {sede:'',sedeName:'',curso:'',cursoNombre:'',nivel:'',formato:'',formatoNombre:'',ritmo:'',ritmoNombre:'',ritmoDetalle:'',docente:'',docenteModalidad:'',step:1};

  function init(){
    if(window.emailjs){ try{ emailjs.init(EMAILJS_PK); }catch(e){ console.warn('[EmailJS]',e); } }
    initSupabase();
    renderStats();
    renderPorqueFromFallback();
    renderCursosFromFallback();
    renderDELF();
    renderEventos();
    renderFAQ();
    loadCatalog();
    initNavScroll();
    injectWaCtas();
    renderParcours();
    loadEvidencias();
    initAutosavePreinsc();
    aplicarPrefillDesdeURL();
  }

  let sb = null;
  function initSupabase(){
    if(!window.supabase || !window.AF_CONFIG?.isSupabaseConfigured?.()) return;
    try{
      sb = window.supabase.createClient(
        window.AF_CONFIG.supabase.url,
        window.AF_CONFIG.supabase.anonKey
      );
      console.info('[Supabase] cliente listo');
      cargarEventosDesdeDB();
    } catch(e){ console.warn('[Supabase] init falló', e); }
  }

  async function cargarEventosDesdeDB(){
    if(!sb) return;
    const hoy = new Date().toISOString().slice(0,10);
    const {data, error} = await sb.from('eventos')
      .select('*').eq('publicado', true).gte('fecha', hoy)
      .order('fecha', {ascending:true}).limit(12);
    if(error || !data?.length){ console.info('[Eventos] usando fallback inline'); return; }
    window.EVENTOS_OVERRIDE = data.map(e => ({
      t:    e.titulo,
      f:    e.fecha,
      h:    e.hora ? e.hora.slice(0,5) : '—',
      l:    e.lugar || 'Por confirmar',
      cat:  e.categoria || 'Evento',
      libre: e.entrada_libre,
      modo: e.modo
    }));
    renderEventos();
  }

  function injectWaCtas(){
    const phone  = '529671721870';
    const phoneFmt = '+52 1 967 172 1870';
    document.querySelectorAll('section[data-wa-section]').forEach(sec => {
      const label = sec.dataset.waSection;
      const msg = `Hola, vi la sección de ${label} en el sitio de Alliance Française San Cristóbal y deseo más información.`;
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
      const html = `
        <div class="wa-cta">
          <div class="wa-cta-text">¿Desea más información sobre <strong>${label}</strong>? Contáctanos por WhatsApp.</div>
          <a class="wa-cta-btn" href="${url}" target="_blank" rel="noopener">
            <i class="fab fa-whatsapp"></i> WhatsApp ${phoneFmt}
          </a>
        </div>`;
      const container = sec.querySelector(':scope > .container');
      if(container) container.insertAdjacentHTML('beforeend', html);
    });
  }

  async function loadCatalog(){
    // 1) Prioridad: Supabase v_catalogo (admin editable, Fase 6)
    if(sb){
      const {data, error} = await sb.from('v_catalogo').select('*');
      if(!error && data?.length){
        cat = { segmentos: data.map(c => ({
          id: c.id, nombre: c.nombre, subtitulo: c.subtitulo, edad: c.edad,
          icono: c.icono, color: c.color, descripcion: c.descripcion,
          niveles: c.niveles || [], modalidades: c.modalidades || []
        }))};
        renderCursos(cat.segmentos);
        populateCursoSelect();
        restaurarBorrador();
        return;
      }
    }
    // 2) Fallback: JSON estático
    fetch('src/assets/data/cursos/catalogo_cursos.json')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => {
        cat = d;
        if(d.por_que_estudiar) renderPorque(d.por_que_estudiar);
        if(d.segmentos) renderCursos(d.segmentos);
        populateCursoSelect();
        restaurarBorrador();
      })
      .catch(err => {
        console.warn('[Catálogo] usando fallback inline:',err);
        populateCursoSelectFallback();
        restaurarBorrador();
      });
  }

  function initNavScroll(){
    const nav = document.querySelector('.nav');
    let last = 0;
    window.addEventListener('scroll',()=>{
      const y = window.scrollY;
      nav.style.boxShadow = y > 40 ? '0 8px 32px rgba(0,0,0,0.3)' : 'none';
      last = y;
    },{passive:true});
  }

  function toggleMenu(){
    document.getElementById('nav-links')?.classList.toggle('open');
  }

  document.addEventListener('click', e => {
    if(e.target.matches('.nav-links a')) {
      document.getElementById('nav-links')?.classList.remove('open');
    }
  });

  /* ─── Render ─── */
  function renderStats(){
    const c = document.getElementById('stats-container');
    if(!c) return;
    c.innerHTML = STATS.map(s => `
      <div class="stat-card">
        <span class="stat-num">${s.n}<sup>${s.s}</sup></span>
        <span class="stat-label">${s.l}</span>
      </div>`).join('');
  }

  function renderPorqueFromFallback(){ renderPorque(PORQUE_FALLBACK.map(p=>({icono:p.i,titulo:p.t,texto:p.d}))); }
  function renderPorque(items){
    const c = document.getElementById('porque-container');
    if(!c) return;
    c.innerHTML = items.map(p => `
      <div class="glass porque-card">
        <div class="porque-icon-wrap"><i class="fa ${p.icono}"></i></div>
        <h3 class="porque-titulo">${p.titulo}</h3>
        <p class="porque-texto">${p.texto}</p>
      </div>`).join('');
  }

  function renderCursosFromFallback(){
    renderCursos(CURSOS_FALLBACK.map(c => ({
      id:c.id, icono:c.i, nombre:c.n, edad:c.e, descripcion:c.d,
      modalidades:c.tags.map(t => ({nombre:t}))
    })));
  }
  function renderCursos(segmentos){
    const c = document.getElementById('cursos-container');
    if(!c) return;
    c.innerHTML = segmentos.map(s => {
      const tags = (s.modalidades||[]).slice(0,4).map(m => {
        const nombre = m.nombre || m;
        const isVirtual = /virtual/i.test(nombre);
        return `<span class="tag ${isVirtual?'virtual':''}">${nombre}</span>`;
      }).join('');
      const mega = (s.nombre||'').slice(0,1).toUpperCase();
      const ciclo = CICLOS_POR_SEG[s.id] || CICLOS_POR_SEG.default;
      return `
      <div class="glass curso-card" data-seg="${s.id}" data-mega="${mega}"
           onclick="AF.irA('${s.id}')" role="button" tabindex="0"
           onkeypress="if(event.key==='Enter')AF.irA('${s.id}')">
        <div class="curso-icon"><i class="fa ${s.icono||'fa-book'}"></i></div>
        <h3 class="curso-nombre">${s.nombre}</h3>
        <p class="curso-edad">${s.edad||''}</p>
        <span class="curso-ciclo-badge"><i class="fa fa-calendar-week"></i> Ciclo · 6 semanas · ${ciclo}</span>
        <p class="curso-desc">${s.descripcion||''}</p>
        <div class="curso-tags">${tags}</div>
        <p class="curso-cta">Inscribirme <i class="fa fa-arrow-right"></i></p>
      </div>`;
    }).join('');
  }

  function renderDELF(){
    const c = document.getElementById('delf-container');
    if(!c) return;
    c.innerHTML = DELF.map(d => `
      <div class="glass delf-card">
        <span class="delf-nivel" style="color:${d.c}">${d.n}</span>
        <p class="delf-desc">${d.desc}</p>
        <p class="delf-familia">${d.f} ${d.n}</p>
        <p class="delf-precio">${d.hrs}<span> · estimado</span></p>
        <button type="button" class="btn btn-secondary" style="width:100%;justify-content:center;font-size:0.55rem"
                onclick="AF.irA('delf_prep','${d.n}')">Prepararme</button>
      </div>`).join('');
  }

  function renderEventos(){
    const c = document.getElementById('eventos-container');
    if(!c) return;
    const lista = window.EVENTOS_OVERRIDE || EVENTOS;
    c.innerHTML = lista.map(ev => {
      const d = new Date(ev.f);
      const dia = d.getDate();
      const mes = d.toLocaleDateString('es-MX',{month:'short'}).toUpperCase().replace('.','');
      const modoBadge = ev.modo === 'virtual' ? '<span class="badge badge-cyan">Virtual</span>' : '';
      return `<div class="glass evento-card">
        <div class="evento-fecha">
          <span class="evento-dia">${dia}</span>
          <span class="evento-mes">${mes}</span>
        </div>
        <div>
          <h3 class="evento-titulo">${ev.t}</h3>
          <p class="evento-meta"><i class="fa fa-clock"></i> ${ev.h} h</p>
          <p class="evento-meta"><i class="fa fa-map-marker-alt"></i> ${ev.l}</p>
          <p class="evento-meta"><i class="fa fa-tag"></i> ${ev.cat}</p>
          <span class="badge ${ev.libre?'badge-green':'badge-red'}">${ev.libre?'Entrada libre':'Inscripción requerida'}</span>
          ${modoBadge}
        </div>
      </div>`;
    }).join('');
  }

  function renderFAQ(){
    const c = document.getElementById('faq-container');
    if(!c) return;
    c.innerHTML = FAQ.map((g,gi) => `
      <div class="faq-grupo">
        <h3 class="faq-grupo-titulo"><i class="fa fa-layer-group"></i> ${g.cat}</h3>
        ${g.qs.map((q,i)=>`
          <div class="faq-item" id="fi-${gi}-${i}">
            <button type="button" class="faq-q" onclick="AF.toggleFAQ('fi-${gi}-${i}')"
                    aria-expanded="false">
              <span>${q.q}</span>
              <i class="fa fa-chevron-down faq-chevron" aria-hidden="true"></i>
            </button>
            <div class="faq-a"><p>${q.a}</p></div>
          </div>`).join('')}
      </div>`).join('');
  }

  function toggleFAQ(id){
    const el = document.getElementById(id);
    if(!el) return;
    const open = el.classList.toggle('open');
    el.querySelector('.faq-q')?.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  /* ─── Catálogo en selects ─── */
  function populateCursoSelect(){
    const sel = document.getElementById('f-curso');
    if(!sel || !cat?.segmentos) return;
    sel.innerHTML = '<option value="">Selecciona…</option>' +
      cat.segmentos.map(s => `<option value="${s.id}">${s.nombre} · ${s.edad||''}</option>`).join('');
  }
  function populateCursoSelectFallback(){
    const sel = document.getElementById('f-curso');
    if(!sel) return;
    sel.innerHTML = '<option value="">Selecciona…</option>' +
      CURSOS_FALLBACK.map(c => `<option value="${c.id}">${c.n} · ${c.e}</option>`).join('');
  }

  function updateModalidades(){
    const cid = document.getElementById('f-curso')?.value;
    const sn = document.getElementById('f-nivel');
    if(!cid){
      sn.innerHTML = '<option value="">Selecciona programa primero</option>';
      return;
    }
    const seg = cat?.segmentos?.find(s => s.id === cid);
    const nivelesAdmin = (seg?.niveles || []).filter(Boolean);
    const opcionesNivel = nivelesAdmin.length
      ? nivelesAdmin.map(n => `<option value="${n.codigo}">${n.codigo} · ${n.nombre}</option>`).join('')
      : NIVELES_ESTANDAR.map(n => `<option value="${n.codigo}">${n.nombre}</option>`).join('');
    const opcionesDiploma = NIVELES_DIPLOMA.map(n => `<option value="${n.codigo}">${n.nombre}</option>`).join('');
    sn.innerHTML = '<option value="">Sin definir (haremos prueba)</option>' + opcionesDiploma + opcionesNivel;
    estado.curso = cid;
    estado.cursoNombre = seg?.nombre || CURSOS_FALLBACK.find(c=>c.id===cid)?.n || cid;
    actualizarResumen();
    guardarBorrador();
  }

  function setFormato(id, nombre){
    estado.formato = id;
    estado.formatoNombre = nombre;
    document.querySelectorAll('[data-formato]').forEach(b => b.classList.toggle('active', b.dataset.formato === id));
    actualizarResumen();
    guardarBorrador();
  }

  function setRitmo(id, nombre, detalle){
    estado.ritmo = id;
    estado.ritmoNombre = nombre;
    estado.ritmoDetalle = detalle || '';
    document.querySelectorAll('[data-ritmo]').forEach(b => b.classList.toggle('active', b.dataset.ritmo === id));
    actualizarResumen();
    guardarBorrador();
  }

  function actualizarResumen(){
    const curso = document.getElementById('f-curso')?.value;
    const nivel = document.getElementById('f-nivel')?.value;
    const box   = document.getElementById('resumen-box');
    const txt   = document.getElementById('resumen-texto');
    if(!box||!txt) return;
    if(curso && estado.formato && estado.ritmo){
      const cNom = estado.cursoNombre || curso;
      const nNom = nivel || 'nivel por evaluar';
      txt.textContent = `${cNom} · ${nNom} · ${estado.formatoNombre} · ${estado.ritmoNombre}`;
      box.style.display = 'block';
      estado.nivel = nivel;
    } else {
      box.style.display = 'none';
    }
  }

  function llenarResumenFinal(){
    const set = (id,val) => { const el = document.getElementById(id); if(el) el.textContent = val || '—'; };
    set('sum-sede',    estado.sedeName);
    set('sum-curso',   estado.cursoNombre);
    set('sum-nivel',   estado.nivel || 'por evaluar (prueba gratuita)');
    set('sum-formato', estado.formatoNombre);
    set('sum-ritmo',   estado.ritmoNombre + (estado.ritmoDetalle ? ' · ' + estado.ritmoDetalle : ''));
    set('sum-horas',   horasPorRitmo(estado.ritmo, estado.curso));
    const rowDocente = document.getElementById('sum-docente-row');
    if(rowDocente){
      if(estado.docente){
        set('sum-docente', estado.docente + (estado.docenteModalidad ? ' · ' + (estado.docenteModalidad === 'particular' ? 'Clase particular' : 'Clase en grupo') : ''));
        rowDocente.style.display = '';
      } else {
        rowDocente.style.display = 'none';
      }
    }
  }

  function horasPorRitmo(ritmo, curso){
    if(curso === 'ninos')   return '18 h en 6 semanas (3 h/semana)';
    if(curso === 'junior')  return '24 h en 6 semanas (4 h/semana)';
    if(curso === 'turismo') return '36 h en 6 semanas (módulos)';
    if(curso === 'delf_prep') return '18 h en 3 semanas (pre-examen)';
    switch(ritmo){
      case 'regular':        return '24 h en 6 semanas (4 h/semana)';
      case 'intensivo':      return '48 h en 6 semanas (8 h/semana)';
      case 'superintensivo': return '72 h en 6 semanas (12 h/semana)';
      case 'sabatino':       return '24 h en 6 semanas (4 h/sábado)';
      default: return '24 h en 6 semanas (por confirmar)';
    }
  }

  /* ─── Borrador de preinscripción (localStorage) ───
     Si alguien cierra la pestaña o recarga a medias del formulario, no
     pierde lo que ya llenó — lo recuperamos automáticamente al volver. */
  const DRAFT_KEY = 'af_preinsc_draft';
  const DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

  function guardarBorrador(){
    if(estado.step > 3) return; // ya enviado, no hay nada que guardar
    try{
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        estado,
        campos: {
          nombre:  document.getElementById('f-nombre')?.value  || '',
          email:   document.getElementById('f-email')?.value   || '',
          tel:     document.getElementById('f-tel')?.value     || '',
          fuente:  document.getElementById('f-fuente')?.value  || '',
          inicio:  document.getElementById('f-inicio')?.value  || '',
          mensaje: document.getElementById('f-mensaje')?.value || '',
        },
        guardadoEn: Date.now()
      }));
    } catch(e){}
  }

  function borrarBorrador(){
    try{ localStorage.removeItem(DRAFT_KEY); } catch(e){}
  }

  function restaurarBorrador(){
    let data;
    try{ data = JSON.parse(localStorage.getItem(DRAFT_KEY)); } catch(e){ return; }
    if(!data?.estado) return;
    if(Date.now() - (data.guardadoEn || 0) > DRAFT_MAX_AGE_MS){ borrarBorrador(); return; }
    if(!data.estado.sede && !data.campos?.nombre && !data.campos?.email && !data.campos?.tel) return;
    if(data.estado.step > 3) return; // estado inconsistente, mejor no restaurar

    Object.assign(estado, data.estado);
    const setVal = (id,v) => { const el = document.getElementById(id); if(el && v) el.value = v; };
    setVal('f-nombre',  data.campos.nombre);
    setVal('f-email',   data.campos.email);
    setVal('f-tel',     data.campos.tel);
    setVal('f-fuente',  data.campos.fuente);
    setVal('f-inicio',  data.campos.inicio);
    setVal('f-mensaje', data.campos.mensaje);
    document.querySelectorAll('.sede-btn').forEach(b => b.classList.toggle('active', b.dataset.sede === estado.sede));
    if(estado.curso){ setVal('f-curso', estado.curso); updateModalidades(); }
    if(estado.nivel){ setVal('f-nivel', estado.nivel); }
    document.querySelectorAll('[data-formato]').forEach(b => b.classList.toggle('active', b.dataset.formato === estado.formato));
    document.querySelectorAll('[data-ritmo]').forEach(b => b.classList.toggle('active', b.dataset.ritmo === estado.ritmo));
    actualizarResumen();
    if(estado.step > 1){
      const destino = estado.step;
      estado.step = 1;
      goToStep(destino);
    }
    mostrarAvisoBorrador();
  }

  function mostrarAvisoBorrador(){
    const shell = document.querySelector('.form-shell');
    if(!shell || shell.querySelector('.draft-banner')) return;
    const div = document.createElement('div');
    div.className = 'draft-banner';
    div.innerHTML = `<i class="fa fa-clock-rotate-left"></i> Recuperamos tu preinscripción en progreso.
      <button type="button">Empezar de nuevo</button>`;
    div.querySelector('button').onclick = () => { resetForm(); div.remove(); };
    shell.prepend(div);
  }

  function initAutosavePreinsc(){
    ['f-nombre','f-email','f-tel','f-fuente','f-inicio','f-mensaje','f-nivel'].forEach(id => {
      const el = document.getElementById(id);
      if(!el) return;
      let t;
      el.addEventListener('input', () => { clearTimeout(t); t = setTimeout(guardarBorrador, 400); });
      el.addEventListener('change', guardarBorrador);
    });
  }

  /* ─── Stepper ─── */
  function updateStepper(){
    const lis = document.querySelectorAll('#form-stepper li');
    lis.forEach((li,i) => {
      li.classList.remove('active','done');
      if(i+1 < estado.step) li.classList.add('done');
      else if(i+1 === estado.step) li.classList.add('active');
    });
    if(estado.step === 4){
      lis.forEach(li => li.classList.remove('active'));
      lis.forEach(li => li.classList.add('done'));
    }
  }

  function selectSede(sedeId, sedeNombre){
    estado.sede = sedeId;
    estado.sedeName = sedeNombre;
    document.querySelectorAll('.sede-btn').forEach(b => b.classList.toggle('active', b.dataset.sede === sedeId));
    goToStep(2);
    guardarBorrador();
  }

  function goToStep(n){
    if(n === 2 && !estado.sede){
      alert('Por favor elige dónde quieres estudiar.');
      return;
    }
    if(n === 3){
      if(!estado.sede){ alert('Elige primero dónde quieres estudiar.'); goToStep(1); return; }
      if(!document.getElementById('f-curso')?.value){ alert('Por favor selecciona un programa.'); return; }
      if(!estado.formato){ alert('Por favor selecciona el formato (Individual o Grupal).'); return; }
      if(!estado.ritmo){ alert('Por favor selecciona el ritmo de estudio.'); return; }
      llenarResumenFinal();
    }
    if(n === 99) estado.step = 4;
    else estado.step = n;
    document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
    document.getElementById('step-' + (n === 99 ? 'ok' : n))?.classList.add('active');
    updateStepper();
    document.getElementById('preinscripcion')?.scrollIntoView({behavior:'smooth',block:'start'});
    if(n !== 99) guardarBorrador();
  }

  // La preinscripción vive en su propia página (preinscripcion.html). Las
  // tarjetas de "ciclo" y "docente" de otras páginas ya no pueden rellenar el
  // formulario en el sitio (no comparten DOM) — en su lugar navegan ahí con
  // los datos como parámetros de URL, y aplicarPrefillDesdeURL() los replica
  // al cargar. Si por lo que sea el formulario ya está en la página actual,
  // se aplica directo sin ir a ningún lado.
  function irAPreinscripcion(params, aplicar){
    const sec = document.getElementById('preinscripcion');
    if(!sec){
      const qs = new URLSearchParams(Object.entries(params).filter(([,v]) => v != null && v !== ''));
      location.href = 'preinscripcion.html?' + qs.toString();
      return;
    }
    sec.scrollIntoView({behavior:'smooth'});
    aplicar();
  }

  function irA(cursoId, nivelId){
    irAPreinscripcion({ir:'curso', curso:cursoId, nivel:nivelId}, () => {
      if(!estado.sede) selectSede('virtual','AF Virtual');
      else goToStep(2);
      if(cursoId){
        setTimeout(() => {
          const sel = document.getElementById('f-curso');
          if(sel){ sel.value = cursoId; updateModalidades(); }
          if(nivelId){
            const sn = document.getElementById('f-nivel');
            if(sn) sn.value = nivelId;
            actualizarResumen();
          }
        },400);
      }
    });
  }

  // Clic en una tarjeta de "Ciclo estándar de 6 semanas" → recorrido fluido:
  // salta directo al formulario de preinscripción (paso 3) con programa,
  // formato y ritmo ya elegidos.
  function irAConfig(cursoId, formato, formatoNombre, ritmo, ritmoNombre, ritmoDetalle){
    irAPreinscripcion({ir:'config', curso:cursoId, formato, formatoNombre, ritmo, ritmoNombre, ritmoDetalle}, () => {
      if(!estado.sede) selectSede('virtual','AF Virtual');
      setTimeout(() => {
        const sel = document.getElementById('f-curso');
        if(sel){ sel.value = cursoId; updateModalidades(); }
        setFormato(formato, formatoNombre);
        setRitmo(ritmo, ritmoNombre, ritmoDetalle || '');
        goToStep(3);
      }, 400);
    });
  }

  // Clic en "Inscríbete conmigo" desde la tarjeta de un docente → elige
  // particular o grupo y salta a la preinscripción con ambos datos guardados,
  // para que coordinación pueda enrutar la solicitud al profesor correcto.
  function irADocente(docenteNombre, modalidad){
    irAPreinscripcion({ir:'docente', docente:docenteNombre, docenteModalidad:modalidad}, () => {
      estado.docente = docenteNombre;
      estado.docenteModalidad = modalidad;
      if(!estado.sede) selectSede('virtual','AF Virtual');
      else goToStep(2);
      setTimeout(() => {
        setFormato(modalidad === 'particular' ? 'individual' : 'grupal', modalidad === 'particular' ? 'Individual (1 a 1)' : 'Grupal');
        const msgEl = document.getElementById('f-mensaje');
        if(msgEl && !msgEl.value.trim()){
          msgEl.value = `Me gustaría tomar clases ${modalidad === 'particular' ? 'particulares' : 'en grupo'} con ${docenteNombre}.`;
        }
        actualizarResumen();
        guardarBorrador();
      }, 400);
    });
  }

  // Al llegar a preinscripcion.html con parámetros (desde otra página),
  // repite exactamente lo que irA/irAConfig/irADocente/selectSede hacían
  // en el sitio de una sola página.
  function aplicarPrefillDesdeURL(){
    const qp = new URLSearchParams(location.search);
    const sede = qp.get('sede');
    if(sede && document.querySelector('.sede-btn[data-sede="' + sede + '"]')){
      selectSede(sede, sede === 'virtual' ? 'AF Virtual' : 'San Cristóbal (presencial)');
    }
    switch(qp.get('ir')){
      case 'curso':
        irA(qp.get('curso') || '', qp.get('nivel') || '');
        break;
      case 'config':
        irAConfig(qp.get('curso') || '', qp.get('formato') || '', qp.get('formatoNombre') || '',
          qp.get('ritmo') || '', qp.get('ritmoNombre') || '', qp.get('ritmoDetalle') || '');
        break;
      case 'docente':
        irADocente(qp.get('docente') || '', qp.get('docenteModalidad') || '');
        break;
    }
  }

  // Revela los botones "Clase particular" / "Clase en grupo" bajo el CTA
  // de un docente. Cierra cualquier otra tarjeta que haya quedado abierta.
  function toggleDocenteChoice(id){
    document.querySelectorAll('.docente-choice').forEach(el => {
      if(el.id !== id) el.classList.remove('show');
    });
    document.getElementById(id)?.classList.toggle('show');
  }

  /* ─── Validación y envío ─── */
  function validateField(id, errId, test){
    const el = document.getElementById(id);
    const er = document.getElementById(errId);
    const ok = test(el?.value?.trim() || '');
    if(el) el.classList.toggle('error', !ok);
    if(er) er.classList.toggle('show', !ok);
    return ok;
  }

  function generarFolio(){
    const d = new Date();
    const stamp = d.getFullYear().toString().slice(2) +
                  String(d.getMonth()+1).padStart(2,'0') +
                  String(d.getDate()).padStart(2,'0');
    const rand = Math.random().toString(36).slice(2,6).toUpperCase();
    return `AF-${stamp}-${rand}`;
  }

  async function enviarPreinscripcion(){
    const okN = validateField('f-nombre','err-nombre', v => v.length >= 2);
    const okE = validateField('f-email','err-email',  v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
    const okT = validateField('f-tel','err-tel',      v => v.replace(/\D/g,'').length >= 8);
    if(!okN || !okE || !okT) return;

    const btn = document.getElementById('btn-enviar');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Enviando…';

    const folio = generarFolio();
    const ahora = new Date().toLocaleString('es-MX');
    const nombre = document.getElementById('f-nombre').value.trim();
    const email  = document.getElementById('f-email').value.trim();
    const tel    = document.getElementById('f-tel').value.trim();

    const payload = {
      folio,
      sede:      estado.sedeName,
      curso:     estado.cursoNombre || estado.curso,
      nivel:     estado.nivel || '(por evaluar)',
      formato:   estado.formatoNombre || estado.formato || '(no indicado)',
      ritmo:     estado.ritmoNombre + (estado.ritmoDetalle ? ' (' + estado.ritmoDetalle + ')' : ''),
      nombre,
      email_estudiante: email,
      telefono:  tel,
      fuente:    document.getElementById('f-fuente').value || 'No indicado',
      inicio:    document.getElementById('f-inicio').value || 'lo_antes_posible',
      mensaje:   document.getElementById('f-mensaje').value.trim() || '(Sin mensaje)',
      docente_solicitado: estado.docente || '(No indicado)',
      docente_modalidad:  estado.docenteModalidad === 'particular' ? 'Clase particular' : (estado.docenteModalidad === 'grupo' ? 'Clase en grupo' : '(No indicado)'),
      fecha:     ahora,
      to_email:  'afsancris@gmail.com'
    };

    try{
      // 1) Persistencia en Supabase (si está configurado)
      if(sb){
        const ins = {
          folio,
          sede: estado.sede,
          curso_id: estado.curso,
          curso_nombre: estado.cursoNombre,
          nivel: estado.nivel || null,
          formato: estado.formato || null,
          ritmo: estado.ritmo || null,
          inicio: payload.inicio,
          nombre,
          email,
          telefono: tel,
          fuente: payload.fuente,
          mensaje: payload.mensaje === '(Sin mensaje)' ? null : payload.mensaje,
          docente_solicitado: estado.docente || null,
          docente_modalidad: estado.docenteModalidad || null
        };
        const {error: dbErr} = await sb.from('inscripciones').insert(ins);
        if(dbErr) console.warn('[Supabase] insert falló (se continúa con EmailJS):', dbErr);
      }

      // 2) Notificación por correo (siempre)
      if(!window.emailjs) throw new Error('EmailJS no cargado');
      await emailjs.send(EMAILJS_SID, EMAILJS_TID, payload);

      // 3) Confirmación visual con datos del estudiante y promesa 48h
      document.getElementById('confirm-nombre').textContent = nombre.split(/\s+/)[0] || 'estudiante';
      document.getElementById('confirm-sede').textContent   = estado.sedeName;
      document.getElementById('confirm-folio').textContent  = folio;
      document.getElementById('confirm-fecha').textContent  = ahora;

      // 4) Botón WhatsApp con mensaje pre-rellenado de cierre por parte del estudiante
      const waMsg = `Hola, soy ${nombre}. Acabo de enviar mi solicitud de preinscripción (folio ${folio}) para ${payload.curso} · ${payload.formato} · ${payload.ritmo} en ${estado.sedeName}. Quedo atento(a) a su respuesta. ¡Gracias!`;
      const waUrl = `https://wa.me/529671721870?text=${encodeURIComponent(waMsg)}`;
      const waBtn = document.getElementById('confirm-wa-btn');
      if(waBtn) waBtn.href = waUrl;

      goToStep(99);
      borrarBorrador();
    } catch(err){
      console.error('[EmailJS]',err);
      alert('Hubo un problema al enviar tu solicitud. Por favor escríbenos directamente a afsancris@gmail.com o por WhatsApp al +52 1 967 172 1870.');
      btn.disabled = false;
      btn.innerHTML = '<i class="fa fa-paper-plane"></i> Enviar solicitud';
    }
  }

  function resetForm(){
    borrarBorrador();
    estado = {sede:'',sedeName:'',curso:'',cursoNombre:'',nivel:'',formato:'',formatoNombre:'',ritmo:'',ritmoNombre:'',ritmoDetalle:'',docente:'',docenteModalidad:'',step:1};
    ['f-nombre','f-email','f-tel','f-mensaje'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
    ['f-curso','f-nivel','f-fuente','f-inicio'].forEach(id => { const el=document.getElementById(id); if(el) el.selectedIndex=0; });
    document.querySelectorAll('.sede-btn, .opt-pick').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.af-input,.af-select').forEach(e => e.classList.remove('error'));
    document.querySelectorAll('.form-error').forEach(e => e.classList.remove('show'));
    const box = document.getElementById('resumen-box'); if(box) box.style.display='none';
    const btn = document.getElementById('btn-enviar');
    if(btn){ btn.disabled = false; btn.innerHTML = '<i class="fa fa-paper-plane"></i> Enviar solicitud'; }
    goToStep(1);
  }

  function toggleLang(){
    const cur = document.documentElement.lang || 'es';
    applyI18n(cur === 'es' ? 'fr' : 'es');
  }

  // ──────────────── Le parcours · escalera MCER ────────────────
  // Datos tomados del catálogo real (segmento adultos) y de delf_dalf.json.
  const PARCOURS = [
    {c:'A1', n:'Débutant',      h:'120 h',   dip:'DELF A1', ex:'1h 20min', d:'Primeros pasos. Presentaciones, saludos, familia, números. Base del idioma.'},
    {c:'A2', n:'Élémentaire',   h:'120 h',   dip:'DELF A2', ex:'1h 45min', d:'Comunicación básica. Compras, transporte, trabajo, gustos y preferencias.'},
    {c:'B1', n:'Intermédiaire', h:'270 h',   dip:'DELF B1', ex:'2h 50min', d:'Independencia lingüística. Viajes, medios, opiniones, narraciones.'},
    {c:'B2', n:'Avancé',        h:'270 h',   dip:'DELF B2', ex:'3h 30min', d:'Fluidez funcional. Textos complejos, debates, argumentación formal.'},
    {c:'C1', n:'Autonome',      h:'Variable', dip:'DALF C1', ex:'4h',       d:'Dominio avanzado. Textos académicos, uso flexible en entornos profesionales.'},
    {c:'C2', n:'Maîtrise',      h:'Variable', dip:'DALF C2', ex:'5h',       d:'Nivel bilingüe. Comprensión plena y expresión con total naturalidad.'}
  ];

  function renderParcours(){
    const c = document.getElementById('parcours-ladder');
    if(!c) return;
    c.innerHTML = PARCOURS.map((n, i) => {
      const pct = Math.round((i + 1) / PARCOURS.length * 100);
      return `
      <li class="niv" data-nivel="${n.c}" data-open="0">
        <button type="button" class="niv-btn" aria-expanded="false" aria-controls="niv-p-${n.c}">
          <span class="niv-code">${n.c}</span>
          <span class="niv-main">
            <span class="niv-name">${n.n}</span>
            <span class="niv-desc">${n.d}</span>
          </span>
          <span class="niv-hrs">${n.h} <i class="fa fa-chevron-down" aria-hidden="true"></i></span>
        </button>
        <div class="niv-rail" aria-hidden="true"><span style="width:${pct}%"></span></div>
        <div class="niv-panel" id="niv-p-${n.c}">
          <div><div class="niv-panel-in">
            <span class="niv-chip">Diploma <b>${n.dip}</b></span>
            <span class="niv-chip">Examen <b>${n.ex}</b></span>
            <span class="niv-chip">Carga <b>${n.h}</b></span>
          </div></div>
        </div>
      </li>`;
    }).join('');

    c.querySelectorAll('.niv-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const li = btn.closest('.niv');
        const abierto = li.getAttribute('data-open') === '1';
        li.setAttribute('data-open', abierto ? '0' : '1');
        btn.setAttribute('aria-expanded', abierto ? 'false' : 'true');
      });
    });
  }

  // ──────────────── Evidencias de calidad ────────────────
  // Solo se pinta si hay datos reales. Sin datos, la sección queda oculta:
  // preferimos no mostrar nada antes que mostrar una cifra inventada.
  function renderEvidencias(res){
    const box  = document.getElementById('evidencias');
    const grid = document.getElementById('evid-grid');
    const nota = document.getElementById('evid-note');
    if(!box || !grid || !res) return;

    const partir = v => {
      const m = String(v || '').match(/^([\d.,]+)\s*(%|\+)?/);
      return m ? { n: m[1], s: m[2] || '' } : null;
    };

    const tarjetas = [];
    const aprob = partir(res.tasa_aprobacion);
    if(aprob) tarjetas.push({ n: aprob.n, s: aprob.s, l: 'de aprobación en ' + (res.sesion || 'la última sesión DELF') });
    if(Array.isArray(res.niveles_aplicados) && res.niveles_aplicados.length){
      tarjetas.push({ n: String(res.niveles_aplicados.length), s: '',
                      l: 'niveles presentados · ' + res.niveles_aplicados.join(' · ') });
    }
    const crec = partir(res.crecimiento_participacion);
    if(crec) tarjetas.push({ n: crec.n, s: crec.s, l: 'de crecimiento en participación' });

    if(!tarjetas.length) return;

    grid.innerHTML = tarjetas.map(t =>
      `<div class="evid-card"><b>${t.n}${t.s ? `<sup>${t.s}</sup>` : ''}</b><span>${t.l}</span></div>`
    ).join('');
    nota.innerHTML = res.nota ? `<i class="fa fa-circle-check"></i>${res.nota}` : '';
    box.hidden = false;
  }

  function loadEvidencias(){
    fetch('src/assets/data/cursos/delf_dalf.json')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => renderEvidencias(d && d.resultados_historicos))
      .catch(e => console.info('[Evidencias] sin datos publicables', e));
  }

  return { init, toggleMenu, selectSede, goToStep, irA, irAConfig, irADocente, toggleDocenteChoice, updateModalidades, setFormato, setRitmo, actualizarResumen, enviarPreinscripcion, resetForm, toggleFAQ, toggleLang, renderParcours, renderEvidencias };
})();

// ──────────────────── i18n (es/fr) ────────────────────
const I18N = {
  es: {
    'nav.nosotros':'Nosotros','nav.cursos':'Cursos','nav.certificaciones':'Certificaciones',
    'nav.cultura':'Cultura','nav.francia':'Francia','nav.miEspacio':'Mi espacio',
    'nav.contacto':'Contacto','nav.inscribirme':'Inscribirme',
    'hero.pill':'Alliance Française 100% en línea · ¡Damos el vuelco!',
    'hero.t1':'Aprende francés','hero.t2':'100% en línea.',
    'hero.t3':'Desde donde estés, hacia donde sueñes.',
    'hero.tagline':'Damos un vuelco innovador: la Alliance Française San Cristóbal ahora es 100% virtual. Clases en vivo con profesores certificados, tutor de IA 24/7, comunidad francófona global y preparación oficial DELF/DALF. Sin presencial. Sin desplazamientos. Abierta al mundo entero.',
    'hero.cta1':'Inscribirme ahora','hero.cta2':'Empezar preinscripción',
  },
  fr: {
    'nav.nosotros':'À propos','nav.cursos':'Cours','nav.certificaciones':'Certifications',
    'nav.cultura':'Culture','nav.francia':'France','nav.miEspacio':'Mon espace',
    'nav.contacto':'Contact','nav.inscribirme':"M'inscrire",
    'hero.pill':"Alliance Française 100% en ligne · Nous prenons le virage !",
    'hero.t1':'Apprends le français','hero.t2':'100% en ligne.',
    'hero.t3':"D'où que tu sois, vers où tu rêves.",
    'hero.tagline':"Nous prenons un virage innovant : l'Alliance Française San Cristóbal est désormais 100% virtuelle. Cours en direct, tuteur IA 24h/24, communauté francophone mondiale, préparation officielle DELF/DALF. Sans présentiel. Sans déplacements. Ouverte au monde entier.",
    'hero.cta1':"M'inscrire maintenant",'hero.cta2':'Commencer ma préinscription',
  }
};

function applyI18n(lang){
  document.documentElement.lang = lang;
  try { localStorage.setItem('af_lang', lang); } catch(e){}
  const dict = I18N[lang] || I18N.es;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (!dict[key]) return;
    const icon = el.querySelector('i');
    if (icon) { el.childNodes[0].textContent = dict[key] + ' '; }
    else { el.textContent = dict[key]; }
  });
}

// Service Worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/af-chiapas-web/sw.js').catch(err => console.warn('[SW]', err));
  });
}


// ──────────────────── COUNTDOWN AL NUEVO CICLO ────────────────────
// ⚙️ FECHAS OFICIALES — editar aquí si el Consejo las cambia
const AF_INICIO_CICLO = new Date('2026-09-28T09:00:00-06:00'); // primer día de clases

// El aviso de "inscripciones abiertas" deja de tener sentido una vez que
// el ciclo ya arrancó, así que se retira solo en esa fecha.
function tickAvisoAtencion(){
  const av = document.getElementById('aviso-atencion');
  if(!av) return;
  if(new Date() >= AF_INICIO_CICLO) av.remove();
}

function tickCountdown(){
  const el = document.getElementById('cd-d');
  if(!el) return;
  const diff = AF_INICIO_CICLO - new Date();
  if(diff <= 0){
    ['cd-d','cd-h','cd-m','cd-s'].forEach(id => {
      const n = document.getElementById(id); if(n) n.textContent = '0';
    });
    const cd = document.getElementById('countdown');
    if(cd) cd.innerHTML = '<div class="cd-box" style="min-width:auto;padding:1rem 2rem">' +
      '<span class="cd-num" style="font-size:1.8rem">¡Ya empezamos!</span>' +
      '<span class="cd-lab">Consulta grupos abiertos</span></div>';
    return;
  }
  const d = Math.floor(diff / 86400000);
  const h = Math.floor(diff % 86400000 / 3600000);
  const m = Math.floor(diff % 3600000 / 60000);
  const sec = Math.floor(diff % 60000 / 1000);
  const set = (id,v) => { const n = document.getElementById(id); if(n) n.textContent = String(v).padStart(2,'0'); };
  set('cd-d', d); set('cd-h', h); set('cd-m', m); set('cd-s', sec);
}

document.addEventListener('DOMContentLoaded', () => {
  tickCountdown();
  tickAvisoAtencion();
  setInterval(tickCountdown, 1000);
  setInterval(tickAvisoAtencion, 60000);
});

document.addEventListener('DOMContentLoaded', () => {
  const saved = (() => { try { return localStorage.getItem('af_lang'); } catch(e){ return null; } })();
  applyI18n(saved || 'es');
  AF.init();
});