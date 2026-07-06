# Moovy — Estado del proyecto
Última actualización: 2026-07-06

> **Dashboard de una pantalla.** Para detalle de tareas → `ISSUES.md`. Para histórico de ramas → `.claude/CHANGELOG.md`.
> Para el detalle vivo de pendientes → `docs/HANDOFF_PENDIENTES.md`.

---

## Pre-launch readiness

| Categoría | Estado |
|---|---|
| MP producción | ✅ Credenciales de PROD cargadas (los pagos se prueban en prod) |
| Modelo financiero (Plan Maestro v1) | ✅ Cerrado. **Split MP alineado**: `marketplace_fee = (comisión + envío − desc) × (1 − r)` — cada parte paga su 7,6%. **Verificado con pago real en prod (2026-07-05)**: sobre $24 → Moovy $20,42 / comercio $1,75 / MP $1,83 ✓ |
| Motor de envío (aditivo) | ✅ Deployado + `DeliveryRate` re-seedeado en VPS. 🟡 Falta verificación formal a distintas distancias en prod (referencia: moto 3km = $2.190) |
| Emails transaccionales | ✅ 8 emails del ciclo cableados + catálogo reordenado. Deployado |
| Asignación de repartidor | ✅ Filtros de equipamiento (mochila térmica/frío) ELIMINADOS (interruptor `EQUIPMENT_FILTERS_ENABLED=false`, decisión founder — solo tamaño/peso y distancia mandan). Deployado. 🟡 **Falta re-probar en prod**: aviso de viaje al driver + viaje completo con PIN doble |
| Cortina "Próximamente" | ✅ Rediseñada: "Hecha en Ushuaia, para Ushuaia" + foto local en duotono rojo + fuegos artificiales canvas con física real (solo laterales). Deployada. 🟡 Verificar tarjeta social de WhatsApp (`og-moovy.png` puede tener texto viejo horneado) |
| Direcciones del comprador | ✅ Límite de 2 (defensa server) + barra "Entregar en" bajo el header. Deployado |
| Liberación fondos MP a Moovy | 🟡 **NUEVO**: el `marketplace_fee` queda en "dinero a liquidar" (calendario propio a nivel app, distinto del "al instante" de la cuenta). Gestionar plazo con ejecutivo comercial MP + dimensionar capital de trabajo para payouts |
| Config Biblia | 🟡 Bajar reserva MP de 8% → **7,6%** en OPS (hoy Moovy regala ~0,4% de su parte por pedido). Timeouts driver/comercio ya re-sincronizados (`fix-ops-config` corrido en local y prod) |
| Comisión vendedor (código) | 🟡 CLAUDE.md dice 10% pero el código tiene 12% en 2 lugares (tarea #17) |
| Auditoría pre-launch del código | 🟡 En curso (capa 1 knip hecha). Seguir dominio por dominio |
| Candado de lanzamiento | ✅ Cortina confirmada tras cada deploy |
| Deploy a prod | ✅ **TODO deployado** (3 batches esta sesión: motor+emails · cortina+direcciones · equipamiento+split). Develop limpio |
| Data cleanup pre-launch | 🔴 ABIERTO (script listo, se ejecuta el día del launch — ISSUE-004) |
| Organización de documentos | 🟡 Planificada (índice armado). Falta ejecutar |

**Veredicto**: sesión de **prueba real en producción** con dos bugs de dinero/logística cazados y arreglados el mismo día: (1) el filtro invisible de mochila térmica dejaba pedidos sin asignar con un driver online al lado; (2) el comercio pagaba el 7,6% de MP también sobre la plata de Moovy. El split quedó verificado con pago real. Falta cerrar el ciclo logístico completo en prod (aviso de viaje + PINs) y dos gestiones operativas (reserva 7,6% + liberación de fondos con MP).

---

## Sprint actual (2026-07-02 → 06)

**Foco**: deploy del batch financiero + pruebas reales en producción + fixes de lo que las pruebas cazaron.

**Cerrado esta sesión**:
- **Deploy del batch 07-02** (motor aditivo + emails): re-seed `DeliveryRate`, cleanups idempotentes, `validate-ops-config` corrido en local y VPS (timeouts re-sincronizados con `fix-ops-config` en ambos), cortina re-confirmada con `cerrar-tienda.ps1`.
- **Cortina con identidad** (`fix/cortina-identidad-ushuaia`): "Hecha en Ushuaia, para Ushuaia", foto del puerto en duotono rojo (Unsplash, licencia libre), fuegos artificiales en canvas con física real (cohetes con estela, gravedad, solo laterales, cadencia de show). Copy de tarjeta social y WhatsApp alineados.
- **Direcciones** (`feat/direcciones-limite-y-chip-header` + `fix/direcciones-barra-entregar-en`): máximo 2 guardadas (defensa server, tx Serializable) + barra "Entregar en" con cambio rápido de dirección activa.
- **Asignación sin filtro de equipamiento** (`fix/asignacion-sin-filtro-equipamiento`): bug real de prod — driver online con GPS excluido en silencio por no declarar mochila térmica (pedido auto-detectado "comida caliente"). Interruptor único, sistema dormido reversible, verificación contra DB real.
- **Split MP cada parte paga lo suyo** (`fix/split-mp-cada-parte-paga-lo-suyo`): bug real de prod — el comercio bancaba el 7,6% de MP sobre el total (recibió $0,73 en vez de ~$1,66). Fórmula nueva en `computeMpSplit` (función pura), 34 checks verdes, **verificado con segundo pago real** (comercio recibió $1,75 ✓, Moovy $20,42 ✓).
- **Análisis competitivo del delivery** (interno): en ticket total Moovy empata el pedido chico y gana $2-3.500 en pedidos normales; el rider cobra 50-90% más por viaje. Decisión founder: no tocar el motor pre-launch.
- **CLAUDE.md actualizado directo** (split MP + liberación de fondos + reglas #30 equipamiento y #31 direcciones) — `.claude/` resultó editable en esta sesión, ya no hace falta el pegado a mano.

---

## Próximas tareas (orden)

1. **Bajar reserva MP a 7,6%** en la Biblia desde OPS (1 minuto, sin deploy).
2. **Cerrar el ciclo logístico en prod**: pedido real → aviso de viaje al driver AUTO (post-fix) → aceptar → PIN retiro → PIN entrega. De paso: motor de envío a distintas distancias y flujo buscando-repartidor con reembolso (tarea #8).
3. **Gestionar con MP la liberación del `marketplace_fee`** (ejecutivo comercial, con el ID de la app). Mientras tanto, dimensionar caja para los payouts de drivers.
4. **Seguir la auditoría pre-launch** dominio por dominio (pagos → motor → comisiones/puntos → config OPS → auth → estados → crons).
5. **Comisión vendedor a 10%** en el código (tarea #17, rama chica).
6. **Organización de documentos**: reorg `docs/` + jubilar las 3 biblias viejas + sumar los docs y la comparativa competitiva de esta sesión.
7. Seguimientos de emails / OPS docs por parámetro (#13) / repartidor cancela pedido (#12).
8. Checklist pre-launch (296 items) con todo lo anterior verde.

---

## Métricas

- **Issues 🔴 abiertos**: 1 (ISSUE-004 cleanup data, día del launch).
- **Prod**: TODO deployado — develop limpio, nada pendiente de deploy.
- **Ramas cerradas esta sesión**: 5 (`fix/cortina-identidad-ushuaia`, `feat/direcciones-limite-y-chip-header`, `fix/direcciones-barra-entregar-en`, `fix/asignacion-sin-filtro-equipamiento`, `fix/split-mp-cada-parte-paga-lo-suyo`).
- **Bugs cazados en prueba real de prod**: 2 (equipamiento en asignación + reparto del split MP), ambos arreglados, deployados y el split re-verificado con pago real.

---

## Histórico

Ver `.claude/CHANGELOG.md` (histórico con detalle por rama).
