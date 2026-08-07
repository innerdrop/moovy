#!/bin/bash
#
# MOOVY — respaldo diario de la base de datos.
#
# Corre en el VPS, una vez por día, desde cron. Vive en el repo a propósito:
# antes esto era un archivo suelto en /usr/local/bin que no estaba en ningún
# lado, así que si se reinstalaba el servidor se perdía y nadie sabía por qué.
#
# ── LO QUE ESTE SCRIPT NO HACE, Y ES DELIBERADO ──────────────────────────────
#
# NO BORRA NADA en la nube. Ni un archivo viejo, ni uno roto, ni el suyo propio.
# El servidor escribe y nunca borra.
#
# Motivo: si alguien entra al VPS, las credenciales de respaldo están acá. Si
# ese token pudiera borrar, el atacante cifra la base Y vacía las copias — es el
# modo en que el ransomware gana. Con el token limitado a escritura, lo peor que
# puede hacer es ensuciar el bucket; lo que ya está escrito sigue estando.
#
# La limpieza de archivos viejos la hace una REGLA DE CICLO DE VIDA en
# Cloudflare, que el servidor no puede tocar. Ver docs/RESPALDOS.md.
#
# ── QUÉ HACE ─────────────────────────────────────────────────────────────────
#
#   1. Vuelca la base en formato comprimido (pg_dump -Fc)
#   2. La cifra con AES-256 — el proveedor guarda bytes que no puede leer
#   3. La sube a R2, a db/diario/
#   4. El día 1 de cada mes sube ADEMÁS una copia a db/mensual/ (retención larga:
#      la corrupción de datos se descubre meses después, y para entonces las
#      copias diarias ya tienen el error adentro)
#   5. Verifica que lo subido esté y pese lo que tiene que pesar
#   6. Avisa que anduvo (interruptor de hombre muerto — ver abajo)
#
# ── REQUISITOS EN EL SERVIDOR ────────────────────────────────────────────────
#
#   rclone configurado con un remoto llamado "r2"   (rclone config)
#   /root/.moovy-backup-key   con la frase de cifrado, chmod 600
#   /etc/moovy-backup.env     (opcional) con HEALTHCHECK_URL=...
#
# Instalación y restauración: docs/RESPALDOS.md
#
set -euo pipefail

# ── Parámetros ───────────────────────────────────────────────────────────────
CONTENEDOR_DB="moovy-db"
USUARIO_DB="postgres"
NOMBRE_DB="moovy_db"
REMOTO="r2:moovy-backups"
CLAVE="/root/.moovy-backup-key"
TRABAJO="/var/backups/moovy"
LOG="/var/log/moovy-backup.log"

# Un dump sano de Moovy pesa varios MB. Si sale mucho menos, algo falló en
# silencio: pg_dump puede terminar con éxito y escribir un archivo casi vacío si
# se le corta la conexión al contenedor. Este piso es la red que lo caza.
MINIMO_BYTES=1000000

# El archivo de configuracion es OPCIONAL y se lee con pinzas: solo las lineas
# con forma de CLAVE=valor. Antes se hacia `. archivo`, que ejecuta su contenido
# como comandos — un renglon mal escrito (una URL suelta, sin el nombre de la
# variable adelante) mataba el respaldo entero. Un respaldo no puede fallar por
# un error de tipeo en un archivo que ni siquiera es obligatorio.
if [ -f /etc/moovy-backup.env ]; then
    while IFS= read -r linea; do
        case "$linea" in
            \#*|"") continue ;;
            [A-Za-z_]*=*) export "${linea?}" 2>/dev/null || true ;;
            *) echo "[aviso] /etc/moovy-backup.env: renglon ignorado por no tener forma CLAVE=valor" ;;
        esac
    done < /etc/moovy-backup.env
fi
HEALTHCHECK_URL="${HEALTHCHECK_URL:-}"

decir() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

