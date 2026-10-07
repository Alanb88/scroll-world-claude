# Nutri Yog! — landing page

Landing estática (HTML + CSS + JS, sin dependencias). Abrí `index.html` o serví la carpeta:

```bash
python3 -m http.server 8000   # → http://localhost:8000
```

## Secciones
1. **Hero con animación por scroll**: se arman 3 yogures (Clásico, Açaí, Frutos rojos), del vaso vacío a la base, la salsa, los toppings y la cuchara. Todo es SVG generado en `app.js` (`VARIANTS`), así que se pueden sumar variantes o cambiar toppings y colores.
2. **Quiénes somos**: collage de fotos + historia.
3. **Variedades**: yogurt helado, açaí, churros, canolis, frutos rojos.
4. **Experiencia + horarios**: video, features del local y horarios con indicador "abierto ahora" (hora de Buenos Aires).

## Para editar
- **Horarios**: constante `HOURS` al final de `app.js`.
- **Textos**: `index.html`.
- **Colores de marca**: variables en `:root` de `styles.css` (rosa `#EB92B2`, verde claro `#D7E6AD`, amarillo claro `#F8EDA6`, crema `#F3F0E4`, verde logo `#1D5635`).
- Tipografía: Nunito (Google Fonts).
