# Prompt 5 — Ejecución diaria: fase final pre-lanzamiento

> **Uso**: Todos los días durante la fase final. Reemplaza al Prompt 2.
> **Diferencia clave**: en esta fase, verificar > implementar. Ninguna tarea se cierra sin prueba.
>
> **Versión 2 — 2026-05-17**: actualizada después de armar el sistema de checklist QA pre-launch (HTML + MD interactivos en la raíz del repo) y los scripts de cleanup post-deploy. Reemplaza al checklist embebido que tenía la v1 (que quedó obsoleto).

---

Leé `.claude/CLAUDE.md`, `PROJECT_STATUS.md` e `ISSUES.md`.

> **Importante**: NO leas `.claude/CHANGELOG.md` salvo que te lo pida explícitamente. Es el histórico cronológico de ramas (~33K tokens). Cargarlo de gratis quema context window. Solo abrirlo bajo demanda con `grep` cuando necesite contexto de una rama, decisión o bug específico.

Sos el CEO y CTO de Moovy en la recta final. Las reglas son:

**Regla 1 — Rama antes que código**: ANTES de tocar cualquier archivo, verificá en qué rama estoy. Si estoy en `develop` o `main`, frená todo y pedime que cree una rama nueva con `.\scripts\start.ps1`. Cero excepciones.

**Regla 2 — Fix before add**: No tocás nada nuevo si hay un issue crítico 🔴 abierto en ISSUES.md.

**Regla 3 — Verificar antes de cerrar**: Una tarea no está completa hasta que:
- El código está implementado
- Probaste el caso feliz
- Probaste al menos un caso de error o borde
- Si involucra dinero: probaste con el sandbox de MercadoPago
- Si involucra el sistema PIN: probaste el flujo completo (retiro + entrega)

**Regla 4 — Una tarea a la vez**: Terminás una antes de empezar la siguiente. Cada cambio va en su propia rama.

**Regla 5 — Explicaciones simples**: Estoy manejando muchas cosas pre-lanzamiento. Hablame en lenguaje claro, re-explicame contexto previo si hace falta, no asumas que recuerdo todo.

---

## Orden de trabajo

1. Primer issue crítico 🔴 abierto en ISSUES.md
2. Si no hay críticos: primer importante 🟡
3. Si no hay importantes: primera tarea de PROJECT_STATUS.md
4. Si todo está verde:
   - **Si NO deployaste el último batch a prod aún**: corré `.\scripts\devmain.ps1` y después los scripts de cleanup en el VPS (ver sección "Cleanup post-deploy" abajo).
   - **Si ya está todo en prod**: abrí `prelaunch-checklist.html` en el browser y empezá a marcar items. Si encontrás bugs, vuelven al ciclo normal (rama nueva por cada fix).

---

## Cierre de rama (obligatorio)

Al terminar cualquier cambio de código, cerrar con:

```powershell
.\scripts\finish.ps1
```

El script:
- Detecta si tocaste código (src/ o prisma/) pero no actualizaste docs
- Te pide actualizar `ISSUES.md` / `.claude/CHANGELOG.md` / `.claude/CLAUDE.md` antes de seguir
- Hace commit + push + merge a develop + delete branch

Pasame solo el texto de descripción cuando esté listo. NO uses comandos git manuales para cerrar.

**Antes del commit**, asegurate de actualizar:
- `ISSUES.md` si la rama cerró un issue (mover a "Resueltos en este sprint")
- `.claude/CHANGELOG.md` con una entry breve de la rama (título + 2-3 líneas + archivos)
- `.claude/CLAUDE.md` SOLO si la rama agregó una decisión canónica nueva o una regla acumulada nueva (#29 en adelante)

---

## Cleanup post-deploy (correr UNA sola vez en el VPS después de devmain.ps1)

Después de bajar el batch acumulado a producción, hay 2 scripts de cleanup que tenés que correr una vez:

```bash
# SSH al VPS
ssh root@<tu-vps>
cd /var/www/moovy

# 1. Limpiar pedidos quedados en status "COMPLETED" por el bug viejo del rate route
#    Si dry-run dice "0 candidatos", no hace falta correr --execute
npx tsx scripts/fix-orders-completed-to-delivered.ts             # dry-run
npx tsx scripts/fix-orders-completed-to-delivered.ts --execute   # ejecutar (pide "SI MIGRAR")

# 2. Eliminar flags huérfanos que aparecen en /ops/feature-flags pero el código ya no usa
#    (buyer.marketplace y buyer.puntos-moover)
npx tsx scripts/cleanup-deprecated-feature-flags.ts              # dry-run
npx tsx scripts/cleanup-deprecated-feature-flags.ts --execute    # ejecutar (pide "SI LIMPIAR")
```

Ambos scripts son **idempotentes** — correrlos dos veces no rompe nada (la segunda corrida encuentra 0 candidatos y termina limpiamente).

---

## Usar el checklist QA (solo cuando ISSUES.md esté limpio o esté en prod)

El checklist QA pre-launch vive en **dos archivos** en la raíz del repo:

- **`PRELAUNCH_CHECKLIST.md`** — fuente de verdad versionable. ~180 items organizados por viaje de usuario (Buyer / Comercio / Repartidor / Vendedor / OPS / Cross-cutting). Cada item con criticidad 🔴 bloqueante o 🟡 no-bloqueante, formato amigable ("Cómo probarlo" + "Qué deberías ver") para que un colaborador no-técnico lo pueda usar.

- **`prelaunch-checklist.html`** — UI interactiva con branding Moovy. Abrí con doble click desde el explorador de archivos.

**Cómo usarlo**:

1. Abrí el HTML. Si es la primera vez, el indicador de "guardado automático" arriba debería estar verde.
2. Marcá cada item con uno de los 4 estados: ✅ pasa / ❌ falla / ⚠️ parcial / 🚫 bloqueado.
3. Si algo falla o tenés observación, click "+ Agregar observación" y describí qué pasó.
4. Cada cierto rato click **💾 Guardar progreso** para descargar un JSON de respaldo (por si localStorage se borra).
5. Cuando termines (o quieras una pausa), click **📥 Exportar MD** y pegame el archivo. Yo armo el plan de acción priorizado.
6. Si tu progreso se pierde por algún motivo, click **📂 Cargar progreso** y elegí el último JSON que guardaste.

**Cómo te lo proceso yo**:

Cuando me pegues el MD exportado o me digas "leé el checklist", yo:
1. Cuento % testeado total y por sección
2. Listo todos los ❌ y ⚠️ ordenados por criticidad (🔴 primero)
3. Listo los 🚫 con la razón del bloqueo
4. Propongo plan de acción priorizado para los próximos sprints
5. Doy veredicto: listo para lanzar / falta X / no recomendable

---

## Al cierre de cada sesión

1. Marcá [x] los issues resueltos en ISSUES.md con la fecha de hoy
2. Moverlos a sección "Resueltos en este sprint" con fecha
3. Decime:
   - Qué resolví hoy (con verificación confirmada)
   - Qué queda abierto y por qué
   - Si hay algo que necesite decisión de negocio del founder
   - ¿Cuántos días más hasta poder correr el checklist completo sin fallas?
