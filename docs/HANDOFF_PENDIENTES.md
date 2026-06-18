# MOOVY — Handoff / Estado y pendientes

> Punto de retome para la próxima sesión. Generado al pausar el trabajo del checklist pre-launch.
> Leé este archivo al volver para reconstruir el contexto.

## Dónde estamos (actualizado 2026-06-17)

- Rama actual: **`feat/puntos-wording-amex-y-acceso`** (Sección de Puntos implementada, pendiente verificación local + `finish.ps1`). Ya mergeadas a develop esta sesión: `chore/quitar-flag-efectivo` + las 4 ramas del 06-17 + `feat/ops-campana-notificaciones`.
- **Verificación pendiente de la campana** antes de mergear: `npx tsx scripts/verify-ops-notifications.ts` (cuenta por fuente contra la DB) + abrir `/ops` y mirar la campana (badge, dropdown, deep-links, "Sin novedades" si está vacío).
- **Pendiente operativo en local AHORA**: `npx tsx scripts/seed-feature-flags.ts` (crea los 5 flags `merchant.doc.*`) + `npx tsx scripts/cleanup-deprecated-feature-flags.ts --execute` (borra `buyer.cash-payment`).

### Resuelto 2026-06-17 (4 ramas, todas mergeadas a develop)

1. `feat/ops-notificacion-opcional-aprobacion` — checkbox "Notificar al usuario por email" (default ON) al aprobar/rechazar comercio y driver. Audit log guarda `notified`.
2. `fix/merchant-api-db-auth` — fix del **403 post-aprobación**: helper `requireMerchantApi` (DB-based), 21 handlers migrados. Probado OK (redirección carga sin 403).
3. `feat/docs-comercio-configurables-ops` — docs del comercio configurables vía flags `merchant.doc.*` (fail-safe inverso: requerido salvo OFF explícito). Falta correr el seed.
4. `chore/quitar-flag-efectivo` — removido el flag fantasma `buyer.cash-payment`. Falta correr el cleanup script.

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