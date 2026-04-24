# MOOVY — Checklist de Deploy a Producción

Este documento lista todo lo que hay que verificar **antes**, **durante** y **después** de un deploy a `main` (producción VPS somosmoovy.com).

Orden recomendado: leerlo de arriba hacia abajo la primera vez. Para deploys rutinarios, saltar a la sección "Deploy rutinario".

---

## 1. Pre-deploy (en local, antes de correr `devmain.ps1`)

Verificaciones que garantizan que no vas a romper producción:

1. Estás posicionado en `develop` con la rama feature ya mergeada.
2. Todas las ramas abiertas fueron cerradas con `.\scripts\finish.ps1`.
3. `npx tsc --noEmit --skipLibCheck` corre limpio (sólo los errores pre-existentes documentados en `.claude/CLAUDE.md`).
4. `npx tsx scripts/validate-ops-config.ts` devuelve 9/9 verde.
5. El `.env` local está sincronizado con el del VPS (DATABASE_URL, CRON_SECRET, MP_ACCESS_TOKEN, etc.). Si agregaste una variable nueva en esta sesión, anotala para sumarla al VPS manualmente después.
6. Si alguna rama mergeada tocó `prisma/schema.prisma`, anotá que vas a tener que correr `npx prisma db push && npx prisma generate` en el VPS post-deploy.

---

## 2. Deploy rutinario

Para deploys donde NO cambió ni el schema, ni el .env, ni los crons:

```powershell
.\scripts\devmain.ps1
```

El script mergea `develop` → `main`, sube el código al VPS, sube la base de datos si corresponde, y reinicia la app. Esperá a que termine sin errores antes de seguir.

---

## 3. Post-deploy (en el VPS)

Conectate por SSH al VPS y corré estas verificaciones **sólo si aplica** (marco cuándo aplica cada una):

### 3.1. Si hubo cambios de schema

```bash
cd /ruta/al/proyecto
npx prisma db push
npx prisma generate
pm2 restart moovy
```

Verificá que no haya errores de "Unknown field" en los logs de PM2 después del restart.

### 3.2. Si agregaste variables nuevas al `.env`

Editá `.env` en el VPS con las variables que anotaste en el paso 1.6, y reiniciá la app:

```bash
pm2 restart moovy
```

### 3.3. Si corriste `clean-db-pre-launch.ts` en local (primera vez o reset)

Correlo también en el VPS para dejar la DB de producción limpia con sólo el admin:

```bash
npx tsx scripts/clean-db-pre-launch.ts
# Revisar el dry-run primero, después:
npx tsx scripts/clean-db-pre-launch.ts --execute
```

Confirmá con `SI BORRAR` cuando te lo pida.

---

## 4. Crons del VPS (configuración one-time)

Moovy NO se autoinvoca — los crons del directorio `src/app/api/cron/` son endpoints HTTP que esperan un `POST` externo con `Authorization: Bearer <CRON_SECRET>`. El dashboard OPS (`/ops/dashboard`) muestra alertas si detecta que un cron registrado en `CRON_EXPECTATIONS` no corrió dentro de su ventana.

### 4.0. Lista consolidada (copiar y pegar al crontab del VPS)

Antes de cualquier deploy nuevo, **verificá que el `crontab -l` del VPS tenga estas 5 líneas**. Si alguna falta, agregala con `crontab -e`. Reemplazá `<CRON_SECRET>` por el valor real del `.env` del VPS (sin comillas).

```
0 4 * * * curl -X POST -H "Authorization: Bearer <CRON_SECRET>" https://somosmoovy.com/api/cron/cleanup-location-history >> /var/log/moovy-cron.log 2>&1
0 6 * * * curl -X POST -H "Authorization: Bearer <CRON_SECRET>" https://somosmoovy.com/api/cron/driver-docs-expiry >> /var/log/moovy-cron.log 2>&1
*/10 * * * * curl -X POST -H "Authorization: Bearer <CRON_SECRET>" https://somosmoovy.com/api/cron/process-broadcasts >> /var/log/moovy-cron.log 2>&1
30 3 * * * curl -X POST -H "Authorization: Bearer <CRON_SECRET>" https://somosmoovy.com/api/cron/rate-order-reminder >> /var/log/moovy-cron.log 2>&1
0 5 * * * curl -X POST -H "Authorization: Bearer <CRON_SECRET>" https://somosmoovy.com/api/cron/points-expiring-reminder >> /var/log/moovy-cron.log 2>&1
```

