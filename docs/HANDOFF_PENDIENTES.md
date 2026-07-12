# MOOVY — Handoff / Estado y pendientes

> Punto de retome para la próxima sesión. Generado al pausar el trabajo del checklist pre-launch.
> Leé este archivo al volver para reconstruir el contexto.

## Dónde estamos (actualizado 2026-07-12 — CIERRE, sesión de diseño)

**Sesión de rediseño de la tienda pública. 2 ramas cerradas.**

- **`feat/rediseno-home`** (commit `90e69bd`, **deployada a main**): rediseño integral. Header unificado que colapsa al scrollear · hero de una sola tarjeta · Promos del Mundial con cupones + **CRUD de cupones nuevo en `/ops/cupones`** · Banda MOOVER · cards y footer nuevos · **carrito de invitado** (login recién al pagar) · ubicación en el pill del header (se sacó la barra "Entregar en") · **campanita del comprador removida** (Fase 2) · `/puntos` con landing de conversión + animaciones + secciones modernizadas · `/empezar` movido dentro de `(store)` para heredar el header de la app · fix de overflow horizontal en desktop.
- **`feat-ajuste-categorias-home`** (cerrada a develop): se quitaron las pills de categoría del hero + se agrandaron las 3 categorías destacadas. ⚠️ **Verificar si se deployó a main** (el rediseño grande sí está; esta rama chica quedó en develop).

**El hilo de diseño NO terminó** — sigue con el Home Builder. Orden (simple→complejo): (1) cargar cupones reales en OPS para encender Promos del Mundial · (2) revisar umbrales de nivel MOOVER (40 pedidos/90d puede ser inalcanzable) · (3) stagger en cards del home · (4) **Home Builder / Organizador de Secciones del Home** ← PRÓXIMA, `HomeSection` + registry + UI OPS, deploy `-SchemaOnly`, `.next-branch` ya preparado (`feat organizador-secciones-home`) · (5) sección "Página de Inicio" en OPS (organizador + categorías home con uploader + banners) · (6) separación B2B de `Category` (migración aditiva, toca dinero) · (7) centro de notificaciones de comprador (Fase 2).

**⚠️ Artefacto del sandbox de Cowork (NO del proyecto)**: durante la sesión el `.git` visto desde el sandbox se corrompió con bytes NUL en `.git/HEAD` y `.git/config` (git nativo en Windows quedó bien; se reparó a mano). Origen: cortar un `finish.ps1` a la mitad + el espejo del mount. Si git tira "bad config line" o "failed to resolve HEAD", reescribir `.git/HEAD` con `ref: refs/heads/develop`. No escribir en `.git` desde el sandbox salvo para reparar. **Recomendación: no cortar `finish.ps1`/`devmain.ps1` a la mitad.**

**Lo pre-launch (del checklist) sigue igual que el 07-07** — nada de esta sesión lo tocó. Ver bloque de abajo.

---

## Dónde estamos (actualizado 2026-07-07 — CIERRE)

**Sesión de operativos + pulido de diseño. 9 ramas cerradas** (todas -NoDB): `fix/cron-broadcasts-auth-401` (el cron "en rojo desde junio" comparaba el header entero contra el secreto → 401 eterno; fix 2 líneas) · `chore/limpiar-completed` (deuda de código = CERO) · `style/ops-sidebar-fijo` (patrón app-shell: página no scrollea, columnas independientes, sin barra) · `chore/og-card-hecha-en-ushuaia` (tarjeta WhatsApp + ?v=2) · `chore/pwa-icono-m-blanca` (ficha roja, M blanca, zona segura) · `fix/envio-gratis-badge` (el "Envío Gratis" salía de un campo legacy que el motor ignora — 4 componentes mentían precio; ahora sale de freeDeliveryMinimum real) · `feat/portada-comercio` (campo banner huérfano conectado: upload 16:5 guía 1600×500, header del perfil, tarjetas anchas de la home) · `style/cards-producto-compactas` (~20% menos, imagen 4:3) · docs.

**INCIDENTE del día (resuelto + blindado)**: reinicio programado de Hostinger → moovy-db con RestartPolicy=no + pm2 sin startup → ~1h43m caído sin que nadie avise. Fixes: `docker update --restart unless-stopped` + `pm2 startup/save`. PENDIENTE FOUNDER (10 min): monitor externo UptimeRobot → `https://somosmoovy.com/api/health` (endpoint ya existe, pasos exactos en el chat / ISSUES).

