# PROMPT 7 — Auditorías senior re-adaptadas para Moovy

> **Origen**: colección "10 prompts para usar Claude como ingeniero senior" (@ia.evoluciona).
> **Re-adaptación**: 2026-06-18. Moovy ya está **construido y deployado** (batch en prod detrás de la cortina, recta final pre-launch).
> Los prompts originales están escritos para la fase de **construcción**. Acá quedan solo los que sirven a un producto **terminado que está por lanzar**, con los guardrails de Moovy incorporados.

---

## Regla de uso (vale para TODOS los prompts de abajo)

Estos prompts son **read-only / modo reporte**. NO autorizan reescribir ni commitear nada.
Pegá uno, dejá que produzca el reporte priorizado, y recién ahí decidimos qué entra al ciclo normal.

Guardrails que el prompt asume siempre (no hace falta repetirlos, ya están en CLAUDE.md):

1. **No tocar código sin rama.** Cualquier hallazgo que merezca fix → entra a `ISSUES.md`, se prioriza, y se arregla **de a uno** con `start.ps1` / `finish.ps1`. Nunca en `develop`/`main`.
2. **Fix before add.** Si hay un 🔴 abierto, se cierra antes de cualquier mejora cosmética.
3. **No refactor masivo pre-launch.** El entregable es un **reporte**, no "código listo para producción". El refactor grande es post-launch.
4. **Entregable estándar de toda auditoría**: tabla de hallazgos con `severidad` (🔴/🟡/🟢) · `archivo:línea` · `por qué importa` · `fix sugerido` · `esfuerzo`. Ordenada por severidad. Nada más.
5. Respetá las 10 reglas inviolables (no abrir browser, no `npm run dev/build`, `tsc --noEmit` para verificar, no `migrate dev`, MP en prod, etc.).

---

## ✅ Prompts que SÍ sirven ahora (re-adaptados)

### 7.A — Auditoría senior de deuda técnica (de la #2 original)

```
Actuá como ingeniero senior que revisa Moovy ANTES de su lanzamiento público.
El código ya está en producción detrás de la cortina; el objetivo NO es rediseñar
arquitectura, es encontrar deuda técnica que pueda morder en las primeras semanas
de operación real en Ushuaia.

Leé primero CLAUDE.md (arquitectura canónica, reglas #1-#28, reglas de ejecución)
para no proponer nada que ya esté decidido o que rompa una convención existente.

Buscá, en este orden de prioridad:
1. Lógica duplicada en parámetros financieros, asignación o puntos (riesgo de que
   dos sistemas escriban el mismo valor distinto — está prohibido por la Biblia).
2. Endpoints sin Zod, sin auth DB-based, o que confían en el JWT roles[] como
   verdad (debe ser cache, no autorización — reglas #13/#28).
3. Queries Prisma sin select/include explícito o con N+1 en listados públicos.
4. Lugares donde se recalcula sobre orders cerradas (rompe cierres AFIP).
5. Wording user-facing que diga "OPS" o nombre competidores (regla #22).

NO reescribas código. Entregá SOLO el reporte priorizado (severidad · archivo:línea
· por qué importa para el launch · fix sugerido · esfuerzo). Cada hallazgo serio lo
agrego yo a ISSUES.md y lo arreglamos de a uno con su rama.
```

### 7.B — Debug de causa raíz (de la #3 original) — *solo cuando hay un bug concreto*

```
Actuá como ingeniero senior de debugging. Tengo UN bug concreto: [DESCRIBÍ EL BUG:
qué hace el usuario, qué espera, qué pasa, en qué portal].

Investigá la causa raíz real, no el síntoma. Pasos:
1. Leé el código del flujo completo del actor afectado (no solo el archivo obvio).
2. Identificá la causa raíz y explicá POR QUÉ falla.
3. Detectá edge cases ocultos relacionados (vacío/null, concurrencia, $0, expirado,
   IDOR, race de puntos, doble webhook MP).
4. Proponé el fix más sólido — pero NO lo apliques todavía.

Pensá profundo antes de tocar nada. Si el fix toca dinero, asignación o configurables,
incluí cómo se prueba contra DB real (no mocks) y la simulación financiera.
Si el fix amerita, lo metemos en su propia rama con start.ps1.
```

### 7.C — Auditoría de seguridad pre-launch (de la #10 original) — ⭐ la más valiosa hoy

```
Actuá como ingeniero senior de seguridad auditando Moovy antes de abrir al público.
Es un marketplace + delivery con pagos reales (MercadoPago en PRODUCCIÓN), datos
personales bajo Ley 25.326 (AAIP) y dinero de comercios/repartidores en juego.
Un error de seguridad con dinero se sabe en Ushuaia en 24h por boca a boca.

Auditá (modo reporte, sin tocar código), priorizando lo explotable hoy:
1. AUTORIZACIÓN / IDOR: endpoints que devuelven o mutan datos de otro usuario,
   comercio, driver o pedido sin verificar pertenencia contra DB.
2. AUTENTICACIÓN: JWT como cache vs verdad, rutas admin (/ops/*) protegidas en
   proxy + layout, rate limit en login/reset, tokens timing-safe + hasheados.
3. INPUTS: endpoints sin Zod, $queryRaw sin parametrizar, uploads sin magic bytes
   o sin límite de 10MB, dangerouslySetInnerHTML sin sanitizar.
4. DATOS SENSIBLES AAIP: CUIT/CBU/DNI/tokens MP — confirmar decrypt/encrypt en
   TODO endpoint que los lee o escribe; que no se filtren en /me ni en logs ni
   en eventos de Sentry (scrubSentryEvent).
5. PAGOS: webhook MP valida monto vs total (tolerancia $1), idempotencia con
   eventId determinístico (no UUID random), refund/stock-restore, montos nunca
   negativos, todo server-side.
6. ACCIONES IRREVERSIBLES: hard delete, mark-paid payouts, refund manual — que
   exijan confirmación textual literal + audit log antes del side effect.

Entregá: reporte de vulnerabilidades con severidad (🔴 crítico explotable /
🟡 importante / 🟢 hardening), escenario de ataque concreto por cada 🔴, archivo:línea,
y fix sugerido. NO apliques fixes — los 🔴 los priorizo y van de a uno con su rama.
```

