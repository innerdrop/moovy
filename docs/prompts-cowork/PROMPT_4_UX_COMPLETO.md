# Prompt 4 — Auditoría UX: ¿tiene el usuario todo lo que necesita?

> **Uso**: Una sola vez, en paralelo al Prompt 3 o justo después.
> **Salida esperada**: Sección UX agregada al ISSUES.md (o archivo UX_AUDIT.md separado).

---

## Antes de empezar — Navegá somosmoovy.com

Recorrés el sitio en producción como si fueras un usuario de Ushuaia que lo usa por primera vez. Sin manual, sin conocer el código. Todo lo que te genere duda, confusión, o falta de información es un issue.

---

## Protocolo para cada pantalla

Por cada pantalla importante, respondés estas 7 preguntas. Si la respuesta a cualquiera es "no" o "parcialmente", es un issue.

1. ¿Sabe el usuario dónde está? (título claro, contexto visible)
2. ¿Sabe qué puede hacer desde acá? (acciones disponibles son obvias)
3. ¿Tiene toda la información para decidir? (precios completos, tiempos, condiciones)
4. ¿Sabe qué pasó después de actuar? (confirmación clara, feedback inmediato)
5. ¿Sabe qué hacer si algo falla? (mensajes de error útiles, no solo "error")
6. ¿Qué ve si no hay datos? (estado vacío útil, no una pantalla en blanco)
7. ¿Funciona en mobile sin frustraciones? (botones accesibles, sin zoom, sin overflow)

---

## Pantallas a auditar

### COMPRADOR
- Home / listado de comercios
- Búsqueda y filtros
- Página de comercio (menú del local)
- Página de producto (detalle)
- Carrito
- Checkout — selección de dirección
- Checkout — selección de método de pago
- Checkout — resumen final antes de confirmar
- Pantalla post-pago (procesando / confirmado)
- Seguimiento del pedido en tiempo real (versión horizontal Y vertical — ambas)
- Pantalla de pedido entregado / calificación
- Historial de pedidos
- Detalle de pedido pasado
- Perfil del usuario
- Registro / login
- Recuperar contraseña

### MARKETPLACE
- Listado de productos en venta
- Detalle de producto (precio fijo)
- Detalle de producto en subasta — vista del ofertante
- **Seguimiento de subastas activas del ofertante** (¿existe esta sección?)
- **Pantalla post-subasta para el ganador** (¿puede pagar? ¿hay camino claro al checkout?)
- **Notificación de subasta ganada** (¿llega? ¿dice qué hacer?)
- Vista del vendedor — sus subastas activas y finalizadas

### COMERCIO
- Dashboard principal
- Lista de pedidos activos
- Detalle de pedido entrante (aceptar/rechazar)
- Gestión del pedido en preparación
- Momento de entrega al repartidor — **¿ve el PIN de retiro claramente? ¿sabe que debe dárselo al repartidor?**
- Catálogo de productos
- Crear / editar producto
- Gestión de disponibilidad (abrir/cerrar local)
- Historial de ventas y cobros
- Configuración del local
- Onboarding (primer ingreso, sin nada cargado)

### REPARTIDOR
- Pantalla de conexión / disponibilidad
- Pedido entrante — **¿ve el fee exacto antes de aceptar?**
- Navegación al comercio
- Retiro del pedido — **¿el flujo de ingresar el PIN de retiro es claro?**
- Navegación al cliente
- Entrega — **¿el flujo de solicitar el PIN al comprador es claro? ¿el botón "entregado" está bloqueado sin PIN?**
- Flujo "no pude entregar" — **¿es claro? ¿la foto es obligatoria? ¿el comprador recibe aviso correcto?**
- Historial de entregas y ganancias
- Onboarding (primer ingreso)

### ADMIN
- Dashboard general
- Lista de pedidos activos en la ciudad
- Mapa de repartidores activos
- Aprobación de usuarios (comercios, repartidores)
- Gestión de zonas (activar/desactivar Zona C por clima)
- Métricas / reportes
- Alertas: ¿hay notificaciones automáticas cuando algo falla con dinero?

---

## Checklist adicional — lo que siempre se olvida

- [ ] ¿El precio mostrado siempre incluye el costo de envío, o se suma sorpresa al final?
- [ ] ¿Se muestra el tiempo estimado de entrega antes de confirmar?
- [ ] ¿Hay indicación de si el comercio está abierto ANTES de entrar al menú?
- [ ] ¿El comprador recibe una notificación cuando el repartidor está a X minutos? (para estar en casa)
- [ ] ¿El comprador recibe el PIN de entrega en el momento correcto y con texto claro que explica para qué es?
- [ ] ¿El comercio ve el PIN de retiro claramente al momento de entregarle el pedido al repartidor?
- [ ] ¿Los errores de validación señalan exactamente qué campo tiene el problema?
- [ ] ¿Hay confirmación antes de cancelar un pedido?
- [ ] ¿El usuario puede ver el número de pedido para comunicarse con soporte?
- [ ] ¿Hay mensaje claro de "zona sin cobertura" para Costa Susana y zonas desactivadas por clima?
- [ ] ¿El repartidor ve el fee exacto antes de aceptar el pedido?
- [ ] ¿Hay feedback visual mientras el pago se procesa? (para no tocar nada)
- [ ] ¿Los estados del pedido tienen nombres que el usuario entiende? (no "PENDING_DISPATCH")
- [ ] ¿Se puede volver atrás desde cualquier pantalla sin perder datos del formulario?
- [ ] ¿Las notificaciones tienen el resumen del pedido incluido para actuar sin abrir la app?
- [ ] ¿Hay algún flujo que lleva a una pantalla sin camino claro para continuar? (especialmente subastas)
- [ ] ¿El usuario puede navegar entre todas las secciones de la plataforma desde cualquier punto?

---

## Entregable

Agregá al ISSUES.md con esta estructura para cada pantalla problemática:

```markdown
### UX-001 — [Pantalla]: [problema específico]
**Actor**: comprador / comercio / repartidor / admin
**Pregunta fallida**: [cuál de las 7 preguntas falla]
**Qué ve hoy**: [descripción de lo que ocurre]
**Qué debería ver**: [descripción de lo correcto]
**Severidad**: crítico / importante / menor
**Esfuerzo**: S / M / L
```

Al final respondé:
- ¿Cuál es la pantalla con más problemas?
- ¿Hay algún flujo completo que esté roto, no solo una pantalla?
- ¿Cuál es el issue de UX que más daño haría al lanzamiento si queda sin resolver?
