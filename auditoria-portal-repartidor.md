# Auditoría UX — Portal Repartidor MOOVY

**Fecha:** 15 de marzo de 2026
**Auditor:** Análisis experto de UX para aplicaciones de delivery
**Alcance:** Portal completo del repartidor (`/repartidor/*`)

---

## 1. Resumen Ejecutivo

El portal del repartidor tiene una base sólida con un dashboard centrado en mapa, sistema de ofertas de pedidos en tiempo real y navegación GPS integrada. Sin embargo, presenta problemas serios de **navegación redundante**, **funcionalidades mock sin conectar a APIs reales**, y **fricciones innecesarias** para un usuario que opera con las manos ocupadas (manejando moto/bici, cargando paquetes).

**Veredicto general:** El portal necesita simplificación, consolidación de navegación y conexión real de datos antes de ser usable en producción.

---

## 2. Inventario de Pantallas

| Pantalla | Ruta | Estado | Datos |
|----------|------|--------|-------|
| Dashboard principal | `/repartidor/dashboard` | Funcional | API real |
| Pedidos (lista) | `/repartidor/pedidos` | Parcial | API real pero botones muertos |
| Ganancias (página) | `/repartidor/ganancias` | Mock | Datos hardcodeados |
| Historial (página) | `/repartidor/historial` | Mock | Datos hardcodeados |
| Perfil (página) | `/repartidor/perfil` | Funcional | API real |
| Soporte (página) | `/repartidor/soporte` | Funcional | API real + polling |
| Login | `/repartidor/login` | Funcional | Delegado a componente compartido |
| Registro | `/repartidor/registro` | Funcional | Wizard 4 pasos completo |
| EarningsView (SPA) | Vista interna dashboard | Mock | Datos hardcodeados |
| HistoryView (SPA) | Vista interna dashboard | Mock | Datos hardcodeados |
| ProfileView (SPA) | Vista interna dashboard | Funcional | API real |
| SettingsView (SPA) | Vista interna dashboard | Stub | Solo placeholder |
| SupportView (SPA) | Vista interna dashboard | Funcional | API real |

---

## 3. Problema #1: Triple Navegación Redundante (CRÍTICO)

Este es el problema más grave del portal. Existen **tres sistemas de navegación paralelos** que compiten entre sí:

### 3.1 Bottom Tab Bar (RiderBottomNav)
4 tabs fijos en la parte inferior: Inicio, Ganancias, Historial, Perfil.

### 3.2 Sidebar / Drawer (Sidebar.tsx)
Menú hamburguesa lateral con 6 opciones: Dashboard, Historial, Mis ganancias, Soporte, Mi Perfil, Configuración.

### 3.3 Quick Actions en el Dashboard
2 botones rápidos en la vista principal: Historial y Resumen (ganancias).

### Inconsistencias detectadas

| Concepto | Bottom Nav | Sidebar | Quick Actions |
|----------|-----------|---------|---------------|
| Ganancias | "Ganancias" | "Mis ganancias" | "Resumen" |
| Perfil | "Perfil" | "Mi Perfil" | No existe |
| Soporte | No existe | "Soporte" | No existe |
| Configuración | No existe | "Configuración" | No existe |
| Historial | "Historial" | "Historial" | "Historial" |

**Impacto:** El repartidor no sabe cuál es la navegación principal. Con las manos ocupadas, tener que decidir entre 3 formas de llegar al mismo lugar es inaceptable.

**Recomendación:** Eliminar el sidebar completamente. La bottom nav debe ser el único sistema de navegación. Reorganizar a 5 tabs: Inicio, Pedidos, Ganancias, Soporte, Perfil (con Configuración dentro de Perfil).

---

## 4. Problema #2: Páginas Duplicadas (CRÍTICO)

Existen **dos versiones** de las mismas pantallas:

| Funcionalidad | Página standalone | Vista SPA en dashboard |
|---------------|------------------|----------------------|
| Ganancias | `/repartidor/ganancias` | `EarningsView.tsx` |
| Historial | `/repartidor/historial` | `HistoryView.tsx` |
| Perfil | `/repartidor/perfil` | `ProfileView.tsx` |
| Soporte | `/repartidor/soporte` | `SupportView.tsx` |

Ambas versiones tienen datos mock y UI ligeramente diferentes. Esto genera:
- Doble mantenimiento de código.
- Comportamiento inconsistente (una puede tener datos reales y la otra mock).
- Confusión sobre cuál es la "correcta".

**Recomendación:** Elegir UN enfoque (SPA views dentro del dashboard o páginas separadas) y eliminar el otro. El enfoque SPA es mejor para repartidores porque evita recargas de página y mantiene el mapa/GPS activo en segundo plano.

---

## 5. Problema #3: Datos Mock en Producción (CRÍTICO)

Las siguientes pantallas muestran datos inventados, no conectados a ninguna API:

### Ganancias (EarningsView + /ganancias)
- Array hardcodeado de 7 días con valores fijos.
- El selector "Esta semana / Este mes" cambia visualmente pero muestra los mismos datos.
- Comparación con "semana anterior" usa `previousTotal = 38000` hardcodeado.

