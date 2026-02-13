# 🚀 Flujo de Trabajo para 2 Desarrolladores con Antigravity

**Versión:** 3.0 - Trabajo Paralelo Automatizado  
**Última actualización:** 2026-02-13

Esta guía detalla cómo trabajar **2 personas al mismo tiempo** en el proyecto Moovy usando **Google Antigravity**, sin necesidad de conocimientos técnicos de Git ni revisión de código manual.

---

## ⚡ Comandos Rápidos (Cheat Sheet)

| Comando | Cuándo | Desde qué rama |
|---------|--------|----------------|
| `.\scripts\sync.ps1` | Al empezar el día | develop o feature/ |
| `.\scripts\quick-start.ps1 -Feature "nombre"` | Antes de cada tarea | develop |
| `.\scripts\quick-finish.ps1 -Message "descripción"` | Al terminar tarea | feature/* |
| `.\scripts\sync-now.ps1` | Sincronizar mientras trabajas | feature/* |
| `.\scripts\devmain.ps1` | Deploy a producción | develop |

**💬 Comunicación mínima requerida:**
```
Dev A: "notif"
Dev B: "dash"
```
Solo avisar el área de trabajo (5 segundos).

---

## 🎯 Filosofía del Nuevo Sistema

### El Problema Anterior
- ❌ Solo uno podía trabajar a la vez → pérdida de tiempo
- ❌ `finish.ps1` hacía merge automático → conflictos sorpresa
- ❌ `database_dump.sql` causaba conflictos constantes
- ❌ Sin coordinación aparecían errores difíciles de rastrear

### La Solución: Trabajo Paralelo Inteligente
- ✅ **Ambos trabajan al mismo tiempo** en ramas separadas
- ✅ **Auto-merge inteligente** al terminar cada tarea
- ✅ **Antigravity resuelve conflictos** automáticamente
- ✅ **Coordinación mínima** (5 segundos de comunicación)
- ✅ **Database_dump excluido** de Git (no más conflictos)

---

## 📋 Los 3 Comandos Esenciales

### 1️⃣ Empezar una tarea
```powershell
.\scripts\quick-start.ps1 -Feature "nombre-corto"
```
**Ejemplo:**
```powershell
.\scripts\quick-start.ps1 -Feature "notificaciones"
```

**¿Desde qué rama?** `develop` (o cualquiera, el script te cambia automáticamente)

**¿Qué hace automáticamente?**
- Sincroniza con `develop` (trae cambios del compañero)
- Crea tu rama `feature/notificaciones`
- Te posiciona en esa rama
- **Output:** "✅ Listo, pedile a Antigravity lo que necesites"

---

### 2️⃣ Terminar una tarea
```powershell
.\scripts\quick-finish.ps1 -Message "descripción breve"
```
**Ejemplo:**
```powershell
.\scripts\quick-finish.ps1 -Message "sistema de notificaciones push"
```

**¿Desde qué rama?** `feature/*` (tu rama de trabajo)

**¿Qué hace automáticamente?**
- Hace commit de todos tus cambios
- Baja últimos cambios de `develop`
- Intenta auto-merge
- **Si hay conflicto:** Llama a Antigravity para resolverlo
- Sube todo a GitHub
- Borra tu rama automáticamente
- Te deja en `develop` listo para la próxima

---

### 3️⃣ Sincronizar (opcional)
```powershell
.\scripts\sync-now.ps1
```

**¿Desde qué rama?** `feature/*` (tu rama de trabajo actual)

**¿Cuándo usarlo?**
- Tu compañero acaba de terminar una tarea
- Querés traer sus cambios MIENTRAS seguís trabajando
- Llevás varias horas trabajando y querés actualizar

**¿Qué hace?**
- Baja cambios de `develop`
- Los mergea en tu rama actual
- **Si hay conflicto:** Antigravity lo resuelve
- Seguís trabajando con todo actualizado

---

## 🗓️ Flujo de Trabajo Diario

### 🌅 Al empezar el día

#### Developer A (9:00 AM)
```powershell
# 1. Sincronizar
.\scripts\sync.ps1

# 2. Avisar en el chat
```
**Chat:**
```
Dev A: "Voy a trabajar en notificaciones push"
Dev B: "OK, yo trabajo en panel de estadísticas"
```

```powershell
# 3. Empezar
.\scripts\quick-start.ps1 -Feature "notificaciones"
```

#### Developer B (9:05 AM - al mismo tiempo)
```powershell
# 1. Sincronizar
.\scripts\sync.ps1

# 2. Ya avisó en el chat

# 3. Empezar
.\scripts\quick-start.ps1 -Feature "panel-stats"
```

---

### 💻 Durante el trabajo

#### Developer A trabaja con Antigravity
```
"Antigravity, implementa sistema de notificaciones push.
Debe enviar alertas cuando haya nuevas ofertas de entrega."
```
**Antigravity hace su magia... ✨**

#### Developer B (en paralelo)
```
"Antigravity, crea un panel de estadísticas en el dashboard.
Debe mostrar ganancias del día, pedidos completados y gráficos."
```
**Antigravity hace su magia... ✨**

**⚠️ Importante:** Si Antigravity está trabajando en algo y tarda, NO ejecutes comandos de Git manualmente. Esperá a que termine.

---

### ✅ Al terminar cada tarea

#### Developer A termina primero (10:30 AM)
```powershell
.\scripts\quick-finish.ps1 -Message "sistema de notificaciones push completo"
```

**Script automáticamente:**
```
✅ Commit de cambios
✅ Sincronizando con develop...
✅ Auto-merge exitoso
✅ Subiendo a GitHub...
✅ Rama feature/notificaciones eliminada
✅ Ahora estás en develop
```

**Chat:**
```
Dev A: "Listo con notificaciones ✅"
Dev B: "OK 👍"
```

#### Developer B termina después (11:00 AM)
```powershell
.\scripts\quick-finish.ps1 -Message "panel de estadísticas en dashboard"
```

**Script automáticamente:**
```
✅ Commit de cambios
✅ Sincronizando con develop...
📥 Descargados cambios de Dev A (notificaciones)
✅ Auto-merge exitoso
✅ Subiendo a GitHub...
✅ Rama feature/panel-stats eliminada
✅ Ahora estás en develop
```

---

### ⚠️ Caso: Conflicto Detectado

**Escenario:** Ambos tocaron el mismo archivo sin querer

```powershell
.\scripts\quick-finish.ps1 -Message "mi cambio"
```

**Script detecta conflicto:**
```
⚠️ CONFLICTO en src/app/dashboard/page.tsx
🤖 Llamando a Antigravity para resolver...

[Antigravity analiza el conflicto...]
[Combina ambos cambios inteligentemente...]

✅ Conflicto resuelto automáticamente
✅ Merge completado
✅ Subiendo a GitHub...
```

**Ustedes NO tocan nada.** El script + Antigravity lo resuelven.

---

## 📱 Coordinación Mínima (5 segundos)

### ¿Qué avisar?

Solo el **área general** donde vas a trabajar:

#### ✅ BIEN (aviso rápido)
```
Dev A: "notif"
Dev B: "dash"
```

```
Dev A: "panel comercio"
Dev B: "filtros productos"
```

#### ❌ MAL (no avisar nada)
```
[Ambos trabajan en silencio]
→ Ambos modifican dashboard.tsx
→ Conflicto complejo
```

### ¿Cuándo NO hace falta avisar?

Si trabajan en módulos completamente separados:

```
Dev A: Dashboard de repartidores
Dev B: Panel de administración

→ Cero posibilidad de conflicto
→ Pueden ni avisarse
```

---

## 🔄 Sincronizar Durante el Trabajo

### Caso: Tu compañero terminó algo importante

```
[Chat]
Dev A: "Listo con el sistema de autenticación ✅"
Dev B: "OK, lo bajo"
```

```powershell
# Dev B (sin terminar su tarea actual):
.\scripts\sync-now.ps1
```

**Script hace:**
```
📥 Descargando cambios de develop...
🔀 Mergeando en tu rama actual...
✅ Actualizado sin conflictos
```

Ahora Dev B sigue trabajando con el código actualizado.

---

## 🚨 Resolución Automática de Problemas

### Problema 1: "No puedo empezar, dice que tengo cambios sin guardar"

**Causa:** Antigravity hizo cambios que no commiteaste.

**Solución automática:**
```powershell
.\scripts\quick-finish.ps1 -Message "trabajo en progreso"
# Esto guarda todo automáticamente
```

### Problema 2: "El script dice que hay conflictos y no puede auto-resolver"

**Causa:** Conflicto muy complejo (raro).

**Solución manual con Antigravity:**
```
"Antigravity, tengo un conflicto de merge que el script no pudo resolver.
Los archivos en conflicto son: [el script te los muestra]
Ayúdame a resolverlo manualmente."
```

Antigravity te guía paso a paso.

### Problema 3: "Olvidé terminar ayer y hoy no puedo empezar"

**Solución:**
```powershell
# Terminar el trabajo de ayer
.\scripts\quick-finish.ps1 -Message "trabajo de ayer"

# Ahora empezar hoy
.\scripts\quick-start.ps1 -Feature "nueva-tarea"
```

---

## 🗑️ Base de Datos: Nueva Estrategia

### ❌ Antes (Problemático)
- `database_dump.sql` estaba en Git
- Causaba conflictos binarios constantes
- Imposible de mergear automáticamente

### ✅ Ahora (Sin Conflictos)
- `database_dump.sql` excluido de Git (en `.gitignore`)
- Cada desarrollador tiene su DB local independiente
- Solo se sube la DB en deploy a producción (`devmain.ps1`)

### ¿Cómo compartir datos entre devs?

**Si necesitas los datos exactos de tu compañero:**

1. Pedile que te comparta su `database_dump.sql` por:
   - Google Drive / OneDrive
   - WhatsApp (si es pequeño)
   - Slack / Discord

2. Colocar el archivo en la raíz del proyecto

3. Importar:
```powershell
.\scripts\sync.ps1
# Detecta el dump y te pregunta si querés importarlo
```

**Para producción:**

Solo cuando hacen deploy, la DB local se sube al VPS:
```powershell
.\scripts\devmain.ps1
# Sube código + base de datos a producción
```

---

## 📊 Tabla de Comandos Completa

| Comando | Cuándo usarlo | Qué hace |
|---------|---------------|----------|
| `.\scripts\sync.ps1` | **Al empezar el día** | Baja cambios del compañero |
| `.\scripts\quick-start.ps1` | **Antes de cada tarea** | Crea tu rama automáticamente |
| `.\scripts\quick-finish.ps1` | **Al terminar tarea** | Auto-merge a develop + push |
| `.\scripts\sync-now.ps1` | **Mientras trabajas** | Trae cambios sin terminar tu tarea |
| `.\scripts\devmain.ps1` | **Deploy a producción** | Sube todo al VPS (código + DB) |
| `.\scripts\emergency-reset.ps1` | **Emergencia** | Resetea todo a develop limpio |

---

## 🎯 Ejemplo Completo de Día de Trabajo

### Developer A y Developer B - Trabajo Paralelo

#### 9:00 AM - Inicio
```powershell
# Ambos al mismo tiempo:
.\scripts\sync.ps1
```

**Chat:**
```
A: "notif push"
B: "panel stats"
```

```powershell
# Dev A:
.\scripts\quick-start.ps1 -Feature "notificaciones"

# Dev B:
.\scripts\quick-start.ps1 -Feature "panel-stats"
```

#### 9:15 AM - 11:00 AM - Trabajo con Antigravity

**Dev A:**
```
"Antigravity, implementa notificaciones push..."
[Trabaja 2 horas]
```

**Dev B (en paralelo):**
```
"Antigravity, crea panel de estadísticas..."
[Trabaja 2 horas]
```

#### 11:00 AM - Dev A termina primero
```powershell
.\scripts\quick-finish.ps1 -Message "notificaciones push"
```
**Output:**
```
✅ Mergeado a develop
```

**Chat:**
```
A: "Listo ✅"
```

#### 11:30 AM - Dev B termina
```powershell
.\scripts\quick-finish.ps1 -Message "panel stats"
```
**Output:**
```
📥 Bajados cambios de A (notificaciones)
✅ Auto-merge exitoso
✅ Todo subido
```

#### 11:35 AM - Nueva tarea (Dev A)
```powershell
# Inmediatamente puede empezar otra:
.\scripts\quick-start.ps1 -Feature "dashboard-diseño"
```

**Chat:**
```
A: "dashboard diseño"
B: "OK, yo voy a almorzar"
```

---

## ⚠️ Reglas de Oro (Solo 3)

### 1. **SIEMPRE avisar antes de empezar**
Toma 5 segundos, evita conflictos.

### 2. **CONFIAR en Antigravity**
Si el script dice que algo se resolvió, confía. No revises código.

### 3. **NO trabajar en `develop` directamente**
Siempre usar `quick-start.ps1` para crear una rama.

---

## 🚀 Deploy a Producción (Sin Cambios)

Cuando quieran subir todo a la web real (https://somosmoovy.com):

```powershell
.\scripts\devmain.ps1
```

Este script **NO cambió**. Sigue siendo el mismo:
1. Mergea `develop` → `main`
2. Sube código al VPS
3. Sube base de datos al servidor
4. Reinicia la app

---

## 💡 Tips Pro

### Tip 1: Sesiones Cortas
```
En vez de trabajar 8 horas seguidas en una rama:
→ Divide en tareas de 2-3 horas
→ Finish más frecuente
→ Menos conflictos
```

### Tip 2: Sincronizar Antes de Almorzar
```powershell
# Antes de irte a almorzar:
.\scripts\sync-now.ps1
# Traes cambios del compañero mientras almorzan
```

### Tip 3: Comunicación Clara
```
✅ "dash" (todos entienden)
✅ "filtros" (claro)
❌ "cambios varios" (confuso)
```

---

## 📞 Soporte y Ayuda

### Si algo sale mal:

1. **Leer el mensaje del script** (siempre dice qué pasó)
2. **Pedirle ayuda a Antigravity:**
   ```
   "Antigravity, el script quick-finish.ps1 me dio este error:
   [pegar el error]
   ¿Qué hago?"
   ```
3. **Última instancia:** Emergency reset
   ```powershell
   .\scripts\emergency-reset.ps1
   ```

---

## ✅ Checklist de Implementación

Antes de empezar a usar este nuevo sistema:

- [ ] Leer esta guía completa
- [ ] Discutirla con el colega
- [ ] Acordar señal de comunicación (Slack/WhatsApp/Discord)
- [ ] Probar `quick-start.ps1` con una tarea pequeña
- [ ] Probar `quick-finish.ps1` con esa tarea
- [ ] Probar trabajo paralelo con tareas separadas
- [ ] Probar resolución de conflictos (opcional)

Una vez completado, estarán listos para trabajar en paralelo sin problemas.

---

**Versión:** 3.0  
**Autores:** Equipo Moovy  
**Última revisión:** 2026-02-13
