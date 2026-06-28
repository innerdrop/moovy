# Moovy — Estado del proyecto
Última actualización: 2026-06-26

> **Dashboard de una pantalla.** Para detalle de tareas → `ISSUES.md`. Para histórico de ramas → `.claude/CHANGELOG.md`.
> Para el detalle vivo de pendientes del checklist pre-launch → `docs/HANDOFF_PENDIENTES.md`.

---

## Pre-launch readiness

| Categoría | Estado |
|---|---|
| MP producción | ✅ Credenciales de PROD cargadas (ya no se usa sandbox; los pagos se prueban en prod) |
| Modelo de pago / split | 🟡 **Modelo final cerrado**: el comercio banca su propia comisión de MP; Moovy cobra su comisión + el envío completos; cada parte paga su 7,6% de MP por la acreditación al instante. También se arregló el bug de que el descuento no se aplicaba al cobro. Rama `fix/split-mp-comercio-banca-mp` (556a7ce) cerrada y mergeada a develop. **Falta: deployar + 1 test real de pago con cuentas MP distintas en prod** |
| Comisión del comercio | ✅ **Decidida: 10%** (ni 8% ni 12%) — competitiva y subible de a poco. Mes 1 gratis. **Falta aplicar el 10% en `/ops/config-biblia` de prod** (confirmar también operativo 5%) |
| Motor de envío (Biblia) | ✅ Conectado: fórmula fuel-based + zona/clima/demanda, preview = cobro, sin config fantasma |
| Cobertura por zonas | 🟡 Gate point-in-polygon OK. **Falta confirmar/pintar las zonas en `/ops/zonas-delivery`** |
| Candado de lanzamiento | ✅ `LAUNCH_GATE` (env, fail-closed) + cortina `/proximamente`. Cortina CONFIRMADA puesta en prod |
| Unit Economics | ✅ Dashboard read-only en `/ops/unit-economics` |
| Deploy a prod | 🟡 El batch grande ya está en prod (2026-06-18, 19 commits). PERO develop tiene el **fix de pagos sin deployar** → próximo `devmain.ps1` lo lleva a prod |
| Crons en prod | ✅ Andando (se arregló el 401 por comillas en `CRON_SECRET`). Ver `docs/RUNBOOK_CRONS.md`. Falta sumar `daily-revenue-summary` al crontab |
| Data cleanup pre-launch | 🔴 ABIERTO (script listo, se ejecuta el día del launch — ISSUE-004) |
| Tests automatizados | 🟡 0 E2E (Vitest configurado); scripts `validate-*.ts` sí corren |
| Seguridad (PIN, fraud, refund, encrypt, AAIP) | ✅ Cerrado |
| Panel OPS operativo | ✅ Cerrado |

**Veredicto**: el batch grande ya está en producción detrás de la cortina. Lo nuevo de esta sesión es el modelo de pago definitivo (rama cerrada en develop, falta deployar) y la decisión de comisión al 10%. El camino a launch es: aplicar comisión 10% + deployar el fix + hacer el primer pago real de prueba.

---

## Sprint actual (2026-06-26)

**Foco**: cerrar el modelo de pago definitivo, dejarlo listo para deployar, y hacer el primer pago real de prueba en producción.

