# Liga de Saltos

Juego de cálculo mental con **saltos en la línea numérica** (método Innovamat): sumar, restar, multiplicar y dividir saltando.
Un único fichero (`index.html`), sin dependencias y **sin conexión a internet** una vez cargado.

- **4 mundos:** Fútbol ⚽ · Coches 🏎️ · Esquí ⛷️ · Dragones 🐉
- **6 niveles:** hasta 20, 50, 100, 200, 500 y 1000
- **8 modos:** Saltos que suman · Quitar saltando · ¿Cuánto falta? · Pasa y vuelve · Completa el salto · Saltos repetidos · Reparto a saltos · Liga mixta
- Estrellas por menos saltos, cromos coleccionables y varios jugadores (progreso guardado en el dispositivo).
- Se adapta solo a iPhone, iPad, Samsung/Android y ordenador, en vertical y horizontal.

## Ponerlo en el iPad / iPhone / Android (con icono, sin conexión)

El repositorio es privado, así que GitHub Pages gratis no sirve. Opciones:

**A) Netlify (la más sencilla, gratis)**
1. Entra en https://app.netlify.com → *Add new site* → *Import an existing project* → GitHub → elige `dochoadi/innovamat-juego`.
2. Sin comando de build; carpeta de publicación: `/` (raíz). Pulsa *Deploy*.
3. Te da una dirección tipo `https://nombre.netlify.app`.

**B) Cloudflare Pages** (gratis, también con repos privados): *Workers & Pages* → *Create* → *Pages* → *Connect to Git* → este repo, sin build, directorio de salida `/`.

**C) Sin cuenta nueva:** descarga el ZIP del repo (*Code → Download ZIP*), descomprímelo y arrastra la carpeta a https://app.netlify.com/drop.

**En el dispositivo** (con la dirección del paso anterior):
- **iPad/iPhone:** abre la dirección en **Safari** → botón Compartir → **Añadir a pantalla de inicio**. Ábrelo una vez con conexión; después funciona sin internet.
- **Samsung/Android:** abre en **Chrome** → menú ⋮ → **Instalar aplicación** (o *Añadir a pantalla de inicio*).

Notas: si no suena en iPhone, quita el modo silencio y toca la pantalla una vez. El progreso se guarda en cada dispositivo.

Solo como fichero: en Android se puede abrir `index.html` con Chrome; en iOS Safari no abre ficheros locales (haría falta una app como *Documents by Readdle*).
