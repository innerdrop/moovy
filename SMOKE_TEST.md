# Smoke Test Completo — Moovy

**Objetivo:** Vivir la experiencia real de cada rol desde cero. Ningún atajo.

**Requisitos previos:**
- Docker Desktop corriendo (PostgreSQL + PostGIS)
- `npm run dev:full` ejecutándose (Next.js + Socket.IO)
- Seed ejecutado (`npx tsx prisma/seed.ts`) — crea datos base (categorías, config, delivery rates)
- Navegador de escritorio + celular (o segunda ventana) para testear en paralelo
- Google Maps API key configurada en `.env`

**Convención:** Usá navegadores distintos (o perfiles/incógnito) para cada rol para evitar conflictos de sesión.

---

## PARTE 0 — Páginas públicas (sin cuenta)

### 0.1 Home y navegación
- [ ] Abrir `localhost:3000`
- [ ] Verificar que carga: hero slider, categorías, comercios destacados
- [ ] Verificar que el buscador funciona (escribir algo y buscar)
- [ ] Verificar que las categorías filtran productos
- [ ] Navegar a `/tiendas` — debe mostrar la lista de comercios
- [ ] Navegar a `/marketplace` — debe mostrar listings del marketplace
- [ ] Verificar botón de WhatsApp flotante (esquina inferior)

### 0.2 Páginas institucionales
- [ ] `/nosotros` — Quiénes somos (carga correctamente, sin placeholders)
- [ ] `/comisiones` — Transparencia de comisiones (8% merchant, 12% seller, comparación vs PedidosYa)
- [ ] `/terminos` — Términos generales (14 cláusulas)
- [ ] `/privacidad` — Política de privacidad
- [ ] `/contacto` — Formulario de contacto
- [ ] `/cancelaciones` — Política de cancelaciones
- [ ] `/devoluciones` — Política de devoluciones
- [ ] `/cookies` — Política de cookies
- [ ] `/moover` — Info del programa de puntos MOOVER

### 0.3 Términos por rol
- [ ] `/terminos-comercio` — Términos para comercios
- [ ] `/terminos-repartidor` — Términos para repartidores
- [ ] `/terminos-vendedor` — Términos para vendedores
- [ ] `/terminos-moover` — Términos del programa de puntos

### 0.4 Navegación de tienda sin cuenta
- [ ] Entrar a "Burger Ushuaia" desde `/tiendas`
- [ ] Ver los productos (imágenes, precios, descripciones)
- [ ] Intentar agregar al carrito → debe pedir login o permitirlo
- [ ] Verificar página de un producto individual (`/productos/[slug]`)

### 0.5 Páginas de utilidad
- [ ] `/offline` — Página offline (desconectar internet y recargar)
- [ ] Navegar a una URL inexistente → debe mostrar 404 customizado

---

## PARTE 1 — Comprador (experiencia completa)

### 1.1 Registro de comprador nuevo
- [ ] Ir a `/registro`
- [ ] Completar formulario: nombre, email (test-buyer@test.com), contraseña (Test1234), teléfono
- [ ] Verificar validaciones: email inválido, contraseña < 8 chars, campos vacíos
- [ ] Enviar registro
- [ ] Verificar que redirige al home logueado
- [ ] Verificar que aparecen los 100 puntos de bienvenida (toast o indicador)

### 1.2 Perfil y configuración
- [ ] Ir a `/mi-perfil` — verificar que muestra el menú de opciones
- [ ] `/mi-perfil/datos` — verificar nombre, email, teléfono. Editar el teléfono y guardar
- [ ] `/mi-perfil/direcciones` — agregar dirección nueva:
  - Escribir dirección en Ushuaia (probar autocompletado Google Places)
  - Guardar como "Casa"
  - Verificar que aparece en la lista
  - Marcar como dirección por defecto
- [ ] `/mi-perfil/cambiar-password` — verificar que el formulario funciona (no cambiar realmente)
- [ ] `/mi-perfil/invitar` — verificar que se muestra el código de referido y opciones de compartir
- [ ] `/mi-perfil/favoritos` — debe estar vacío por ahora

