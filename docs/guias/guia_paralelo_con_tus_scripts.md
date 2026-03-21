# Guía de Trabajo Paralelo — Adaptada a TUS Scripts

> Tus scripts `start.ps1`, `finish.ps1`, `publish.ps1`, `devmain.ps1` y `sync.ps1`
> sirven perfecto para casi todo. Solo necesitás un pequeño agregado para
> la parte de worktrees (trabajo paralelo real).

---

## TU WORKFLOW ACTUAL vs LO QUE NECESITAMOS

```
TU WORKFLOW HABITUAL (secuencial):
  start.ps1 → trabajás → publish.ps1 (guardar progreso) → finish.ps1 → develop

LO QUE NECESITAMOS (paralelo):
  start.ps1 (emails) ─────┐
                           ├─→ trabajan al mismo tiempo ─→ finish.ps1 cada una → develop
  start.ps1 (logística) ──┘
```

El "problema" es que tus scripts usan `git checkout` para cambiar de rama,
y no podés estar en 2 ramas a la vez en la misma carpeta. Por eso necesitamos
**Git Worktrees**: una copia del proyecto en otra carpeta, en otra rama,
que funciona como si fuera un repo independiente.

**Tus scripts siguen funcionando igual**, solo que los ejecutás desde la
carpeta del worktree correspondiente. Nada cambia en la lógica.

---

## PASO A PASO COMPLETO

### ═══════════════════════════════════════════
### FASE 1 — ANÁLISIS PARALELO (solo lectura)
### ═══════════════════════════════════════════

La Fase 1 es puro análisis: Cowork lee tu código y genera reportes.
**No modifica archivos**, así que NO necesitás ramas ni worktrees.
Podés lanzar las dos auditorías directo sobre tu proyecto tal cual está.

#### Paso 1.1 — Abrir Cowork para EMAILS

1. Abrí **Claude Desktop → Cowork**
2. Seleccioná la carpeta de **moovy** (la de siempre)
3. Pegá el **prompt de auditoría de emails** completo
4. Dejalo correr

#### Paso 1.2 — Abrir Cowork para LOGÍSTICA (al mismo tiempo)

5. Abrí **otra tarea nueva** en Cowork
6. Seleccioná la **misma carpeta moovy**
7. Pegá el **prompt de auditoría de logística** completo
8. Dejalo correr

> ✅ Ambos pueden leer la misma carpeta sin problemas porque ninguno escribe.

#### Paso 1.3 — Guardar los reportes

Cuando cada uno termine, pedile:

**Sesión de emails:**
```
Guardá el reporte completo como AUDIT_EMAILS.md en la raíz del proyecto.
```

**Sesión de logística:**
```
Guardá el reporte completo como AUDIT_LOGISTICS.md en la raíz del proyecto.
```

#### Paso 1.4 — Commitear los reportes con publish.ps1

Abrí tu terminal de PowerShell en la carpeta de moovy:

```powershell
.\scripts\publish.ps1 -Message "audit: reportes de auditoría emails y logística"
```

¡Listo! Los reportes quedan guardados en tu rama actual (develop).

---

### ═══════════════════════════════════════════════
### FASE 2 — IMPLEMENTACIÓN PARALELA (escribir código)
### ═══════════════════════════════════════════════

Ahora sí necesitás ramas separadas porque Cowork va a escribir código.
Acá es donde entran los worktrees.

#### Paso 2.1 — Crear las ramas con start.ps1

Abrí PowerShell en tu carpeta moovy y creá la primera rama:

```powershell
.\scripts\start.ps1
# Elegí: 1 (feat)
# Nombre: email-system
# → Se crea la rama: feat/email-system
```

Ahora volvé a develop para crear la segunda:

```powershell
git checkout develop
.\scripts\start.ps1
# Elegí: 1 (feat)
# Nombre: logistics-engine
# → Se crea la rama: feat/logistics-engine
```

Volvé a develop:

```powershell
git checkout develop
```

