# Moovy — Estado del proyecto
Última actualización: 2026-07-02

> **Dashboard de una pantalla.** Para detalle de tareas → `ISSUES.md`. Para histórico de ramas → `.claude/CHANGELOG.md`.
> Para el detalle vivo de pendientes → `docs/HANDOFF_PENDIENTES.md`.

---

## Pre-launch readiness

| Categoría | Estado |
|---|---|
| MP producción | ✅ Credenciales de PROD cargadas (los pagos se prueban en prod, no sandbox) |
| Modelo financiero (Plan Maestro v1) | ✅ **Cerrado y documentado.** Comisión comercio **10%** (mes 1 gratis) · vendedor marketplace **10%** · repartidor **80%** del envío. Envío = **solo logística** (operativo ELIMINADO). MP 7,6% transparente (cada parte paga lo suyo). Ver `Plan_Maestro_Financiero_Moovy` (a mover a docs/) |
| Motor de envío | ✅ **Reescrito a modelo ADITIVO** (`base_vehículo + costo_km × distancia`, sin operativo). Valores Ushuaia por vehículo. Envío gratis controlado por Moovy (el repartidor SIEMPRE cobra). Rama `fix/motor-envio-aditivo-y-pago-repartidor` cerrada en develop. **SIN deployar a prod.** |
| Emails transaccionales | ✅ **8 emails del ciclo cableados** (antes definidos pero nunca disparaban: entregado, nuevo pedido al comercio, pagos, cancelaciones, suspensiones, pago recibido). Redacción revisada + catálogo reordenado (18→8 categorías) + duplicado borrado. Ramas `fix/emails-triggers-ciclo` y `chore/emails-redaccion-catalogo` cerradas en develop. **SIN deployar.** |
| Comisión vendedor (código) | 🟡 CLAUDE.md dice 10% pero el código todavía tiene 12% en un par de lugares → alineación pendiente (tarea #17) |
| Auditoría pre-launch del código | 🟡 **En curso.** Capa 1 (knip) hecha: código muerto identificado (deps + archivos de home viejos + tipos). Hallazgo real ya resuelto (los ~20 emails sin trigger). Falta seguir dominio por dominio. Registro: `Auditoria_PreLaunch_Moovy` (a mover a docs/) |
| Buscando-repartidor + reembolso auto | ✅ Implementado (`feat/asignacion-reintento-y-reembolso`). 🟡 **Falta prueba real en prod** (tarea #8) |
| Candado de lanzamiento | ✅ `LAUNCH_GATE` + cortina `/proximamente`. Confirmado en prod |
| Deploy a prod | 🟡 **develop tiene sin deployar: motor de envío aditivo + emails + (posible driverSearchUntil).** Próximo `devmain.ps1` MODO SCHEMA + re-seed `DeliveryRate` en el VPS |
| Data cleanup pre-launch | 🔴 ABIERTO (script listo, se ejecuta el día del launch — ISSUE-004) |
| Organización de documentos | 🟡 Planificada (índice armado). Falta ejecutar la reorg de `docs/` + jubilar las 3 biblias viejas |

**Veredicto**: sesión enorme y productiva. Se cerró el **modelo financiero definitivo** (Plan Maestro) y se reescribió el **motor de envío** al modelo aditivo; se cablearon los **emails del ciclo** que no disparaban (un agujero real de lanzamiento) y se pulió el catálogo. Todo está en develop **sin deployar**. Camino a launch: deployar el batch → seguir la auditoría pre-launch → organizar docs.

---

## Sprint actual (2026-07-02)

**Foco**: cerrar el modelo financiero, el motor de envío y el sistema de emails; arrancar la auditoría pre-launch.

**Cerrado esta sesión**:
- **Plan Maestro Financiero v1** (documento nuevo): comisión 10%/10%, envío = solo logística, MP 7,6% transparente, sin cargos ocultos. Reemplaza a las biblias viejas.
- **Motor de envío ADITIVO** (`fix/motor-envio-aditivo-y-pago-repartidor`, cerrada): fórmula `base + costo_km × distancia`, operativo eliminado, valores Ushuaia por vehículo (Bici $1.600/$90 … Flete $18.000/$450), envío gratis controlado por Moovy con el repartidor siempre pago, arreglo del fallback de payout. Simulación `scripts/simular-envios.ts` (verificada: moto 3km = $2.190). CLAUDE.md actualizado a mano.
- **Emails — Rama 1** (`fix/emails-triggers-ciclo`, cerrada): cableados 8 emails del ciclo que estaban definidos pero nunca se enviaban. Todos fire-and-forget (nunca rompen pedido/pago), verificados con 2 rondas de cross-check (que cazaron un bug de dinero antes de prod). Dedup: en cancelaciones de pedidos pagados con MP, sale el email de reembolso (no el de cancelación).
- **Emails — Rama 2** (`chore/emails-redaccion-catalogo`, cerrada): PIN fuera del asunto, "operativo"→"margen de envío", "no-show"→español, asuntos pulidos, "mes 1 gratis" en tienda aprobada, catálogo 18→8 categorías, duplicado borrado (70→69).
- **Auditoría pre-launch arrancada**: capa 1 automática (knip con `knip.json` de config) → lista limpia de código muerto. Registro en `Auditoria_PreLaunch_Moovy`.

---

## Próximas tareas (orden)

1. **Deployar el batch a prod** (`devmain.ps1` MODO SCHEMA — hay posible `driverSearchUntil` + los cambios de esta sesión). Después: **re-seed `DeliveryRate`** en el VPS (`npx tsx prisma/seed-delivery.ts`), y correr `cerrar-tienda.ps1`.
2. **Prueba real en prod** del flujo buscando-repartidor (tarea #8) y del motor de envío nuevo (distintas distancias → distintos precios).
3. **Seguir la auditoría pre-launch** dominio por dominio (pagos → motor → comisiones/puntos → config OPS → auth → estados → crons). Cargar hallazgos al registro.
4. **Alinear comisión vendedor a 10%** en el código (tarea #17).
5. **Organizar documentos**: reorg de `docs/` + mover ahí los docs de esta sesión + jubilar las 3 biblias viejas + actualizar `Moovy_Biblia_Financiera_v4.docx` al Plan Maestro.
6. **Seguimientos de emails**: fusionar redundantes (3 reembolsos, 2 reportes), crear "subiste de nivel MOOVER", cablear los de owner (necesitan crons).
7. **OPS — docs por parámetro con acceso de 1 click** (tarea #13).
8. **Repartidor cancela pedido aceptado** + motivo + reasignación (tarea #12).

---

## Pendiente de migrar a CLAUDE.md (Mauro a mano — `.claude/` protegido)

- ✅ Modelo de envío aditivo + operativo eliminado + comisión → **YA aplicado esta sesión** (líneas 77-108 del canon).
- **NUEVO — Emails del ciclo cableados + patrón dedup**: los emails transaccionales del ciclo (entregado, nuevo pedido, pagos, cancelaciones, suspensión, pago recibido) se disparan fire-and-forget (try/catch, nunca rompen el flujo). En cancelaciones de pedidos pagados con MP, sale SOLO el email de reembolso (`order_refunded`), no el de cancelación, para no duplicar. (Bloque para pegar más abajo en el chat.)
- (Ya venían pendientes de sesiones previas: `requireMerchantApi`, flags `merchant.doc.*`, `notified`, `LAUNCH_GATE`, vendedor frictionless, compra propia bloqueada, Unit Economics, efectivo electrónico-only.)

---

## Métricas

- **Issues 🔴 abiertos**: 1 (ISSUE-004 cleanup data, día del launch).
- **Prod**: batch de junio deployado + cortina. **Sin deployar: motor de envío aditivo + emails (toda esta sesión).**
- **Ramas cerradas esta sesión**: 3 (`fix/motor-envio-aditivo-y-pago-repartidor`, `fix/emails-triggers-ciclo`, `chore/emails-redaccion-catalogo`).
- **TS**: `finish.ps1` corrió tsc-strict al cerrar cada rama.

---

## Histórico

Ver `.claude/CHANGELOG.md` (histórico con detalle por rama).
