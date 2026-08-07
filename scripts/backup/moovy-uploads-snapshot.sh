#!/bin/bash
#
# MOOVY — copia semanal de las fotos, de un bucket al otro.
#
# Las fotos de productos viven en Cloudflare R2 (bucket moovy-uploads) desde el
# 28 de marzo de 2026. Que estén fuera del servidor está bien, pero hay UNA sola
# copia: si un error de la app borra objetos, o alguien borra un producto y el
# sistema limpia sus imágenes, en R2 desaparecen y no hay a dónde volver.
#
# R2 es almacenamiento, no respaldo. Esto lo convierte en respaldo.
#
# Copia moovy-uploads -> moovy-backups/uploads-espejo/ una vez por semana.
# Son dos buckets separados con permisos distintos, así un borrado accidental en
# uno no se lleva el otro.
#
# IMPORTANTE: se usa `copy`, NO `sync`. `sync` haría el destino idéntico al
# origen — incluidos los borrados. Justamente lo que queremos evitar: si algo
# borra las fotos del origen, el espejo las conserva.
#
set -euo pipefail

# OJO con el remoto: moovy-uploads vive en la jurisdiccion por defecto y
# moovy-backups en la europea. Cloudflare da un endpoint distinto para cada una,
# y pedirle un bucket por la puerta equivocada devuelve AccessDenied — un error
# que parece de permisos y es de ruteo. Por eso hay dos remotos en rclone.conf.
ORIGEN="r2global:moovy-uploads"
DESTINO="r2:moovy-backups/uploads-espejo"

decir() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

command -v rclone >/dev/null || { decir "FALTA rclone"; exit 1; }

# Comprobar los dos remotos ANTES de copiar: si uno no responde, es mejor
# enterarse ahora que a mitad de la transferencia.
rclone lsjson "$ORIGEN" --max-depth 1 >/dev/null 2>&1 || {
    decir "ERROR: no se puede leer $ORIGEN. Revisa el remoto en rclone.conf."
    exit 1
}

decir "Copiando fotos de $ORIGEN a $DESTINO ..."
rclone copy "$ORIGEN" "$DESTINO" --s3-no-check-bucket --transfers 4 --stats-one-line

ORIGEN_N=$(rclone size "$ORIGEN" --json 2>/dev/null | grep -o '"count":[0-9]*' | cut -d: -f2)
DESTINO_N=$(rclone size "$DESTINO" --json 2>/dev/null | grep -o '"count":[0-9]*' | cut -d: -f2)
decir "Origen: ${ORIGEN_N:-?} objetos · Espejo: ${DESTINO_N:-?} objetos"

# El espejo puede tener MÁS que el origen (conserva lo borrado), nunca menos.
if [ "${DESTINO_N:-0}" -lt "${ORIGEN_N:-0}" ]; then
    decir "ERROR: el espejo tiene menos objetos que el origen. Algo no se copió."
    exit 1
fi

decir "Espejo al día."
