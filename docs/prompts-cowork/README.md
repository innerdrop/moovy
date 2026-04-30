# Prompts de Cowork — Moovy

Prompts que usamos para trabajar con Claude (Sonnet 4.6) en Cowork.

Última actualización: 2026-04-29

---

## Archivos vigentes

| Archivo | Cuándo usarlo | Frecuencia |
|---------|---------------|------------|
| `PROMPT_5_DIARIO_FINAL.md` | Sesión diaria en fase pre-launch / post-launch | **Todos los días** |
| `PROMPT_6_GO_NOGO.md` | Veredicto final pre-lanzamiento (¿Moovy está listo?) | El día antes del launch |

Los demás prompts del sprint inicial (`PROMPT_1` a `PROMPT_4`) ya cumplieron su función y fueron archivados — la info canónica que generaron quedó consolidada en `.claude/CLAUDE.md`.

---

## Cómo usar

1. Abrí **Cowork** → seleccioná la carpeta `moovy`
2. Copiá el contenido del prompt vigente que corresponda
3. Pegalo en Cowork al inicio de la sesión
4. Claude lee `.claude/CLAUDE.md`, `ISSUES.md` y `PROJECT_STATUS.md` automáticamente

---

## PROMPT_5 — Sesión diaria

Es el prompt de **uso diario** durante la fase final pre-lanzamiento y post-launch.

**Lo que carga**:
- `.claude/CLAUDE.md` (~5.6K tokens) — info canónica del proyecto
- `ISSUES.md` (~1.1K tokens) — issues abiertos hoy
- `PROJECT_STATUS.md` (~700 tokens) — dashboard del estado actual
- El prompt en sí (~1.4K tokens)

**Total inicial**: ~9K tokens (vs los ~82K que usaba el flujo anterior, **89% menos**).

**Lo que NO carga**:
- `.claude/CHANGELOG.md` — histórico de ramas, accesible bajo demanda con grep solo si Claude te lo pide explícitamente
- `.claude/CHANGELOG-auditorias.md` — auditorías archivadas, idem

**Reglas que aplica**:
1. Rama antes que código — nunca editar en `develop` ni `main`
2. Fix before add — no abrir features nuevos si hay un crítico 🔴 abierto
3. Verificar antes de cerrar — caso feliz + caso borde mínimo
4. Una tarea a la vez — cada cambio en su rama
5. Explicaciones simples — pre-launch overload, no asumir memoria

---

## PROMPT_6 — Veredicto final

Para el día antes del lanzamiento. Claude hace una auditoría integral del proyecto y dictamina:
- ¿Listo para lanzar? (sí/no/condicional)
- ¿Qué riesgos quedan abiertos?
- ¿Qué pasa si fracasa el lanzamiento?

No es un prompt diario — se usa una sola vez en la decisión final.

---

## Flujo típico de sesión

```
1. Abrir Cowork
2. Pegar PROMPT_5_DIARIO_FINAL.md
3. Claude responde:
   - Qué entiende del estado actual
   - Qué tarea sugiere atacar (basado en ISSUES.md prioridades)
4. Si querés algo distinto, decile
5. Antes de cualquier cambio, Claude pide:
   - Que crees rama con .\scripts\start.ps1 <nombre>
   - Aprobación del plan antes de tocar código
6. Al cerrar la rama:
   - .\scripts\finish.ps1
   - El script auto-genera entry en CHANGELOG.md
   - Recordatorios no bloqueantes si tocaste schema/roles/auth
7. Para deploy a producción:
   - .\scripts\devmain.ps1 -DryRun (validar)
   - .\scripts\devmain.ps1 (deploy real)
```

---

## Si necesitás contexto histórico

Claude no carga `.claude/CHANGELOG.md` automáticamente para ahorrar tokens. Si necesitás info de una rama vieja, decile explícitamente:

> "Leé `.claude/CHANGELOG.md` y buscá la rama `fix/algo`"

O si necesitás auditorías archivadas:

> "Leé `.claude/CHANGELOG-auditorias.md` y dame el contexto de la auditoría de pagos"

---

## Histórico

Los prompts del sprint inicial fueron eliminados el 2026-04-29 cuando se consolidó la metodología:

- `PROMPT_1_INICIAL.md` — generaba CLAUDE.md desde cero (ya hecho)
- `PROMPT_2_DIARIO.md` — uso diario fase de desarrollo (reemplazado por `PROMPT_5`)
- `PROMPT_3_CONSEJO_EXPERTOS.md` — auditoría crítica pre-lanzamiento (ya hecha, hallazgos aplicados)
- `PROMPT_4_UX_COMPLETO.md` — auditoría UX (ya hecha, issues resueltos)
- `README_FASE_FINAL.md` — guía de transición (ya cumplió)

Si en algún momento necesitás regenerar el sistema desde cero, Claude tiene memoria suficiente para reconstruirlos a partir del estado del repo.
