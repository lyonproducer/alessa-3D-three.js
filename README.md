# Alessa · Nuestro pequeño universo

Web familiar en React, TypeScript, Three.js y Canvas UI Particle Object. El proyecto usa Vite a través de Vinext.

## Abrir en esta computadora

Ejecuta `iniciar.ps1` con PowerShell. Utiliza el Node 24 disponible en esta computadora y abre el servidor en http://127.0.0.1:5173. Si lo detienes con Ctrl+C, puedes volver a iniciarlo con el mismo archivo.

En otra computadora instala Node 22.13 o superior y npm moderno. Luego:

    npm install
    npm run dev

## Comandos

- `npm run dev`: vista local.
- `npm run build`: compilar.
- `npm start`: servir la compilación.
- `npm run typecheck`: verificar TypeScript.
- `npm run models`: regenerar esculturas artísticas por mes.

## Contenido

- `app/page.tsx`: textos, meses, visor y galería.
- `app/globals.css`: estilo y adaptación móvil.
- `components/canvasui/ParticleObject.tsx`: componente de Canvas UI adaptado con límites de zoom y manejo de ausencia de WebGL.
- `components/rect-cache.ts`: dependencia auxiliar que faltaba en el registro de Canvas UI.
- `scripts/generate-models.mjs`: genera las cuatro esculturas glTF.
- `public/models`: modelos independientes de mayo a agosto.
- `public/recuerdos`: 43 copias de las imágenes del álbum.
- `lib/memories.json`: orden de las ecografías por mes.
- `Frijolito`: carpeta original del usuario, conservada intacta.

Las ecografías 2D no contienen el volumen necesario para reconstruir el cuerpo real de Alessa. Los modelos son esculturas estilizadas y aproximadas, no una reconstrucción médica ni una simulación exacta de su desarrollo. No se han inventado medidas, semanas, frecuencia cardíaca ni datos clínicos. Los números 01–04 identifican capítulos del álbum, no meses de gestación.

El visor permite arrastrar para girar en 360°, hacer zoom con rueda o pellizco, giro automático y restablecer la vista. Elige un mes para cambiar modelo, tamaño, texto e imágenes. Respeta la preferencia del sistema de reducir movimiento. Si falla WebGL, muestra la ecografía y permite reintentar.

## Referencia y privacidad

Particle Object procede de https://canvasui.dev/docs/components/particle-object y de su registro https://canvasui.dev/r/particle-object-react.json. Se integró directamente el código oficial del registro, con las adaptaciones indicadas arriba.

La web se entrega local, sin publicación ni servicios externos de análisis. Las ecografías originales contienen datos personales visibles; antes de compartir públicamente, prepara copias sin esos datos. El metadato noindex reduce indexación, pero no reemplaza control de acceso.

## Verificación

Compilación de producción, TypeScript y comprobación HTTP de la página. Se revisaron los controles y fichas en el navegador local. La apariencia artística no está validada contra anatomía clínica.

## Revisión inmersiva

La escena ocupa el primer viewport, con un entorno orgánico procedural en Three.js, iluminación en escala de grises y partículas de líquido. El texto inicial se reduce al nombre y el anuncio. El panel «Su ecografía» permite abrir la referencia de cada mes sin abandonar la escena.

Las figuras se regeneraron como superficies continuas mediante campos implícitos y Marching Cubes. Mayo, junio, julio y agosto tienen geometrías independientes y posturas inspiradas respectivamente en 05.png, 12.png, 01.jpg y 18.png de cada carpeta mensual. Son estudios artísticos de esas siluetas, sin inferir medidas o reconstruir zonas ocultas.

La interacción es girar por arrastre. El selector Partículas / Sólido cambia entre 28.000 partículas blancas y una superficie gris iluminada, conservando cámara, zoom y mes. Señalar una zona (o tocar sin arrastrar) abre sus medidas; Ver medidas ofrece acceso por teclado y botones de zonas.

`node scripts/verify-models.mjs` comprueba la carga, geometría finita, diferencias de silueta con tamaño normalizado y rayos que aciertan en las superficies y fallan sobre el fondo. Comprobaciones de TypeScript, lint, compilación y carga HTTP completadas. Se revisaron visualmente la cabeza desde distintos ángulos y la paleta en blanco, negro y grises en la vista local.



La cabeza usa ahora un único campo continuo con rasgos discretos, sin esferas añadidas para mejillas, nariz u orejas. La escena y la interfaz usan grises neutros, con 28.000 partículas blancas para Alessa. Las ecografías originales se conservan sin modificación.


## Transiciones y medidas interactivas

Las partículas se alinean espacialmente y se interpolan con una curva suave durante 3,6 segundos. Un cambio durante la animación parte de la posición visible actual. El aspecto sólido transforma una única superficie mediante campos de distancia interpolados, con postura gradual y una deformación elástica sutil. No superpone siluetas transparentes. La preferencia de reducir movimiento evita estas animaciones.

`lib/measurements.ts` conserva valores transcritos de las ecografías originales, fecha y número de foto. Cada ficha enlaza su imagen del álbum. No se estiman medidas ausentes ni se interpretan percentiles. Las definiciones básicas de biometría se contrastaron con [ISUOG](https://www.isuog.org/clinical-resources/fetal-biometry.html).

`BabyExplorer.ts` detecta la superficie frontal bajo el cursor y clasifica la zona usando campos del modelo artístico, también después de girar y acercar. Las fichas se desactivan durante el cambio de mes. `anatomy.json` se genera junto a los modelos para mantener las zonas alineadas si se modifica la geometría.

`node scripts/generate-solid-fields.mjs` genera los cuatro campos de distancia del modo sólido desde las mismas formas y rasgos que usa `generate-models.mjs`. Regenerar ambos al editar `scripts/model-studies.mjs`. Los archivos `.bin` de `public/models/clay` se cargan y se guardan en memoria por mes; la geometría se actualiza solo cuando cambia la forma y el sólido es visible. La transición parte del volumen visible si se selecciona otro mes antes de terminar.
