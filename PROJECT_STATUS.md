# Moovy — Estado del proyecto
Última actualización: 2026-07-12

> **Sesión 2026-07-11/12 (diseño — resumen)**: rediseño integral de la tienda pública, **deployado a main**. Rama `feat/rediseno-home` (commit `90e69bd`): header unificado que colapsa al scrollear · hero de una sola tarjeta roja · Promos del Mundial (con cupones) + **CRUD de cupones nuevo en `/ops/cupones`** · Banda MOOVER · cards y footer nuevos · carrito de invitado (login recién al pagar) · ubicación en el pill del header (se sacó la barra "Entregar en") · campanita pospuesta a Fase 2 · `/puntos` con landing de conversión + animaciones de scroll + secciones modernizadas (ejemplo claro, bonos con jerarquía, niveles scrolleables + "el programa en detalle") · `/empezar` rediseñado DENTRO de `(store)` para heredar el header/nav de la app · fix de overflow horizontal en desktop. Rama chica `feat-ajuste-categorias-home` (cerrada a develop): se quitaron las pills de categoría bajo el buscador y se agrandaron las 3 categorías destacadas. **El hilo de diseño NO terminó**: sigue con el Home Builder (ver "Hilo de diseño" abajo; `.next-branch` ya preparado). ⚠️ Verificar si `feat-ajuste-categorias-home` llegó a deployarse a main (quedó en develop; el rediseño grande sí está en main).

> **Sesión 2026-07-07 (resumen)**: 9 ramas de operativos+diseño (cron broadcasts arreglado tras meses en rojo, panel OPS app-shell, tarjeta social e ícono PWA nuevos, "Envío Gratis" mentiroso eliminado, PORTADAS de comercio conectadas, cards compactas, deuda de código en CERO). Incidente de infra resuelto y blindado (reinicio Hostinger + sin auto-arranque → docker unless-stopped + pm2 startup; falta UptimeRobot, 10 min founder). Verificados en prod: motor por distancia, crontab completo, zonas, flags docs. Detalle: HANDOFF_PENDIENTES + CHANGELOG.

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
| Config Biblia | ✅ Reserva MP bajada a **7,6%** (founder, 07-12). Categorías de la home cargadas en `/ops/categorias` (07-12). Timeouts driver/comercio re-sincronizados |
| Comisión vendedor | ✅ Valor de OPS en **10** (founder, 07-12). 🟡 Falta verificar que no quede 12% hardcodeado en el código (a chequear por Claude) |
| Auditoría pre-launch del código | 🟡 En curso (capa 1 knip hecha). Seguir dominio por dominio |
| Candado de lanzamiento | ✅ Cortina confirmada tras cada deploy |
| Deploy a prod | ✅ **TODO deployado** (3 batches esta sesión: motor+emails · cortina+direcciones · equipamiento+split). Develop limpio |
| Data cleanup pre-launch | 🔴 ABIERTO (script listo, se ejecuta el día del launch — ISSUE-004) |
| Organización de documentos | 🟡 Planificada (índice armado). Falta ejecutar |

**Veredicto (cierre 07-06, 2º devmain)**: sesión histórica. Ciclo completo verificado en prod con plata real (pago→split→asignación→PINs→entrega→puntos), 2 bugs de dinero cazados y arreglados el mismo día, **auditoría pre-launch de código CERRADA** (7 dominios, 4 críticos resueltos y deployados), multi-vendor deshabilitado por decisión founder (un pedido = un local), boost MOOVER configurable listo para el día del launch. La deuda de código pre-launch quedó en ~cero (resta 1 chore cosmético). Lo que separa del checklist final ya no es código: operativos de OPS + verificaciones de prod + gestión con MP + reorg de docs.

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

