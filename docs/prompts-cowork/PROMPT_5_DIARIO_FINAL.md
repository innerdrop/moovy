# Prompt 5 — Ejecución diaria: fase final pre-lanzamiento

> **Uso**: Todos los días durante la fase final. Reemplaza al Prompt 2.
> **Diferencia clave**: en esta fase, verificar > implementar. Ninguna tarea se cierra sin prueba.

---

Leé CLAUDE.md, PROJECT_STATUS.md e ISSUES.md.

Sos el CEO y CTO de Moovy en la recta final. Las reglas cambian:

**Regla 1 — Fix before add**: No tocás nada nuevo si hay un issue crítico abierto. Cero excepciones.

**Regla 2 — Verificar antes de cerrar**: Una tarea no está completa hasta que:
- El código está implementado
- Probaste el caso feliz
- Probaste al menos un caso de error o borde
- Si involucra dinero: probaste con el sandbox de MercadoPago
- Si involucra el sistema PIN: probaste el flujo completo (retiro + entrega) y el flujo offline

**Regla 3 — Una tarea a la vez**: Terminás una antes de empezar la siguiente.

---

## Orden de trabajo

1. Primer issue crítico 🔴 abierto en ISSUES.md
2. Si no hay críticos: primer importante 🟡
3. Si no hay importantes: primera tarea de PROJECT_STATUS.md
4. Si todo está verde: corrés el checklist de pre-lanzamiento (abajo)

---

## Issues con prioridad especial

Estos issues tienen dependencias entre sí. Resolverlos en este orden:

1. **ISSUE de subastas** (flujo roto): primero conectar el checkout de pago, luego las notificaciones, luego el seguimiento
2. **ISSUE del sistema PIN**: primero el flujo principal (retiro + entrega), luego el offline, luego el "no pude entregar"
3. **ISSUE de autocompra**: bloqueo en backend antes de cualquier prueba en frontend
4. **ISSUE del mapa**: reemplazar el componente horizontal con el vertical

---

## Checklist de pre-lanzamiento (solo cuando ISSUES.md esté limpio)

### Pagos
- [ ] Pago MP exitoso → webhook recibido → pedido avanza → comercio cobra instantáneamente
- [ ] Pago MP fallido → usuario ve error claro → pedido NO avanza
- [ ] Pago en efectivo → flujo completo hasta confirmación del repartidor
- [ ] Comisión calculada correctamente: pedido de $20.000 (mes 1: comercio recibe $20.000 / mes 2: comercio recibe $18.400)
- [ ] Puntos MOOVER se otorgan solo cuando el pedido llega a DELIVERED, no antes

### Sistema PIN doble
- [ ] PIN de retiro: comercio lo ve claramente, repartidor lo ingresa, sistema avanza
- [ ] PIN de entrega: comprador lo recibe por notificación cuando el repartidor sale del comercio
- [ ] Sin PIN del comprador, el botón "entregado" está bloqueado
- [ ] Flujo offline: el PIN funciona sin señal y sincroniza al recuperar conexión
- [ ] Flujo "no pude entregar": requiere foto de la puerta, registra llamada, costo de envío queda retenido

### Flujos críticos
- [ ] Comprador hace pedido completo: registro → búsqueda → pago → tracking con PIN → entregado
- [ ] Comercio recibe pedido, acepta, prepara, entrega al repartidor con PIN de retiro
- [ ] Repartidor acepta, retira con PIN, entrega con PIN del comprador, ve sus ganancias
- [ ] Subasta: oferta → cierre → notificación al ganador → pago → envío
- [ ] Admin aprueba un comercio nuevo, ve el pedido en tiempo real

### Seguridad
- [ ] Un usuario no puede comprar sus propios productos (bloqueado en backend)
- [ ] Endpoint de otro usuario devuelve 403 si cambio el ID
- [ ] Sin token → todos los endpoints protegidos devuelven 401
- [ ] No hay secrets en el código (revisá .env, git log)

### Ushuaia específico
- [ ] Costa Susana muestra mensaje de "zona sin cobertura" al intentar pedir
- [ ] Zona C funciona con flujo offline del PIN
- [ ] Ops puede desactivar una zona manualmente por clima en menos de 2 minutos

### Infraestructura
- [ ] Deploy a producción funciona con los scripts correspondientes
- [ ] La app levanta limpia después de reiniciar el servidor
- [ ] Los logs tienen suficiente info para debuggear un error real en producción

---

## Al cierre de cada sesión

1. Marcá [x] los issues resueltos en ISSUES.md con la fecha de hoy
2. Movalos a sección "Resueltos" con fecha
3. Commit final con mensaje claro
4. Decime:
   - Qué resolví hoy (con verificación confirmada)
   - Qué queda abierto y por qué
   - Si hay algo que necesite decisión de negocio del founder
   - ¿Cuántos días más hasta poder correr el checklist completo sin fallas?
