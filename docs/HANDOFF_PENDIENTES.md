# MOOVY — Handoff / Estado y pendientes

> Punto de retome para la próxima sesión. Generado al pausar el trabajo del checklist pre-launch.
> Leé este archivo al volver para reconstruir el contexto.

## Dónde estamos

- Parados en **develop** (última rama cerrada y mergeada).
- **`.next-branch` ya tiene `fix vendedor-listings-ux`** preparada → correr `.\scripts\start.ps1` para arrancarla cuando se retome.

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

1. **Driver:** s2-2c-04 (al conectarse, mensaje "completá tu documentación para que Moovy te valide", no solo "no podés conectarte").
2. **OPS — Campana de notificaciones** (s3-3a-05): aviso in-app de change-requests/aprobaciones pendientes. Feature más grande (modelo + API + polling + UI).
3. **Sección de Puntos** (s4-4e-06/03/05/07): repensar wording estilo Amex ("por cada $X ganás Y", ocultar cálculo), agregar acceso/botón, aclarar dónde se aplican. **REQUIERE dirección de diseño del founder** antes de implementar.

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