**Workflow automatizado**: reglas 3b/3c en CLAUDE.md — `.next-branch` (`tipo nombre` con ESPACIO) y `.commit-message`; Mauro solo corre start.ps1/finish.ps1 a secas.

**Verificado hoy en prod**: motor por distancia ✓ · crontab 18/18 ✓ · 500 soporte-notificaciones muerto ✓ · zonas de cobertura ✓ (4 zonas) · flags merchant.doc.* decididos ✓. **Pendientes vivos**: prueba del reembolso automático (tarea #8, pospuesta por founder) · UptimeRobot · categorías home (a medida que carguen comercios) · gestión MP marketplace_fee.

**Lo próximo**: post-deploy verificar el tour visual (crons/sidebar/tarjeta/ícono/portada) → reorg de docs/ → CHECKLIST de 296.

---

## Dónde estamos (histórico — 2026-07-06, CIERRE post 2º devmain)

**En `develop`, limpio. TODO deployado** (2º devmain MODO SCHEMA del 07-06 incluyó: boost MOOVER configurable + defaults canónicos, 4 fixes de la auditoría auth/estados/crons, `requireSellerApi`, carrito UN SOLO comercio, reject atómico, payout a centavos, comisiones 10% en textos/schema).

**La auditoría pre-launch de código está CERRADA**: pagos ✓ (split verificado con pago real) · motor ✓ · comisiones ✓ · puntos ✓ (anti-fantasma, todo conectado) · auth ✓ · estados ✓ · crons ✓. Los 4 críticos que encontró quedaron resueltos y deployados el mismo día.

**Decisiones founder de hoy**: multi-vendor DESHABILITADO (un pedido = un local; el código queda dormido y la derivación de estados que faltaba ya no bloquea) · reserva MP queda en 8% (colchón deliberado a favor del comercio) · boost ×2 se prende desde OPS el día del launch (multiplicador 2 + fecha, se apaga solo).

**Única rama de código pendiente (menor)**: `chore/limpiar-completed` — sacar chequeos del estado fantasma "COMPLETED" en 4 endpoints de rating/tip. 15 min, no bloquea.

**Lo próximo (ya NO es código)**: operativos de OPS (crontab `daily-revenue-summary`, categorías home, zonas de cobertura, flags `merchant.doc.*`, 500 de soporte-notificaciones) → verificaciones prod (motor a distintas distancias, reembolso auto tarea #8, tarjeta WhatsApp og-moovy.png) → gestión con MP (liberación del marketplace_fee) → reorg docs/ → CHECKLIST de 296 → ISSUE-004 → abrir-tienda.ps1.

---

## Dónde estamos (histórico — sesión 2026-07-02 → 06, primera parte)

**En `develop`, limpio. TODO deployado a prod** (3 batches: motor+emails el 07-02; cortina+direcciones y equipamiento+split el 07-05/06). 5 ramas cerradas esta sesión.

**Lo grande de la sesión — pruebas reales en prod cazaron 2 bugs de dinero/logística, ambos arreglados, deployados y (el split) re-verificado:**

1. `fix/asignacion-sin-filtro-equipamiento` — el pedido de prueba (auto-detectado "comida caliente") exigía mochila térmica y el único driver online (AUTO, con GPS, a 2km) quedaba excluido EN SILENCIO → SEARCHING_DRIVER → reembolso. Decisión founder: la naturaleza del envío (caliente/frío/frágil) NO restringe más ni vehículos ni equipamiento; solo tamaño/peso y distancia. Interruptor `EQUIPMENT_FILTERS_ENABLED=false` en `src/lib/shipment-types.ts` (reversible).
2. `fix/split-mp-cada-parte-paga-lo-suyo` — MP cobra su 7,6% UNA vez y TODO al comercio (cobrador) sobre el TOTAL; Moovy se llevaba su parte completa → el comercio bancaba el costo de MP de la plata de Moovy (recibió $0,73 en vez de ~$1,66 en la prueba). Fórmula nueva: `marketplace_fee = (comisión + envío − desc) × (1 − r)` en `computeMpSplit`. **Verificado con 2º pago real (07-05): Moovy $20,42 / comercio $1,75 / MP $1,83 sobre $24 ✓.**

**También deployado**: cortina "Hecha en Ushuaia, para Ushuaia" (foto local duotono + fuegos canvas física real, solo laterales) · direcciones (máx 2, defensa server + barra "Entregar en" bajo el header).

**Pendientes NUEVOS (detalle en ISSUES.md, sección 2026-07-03 → 06):**
- Bajar reserva MP 8% → **7,6%** en la Biblia (OPS, 1 min).
- **Liberación del `marketplace_fee`**: MP la retiene en "dinero a liquidar" con calendario propio a nivel app (el "al instante" de la cuenta no aplica) → gestionar con ejecutivo comercial MP + dimensionar caja para payouts.
- **Re-probar ciclo logístico en prod**: aviso de viaje al driver (post-fix) → PIN retiro → PIN entrega + motor a distintas distancias + buscando-repartidor (tarea #8). ES LO PRÓXIMO.
- Verificar `og-moovy.png` (tarjeta WhatsApp puede tener texto viejo horneado).
- Menores: unificar elegibilidad checkout vs motor (post-launch) · `driverPayoutAmount` redondea a pesos.

**CLAUDE.md**: actualizado DIRECTO esta sesión (split MP, liberación fondos, reglas #30-#31, header #1-#32) — `.claude/` resultó editable desde Cowork, ya no hace falta pegado a mano.

**Después de eso, el camino sigue igual**: auditoría pre-launch dominio por dominio → comisión vendedor 10% (#17) → organización de docs → checklist (296 items).

---

## Dónde estamos (histórico — 2026-07-02)

**En `develop`.** Esta sesión cerró 3 ramas (todas mergeadas a develop, NINGUNA deployada a prod todavía):
- `fix/motor-envio-aditivo-y-pago-repartidor` — motor de envío reescrito al modelo **ADITIVO** (`base_vehículo + costo_km × distancia`, operativo eliminado, valores Ushuaia por vehículo, envío gratis controlado por Moovy con el repartidor siempre pago, arreglo del fallback de payout). CLAUDE.md actualizado a mano. Simulación `scripts/simular-envios.ts`.
- `fix/emails-triggers-ciclo` — **8 emails del ciclo cableados** (estaban definidos pero nunca disparaban: entregado, nuevo pedido al comercio, pago rechazado, rechazo/cancelación, cancelación por sistema, suspensiones, pago recibido al comercio). Todos fire-and-forget. 2 rondas de cross-check (cazaron un bug de dinero antes de prod).
- `chore/emails-redaccion-catalogo` — redacción de emails (PIN fuera del asunto, "operativo"→"margen de envío", asuntos pulidos, "mes 1 gratis") + catálogo **18→8 categorías** + duplicado borrado (70→69).

**Modelo financiero cerrado (Plan Maestro v1):** comisión comercio 10% / vendedor 10% / repartidor 80%; envío = solo logística; MP 7,6% transparente, cada parte paga lo suyo.

**Auditoría pre-launch arrancada:** capa 1 (knip con `knip.json`) hecha → lista limpia de código muerto. El hallazgo real (emails sin trigger) ya se resolvió.

**Lo próximo (crítico):** **deployar el batch** (`devmain.ps1` MODO SCHEMA + re-seed `DeliveryRate` + `cerrar-tienda.ps1`) y probar en prod (buscando-repartidor + motor de envío nuevo). Después seguir la auditoría dominio por dominio.

**Pendientes chicos anotados como tareas:** comisión vendedor 10% en código (#17), fusiones de emails + "nivel MOOVER" + owner emails (necesitan crons), organización de documentos, docs por parámetro de OPS (#13), repartidor cancela pedido aceptado (#12).

**Documentos de esta sesión (en el scratchpad de Cowork → mover a `docs/` en la reorg):** `Plan_Maestro_Financiero_Moovy` (md+pdf), `Auditoria_PreLaunch_Moovy.md`, `Revision_Emails_Moovy.md`, `Moovy_Indice_Documentacion.md`, `moovy_flujo_pago.png/svg`.

---

## Dónde estamos (histórico — 2026-06-18)

- **En `develop`. El batch YA ESTÁ DEPLOYADO a producción** (2026-06-18, 19 commits, modo schema). Las 6 ramas de la sesión + las previas están en prod.
- **Sitio privado**: cortina `LAUNCH_GATE=closed` confirmada. Público ve "Próximamente". Entrás con `https://somosmoovy.com/?preview=moovy2026preview`.
- **Crons andando** de nuevo (estaban en 401 hace ~14d por comillas en `CRON_SECRET`; ver `docs/RUNBOOK_CRONS.md`).
- **Qué falta para lanzar** → checklist simple en `docs/CHECKLIST_PARA_LANZAR.md`.
- **Docs nuevos sin commitear en develop**: `RUNBOOK_DEPLOY_2026-06-18.md`, `RUNBOOK_CRONS.md`, `CHECKLIST_PARA_LANZAR.md` (+ estos edits de estado). Commitear cuando se pueda (no van en rama, son docs).

### Resuelto 2026-06-18 (operativo)
- **Deploy del batch a prod** (devmain modo schema + scripts post-deploy + cortina). Smoke test OK.
- **Crons arreglados** (comillas en `CRON_SECRET`). Pendiente: sumar `daily-revenue-summary` al crontab del VPS (`0 12 * * *`).
- **Logo (s4-4b-02)** cerrado sin código (era data vieja de prod).
- **`feat/ops-campana-notificaciones`** y **`feat/puntos-wording-amex-y-acceso`** cerradas y deployadas.

### Resuelto 2026-06-17 (4 ramas, mergeadas a develop)

1. `feat/ops-notificacion-opcional-aprobacion` — checkbox "Notificar al usuario por email" (default ON) al aprobar/rechazar comercio y driver. Audit log guarda `notified`.
2. `fix/merchant-api-db-auth` — fix del **403 post-aprobación**: helper `requireMerchantApi` (DB-based), 21 handlers migrados. Probado OK (redirección carga sin 403).
3. `feat/docs-comercio-configurables-ops` — docs del comercio configurables vía flags `merchant.doc.*` (fail-safe inverso: requerido salvo OFF explícito). Seed corrido en prod.
4. `chore/quitar-flag-efectivo` — removido el flag fantasma `buyer.cash-payment`. Cleanup corrido en prod.

### A migrar a CLAUDE.md (a mano — `.claude/` protegido)
- `requireMerchantApi` como helper canónico de auth API del comercio (DB > JWT cache).
- Semántica **fail-safe inversa** de los flags `merchant.doc.*` (requerido salvo OFF explícito; si falta la fila se pide igual).
- `notified` en el audit log de aprobaciones/rechazos.
- Efectivo = electrónico-only para lanzamiento; código de efectivo dormido preservado para Fase 2.

## Plan acordado (founder)

1. Resolver **TODAS** las observaciones del checklist, sea cual sea su tipo.
2. Probar todo en **develop / local** — EXCEPTO pagos (MP ya está en credenciales de **producción**, no se vuelve a test; los pagos se prueban en prod).
3. Recién cuando esté todo resuelto y probado en develop → **`devmain.ps1`** para deployar.
4. Re-testear lo nuevo en producción.

## Resuelto en esta sesión (ramas cerradas)

- **s2-2a-04** Recuperar contraseña (validate-reset-token hasheaba mal el token).
- **s2-2a-05** Carrito no se vaciaba al cerrar sesión (helper `src/lib/logout.ts`).
- **s2-2a-00** Código de referido: valida existencia + prefijo `MOV-` fijo.
- **s2-2a-07** Editar direcciones (UI + unificado a campo `apartment`).
- **s4-4a-07** Botón Guardar al editar producto (isDirty no trackeaba precio/stock/categoría).
- **s4-4b-06** Instagram del comercio se muestra en su perfil público.
- **s4-4c-03** Eliminar listing del vendedor (soft delete).
- **s4-4c-01 / s4-4c-02** Vendedor listings UX (`fix/vendedor-listings-ux`): banner "cambios sin guardar" + confirmación al salir en EditListingForm; pausar/reactivar como botón con confirmación.
- **s2-2c-04** Driver (`fix/driver-mensaje-documentacion`): al conectarse sin aprobación, mensaje accionable — faltan docs → lista cuáles + lo lleva al perfil; docs completos → "en revisión, te avisamos por email".
- **s4-4a-01 / s4-4d-02 + obs nuevas** Comercio UX (`fix/comercio-ux-sugerir-y-categorias`): Sugerir funciona OK (cerrado sin código). Categorías home = curación OPS desde `/ops/categorias` (tarea OPERATIVA pre-launch, agregada a ISSUES). Form de producto: validación descripción min 10 client-side + asteriscos + contador + scroll-to-error + ruedita desactivada en numéricos (alta y edición).
- Candado de lanzamiento + cortina "Próximamente" + scripts abrir/cerrar tienda (sacó mantenimiento de OPS).
- Dashboard Unit Economics en `/ops/unit-economics`.
- Fixes de build: warning de Sentry + falso "build fallo" en tsc-strict.ps1.

### Ya estaban resueltos (stale en el checklist)

- **s4-4d-06** Aviso "fuera de cobertura" (lo hizo la rama de delivery).
- **s2-2b-00** Onboarding comercio: mail + acceso inmediato.
- **s5-5a-00** Compra del propio comercio bloqueada (ISSUE-003).
- **s2-2d-02 / s3-3b-04** Vendedor sin docs = correcto por diseño (frictionless).
- **s4-4a-04** Función deshabilitada desde OPS (decisión).

## Pendientes (secuencia de ramas)

1. ✅ **OPS — Notificación opcional al aprobar/rechazar** — HECHO (rama `feat/ops-notificacion-opcional-aprobacion`, 2026-06-17).
2. ✅ **OPS — Campana de notificaciones** (s3-3a-05) — HECHO (rama `feat/ops-campana-notificaciones`, 2026-06-17). Decisiones: todos los eventos | polling 45s | **derivar sin schema**. Endpoint `/api/admin/notifications` (4 fuentes derivadas, cada una con su try/catch) + `OpsNotificationBell` (badge + dropdown agrupado + localStorage de vistos). Pendiente verificación local + merge.
3. ✅ **Sección de Puntos** (s4-4e) — HECHO (rama `feat/puntos-wording-amex-y-acceso`, 2026-06-18). Decisiones del founder: wording Amex (ocultar cálculo) | acceso = chip de saldo en header | dónde aplican = productos-no-envío + se acreditan al recibir. Sin lógica de earn/burn, sin schema. Pendiente verificación local + merge. NOTA: la sección "Ejemplo" (cálculo paso a paso) de la landing anónima se dejó intacta — el founder puede pedir simplificarla.
4. ✅ **Logo del comercio** (s4-4b-02) — CERRADO sin código (2026-06-18). Probado en local: guarda perfecto. La falla en prod era data vieja; el deploy lo arregla.
5. **Deploy del batch** ← **PRÓXIMA**: ya no quedan observaciones de código grandes (campana + puntos + logo cerrados). Restan items menores (operativos / "a re-probar") que pueden hacerse antes o después del deploy. Ver runbook en la sección "Deploy".

### Logo (s4-4b-02 / s4-4a-00) — estado del diagnóstico

- DB de prod: **TEST** y **MOOVY** tienen `image` = null; **ALNAAR** tiene URL de R2 → **R2 SÍ está configurado y funciona**.
- El guardado del comercio sobre sí mismo (`updateMerchant`) no persiste la imagen; OPS sí (ALNAAR).
- El código en **develop se ve correcto** (MiComercioForm `action={handleSubmit}` → append "image" → updateMerchant guarda `Merchant.image`; schema incluye `image`). No se encontró bug leyendo.
- **Acción:** probar el logo **localmente en develop**. Si guarda → era prod viejo, el deploy lo arregla. Si sigue roto local → agregar log de `data.image` en `updateMerchant` (`src/app/comercios/actions.ts` ~line 619) y cazarlo.

### Fuera de alcance (no son tareas de código)

- **s4-4b-03 / s4-4c-06** MP credenciales: ya en prod, se prueban en producción.
- **A re-probar** (sin contexto claro): s2-2a-11, s2-2b-01, s7-7a-02, s4-4c-04, s3-3c-01.

## Decisiones canónicas tomadas (actualizar CLAUDE.md cuando se pueda — `.claude/` protegido)

- **Candado de lanzamiento por entorno** `LAUNCH_GATE` en `proxy.ts` (fail-closed, solo prod, solo páginas). Bypass `?preview=PREVIEW_TOKEN` → cookie httpOnly 30d. Cortina en `/proximamente`. Scripts `abrir-tienda.ps1` / `cerrar-tienda.ps1`. Mantenimiento sacado de OPS.
- **Vendedor marketplace = frictionless** (sin documentación ni aprobación).
- **Compra del propio comercio** bloqueada (ya estaba, ISSUE-003).
- **Unit Economics** dashboard read-only en `/ops/unit-economics` + lib `src/lib/finance/unit-economics.ts`.

## Deploy (cuando toque) — IMPORTANTE

- `devmain.ps1` en **MODO SCHEMA** (las Ramas 1 y 2 de la Biblia tocaron `schema.prisma`) → **NO** usar `-NoDB`.
- **Re-seed de `DeliveryRate`** en el VPS después del deploy.
- Después del primer deploy con el candado: correr **`cerrar-tienda.ps1`** una vez (setea `PREVIEW_TOKEN` + deja la cortina). El sitio queda privado por defecto (fail-closed).
- Datos VPS: `root@31.97.14.156`, app en `/var/www/moovy`, DB `moovy_db` / user `postgres` / puerto `5436` (docker `moovy-db`).
- Preview: `https://somosmoovy.com/?preview=moo