### 1.3 Explorar tienda y favoritos
- [ ] Volver al home, entrar a "Burger Ushuaia"
- [ ] Marcar "Burger Ushuaia" como favorito (corazón)
- [ ] Marcar un producto como favorito
- [ ] Ir a `/mi-perfil/favoritos` — verificar que aparecen ambos
- [ ] Quitar un favorito y verificar que desaparece

### 1.4 Carrito multi-producto
- [ ] Agregar "Hamburguesa Clásica" x2
- [ ] Agregar "Papas Fritas" x1
- [ ] Agregar "Coca Cola 500ml" x1
- [ ] Ir a `/carrito`
- [ ] Verificar: items correctos, cantidades, subtotales por item
- [ ] Modificar cantidad (subir/bajar) y verificar que el total se actualiza
- [ ] Eliminar un item y verificar que desaparece
- [ ] Verificar que el badge del carrito refleja la cantidad correcta

### 1.5 Checkout con efectivo (Pedido #1)
- [ ] Ir al checkout desde el carrito
- [ ] Verificar que la dirección guardada aparece seleccionada
- [ ] Verificar cálculo de delivery fee (distancia × tarifa, no $0)
- [ ] Verificar total = subtotal + delivery fee
- [ ] Verificar que se pueden aplicar puntos MOOVER como descuento (si hay suficientes)
- [ ] Seleccionar **Efectivo** como método de pago
- [ ] Confirmar pedido
- [ ] Verificar redirect a página de confirmación o tracking
- [ ] Anotar número de pedido: ____
- [ ] Verificar que el carrito se vació

### 1.6 Seguimiento en tiempo real
- [ ] Verificar que `/mis-pedidos` muestra el pedido recién creado
- [ ] Entrar al detalle del pedido (`/mis-pedidos/[orderId]`)
- [ ] Verificar estado: "Pendiente"
- [ ] Verificar que se ve la info del comercio y los items
- [ ] **Dejar esta pestaña abierta** — los estados se actualizarán en tiempo real

### 1.7 Puntos MOOVER
- [ ] Ir a `/puntos`
- [ ] Verificar saldo de puntos (100 de registro)
- [ ] Verificar historial de transacciones

### 1.8 Ayuda
- [ ] Ir a `/ayuda`
- [ ] Verificar que carga el centro de ayuda / FAQ / soporte

---

## PARTE 2 — Comercio (experiencia completa)

### 2.1 Registro de comercio nuevo
- [ ] Ir a `/comercio/registro`
- [ ] Completar formulario completo:
  - Nombre del comercio, descripción, categoría
  - Email, teléfono, dirección física
  - Datos fiscales (CUIT — puede ser ficticio para test)
  - Documentación requerida (AFIP, habilitación — subir imágenes de prueba)
  - Aceptar términos legales
- [ ] Verificar validaciones de campos obligatorios
- [ ] Enviar registro
- [ ] Verificar que redirige a `/comercios/pendiente-aprobacion`
- [ ] Verificar que muestra mensaje claro de "esperando aprobación"

### 2.2 Aprobación desde OPS (saltar a OPS brevemente)
- [ ] Abrir otra pestaña: `/ops/login` → admin@somosmoovy.com / demo2026
- [ ] Ir a `/ops/comercios`
- [ ] Buscar el comercio recién registrado (estado: PENDIENTE)
- [ ] Abrir detalle → presionar "Aprobar"
- [ ] Volver al portal del comercio → recargar → debe dejar entrar al dashboard

### 2.3 Dashboard del comercio (usar comercio@somosmoovy.com para Burger Ushuaia)
- [ ] Login en `/comercios/login` con comercio@somosmoovy.com / demo2026
- [ ] Verificar dashboard: KPIs (pedidos hoy, ingresos, pendientes, rating)
- [ ] Verificar checklist de onboarding (si aparece)

