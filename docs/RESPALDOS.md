# Respaldos de Moovy

Cómo está armado el resguardo, cómo se instala y —lo que de verdad importa—
**cómo se vuelve atrás el día que haga falta.**

Este documento existe porque el día que lo necesites vas a estar nervioso y no
vas a querer improvisar. Todo lo que sigue está pensado para leerse a las tres
de la mañana.

---

## 1 · Qué se guarda y dónde

| Qué | Dónde vive normalmente | Dónde está el respaldo |
|---|---|---|
| **Base de datos** | Postgres en Docker, en el VPS | R2 `moovy-backups/db/` + tu computadora |
| **Fotos de productos** | R2 `moovy-uploads` (desde 28/03/2026) | R2 `moovy-backups/uploads-espejo/` |
| **Archivos previos a marzo** | Disco del VPS, `public/uploads` | R2, copia única (no cambian nunca) |
| **Código** | GitHub | GitHub |
| **Config de nginx** | `/etc/nginx/conf.d/` | Este repo, sección 8 |

**Lo único irreemplazable es la base de datos.** El código está en GitHub, la
infraestructura se rearma en una tarde, las fotos están en R2. Pero el catálogo
cargado, los pedidos, los usuarios y las direcciones no existen en ningún otro
lado. Todo el diseño gira alrededor de proteger eso.

---

## 2 · Los números que definen el diseño

**RPO — cuánto trabajo se puede perder:** hasta 24 horas. Es el hueco entre
respaldo y respaldo. Aceptable con el volumen actual de pedidos; cuando entren
cien pedidos por día hay que bajar a minutos con archivado continuo de WAL
(sección 9).

**RTO — cuánto se tarda en volver:** unos 15 minutos, medido en la prueba de
restauración. **Si nadie restauró en el último mes, este número es mentira.**

---

## 3 · Las tres reglas que no se negocian

**El servidor escribe, nunca borra.** El token de R2 que vive en el VPS puede
crear objetos y no puede eliminarlos. Si alguien entra al servidor, puede cifrar
la base pero no puede vaciar las copias — que es exactamente el modo en que el
ransomware gana. La limpieza de lo viejo la hace una regla de ciclo de vida en
Cloudflare, que el servidor no puede tocar.

**Hay una copia que el servidor no puede alcanzar.** La que traés vos a tu
máquina, con un token distinto de solo lectura que el VPS nunca vio.

**Nada se sube sin cifrar.** El dump lleva nombres, teléfonos, direcciones y
correos de vecinos de Ushuaia — datos personales bajo la Ley 25.326. Se cifra en
el mismo caño en que se genera: el dump en claro nunca toca el disco.

> **La frase de cifrado va en tu gestor de contraseñas.** Si vive solamente en
> el servidor y perdés el servidor, tenés respaldos que no podés abrir. Es la
> forma más cruel de no tener respaldo.

---

## 4 · Instalación en el VPS

### 4.1 · rclone

```bash
curl https://rclone.org/install.sh | sudo bash
rclone version
```

### 4.2 · Conectar con R2

```bash
rclone config
```

**Hacen falta DOS remotos, no uno.** Los buckets están en jurisdicciones
distintas —`moovy-backups` en la europea, `moovy-uploads` en la por defecto— y
Cloudflare da un endpoint diferente para cada una. Pedir un bucket por la puerta
equivocada devuelve `AccessDenied`, que parece un problema de permisos y es de
ruteo. Se pierde media hora buscando en el lugar equivocado.

En vez de pasar por el asistente interactivo, escribir el archivo directo:

```bash
nano /root/.config/rclone/rclone.conf
```

```ini
[r2]
type = s3
provider = Cloudflare
access_key_id = TU_ACCESS_KEY_ID
secret_access_key = TU_SECRET_ACCESS_KEY
endpoint = https://TU_ACCOUNT_ID.eu.r2.cloudflarestorage.com
region = auto
acl = private
no_check_bucket = true

[r2global]
type = s3
provider = Cloudflare
access_key_id = TU_ACCESS_KEY_ID
secret_access_key = TU_SECRET_ACCESS_KEY
endpoint = https://TU_ACCOUNT_ID.r2.cloudflarestorage.com
region = auto
acl = private
no_check_bucket = true
```