### Historial (HistoryView + /historial)
- Array hardcodeado de 6 entregas con fechas de enero 2026.
- Filtros "Todas/Completadas/Canceladas" funcionan localmente sobre datos falsos.
- Ratings son estáticos (4 o 5 estrellas siempre).

**Impacto:** Si un repartidor ve ganancias que no coinciden con la realidad, pierde confianza total en la app.

**Recomendación:** Conectar ambas vistas a APIs reales. El endpoint `/api/driver/orders?status=historial` ya existe y devuelve datos reales. Para ganancias, crear un endpoint `/api/driver/earnings` que agregue datos de `deliveryFee` por período.

---

## 6. Problema #4: Botones Muertos y Funcionalidad Fantasma

### Página de Pedidos (`/repartidor/pedidos`)
- Botón **"Ver Detalles"** en pedidos activos: no tiene `onClick` handler. No hace nada.
- Botón **"Actualizar"** en pedidos activos: no tiene `onClick` handler. No hace nada.
- Botón **"Ver Comprobante"** en historial: no tiene `onClick` handler. No hace nada.

### Sidebar
- **Historial**, **Mis ganancias**, **Soporte**, **Mi Perfil**, **Configuración**: todos tienen `href="#"` (enlaces muertos). Solo "Dashboard" tiene enlace real.

### Dashboard
- Botón **"Aceptar"** en ofertas: funcional, pero tras aceptar solo hace `fetchDashboard(true)` sin feedback visual claro de éxito. El toast solo aparece desde la página de Pedidos.

### SettingsView
- Página completamente vacía. Solo muestra "Próximamente: Ajustes de la aplicación".

**Impacto:** Botones que no hacen nada destruyen la confianza del usuario y generan frustración.

**Recomendación:** Eliminar todos los botones sin funcionalidad. Es mejor no mostrar un botón que mostrar uno roto. Si la funcionalidad está "próximamente", indicarlo con un badge, no con un botón clickeable.

---

## 7. Problema #5: Ergonomía para Manos Ocupadas

### Lo que está bien
- El mapa como elemento central es correcto (un repartidor vive en el mapa).
- Toggle online/offline grande y accesible.
- Bottom sheet arrastrable para ver navegación sin soltar el manubrio.
- Ofertas de pedidos con botones grandes ("Aceptar" / "Rechazar").
- GPS integrado con navegación turn-by-turn.

### Lo que está mal

**a) `window.confirm()` para aceptar pedidos**
En `/repartidor/pedidos`, aceptar un pedido lanza un `window.confirm("¿Aceptar este pedido?")`. Esto es un popup nativo del browser que:
- Requiere precisión para tocar "Aceptar" en el diálogo nativo (targets pequeños).
- Rompe la experiencia mobile (los diálogos nativos se ven diferentes en cada browser).
- Añade un paso innecesario (el repartidor ya tocó "Aceptar Pedido").

**b) Tabs de 3 opciones en Pedidos**
Los tabs "Disponibles / Activos / Historial" son demasiado granulares. Un repartidor en movimiento no necesita hacer arqueología de sus pedidos antiguos desde la misma pantalla donde acepta nuevos.

**c) Sidebar requiere gesto de hamburguesa + scroll + tap**
Tres pasos para llegar a cualquier opción del sidebar. Con una mano en el manubrio, esto es peligroso.

**d) Ocultar/mostrar ganancias con Eye icon**
El botón de ojo para ocultar ganancias (`showEarnings` toggle) es una funcionalidad de "privacidad" que nadie usa mientras reparte. Ocupa espacio y añade complejidad visual.

**e) No hay gestos de swipe**
Para cambiar entre pedidos activos o para avanzar el estado de un pedido, el repartidor debe tocar botones específicos. Un swipe (deslizar) sería mucho más rápido y seguro mientras se conduce.

---

## 8. Problema #6: Flujo de Estado del Pedido Incompleto

Desde el dashboard, el repartidor puede aceptar un pedido y ver la navegación GPS. Sin embargo, no hay un flujo claro para avanzar los estados del pedido:

| Estado | Acción del repartidor | UI actual |
|--------|----------------------|-----------|
| DRIVER_ASSIGNED | Ir al comercio | Solo muestra mapa |
| DRIVER_ARRIVED | Avisar que llegó al comercio | No hay botón |
| PICKED_UP | Confirmar que recogió el pedido | No hay botón visible |
| IN_DELIVERY | En camino al cliente | Automático |
| DELIVERED | Confirmar entrega | No hay botón visible |

El endpoint `/api/driver/orders/[id]/status` existe, pero no hay botones en la UI del dashboard que lo invoquen de forma clara. El repartidor no tiene forma de avanzar el flujo de entrega paso a paso.

**Recomendación:** Agregar un botón de acción principal grande en el bottom sheet que cambie según el estado: "Llegué al comercio" > "Pedido recogido" > "Entregado". Un solo botón, una sola acción, sin menús.

---

## 9. Problema #7: Polling Excesivo vs Socket.IO

