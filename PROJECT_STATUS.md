# Moovy — Estado del proyecto
Última actualización: 2026-06-09

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

## Sprint actual (2026-06-09)

**Foco**: resolver TODAS las observaciones del checklist QA pre-launch (296 items), probar en develop/local (menos pagos, que ya están en prod), y después deployar el batch acumulado.

**Plan acordado con el founder**:
1. Resolver todas las observaciones (rama por rama).
2. Probar en develop/local (pagos NO — MP en prod, se prueban en prod).
3. `devmain.ps1` en **modo schema** + re-seed `DeliveryRate` + `cerrar-tienda.ps1`.
4. Re-test de lo nuevo en producción (detrás de la cortina).

**Estado**: `fix/comercio-ux-sugerir-y-categorias` cerrada (s4-4a-01 sin código, s4-4d-02 = tarea operativa OPS, + UX form de producto). Siguiente: driver s2-2c-04. Ver secuencia en `docs/HANDOFF_PENDIENTES.md`.

**Decisiones de negocio tomadas esta sesión**:
- Vendedor marketplace = **frictionless** (sin docs ni aprobación).
- Compra del propio comercio = **bloqueada** (ya estaba, ISSUE-003).
- Candado de lanzamiento por entorno (reemplaza el modo mantenimiento de OPS).

---

## Próximas tareas (orden)

1. **Cerrar las observaciones pendientes del checklist** (ver `docs/HANDOFF_PENDIENTES.md`): driver msg → campana OPS → sección de puntos → logo (probar local).
2. **Deploy del batch** con `devmain.ps1` MODO SCHEMA (NO `-NoDB`) + re-seed `DeliveryRate` + cleanup scripts post-deploy + `cerrar-tienda.ps1`.
3. **Test real de split MP** (3 cuentas distintas) en prod.
4. **Pintar/confirmar zonas de cobertura** en `/ops/zonas-delivery`.
5. **Día del launch**: `scripts/clean-db-pre-launch.ts --execute` + `abrir-tienda.ps1`.
6. **Post-launch**: SEO (aggregateRating + review), tests E2E, `feat/propinas-driver`.

---

## Métricas

- **Issues 🔴 abiertos**: 2 (ISSUE-004 cleanup data + deploy del batch acumulado pendiente)
- **Ramas cerradas esta sesión**: ~13 (ver ISSUES.md "Resueltos 2026-06-09")
- **Observaciones del checklist**: ~13 cerradas, 1 en proceso (logo), ~18 pendientes (varias son diseño/feature o a re-probar)
- **TS errors en HEAD**: solo pre-existentes documentados (`.next/dev/types/*`)
- **Schemas pendientes de push**: ninguno en local; el VPS necesita el push del batch (modo schema)

---

## Histórico

Ver `.claude/CHANGELOG.md` (histórico con detalle por rama).
