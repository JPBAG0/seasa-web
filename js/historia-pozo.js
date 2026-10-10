/* Historia del pozo: perforación DTH → ademe → equipamiento → bombeo solar → riego, con GSAP + ScrollTrigger. */
(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const NS = "http://www.w3.org/2000/svg";
  const svg = $("#mundo");
  const escena = $("#historia .escena");
  const alturaHeader = () => document.querySelector("header").offsetHeight;
  const sinMovimiento = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // la escena queda fija justo debajo del header, con su altura real
  const ajustarHeader = () => $("#historia").style.setProperty("--hdr", alturaHeader() + "px");
  ajustarHeader(); addEventListener("resize", ajustarHeader);
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") { $("#historia").classList.add("quieta"); return; }

  /* «Saltar animación»: brinca directo a los servicios sin recorrer la pista */
  $("#saltar").addEventListener("click", (e) => {
    e.preventDefault();
    const destino = $("#servicios").getBoundingClientRect().top + scrollY - alturaHeader();
    scrollTo({ top: destino, behavior: "instant" });
  });
  // decodificar la textura grande del subsuelo antes de que la cámara baje (evita el tirón del primer cuadro)
  const precarga = new Image(); precarga.src = "/img/pozo/subsuelo.webp"; precarga.decode?.().catch(() => {});

  /* plantas del invernadero (jitomate): tallo, hojas y frutos */
  const plantas = $("#plantas");
  const hoja = (x, y, lado, k) => {
    const r = lado * (18 + (k % 3) * 3);
    return `<g transform="translate(${x} ${y}) rotate(${lado * (28 + (k % 2) * 14)})">
        <path d="M0 0L${r} 0" stroke="#356b26" stroke-width="1.6"/>
        <ellipse cx="${r}" cy="0" rx="8" ry="5" fill="url(#hoja)"/>
        <ellipse cx="${r * 0.55}" cy="-5" rx="6.5" ry="4" fill="url(#hoja)" transform="rotate(-25 ${r * 0.55} -5)"/>
        <ellipse cx="${r * 0.55}" cy="5" rx="6.5" ry="4" fill="url(#hoja)" transform="rotate(25 ${r * 0.55} 5)"/>
        <path d="M${r * 0.5} 0L${r + 6} 0" stroke="#2f5c22" stroke-width=".7" opacity=".7"/></g>`;
  };
  const tomate = (x, y, r, verde) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${verde ? "tomate-verde" : "tomate"})"/>
     <circle cx="${x - r * 0.35}" cy="${y - r * 0.4}" r="${r * 0.28}" fill="#fff" opacity=".45"/>
     <path d="M${x - 3} ${y - r}l3 2 3 -2" stroke="#2f6524" stroke-width="1.6" fill="none"/>`;
  for (let i = 0; i < 7; i++) {
    const x = 1268 + i * 46, s = i % 2 ? 1 : -1;
    const g = document.createElementNS(NS, "g");
    g.setAttribute("class", "planta");
    let html = `<path d="M${x} -150V-2" stroke="#d9c27a" stroke-width="1"/>
      <path d="M${x} -2C${x - 5 * s} -30 ${x + 6 * s} -60 ${x} -104" stroke="#3d6b2c" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;
    [-22, -38, -54, -70, -86, -98].forEach((y, k) => (html += hoja(x, y, k % 2 ? 1 : -1, i + k)));
    html += tomate(x - 8 * s, -30, 6, false) + tomate(x - 2 * s, -24, 5.5, false) + tomate(x + 9 * s, -50, 5.5, i % 3 === 0) + tomate(x + 4 * s, -44, 4.5, true);
    html += `<g fill="#f4d03f"><circle cx="${x - 6 * s}" cy="-80" r="2.2"/><circle cx="${x - 10 * s}" cy="-84" r="2"/></g>`;
    g.innerHTML = html;
    plantas.appendChild(g);
  }

  if (!window.gsap) return; // sin GSAP se queda el dibujo inicial y la galería funciona
  gsap.registerPlugin(ScrollTrigger);

  /* cámara = viewBox. Centro (cx, cy) y ancho w; en celular se acerca y deja el objeto arriba del texto */
  const cam = (cx, cy, w) => () => {
    const a = escena.clientWidth / escena.clientHeight;
    const ww = a < 0.8 ? w * 0.62 : w;
    const h = ww / a;
    const sube = a < 0.8 ? h * 0.12 : 0;
    return `${(cx - ww / 2).toFixed(1)} ${(cy - h / 2 + sube).toFixed(1)} ${ww.toFixed(1)} ${h.toFixed(1)}`;
  };
  const C = {
    inicio: cam(800, -230, 1900), llega: cam(600, -240, 1300), mastil: cam(660, -300, 1150),
    perfora0: cam(800, -60, 950), fondo: cam(800, 1980, 950), corte: cam(800, 960, 3900),
    superficie: cam(800, -180, 1600), bombaFondo: cam(800, 1820, 1100), colTop: cam(800, -120, 1100),
    solar: cam(420, -170, 1250), todo: cam(800, 820, 3700), riego: cam(1395, -150, 1200), final: cam(980, -190, 1900),
  };

  /* estado inicial: el mástil de la foto gira sobre su pivote trasero (x≈771, y≈-139) y queda sobre el pozo */
  gsap.set("#perforadora", { x: -2600 });
  gsap.set("#mastil", { rotation: 0, svgOrigin: "771 -139" });
  gsap.set("#grua", { x: 2700 });
  gsap.set("#ademe", { y: -2140, opacity: 0 });
  gsap.set("#bomba", { y: -1960, opacity: 0 });
  gsap.set(["#sarta", "#martillo"], { opacity: 0 });
  gsap.set(".panel", { y: -420, opacity: 0 });
  gsap.set(".planta", { scaleY: 0.1, transformOrigin: "50% 100%" });
  gsap.set(svg, { attr: { viewBox: C.inicio() } });

  const prof = { m: 0 };
  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: { trigger: "#historia", start: () => "top " + alturaHeader() + "px", end: "bottom bottom", scrub: 1, invalidateOnRefresh: true },
    onUpdate: () => estado(tl.time()),
  });
  const camara = (k, t, d = 0.6, ease = "power2.inOut") => tl.to(svg, { attr: { viewBox: C[k] }, duration: d, ease }, t);

  // 1 · llega la perforadora y levanta el mástil
  tl.to("#perforadora", { x: 0, duration: 1, ease: "power2.out" }, 1);
  camara("llega", 1, 1);
  camara("mastil", 2, 0.6);
  tl.to("#mastil", { rotation: 90, duration: 0.6, ease: "power2.inOut" }, 2);
  camara("perfora0", 2.6, 0.4);
  tl.to(["#sarta", "#martillo"], { opacity: 1, duration: 0.2 }, 2.6);
  // 2 · perforación DTH
  tl.to("#sarta", { attr: { height: 2063 }, duration: 3.5 }, 3)
    .to("#martillo", { y: 2093, duration: 3.5 }, 3)
    .to("#barreno", { attr: { height: 2100 }, duration: 3.5 }, 3)
    .to(prof, { m: 240, duration: 3.5, onUpdate: () => ($("#prof").textContent = Math.round(prof.m) + " m") }, 3);
  camara("fondo", 3, 3.5, "none");
  camara("corte", 6.5, 0.6);
  tl.to("#sarta", { attr: { height: 40 }, duration: 0.5 }, 7).to("#martillo", { y: 0, duration: 0.5 }, 7);
  // 3 · ademe con rejilla y filtro de grava; el agua sube al nivel estático
  tl.to(["#sarta", "#martillo"], { opacity: 0, duration: 0.2 }, 7.4)
    .to("#ademe", { opacity: 1, duration: 0.2 }, 7.4)
    .to("#ademe", { y: 0, duration: 1.4, ease: "power1.inOut" }, 7.5)
    .to("#grava", { opacity: 1, duration: 0.5 }, 8.5)
    .to("#agua-pozo", { attr: { y: 1300, height: 800 }, duration: 0.8 }, 9)
    .to("#nivel-estatico", { opacity: 1, duration: 0.3 }, 9.5);
  // se va la perforadora y llega la grúa
  camara("superficie", 9.9, 0.5);
  tl.to("#mastil", { rotation: 0, duration: 0.4 }, 10).to("#perforadora", { x: -2600, duration: 0.6, ease: "power2.in" }, 10.3)
    .to("#grua", { x: 0, duration: 0.7, ease: "power2.out" }, 10.6);
  // 4 · bomba, motor, columna y cable
  tl.to("#bomba", { opacity: 1, duration: 0.2 }, 11.2).to("#bomba", { y: 0, duration: 2, ease: "power1.inOut" }, 11.3);
  camara("bombaFondo", 11.3, 2, "power1.inOut");
  // 5 · el agua sube por la columna
  tl.to("#grua", { x: 2700, duration: 0.6, ease: "power2.in" }, 13.4).to("#cabezal", { opacity: 1, duration: 0.3 }, 13.5)
    .to("#agua-col", { attr: { y: -30, height: 1730 }, duration: 1.4 }, 13.5)
    .to("#agua-pozo", { attr: { y: 1520, height: 580 }, duration: 1.4 }, 13.5)
    .to("#nivel-dinamico", { opacity: 1, duration: 0.3 }, 14.6);
  camara("colTop", 13.5, 1.4, "none");
  // 6 · paneles y variador
  camara("solar", 15.1, 0.6);
  tl.to(".panel", { y: 0, opacity: 1, duration: 0.5, stagger: 0.18, ease: "back.out(1.3)" }, 15.4)
    .to("#variador", { opacity: 1, duration: 0.3 }, 16.1);
  // 7 · energía al motor
  camara("todo", 16.5, 0.7);
  tl.to("#energia", { attr: { "stroke-dashoffset": 0 }, duration: 1.2 }, 16.6);
  // 8 · riego
  camara("riego", 18, 0.7);
  tl.to("#tubo-riego", { attr: { "stroke-dashoffset": 0 }, duration: 0.5 }, 18.2)
    .to(".planta", { scaleY: 1, duration: 0.6, stagger: 0.08, ease: "back.out(1.5)" }, 18.8);
  camara("final", 19.6, 0.6);
  tl.to({}, { duration: 0.4 }, 20.2);

  /* capítulos: texto, foto real y animaciones continuas */
  const CAPS = [
    [0, 1, "SEASA · Pozos profundos", "Del subsuelo a tu cosecha", "Así perforamos y equipamos un pozo, paso a paso. Baja con el scroll.", "/img/rehabilitacion.jpeg", "Perforadora en obra"],
    [1, 3, "01 · Perforación", "Llega la perforadora", "Maquinaria propia: la perforadora se coloca sobre el punto del pozo y levanta el mástil.", "/img/perforacion.jpg", "Perforadora y compresor"],
    [3, 7, "01 · Perforación DTH", "Martillo de fondo y aire comprimido", "El martillo DTH golpea y gira en el fondo para romper la roca; el aire saca el recorte hasta la superficie.", "/img/pozo/martillo.webp", "Martillo DTH y broca"],
    [7, 9.9, "02 · Ademe y filtro", "Tubería de ademe con rejilla", "Bajamos el ademe de acero con rejilla en la zona del acuífero y rellenamos con filtro de grava. El agua sube hasta el nivel estático.", "/img/rehabilitacion.jpeg", "Tubería lista para el pozo"],
    [9.9, 13.4, "03 · Equipamiento", "Bomba, motor, columna y cable", "Con nuestra grúa bajamos la bomba sumergible con su motor, la columna y el cable, calculados para la profundidad y el caudal de tu pozo.", "/img/equipamiento-alto.jpg", "Grúa propia bajando la bomba"],
    [13.4, 15.1, "04 · El agua sube", "Hasta el cabezal de descarga", "La bomba empuja el agua por la columna. El nivel baja al nivel dinámico: eso es lo que medimos en un aforo.", "/img/aforo-alto.jpg", "Aforo con medidor de caudal"],
    [15.1, 16.5, "05 · Bombeo solar", "Paneles y variador", "Instalamos paneles, inversor y tableros: el pozo trabaja con el sol, sin recibo de CFE.", "/img/g-solar.jpg", "Pozo con paneles solares"],
    [16.5, 18, "05 · Bombeo solar", "La energía baja hasta el motor", "Del panel al variador y por el cable sumergible hasta el motor, a más de 200 m de profundidad.", "/img/tablero-solar.jpg", "Inversor y tableros"],
    [18, 99, "06 · Riego", "El agua llega a tu cultivo", "Riego por goteo en tu invernadero, huerta o abrevadero. Del subsuelo a tu cosecha.", "/img/aforo-alto.jpg", "Agua para la huerta"],
  ];
  let capActual = -1, tCap = 0;
  function estado(t) {
    svg.classList.toggle("perforando", t > 3 && t < 6.5);
    svg.classList.toggle("bombeando", t > 14.9);
    svg.classList.toggle("energia", t > 17.6);
    svg.classList.toggle("regando", t > 18.6);
    gsap.set("#flujo-col", { opacity: t > 14.9 ? 1 : 0 });
    gsap.set("#flujo-energia", { opacity: t > 17.6 ? 1 : 0 });
    gsap.set("#flujo-riego", { opacity: t > 18.6 ? 1 : 0 });
    $("#medidor").classList.toggle("on", t > 2.9 && t < 7);
    $("#saltar").hidden = t >= 18;
    const i = CAPS.findIndex(([a, b]) => t >= a && t < b);
    if (i === capActual || i < 0) return;
    capActual = i;
    const [, , n, h, p, foto, pie] = CAPS[i];
    const c = $("#capitulo"), f = $("#campo");
    c.classList.add("cambia");
    f.classList.remove("on");
    clearTimeout(tCap);
    tCap = setTimeout(() => {
      $("#capNum").textContent = n; $("#capTit").textContent = h; $("#capTxt").textContent = p;
      $("#campoImg").src = foto; $("#campoImg").alt = pie; $("#campoTxt").textContent = pie;
      c.classList.remove("cambia"); f.classList.add("on");
    }, 240);
  }

  /* sin animaciones: estado final */
  if (sinMovimiento) { $("#historia").classList.add("quieta"); $("#saltar").hidden = true; tl.scrollTrigger.kill(); tl.progress(1); estado(99); return; }
  estado(0);

})();