### 2.4 Gestión de productos
- [ ] Ir a `/comercios/productos`
- [ ] Verificar que se listan los 5 productos de Burger Ushuaia
- [ ] Crear producto nuevo (`/comercios/productos/nuevo`):
  - Nombre, descripción, precio, stock
  - Subir imagen
  - Seleccionar categoría
  - Guardar
- [ ] Verificar que aparece en la lista
- [ ] Editar un producto existente (cambiar precio) y guardar
- [ ] Desactivar un producto y verificar que ya no aparece en la tienda pública

### 2.5 Configuración del comercio
- [ ] Ir a `/comercios/configuracion`
- [ ] Verificar/modificar: horarios de atención, radio de entrega, pedido mínimo
- [ ] Guardar cambios

### 2.6 Recibir y procesar pedido (del Flow 1.5)
- [ ] Ir a `/comercios/pedidos`
- [ ] Verificar que aparece el pedido del comprador
- [ ] Verificar notificación (sonido/vibración si tab en background)
- [ ] Abrir detalle: items, cantidades, total, dirección, notas del cliente
- [ ] Presionar **"Confirmar pedido"**
- [ ] Verificar que el estado cambia a "Preparando"
- [ ] **Volver a la pestaña del comprador** → verificar actualización en tiempo real del tracking
- [ ] Volver al comercio → presionar **"Listo para envío"**
- [ ] Verificar estado: "Listo"

### 2.7 Reseñas y pagos
- [ ] Ir a `/comercios/resenas` — verificar que carga (puede estar vacío)
- [ ] Ir a `/comercios/pagos` — verificar historial de pagos/cobros

### 2.8 Soporte
- [ ] Ir a `/comercios/soporte`
- [ ] Enviar un mensaje de prueba al soporte de MOOVY
- [ ] Verificar que aparece en la conversación

### 2.9 Paquetes B2B (opcional)
- [ ] Ir a `/comercios/adquirir-paquetes` — explorar catálogos disponibles
- [ ] Verificar que se ven los paquetes con precios

---

## PARTE 3 — Repartidor (experiencia completa)

### 3.1 Registro de repartidor nuevo
- [ ] Ir a `/repartidor/registro`
- [ ] Completar formulario:
  - Datos personales (nombre, email, teléfono)
  - Tipo de vehículo (moto/bici/auto)
  - Patente
  - Documentos (DNI, licencia, seguro, VTV — subir imágenes de prueba)
  - Aceptar términos legales
- [ ] Verificar validaciones
- [ ] Enviar registro
- [ ] Verificar que muestra mensaje de "esperando aprobación"

### 3.2 Aprobación desde OPS
- [ ] En la pestaña de OPS: ir a `/ops/repartidores`
- [ ] Buscar el repartidor recién registrado
- [ ] Aprobar

### 3.3 Login y dashboard (usar rider@somosmoovy.com)
- [ ] Login en `/repartidor/login` con rider@somosmoovy.com / demo2026
- [ ] Verificar que carga el dashboard
- [ ] Verificar estadísticas: pedidos hoy, ganancias, completados

### 3.4 Conectarse y esperar pedido
- [ ] Presionar botón para ponerse **"En línea"** (toggle online)
- [ ] Aceptar permisos de geolocalización
- [ ] Verificar indicador verde de "Conectado"
- [ ] El pedido del Flow 2.6 (marcado como "Listo") debería disparar el assignment engine
- [ ] Esperar la oferta de pedido (aparece como tarjeta con datos del comercio, distancia, ganancia estimada)
- [ ] Si no aparece en 30 segundos, revisar logs del server

### 3.5 Aceptar y gestionar entrega
- [ ] **Aceptar el pedido**
- [ ] Verificar que aparece el pedido activo con:
  - Mapa con ruta al comercio
  - Nombre y dirección del comercio
  - Dirección del cliente
  - Ganancia estimada
