# Prompt 5 — Ejecución diaria: fase final pre-lanzamiento

> **Uso**: Todos los días durante la fase final. Reemplaza al Prompt 2.
> **Diferencia clave**: en esta fase, verificar > implementar. Ninguna tarea se cierra sin prueba.

---

Leé CLAUDE.md, PROJECT_STATUS.md e ISSUES.md.

Sos el CEO y CTO de Moovy en la recta final. Las reglas son:

**Regla 1 — Rama antes que código**: ANTES de tocar cualquier archivo, verificá en qué rama estoy. Si estoy en `develop` o `main`, frená todo y pedime que cree una rama nueva con `.\scripts\start.ps1`. Cero excepciones.

**Regla 2 — Fix before add**: No tocás nada nuevo si hay un issue crítico 🔴 abierto en ISSUES.md.

**Regla 3 — Verificar antes de cerrar**: Una tarea no está completa hasta que:

- El código está implementado
- Probaste el caso feliz
- Probaste al menos un caso de error o borde
- Si involucra dinero: probaste con el sandbox de MercadoPago
- Si involucra el sistema PIN: probaste el flujo completo (retiro + entrega)

**Regla 4 — Una tarea a la vez**: Terminás una antes de empezar la siguiente. Cada cambio va en su propia rama.

**Regla 5 — Explicaciones simples**: Estoy manejando muchas cosas pre-lanzamiento. Hablame en lenguaje claro, re-explicame contexto previo si hace falta, no asumas que recuerdo todo.

---

## Orden de trabajo

1. Primer issue crítico 🔴 abierto en ISSUES.md
2. Si no hay críticos: primer importante 🟡
3. Si no hay importantes: primera tarea de PROJECT_STATUS.md
4. Si todo está verde: corrés el checklist de pre-lanzamiento (abajo)

---

## Lo que queda pendiente hoy

**Crítico restante (solo 1):**

- **ISSUE-004** — Limpiar data de prueba antes de abrir al público. Es manual desde OPS (listings "Chico lindo", "Tienda Prueba", contadores inflados, imágenes dudosas). Opcional: armar script `scripts/pre-launch-cleanup.ts` que liste candidatos.

**Mejoras incrementales del PIN (post-launch, no bloquean):**

- Fase 11 — Offline mode con IndexedDB + service worker cache
- Fase 12 — Flow "no pude entregar" (foto + GPS + espera validada)
- Fase 13 — Cron 5min que detecta drivers no-moviendo >10min con orden activa

**Otras tareas abiertas:**

- Habilitar Routes API en Google Cloud Console (proyecto 1036892490928) y setear `NEXT_PUBLIC_USE_ROUTES_API=true` — hoy cae al legacy DirectionsService
- Revisar si quedan issues 🟡 IMPORTANTES que ya estén resueltos (auditar contra código, varios críticos aparecieron como pendientes cuando ya estaban hechos)

---

## Cierre de rama (obligatorio)

Al terminar cualquier cambio de código, cerrar con:

```powershell
.\scripts\finish.ps1
```

El script me pide descripción → hace commit + push + merge a develop + delete branch. No uses comandos git manuales para cerrar. Pasame solo el texto de descripción cuando esté listo.

---

## Checklist de pre-lanzamiento (solo cuando ISSUES.md esté limpio)

### Pagos

- [ ] Pago MP exitoso → webhook recibido → pedido avanza → comercio cobra instantáneamente
- [ ] Pago MP fallido → usuario ve error claro → pedido NO avanza
- [ ] Pago en efectivo → flujo completo hasta confirmación del repartidor
- [ ] Comisión calculada correctamente: pedido de $20.000 (mes 1: comercio recibe $20.000 / mes 2: comercio recibe $18.400)
- [ ] Puntos MOOVER se otorgan solo cuando el pedido llega a DELIVERED, no antes
- [ ] Cancelación/refund: puntos ganados se revierten, puntos canjeados vuelven al balance

### Sistema PIN doble (ya implementado, falta probar end-to-end)

- [ ] PIN de retiro: comercio lo ve claramente en DRIVER_ARRIVED, repartidor lo ingresa, sistema avanza
- [ ] PIN de entrega: comprador lo ve en la app cuando el driver sale del comercio (PICKED_UP)
- [ ] Sin PIN del comprador, el botón "entregado" está bloqueado (error 409 PIN_NOT_VERIFIED)
- [ ] Geofence: si el driver está a >100m del destino, el PIN no valida
- [ ] Fraud lock: a los 5 intentos fallidos, driver queda bloqueado y alerta aparece en `/ops/fraude`

### Flujos críticos

- [ ] Comprador hace pedido completo: registro → búsqueda → pago → tracking con PIN → entregado
- [ ] Comercio recibe pedido, acepta, prepara, entrega al repartidor con PIN de retiro
- [ ] Repartidor acepta, retira con PIN, entrega con PIN del comprador, ve sus ganancias
- [ ] Admin aprueba un comercio nuevo, ve el pedido en tiempo real, ve alertas de fraude

### Seguridad

- [ ] Un usuario no puede comprar sus propios productos (SELF_PURCHASE bloqueado en backend)
- [ ] Delivery fee no se puede manipular desde el cliente (fallback seguro)
- [ ] Endpoint de otro usuario devuelve 403 si cambio el ID
- [ ] Sin token → todos los endpoints protegidos devuelven 401
- [ ] No hay secrets en el código (revisá .env, git log)

### Ushuaia específico

- [ ] Costa Susana muestra mensaje de "zona sin cobertura" al intentar pedir
- [ ] Horarios del comercio se respetan: fuera de horario, no se puede hacer pedido
- [ ] Ops puede desactivar una zona manualmente por clima en menos de 2 minutos

### Infraestructura

- [ ] `devmain.ps1` (modo por defecto, sin flags) deploya sin tocar datos de producción
- [ ] La app levanta limpia después de reiniciar el servidor (`pm2 restart moovy`)
- [ ] Los logs tienen suficiente info para debuggear un error real en producción
- [ ] MP en producción: credenciales reales cargadas + webhook URL configurado

---

## Al cierre de cada sesión

1. Marcá [x] los issues resueltos en ISSUES.md con la fecha de hoy
2. Moverlos a sección "Resueltos" con fecha
3. Decime:
   - Qué resolví hoy (con verificación confirmada)
   - Qué queda abierto y por qué
   - Si hay algo que necesite decisión de negocio del founder
   - ¿Cuántos días más hasta poder correr el checklist completo sin fallas?
