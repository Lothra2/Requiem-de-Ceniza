#!/bin/sh
# El servidor de desarrollo se cae seguido: este lo vuelve a levantar cada vez. Uso: sh juego/herramientas/servidor.sh &
cd "$(dirname "$0")/../.." || exit 1
while true; do npx vite --config juego/vite.config.ts --port 5190 --strictPort >/tmp/requiem-pruebas/vite.log 2>&1; sleep 1; done