1. **Operativos de OPS/VPS** (~1h, sin código): crontab `daily-revenue-summary` + re-verificar cron broadcast · categorías home en `/ops/categorias` · zonas de cobertura en `/ops/zonas-delivery` · decidir flags `merchant.doc.*` · re-verificar 500 de soporte-notificaciones.
2. **Verificaciones en prod** (~30 min): motor de envío a distintas distancias · reembolso automático al vencer ventana de búsqueda (tarea #8) · tarjeta WhatsApp (`og-moovy.png`, puede tener texto viejo horneado).
3. **Gestionar con MP la liberación del `marketplace_fee`** (ejecutivo comercial, ID de la app). Dimensionar caja para payouts mientras tanto.
4. **`chore/limpiar-completed`** (15 min, cosmético): sacar chequeos del estado fantasma en 4 endpoints de rating/tip.
5. **Organización de documentos**: reorg `docs/` + jubilar las 3 biblias viejas + sumar docs de esta sesión (Plan Maestro, comparativa competitiva).
6. Seguimientos de emails / OPS docs por parámetro (#13) / repartidor cancela pedido (#12) — sin cambios.
7. **Checklist pre-launch (296 items)** con todo lo anterior verde → ISSUE-004 el día antes → `abrir-tienda.ps1`.
8. **Día del launch**: prender boost ×2 en la Biblia (multiplicador 2 + fecha a 30 días).

**Reserva MP: decisión founder — queda en 8%** (colchón deliberado a favor del comercio; Moovy absorbe ~0,4% extra de su parte por pedido).

---

## Hilo de diseño / Home (activo — sesión 2026-07-11/12)

El rediseño de la tienda ya está en main. Lo que quedó abierto de este hilo, de simple a complejo:

1. **Cargar cupones reales en OPS** para encender "Promos del Mundial" (la sección ya funciona, falta data). CRUD en `/ops/cupones`.
2. **Revisar umbrales de nivel MOOVER** — 40 pedidos en 90 días puede ser inalcanzable para Ushuaia. Definir escalones realistas (decisión founder + ajuste de `PointsConfig`/niveles).
3. **Animación stagger** en las filas de cards del home (aparición en cascada al scrollear). Nice-to-have.
4. **Home Builder — Organizador de Secciones del Home** ← PRÓXIMA del hilo. Modelo `HomeSection` + registry + UI en OPS para reordenar/prender-apagar secciones. `.next-branch` ya preparado (`feat organizador-secciones-home`). Requiere deploy `-SchemaOnly`.
5. **Sección "Página de Inicio" en OPS** — el organizador de arriba + gestión de categorías del home (uploader de imagen/label) + banners.
6. **Separación B2B de `Category`** — migración aditiva, sensible porque toca dinero/comisiones. Va con cuidado.
7. **Centro de notificaciones (campanita del comprador)** — pospuesto a Fase 2 por decisión founder.

Menor: si al ver las 3 categorías destacadas en prod se las quiere aún más anchas (2 por fila en vez de 3), es un ajuste de 1 minuto en `CategoryGrid.tsx`.

---

## Métricas

- **Issues 🔴 abiertos**: 1 (ISSUE-004 cleanup data, día del launch).
- **Prod (07-12)**: rediseño de la tienda deployado a main (`feat/rediseno-home`). ⚠️ Confirmar si `feat-ajuste-categorias-home` (categorías del home) también se deployó — quedó cerrada a develop.
- **Ramas cerradas sesión 07-11/12 (diseño)**: 2 — `feat/rediseno-home` (rediseño integral + OPS de cupones), `feat-ajuste-categorias-home` (pills fuera + categorías destacadas más grandes).
- **Ramas cerradas sesión 07-06/07 (histórico)**: 11 (`fix/cortina-identidad-ushuaia`, `feat/direcciones-limite-y-chip-header`, `fix/direcciones-barra-entregar-en`, `fix/asignacion-sin-filtro-equipamiento`, `fix/split-mp-cada-parte-paga-lo-suyo`, `fix/comision-vendedor-10`, `feat/moover-boost-lanzamiento-y-defaults`, `fix/auditoria-estados-crons`, `fix/seller-api-db-auth`, `fix/carrito-un-solo-comercio`, `fix/merchant-reject-atomico`, `fix/driver-payout-centavos` — 12 con la del payout).
- **Auditoría pre-launch de código: CERRADA** (7 dominios, 4 críticos resueltos el mismo día).
- **Bugs cazados en prueba real de prod**: 2 de dinero (equipamiento + split MP), verificados con pagos reales tras el fix.
- **Ciclo E2E verificado en prod**: pago → split → asignación → PIN doble → DELIVERED → puntos idempotentes.

---

## Histórico

Ver `.claude/CHANGELOG.md` (histórico con detalle por rama).