- [ ] **Swipe "Deslizá → Llegué"** → marca llegada al comercio
- [ ] Verificar toast "Llegaste al comercio"
- [ ] Verificar que el tracking del comprador se actualiza en tiempo real
- [ ] **Swipe "Deslizá → Recogí"** → marca recogida del pedido
- [ ] Verificar que la dirección de destino cambia al domicilio del cliente
- [ ] Verificar que el mapa muestra la nueva ruta
- [ ] **Swipe "Deslizá → Entregado"** → marca entrega completada
- [ ] Verificar toast "Entrega completada"
- [ ] Verificar que las ganancias del día se actualizaron

### 3.6 Chat con comprador (durante entrega)
- [ ] Durante un pedido activo, abrir el chat con el comprador
- [ ] Enviar un mensaje de prueba
- [ ] Verificar que las respuestas rápidas de delivery aparecen (12 opciones contextuales)
- [ ] Verificar en la pestaña del comprador que llega el mensaje

### 3.7 Post-entrega
- [ ] Verificar en la pestaña del comprador:
  - Tracking muestra "Entregado"
  - Aparece opción de calificar al repartidor y al comercio
- [ ] Calificar desde el comprador (estrellas + comentario)
- [ ] Volver al repartidor: verificar que el rating se actualizó

### 3.8 Historial y ganancias
- [ ] Ir a `/repartidor/ganancias` — verificar monto del día
- [ ] Ir a `/repartidor/historial` — verificar que aparece la entrega completada

### 3.9 Perfil y soporte
- [ ] Ir a `/repartidor/perfil` — verificar datos, vehículo, documentos, estadísticas
- [ ] Ir a `/repartidor/soporte` — enviar un mensaje de prueba

### 3.10 Desconectarse
- [ ] Ponerse "Fuera de línea"
- [ ] Verificar que el indicador cambia a offline

---

## PARTE 4 — Vendedor marketplace (experiencia completa)

### 4.1 Registro de vendedor
- [ ] Ir a `/vendedor/registro`
- [ ] Completar formulario (datos personales, info de negocio, términos legales)
- [ ] Enviar registro

### 4.2 Dashboard y listings
- [ ] Login en `/vendedor` (o usar credenciales si hay vendedor seed)
- [ ] Verificar dashboard: KPIs de ventas
- [ ] Ir a `/vendedor/listings` — ver listings existentes
- [ ] Crear listing nuevo (`/vendedor/listings/nuevo`):
  - Nombre, descripción, precio, condición (nuevo/usado)
  - Peso, dimensiones, stock
  - Subir imágenes
  - Guardar
- [ ] Verificar que aparece en el marketplace público (`/marketplace`)
- [ ] Editar un listing y verificar cambios

### 4.3 Configuración del vendedor
- [ ] Ir a `/vendedor/configuracion`
- [ ] Configurar horarios de despacho, método de pago
- [ ] Guardar

### 4.4 Reseñas y ganancias
- [ ] `/vendedor/resenas` — verificar que carga
- [ ] `/vendedor/ganancias` — verificar comisiones (12%)

### 4.5 Soporte
- [ ] `/vendedor/soporte` — enviar mensaje de prueba

---

## PARTE 5 — Admin/OPS (experiencia completa)

### 5.1 Login
- [ ] Ir a `/ops/login`
- [ ] Login con admin@somosmoovy.com / demo2026

### 5.2 Dashboard principal
- [ ] `/ops/dashboard` — verificar KPIs: pedidos, ingresos, usuarios
- [ ] `/ops/live` — verificar feed en tiempo real (eventos de pedidos)

### 5.3 Gestión de pedidos
- [ ] `/ops/pedidos` — lista completa, filtros por estado, búsqueda
- [ ] Abrir un pedido entregado → verificar detalle completo (items, pagos, driver, merchant, tiempos)
- [ ] Probar guardar notas internas en un pedido
- [ ] Probar reasignar repartidor a un pedido activo
- [ ] **Probar cancelación con contraseña:**
  - Crear un nuevo pedido desde comprador
  - Confirmar desde comercio
  - En OPS → abrir pedido → "Zona de Peligro" → "Cancelar Pedido"
  - Ingresar contraseña: demo2026
  - Verificar que se cancela, driver se libera, stock se restaura