```bash
chmod 600 /root/.config/rclone/rclone.conf
```

Las credenciales son **las mismas en los dos bloques** (es un solo token que
alcanza los dos buckets). Lo único que cambia es el endpoint: uno con `.eu.` y
el otro sin.

`no_check_bucket = true` es obligatorio: nuestro token no puede crear buckets
—y está bien que no pueda—, pero rclone por defecto intenta verificar que el
bucket exista de una forma que requiere ese permiso.

**Probar así, no con `rclone lsd r2:`:**

```bash
rclone ls r2:moovy-backups
rclone size r2global:moovy-uploads
```

`rclone lsd r2:` pide listar TODOS los buckets de la cuenta y siempre va a dar
403: el token está acotado a dos buckets a propósito. Ese 403 es la prueba de
que la restricción funciona, no un error.

El primero no devuelve nada si el bucket está vacío. El segundo tiene que
mostrar el conteo de fotos.

### 4.3 · La clave de cifrado

```bash
openssl rand -base64 48 > /root/.moovy-backup-key
chmod 600 /root/.moovy-backup-key
cat /root/.moovy-backup-key
```

**Copiá esa frase a tu gestor de contraseñas AHORA.** Sin ella, ningún respaldo
sirve para nada.

### 4.4 · El interruptor de hombre muerto

Creá un chequeo gratis en healthchecks.io (período: 1 día, margen: 6 horas) y:

```bash
echo 'HEALTHCHECK_URL=https://hc-ping.com/TU-UUID' > /etc/moovy-backup.env
chmod 600 /etc/moovy-backup.env
```

El aviso es **al revés** de lo intuitivo: no avisamos cuando falla, confirmamos
cuando funciona. Si el servidor está muerto no puede avisar nada — pero el
servicio externo nota que el latido no llegó y grita solo. Es lo que faltaba
cuando `moovy-socket` estuvo caído días sin que nadie se enterara.

### 4.5 · Los scripts

Viven en el repo y llegan con el deploy. Solo hay que darles permiso:

```bash
chmod +x /var/www/moovy/scripts/backup/*.sh
/var/www/moovy/scripts/backup/moovy-backup.sh
```

### 4.6 · El cron

```bash
crontab -e
```

```cron
# Respaldo de la base — todos los días a las 06:00 UTC (03:00 en Ushuaia)
0 6 * * * /var/www/moovy/scripts/backup/moovy-backup.sh >> /var/log/moovy-backup.log 2>&1

# Espejo de las fotos — domingos a las 05:00 UTC
0 5 * * 0 /var/www/moovy/scripts/backup/moovy-uploads-snapshot.sh >> /var/log/moovy-backup.log 2>&1

# Chequeo a media mañana: a esta hora el de la madrugada ya tiene que estar
0 13 * * * /var/www/moovy/scripts/backup/verificar-respaldos.sh >> /var/log/moovy-backup.log 2>&1
```

> El cron viejo `0 1 * * * ... daily_*.sql` en `/var/www/moovy/backups/` queda
> como respaldo local de emergencia. No lo saques todavía: dos redes son mejor
> que una hasta que la nueva tenga un mes de funcionar bien.

---

## 5 · Reglas de ciclo de vida en Cloudflare

Se configuran en el panel de R2, bucket `moovy-backups` → **Settings → Object
lifecycle rules**. Van acá y no en el script **a propósito**: es la única forma
de que el servidor no pueda borrar nada.

| Prefijo | Regla |
|---|---|
| `db/diario/` | Eliminar a los **30 días** |
| `db/mensual/` | Eliminar a los **365 días** |
| `uploads-espejo/` | Sin regla — no se borra nunca |

---

## 6 · La copia que el servidor no puede tocar

