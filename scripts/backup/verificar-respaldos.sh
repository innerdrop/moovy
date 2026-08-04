#!/bin/bash
#
# MOOVY — ¿tengo respaldo? Contestá esto sin adivinar.
#
# Se corre a mano cuando querés dormir tranquilo, y también desde cron una vez
# por día a media mañana — a esa hora el respaldo de la madrugada ya tiene que
# existir, así que si no está, algo pasó anoche y todavía hay tiempo de mirarlo.
#
# No revisa que el respaldo SIRVA (para eso hay que restaurarlo, ver
# docs/RESPALDOS.md). Revisa que EXISTA, que sea RECIENTE y que PESE bien.
# Es el chequeo barato que caza el 90% de los problemas: el cron que dejó de
# correr, el token que venció, el disco lleno.
#
set -uo pipefail

REMOTO="r2:moovy-backups"
MINIMO_BYTES=1000000
HORAS_MAXIMAS=30       # margen sobre las 24 h del ciclo diario

verde()  { echo -e "  \033[32mOK\033[0m    $*"; }
rojo()   { echo -e "  \033[31mMAL\033[0m   $*"; }
gris()   { echo -e "        $*"; }

PROBLEMAS=0

echo ""
echo "  RESPALDOS DE MOOVY — $(date '+%Y-%m-%d %H:%M')"
echo "  ─────────────────────────────────────────────"
echo ""

# ── 1 · El último respaldo diario ────────────────────────────────────────────
ULTIMO=$(rclone lsjson "$REMOTO/db/diario" 2>/dev/null \
    | grep -o '"Name":"[^"]*"' | cut -d'"' -f4 | sort | tail -1)

if [ -z "$ULTIMO" ]; then
    rojo "No hay NINGÚN respaldo en $REMOTO/db/diario"
    PROBLEMAS=$((PROBLEMAS+1))
else
    PESO=$(rclone size "$REMOTO/db/diario/$ULTIMO" --json 2>/dev/null | grep -o '"bytes":[0-9]*' | cut -d: -f2)
    # El nombre trae el sello: moovy-YYYYMMDD-HHMM.dump.enc
    FECHA=$(echo "$ULTIMO" | sed 's/moovy-\([0-9]\{8\}\)-\([0-9]\{4\}\).*/\1 \2/')
    SEGUNDOS=$(( $(date +%s) - $(date -d "${FECHA:0:4}-${FECHA:4:2}-${FECHA:6:2} ${FECHA:9:2}:${FECHA:11:2}" +%s 2>/dev/null || echo 0) ))
    HORAS=$(( SEGUNDOS / 3600 ))

    if [ "$HORAS" -gt "$HORAS_MAXIMAS" ]; then
        rojo "El último respaldo es de hace $HORAS horas: $ULTIMO"
        gris "El cron dejó de correr o está fallando."
        PROBLEMAS=$((PROBLEMAS+1))
    else
        verde "Último respaldo: hace $HORAS h — $ULTIMO"
    fi

    if [ "${PESO:-0}" -lt "$MINIMO_BYTES" ]; then
        rojo "Pesa ${PESO:-0} bytes, menos del mínimo de $MINIMO_BYTES"
        gris "Un dump que pesa casi nada es un dump que falló a mitad."
        PROBLEMAS=$((PROBLEMAS+1))
    else
        verde "Peso: $(( PESO / 1024 / 1024 )) MB"
    fi
fi

# ── 2 · Cuántos hay guardados ────────────────────────────────────────────────
CUANTOS=$(rclone lsjson "$REMOTO/db/diario" 2>/dev/null | grep -c '"Name"' || echo 0)
if [ "$CUANTOS" -lt 2 ]; then
    rojo "Solo hay $CUANTOS respaldo(s) diario(s). Una sola copia no es respaldo."
    PROBLEMAS=$((PROBLEMAS+1))
else
    verde "Respaldos diarios guardados: $CUANTOS"
fi

# ── 3 · La retención larga ───────────────────────────────────────────────────
MENSUALES=$(rclone lsjson "$REMOTO/db/mensual" 2>/dev/null | grep -c '"Name"' || echo 0)
if [ "$MENSUALES" -lt 1 ]; then
    gris "Todavía no hay copias mensuales (se crean el día 1 de cada mes)."
else
    verde "Copias mensuales: $MENSUALES"
fi

# ── 4 · El espejo de las fotos ───────────────────────────────────────────────
FOTOS_ORIGEN=$(rclone size "r2:moovy-uploads" --json 2>/dev/null | grep -o '"count":[0-9]*' | cut -d: -f2)
FOTOS_ESPEJO=$(rclone size "$REMOTO/uploads-espejo" --json 2>/dev/null | grep -o '"count":[0-9]*' | cut -d: -f2)

if [ "${FOTOS_ESPEJO:-0}" -lt "${FOTOS_ORIGEN:-1}" ]; then
    rojo "Fotos: origen ${FOTOS_ORIGEN:-?}, espejo ${FOTOS_ESPEJO:-0}. Falta copiar."
    PROBLEMAS=$((PROBLEMAS+1))
else
    verde "Fotos: ${FOTOS_ORIGEN:-?} en origen, ${FOTOS_ESPEJO:-?} en el espejo"
fi

# ── Veredicto ────────────────────────────────────────────────────────────────
echo ""
if [ "$PROBLEMAS" -eq 0 ]; then
    echo -e "  \033[32mTodo en orden.\033[0m"
    echo ""
    echo "  Recordá: esto verifica que el respaldo EXISTA, no que SIRVA."
    echo "  Una vez por mes hay que restaurarlo de verdad — docs/RESPALDOS.md"
else
    echo -e "  \033[31m$PROBLEMAS problema(s). Mirá arriba.\033[0m"
fi
echo ""
exit "$PROBLEMAS"
