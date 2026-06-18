# Moovy — Estado del proyecto
Última actualización: 2026-06-18

> **Dashboard de una pantalla.** Para detalle de tareas → `ISSUES.md`. Para histórico de ramas → `.claude/CHANGELOG.md`.
> Para el detalle vivo de pendientes del checklist pre-launch → `docs/HANDOFF_PENDIENTES.md`.

---

## Pre-launch readiness

| Categoría | Estado |
|---|---|
| MP producción | ✅ Credenciales de PROD cargadas (ya no se usa sandbox; pagos se prueban en prod) |
| Split payments | 🟡 Implementado (Grupos B/C). Falta test real con 3 cuentas MP distintas en prod |
| Motor de envío (Biblia) | ✅ Conectado: fórmula fuel-based + zona/clima/demanda, preview = cobro, sin config fantasma |
| Cobertura por zonas | 🟡 Gate point-in-polygon OK. **Falta confirmar/pintar las zonas en `/ops/zonas-delivery`** |
| Candado de lanzamiento | ✅ `LAUNCH_GATE` (env, fail-closed) + cortina `/proximamente`. Cortina CONFIRMADA puesta en prod (2026-06-18) |
| Unit Economics | ✅ Dashboard read-only en `/ops/unit-economics` |
| Deploy del batch acumulado | ✅ DEPLOYADO a prod 2026-06-18 (19 commits, modo schema, db push no-op "already in sync", smoke test OK). Scripts post-deploy corridos |
| Crons en prod | ✅ ARREGLADOS 2026-06-18 — estaban todos en 401 hace ~14 días por comillas en `CRON_SECRET` del `.env`. Ver `docs/RUNBOOK_CRONS.md`. Falta sumar `daily-revenue-summary` al crontab (línea dada) |
| Data cleanup pre-launch | 🔴 ABIERTO (script listo, falta ejecución día launch — ISSUE-004) |
| Split payments | 🟡 Implementado. Falta test real con 3 cuentas MP distintas en prod |
| Tests automatizados | 🟡 0 E2E (Vitest configurado); scripts validate-*.ts sí corren |
| Seguridad (PIN, fraud, refund, encrypt, AAIP) | ✅ Cerrado |
| Panel OPS operativo | ✅ Cerrado |

**Veredicto**: el batch grande ya está en producción detrás de la cortina y los crons volvieron a andar. Quedan tareas operativas (categorías home, zonas, test MP, 5 items a re-probar) y los 2 pasos del día del launch. Ver el checklist simple en `docs/CHECKLIST_PARA_LANZAR.md`.

---

## Sprint actual (2026-06-18)

**Foco**: resolver TODAS las observaciones del checklist QA pre-launch, probar en develop/local (menos pagos, que ya están en prod), y después deployar el batch acumulado.

**Plan acordado con el founder**:
1. Resolver todas las observaciones (rama por rama).
2. Probar en develop/local (pagos NO — MP en prod, se prueban en prod).
3. `devmain.ps1` en **modo schema** + re-seed `DeliveryRate` + `cerrar-tienda.ps1`.
4. Re-test de lo nuevo en producción (detrás de la cortina).

**Cerrado esta sesión (2026-06-17 → 18)** — 6 ramas:
1. `feat/ops-notificacion-opcional-aprobacion` — checkbox "Notificar al usuario por email" (default ON) al aprobar/rechazar comercio y driver desde OPS. El audit log siempre registra + ahora guarda `notified`. Permite correcciones/QA sin spamear.
2. `fix/merchant-api-db-auth` — BUG del 403 post-aprobación: las APIs `/api/merchant/*` validaban contra el JWT cache (stale tras aprobar) → 403 aunque la DB dijera APPROVED. Nuevo helper `requireMerchantApi` (DB-based, espejo de `requireDriverApi`), 21 handlers migrados + refetch del dashboard al refrescar sesión. **Probado: la redirección post-aprobación carga sin 403.**
3. `feat/docs-comercio-configurables-ops` — documentación del comercio configurable desde `/ops/feature-flags` (5 flags `merchant.doc.*`). Semántica fail-safe inversa: requerido salvo flag explícito en OFF. **Pendiente correr el seed** (`scripts/seed-feature-flags.ts`) en local + prod.
4. `chore/quitar-flag-efectivo` — removido el flag fantasma `buyer.cash-payment` (checkout es electrónico-only; el flag no cableaba nada). Código de efectivo queda dormido para Fase 2. **Pendiente correr `cleanup-deprecated-feature-flags.ts --execute`** en local + prod.
5. `feat/ops-campana-notificaciones` — campana de notificaciones en el header de OPS. Endpoint nuevo `/api/admin/notifications` que deriva 4 fuentes (aprobaciones pendientes, change-requests docs, reseñas en moderación, incidentes de PIN) sin tocar schema. Componente con polling 45s + localStorage de "vistos". **Pendiente verificación local**: `npx tsx scripts/verify-ops-notifications.ts` + click-through.
6. `feat/puntos-wording-amex-y-acceso` — Sección de Puntos: wording estilo Amex (titular de valor + cálculo "10 por $1.000" movido a desplegable "Cómo se calcula"), chip de saldo en el header (`PointsBalanceChip`, solo logueados), y "dónde aplican" visible (productos no envío + se acreditan al recibir). Sin tocar lógica de earn/burn, sin schema. **Pendiente verificación local**: ver el chip con saldo + recorrer /puntos.

