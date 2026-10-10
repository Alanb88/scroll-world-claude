/* ==========================================================
   hero-carousel.js: carrusel coverflow del hero.

   Un único valor continuo `pos` (motionValue de Motion) indica qué vaso
   está al frente; todo lo demás (posición, escala, opacidad de cada vaso,
   la ola del fondo) se deriva de él en cada frame. Cambiar de sabor es
   animar `pos` con un resorte, y el arrastre lo mueve directo. Así una
   interrupción a mitad de camino conserva la velocidad y nunca salta.

   Cada sabor se renderiza dos veces (6 lugares para 3 sabores): así
   siempre hay tres vasos distintos en escena y el que sale por la
   izquierda reaparece al fondo de la fila sin que se vea el cambio.
   ========================================================== */
import { createCup, SHOWCASE, TOPPINGS_FROM, clamp } from "./cups.js";

const { motionValue, animate } = window.Motion;

const SPRING = { type: "spring", stiffness: 120, damping: 19, mass: 1, restDelta: 0.0005 };
const TILT_SPRING = { type: "spring", stiffness: 170, damping: 16 };
const COPIES = 2;

// Lugar en la fila → posición (en anchos de vaso), escala, elevación y opacidad.
// e = 0 es el vaso al frente; e < 0 sale por la izquierda; e > 0 espera a la derecha.
const LAYOUT = {
  desktop: [
    { e: -1, x: -0.85, s: 0.78, y: 0, o: 0 },
    { e: 0, x: 0, s: 1, y: 0, o: 1 },
    { e: 1, x: 0.8, s: 0.56, y: -0.1, o: 1 },
    { e: 2, x: 1.26, s: 0.38, y: -0.18, o: 1 },
    { e: 3, x: 1.56, s: 0.28, y: -0.24, o: 0 },
  ],
  mobile: [
    { e: -1, x: -0.9, s: 0.8, y: 0, o: 0 },
    { e: 0, x: 0, s: 1, y: 0, o: 1 },
    { e: 1, x: 0.8, s: 0.6, y: -0.06, o: 1 },
    { e: 2, x: 1.26, s: 0.42, y: -0.12, o: 1 },
    { e: 3, x: 1.6, s: 0.3, y: -0.16, o: 0 },
  ],
};

const mod = (n, m) => ((n % m) + m) % m;

function sample(table, e) {
  const c = clamp(e, -1, 3);
  const i = Math.min(table.length - 2, Math.floor(c + 1));
  const a = table[i], b = table[i + 1];
  const k = c - a.e;
  const mix = (p) => a[p] + (b[p] - a[p]) * k;
  return { x: mix("x"), s: mix("s"), y: mix("y"), o: mix("o") };
}

