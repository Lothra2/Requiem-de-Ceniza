# Réquiem de Ceniza

Juego de rol de acción isométrico y oscuro. Todo es original: historia, clases, habilidades, monstruos, objetos, lugares,
música y arte, pintado por el motor gótico de la Forja (`src/engine/gotico`).

**Jugar:** https://lothra2.github.io/Requiem-de-Ceniza/

Funciona en PC, iPad y iPhone (en el teléfono, apaisado). En iPhone y iPad conviene abrirlo en Safari y usar
Compartir, Agregar a inicio, para que ocupe toda la pantalla.

## La partida

El guardado vive en el navegador y es de cada dirección web. Para pasar una partida de un sitio a otro, o de un aparato
a otro: Opciones, Partida, Sacar. Eso da un código (y un archivo). En el otro lado: Opciones, Partida, Traer.

## Trabajar en el juego

```
npm ci
npm run dev        # servidor de desarrollo en http://localhost:5190
npm run build      # arma el sitio en juego/dist
npm run typecheck
```

- `juego/` es el juego: código en `juego/src`, sprites horneados en `juego/public/assets`, pruebas de Playwright en `juego/herramientas`.
- `src/engine/` es el motor que pinta personajes, monstruos, jefes, escenarios y efectos.
- `juego/hornear/` vuelve a pintar los atlas (`npm run hornear`, tarda más de una hora).
- `juego/LEEME.md` cuenta qué tiene el juego y cómo se juega.

## Publicar

Cada push a `main` arma el juego y lo deja en la rama `gh-pages`, que es la que sirve GitHub Pages
(Settings, Pages, Deploy from a branch, `gh-pages`, carpeta raíz).

Los avisos de terceros están en `AVISOS_TERCEROS.md`.
