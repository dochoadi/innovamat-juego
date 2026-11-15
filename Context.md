# Context.md — Liga de Saltos

## Qué es y para quién
Juego web (PWA, un solo `index.html`) para que niños de **1º a 6º de primaria** practiquen cálculo mental con el **método de saltos en la línea numérica** de Innovamat, de forma divertida (4 mundos temáticos, cromos, trofeos, duelos entre hermanos). Se usa en iPad/iPhone/Samsung, **sin conexión**.

## Método pedagógico (Innovamat) que se respeta
- **Suma:** se deja el primer número y se *descompone el segundo* en saltos fáciles (44 + 38 = +30, +6, +2; pasar por la decena) o se *compensa* (+40 y −2).
- **Resta:** dos estrategias — *quitar* (saltos hacia atrás: 75 − 58 = −50, −5, −3) y *distancia* (saltos hacia delante del número pequeño al grande: 58 → 60 → 75 = 2 + 15).
- **Multiplicar/dividir:** saltos repetidos (suma/resta repetida) y, desde 4º, **modelo rectangular** (17 × 4 = 10×4 + 7×4): cada salto es «parte × factor». División como «¿cuántos saltos caben?» (con resto desde 5º).
- **Progresión del soporte visual:** collar de bolas (1º–2º) → marcas de decenas → línea casi vacía (3º) → **línea numérica vacía** (4º–6º). Al ampliar el rango se vuelve a un apoyo más concreto.
- Fuentes consultadas: ebook *Operaciones básicas* de Innovamat y su blog (suma/resta, línea numérica, multiplicación, división). Las páginas del blog son dinámicas; el detalle por curso de 5º–6º **no estaba publicado**, así que los rangos de 5º–6º (decimales, negativos) son una **propuesta propia coherente con el método** y conviene revisarlos con la programación del colegio.

## Cursos y niveles (src/problems.js → `TIERS`)
| Curso | Suma/resta | Multiplicar / dividir |
|---|---|---|
| 1º | hasta 10 → 20 → 50 | dobles, saltos de 2, 5, 10 |
| 2º | hasta 50 → 100 | tablas 2,3,4,5,6,10 |
| 3º | hasta 200 → 500 → 1000 | todas las tablas |
| 4º | hasta 2000 → 5000 → 10 000 | por partes (2–3 cifras × 1 cifra) |
| 5º | décimas/centésimas | 3×1 y 2×2 cifras; división con resto |
| 6º | decimales y negativos (termómetro) | decimales × y ÷ |
Cada curso: 3 subniveles (Aprendo/Practico/Reto) + adaptación automática (`adapt()` en `data.js`).

## Arquitectura
- `src/problems.js` — generadores puros (sin DOM) y búsqueda del camino más corto (`bfs`) → **estrellas**: 3⭐ si el nº de saltos ≤ mínimo, 2⭐ si +1, 1⭐ si más; la pista y los fallos restan. Números como **enteros escalados** (centésimas para decimales) para evitar errores de coma flotante.
- `src/data.js` — datos del jugador (v2), migración, cromos, trofeos, retos semanales, racha, adaptación.
- `src/game.js` — motor: sesiones (`train`, `azar`, `daily`, `timed`, `duel`, `torneo`), turnos, rondas, panel de saltos, fin de sesión.
- `src/scene.js` — canvas: línea numérica según el apoyo del curso, parallax, sprites animados (respiración, estirar/aplastar), partículas.
- `src/sprites.js` — mundos, cromos, fondos y personajes dibujados en canvas (sin imágenes externas).
- `src/ui.js` — pantallas (jugadores, edad/curso, inicio, entrenar, duelo/torneo, álbum, trofeos, resultados), copia de seguridad, detección de móvil/tablet y orientación (`layout()`).
- `src/audio.js` (música procedural Web Audio), `src/profiles.js` (jugadores), `src/pwa.js` (icono generado, manifest, service worker), `src/art-libs.js` (futbolistas estilizados).
- `build.py` concatena todo en `index.html`. `sw.js` cachea para uso sin conexión: **subir `CACHE` en cada versión**.

## Datos y la regla de oro: no perder el progreso
- Claves de `localStorage` que **no se pueden cambiar**: `liga-saltos:<id>`, `liga-saltos-bak:<id>` (copia), `liga-mate:jugadores`, `liga-saltos-casa` (marcador), `liga-mate:audio`.
- Esquema v2: `{v, theme, edad, curso, sub, total, best{}, skin{}, extra{}, coins, streak{last,n}, trophies[], stats{}, chal{}, daily, up, down}`.
- Si cambia el formato: añadir un paso en `migrate()` (`data.js`), subir `DATA_VERSION`, **nunca** reiniciar `total` ni borrar claves; probar con datos antiguos antes de publicar. Se carga la copia (principal/backup/memoria) con más estrellas.
- v1 → v2: se conservan `total`, `best`, `theme`, `skin`; se pregunta la edad una vez.

## Competición entre hermanos (sin internet)
Un solo dispositivo por turnos con pantalla «Pasa el dispositivo a X». **Duelo** (2 jugadores, mismas operaciones, cada uno con su curso), **Torneo** (3–6). Puntos = estrellas + bonus de rapidez (≤ 20 s). Empate = sin ganador. Marcador de la casa persistente.

## Cómo ampliar
- **Nuevo mundo:** añadir a `THEMES`, `PAL`, `CARDS`, y casos en `drawBG`, `drawGoal`, `drawSprite` (`sprites.js`) y color en `puff()` (`game.js`).
- **Nuevo modo/operación:** añadir caso en `makeProblem` (`problems.js`), opciones de `goalReached()` (`game.js`) y tile en `MODES` (`ui.js`).
- **Nuevo trofeo/reto:** `TROPHIES` / `CHALS` en `data.js`.

## Seguridad y privacidad
Sin cuentas, sin servidores, sin analítica, sin claves ni APIs. Todo queda en el dispositivo. `.gitignore` excluye secretos por si algún día se añaden; revisar con `grep -rniE "key|token|secret|password" .` antes de cada push.

## Pruebas
`node tools/test-problems.js` (5040 problemas, todos resolubles). En el navegador se usó un resolvedor automático (BFS) por curso × subnivel × operación × mundo, flujos de duelo/torneo/reto/contrarreloj y migración v1→v2; capturas en móvil, Samsung, iPad en vertical y horizontal. Pendiente siempre: probar en un iPad real tras publicar.