Ahora tenés 2 ramas creadas: `feat/email-system` y `feat/logistics-engine`.

#### Paso 2.2 — Crear los Worktrees

Esto es lo único "nuevo" que vas a hacer. Son 2 comandos:

```powershell
# Desde la carpeta moovy (estando en develop)

# Crear carpeta paralela para emails
git worktree add ..\moovy-emails feat/email-system

# Crear carpeta paralela para logística
git worktree add ..\moovy-logistics feat/logistics-engine
```

Ahora tenés 3 carpetas:

```
📁 C:\...\moovy\              ← develop (tu carpeta original, no la toques)
📁 C:\...\moovy-emails\       ← feat/email-system (worktree)
📁 C:\...\moovy-logistics\    ← feat/logistics-engine (worktree)
```

> 💡 Cada carpeta tiene todo el código de moovy, pero en su propia rama.
> Es como tener 3 copias del proyecto, pero Git las mantiene sincronizadas.

#### Paso 2.3 — Copiar tus scripts a los worktrees

Los worktrees tienen todos los archivos del proyecto, incluyendo la carpeta
`scripts/`. Así que `start.ps1`, `finish.ps1`, `publish.ps1`, etc. ya
están ahí. No necesitás copiar nada.

Verificalo:

```powershell
# Verificar que los scripts están disponibles
ls ..\moovy-emails\scripts\
ls ..\moovy-logistics\scripts\
```

#### Paso 2.4 — Lanzar implementación en Cowork

**Sesión 1 — Emails:**

1. Abrí Cowork → seleccioná la carpeta **`moovy-emails`**
2. Pegá este prompt:

```
Leé el archivo AUDIT_EMAILS.md que está en la raíz del proyecto.
Basándote en ese reporte, implementá todos los items P0 (obligatorios
para lanzar) del sistema de emails.

REGLA IMPORTANTE: Solo creá archivos nuevos y modificá archivos del
módulo de emails. NO modifiques archivos compartidos como:
- El modelo de Order/Pedido
- El modelo de Driver/User
- Las rutas principales de la API
- package.json

Si necesitás cambios en esos archivos compartidos, documentalos
en un archivo CAMBIOS_COMPARTIDOS_EMAILS.md
```

**Sesión 2 — Logística (al mismo tiempo):**

3. Abrí otra tarea en Cowork → seleccioná la carpeta **`moovy-logistics`**
4. Pegá este prompt:

```
Leé el archivo AUDIT_LOGISTICS.md que está en la raíz del proyecto.
Basándote en ese reporte, implementá todos los items P0 (bloqueantes
para lanzar) del motor logístico.

REGLA IMPORTANTE: Solo creá archivos nuevos y modificá archivos del
módulo de logística. NO modifiques archivos compartidos como:
- El modelo de Order/Pedido
- El modelo de Driver/User
- Las rutas principales de la API
- package.json

Si necesitás cambios en esos archivos compartidos, documentalos
en un archivo CAMBIOS_COMPARTIDOS_LOGISTICS.md
```

#### Paso 2.5 — Guardar progreso con publish.ps1

Mientras Cowork trabaja, podés ir guardando progreso desde PowerShell:

```powershell
# Terminal 1: guardar progreso de emails
cd C:\...\moovy-emails
.\scripts\publish.ps1 -Message "feat(emails): implementar servicio base de envío"

# Terminal 2: guardar progreso de logística
cd C:\...\moovy-logistics
.\scripts\publish.ps1 -Message "feat(logistics): implementar dispatch engine"
```

> ⚠️ **OJO con publish.ps1**: Tu script exporta la base de datos con
> `docker exec moovy-db pg_dump`. Esto funciona bien porque Docker es
> global (no depende de la carpeta). Solo asegurate de no correr los
> dos publish.ps1 exactamente al mismo tiempo para evitar que se pisen
> el dump. Dejá unos segundos entre uno y otro, o mejor aún, usá la
> versión simplificada de abajo.