En Cloudflare, creá un **segundo token** llamado `moovy-backups-lectura`, con
permiso **Object Read only** sobre `moovy-backups`. **Ese token no se pone nunca
en el VPS.**

En tu Windows:

```powershell
winget install Rclone.Rclone
rclone config
```

Mismo procedimiento que en el servidor, pero el remoto se llama **`r2moovy`** y
usás el token de lectura.

Y una vez por semana:

```powershell
.\scripts\backup\traer-respaldo.ps1
```

---

## 7 · RESTAURAR — leé esto primero cuando algo salió mal

### Antes de tocar nada

**Sacá una foto del estado actual, aunque esté roto.** Si restaurás encima sin
guardar lo que hay, perdés la evidencia de qué pasó y cualquier dato que se haya
salvado.

```bash
docker exec moovy-db pg_dump -U postgres -Fc moovy_db > /var/backups/moovy/ANTES-DE-RESTAURAR-$(date +%Y%m%d-%H%M).dump
```

### Elegir el respaldo

```bash
rclone lsl r2:moovy-backups/db/diario | sort -k4
```

Elegí uno **anterior al problema**. Si el error fue a las 15:00 de hoy, el de
esta madrugada sirve. Si venía corrompiéndose hace semanas, andá a `db/mensual/`.

### Bajarlo y descifrarlo

```bash
cd /var/backups/moovy
rclone copyto r2:moovy-backups/db/diario/ARCHIVO.dump.enc ./restaurar.dump.enc
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass file:/root/.moovy-backup-key -in restaurar.dump.enc -out restaurar.dump
ls -lh restaurar.dump
```

Si el descifrado falla, la frase no es la correcta. **No sigas**: probá con la
de tu gestor de contraseñas antes de tocar la base.

### Restaurar

```bash
pm2 stop moovy moovy-socket
docker exec -i moovy-db pg_restore -U postgres -d moovy_db --clean --if-exists < restaurar.dump
pm2 start moovy moovy-socket
sleep 10
curl -s -o /dev/null -w "%{http_code}\n" https://somosmoovy.com/api/health
```

Apagar la app antes es importante: si sigue escribiendo mientras se restaura,
quedan mezclados datos viejos y nuevos.

### Confirmar

```bash
docker exec moovy-db psql -U postgres -d moovy_db -c \
  'SELECT (SELECT COUNT(*) FROM "Product") AS productos, (SELECT COUNT(*) FROM "Order") AS pedidos, (SELECT COUNT(*) FROM "User") AS usuarios;'
```

Comparalos con lo que esperabas. Y después entrá al sitio y mirá con los ojos.

---

## 8 · La prueba mensual (la que hace que todo esto sea verdad)

Una vez por mes, sin apuro y sin que nada esté roto:

```bash
docker exec moovy-db psql -U postgres -c 'CREATE DATABASE moovy_prueba;'

cd /var/backups/moovy
rclone copyto r2:moovy-backups/db/diario/ULTIMO.dump.enc ./prueba.dump.enc
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass file:/root/.moovy-backup-key -in prueba.dump.enc -out prueba.dump
docker exec -i moovy-db pg_restore -U postgres -d moovy_prueba < prueba.dump

docker exec moovy-db psql -U postgres -d moovy_prueba -c \
  'SELECT (SELECT COUNT(*) FROM "Product") AS productos, (SELECT COUNT(*) FROM "Order") AS pedidos, (SELECT COUNT(*) FROM "User") AS usuarios;'

docker exec moovy-db psql -U postgres -c 'DROP DATABASE moovy_prueba;'
rm -f prueba.dump prueba.dump.enc
```

Anotá la fecha y los números. **Si hace más de un mes que no corrés esto, no
sabés si tenés respaldos.**

---

## 9 · Lo que falta y cuándo hacerlo

**Archivado continuo de WAL (recuperación a un punto en el tiempo).** Baja el
RPO de 24 horas a segundos: te deja volver a "las 14:32 de ayer, justo antes del
error". Hoy sería sobre-ingeniería. **Disparador: cien pedidos por día**, o el
día que un error de datos te cueste plata de verdad.