# Si algo falla, el interruptor de hombre muerto NO recibe el aviso y el sistema
# de alertas grita solo. No hace falta que este script sepa mandar mails.
fallo() {
    decir "ERROR en la línea $1 — el respaldo NO se completó"
    [ -n "$HEALTHCHECK_URL" ] && curl -fsS -m 10 --retry 3 "${HEALTHCHECK_URL}/fail" >/dev/null 2>&1 || true
    exit 1
}
trap 'fallo $LINENO' ERR

# ── Chequeos previos ─────────────────────────────────────────────────────────
[ -f "$CLAVE" ] || { decir "FALTA $CLAVE — sin clave no se cifra y no se sube"; exit 1; }
command -v rclone >/dev/null || { decir "FALTA rclone"; exit 1; }
mkdir -p "$TRABAJO"

SELLO=$(date +%Y%m%d-%H%M)
MES=$(date +%Y%m)
DIA_DEL_MES=$(date +%d)
LOCAL="$TRABAJO/moovy-$SELLO.dump.enc"

# ── 1 y 2 · Volcar y cifrar en una sola pasada ───────────────────────────────
# Sin archivo intermedio sin cifrar: el dump en claro nunca toca el disco.
decir "Volcando y cifrando la base..."
docker exec "$CONTENEDOR_DB" pg_dump -U "$USUARIO_DB" -Fc "$NOMBRE_DB" \
    | openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt -pass "file:$CLAVE" \
    > "$LOCAL"

PESO=$(stat -c%s "$LOCAL")
decir "Listo: $LOCAL ($PESO bytes)"

if [ "$PESO" -lt "$MINIMO_BYTES" ]; then
    decir "ERROR: el respaldo pesa $PESO bytes, menos del mínimo de $MINIMO_BYTES."
    decir "Eso casi siempre significa que pg_dump falló a mitad de camino."
    rm -f "$LOCAL"
    fallo $LINENO
fi

# ── 3 · Subir ────────────────────────────────────────────────────────────────
decir "Subiendo a $REMOTO/db/diario/ ..."
rclone copyto "$LOCAL" "$REMOTO/db/diario/moovy-$SELLO.dump.enc" --s3-no-check-bucket

# ── 4 · Copia mensual (abuelo-padre-hijo) ────────────────────────────────────
if [ "$DIA_DEL_MES" = "01" ]; then
    decir "Día 1 del mes: guardando también la copia de retención larga..."
    rclone copyto "$LOCAL" "$REMOTO/db/mensual/moovy-$MES.dump.enc" --s3-no-check-bucket
fi

# ── 5 · Verificar que del otro lado está y pesa igual ────────────────────────
# Subir sin verificar es suponer. rclone puede terminar bien y dejar un objeto
# truncado si la red se cortó en el último tramo.
decir "Verificando en la nube..."
PESO_REMOTO=$(rclone size "$REMOTO/db/diario/moovy-$SELLO.dump.enc" --json 2>/dev/null | grep -o '"bytes":[0-9]*' | cut -d: -f2)
if [ "${PESO_REMOTO:-0}" != "$PESO" ]; then
    decir "ERROR: en la nube pesa ${PESO_REMOTO:-0} y acá $PESO. No coinciden."
    fallo $LINENO
fi
decir "Verificado: $PESO bytes de los dos lados."

# ── 6 · Limpieza LOCAL solamente ─────────────────────────────────────────────
# Acá sí borramos, porque es el disco del propio servidor y hay que dejarle
# lugar. Lo de la nube no se toca nunca desde acá.
find "$TRABAJO" -name 'moovy-*.dump.enc' -mtime +7 -delete
find "$TRABAJO" -name 'moovy-*.dump' -mtime +7 -delete

# ── 7 · Avisar que anduvo ────────────────────────────────────────────────────
# El aviso es AL REVÉS de lo intuitivo: no avisamos cuando falla, confirmamos
# cuando funciona. Si el servidor está muerto no puede avisar nada — pero el
# servicio externo nota que el latido no llegó y grita solo.
if [ -n "$HEALTHCHECK_URL" ]; then
    curl -fsS -m 10 --retry 3 "$HEALTHCHECK_URL" >/dev/null 2>&1 || decir "AVISO: no se pudo confirmar el latido"
fi

decir "Respaldo completo."