#### (Opcional) publish-light.ps1 — Para worktrees sin tocar la DB

Si querés evitar el tema del dump duplicado, podés crear un script
liviano para los worktrees:

```powershell
# publish-light.ps1 — Guardar y subir sin exportar DB
param(
    [Parameter(Mandatory = $true)]
    [string]$Message
)

Write-Host ""
Write-Host "[PUBLISH-LIGHT] GUARDANDO CAMBIOS" -ForegroundColor Cyan

$currentBranch = git branch --show-current
Write-Host "[INFO] Rama: $currentBranch" -ForegroundColor Gray

if ($currentBranch -eq "main" -or $currentBranch -eq "develop") {
    Write-Host "[ERROR] No publicar directo a $currentBranch" -ForegroundColor Red
    exit 1
}

git add .
git commit -m $Message
git push origin $currentBranch

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Cambios publicados en $currentBranch" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Falló el push" -ForegroundColor Red
}
```

Guardalo como `scripts\publish-light.ps1` en cada worktree si querés.

---

### ══════════════════════════════════════════════
### FASE 3 — CERRAR RAMAS E INTEGRAR (finish.ps1)
### ══════════════════════════════════════════════

Cuando Cowork termine con ambas implementaciones, cerrás cada rama con
tu finish.ps1 de siempre. El orden importa.

#### Paso 3.1 — Cerrar la rama de EMAILS primero

```powershell
cd C:\...\moovy-emails
.\scripts\finish.ps1
# Mensaje: "feat(emails): sistema completo de emails transaccionales"
# ¿Eliminar rama? → n (NO la elimines todavía)
```

Esto hace:
- ✅ Commit + push de `feat/email-system`
- ✅ Checkout a develop
- ✅ Merge `feat/email-system` → develop
- ✅ Push develop

#### Paso 3.2 — Cerrar la rama de LOGÍSTICA después

```powershell
cd C:\...\moovy-logistics
.\scripts\finish.ps1
# Mensaje: "feat(logistics): motor logístico completo"
# ¿Eliminar rama? → n (NO la elimines todavía)
```

Esto hace:
- ✅ Commit + push de `feat/logistics-engine`
- ✅ Checkout a develop
- ✅ Merge `feat/logistics-engine` → develop (ya tiene los emails integrados)
- ✅ Push develop

> ⚠️ **Si hay conflictos en el merge de logística** (porque ambas ramas
> tocaron archivos similares), Git te va a avisar. Resolvelos y después:
> ```powershell
> git add .
> git commit -m "merge: resolver conflictos emails + logística"
> git push origin develop
> ```
>
> O mejor, abrí Cowork y pedile:
> ```
> Hay conflictos de merge en develop entre feat/email-system y
> feat/logistics-engine. Leé los archivos CAMBIOS_COMPARTIDOS_EMAILS.md
> y CAMBIOS_COMPARTIDOS_LOGISTICS.md y resolvé los conflictos integrando
> ambos cambios correctamente.
> ```

#### Paso 3.3 — Integrar los cambios compartidos

Ahora en tu carpeta **moovy** original (que está en develop):

```powershell
cd C:\...\moovy
.\scripts\sync.ps1 -SkipServer
```

Esto te actualiza develop con todos los cambios. Ahora abrí Cowork
apuntando a esta carpeta y pedile:

```
Leé los archivos CAMBIOS_COMPARTIDOS_EMAILS.md y
CAMBIOS_COMPARTIDOS_LOGISTICS.md.

Aplicá todos los cambios listados a los archivos compartidos
(modelos de Order, Driver, User, rutas de API, package.json).

Asegurate de que ambos módulos (emails y logística) funcionen
juntos sin conflictos.
```

Después guardalo:

```powershell
.\scripts\publish.ps1 -Message "feat: integrar cambios compartidos de emails y logística"
```

#### Paso 3.4 — Limpiar worktrees

Cuando todo esté integrado en develop:

```powershell
cd C:\...\moovy

# Eliminar los worktrees
git worktree remove ..\moovy-emails
git worktree remove ..\moovy-logistics

# Ahora sí podés eliminar las ramas si querés
git branch -d feat/email-system
git branch -d feat/logistics-engine
git push origin --delete feat/email-system
git push origin --delete feat/logistics-engine
```

#### Paso 3.5 — Deploy a producción (cuando quieras)

Cuando estés conforme con todo en develop:

```powershell
cd C:\...\moovy
.\scripts\devmain.ps1
```

Tu devmain.ps1 ya hace todo: merge a main + deploy a VPS + sync DB. No
hay que tocarle nada.

---

## RESUMEN — QUÉ SCRIPT USÁS EN CADA MOMENTO

```
FASE 1 — ANÁLISIS (no necesita scripts de Git)
═══════════════════════════════════════════════
  Cowork lee → genera reportes → vos hacés:
  .\scripts\publish.ps1 -Message "audit: reportes"


FASE 2 — IMPLEMENTACIÓN PARALELA
═══════════════════════════════════════════════
  PREPARACIÓN:
  .\scripts\start.ps1              → feat/email-system
  git checkout develop
  .\scripts\start.ps1              → feat/logistics-engine
  git checkout develop
  git worktree add ..\moovy-emails feat/email-system        ← NUEVO
  git worktree add ..\moovy-logistics feat/logistics-engine  ← NUEVO

  DURANTE (guardar progreso desde cada carpeta):
  cd ..\moovy-emails
  .\scripts\publish.ps1 -Message "..."
  cd ..\moovy-logistics
  .\scripts\publish.ps1 -Message "..."

  CERRAR RAMAS:
  cd ..\moovy-emails
  .\scripts\finish.ps1             → merge a develop
  cd ..\moovy-logistics
  .\scripts\finish.ps1             → merge a develop

  INTEGRAR COMPARTIDOS:
  cd ..\moovy
  .\scripts\sync.ps1 -SkipServer   → actualizar develop
  (Cowork integra) →
  .\scripts\publish.ps1 -Message "feat: integración final"

  LIMPIAR:
  git worktree remove ..\moovy-emails                       ← NUEVO
  git worktree remove ..\moovy-logistics                    ← NUEVO


FASE 3 — DEPLOY
═══════════════════════════════════════════════
  .\scripts\devmain.ps1            → main + VPS (igual que siempre)
```

---

## LO ÚNICO NUEVO QUE APRENDÉS

| Comando nuevo | Qué hace | Cuándo lo usás |
|---------------|----------|----------------|
| `git worktree add ..\moovy-emails feat/email-system` | Crea una carpeta paralela en otra rama | Una sola vez, al arrancar la Fase 2 |
| `git worktree remove ..\moovy-emails` | Elimina la carpeta paralela | Una sola vez, al terminar todo |

Eso es todo. **2 comandos nuevos**. Todo el resto es tu workflow de siempre
con start, publish, finish y devmain.

---

## DIAGRAMA FINAL

```
                    TU CARPETA MOOVY (develop)
                    .\scripts\start.ps1 × 2
                              │
              ┌───────────────┼───────────────┐
              │               │               │
     git worktree add         │      git worktree add
              │               │               │
              ▼               │               ▼
    📁 moovy-emails           │     📁 moovy-logistics
    feat/email-system         │     feat/logistics-engine
              │               │               │
    Cowork trabaja acá        │     Cowork trabaja acá
    publish.ps1 para guardar  │     publish.ps1 para guardar
              │               │               │
    finish.ps1 ──────────────►│◄────────────── finish.ps1
              │          develop               │
              │          (mergeado)             │
              │               │                │
    worktree remove           │      worktree remove
                              │
                     sync.ps1 -SkipServer
                     (integrar compartidos)
                     publish.ps1
                              │
                              ▼
                     devmain.ps1
                     (deploy a producción)
```
