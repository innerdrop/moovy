# Guia de Colaboracion Moovy 2.0 (Pro)

Esta guia detalla el flujo exacto de trabajo para evitar conflictos de codigo y base de datos entre el equipo.

---

## 🚀 El Ciclo de Vida del Desarrollo

El orden correcto de operacion es: 
**Rama Feature** ➔ **Rama Develop** ➔ **Rama Main (Produccion)**

### 1. Inicio de Jornada / Tarea
Antes de tocar una sola linea de codigo, siempre sincronizate:
```powershell
.\scripts\sync.ps1
```
*   **¿Que hace?** Baja los cambios del equipo (codigo y base de datos) a tu computadora.
*   **¿Donde?** En cualquier rama que estes (feature o develop).

### 2. Iniciar nueva Feature (Mauro o Socio)
Si vas a empezar algo nuevo (ej: Configurar Slides):
```powershell
.\scripts\start.ps1
```
*   **¿Que hace?** Te pregunta el nombre de la tarea y crea una rama aislada (ej: `feature/ajuste-slides`).
*   **IMPORTANTE:** Nunca trabajes directamente en `develop` ni en `main`.

### 3. Durante el dia (Guardar Progreso)
Si queres guardar lo que hiciste sin terminar la tarea todavia:
```powershell
.\scripts\publish.ps1 -Message "avance en diseño de slides"
```
*   **¿Que hace?** Hace commit, exporta tu base de datos actual (para no perder datos) y sube tu rama a GitHub para que tu compañero pueda verla si necesita.
*   **¿Donde?** En tu rama `feature/*`.

### 4. Finalizar Tarea (Merge a Develop)
Cuando la funcionalidad ya esta lista y testeada localmente:
```powershell
.\scripts\finish.ps1 -Message "Se completo la configuracion de slides"
```
*   **¿Que hace?** 
    1. Guarda tu trabajo final y exporta la base de datos.
    2. Se pasa solo a `develop`.
    3. **Mergea** tus cambios en `develop`.
    4. Sube `develop` a GitHub para que toda la oficina/equipo tenga tus cambios.
    5. Te ofrece borrar la rama feature para mantener limpio el proyecto.

### 5. Lanzamiento a Produccion (Deploy)
Solo cuando `develop` tiene varias tareas terminadas y queremos que el cliente las vea en la web real:
```powershell
.\scripts\devmain.ps1
```
*   **¿Que hace?** 
    1. Mergea TODO de `develop` hacia `main`.
    2. Sube a GitHub.
    3. **Se conecta al VPS (Hostinger)**.
    4. Actualiza el codigo en la web.
    5. Actualiza la base de datos del servidor con los nuevos datos locales.
    6. Reinicia la app.

### 6. Extra: Datos de Produccion a Local
Si necesitas ver exactamente lo mismo que el cliente para investigar un error:
```powershell
.\scripts\pull-db.ps1
```
*   **¿Que hace?** Se conecta al VPS, genera un backup real y lo descarga a tu PC.
*   **Luego:** Corre `.\scripts\sync.ps1` para cargar esa data en tu entorno local.

---

## �️ Seguridad y Mantenimiento

### Auditoria de Vulnerabilidades
Es buena practica revisar la seguridad del proyecto al menos una vez por semana:
```powershell
npm audit
```
*   **¿Que hace?** Escanea las librerias y te avisa si hay parches de seguridad pendientes.
*   **Correccion:** Si hay fallos, consultame antes de usar `npm audit fix --force` para evitar roturas.

---

## �📋 Resumen de Comandos

| Comando | Frecuencia | Para que sirve | Rama (Donde ejecutar) |
| :--- | :--- | :--- | :--- |
| `.\scripts\sync.ps1` | **Muchas veces** | Estar al dia con el equipo y no tener conflictos. | **Cualquiera** (Estando en tu rama) |
| `.\scripts\start.ps1` | **Cada tarea nueva** | Crear un espacio de trabajo seguro (rama). | **develop** |
| `.\scripts\publish.ps1` | **Cada tanto** | Backup de tu trabajo y tu base de datos local. | **feature/*** (Tu rama de tarea) |
| `.\scripts\finish.ps1` | **Al terminar una tarea** | Impactar tus cambios en la rama del equipo (`develop`). | **feature/*** (Tu rama de tarea) |
| `.\scripts\devmain.ps1` | **Al final del hitos/semana** | Subir todo a la web real (Produccion). | **develop** (O cualquiera) |
| `.\scripts\pull-db.ps1` | **Cuando necesites data real** | Traer el backup de la web real a tu computadora local. | **Cualquiera** |
| `.\scripts\reset-db.ps1` | **Emergencias** | Si se rompe la base de datos, empieza de cero con el seed. | **Cualquiera** |
| `npm audit` | **Semanalmente** | Revisar si hay fallos de seguridad en las librerias. | **Cualquiera** |

---

## 🌐 Variables de Entorno en VPS (Producción)

Cuando se agrega una nueva variable de entorno al `.env` local, **también hay que agregarla en el VPS**. Si no, la app en producción no la reconoce.

```bash
# 1. Conectarte al VPS
ssh root@<IP_DEL_VPS>

# 2. Ir al proyecto
cd /var/www/moovy

# 3. Editar el .env
nano .env

# 4. Agregar la variable nueva (ejemplo):
#    NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID="cxxxxxxxxx8ca1" 

# 5. Guardar: Ctrl+O → Enter → Ctrl+X

# 6. Reiniciar la app
pm2 restart moovy
```

> **⚠️ Las variables que empiezan con `NEXT_PUBLIC_` se "bakeean" en el build.** Después de agregarlas, el script `devmain.ps1` ya se encarga de rebuildar, pero si editás el `.env` directo en el VPS, necesitás hacer `npm run build && pm2 restart moovy`.

---

## ⚠️ Reglas de Oro

1.  **DB PUSH:** Nunca uses `npx prisma db push --force-reset` si tenes datos cargados que queres mantener. Usa los scripts siempre.
2.  **COMMIT MESSAGES:** Escribi mensajes claros. Malo: `"cambios"`. Bueno: `"feat: agregado upload de imagen en slide publicitario"`.
3.  **SYNC ANTES DE FINISH:** Si estuviste muchas horas trabajando, corre un `sync.ps1` antes de correr el `finish.ps1` para resolver conflictos en tu rama primero.
4.  **CONFLICTOS:** Si al ejecutar un script te dice `CONFLICT`, detenete. Es mejor resolverlo con ayuda del editor (VS Code) que forzar el push.

