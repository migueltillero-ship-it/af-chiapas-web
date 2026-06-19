document.addEventListener('DOMContentLoaded', () => {
    // Consumir la base de datos JSON generada por Python
    fetch('assets/data/catalogo_oficial.json')
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