El dashboard hace polling cada 5 segundos (`setInterval 5000ms`) para refrescar datos. Sin embargo, la app ya tiene Socket.IO configurado. El soporte hace polling cada 3 segundos para mensajes nuevos.

**Impacto:**
- Consume batería del celular del repartidor (que necesita durar todo el turno).
- Consume datos móviles innecesariamente.
- Latencia de hasta 5 segundos para ver un nuevo pedido (en delivery, cada segundo cuenta).

**Recomendación:** Migrar a Socket.IO para notificaciones de nuevos pedidos y cambios de estado. Dejar polling solo como fallback con intervalo de 30 segundos.

---

## 10. Lo Que Funciona Bien

No todo es negativo. Estos elementos están bien diseñados:

1. **Dashboard centrado en mapa:** Correcto para un repartidor. El mapa es lo primero que necesita ver.

2. **Sistema de ofertas con timer:** Las ofertas de pedido muestran ganancia estimada, distancia al comercio, distancia al cliente y tiempo estimado. Esto permite tomar decisiones rápidas.

3. **Pantalla de GPS sin señal:** Diseño cuidado con instrucciones paso a paso para habilitar GPS. Incluye botón de "Compartir ubicación" y "Refrescar".

4. **Bottom sheet arrastrable:** Permite ver instrucciones de navegación sin ocupar toda la pantalla. Tres estados (minimizado, medio, expandido) dan flexibilidad.

5. **Navegación turn-by-turn:** Integrada con iconos de maniobras (girar izquierda, derecha, U-turn, etc.), distancia al próximo giro y destino.

6. **Registro en 4 pasos:** Wizard bien estructurado con validación condicional (documentos diferentes para bici vs moto/auto), uploads de documentos y aceptación de términos.

7. **Soporte por chat:** Funcional con API real, mensajes en tiempo real (polling), badges de no leídos y formulario de nueva consulta.

8. **Push notifications:** Integradas con prompt al usuario y manejo de permisos.

---

## 11. Recomendaciones Priorizadas

### Prioridad 1 — Críticas (antes de producción)

| # | Acción | Esfuerzo | Impacto |
|---|--------|----------|---------|
| 1 | Eliminar sidebar, dejar solo bottom nav como navegación única | Medio | Alto |
| 2 | Eliminar páginas standalone duplicadas (usar solo SPA views) | Medio | Alto |
| 3 | Conectar Ganancias y Historial a APIs reales | Alto | Crítico |
| 4 | Agregar botón de avance de estado del pedido en el bottom sheet | Alto | Crítico |
| 5 | Eliminar `window.confirm()`, usar slide-to-confirm o modal propio | Bajo | Alto |
| 6 | Eliminar o deshabilitar todos los botones sin funcionalidad | Bajo | Alto |

### Prioridad 2 — Mejoras importantes

| # | Acción | Esfuerzo | Impacto |
|---|--------|----------|---------|
| 7 | Migrar polling a Socket.IO para pedidos nuevos | Medio | Alto |
| 8 | Agregar feedback háptico (vibración) al aceptar/rechazar pedido | Bajo | Medio |
| 9 | Simplificar tabs de Pedidos: solo "Nuevos" y "En curso" | Bajo | Medio |
| 10 | Eliminar toggle de ocultar ganancias (innecesario para el contexto) | Bajo | Bajo |

### Prioridad 3 — Experiencia premium

| # | Acción | Esfuerzo | Impacto |
|---|--------|----------|---------|
| 11 | Agregar swipe-to-advance para cambiar estado del pedido | Medio | Alto |
| 12 | Modo nocturno automático (repartidores nocturnos) | Medio | Medio |
| 13 | Indicador de batería baja con recomendación de ahorro | Bajo | Medio |
| 14 | Botón directo para llamar al cliente desde el pedido activo | Bajo | Alto |
| 15 | Resumen de turno al ponerse offline (ganaste X, hiciste Y entregas) | Medio | Medio |

---

## 12. Comparación con Apps de Referencia

| Feature | Rappi Driver | PedidosYa Rider | MOOVY actual |
|---------|-------------|-----------------|--------------|
| Navegación única | Bottom nav | Bottom nav | Triple (nav + sidebar + quick actions) |
| Avance de estado | Slide-to-confirm | Botón grande | No existe |
| Datos en vivo | Socket/Push | Socket/Push | Polling 5s |
| Modo offline | Caché local | Caché local | No existe |
| Resumen de turno | Al cerrar | Al cerrar | No existe |
| Llamar cliente | 1 tap | 1 tap | No accesible |
| Dark mode | Automático | Manual | No existe |

---

## 13. Conclusión

El portal tiene un buen cimiento técnico (mapa, GPS, navegación, sistema de ofertas). Los problemas principales son de **arquitectura de UX** (triple navegación, páginas duplicadas) y de **completitud** (datos mock, botones muertos, flujo de estado incompleto).

La recomendación principal es: **simplificar antes de agregar**. Consolidar la navegación, eliminar lo que no funciona, conectar datos reales y crear el flujo de avance de estado del pedido. Con esos cambios, el portal pasa de ser un prototipo a ser una herramienta usable para repartidores en producción.
