# Nutri Yog! landing page

Landing estática (HTML + CSS + JS en módulos, sin build). Usa módulos ES, así que hay que abrirla con un servidor local (no funciona con doble clic sobre `index.html`):

```bash
cd nutriyog
python3 -m http.server 8000   # → http://localhost:8000
# o: npx serve .
```

## Estructura
```
index.html            marcado de todas las secciones
styles.css            estilos y tokens de marca
js/main.js            punto de entrada: inicializa cada módulo
js/cups.js            vasos en SVG armados por capas + sabores (FLAVORS)
js/hero-carousel.js   carrusel coverflow del hero (resortes, arrastre, tilt, ola)
js/magnetic.js        botones magnéticos
js/site.js            nav, aparición de secciones y horarios
vendor/               Motion 11.11.17 (motion.dev, MIT), incluido localmente
assets/               fotos, video y tipografía Nunito
```

## Hero
Layout asimétrico: título a la izquierda, carrusel de sabores en el centro y la derecha, ola crema que separa los colores del fondo.
- **Coverflow:** el vaso elegido al frente; los siguientes se escalonan hacia la derecha, más chicos y más arriba. Todo se deriva de un único valor `pos` que Motion anima con un resorte, así las interrupciones conservan la velocidad.
- **Cómo se cambia de sabor:** píldoras de sabor, clic en un vaso de la fila, arrastre o swipe, y flechas del teclado.
- **Al llegar al frente** los toppings vuelven a caer sobre el vaso.
- **Fondo y ola:** el fondo cambia al color del sabor y la ola se mece con el movimiento del carrusel.
- **Tilt 3D** sobre el vaso al frente y **botones magnéticos** (solo con mouse); empuje `scale(.98)` al hacer clic.
- **Movimiento reducido:** sin resortes, tilt ni ola animada.
- **Agregar o editar un sabor:** sumá un objeto a `FLAVORS` en `js/cups.js` (colores de vaso, base, salsa, toppings, color de fondo) y su píldora en `index.html`.

## Para editar
- **Horarios**: constante `HOURS` en `js/site.js`.
- **Textos**: `index.html` (el texto de cada sabor está en `FLAVORS`).
- **Colores de marca**: variables en `:root` de `styles.css`.
- Íconos: Phosphor Icons (MIT), como sprite SVG al inicio de `index.html`.
- Diseño auditado con `taste-skill` (`.claude/skills/taste-skill/`).
