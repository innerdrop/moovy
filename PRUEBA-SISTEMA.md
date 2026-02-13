# 🧪 Prueba del Sistema de Trabajo Paralelo

**Objetivo:** Probar que ambos pueden trabajar al mismo tiempo sin conflictos.

---

## ✅ Pre-requisitos

**Ambos desarrolladores deben:**
1. Estar en la rama `develop`
2. Tener los últimos cambios sincronizados

```powershell
# Ejecutar ambos:
git checkout develop
git pull origin develop
```

**Verificar que tienen los scripts nuevos:**
```powershell
ls scripts/quick-*.ps1
```

Deberían ver:
- `start.ps1`
- `finish.ps1`

---

## 🎭 Prueba 1: Trabajo en Paralelo (Sin Conflictos)

Esta prueba simula el caso ideal: ambos trabajan en archivos diferentes.

### 👤 Developer A

**Paso 1: Empezar trabajo**
```powershell
.\scripts\start.ps1 -Feature "prueba-dev-a"
```

**✅ Deberías ver:**
```
🚀 QUICK START - Iniciando trabajo
====================================
[1/4] Cambiando a develop y sincronizando...
[2/4] Creando rama: feature/prueba-dev-a
[3/4] Verificando últimos cambios...
[4/4] Listo!

✅ Estás en la rama: feature/prueba-dev-a
✅ Puedes empezar a trabajar con Antigravity
```

**Paso 2: Crear un archivo de prueba**
```powershell
# Crear archivo con tu nombre
echo "Developer A estuvo aquí - Test 1" > test-dev-a.txt

# Verificar
cat test-dev-a.txt
```

**Paso 3: Terminar trabajo**
```powershell
.\scripts\finish.ps1 -Message "prueba dev A - trabajo en paralelo"
```

**✅ Deberías ver:**
```
🏁 QUICK FINISH - Finalizando trabajo
======================================
[1/6] Guardando cambios...
[2/6] Actualizando develop...
[3/6] Mergeando feature/prueba-dev-a a develop...
[4/6] Subiendo a GitHub...
[5/6] Eliminando rama feature/prueba-dev-a...
[6/6] Limpieza completa

✅ FINALIZADO EXITOSAMENTE
✅ Cambios mergeados a develop
✅ Subido a GitHub
✅ Rama feature/prueba-dev-a eliminada
✅ Ahora estás en develop
```

**Paso 4: Avisar al compañero**
```
Dev A: "Listo ✅"
```

---

### 👤 Developer B (trabaja al mismo tiempo)

**Paso 1: Empezar trabajo** (mientras Dev A trabaja)
```powershell
.\scripts\start.ps1 -Feature "prueba-dev-b"
```

**Paso 2: Crear OTRO archivo**
```powershell
# Archivo diferente al de Dev A
echo "Developer B estuvo aquí - Test 1" > test-dev-b.txt

# Verificar
cat test-dev-b.txt
```

**Paso 3: Esperar a que Dev A termine**
```
[Chat]
Dev A: "Listo ✅"
Dev B: "OK, ahora termino yo"
```

**Paso 4: Terminar trabajo**
```powershell
.\scripts\finish.ps1 -Message "prueba dev B - trabajo en paralelo"
```

**✅ Deberías ver:**
```
[2/6] Actualizando develop...
📥 (Se traen los cambios de Dev A automáticamente)
[3/6] Mergeando feature/prueba-dev-b a develop...
✅ Auto-merge exitoso
...
✅ FINALIZADO EXITOSAMENTE
```

---

### ✅ Verificación de Prueba 1

**Ambos ejecutan:**
```powershell
# Ver que ambos archivos están en develop
ls test-dev-*.txt
```

**Deberían ver:**
```
test-dev-a.txt
test-dev-b.txt
```

**🎉 ¡ÉXITO!** Ambos trabajaron en paralelo sin conflictos.

---

## 🎭 Prueba 2: Trabajo con Sincronización

Esta prueba simula que Dev B quiere traer cambios de Dev A MIENTRAS trabaja.

### 👤 Developer A

**Paso 1: Empezar nueva tarea**
```powershell
.\scripts\start.ps1 -Feature "funcion-importante"
```

**Paso 2: Crear un archivo importante**
```powershell
echo "Función crítica que Dev B necesita" > funcion-critica.txt
```

**Paso 3: Terminar rápido**
```powershell
.\scripts\finish.ps1 -Message "función crítica lista"
```

**Paso 4: Avisar**
```
Dev A: "Subí función-critica.txt, necesitás eso para tu trabajo ✅"
```

---

### 👤 Developer B

**Paso 1: Ya está trabajando en algo**
```powershell
# Supongamos que ya empezaste hace un rato
.\scripts\start.ps1 -Feature "dashboard"

# Y creaste algo
echo "Dashboard en progreso..." > dashboard.txt
```

**Paso 2: Dev A te avisa que subió algo importante**
```
[Chat]
Dev A: "Subí función-critica.txt, necesitás eso ✅"
Dev B: "OK, lo bajo"
```

**Paso 3: Sincronizar SIN terminar tu trabajo**
```powershell
.\scripts\sync-now.ps1
```

