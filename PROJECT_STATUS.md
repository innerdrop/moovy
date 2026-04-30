# Moovy — Estado del proyecto
Última actualización: 2026-04-30

> **Dashboard de una pantalla.** Para detalle de tareas → `ISSUES.md`. Para histórico de ramas → `.claude/CHANGELOG.md`.

---

## Pre-launch readiness

| Categoría | Estado |
|---|---|
| Código pre-launch crítico | ✅ Cerrado |
| Tests automatizados | 🔴 0 escritos (Vitest configurado) |
| MP producción | 🔴 Solo credenciales TEST |
| Data cleanup pre-launch | 🔴 ABIERTO (script listo, falta ejecución día launch) |
| AAIP compliance (Ley 25.326) | ✅ ConsentLog + export ARCO + opt-in marketing + cookies |
| Seguridad (PIN, fraud, refund, encrypt) | ✅ Cerrado |
| Panel OPS operativo | ✅ Cerrado (emails editables, segmentos, broadcast, payouts, playbook, zonas, fraude, crons, auditoría) |
| Performance mobile | ✅ Mobile-first, responsive 9 secciones OPS |
| UI/UX | ✅ Checklist 25+ items cerrados |

**Veredicto**: listo para correr el checklist pre-lanzamiento end-to-end. El único bloqueante real es la ejecución del script de cleanup el día del launch.

---

## Sprint actual (2026-04-28)

**Foco**: optimización de contexto + checklist pre-lanzamiento.

**Ramas en curso / recién cerradas**:
- ✅ `feat/avatar-dropdown-portales` — dropdown del header con accesos a portales
- ✅ `fix/aprobacion-sin-foto-driver` — driver sin foto + hard delete pedidos colgados
- 🔄 `chore/optimize-claude-context` — sintetizar CLAUDE.md + CHANGELOG.md + ISSUES.md depurado + finish.ps1 con prompt

**Próxima decisión**: correr checklist pre-launch (Mauro en browser + Claude en scripts) o seguir con `feat/propinas-driver` post-launch.

---

## Próximas tareas (orden por valor)

1. **Checklist pre-lanzamiento manual** — pagos / PIN doble / flujos críticos / seguridad / Ushuaia / infra (ver `docs/prompts-cowork/PROMPT_5_DIARIO_FINAL.md`)
2. **Día del launch**: ejecutar `scripts/clean-db-pre-launch.ts --execute` con confirmación
3. **Día del launch**: activar credenciales MP producción + verificar webhook URL
4. **Post-launch (semanas 1-2)**: GitHub Actions con TS check + scripts validate-*.ts
5. **Post-launch (semanas 2-4)**: 5-6 tests E2E con Playwright para flujos críticos
6. **Post-launch (mes 1)**: `feat/propinas-driver`
7. **Post-launch (cuando convenga)**: ISSUE-061 UTF-8 encoding fix

---

## Métricas

- **Issues 🔴 abiertos**: 1 (ISSUE-004 — ejecución, no código)
- **Issues 🟡 abiertos**: 0 (ISSUE-061 cerrado en `fix/utf8-encoding-pipeline`)
- **TS errors en HEAD**: 0 nuevos (solo pre-existentes documentados en CLAUDE.md)
- **Schemas pendientes de migrate**: ninguno
- **Crons registrados con healthcheck**: ver `CRON_EXPECTATIONS` en `src/lib/cron-health.ts`

---

## Histórico

Ver `.claude/CHANGELOG.md` (~22 entries con detalle por rama desde 2026-03 a hoy).