**Un tercer destino con otro proveedor.** Hoy los dos buckets viven en la misma
cuenta de Cloudflare. Un problema de cuenta —facturación, suspensión, una
credencial de administrador filtrada— se los lleva a los dos. La copia semanal
en tu máquina cubre esto a medias. **Disparador: cuando Moovy facture lo
suficiente como para que perder una semana duela.**

**Cifrado con clave rotable.** Hoy la frase es una sola y para siempre. Cuando
haya más de una persona con acceso al servidor, hay que poder rotarla.

---

## 10 · Chequeo rápido

```bash
/var/www/moovy/scripts/backup/verificar-respaldos.sh
```

Te dice en diez segundos si hay respaldo, de cuándo es, cuánto pesa y si el
espejo de fotos está al día.

Lo que **no** te dice es si sirve. Eso solo lo sabés restaurando (sección 8).


---

## 11 · Diagnóstico: probar cada pieza sin generar un respaldo

Cuando algo no anda, o después de reinstalar el servidor, este bloque prueba las
siete piezas por separado y no deja nada atrás.

```bash
echo "=== 1. El contenedor de la base responde ==="
docker exec moovy-db psql -U postgres -d moovy_db -c 'SELECT COUNT(*) FROM "Product";' || echo FALLO

echo "=== 2. pg_dump funciona ==="
docker exec moovy-db pg_dump -U postgres --schema-only moovy_db | head -3 || echo FALLO

echo "=== 3. La clave de cifrado ==="
ls -l /root/.moovy-backup-key

echo "=== 4. Cifrar y descifrar de ida y vuelta ==="
echo "prueba-$(date +%s)" > /tmp/pru.txt
openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt -pass file:/root/.moovy-backup-key -in /tmp/pru.txt -out /tmp/pru.enc
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass file:/root/.moovy-backup-key -in /tmp/pru.enc -out /tmp/pru2.txt
diff /tmp/pru.txt /tmp/pru2.txt && echo "OK: lo que se cifra se puede volver a abrir"

echo "=== 5. Escribir en el bucket ==="
rclone copyto /tmp/pru.enc r2:moovy-backups/prueba-conexion.enc && echo "OK escritura"
rclone deletefile r2:moovy-backups/prueba-conexion.enc && echo "OK limpieza"

echo "=== 6. El aviso automático ==="
. /etc/moovy-backup.env 2>/dev/null
curl -fsS -m 10 "$HEALTHCHECK_URL" && echo " <- OK" || echo "FALLO o no configurado"

echo "=== 7. Los scripts ==="
ls -l /var/www/moovy/scripts/backup/

rm -f /tmp/pru.txt /tmp/pru.enc /tmp/pru2.txt
```

**El paso 4 es el más importante de los siete.** Demuestra que lo que se cifre
hoy se va a poder abrir mañana con la frase guardada. Todo lo demás son cañerías;
ese es el que decide si los respaldos sirven.

El paso 5 escribe fuera de los prefijos con candado (`db/`, `uploads-espejo/`)
justamente para poder borrar lo que dejó. Si escribiera adentro, el archivo de
prueba quedaría ahí hasta que venciera la retención.

### Errores conocidos y qué significan

| Mensaje | Qué es en realidad |
|---|---|
| `ListBuckets ... AccessDenied` con `rclone lsd r2:` | Correcto: el token está acotado a dos buckets |
| `ListObjectsV2 ... AccessDenied` sobre `moovy-uploads` | Remoto equivocado: va con `r2global:` |
| `Credential access key has length 16, should be 32` | Quedó el texto de ejemplo sin reemplazar en `rclone.conf` |
| `/etc/moovy-backup.env: line 1: https://... No such file` | Falta `HEALTHCHECK_URL=` adelante de la URL |
| `rclone ls` sin salida ni error | El bucket está vacío, o `--max-depth 1` y los archivos están en carpetas |
