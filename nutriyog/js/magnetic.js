/* ==========================================================
   magnetic.js: botones que se acercan al cursor con un resorte.
   El empuje al hacer clic (scale .98) vive en CSS (propiedad `scale`),
   así no compite con el `transform` que maneja este módulo.
   ========================================================== */
const { animate } = window.Motion;

const SPRING = { type: "spring", stiffness: 220, damping: 15, mass: 0.6 };
const PULL = 0.25;   // fracción de la distancia al centro que sigue el botón
const MAX = 9;       // px máximos de desplazamiento (no pisa al botón vecino)
const REACH = 14;    // px alrededor del botón donde ya empieza a atraer

export function initMagnetic(selector) {
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!fine || reduce) return;

  document.querySelectorAll(selector).forEach((el) => {
    let active = false;
    window.addEventListener("pointermove", (ev) => {
      const r = el.getBoundingClientRect();
      const near = ev.clientX > r.left - REACH && ev.clientX < r.right + REACH
        && ev.clientY > r.top - REACH && ev.clientY < r.bottom + REACH;
      if (near) {
        active = true;
        const dx = ev.clientX - (r.left + r.width / 2);
        const dy = ev.clientY - (r.top + r.height / 2);
        const cap = (v) => Math.max(-MAX, Math.min(MAX, v * PULL));
        animate(el, { x: cap(dx), y: cap(dy) }, SPRING);
      } else if (active) {
        active = false;
        animate(el, { x: 0, y: 0 }, SPRING);
      }
    }, { passive: true });
  });
}