### 5.4 Gestión de comercios
- [ ] `/ops/comercios` — lista de comercios con estado de aprobación
- [ ] Abrir detalle de un comercio → ver info, pedidos, comisiones
- [ ] Probar aprobar/rechazar un comercio pendiente (del registro en Parte 2)

### 5.5 Gestión de repartidores
- [ ] `/ops/repartidores` — lista con estado online/offline, rating
- [ ] Probar aprobar/rechazar un repartidor pendiente (del registro en Parte 3)

### 5.6 Gestión de vendedores
- [ ] `/ops/vendedores` — lista de vendedores marketplace
- [ ] Abrir detalle de un vendedor → listings, ventas, ratings

### 5.7 Gestión de clientes
- [ ] `/ops/clientes` — lista de compradores, búsqueda
- [ ] Abrir detalle de un cliente → historial de pedidos, puntos

### 5.8 Productos y categorías
- [ ] `/ops/productos` — todos los productos del sistema
- [ ] `/ops/categorias` — gestionar categorías
- [ ] Crear categoría nueva, verificar que aparece en la tienda

### 5.9 Analytics y revenue
- [ ] `/ops/analytics` — métricas por período (hoy/semana/mes)
- [ ] Verificar: revenue, ticket promedio, tasa de cancelación, rankings
- [ ] `/ops/revenue` — tracking financiero

### 5.10 Configuración del sistema
- [ ] `/ops/configuracion` — ajustes globales (timeouts, fees)
- [ ] `/ops/configuracion-logistica` — fórmula de delivery fee, assignment engine
- [ ] `/ops/comisiones` — tasas de comisión

### 5.11 Programa de fidelización
- [ ] `/ops/lealtad-comercios` — ver tiers (BRONCE/PLATA/ORO/DIAMANTE)
- [ ] Verificar que Burger Ushuaia aparece en BRONCE (8%)
- [ ] Verificar que se pueden editar los umbrales de cada tier

### 5.12 Puntos y cupones
- [ ] `/ops/puntos` — configuración del programa MOOVER
- [ ] Verificar valores: 1 punto/$1, $0.01/punto, max 50% descuento

### 5.13 Contenido y comunicación
- [ ] `/ops/hero` — gestión de banners del home
- [ ] `/ops/slides` — slides promocionales
- [ ] `/ops/emails` — templates de email

### 5.14 Soporte operador
- [ ] `/ops/soporte` — consola de soporte
- [ ] Verificar que aparecen los mensajes enviados desde comercio/repartidor en Partes 2 y 3
- [ ] Responder un mensaje y verificar que llega al portal correspondiente

### 5.15 Paquetes B2B
- [ ] `/ops/catalogo-paquetes` — catálogo de paquetes
- [ ] `/ops/precios-paquetes` — configuración de precios
- [ ] `/ops/ventas-paquetes` — historial de ventas

### 5.16 Moderación y backups
- [ ] `/ops/moderacion` — panel de moderación
- [ ] `/ops/backups` — exportación de datos

### 5.17 Vitals técnicos
- [ ] `/ops/vitals` — Web Vitals y salud del sistema

---

## PARTE 6 — Portal de soporte

### 6.1 Operador de soporte
- [ ] `/soporte/login` — login como operador
- [ ] Dashboard de soporte — tickets abiertos, chat en vivo
- [ ] Verificar auto-asignación de chats
- [ ] Responder un ticket y verificar que llega al usuario

---

## PARTE 7 — Flujos cruzados y edge cases

### 7.1 Checkout con MercadoPago (sandbox)
- [ ] Crear un nuevo pedido como comprador
- [ ] En checkout, seleccionar **MercadoPago**
- [ ] Verificar redirect a MP sandbox
- [ ] Completar pago con tarjeta de prueba de MP
- [ ] Verificar redirect a `/checkout/mp-return`
- [ ] Verificar que el pedido se confirma automáticamente vía webhook