**Además esta sesión (2026-06-18), fuera de ramas de código:**
- ✅ **Logo del comercio (s4-4b-02)**: probado en local, guarda OK. La falla era data vieja de prod; el deploy lo arregló. Cerrado sin código.
- ✅ **DEPLOY del batch a producción**: `devmain.ps1` modo schema, 19 commits, smoke test OK. + scripts post-deploy (`seed-feature-flags`, `cleanup-deprecated-feature-flags --execute`, `fix-orders-completed-to-delivered --execute`) + `cerrar-tienda.ps1` (cortina confirmada).
- ✅ **Crons arreglados**: estaban en 401 hace ~14 días por comillas en `CRON_SECRET` del `.env` (la app las saca, el crontab no). Se removieron las comillas → 200. Documentado en `docs/RUNBOOK_CRONS.md`. Pendiente: sumar la línea de `daily-revenue-summary` al crontab del VPS.
- 📄 Docs nuevos (sin commitear en develop): `docs/RUNBOOK_DEPLOY_2026-06-18.md`, `docs/RUNBOOK_CRONS.md`, `docs/CHECKLIST_PARA_LANZAR.md`.

**Siguiente**: ver `docs/CHECKLIST_PARA_LANZAR.md` — categorías home, zonas, test MP, 5 items a re-probar; y día del launch: cleanup + abrir-tienda.

**Pendiente de migrar a CLAUDE.md** (Mauro a mano, `.claude/` protegido): (a) `requireMerchantApi` como helper canónico de auth API del comercio (regla tipo #13/#28). (b) Semántica fail-safe **inversa** de los flags `merchant.doc.*` (requerido salvo OFF explícito). (c) El `notified` en el audit log de aprobaciones.

---

## Próximas tareas (orden) — ver `docs/CHECKLIST_PARA_LANZAR.md`

1. **Sumar `daily-revenue-summary` al crontab del VPS** (línea ya dada; `0 12 * * *` = 9 AM ART). Verificar que el aviso rojo de "broadcast" del dashboard se vaya solo en ~1h.
2. **Configurar categorías de la home** en `/ops/categorias` (operativo).
3. **Pintar/confirmar zonas de cobertura** en `/ops/zonas-delivery`.
4. **Test real de pago MP** (1 compra real + split con 3 cuentas distintas) en prod.
5. **Re-probar 5 items sueltos** (sin bug conocido, solo verificar): s2-2a-11 (bonus bienvenida), s2-2b-01 (email registro comercio), s3-3c-01 (errores OPS en toast), s4-4c-04 (variantes producto), s7-7a-02 (bloqueo fuera de zona).
6. **Día del launch**: `scripts/clean-db-pre-launch.ts --execute` + `abrir-tienda.ps1`.
7. **Post-launch**: SEO (aggregateRating + review), tests E2E, `feat/propinas-driver`.

> Commitear cuando puedas los docs nuevos en develop (no van en una rama, son docs):
> `git add docs/ ISSUES.md PROJECT_STATUS.md && git commit -m "docs: cierre sesion 2026-06-18 (deploy + crons + checklists)" && git push origin develop`

---

## Métricas

- **Issues 🔴 abiertos**: 1 (ISSUE-004 cleanup data, es del día del launch). El deploy del batch ya NO es 🔴 (deployado 2026-06-18).
- **Ramas cerradas esta sesión (2026-06-17 → 18)**: 6 (ver ISSUES.md "Resueltos esta sesión").
- **Prod**: batch deployado (19 commits), cortina puesta, crons andando.
- **Pendiente operativo**: sumar `daily-revenue-summary` al crontab del VPS.
- **TS en prod**: el deploy corrió tsc + build limpio sin errores (red de seguridad de `devmain`).

---

## Histórico

Ver `.claude/CHANGELOG.md` (histórico con detalle por rama).
