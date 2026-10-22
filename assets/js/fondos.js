/* Fondos: parallax sutil, video con póster de respaldo y entrada suave.
   Todo se degrada solo: sin JS, con prefers-reduced-motion, con ahorro de datos
   o en pantallas pequeñas se ve el póster/imagen estática. */
(function () {
  'use strict';
  window.__fx = 1;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conn = navigator.connection || {};
  var lite = reduce || conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '');
  var narrow = window.matchMedia && window.matchMedia('(max-width: 700px)').matches;

  /* Video de fondo: solo escritorio con datos normales; si no, queda el póster. */
  function iniciarVideos() {
    var vids = document.querySelectorAll('video.bg-video, video.vid-lazy');
    vids.forEach(function (v) {
      if (lite || narrow) {
        v.removeAttribute('autoplay'); v.pause();
        if (v.classList.contains('vid-lazy')) { /* en móvil: póster y no se descarga nada hasta tocar */
          var fig = v.parentElement, badge = document.createElement('button');
          badge.type = 'button'; badge.className = 'play-badge'; badge.setAttribute('aria-label', 'Reproducir video');
          badge.innerHTML = '<i class="fa fa-play" aria-hidden="true"></i>';
          fig.style.position = 'relative'; fig.insertBefore(badge, v.nextSibling);
          badge.addEventListener('click', function () {
            v.querySelectorAll('source[data-src]').forEach(function (s) { s.src = s.dataset.src; });
            v.load(); v.controls = true; badge.remove();
            var p = v.play(); if (p && p.catch) p.catch(function () {});
          }, { once: true });
        }
        return;
      }
      v.muted = true; v.defaultMuted = true; v.setAttribute('playsinline', '');
      var cargado = false;
      function arrancar() {
        if (!cargado) {
          cargado = true;
          v.querySelectorAll('source[data-src]').forEach(function (s) { s.src = s.dataset.src; });
          v.load();
          v.addEventListener('playing', function () { v.classList.add('on'); }, { once: true });
          v.controls = v.classList.contains('vid-lazy');
        }
        var p = v.play(); if (p && p.catch) p.catch(function () { /* autoplay bloqueado: queda el póster */ });
      }
      /* se descarga y reproduce solo al acercarse; se pausa fuera de pantalla */
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) {
          es.forEach(function (e) { if (e.isIntersecting) arrancar(); else if (cargado) v.pause(); });
        }, { rootMargin: '200px 0px', threshold: 0.01 }).observe(v);
      } else { arrancar(); }
    });
  }

  /* Parallax: desplaza la capa de fondo un % pequeño de su recorrido. */
  function iniciarParallax() {
    if (lite || narrow || !('IntersectionObserver' in window)) return;
    var items = [], activos = new Set(), ticking = false;
    document.querySelectorAll('[data-parallax]').forEach(function (el) {
      var host = el.parentElement;
      items.push({ el: el, host: host, k: parseFloat(el.dataset.parallax) || 0.12 });
    });
    function pintar() {
      ticking = false;
      var vh = window.innerHeight;
      activos.forEach(function (it) {
        var r = it.host.getBoundingClientRect();
        var d = (r.top + r.height / 2 - vh / 2) * -it.k;
        var max = r.height * 0.06;
        d = Math.max(-max, Math.min(max, d));
        it.el.style.transform = 'translate3d(0,' + d.toFixed(1) + 'px,0)';
      });
    }
    function pedir() { if (!ticking) { ticking = true; requestAnimationFrame(pintar); } }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var it = items.find(function (x) { return x.host === e.target; });
        if (!it) return;
        if (e.isIntersecting) activos.add(it); else activos.delete(it);
      });
      pedir();
    }, { rootMargin: '10% 0px' });
    items.forEach(function (it) { io.observe(it.host); });
    window.addEventListener('scroll', pedir, { passive: true });
    window.addEventListener('resize', pedir);
  }

  /* Entrada suave de bloques marcados con .rv */
  function iniciarReveal() {
    var els = document.querySelectorAll('.rv');
    if (!els.length) return;
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting || e.boundingClientRect.bottom < 0) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }


  /* Pista del menú desplegable: en móvil, una vez por sesión, en el inicio */
  function pistaMenu() {
    if (!narrow || !document.getElementById('accueil')) return;
    try { if (sessionStorage.getItem('af_navhint')) return; } catch (e) {}
    var tg = document.querySelector('.nav-toggle'); if (!tg) return;
    var h = document.createElement('div');
    h.className = 'nav-hint'; h.setAttribute('role', 'status');
    h.innerHTML = 'Toca <b>Menú</b> para ver cursos, certificaciones, cultura y más <button type="button" aria-label="Cerrar">OK</button>';
    function cerrar() { if (h.parentNode) h.parentNode.removeChild(h); try { sessionStorage.setItem('af_navhint', '1'); } catch (e) {} }
    h.querySelector('button').addEventListener('click', cerrar);
    tg.addEventListener('click', cerrar, { once: true });
    setTimeout(function () { document.body.appendChild(h); setTimeout(cerrar, 9000); }, 3500);
  }

  /* Hero: partículas orbitando como en el intro + inclinación 3D del escenario */
  function heroFx() {
    var cv = document.querySelector('.hero-fx'); if (!cv || reduce) return;
    var ctx = cv.getContext('2d'), hero = cv.parentElement, W = 0, H = 0, parts = [], run = true;
    var N = narrow ? 50 : 130, dpr = Math.min(window.devicePixelRatio || 1, 2);
    function size() { W = hero.clientWidth; H = hero.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function reset(p, first) {
      p.a = Math.random() * Math.PI * 2; p.r = 0.55 + Math.random() * 0.5; p.s = (0.0016 + Math.random() * 0.0035) * (Math.random() < .5 ? 1 : -1);
      p.z = 1 + Math.random() * 3.2; p.c = Math.random() < .18 ? '218,0,46' : (Math.random() < .5 ? '62,79,86' : '152,17,31'); p.o = .25 + Math.random() * .5; p.w = Math.random() * 6.28;
    }
    for (var i = 0; i < N; i++) { var p = {}; reset(p, true); parts.push(p); }
    function frame(t) {
      if (!run) return;
      ctx.clearRect(0, 0, W, H);
      var st = hero.querySelector('.hero-stage'), cx = W * .74, cy = H * .5, R = Math.min(W, H) * .42;
      if (st && !narrow) { var b = st.getBoundingClientRect(), hb = hero.getBoundingClientRect(); cx = b.left - hb.left + b.width / 2; cy = b.top - hb.top + b.height / 2; R = Math.max(b.width, b.height) * .62; } else { cx = W * .5; cy = H * .72; R = Math.min(W, H) * .5; }
      for (var i = 0; i < parts.length; i++) {
        var q = parts[i]; q.a += q.s;
        var rr = R * q.r * (1 + Math.sin(t / 1600 + q.w) * .04);
        var x = cx + Math.cos(q.a) * rr * 1.05, y = cy + Math.sin(q.a) * rr * .82;
        ctx.beginPath(); ctx.fillStyle = 'rgba(' + q.c + ',' + q.o + ')'; ctx.arc(x, y, q.z, 0, 6.283); ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    size(); window.addEventListener('resize', size);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { var v = es[0].isIntersecting; if (v && !run) { run = true; requestAnimationFrame(frame); } else if (!v) run = false; }).observe(hero);
    requestAnimationFrame(frame);
    var fr = document.querySelector('.stage-frame[data-tilt]');
    if (fr && !narrow && window.matchMedia('(pointer:fine)').matches) {
      hero.addEventListener('pointermove', function (e) { var b = hero.getBoundingClientRect(), x = (e.clientX - b.left) / b.width - .5, y = (e.clientY - b.top) / b.height - .5; fr.style.setProperty('--ry', (x * 14 - 4).toFixed(1) + 'deg'); fr.style.setProperty('--rx', (-y * 10 + 2).toFixed(1) + 'deg'); });
      hero.addEventListener('pointerleave', function () { fr.style.removeProperty('--ry'); fr.style.removeProperty('--rx'); });
    }
  }

  function init() { iniciarVideos(); iniciarParallax(); iniciarReveal(); pistaMenu(); heroFx(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
