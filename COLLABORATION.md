# 🚀 Guía Definitiva de Colaboración: Feature Branches Workflow

Bienvenido al manual de trabajo en equipo para el proyecto **Moovy**. Este documento detalla paso a paso cómo debemos interactuar con el código, las ramas y GitHub para asegurar un desarrollo profesional, ordenado y sin errores.

---

## 📌 1. El Ecosistema de Ramas

Utilizamos una adaptación pragmática de *GitFlow*. Cada rama tiene un propósito sagrado y reglas de acceso estrictas.

### Diagrama del Flujo de Trabajo

```mermaid
gitGraph
    commit id: "Inicial"
    branch develop
    checkout develop
    commit id: "Setup Base"
    branch "feature/login"
    checkout "feature/login"
    commit id: "Formulario"
    commit id: "API Login"
    checkout develop
    merge "feature/login" tag: "v1.1-testing"
    branch "feature/productos"
    checkout "feature/productos"
    commit id: "Listado"
    checkout develop
    merge "feature/productos"
    checkout main
    merge develop tag: "PRODUCCION-v1.1"
```

### Descripción de Ramas
*   **`main` (La Rama Sagrada)**: Contiene únicamente el código que está **en producción**. Nadie sube cambios aquí directamente. Solo se actualiza mediante Merges desde `develop`.
*   **`develop` (La Rama de Integración)**: Es el "campo de batalla" principal. Aquí se consolidan todas las funcionalidades terminadas antes de pasar a producción.
*   **`feature/*` (Ramas de Tarea)**: Ramas efímeras creadas para una tarea específica. Se borran una vez que el código llega a `develop`.

---

## 🛠 2. Ciclo de Vida de una Tarea (Paso a Paso)

Imaginemos que vas a agregar un "Carrito de Compras". Sigue estos pasos exactos:

### Paso 1: Sincronización Inicial
Antes de empezar, asegúrate de que tu `develop` local tiene lo último de la nube.
```bash
git checkout develop
git pull origin develop
```

### Paso 2: Crear la Rama de Feature
Crea una rama con un nombre descriptivo en minúsculas y separado por guiones.
```bash
git checkout -b feature/carrito-de-compras
```

### Paso 3: Desarrollo y Commits
Trabaja en tu código. Haz commits pequeños y atómicos (que hagan una sola cosa bien). **No esperes a terminar todo para hacer un commit.**

#### Convención de Mensajes (Conventional Commits)
Usamos prefijos para identificar qué tipo de cambio es:
*   `feat:` Una nueva funcionalidad.
*   `fix:` Una corrección de bug.
*   `docs:` Cambio en documentación.
*   `style:` Formateo, falta punto y coma, etc. (no cambia lógica).
*   `refactor:` Refactorización que no añade funcionalidad ni arregla bugs.
*   `chore:` Actualizar paquetes, configuración de build, etc.

**Ejemplo:** `git commit -m "feat: implementar lógica de persistencia en localStorage para el carrito"`

### Paso 4: Subir a la Nube (Push)
Mantén tu rama actualizada en GitHub para que otros vean tu progreso (y por seguridad).
```bash
git push origin feature/carrito-de-compras
```

### Paso 5: Creación del Pull Request (PR)
Cuando la funcionalidad esté lista y probada:
1.  Ve a GitHub.
2.  Aparecerá un botón amarillo: **"Compare & pull request"**. Haz click.
3.  **Base:** `develop` ← **Compare:** `feature/carrito-de-compras`.
4.  **Título:** Sé claro.
5.  **Descripción:** Explica *qué* hiciste y *cómo* probarlo. Adjunta capturas si hay cambios visuales.

### Paso 6: Revisión y Merge
*   Tu colaborador revisará el código.
*   Si hay comentarios, corrígelos en la misma rama y haz push (el PR se actualiza solo).
*   Una vez aprobado, haz click en **"Squash and merge"** (esto limpia el historial).

### Paso 7: Limpieza
Borra la rama local y remota una vez mergeada.
```bash
git checkout develop
git pull origin develop
git branch -d feature/carrito-de-compras
```

---

## ⚠️ 3. Gestión de Conflictos

Los conflictos ocurren cuando dos personas tocan la misma línea de código. **No entres en pánico.**

1.  Si GitHub te avisa de conflictos, trae `develop` a tu rama:
    ```bash
    git checkout feature/tu-rama
    git merge develop
    ```