export function initHeroCarousel(root, flavors) {
  const stage = root.querySelector("[data-stage]");
  const lead = root.querySelector("[data-lead]");
  const pills = [...root.querySelectorAll("[data-flavor-pill]")];
  const wave = root.querySelector("[data-wave]");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const mobileMQ = window.matchMedia("(max-width: 767px)");

  const N = flavors.length * COPIES;
  const pos = motionValue(0);
  let cardW = 0;
  let front = 0;           // lugar entero al frente (puede ser negativo o > N)
  let shownFlavor = -1;
  let posAnim = null;

  /* ---------- vasos ---------- */
  const cards = Array.from({ length: N }, (_, slot) => {
    const fi = slot % flavors.length;
    const flavor = flavors[fi];
    const cup = createCup(flavor);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "flavor-card";
    btn.setAttribute("aria-label", flavor.name);
    const tilt = document.createElement("span");
    tilt.className = "flavor-card__tilt";
    tilt.appendChild(cup.svg);
    btn.appendChild(tilt);
    stage.appendChild(btn);
    cup.render(SHOWCASE);
    return { slot, fi, btn, tilt, cup, build: null };
  });
  cards[0].cup.render(1);

  /* ---------- dibujo: todo sale de pos ---------- */
  function render(p) {
    const table = mobileMQ.matches ? LAYOUT.mobile : LAYOUT.desktop;
    cards.forEach((c) => {
      const d = mod(c.slot - p, N);
      const e = d > N - 1 ? d - N : d;
      const { x, s, y, o } = sample(table, e);
      c.btn.style.transform = `translate3d(${(x * cardW).toFixed(1)}px, ${(y * cardW).toFixed(1)}px, 0) scale(${s.toFixed(4)})`;
      c.btn.style.opacity = o.toFixed(3);
      c.btn.style.zIndex = String(10 - Math.round(e * 2));
      c.btn.style.visibility = o < 0.01 ? "hidden" : "visible";
      c.e = e;
    });
    if (wave) drawWave(p);
  }

  /* ---------- ola del fondo: se mece con el carrusel ---------- */
  const waveBase = wave ? wave.querySelector("path").getAttribute("d") : "";
  function drawWave(p) {
    if (reduce) return;
    const W = 1440, H = 320, pts = [];
    const ph = p * Math.PI * 0.9;
    for (let i = 0; i <= 12; i++) {
      const x = (i / 12) * W;
      const y = 120
        + Math.sin(i * 0.78 + ph) * 34
        + Math.sin(i * 1.6 - ph * 0.7) * 14;
      pts.push([x, y]);
    }
    // curva suave por los puntos (Catmull-Rom → Bézier)
    let d = `M0 ${H} L0 ${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    wave.querySelector("path").setAttribute("d", `${d} L${W} ${H} Z`);
  }

  /* ---------- estado del sabor al frente ---------- */
  function syncFlavor(slot) {
    cards.forEach((c) => {
      const isFront = c.slot === mod(slot, N);
      c.btn.setAttribute("aria-current", isFront ? "true" : "false");
      c.btn.tabIndex = isFront ? 0 : -1;
    });
    const fi = mod(slot, flavors.length);
    if (fi === shownFlavor) return;
    shownFlavor = fi;
    const f = flavors[fi];
    root.dataset.flavor = f.key;
    root.style.setProperty("--hero-bg", f.bg);
    lead.innerHTML = `<strong>${f.name}.</strong> ${f.lead}`;
    pills.forEach((b, k) => b.setAttribute("aria-pressed", String(k === fi)));
  }

  // los toppings del vaso que llega al frente vuelven a caer; el que se va queda en vitrina
  function playToppings(slot) {
    const c = cards[mod(slot, N)];
    cards.forEach((o) => {
      if (o === c) return;
      if (o.build) { o.build.stop(); o.build = null; }
      o.cup.render(SHOWCASE);
    });
    if (reduce) { c.cup.render(1); return; }
    if (c.build) c.build.stop();
    c.build = animate(TOPPINGS_FROM, 1, { duration: 1.25, ease: "linear", onUpdate: (t) => c.cup.render(t) });
  }

  function goTo(slot) {
    if (slot !== front) playToppings(slot);
    front = slot;
    syncFlavor(slot);
    if (posAnim) posAnim.stop();
    if (reduce) { pos.set(slot); return; }
    posAnim = animate(pos, slot, SPRING);
  }

  // camino más corto hacia un sabor (para las píldoras)
  function goToFlavor(fi) {
    const cur = mod(front, flavors.length);
    let delta = mod(fi - cur, flavors.length);
    if (delta > flavors.length / 2) delta -= flavors.length;
    goTo(front + delta);
  }

  pos.on("change", render);

  /* ---------- interacción ---------- */
  cards.forEach((c) => c.btn.addEventListener("click", (ev) => {
    if (dragMoved) { ev.preventDefault(); return; }
    const offset = Math.round(c.e);
    if (offset !== 0) goTo(front + offset);
  }));
  pills.forEach((b, k) => b.addEventListener("click", () => goToFlavor(k)));
  root.addEventListener("keydown", (ev) => {
    if (!stage.contains(document.activeElement) && !pills.includes(document.activeElement)) return;
    if (ev.key === "ArrowRight") { ev.preventDefault(); goTo(front + 1); }
    if (ev.key === "ArrowLeft") { ev.preventDefault(); goTo(front - 1); }
  });

  // arrastre / swipe: mueve pos directo; al soltar, resorte al vaso más cercano según la velocidad
  let dragStart = null, dragMoved = false;
  stage.addEventListener("pointerdown", (ev) => {
    if (ev.button !== 0) return;
    dragStart = { x: ev.clientX, pos: pos.get() };
    dragMoved = false;
  });
  window.addEventListener("pointermove", (ev) => {
    if (!dragStart) return;
    const dx = ev.clientX - dragStart.x;
    if (!dragMoved && Math.abs(dx) < 6) return;
    if (!dragMoved) { dragMoved = true; if (posAnim) posAnim.stop(); stage.classList.add("is-dragging"); }
    pos.set(dragStart.pos - dx / (cardW * 0.8));
  });
  window.addEventListener("pointerup", () => {
    if (!dragStart) return;
    dragStart = null;
    stage.classList.remove("is-dragging");
    if (!dragMoved) return;
    const v = pos.getVelocity();
    const target = Math.round(pos.get() + clamp(v * 0.18, -1.2, 1.2));
    goTo(target);
    setTimeout(() => { dragMoved = false; }, 0);
  });

  // tilt 3D sobre el vaso al frente (solo mouse)
  if (finePointer && !reduce) {
    const rx = motionValue(0), ry = motionValue(0);
    const applyTilt = () => {
      const c = cards[mod(front, N)];
      c.tilt.style.transform = `perspective(900px) rotateX(${rx.get().toFixed(2)}deg) rotateY(${ry.get().toFixed(2)}deg)`;
    };
    rx.on("change", applyTilt);
    ry.on("change", applyTilt);
    stage.addEventListener("pointermove", (ev) => {
      const c = cards[mod(front, N)];
      const r = c.btn.getBoundingClientRect();
      const inside = ev.clientX > r.left && ev.clientX < r.right && ev.clientY > r.top && ev.clientY < r.bottom;
      const nx = inside ? (ev.clientX - r.left) / r.width - 0.5 : 0;
      const ny = inside ? (ev.clientY - r.top) / r.height - 0.5 : 0;
      animate(ry, nx * 16, TILT_SPRING);
      animate(rx, -ny * 12, TILT_SPRING);
    });
    stage.addEventListener("pointerleave", () => { animate(rx, 0, TILT_SPRING); animate(ry, 0, TILT_SPRING); });
    // al cambiar de vaso, el anterior vuelve derecho
    pos.on("change", () => cards.forEach((c) => { if (Math.abs(c.e) > 0.5) c.tilt.style.transform = ""; }));
  }

  /* ---------- medidas ---------- */
  function measure() {
    cardW = cards[0].btn.offsetWidth;
    render(pos.get());
  }
  new ResizeObserver(measure).observe(stage);
  mobileMQ.addEventListener("change", measure);

  syncFlavor(0);
  measure();
  if (wave && reduce) wave.querySelector("path").setAttribute("d", waveBase);
}
