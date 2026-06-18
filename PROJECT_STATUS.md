# Moovy — Estado del proyecto
Última actualización: 2026-06-17

> **Dashboard de una pantalla.** Para detalle de tareas → `ISSUES.md`. Para histórico de ramas → `.claude/CHANGELOG.md`.
> Para el detalle vivo de pendientes del checklist pre-launch → `docs/HANDOFF_PENDIENTES.md`.

---

## Pre-launch readiness

| Categoría | Estado |
|---|---|
| MP producción | ✅ Credenciales de PROD cargadas (ya no se usa sandbox; pagos se prueban en prod) |
| Split payments | 🟡 Implementado (Grupos B/C). Falta test real con 3 cuentas MP distintas en prod |
| Motor de envío (Biblia) | ✅ Conectado: fórmula fuel-based + zona/clima/demanda, preview = cobro, sin config fantasma |
| Cobertura por zonas | ✅ Gate point-in-polygon + aviso "fuera de cobertura". Falta confirmar zonas pintadas |
| Candado de lanzamiento | ✅ `LAUNCH_GATE` (env, fail-closed) + cortina `/proximamente` + abrir/cerrar-tienda.ps1. Mantenimiento sacado de OPS |
| Unit Economics | ✅ Dashboard read-only en `/ops/unit-economics` |
| Data cleanup pre-launch | 🔴 ABIERTO (script listo, falta ejecución día launch — ISSUE-004) |
| Deploy del batch acumulado | 🔴 PENDIENTE — develop tiene ~25 ramas sin deployar. Requiere devmain MODO SCHEMA + re-seed DeliveryRate |
| Tests automatizados | 🟡 0 E2E (Vitest configurado); scripts validate-*.ts sí corren |
| Seguridad (PIN, fraud, refund, encrypt, AAIP) | ✅ Cerrado |
| Panel OPS operativo | ✅ Cerrado |

**Veredicto**: en plena ronda de QA del checklist pre-launch. Se están cerrando las observaciones de a una rama. Cuando esté todo resuelto y probado en develop/local → deploy en modo schema → re-test en prod detrás de la cortina.

---

## Sprint actual (2026-06-17)

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

**Siguiente**: probar el logo del comercio en local (s4-4b-02), o arrancar el deploy del batch (ya hay 6 ramas acumuladas + las previas). Ver `docs/HANDOFF_PENDIENTES.md`.

**Pendiente de migrar a CLAUDE.md** (Mauro a mano, `.claude/` protegido): (a) `requireMerchantApi` como helper canónico de auth API del comercio (regla tipo #13/#28). (b) Semántica fail-safe **inversa** de los flags `merchant.doc.*` (requerido salvo OFF explícito). (c) El `notified` en el audit log de aprobaciones.

---

## Próximas tareas (orden)

1. **Correr en local ahora**: `npx tsx scripts/seed-feature-flags.ts` (crea los 5 flags `merchant.doc.*` en ON) + `npx tsx scripts/cleanup-deprecated-feature-flags.ts --execute` (borra la fila `buyer.cash-payment`).
2. **Cerrar las observaciones pendientes del checklist** (ver `docs/HANDOFF_PENDIENTES.md`): campana OPS → sección de puntos (requiere dirección del founder) → logo (probar local).
3. **Deploy del batch** con `devmain.ps1` MODO SCHEMA (NO `-NoDB`) + re-seed `DeliveryRate` + **post-deploy en prod**: `seed-feature-flags.ts` (flags docs) + cleanup scripts (`cleanup-deprecated-feature-flags.ts`, `fix-orders-completed-to-delivered.ts`) + `cerrar-tienda.ps1`.
3. **Test real de split MP** (3 cuentas distintas) en prod.
4. **Pintar/confirmar zonas de cobertura** en `/ops/zonas-delivery`.
5. **Día del launch**: `scripts/clean-db-pre-launch.ts --execute` + `abrir-tienda.ps1`.
6. **Post-launch**: SEO (aggregateRating + review), tests E2E, `feat/propinas-driver`.

---

## Métricas

- **Issues 🔴 abiertos**: 2 (ISSUE-004 cleanup data + deploy del batch acumulado pendiente — más grande aún: +4 ramas hoy)
- **Ramas cerradas esta sesión (2026-06-17)**: 4 (ver ISSUES.md "Resueltos 2026-06-17")
- **Scripts a correr en local**: `seed-feature-flags.ts` (flags docs) + `cleanup-deprecated-feature-flags.ts --execute` (borra flag efectivo)
- **TS errors en HEAD**: solo pre-existentes documentados (`.next/dev/types/*`). Nota: el `tsc` del entorno Cowork corre lentísimo y no completa; la verificación autoritativa la hace `finish.ps1` (tsc-strict) — esta sesión cazó 2 errores reales ahí (firma de retorno en `stats`, scope de prop en `SettingsForm`), ya corregidos.
- **Schemas pendientes de push**: ninguno nuevo (los flags usan el modelo `FeatureFlag` existente); el VPS sigue necesitando el push del batch (modo schema)

---

## Histórico

Ver `.claude/CHANGELOG.md` (histórico con detalle por rama).