2.  VS Code te mostrará qué líneas chocan. Elige la opción correcta (o combina ambas).
3.  Guarda los archivos, haz `git add .` y termina el merge con `git commit`.

---

## 📋 4. Checklist para Pull Requests

Antes de pedir revisión, verifica:
- [ ] ¿El código funciona localmente?
- [ ] ¿Seguí las convenciones de nombres?
- [ ] ¿Eliminé los `console.log` de prueba?
- [ ] ¿El código es legible y está comentado donde es difícil de entender?
- [ ] ¿Mi rama está actualizada con `develop`?

---

## 🛡️ 5. Reglas de Convivencia

1.  **Atomicidad**: Un commit = Un cambio. No mezcles "Arreglo login y también cambio color de footer".
2.  **Comunicación**: Avisa en el grupo antes de empezar una rama si crees que vas a tocar archivos muy sensibles (como `schema.prisma` o `auth.ts`).
3.  **Prohibido**: Nunca hagas `git push --force` a menos que sepas EXACTAMENTE por qué lo haces.
4.  **Feedback Constructivo**: Las revisiones de PR son para mejorar el código, no para juzgar al programador.

---

## 🤖 6. Colaboración en Paralelo con Antigravity

Si tanto vos como tu colaborador están usando **Antigravity** simultáneamente, deben verse a sí mismos como dos "parejas de programadores" independientes.

### ¿Cómo evitar que los AI Agents se confundan?

1.  **Aislamiento por Rama**: Cada instancia de Antigravity debe trabajar en una **rama de feature diferente**. Nunca tengan a dos AI trabajando sobre la misma rama al mismo tiempo, ya que podrían intentar editar los mismos archivos y generar conflictos de guardado local.
2.  **Sincronización de Contexto**: Antigravity solo ve lo que está en tu disco local *en ese momento*.
    *   Si tu compañero termina una feature y la sube a `develop`, **debés hacer `git pull origin develop`** en tu máquina.
    *   Inmediatamente después, Antigravity "leerá" el nuevo código y tendrá el contexto actualizado para seguir ayudándote.
3.  **División de Tareas**: Lo ideal es repartir el trabajo por capas o módulos.
    *   *Ejemplo*: Antigravity A trabaja en `src/app/(store)` (Cliente).
    *   *Ejemplo*: Antigravity B trabaja en `src/app/ops` (Administración).
4.  **Uso de task.md**: Mantengan el archivo `task.md` (dentro de `.gemini/brain/...`) actualizado en cada rama. Aunque no se comparten automáticamente entre computadoras diferentes, ayudan a que cada Antigravity sepa qué falta por hacer en su respectiva tarea.

### Flujo Proyectado
*   **Persona A + Antigravity**: Trabajan en `feature/nueva-vista`. Commits, Push y PR.
*   **Persona B + Antigravity**: Hacen `git pull`, integran cambios de A si es necesario, y siguen en `feature/arreglo-api`.

### 7. Sincronización de Base de Datos (Seed)

Si tu colaborador necesita tener las mismas categorías y configuraciones que vos:

1.  Asegurarse de que el archivo `prisma/seed.ts` esté actualizado (haciendo `git pull`).
2.  Ejecutar en la terminal:
    ```bash
    npx prisma db seed
    ```
Esto llenará su base de datos local con los rubros, comercios de prueba y configuración general de la tienda automáticamente.

### 8. Clonación Exacta de Base de Datos (Dump)

Si querés que tu colaborador tenga **EXACTAMENTE** los mismos productos, fotos y datos reales que vos (no solo los de prueba), deben hacer un "Dump".

#### Pasos para el Dueño (Enviar):
1. Abrí la terminal y ejecutá este comando para sacar una copia de tu Docker:
   ```powershell
   docker exec -t moovy-db-1 pg_dumpall -c -U postgres > moovy_full_backup.sql
   ```
2. Pasale el archivo `moovy_full_backup.sql` a tu colaborador (por fuera de Git).

#### Pasos para el Colaborador (Recibir):
1. Poné el archivo en la carpeta del proyecto.
2. Ejecutá este comando para "inyectar" los datos en tu Docker:
   ```powershell
   cat moovy_full_backup.sql | docker exec -i moovy-db-1 psql -U postgres
   ```

> [!IMPORTANT]
> El comando `npx prisma db seed` es solo para **datos de prueba (demos)**. Para **datos reales de trabajo**, usen siempre el método de **Dump**.

---

*Moovy - Guía de Ingeniería v1.3*
