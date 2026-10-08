/* ==========================================================
   Nutri Yog! landing
   1) Hero: se arman 3 yogures (Clásico / Açaí / Frutos rojos)
      capa por capa a medida que scrolleás.
   2) Reveals, nav, horarios con "abierto ahora".
   ========================================================== */
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const INK = "#1D5635";

  /* ---------- helpers ---------- */
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOut = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeBack = (t) => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const bounce = (t) => {
    const n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375;
    return n * (t -= 2.625 / d) * t + .984375;
  };
  const rng = (seed) => () => { // mulberry32
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  /* ---------- formas de toppings (centradas en 0,0) ---------- */
  const SHAPES = {
    strawberry: () => `
      <path d="M0 -13 C10 -15 15 -5 12 5 C9 12 3 15 0 16 C-3 15 -9 12 -12 5 C-15 -5 -10 -15 0 -13Z" fill="#E5484D"/>
      <path d="M0 -8 C6 -9 8 -3 7 3 C5 8 2 10 0 11 C-2 10 -5 8 -7 3 C-8 -3 -6 -9 0 -8Z" fill="#F7A1A6"/>
      <circle cx="-3" cy="-1" r="1.1" fill="#FFF3C4"/><circle cx="3" cy="2" r="1.1" fill="#FFF3C4"/><circle cx="0" cy="6" r="1.1" fill="#FFF3C4"/>
      <path d="M-6 -13 Q0 -19 6 -13 Q0 -15 -6 -13Z" fill="#8DBF5A"/>`,
    granola: (r) => {
      const pts = [];
      const n = 6, s = 4 + r() * 3.5;
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2, rad = s * (.7 + r() * .5);
        pts.push(`${(Math.cos(a) * rad).toFixed(1)},${(Math.sin(a) * rad).toFixed(1)}`);
      }
      const col = ["#D9A35A", "#C98D45", "#E4B874"][Math.floor(r() * 3)];
      return `<polygon points="${pts.join(" ")}" fill="${col}" stroke="#B07834" stroke-width="1" stroke-linejoin="round"/>`;
    },
    banana: () => `
      <circle r="12" fill="#FBF0BC" stroke="#EAD47D" stroke-width="2.5"/>
      <circle r="5" fill="none" stroke="#E9DC9C" stroke-width="1.4"/>
      <circle cx="-2" cy="1" r="1" fill="#C9B66A"/><circle cx="2" cy="-1.5" r="1" fill="#C9B66A"/><circle cx="1.5" cy="2.5" r="1" fill="#C9B66A"/>`,
    blueberry: () => `
      <circle r="8" fill="#3F4486"/>
      <circle cx="-2.8" cy="-2.8" r="2.3" fill="#7C83C4"/>
      <path d="M-2 4 l2 -2 l2 2" stroke="#272A5C" stroke-width="1.4" fill="none" stroke-linecap="round"/>`,
    raspberry: () => {
      let s = "";
      for (const [x, y] of [[0, -7], [-5, -3], [5, -3], [-6, 3], [0, 1], [6, 3], [-3, 8], [3, 8]]) {
        s += `<circle cx="${x}" cy="${y}" r="4.3" fill="#D8336B"/><circle cx="${x - 1.2}" cy="${y - 1.2}" r="1.3" fill="#F38BAF"/>`;
      }
      return s;
    },
    blackberry: () => {
      let s = "";
      for (const [x, y] of [[0, -6], [-4, -2], [4, -2], [0, 2], [-4, 5], [4, 5], [0, 8]]) {
        s += `<circle cx="${x}" cy="${y}" r="3.8" fill="#3A1838"/><circle cx="${x - 1}" cy="${y - 1}" r="1" fill="#8A5A88"/>`;
      }
      return s;
    },
    coconut: (r) => `<rect x="-5" y="-2" width="${9 + r() * 5}" height="4" rx="2" fill="#FFFDF5" stroke="#E6DDC6" stroke-width=".8"/>`,
  };

  const SCALE = { strawberry: 1.5, granola: 1.35, banana: 1.4, blueberry: 1.35, raspberry: 1.35, blackberry: 1.35, coconut: 1.3 };

  /* ---------- geometría base ---------- */
  const SWIRL_TIERS = [ // x, y, w, h (de abajo hacia arriba)
    [74, 288, 252, 52],
    [95, 248, 210, 48],
    [118, 212, 164, 44],
    [142, 180, 116, 40],
  ];
  const domeY = (x) => { const t = (x - 76) / 248; return 340 - 340 * t * (1 - t); };

  /* ---------- las 3 variantes ---------- */
  const VARIANTS = [
    {
      name: "clasico",
      cup: { band: "#EB92B2", badge: "#D7E6AD" },
      spoon: "#B9D58A",
      base: "swirl",
      cream: ["#FFFDF6", "#E9E0CB"],
      drizzle: { color: "#B8661D", d: "M210 124 C226 146 186 160 176 178 C200 190 248 190 252 202 C236 224 160 216 128 236 C170 254 270 246 282 262 C262 290 132 282 100 292" },
      drips: ["M176 178 q-2 10 1 18", "M252 202 q2 12 -1 20", "M128 236 q-2 10 1 16", "M282 262 q2 10 0 18"],
      groups: [
        { type: "strawberry", pts: [[96, 304, -20], [134, 314, 15], [270, 312, -10], [304, 300, 25], [228, 320, 5], [172, 306, -30], [318, 318, 40], [150, 282, 10], [258, 284, -25]] },
        { type: "granola", scatter: { n: 30, x: [86, 314], y: [306, 330], seed: 7 } },
      ],
    },
    {
      name: "acai",
      cup: { band: "#BFD88A", badge: "#F8EDA6" },
      spoon: "#EB92B2",
      base: "dome",
      cream: ["#5E2A6B", "#46204F"],
      drizzle: { color: "#F2B632", d: "M92 320 C118 290 150 304 176 280 C196 262 214 288 236 276 C262 262 284 294 310 316" },
      drips: [],
      groups: [
        {
          type: "mix",
          pts: [
            ["banana", 100, 4, 0], ["banana", 122, 6, 20], ["banana", 145, 4, -10], ["banana", 112, 22, 30],
            ["banana", 136, 22, 0], ["strawberry", 256, 4, 20], ["strawberry", 282, 6, -15], ["strawberry", 300, 14, 30],
            ["strawberry", 268, 22, -5],
          ],
        },
        { type: "granola", scatter: { n: 26, x: [168, 236], dome: [4, 30], seed: 21 }, extra: { type: "coconut", n: 12, x: [96, 304], dome: [2, 26], seed: 5 } },
      ],
    },
    {
      name: "frutos-rojos",
      cup: { band: "#F3DE7A", badge: "#F7CADB" },
      spoon: "#EB92B2",
      base: "swirl",
      cream: ["#FFFDF6", "#E9E0CB"],
      drizzle: { color: "#A3194D", d: "M212 122 C228 144 184 158 172 176 C204 188 250 186 254 200 C232 226 156 214 126 234 C170 256 272 244 284 262 C258 292 130 280 98 292" },
      drips: ["M172 176 q-2 12 1 20", "M254 200 q2 14 -1 22", "M126 234 q-2 12 1 18", "M284 262 q2 12 -1 20", "M200 247 q1 10 -1 16"],
      groups: [
        { type: "blueberry", scatter: { n: 16, x: [88, 312], y: [296, 326], seed: 3 } },
        {
          type: "mix",
          pts: [
            ["raspberry", 108, 304, 0], ["raspberry", 160, 318, 20], ["raspberry", 246, 314, -15], ["raspberry", 300, 304, 10],
            ["blackberry", 136, 298, 0], ["blackberry", 212, 322, 10], ["blackberry", 278, 322, -10], ["raspberry", 196, 282, 0],
          ],
        },
      ],
    },
  ];

  /* ---------- construcción del SVG ---------- */
  const svg = document.getElementById("yogurt");
  if (!svg) return;

  const CUP_BODY = "M80 336 L112 515 Q114 524 124 524 L276 524 Q286 524 288 515 L320 336 Z";
  svg.innerHTML = `<defs><clipPath id="cupClip"><path d="${CUP_BODY}"/></clipPath></defs>`;

  const build = (v, i) => {
    const g = document.createElementNS(NS, "g");
    g.setAttribute("class", "cupset");
    const [fill, shade] = v.cream;
    let html = "";

    // sombra + boca del vaso
    html += `<ellipse cx="200" cy="532" rx="112" ry="10" fill="${INK}" opacity=".12"/>`;
    html += `<ellipse cx="200" cy="334" rx="124" ry="11" fill="#E4DAC2"/>`;

    // cuchara (detrás del yogurt: solo asoma el mango)
    html += `<g class="spoon" opacity="0">
      <rect x="-8" y="-200" width="16" height="182" rx="8" fill="${v.spoon}"/>
      <rect x="-3" y="-190" width="4" height="150" rx="2" fill="#fff" opacity=".45"/>
      <ellipse cx="0" cy="0" rx="22" ry="30" fill="${v.spoon}"/>
    </g>`;

    // base
    html += `<g class="base">`;
    if (v.base === "swirl") {
      SWIRL_TIERS.forEach(([x, y, w, h], k) => {
        html += `<g class="tier" data-cx="200" data-by="${y + h}">
          <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${fill}"/>
          <path d="M${x + 18} ${y + h - 12} Q${x + w * .5} ${y + h + 2} ${x + w - 14} ${y + h * .45}" stroke="${shade}" stroke-width="6" fill="none" stroke-linecap="round"/>
          <ellipse cx="${x + w * .28}" cy="${y + h * .32}" rx="${w * .12}" ry="${h * .12}" fill="#fff"/>
        </g>`;
      });
      html += `<g class="tier" data-cx="200" data-by="196">
        <path d="M156 196 C160 160 186 132 214 116 C206 142 220 166 246 196 Z" fill="${fill}"/>
        <path d="M168 188 C178 166 194 150 212 140" stroke="${shade}" stroke-width="5" fill="none" stroke-linecap="round"/>
      </g>`;
    } else {
      html += `<g class="tier" data-cx="200" data-by="342">
        <path d="M74 342 Q200 166 326 342 Z" fill="${fill}"/>
        <path d="M108 312 Q148 276 196 270" stroke="#7E3F8C" stroke-width="7" fill="none" stroke-linecap="round"/>
        <path d="M218 290 Q262 288 298 318" stroke="${shade}" stroke-width="6" fill="none" stroke-linecap="round"/>
        <ellipse cx="156" cy="292" rx="16" ry="5" fill="#9A5AA8" opacity=".7"/>
      </g>`;
    }
    html += `</g>`;

    // salsa
    html += `<g class="drizzle">
      <path class="drz" d="${v.drizzle.d}" pathLength="1" stroke="${v.drizzle.color}" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 1" stroke-dashoffset="1"/>
      ${v.drips.map((d) => `<path class="drip" d="${d}" pathLength="1" stroke="${v.drizzle.color}" stroke-width="7" fill="none" stroke-linecap="round" stroke-dasharray="1 1" stroke-dashoffset="1"/>`).join("")}
    </g>`;

    // toppings
    const groupItems = v.groups.map((grp, gi) => {
      const items = [];
      const push = (type, x, y, rot, r) => items.push({ type, x, y, rot, svg: `<g transform="scale(${SCALE[type]})">${SHAPES[type](r)}</g>` });
      const fromScatter = (type, sc) => {
        const r = rng(sc.seed);
        for (let k = 0; k < sc.n; k++) {
          const x = sc.x[0] + r() * (sc.x[1] - sc.x[0]);
          const y = sc.dome ? Math.min(336, domeY(x) + sc.dome[0] + r() * (sc.dome[1] - sc.dome[0])) : sc.y[0] + r() * (sc.y[1] - sc.y[0]);
          push(type, x, y, r() * 360, r);
        }
      };
      const r0 = rng(99 + gi);
      if (grp.scatter) fromScatter(grp.type, grp.scatter);
      if (grp.extra) fromScatter(grp.extra.type, grp.extra);
      if (grp.type === "mix") {
        grp.pts.forEach(([type, x, y, rot]) => push(type, x, v.base === "dome" ? domeY(x) + y + 8 : y, rot, r0));
      } else if (grp.pts) {
        grp.pts.forEach(([x, y, rot]) => push(grp.type, x, y, rot, r0));
      }
      // orden aleatorio de caída, pero dibujado de atrás hacia adelante
      const order = items.map((_, k) => k).sort(() => r0() - .5);
      items.forEach((it, k) => (it.delay = order.indexOf(k) / Math.max(1, items.length - 1)));
      items.sort((a, b) => a.y - b.y);
      return items;
    });
    groupItems.forEach((items, gi) => {
      html += `<g class="tgroup" data-g="${gi}">`;
      items.forEach((it) => {
        html += `<g class="top" data-x="${it.x.toFixed(1)}" data-y="${it.y.toFixed(1)}" data-r="${it.rot}" data-d="${it.delay.toFixed(3)}" opacity="0">${it.svg}</g>`;
      });
      html += `</g>`;
    });

    // vaso (frente)
    html += `<g class="cup">
      <path d="${CUP_BODY}" fill="#FFFDF8"/>
      <g clip-path="url(#cupClip)">
        <path d="M30 540 L170 330 L222 330 L82 540Z" fill="${v.cup.band}"/>
        <path d="M206 560 L330 360 L350 420 L262 560Z" fill="${v.cup.band}"/>
        <g transform="translate(286 368)"><circle r="17" fill="${v.cup.badge}"/>
        <path d="M-7 7 q-3 -10 6 -16 q3 5 8 6 q3 7 -2 10Z" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M-3 3 q3 2 6 0" stroke="${INK}" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>
        <path d="M86 340 L118 520" stroke="#000" stroke-opacity=".05" stroke-width="18"/>
      </g>
      <text x="192" y="410" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="50" letter-spacing="3" fill="${INK}">NUTRI</text>
      <text x="186" y="462" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="50" letter-spacing="3" fill="${INK}">YOG!</text>
      <text x="200" y="500" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="700" font-size="11" letter-spacing="1" fill="${INK}" opacity=".75">Ciudad Jardín · Bs As</text>
      <rect x="70" y="326" width="260" height="16" rx="8" fill="#FFFDF8" stroke="#EDE5D2" stroke-width="2"/>
    </g>`;

    // corazoncitos al terminar
    html += `<g class="hearts">
      ${[[66, 210, -14, 1], [338, 168, 12, .8], [348, 400, 8, .7], [52, 430, -8, .6]]
        .map(([x, y, r, s]) => `<g class="heart" data-x="${x}" data-y="${y}" data-r="${r}" data-s="${s}" opacity="0"><path d="M0 8 C-14 -2 -12 -14 -4 -14 C-1 -14 0 -11 0 -9 C0 -11 1 -14 4 -14 C12 -14 14 -2 0 8Z" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/></g>`)
        .join("")}
      <g class="spark" opacity="0" stroke="${INK}" stroke-width="2.6" stroke-linecap="round">
        <path d="M232 92 l6 -16"/><path d="M252 100 l14 -10"/><path d="M212 90 l-2 -16"/>
      </g>
    </g>`;

    g.innerHTML = html;
    svg.appendChild(g);

    return {
      g,
      tiers: [...g.querySelectorAll(".tier")],
      drz: g.querySelector(".drz"),
      drips: [...g.querySelectorAll(".drip")],
      groups: [...g.querySelectorAll(".tgroup")].map((tg) => [...tg.querySelectorAll(".top")].map((el) => ({
        el, x: +el.dataset.x, y: +el.dataset.y, r: +el.dataset.r, d: +el.dataset.d,
      }))),
      spoon: g.querySelector(".spoon"),
      hearts: [...g.querySelectorAll(".heart")],
      spark: g.querySelector(".spark"),
    };
  };

  const sets = VARIANTS.map(build);

  /* ---------- render de un yogur con progreso local t ∈ [0,1] ---------- */
  const PH = { base: [.03, .36], drizzle: [.36, .5], a: [.5, .67], b: [.67, .84], spoon: [.84, .9], done: [.88, .95] };

  const renderSet = (s, t) => {
    // base: los pisos se "sirven" uno tras otro
    const bt = seg(t, ...PH.base);
    const n = s.tiers.length;
    s.tiers.forEach((el, k) => {
      const lt = n === 1 ? bt : seg(bt, k / n * .85, k / n * .85 + .3);
      const sy = easeBack(lt), sx = .55 + .45 * easeOut(lt);
      const cx = +el.dataset.cx, by = +el.dataset.by;
      el.setAttribute("transform", lt <= 0 ? "scale(0)" : `translate(${cx} ${by}) scale(${sx} ${Math.max(0, sy)}) translate(${-cx} ${-by})`);
      el.setAttribute("opacity", lt > 0 ? 1 : 0);
    });

    // salsa
    const dt = seg(t, ...PH.drizzle);
    const dl = easeInOut(seg(dt, 0, .8));
    s.drz.setAttribute("stroke-dashoffset", 1 - dl);
    s.drz.setAttribute("opacity", dl > 0 ? 1 : 0);
    s.drips.forEach((d, k) => {
      const l = easeOut(seg(dt, .55 + k * .07, .8 + k * .05));
      d.setAttribute("stroke-dashoffset", 1 - l);
      d.setAttribute("opacity", l > 0 ? 1 : 0);
    });

    // toppings que caen
    s.groups.forEach((items, gi) => {
      const gt = seg(t, ...(gi === 0 ? PH.a : PH.b));
      items.forEach((it) => {
        const lt = seg(gt, it.d * .6, it.d * .6 + .4);
        if (lt <= 0) { it.el.setAttribute("opacity", 0); return; }
        const fall = 1 - bounce(lt);
        it.el.setAttribute("opacity", clamp(lt * 6));
        it.el.setAttribute("transform", `translate(${it.x} ${it.y - fall * 320}) rotate(${it.r + fall * 160})`);
      });
    });

    // cuchara
    const st = easeOut(seg(t, ...PH.spoon));
    const k = 1 - st;
    s.spoon.setAttribute("opacity", st > 0 ? 1 : 0);
    s.spoon.setAttribute("transform", `translate(${262 + k * 90} ${300 - k * 210}) rotate(24)`);

    // corazones + chispas
    const ht = seg(t, ...PH.done);
    s.hearts.forEach((h, j) => {
      const lt = easeBack(seg(ht, j * .15, j * .15 + .5));
      h.setAttribute("opacity", clamp(lt * 2));
      h.setAttribute("transform", `translate(${h.dataset.x} ${h.dataset.y}) rotate(${h.dataset.r}) scale(${Math.max(0, lt) * h.dataset.s * 1.4})`);
    });
    s.spark.setAttribute("opacity", clamp(ht * 3));

    // pasos completados (umbral: mitad de cada fase)
    return [PH.base, PH.drizzle, PH.a, PH.b].map(([a, b]) => t >= a + (b - a) * .5);
  };

  /* ---------- scroll del hero ----------
     Port de la lógica de skills/scroll-world/references/scrub-engine.js:
     - cadena de segmentos (un capítulo por yogur) con peso de scroll propio en vh,
       y la altura del hero calculada en layout() a partir de esos pesos;
     - el scroll solo fija un `target` por segmento; un loop de rAF lo persigue con
       lerp (cur += (target - cur) * 0.18), así el armado se siente suave;
     - fundido de CROSSFADE vh en cada corte entre capítulos (smooth);
     - puntos de navegación que saltan al medio de cada capítulo (jumpTo);
     - en táctiles se ignoran los resize que solo cambian el alto (barra de URL);
     - con prefers-reduced-motion no hay lerp ni armado: se ve cada yogur terminado
       y solo se funden entre sí. */
  const CHAPTERS = [{ scroll: 2.1 }, { scroll: 2.1 }, { scroll: 2.1 }]; // vh de scroll por yogur
  const CROSSFADE = 0.32;                                                 // ancho del corte (vh)
  const LERP = 0.18;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  const hero = document.querySelector(".hero");
  const nav = document.getElementById("nav");
  const variantsEl = [...document.querySelectorAll(".variant")];
  const dots = [...document.querySelectorAll(".hero__dots button")];
  const blobs = [...document.querySelectorAll(".blob")];
  const N = sets.length;
  const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };

  const SEGMENTS = sets.map((set, i) => ({ set, w: (CHAPTERS[i] || {}).scroll || 2, cur: 0, target: 0, op: 0, x: 0 }));
  let vh = window.innerHeight, laidOutW = window.innerWidth, heroTop = 0, totalW = 0, active = -1, ticking = false, running = false;

  function layout() {
    vh = window.innerHeight;
    laidOutW = window.innerWidth;
    let off = 0;
    SEGMENTS.forEach((s) => { s.start = off * vh; off += s.w; s.end = off * vh; });
    totalW = off;
    hero.style.height = `${(totalW + 1) * vh}px`; // +1vh para que el último yogur termine
    heroTop = hero.getBoundingClientRect().top + window.scrollY;
    read();
  }

  function jumpTo(i) {
    const s = SEGMENTS[i];
    window.scrollTo({ top: heroTop + s.start + (s.end - s.start) * 0.88, behavior: reduce ? "auto" : "smooth" });
  }
  dots.forEach((d, i) => d.addEventListener("click", () => jumpTo(i)));

  // lee el scroll: fija targets, opacidad y posición de cada yogur, y el capítulo activo
  function read() {
    const y = window.scrollY - heroTop;
    // El corte se parte al medio: el yogur que termina sale en la primera mitad y el
    // siguiente entra en la segunda, para que nunca se superpongan dos vasos.
    const half = (CROSSFADE * vh) / 2;
    let ci = 0;
    SEGMENTS.forEach((s, i) => { if (y >= s.start) ci = i; });

    SEGMENTS.forEach((s, i) => {
      s.target = reduce ? 1 : clamp((y - s.start) / (s.end - s.start));
      let op = 1, dir = 0;
      if (i > 0 && y < s.start + half) { op = smooth((y - s.start) / half); dir = 1; }            // entra por la derecha
      else if (i < N - 1 && y > s.end - half) { op = smooth((s.end - y) / half); dir = -1; }     // sale por la izquierda
      s.op = op;
      s.x = reduce ? 0 : dir * (1 - op) * 180;
    });

    if (ci !== active) {
      active = ci;
      hero.dataset.variant = ci;
      variantsEl.forEach((el, k) => el.classList.toggle("is-active", k === ci));
      dots.forEach((d, k) => { d.classList.toggle("is-active", k === ci); d.setAttribute("aria-current", k === ci ? "step" : "false"); });
    }
    const p = clamp(y / (totalW * vh));
    if (!reduce) blobs.forEach((b, k) => (b.style.transform = `translate(${(k % 2 ? -1 : 1) * p * 120}px, ${p * (k + 1) * 60}px)`));
    nav.classList.toggle("is-scrolled", window.scrollY > 40);
    ticking = false;
    if (!running) { running = true; requestAnimationFrame(raf); }
  }

  // persigue los targets con lerp y dibuja; se apaga solo cuando todo llegó
  function raf() {
    let moving = false;
    SEGMENTS.forEach((s, i) => {
      const d = s.target - s.cur;
      s.cur = reduce || Math.abs(d) < 0.0005 ? s.target : s.cur + d * LERP;
      if (s.cur !== s.target) moving = true;
      const vis = s.op > 0.001;
      s.set.g.style.display = vis ? "" : "none";
      if (!vis) return;
      s.set.g.setAttribute("transform", `translate(${s.x.toFixed(1)} 0) rotate(${(s.x / 22).toFixed(2)} 200 520)`);
      s.set.g.setAttribute("opacity", s.op.toFixed(3));
      const done = renderSet(s.set, s.cur);
      if (i === active) variantsEl[i].querySelectorAll(".steps li").forEach((li, k) => li.classList.toggle("is-done", done[k]));
    });
    if (moving) requestAnimationFrame(raf); else running = false;
  }

  window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(read); } }, { passive: true });
  window.addEventListener("resize", () => { if (coarse && window.innerWidth === laidOutW) return; layout(); });
  window.addEventListener("orientationchange", layout);
  window.addEventListener("load", layout);
  layout();

  /* ---------- reveals ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
  }, { threshold: .15 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  /* ---------- horarios ----------
     EDITAR AQUÍ los horarios reales del local.
     Índice 0 = domingo. Si cierra pasada la medianoche, poné p.ej. "00:30". */
  const HOURS = [
    ["Domingo", "12:00", "23:30"],
    ["Lunes", "13:00", "23:00"],
    ["Martes", "13:00", "23:00"],
    ["Miércoles", "13:00", "23:00"],
    ["Jueves", "13:00", "23:00"],
    ["Viernes", "13:00", "00:30"],
    ["Sábado", "12:00", "00:30"],
  ];
  const toMin = (s) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
  const span = ([, o, c]) => { const a = toMin(o); let b = toMin(c); if (b <= a) b += 1440; return [a, b]; };

  const list = document.getElementById("hours");
  const statusEl = document.getElementById("status");
  if (list) {
    // hora de Buenos Aires, sin depender de la zona del visitante
    const ba = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
    const today = ba.getDay();
    const now = ba.getHours() * 60 + ba.getMinutes();

    [1, 2, 3, 4, 5, 6, 0].forEach((d) => {
      const [day, o, c] = HOURS[d];
      const li = document.createElement("li");
      if (d === today) li.classList.add("is-today");
      li.innerHTML = `<span>${day}${d === today ? " · hoy" : ""}</span><time>${o} a ${c} hs</time>`;
      list.appendChild(li);
    });

    const [a, b] = span(HOURS[today]);
    const [pa, pb] = span(HOURS[(today + 6) % 7]);
    const open = (now >= a && now < b) || (pb > 1440 && now < pb - 1440 && pa < 1440);
    statusEl.textContent = open ? "Abierto ahora" : "Cerrado ahora";
    statusEl.classList.add(open ? "is-open" : "is-closed");
  }
})();
