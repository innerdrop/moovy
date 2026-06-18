# Runbook — Crons de Moovy (programación + troubleshooting)

> Cómo se ejecutan los crons en producción y cómo diagnosticar cuando "no corren".
> Última actualización: 2026-06-18.

## Cómo funcionan

Los crons son **endpoints HTTP** `POST /api/cron/<jobName>`, protegidos con
`Authorization: Bearer $CRON_SECRET` (comparación timing-safe). El código NO se
auto-dispara: el **crontab del sistema en el VPS** (`crontab -l` como root) los
golpea en horario. Cada corrida se registra en `CronRunLog` vía `recordCronRun()`,
y el dashboard `/ops` + `CRON_EXPECTATIONS` (en `src/lib/cron-health.ts`) reportan
"no corre hace Xh" si falta.

- VPS: `ssh root@31.97.14.156`, app en `/var/www/moovy`, log en `/var/log/moovy-cron.log`.
- El crontab lee el secret del `.env` en cada corrida (no hardcodeado).
- La cortina `LAUNCH_GATE` NO afecta `/api/*`, así que los crons andan con la tienda cerrada.

## ⚠️ Gotcha conocido: CRON_SECRET SIN comillas en el .env

**Síntoma:** todos los crons devuelven `401 {"error":"No autorizado"}` y el
dashboard los marca como "no corre" aunque el cron daemon esté activo y el crontab
dispare cada minuto.

**Causa:** si en el `.env` la línea es `CRON_SECRET="xxxx"` (con comillas),
Next/dotenv se las saca al cargar (la app valida `xxxx`), pero el crontab extrae
el valor con `grep ^CRON_SECRET .env | cut -d= -f2-` y se lleva las comillas
(`"xxxx"`) → manda `Bearer "xxxx"` → no matchea → 401.

**Regla:** en el `.env` del VPS, `CRON_SECRET` va **SIN comillas**:
```
CRON_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
(Pasó el 2026-06-18: alguien le puso comillas ~14 días antes y tumbó TODOS los crons.)

**Fix rápido (sin tocar la app, no requiere pm2 reload):**
```bash
cp /var/www/moovy/.env /var/www/moovy/.env.bak.$(date +%s)
sed -i 's/^CRON_SECRET="\(.*\)"$/CRON_SECRET=\1/' /var/www/moovy/.env
grep ^CRON_SECRET /var/www/moovy/.env | cat -A   # verificar: CRON_SECRET=...$  sin ""
```
En el próximo tick (1 min) los crons vuelven a 200.

## Playbook de diagnóstico

```bash
# 1. El daemon de cron esta vivo?
systemctl status cron --no-pager | head -4        # debe decir "active (running)"

# 2. El crontab existe?
crontab -l

# 3. Que esta pasando en cada corrida?
tail -n 20 /var/log/moovy-cron.log                # 401 -> secret; connection refused -> red

# 4. Test manual de un endpoint (esperamos 200)
SECRET=$(grep '^CRON_SECRET=' /var/www/moovy/.env | cut -d= -f2- | tr -d '"'\''\r' | xargs)
curl -s -o /dev/null -w "%{http_code}\n" -X POST -H "Authorization: Bearer $SECRET" https://somosmoovy.com/api/cron/mp-reconcile
```

Lectura: daemon inactivo → `systemctl enable --now cron`. 401 → revisar comillas/CR
del `CRON_SECRET` (ver gotcha). 200 pero dashboard sigue rojo → mirar `CronRunLog`.

## Crontab de referencia (server en UTC)

Cada línea: `curl -X POST -H "Authorization: Bearer $(grep ^CRON_SECRET /var/www/moovy/.env | cut -d= -f2)" https://somosmoovy.com/api/cron/<job> >> /var/log/moovy-cron.log 2>&1`

| Frecuencia (cron) | Jobs |
|---|---|
| `* * * * *` (cada min) | assignment-tick, cancel-stale-pending-payments, driver-presence-check |
| `*/2 * * * *` | merchant-timeout |
| `*/5 * * * *` | retry-assignments, scheduled-notify, close-auctions* |
| `*/10 * * * *` | process-broadcasts, mp-reconcile |
| `0 * * * *` | cart-recovery |
| `0 1 * * *` | backup pg_dump diario (+ retención 30d) |
| `0 2` / `30 2` / `30 3` / `0 4` / `30 4` / `0 5` / `0 6` UTC | driver-docs-expiry, cleanup-cron-runs, rate-order-reminder, cleanup-location-history, update-merchant-tiers, points-expiring-reminder, seller-resume |
| `0 12 * * *` (= 9 AM ART) | **daily-revenue-summary** (agregado 2026-06-18, faltaba) |

\* `close-auctions` está deshabilitado para el launch (ISSUE-002); el cron corre pero no hace nada.

> La lista canónica de jobs + su umbral de alerta vive en `CRON_EXPECTATIONS`
> (`src/lib/cron-health.ts`). Si agregás un cron nuevo: (1) endpoint `/api/cron/<job>`
> con `recordCronRun`, (2) entrada en `CRON_EXPECTATIONS`, (3) línea en el crontab del VPS.