### 7.D — Performance acotada a Ushuaia (de la #4 original)

```
Actuá como ingeniero de performance, pero con el mercado REAL de Moovy en mente:
Ushuaia, ~80k habitantes, conexión irregular (3G frecuente), -5°C, pico de demanda
en verano (dic-mar) y turistas. NO optimices para "millones de usuarios" ni
hiperescala — eso sería over-engineering. Optimizá para que la app cargue rápida y
barata en un celular de gama media con mala señal, y que no se caiga en el pico.

Buscá (modo reporte):
1. N+1 y queries sin paginación en listados (home, /mis-pedidos, panel OPS).
2. Imágenes sin sharp/next/image, sin lazy, pesadas para 3G.
3. Polling agresivo (sockets/intervalos) que castigue batería y datos.
4. Configs que se leen de DB en cada request y deberían cachearse.
5. Bundles grandes sin dynamic import en rutas pesadas.

Entregá el reporte priorizado por impacto-en-3G/pico. Sin reescribir: cada mejora
real entra a ISSUES.md como tarea post-launch salvo que sea un riesgo de caída en
el launch (eso sube a 🔴).
```

### 7.E — Confiabilidad de operación (de la #11 DevOps, aterrizada)

```
Actuá como ingeniero senior de operaciones revisando la confiabilidad de Moovy para
el día del launch. NO rediseñes la infra ni propongas Kubernetes — la realidad es:
VPS Hostinger, deploy por PowerShell+SSH, GitHub Actions (tsc), Sentry, crons por
crontab, Postgres+PostGIS en Docker (puerto 5436), Socket.IO.

Revisá (modo reporte):
1. CRONS: que estén todos en el crontab, idempotentes (patrón updateMany WHERE flag
   IS NULL), envueltos en recordCronRun, y con CRON_SECRET correcto. (Hubo un
   incidente: comillas en CRON_SECRET → 401 ~14 días. Ver docs/RUNBOOK_CRONS.md.)
2. ROLLBACK: si el deploy del día del launch sale mal, ¿cuál es el camino de vuelta?
3. BACKUPS: ¿hay dump de la DB antes de correr clean-db-pre-launch.ts el día del launch?
4. MONITOREO: operaciones que pueden fallar en silencio (webhooks MP, asignación,
   payouts) — ¿logean recepción/proceso/resultado? ¿Sentry los captura?
5. HEALTHCHECKS: CronRunLog, y qué pasa si Redis/SMTP no responden (fallbacks).

Entregá un checklist de confiabilidad para el día del launch + hallazgos priorizados.
Nada de re-arquitecturar; solo asegurar que lo que YA existe no falle silenciosamente.
```

### 7.F — Modo Tech Lead pre-decisión (de la #9 original)

```
Antes de implementar [LO QUE SEA], actuá como tech lead senior y pará a pensar:
- Hacé las preguntas clave que falten (no asumas requisitos).
- Cuestioná si es lo de mayor impacto AHORA o un detalle mientras hay algo crítico abierto.
- Pensá el riesgo: si toca dinero/comercios/confianza/legal → versión más segura, no más rápida.
- ¿Cómo lo resolvería la competencia? Igual o peor = no aceptable.
- Pensá a 5 años de mantenimiento, pero priorizá la simplicidad para lanzar.

Entregá: decisión recomendada, tradeoffs, y un plan de implementación de a un paso —
para que yo apruebe antes de que toques una sola línea. (Esto ya es la metodología de
Moovy; el prompt sirve de recordatorio cuando estoy por meterme en algo grande.)
```

---

## ❌ Prompts que NO usar ahora (y por qué)

| # original | Tema | Por qué no aplica hoy |
|---|---|---|
| 5 | "Reconstruí el código en arquitectura limpia / nueva estructura de carpetas" | Refactor masivo + cambio de estructura **días antes del launch** = máximo riesgo, viola *fix-before-add*. Moovy ya tiene arquitectura canónica documentada. Post-launch, acotado y por rama. |
| 6 | "Diseñá todo el backend de la startup" | El backend ya existe y está en prod (~170 routes, ~30 modelos). Es un prompt de fase 0. |
| 7 | "Sé 4 agentes que diseñan y CONSTRUYEN" | El payload es construir desde cero. Tu consejo de 14 roles ya cubre la revisión multi-ángulo, sin generar código nuevo. |
| 8 | "Creá un sistema de componentes UI desde cero" | No necesitás componentes nuevos para lanzar; necesitás que los existentes no rompan. El rol UX (4 estados obligatorios) ya cubre la calidad. |

> Cuando Moovy esté lanzado y estable, 5 y 8 pueden volver — **acotados a un módulo puntual y siempre por rama**, nunca como barrido global.

---

## Cómo los uso en la práctica

1. Elegí una auditoría (la 7.C de seguridad es la candidata #1 antes de abrir la cortina).
2. La corro en modo reporte. **No toco código.**
3. Los hallazgos 🔴 los sumás a `ISSUES.md`; los arreglamos **de a uno**, cada uno con su rama (`start.ps1` → fix → verificación caso feliz + borde → `finish.ps1`).
4. Lo 🟡/🟢 que no bloquea el launch va a "pendientes post-launch".
