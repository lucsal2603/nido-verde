/* Il Nido tra gli Ulivi, versione verde: tutte le animazioni, guidate dallo scroll */
(() => {
  const gsap = window.gsap, ST = window.ScrollTrigger;
  if (!gsap || !ST) return;
  gsap.registerPlugin(ST);
  const html = document.documentElement;
  const RIDOTTO = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const QA = new URLSearchParams(location.search).has('qa');
  const TOUCH = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  const q = (s, r = document) => r.querySelector(s);
  const qa = (s, r = document) => [...r.querySelectorAll(s)];
  const gut = () => Math.min(72, Math.max(20, window.innerWidth * .05));
  const vh = () => window.innerHeight;
  html.classList.add('js');
  if (RIDOTTO || QA) html.classList.add('is-statico');

  /* ── scroll morbido ── */
  let lenis = null;
  if (!QA && !RIDOTTO && window.Lenis) {
    lenis = new window.Lenis({ lerp: .1, smoothWheel: true });
    lenis.on('scroll', ST.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const vaiA = (el) => { if (lenis) lenis.scrollTo(el, { offset: -72, duration: 1.4 }); else el.scrollIntoView({ behavior: RIDOTTO ? 'auto' : 'smooth' }); };

  /* ── menu mobile ── */
  const menu = q('#menu'), menuBottone = q('#menuBottone');
  let menuAperto = false;
  const apriMenu = () => {
    if (menuAperto) return; menuAperto = true;
    menu.hidden = false; html.classList.add('is-menu'); menuBottone.setAttribute('aria-expanded', 'true'); lenis?.stop();
    gsap.fromTo(menu, { clipPath: 'circle(0% at calc(100% - 44px) 42px)' }, { clipPath: 'circle(150% at calc(100% - 44px) 42px)', duration: .8, ease: 'power3.inOut' });
    gsap.fromTo(qa('.menu > a, .menu__contatti', menu), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: .7, ease: 'power3.out', stagger: .06, delay: .25 });
  };
  const chiudiMenu = () => {
    if (!menuAperto) return; menuAperto = false;
    html.classList.remove('is-menu'); menuBottone.setAttribute('aria-expanded', 'false');
    gsap.to(menu, { clipPath: 'circle(0% at calc(100% - 44px) 42px)', duration: .6, ease: 'power3.inOut', onComplete: () => { menu.hidden = true; lenis?.start(); } });
  };
  menuBottone?.addEventListener('click', () => (menuAperto ? chiudiMenu() : apriMenu()));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') chiudiMenu(); });

  /* ── ancore ── */
  qa('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href'); if (id.length < 2) return;
    const el = q(id); if (!el) return;
    e.preventDefault(); chiudiMenu(); setTimeout(() => vaiA(el), menuAperto ? 500 : 0);
  }));

  /* ── testata: si nasconde scendendo, torna salendo, si scurisce sulla notte e sul piede ── */
  const testata = q('#testata');
  let ultimoY = 0, accumulo = 0;
  const suScroll = (y) => {
    const d = y - ultimoY; ultimoY = y;
    if (d > 0) { accumulo += d; if (accumulo > 90 && y > 120 && !menuAperto) testata.classList.add('is-nascosta'); }
    else { accumulo = 0; testata.classList.remove('is-nascosta'); }
  };
  if (lenis) lenis.on('scroll', ({ scroll }) => suScroll(scroll)); else window.addEventListener('scroll', () => suScroll(window.scrollY), { passive: true });

  /* ── foglia: il puntatore ── */
  const foglia = q('#foglia');
  if (foglia && !TOUCH && !RIDOTTO) {
    html.classList.add('con-foglia');
    const xTo = gsap.quickTo(foglia, 'x', { duration: .18, ease: 'power3' }), yTo = gsap.quickTo(foglia, 'y', { duration: .18, ease: 'power3' });
    const rotTo = gsap.quickTo(foglia, 'rotation', { duration: .5, ease: 'power2' });
    window.addEventListener('pointermove', (e) => { xTo(e.clientX); yTo(e.clientY); foglia.style.opacity = '1'; }, { passive: true });
    document.addEventListener('pointerleave', () => { foglia.style.opacity = '0'; });
    if (lenis) { lenis.on('scroll', ({ velocity }) => rotTo(gsap.utils.clamp(-40, 40, velocity * .5))); ST.addEventListener('scrollEnd', () => rotTo(0)); }
    qa('a, button').forEach((el) => { el.addEventListener('pointerenter', () => html.classList.add('foglia-grande')); el.addEventListener('pointerleave', () => html.classList.remove('foglia-grande')); });
  }

  /* ── righe mascherate e blocchi che salgono ── */
  const rigaHero = qa('.hero .riga i');
  const righe = (root) => qa('.riga i', root).filter((i) => !rigaHero.includes(i));
  function reveal() {
    if (RIDOTTO || QA) return;
    qa('h2, .titolo-l, .titolo-xl').forEach((h) => {
      const ls = righe(h); if (!ls.length) return;
      gsap.fromTo(ls, { yPercent: 110, y: 0 }, { yPercent: 0, y: 0, duration: .95, ease: 'power3.out', stagger: .1, scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
    });
    ST.batch(qa('[data-sale]').filter((el) => !el.closest('.hero')), { start: 'top 90%', once: true, onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: .9, ease: 'power3.out', stagger: .08, overwrite: true }) });
  }

  /* ── contatori ── */
  function contatori() {
    qa('[data-conta]').forEach((el) => {
      const fine = Number(el.dataset.conta);
      if (RIDOTTO || QA) { el.textContent = fine; return; }
      const o = { v: 0 };
      ST.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => gsap.to(o, { v: fine, duration: 1.4, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(o.v); } }) });
    });
  }

  /* ── velo: il tetto della casetta si apre ── */
  function velo() {
    const v = q('#velo');
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    if (!v || RIDOTTO || QA) { v?.remove(); return tl; }
    lenis?.stop(); html.classList.add('is-velato');
    const tratti = qa('.velo__tratto', v);
    tratti.forEach((p) => { const l = p.getTotalLength(); p.style.strokeDasharray = l; p.style.strokeDashoffset = l; });
    tl.to(tratti, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut', stagger: .18 }, .15)
      .fromTo(q('.velo__stella', v), { scale: .5, opacity: 0, transformOrigin: '50% 50%' }, { scale: 1, opacity: 1, duration: .55 }, .95)
      .fromTo(q('.velo__nome', v), { yPercent: 110 }, { yPercent: 0, duration: .7 }, 1.05)
      .to(q('.velo__marchio', v), { opacity: 0, duration: .35, ease: 'power2.in' }, 2.0)
      .to(q('.velo__anta--sx', v), { rotateY: -96, duration: 1.2, ease: 'power3.inOut' }, 2.15)
      .to(q('.velo__anta--dx', v), { rotateY: 96, duration: 1.2, ease: 'power3.inOut' }, 2.15)
      .add(() => { v.remove(); html.classList.remove('is-velato'); lenis?.start(); }, 3.4);
    return tl;
  }

  /* ── hero: la foto a tutto schermo si ritira in una finestra a casetta ── */
  function hero() {
    const sez = q('.hero'); if (!sez) return;
    const foto = q('.hero__foto', sez), testo = q('.hero__testo', sez);
    const intro = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
    if (!(RIDOTTO || QA)) {
      intro.fromTo(rigaHero, { yPercent: 110, y: 0 }, { yPercent: 0, y: 0, duration: 1.1, stagger: .12 }, 0)
        .to(qa('[data-sale]', sez), { opacity: 1, y: 0, duration: .9, stagger: .1 }, .35);
    }
    if (RIDOTTO) return intro;
    const mm = gsap.matchMedia();
    mm.add({ desk: '(min-width: 861px)', mob: '(max-width: 860px)' }, (ctx) => {
      const { desk } = ctx.conditions;
      const timpano = 'polygon(0 32%, 50% 0, 100% 32%, 100% 100%, 0 100%)';
      const tl = gsap.timeline({ scrollTrigger: { trigger: sez, start: 'top top', end: 'bottom bottom', scrub: .6, invalidateOnRefresh: true, onUpdate: (e) => sez.classList.toggle('is-chiara', e.progress > .42) } });
      if (desk) tl.to(foto, { scale: .46, x: () => -gut(), y: () => -vh() * .04, transformOrigin: '100% 50%', clipPath: timpano, ease: 'none' }, 0);
      else tl.to(foto, { scale: .7, x: 0, y: () => -vh() * .08, transformOrigin: '50% 0%', clipPath: timpano, ease: 'none' }, 0);
      tl.to(foto, { '--scrim': 0, ease: 'none', duration: .5 }, 0);
      tl.fromTo(testo, { y: 0 }, { y: () => (desk ? 0 : -vh() * .02), ease: 'none' }, 0);
    });
    return intro;
  }

  /* ── manifesto: le parole si accendono ── */
  function manifesto() {
    const p = q('[data-parole]'); if (!p) return;
    const parole = p.textContent.trim().split(/\s+/);
    p.innerHTML = parole.map((w) => `<span class="parola">${w}</span>`).join(' ');
    if (RIDOTTO) return;
    gsap.to(qa('.parola', p), { color: '#1B2A1E', ease: 'none', stagger: .04, scrollTrigger: { trigger: '.manifesto', start: 'top top', end: '66% bottom', scrub: true } });
  }

  /* ── i due nidi: le falde del tetto si aprono ── */
  function nidi() {
    if (RIDOTTO) return;
    qa('[data-nido]').forEach((n) => {
      const sx = q('.nido__falda--sx', n), dx = q('.nido__falda--dx', n), img = q('.nido__foto img', n);
      gsap.timeline({ scrollTrigger: { trigger: n, start: 'top 82%', end: 'top 28%', scrub: .5 } })
        .to(sx, { rotateY: -100, ease: 'none' }, 0).to(dx, { rotateY: 100, ease: 'none' }, 0);
      gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: n, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  /* ── nido family: cornice che si apre e parallasse ── */
  function family() {
    if (RIDOTTO) return;
    qa('[data-cornice]').forEach((f) => {
      const img = q('img', f);
      if (!QA) gsap.fromTo(f, { clipPath: 'inset(0 0 100% 0 round 36px)' }, { clipPath: 'inset(0 0 0% 0 round 36px)', duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: f, start: 'top 85%', once: true } });
      gsap.fromTo(img, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  /* ── le stelle: la pagina si fa notte ── */
  function stelle() {
    const sez = q('.stelle'); if (!sez || RIDOTTO) return;
    const palco = q('.stelle__palco', sez), dentro = q('.stelle__dentro', sez), foto = q('.stelle__foto', sez), canvas = q('.stelle__cielo', sez), occ = q('.occhiello', dentro);
    const ctx = canvas.getContext('2d');
    let stelleArr = [], attivo = false, raf = 0;
    const dim = () => {
      const r = palco.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
      stelleArr = Array.from({ length: 170 }, () => ({ x: Math.random(), y: Math.random() * .85, r: .5 + Math.random() * 1.3, f: Math.random() * Math.PI * 2, s: .4 + Math.random() * 1.2, lime: Math.random() < .12 }));
    };
    const disegna = (t) => {
      const w = canvas.width, h = canvas.height, dpr = Math.min(2, window.devicePixelRatio || 1);
      ctx.clearRect(0, 0, w, h);
      for (const s of stelleArr) {
        const a = .3 + .7 * Math.abs(Math.sin(t * .0012 * s.s + s.f));
        ctx.globalAlpha = a; ctx.fillStyle = s.lime ? '#A0B028' : '#F7F8F3';
        ctx.beginPath(); ctx.arc(s.x * w, s.y * h, s.r * dpr, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (attivo) raf = requestAnimationFrame(disegna);
    };
    const accendi = (v) => { if (v === attivo) return; attivo = v; if (v) raf = requestAnimationFrame(disegna); else cancelAnimationFrame(raf); };
    dim(); window.addEventListener('resize', dim, { passive: true });
    const tl = gsap.timeline({ scrollTrigger: { trigger: sez, start: 'top top', end: 'bottom bottom', scrub: .5, onToggle: (e) => accendi(e.isActive), onUpdate: (e) => { testata.classList.toggle('is-scura', e.progress > .25 && e.progress < .98); } } });
    tl.to(palco, { backgroundColor: '#0E1A12', ease: 'none', duration: .35 }, 0)
      .to(dentro, { color: '#F7F8F3', ease: 'none', duration: .35 }, 0)
      .to(occ, { color: '#A0B028', ease: 'none', duration: .35 }, 0)
      .to(canvas, { opacity: 1, ease: 'none', duration: .3 }, .18)
      .fromTo(qa('.riga i', dentro), { yPercent: 110, y: 0 }, { yPercent: 0, y: 0, ease: 'power2.out', duration: .22, stagger: .06 }, .1)
      .fromTo(q('.stelle__testo', dentro), { opacity: 0, y: 30 }, { opacity: 1, y: 0, ease: 'power2.out', duration: .2 }, .28)
      .fromTo(foto, { opacity: 0, scale: .82, transformOrigin: '50% 100%' }, { opacity: 1, scale: 1, ease: 'power2.out', duration: .32 }, .3)
      .fromTo(q('img', foto), { yPercent: 6 }, { yPercent: -6, ease: 'none', duration: .7 }, .3);
    if (QA) { /* nello stato qa le righe mascherate del titolo restano visibili quando scrubbate */ }
  }

  /* ── nastro con lo skew dalla velocità ── */
  function nastro() {
    const righeN = qa('[data-nastro]'); if (!righeN.length || RIDOTTO) return;
    righeN.forEach((r) => {
      r.innerHTML += r.innerHTML;
      const contro = r.dataset.nastro === 'contro';
      gsap.fromTo(r, { xPercent: contro ? -50 : 0 }, { xPercent: contro ? 0 : -50, ease: 'none', duration: 36, repeat: -1 });
    });
    if (lenis) {
      const skew = gsap.quickTo(righeN, 'skewX', { duration: .45, ease: 'power2' });
      lenis.on('scroll', ({ velocity }) => skew(gsap.utils.clamp(-14, 14, velocity * .12)));
      ST.addEventListener('scrollEnd', () => skew(0));
    }
  }

  /* ── le coccole: striscia orizzontale pinnata ── */
  function extra() {
    const sez = q('.extra'), striscia = q('.extra__striscia'); if (!sez || RIDOTTO) return;
    const corsa = () => Math.max(0, striscia.scrollWidth - window.innerWidth + gut());
    const tween = gsap.to(striscia, { x: () => -corsa(), ease: 'none', scrollTrigger: { trigger: sez, start: 'top top', end: () => `+=${corsa()}`, pin: true, scrub: .6, invalidateOnRefresh: true, anticipatePin: 1 } });
    qa('.extra__carta img', striscia).forEach((img) => {
      gsap.fromTo(img, { xPercent: -8 }, { xPercent: 0, ease: 'none', scrollTrigger: { trigger: img.closest('.extra__carta'), containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
    });
  }

  /* ── dintorni: il sentiero si riempie e le tappe si accendono ── */
  function dintorni() {
    const s = q('.sentiero'); if (!s || RIDOTTO) return;
    gsap.fromTo(q('.sentiero__barra i', s), { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: s, start: 'top 72%', end: 'bottom 72%', scrub: true } });
    qa('.tappa', s).forEach((t) => {
      ST.create({ trigger: t, start: 'top 72%', onEnter: () => t.classList.add('is-accesa'), onLeaveBack: () => t.classList.remove('is-accesa') });
      const testo = q('.tappa__testo', t);
      if (!QA) gsap.fromTo(testo, { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: t, start: 'top 85%', once: true } });
    });
  }

  /* ── voucher: la carta si inclina con la mano ── */
  function voucher() {
    const c = q('[data-tilt]'); if (!c) return;
    if (!(RIDOTTO || QA)) gsap.fromTo(c, { opacity: 0, rotateY: -28, rotateX: 8, transformPerspective: 1200 }, { opacity: 1, rotateY: 0, rotateX: 0, duration: 1.3, ease: 'power3.out', scrollTrigger: { trigger: c, start: 'top 82%', once: true } });
    if (TOUCH || RIDOTTO) return;
    gsap.set(c, { transformPerspective: 1200 });
    const rx = gsap.quickTo(c, 'rotateX', { duration: .6, ease: 'power3' }), ry = gsap.quickTo(c, 'rotateY', { duration: .6, ease: 'power3' });
    c.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      ry((px - .5) * 16); rx(-(py - .5) * 16);
      c.style.setProperty('--mx', `${px * 100}%`); c.style.setProperty('--my', `${py * 100}%`);
    });
    c.addEventListener('pointerleave', () => { rx(0); ry(0); });
  }

  /* ── domande: fisarmonica ── */
  function domande() {
    qa('.fisarmonica__voce').forEach((v) => {
      const b = q('button', v);
      b.addEventListener('click', () => { const aperta = v.classList.toggle('is-aperta'); b.setAttribute('aria-expanded', String(aperta)); });
    });
  }

  /* ── piede: il marchio sale ── */
  function piede() {
    if (RIDOTTO) return;
    gsap.fromTo('[data-marchio]', { yPercent: 55 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.piede', start: 'top bottom', end: 'bottom bottom', scrub: true } });
    ST.create({ trigger: '.piede', start: 'top 80px', end: 'bottom top', onToggle: (e) => testata.classList.toggle('is-scura', e.isActive) });
  }

  /* ── avvio ── */
  const introHero = hero();
  manifesto(); nidi(); family(); stelle(); nastro(); extra(); dintorni(); voucher(); domande(); piede(); contatori(); reveal();
  const tlVelo = velo();
  if (RIDOTTO || QA) { html.classList.add('is-pronto'); }
  else { tlVelo.add(() => introHero.play(), 2.3); tlVelo.add(() => html.classList.add('is-pronto'), 3.4); }
  window.addEventListener('load', () => ST.refresh());
  document.fonts?.ready.then(() => ST.refresh());
})();
