/* ==========================================================
   site.js: nav al scrollear, aparición de secciones y horarios.
   ========================================================== */
export function initSite() {
  const nav = document.getElementById("nav");
  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

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
}
