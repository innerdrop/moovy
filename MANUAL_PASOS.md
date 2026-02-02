# 📋 MANUAL DE PASOS (MP) - Workflow Moovy
Este documento es la guía rápida para el trabajo diario en equipo. Seguí estos pasos en orden para evitar conflictos y mantener el proyecto sano.

---

## 🌅 1. Sincronización Inicial (Todas las Mañanas)
*Antes de empezar a programar, traé lo que hicieron tus compañeros.*

1. **Asegurate de estar en develop:**
   ```powershell
   git checkout develop
   ```
2. **Bajá los cambios de GitHub:**
   ```powershell
   git pull origin develop
   ```
3. **Actualizá el motor de datos:**
   ```powershell
   npx prisma generate
   ```

---

## 🛠️ 2. Empezando una Tarea Nueva
*Nunca trabajes sobre `develop`. Creá una rama propia.*

1. **Creá tu rama de trabajo:**
   ```powershell
   git checkout -b feature/nombre-de-tu-tarea
   ```
   *Ejemplo: `git checkout -b feature/ajuste-footer`*

---

## 💾 3. Guardando tu Progreso
*Hacé esto varias veces al día para no perder nada.*

1. **Prepará los archivos modificados:**
   ```powershell
   git add .
   ```
2. **Guardá con un mensaje claro:**
   ```powershell
   git commit -m "feat: descripción corta de lo que hiciste"
   ```

---

## 🛫 4. Subiendo el Trabajo a la Nube
*Cuando querés que tu compañero vea tu progreso o la tarea está terminada.*

1. **Subí tu rama a GitHub:**
   ```powershell
   git push origin feature/nombre-de-tu-tarea
   ```
   *(Si es la primera vez, VS Code te mostrará un botón azul de "Publish Branch").*

---

## 🏁 5. Finalización y Entrega (Merge)
*Cuando la tarea está lista y querés pasarla al proyecto principal.*

1. **Volvé a la rama principal:**
   ```powershell
   git checkout develop
   ```
2. **Asegurate de tener lo último (por las dudas):**
   ```powershell
   git pull origin develop
   ```
3. **Uní tu rama a develop:**
   ```powershell
   git merge feature/nombre-de-tu-tarea
   ```
4. **Subí el resultado final a GitHub:**
   ```powershell
   git push origin develop
   ```
5. **(Opcional) Borrá tu rama vieja:**
   ```powershell
   git branch -d feature/nombre-de-tu-tarea
   ```

---

## 🗄️ 6. Sincronización de Base de Datos (SQL Dump)
*Si la base de datos de tu compañero es muy distinta a la tuya.*

* **Para ENVIAR (Dueño de los datos):**
  ```powershell
  docker exec -t moovy-db pg_dumpall -c -U postgres > moovy_full_backup.sql
  ```
* **Para RECIBIR (Colaborador):**
  ```powershell
  cat moovy_full_backup.sql | docker exec -i moovy-db psql -U postgres
  ```

---

> [!TIP]
> **REGLA DE ORO:** Si tenés dudas, ¡hacé un `git status`! Te va a decir en qué rama estás y si tenés archivos sin guardar.
