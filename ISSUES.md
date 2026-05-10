# Moovy — Issues
Última actualización: 2026-04-30

> **Fuente única de tareas pendientes.** Para histórico completo de issues resueltos en sprints anteriores → `.claude/CHANGELOG.md`.

---

## 🔴 CRÍTICOS (bloquean lanzamiento)

### ISSUE-004 — Limpiar data de prueba antes del lanzamiento público
**Estado**: 🔴 ABIERTO — se resuelve con `scripts/clean-db-pre-launch.ts` el día antes del lanzamiento.
**Qué falta**:
1. ✅ Script ya escrito y validado el 2026-04-24 — `scripts/clean-db-pre-launch.ts` (modo dry-run default; con `--execute` pide confirmación interactiva "SI BORRAR")
2. ⏳ Ejecutar primero en DB local contra copia de producción
3. ⏳ Día antes del launch: correr en producción, confirmar admin OPS preservado, validar configs intactas, DB limpia
**Esfuerzo**: 1-2 horas (ejecución supervisada).

---

## 🟡 IMPORTANTES (no bloquean lanzamiento)

_(ningún importante abierto al cierre del sprint del 2026-04-30)_


---

## ⏳ PENDIENTES POST-LAUNCH (no bloquean)

| Feature | Tipo | Esfuerzo |
|---|---|---|
| `feat/propinas-driver` | Feature | Grande (schema `Order.driverTip`, UI buyer, endpoint, lógica MP, payout) |
| Habilitar Routes API en GCP | Config | Chico (habilitar API + setear `NEXT_PUBLIC_USE_ROUTES_API=true`) |
| PIN Fase 11 — Offline mode | Mejora | Medio (IndexedDB + service worker cache) |
| PIN Fase 12 — Flow "no pude entregar" | Mejora | Medio (foto + GPS + espera validada) |
| PIN Fase 13 — Cron drivers no-moviendo >10min | Mejora | Chico |
| Tests automatizados (Vitest configurado, 0 escritos) | Calidad | Grande |
| MP producción (credenciales reales) | Config | Chico |
| Split payments real (`SubOrder.mpTransferId` no implementado) | Feature | Grande |

---

## ✅ Resueltos en este sprint (2026-04-25 → 2026-05-08)

| Issue | Rama | Resumen |
|---|---|---|
| (smoke-1A) | `fix/ops-form-paridad-registro` | Modal OPS "Crear cuenta" ahora pide nombre y apellido por separado (igual que /repartidor/registro y /registro publicos). Endpoint Zod schema actualizado: deja de partir el nombre completo por el primer espacio (rompía nombres compuestos como "Maria del Carmen Di Tella"). |
| (smoke-3B) | `feat/welcome-emails-driver-merchant` | Driver y merchant ahora reciben email de acuse de recibo al registrarse. Las funciones `sendDriverRequestReceivedEmail` y `sendMerchantRequestReceivedEmail` ya existían en `email-p0.ts` con su entry en EMAIL_REGISTRY pero no estaban conectadas a sus triggers. Antes solo el admin recibía notificación; el driver/merchant se quedaban "en el aire" durante las 24-48hs hasta la aprobación. |
| (smoke-2B) | `fix/confirmacion-driver-campos-vacios` | Step 3 del registro driver: filas DNI/CUIT/Color/Patente y todo el bloque Vencimientos solo se renderizan si tienen valor. Antes mostraban "—" siempre, contradiciendo el flujo simplificado donde son opcionales. |
| (smoke-2C) | (Cloudflare) | Email Address Obfuscation desactivado en Cloudflare. Resuelve React #418 en `/terminos-repartidor` (Cloudflare reemplazaba `legal@somosmoovy.com` post-SSR causando hydration mismatch). Sin código. |
| ISSUE-061 | `fix/utf8-encoding-pipeline` | UTF-8 pipeline export: pg_dump + docker cp (bytes raw) en vez de PowerShell `>`. Tildes preservadas. |
| ISSUE-062 | `fix/auth-bloqueo-y-reset` | Warning intentos restantes + unlock dual-layer + auditoría reset password |
| (multifoto) | `fix/producto-multifoto-carousel` | Carousel táctil + dots + flechas en detalle producto/listing |
| (ops-cuentas) | `feat/ops-crear-cuentas` | Admin crea buyer/driver/seller desde OPS con magic link |
| (driver-bank) | `feat/driver-bank-mp` | Schema bancario driver + endpoint + UI panel + payouts |
| (sin-foto) | `fix/aprobacion-sin-foto-driver` | Driver approve sin foto + hard delete pedidos colgados |
| (avatar) | `feat/avatar-dropdown-portales` | Dropdown header con accesos a portales por rol |
| (claude.md) | `chore/optimize-claude-context` | CLAUDE.md sintético + CHANGELOG.md histórico + `finish.ps1` con prompt docs |

---

## ✅ Resueltos en sprints anteriores

Ver `.claude/CHANGELOG.md` para detalle completo de cada rama (~22 entries con detalle a nivel archivo+línea).

**Highlights de seguridad/dinero ya cerrados**:
- ISSUE-001 PIN doble (fraud detection + auto-suspend)
- ISSUE-024 Race condition puntos (Serializable tx + retry)
- ISSUE-027 Reset password timing-safe + token hasheado
- ISSUE-054 "Avisame cuando haya repartidor"
- ISSUE-060 Resurrección de cuentas bloqueada
- ISSUE-013 Push proximidad <300m
- ISSUE-014 Smart batching multi-vendor
- ISSUE-015 Auto-cancel pedidos huérfanos
- ISSUE-010 Driver offline mid-delivery alert

**Highlights UX ya cerrados**:
- ISSUE-012, 020, 021, 036, 037, 038, 039, 041-045, 047, 055, 056, 059
- AAIP compliance (`fix/privacy-policy-aaip-compliance`)
- Onboarding completo merchant + driver
- Chat multidireccional
- Email registry + 60 templates editables
- Panel CRM/OPS (segmentos, broadcast, payouts, playbook)