**Cerrado esta sesión**:
- **Modelo de pago final**: se definió y se implementó que el comercio banca su propia comisión de MP, Moovy cobra su comisión + el envío completos, y cada parte paga su 7,6% de MP por la acreditación al instante (Moovy NO absorbe el MP del comercio). El comprador paga precio limpio (sin recargo visible). Los descuentos los absorbe Moovy.
- **Bug del descuento**: se arregló que el descuento no se estaba aplicando al cobro real (`buildPreferenceBody` ahora totaliza sobre `order.total`).
- **Comisión 10%**: decisión del founder — arrancar en 10% (no 8%, no 12%) para ser competitivos y poder subirla de a poco. Falta aplicarla en la biblia de prod.
- **Rama `fix/split-mp-comercio-banca-mp` (556a7ce)** cerrada y mergeada a develop.
- **Orden de ramas**: se recuperó un enredo donde el cambio había quedado suelto en develop; se movió a su rama y se cerró bien. Se borraron 4 ramas viejas ya mergeadas.
- **Herramientas financieras (uso personal del founder)**: PDF del flujo de pago, PDF de análisis financiero (3 escenarios: desastre / real / óptimo) y un simulador interactivo (`Moovy_Simulador_Financiero.html`) con comparación de escenarios, programa MOOVER y % de envíos gratis.
- **Limpieza del manual + nueva modalidad de trabajo**: se corrigió `CLAUDE.md` (MP a prod + fecha). Acordamos: el **estado vivo** se mantiene en este tablero (que Claude edita en cada cierre); `CLAUDE.md` queda solo con canon perdurable; Claude entrega un bloque listo para pegar solo cuando cambia una regla de fondo.
- **Comisión 10% aplicada + deploy del fix de pagos + pago de prueba real en prod**. El pago confirma OK, pero el pedido quedaba `UNASSIGNABLE`: el motor buscaba repartidor UNA sola vez y, sin nadie online en ese instante, mataba el pedido sin reintentar. Diagnóstico cerrado (no era el pago, ni los vehículos, ni el GPS — era el hueco de re-disparo cuando un repartidor se conecta tarde).
- **Rama `feat/asignacion-reintento-y-reembolso`** (implementada + verificada): un pedido pagado nunca queda sin asignar. Estado `SEARCHING_DRIVER` con ventana configurable (`driver_search_window_minutes`, default 20 min), reintento por cron `assignment-tick` + al conectarse un repartidor, y **reembolso automático** al vencer la ventana. Checkout bloquea el pago si no hay repartidor (ofrece "Retirar en local" / "Avisame cuando haya repartidor", sin opción de programar). El aviso "ya hay repartidor" ahora también va por **email** (confiable en iPhone web). Schema: `Order.driverSearchUntil`. Script: `scripts/verify-driver-search-flow.ts`. **Pendiente: merge (finish.ps1) + deploy modo schema + prueba real en prod.**

---

## Próximas tareas (orden)

1. **Cerrar + deployar `feat/asignacion-reintento-y-reembolso`** (`finish.ps1` → `devmain.ps1` modo schema). Probar en prod detrás de la cortina: pedido sin repartidor online → debe quedar en "🔎 Buscando repartidor" (no morir); conectar un repartidor → se asigna solo; dejar vencer la ventana → reembolso automático (poné `driver_search_window_minutes` en 1 para probar rápido y devolvelo a 20 después).
2. **Sumar `daily-revenue-summary` al crontab del VPS** (`0 12 * * *`).
5. **Categorías de la home** (`/ops/categorias`) + **pintar zonas** (`/ops/zonas-delivery`).
6. **Re-probar 5 items sueltos**: s2-2a-11 (bonus bienvenida), s2-2b-01 (email registro comercio), s3-3c-01 (errores OPS en toast), s4-4c-04 (variantes producto), s7-7a-02 (bloqueo fuera de zona).
7. **Día del launch**: `scripts/clean-db-pre-launch.ts --execute` + `abrir-tienda.ps1`.
8. **Post-launch**: SEO (aggregateRating + review), tests E2E, `feat/propinas-driver`.

---

## Pendiente de migrar a CLAUDE.md (Mauro a mano — `.claude/` protegido)

Decisiones ya tomadas que el manual todavía no tiene. Claude arma el bloque listo para pegar (ver `docs/PARA_PEGAR_EN_CLAUDE_md.md`):

- ✅ Tabla de estado de MP → **corregida 2026-06-26**.
- Modelo de pago final + comisión 10% (sección Reparto Financiero).
- `requireMerchantApi` (auth de API del comercio contra DB, no JWT cache).
- Flags `merchant.doc.*` con semántica fail-safe inversa.
- `notified` en el audit log de aprobaciones/rechazos.
- Candado de lanzamiento `LAUNCH_GATE`.
- Vendedor marketplace frictionless (sin docs ni aprobación).
- Compra del propio comercio bloqueada.
- Dashboard Unit Economics.
- Efectivo = electrónico-only para lanzamiento (código dormido para Fase 2).

---

## Métricas

- **Issues 🔴 abiertos**: 1 (ISSUE-004 cleanup data, es del día del launch).
- **Prod**: batch grande deployado (19 commits), cortina puesta, crons andando. **Fix de pagos en develop sin deployar.**
- **Ramas locales viejas**: limpiadas (4 ramas mergeadas borradas).
- **TS**: `finish.ps1` corrió tsc-strict al cerrar la rama del fix de pagos.

---

## Histórico

Ver `.claude/CHANGELOG.md` (histórico con detalle por rama).