Distribución horaria intencional — todos los diarios se reparten entre 3:30 y 6:00 AM (hora de baja actividad en Ushuaia) para no competir por DB / SMTP. `process-broadcasts` corre cada 10 min porque las campañas se procesan en batches de 200 recipients y sin cadencia frecuente una campaña de 10k users tarda horas.

### 4.1. Cron: Limpieza de historial GPS (obligatorio)

**Endpoint**: `POST /api/cron/cleanup-location-history`
**Función**: Borra registros de `DriverLocationHistory` de más de 30 días.
**Frecuencia recomendada**: diaria, a las 4 AM (hora de baja actividad en Ushuaia).
**Por qué es obligatorio**: sin este cron, `DriverLocationHistory` crece ~100 filas por driver-orden activa cada 10s de GPS. En una semana sin limpieza, se degrada la performance de la DB entera.

**Configuración**:

1. Conectate al VPS por SSH.
2. Abrí el crontab: `crontab -e`
3. Agregá esta línea (reemplazá `<CRON_SECRET>` con el valor real del `.env` del VPS):

```
0 4 * * * curl -X POST -H "Authorization: Bearer <CRON_SECRET>" https://somosmoovy.com/api/cron/cleanup-location-history >> /var/log/moovy-cron.log 2>&1
```

4. Guardá y salí del editor.
5. Verificá que quedó registrado: `crontab -l`

**Validación (después de 24 horas)**:

Entrá a `/ops/dashboard` con el admin. Si el cron corrió al menos una vez, la alerta "Cron Limpieza de historial GPS nunca se ejecutó" debe desaparecer. Si querés validar inmediatamente sin esperar al horario, pegale una vez manual desde el VPS:

```bash
curl -X POST -H "Authorization: Bearer <CRON_SECRET>" https://somosmoovy.com/api/cron/cleanup-location-history
```

Después chequeá en Prisma Studio (o con una query directa) que haya una fila nueva en la tabla `CronRunLog` con `jobName: "cleanup-location-history"` y `success: true`.

### 4.2. Cuando agregues un cron nuevo

El checklist para cada cron que se sume en el futuro es el mismo:

1. El cron se escribe como endpoint en `src/app/api/cron/<nombre>/route.ts`, envuelto en `recordCronRun(...)` de `src/lib/cron-health.ts`.
2. Se registra en `CRON_EXPECTATIONS` del mismo `src/lib/cron-health.ts` con `{ maxHours, label }`.
3. Se agrega la línea al crontab del VPS con la frecuencia acordada.
4. Se valida en el dashboard OPS que el healthcheck lo marca como `healthy`.

Crons ya implementados y registrados (todos con su línea en sección 4.0):

- `cleanup-location-history` — diario 4 AM, limpia historial GPS viejo.
- `driver-docs-expiry` — diario 6 AM, avisa 7/3/1 días antes del vencimiento de docs de driver y auto-suspende al vencer.
- `process-broadcasts` — cada 10 min, procesa campañas de broadcast push/email en batches de 200 recipients.
- `rate-order-reminder` — diario 3:30 AM, recordatorio de calificar pedidos 24-48h post-DELIVERED.
- `points-expiring-reminder` — diario 5 AM, aviso a usuarios con puntos próximos a vencer (150 días sin actividad).

Crons planificados pero aún no implementados (agregarlos acá cuando se hagan):

- `retry-assignments` (ISSUE-015) — cada 5 minutos, detecta pedidos stuck.
- `cart-recovery` — cada 30 minutos, recuperación de carritos abandonados.
- `recompute-loyalty-tiers` — diario, recalcula tiers de fidelización de merchants.

---

## 5. Smoke test post-deploy

Ver `SMOKE_TEST.md` para el flujo completo con 4 perfiles (Buyer, Merchant, Driver, OPS). Como mínimo, validar que:

1. Podés entrar a `somosmoovy.com` y la home carga.
2. Podés loguear como admin en `/ops` con las credenciales reales del `.env`.
3. El dashboard OPS no muestra alertas danger que no hayan existido antes del deploy.
4. Socket.IO conecta (verificar en consola del browser sin errores de CORS).

---

## Notas importantes

- **Nunca** usar `npx prisma migrate dev` en el VPS. Sólo `db push`.
- **Nunca** commitear con `--no-verify` en este proyecto.
- Si el deploy falla a mitad de camino, chequear los logs del VPS (`pm2 logs moovy`) antes de intentar rollback.
- Si el cron de limpieza GPS lleva más de 30 horas sin correr, la alerta del dashboard pasa de `never-ran` a `stale` (warning). Ambos casos requieren atención: revisar el crontab del VPS.
