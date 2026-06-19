document.addEventListener('DOMContentLoaded', () => {
    // Consumir la base de datos JSON generada por Python
    fetch('./assets/data/catalogo_oficial.json')
        .then(response => response.json())
        .then(data => {
            renderCertifications(data.certificaciones_delf_dalf);
            renderCourses(data.oferta_academica);
        })
        .catch(error => console.error('[Error de Sistema] No se pudo cargar el catálogo:', error));
});

function renderCertifications(certificaciones) {
    const container = document.getElementById('delf-container');
    if(!container) return;
    
    let html = '';
    certificaciones.forEach(cert => {
        html += 
        <div class="glass-card data-card">
            <h3 class="data-level"> + cert.nivel + </h3>
            <p class="data-desc"> + cert.descripcion + </p>
            <p class="data-price">$ + cert.precio_mxn.toLocaleString('es-MX') +  MXN</p>
            <p class="data-meta"><i class="fa fa-calendar-check"></i>  + cert.meses_aplicacion.join(', ') + </p>
            <a href="#accueil" class="btn btn-outline" style="margin-top:1rem; width:100%; justify-content:center;">S'inscrire</a>
        </div>;
    });
    container.innerHTML = html;
}

function renderCourses(cursos) {
    const container = document.getElementById('cursos-container');
    if(!container) return;
    
    let html = '';
    cursos.forEach(curso => {
        let formatoHorario = curso.carga_horaria ? curso.carga_horaria : curso.ritmos.join(' · ');
        html += 
        <div class="glass-card data-card">
            <h3 class="data-title" style="font-size:1.3rem; margin-bottom:1rem;"> + curso.segmento + </h3>
            <p class="data-meta"><strong>Programme:</strong>  + curso.programa + </p>
            <p class="data-meta"><strong>Rythme:</strong>  + formatoHorario + </p>
            <p class="data-meta"><strong>Objectif:</strong>  + curso.objetivo + </p>
            <a href="#accueil" class="btn btn-red" style="margin-top:1rem; width:100%; justify-content:center;">Plus d'infos</a>
        </div>;
    });
    container.innerHTML = html;
}





// ══════════════════════════════════════════════════════════
// RENDERS ADICIONALES — AF-CHIS-2026-004
// ══════════════════════════════════════════════════════════

// ── Por qué estudiar francés ──────────────────────────────
async function renderPorQue() {
  const c = document.getElementById('porque-container');
  if (!c) return;
  try {
    const data = await fetch('./assets/data/cursos/catalogo_cursos.json')
                       .then(r => r.json());
    c.innerHTML = data.por_que_estudiar.map(item => `
      <div class="porque-card glass-panel">
        <i class="fa ${item.icono} porque-icon"></i>
        <h3 class="porque-titulo">${item.titulo}</h3>
        <p class="porque-texto">${item.texto}</p>
      </div>`
    ).join('');
  } catch(e) { console.error('[AF] porque:', e); }
}

// ── FAQ accordion ─────────────────────────────────────────
async function renderFAQ() {
  const c = document.getElementById('faq-container');
  if (!c) return;
  try {
    const data = await fetch('./assets/data/cursos/faq.json')
                       .then(r => r.json());
    c.innerHTML = data.map(cat => `
      <div class="faq-categoria">
        <h3 class="faq-cat-titulo">
          <i class="fa fa-layer-group"></i> ${cat.categoria}
        </h3>
        ${cat.preguntas.map((item, i) => `
          <div class="faq-item" id="faq-${cat.categoria}-${i}">
            <button class="faq-pregunta"
                    onclick="AF.toggleFAQ('faq-${cat.categoria}-${i}')">
              <span>${item.q}</span>
              <i class="fa fa-chevron-down faq-chevron"></i>
            </button>
            <div class="faq-respuesta">
              <p>${item.a}</p>
            </div>
          </div>`
        ).join('')}
      </div>`
    ).join('');
  } catch(e) { console.error('[AF] faq:', e); }
}

// ── Contador de estadísticas ──────────────────────────────
function renderStats() {
  const c = document.getElementById('stats-container');
  if (!c) return;
  const stats = [
    { numero: '824',  sufijo: '',  label: 'Centros AF en el mundo' },
    { numero: '138',  sufijo: '',  label: 'Países con presencia' },
    { numero: '428K', sufijo: '+', label: 'Estudiantes anuales' },
    { numero: '31',   sufijo: '',  label: 'Sedes en México' },
    { numero: '100',  sufijo: '%', label: 'Aprobación DELF Junior 2026' },
    { numero: '1',    sufijo: '',  label: 'Único centro DELF en Chiapas' }
  ];
  c.innerHTML = stats.map(s => `
    <div class="stat-card glass-panel">
      <span class="stat-numero">${s.numero}<em>${s.sufijo}</em></span>
      <span class="stat-label">${s.label}</span>
    </div>`
  ).join('');
}

// ── Toggle FAQ ────────────────────────────────────────────
function toggleFAQ(id) {
  const item = document.getElementById(id);
  if (!item) return;
  item.classList.toggle('open');
}

// ── Inicializar todos ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderPorQue();
  renderFAQ();
  renderStats();
});