### 7.2 Cancelación por comprador
- [ ] Crear un pedido nuevo
- [ ] Desde `/mis-pedidos/[orderId]`, cancelar el pedido
- [ ] Verificar que el stock se restaura
- [ ] Verificar que el comercio recibe notificación de cancelación

### 7.3 Rechazo por comercio
- [ ] Crear un pedido nuevo
- [ ] Desde el portal del comercio, **rechazar** el pedido
- [ ] Verificar que el comprador recibe notificación
- [ ] Verificar que el tracking muestra "Rechazado"

### 7.4 Calificaciones completas
- [ ] Después de una entrega, calificar al repartidor (1-5 estrellas + comentario)
- [ ] Calificar al comercio
- [ ] Verificar que los promedios se actualizan en los perfiles correspondientes
- [ ] Verificar que las reseñas aparecen en `/comercios/resenas` y en el perfil del driver

### 7.5 Puntos MOOVER completos
- [ ] Verificar que tras un pedido DELIVERED se acreditaron puntos (1 punto/$1 gastado)
- [ ] En el siguiente pedido, aplicar puntos como descuento en el checkout
- [ ] Verificar max 50% del subtotal como descuento
- [ ] Verificar que el saldo de puntos se redujo correctamente

### 7.6 Seguimiento público (sin auth)
- [ ] Copiar el link de seguimiento de un pedido activo
- [ ] Abrirlo en una ventana de incógnito (sin login)
- [ ] Verificar que muestra el tracking sin datos sensibles

### 7.7 Recuperación de contraseña
- [ ] Ir a `/recuperar-contrasena`
- [ ] Ingresar un email y verificar que el formulario envía (no necesita SMTP real para probar la UI)

### 7.8 Eliminar cuenta
- [ ] Como comprador, ir a `/mi-perfil`
- [ ] Buscar opción "Eliminar mi cuenta"
- [ ] Verificar modal de doble confirmación (escribir ELIMINAR)
- [ ] **NO confirmar** (solo verificar que el flujo existe)

### 7.9 Responsive mobile
- [ ] Abrir la tienda en el celular (o DevTools mobile)
- [ ] Verificar: home, producto, carrito, checkout, tracking
- [ ] Verificar portal del repartidor en mobile: dashboard, swipe, mapa
- [ ] Verificar touch targets mínimos 44px en botones principales

---

## Checklist de problemas comunes

| Problema | Causa probable | Solución |
|----------|---------------|----------|
| "Error de conexión" en cualquier portal | Docker/PostgreSQL no corriendo | Abrir Docker Desktop |
| Pedido no llega al comercio | Socket.IO no conectado | Verificar que `dev:full` incluye socket server |
| Repartidor no recibe oferta | Assignment engine falló | Revisar logs: buscar "startAssignmentCycle" |
| Swipe da error 400 | Estado inconsistente | Cancelar desde OPS y crear pedido nuevo |
| Mapa no carga | API key Google Maps | Verificar `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` en .env |
| "No autorizado" | Credenciales o seed | Ejecutar `npx tsx prisma/seed.ts` |
| Registro de comercio falla | Campos de docs obligatorios | Subir cualquier imagen como placeholder |
| Dirección no autocompleta | Places API no habilitada | Verificar en Google Cloud Console |
| Push notifications no llegan | VAPID keys o permisos | Aceptar permisos del navegador, verificar VAPID en .env |
| Email no se envía | SMTP no configurado | Normal en dev — verificar solo que no crashea |

---

## Resultado

### Si TODAS las partes pasan:
Moovy está listo para producción. Siguientes pasos:
1. Configurar credenciales MP reales
2. Configurar SMTP de producción
3. Deploy al VPS con `devmain.ps1`
4. Pedido real con dinero real
5. Onboarding del primer comercio

### Si algo falla:
Anotar exactamente: qué parte, qué paso, qué error (screenshot + consola). Reportar para corregir antes de avanzar.