**✅ Deberías ver:**
```
🔄 SYNC NOW - Sincronización en caliente
=========================================
[1/4] Guardando tu trabajo actual...
[2/4] Descargando últimos cambios de develop...
[3/4] Volviendo a tu rama...
[4/4] Mergeando cambios en tu rama...

✅ SINCRONIZACIÓN COMPLETA
✅ Cambios de develop integrados en tu rama
✅ Estás en: feature/dashboard
```

**Paso 4: Verificar que tenés el archivo de Dev A**
```powershell
# Deberías tener AMBOS archivos:
ls *.txt
```

**Deberías ver:**
```
dashboard.txt          (tuyo)
funcion-critica.txt    (de Dev A)
```

**Paso 5: Terminar tu trabajo**
```powershell
.\scripts\finish.ps1 -Message "dashboard completo"
```

**🎉 ¡ÉXITO!** Sincronizaste sin terminar tu trabajo.

---

## 🎭 Prueba 3: Conflicto Simulado (Resolución con Antigravity)

Esta prueba simula que ambos modifican el MISMO archivo.

### 👤 Developer A

**Paso 1: Crear archivo compartido**
```powershell
.\scripts\start.ps1 -Feature "config-shared"

# Crear archivo que ambos van a modificar
echo "version: 1.0" > config.txt
```

**Paso 2: Terminar**
```powershell
.\scripts\finish.ps1 -Message "config inicial"
```

---

### 👤 Developer B

**Paso 1: Empezar DESDE develop actualizado**
```powershell
# Primero sincronizar
git pull origin develop

# Ahora empezar
.\scripts\start.ps1 -Feature "config-mejorado"
```

**Paso 2: Modificar el MISMO archivo**
```powershell
# Agregar tu línea
echo "database: postgresql" >> config.txt

# Ver contenido
cat config.txt
```

**Deberías ver:**
```
version: 1.0
database: postgresql
```

---

### 👤 Developer A (causa el conflicto)

**Mientras Dev B trabaja:**

**Paso 1: Hacer otro cambio**
```powershell
.\scripts\start.ps1 -Feature "config-cache"

# Modificar la MISMA línea
# (Reemplazar todo el archivo)
echo "version: 2.0" > config.txt
echo "cache: redis" >> config.txt
```

**Paso 2: Terminar primero**
```powershell
.\scripts\finish.ps1 -Message "agregar config de cache"
```

---

### 👤 Developer B (detecta el conflicto)

**Paso 1: Intentar terminar**
```powershell
.\scripts\finish.ps1 -Message "agregar config de database"
```

**⚠️ Deberías ver:**
```
⚠️ CONFLICTO DETECTADO
======================================

📄 Archivos en conflicto:
   - config.txt

🤖 SOLUCIÓN AUTOMÁTICA CON ANTIGRAVITY:
======================================

Copia y pega esto a Antigravity:
---
Tengo un conflicto de merge en estos archivos:
- config.txt

Por favor resuelve el conflicto manteniendo ambos cambios si es posible.
Después ejecuta:
git add .
git commit -m 'fix: resolver conflicto de merge'
git push origin develop
---
```

**Paso 2: Copiar y pegar a Antigravity**

Abre el chat de Antigravity y pega:
```
Tengo un conflicto de merge en estos archivos:
- config.txt

Por favor resuelve el conflicto manteniendo ambos cambios si es posible.
Después ejecuta:
git add .
git commit -m 'fix: resolver conflicto de merge'
git push origin develop
```

**Paso 3: Antigravity resuelve el conflicto**

Antigravity va a:
1. Ver el archivo `config.txt`
2. Detectar las marcas de conflicto
3. Combinar ambos cambios inteligentemente
4. Ejecutar los comandos

**Paso 4: Limpiar manualmente**
```powershell
# Borrar la rama que quedó
git branch -d feature/config-mejorado
```

**🎉 ¡ÉXITO!** El conflicto se resolvió con ayuda de Antigravity.

---

## 📊 Resumen de Pruebas

| Prueba | Escenario | Resultado Esperado |
|--------|-----------|-------------------|
| **1. Paralelo** | Archivos diferentes | ✅ Auto-merge sin conflictos |
| **2. Sync** | Traer cambios mientras trabajas | ✅ Sincronización sin perder trabajo |
| **3. Conflicto** | Mismo archivo modificado | ⚠️ Detectado + Antigravity resuelve |

---

## 🧹 Limpieza Final

Después de las pruebas, limpiar archivos de test:

```powershell
# Ir a develop
git checkout develop

# Borrar archivos de prueba
rm test-dev-a.txt
rm test-dev-b.txt
rm funcion-critica.txt
rm dashboard.txt
rm config.txt

# Commitear limpieza
git add .
git commit -m "test: limpiar archivos de prueba"
git push origin develop
```

---

## ✅ Checklist de Validación

Después de hacer las 3 pruebas, marcar:

- [ ] ✅ Prueba 1: Trabajo paralelo sin conflictos
- [ ] ✅ Prueba 2: Sincronización mientras trabajas
- [ ] ✅ Prueba 3: Resolución de conflictos con Antigravity
- [ ] ✅ Ambos entienden cómo usar los 3 comandos
- [ ] ✅ Archivos de prueba limpiados
- [ ] 🚀 **Listos para trabajar en paralelo en el proyecto real**

---

**¿Dudas?** Pregúntenle a Antigravity específicamente sobre el script que tengan duda.


