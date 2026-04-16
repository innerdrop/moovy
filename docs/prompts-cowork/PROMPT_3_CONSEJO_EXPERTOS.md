# Prompt 3 — Consejo de expertos: auditoría crítica pre-lanzamiento

> **Uso**: Una sola vez. Pegá en Cowork cuando el proyecto esté "casi listo".
> **Salida esperada**: Archivo ISSUES.md con todos los problemas encontrados, priorizados.

---

## ANTES DE EMPEZAR — Navegá el sitio en producción

Entrá a **somosmoovy.com** y recorrelo como usuario real antes de tocar el código. Lo que se ve en el código y lo que experimenta el usuario en producción pueden diferir.

Recorrés estos flujos en vivo:
- Registro de comprador nuevo → búsqueda → producto → carrito → checkout
- Login como comercio → dashboard → catálogo → recibir pedido simulado
- Login como repartidor → conectarse → ver pedido disponible
- Admin → dashboard → estado general

Anotá todo lo que se vea raro, incompleto, o confuso. Eso alimenta directamente el ISSUES.md.

---

## ISSUES YA CONOCIDOS — Incorporalos directamente al ISSUES.md

No los redescubras. Ya fueron detectados en el smoke test. Usá tu auditoría para encontrar lo que todavía no se sabe.

**CONOCIDO-001 — Bug mapa de seguimiento horizontal**
Cuando el usuario hace zoom en el mapa de seguimiento (versión horizontal), el mapa vuelve a su posición original. La versión vertical funciona bien. Probable causa: handler de resize que resetea el viewport. Solución: usar el componente vertical como base.

**CONOCIDO-002 — Un comprador puede comprar sus propios productos**
No hay restricción que lo impida. Permite acumular puntos MOOVER fraudulentamente. Debe bloquearse en backend, no solo en frontend.

**CONOCIDO-003 — Flujo de subastas incompleto (CRÍTICO)**
El formulario de oferta existe pero el flujo está roto en múltiples puntos: el ofertante no puede ver las subastas en las que participa, el ganador no recibe notificación, no hay conexión con el checkout de pago, no hay lógica de envío post-subasta, y el vendedor no tiene seguimiento de sus subastas activas. No puede salir al público en este estado.

**CONOCIDO-004 — Sistema PIN doble de entrega — no implementado**
Para prevenir el fraude documentado en entrevistas con comercios ("repartidor marca entregado sin haber llegado"), se definió este sistema que debe implementarse:
- Al crearse el pedido se generan dos PINs distintos
- PIN de retiro: el comercio se lo da al repartidor al entregar el paquete; el repartidor lo ingresa en la app para confirmar que lo recibió
- PIN de entrega: le llega al comprador por notificación cuando el repartidor sale del comercio; el comprador se lo dice al repartidor en la puerta
- Sin PIN del comprador, el repartidor no puede marcar "entregado" — sin excepciones
- Flujo offline: los PINs se descargan al dispositivo al aceptar el pedido, se validan localmente, sincronizan al recuperar señal
- Caso "no pude entregar": el repartidor debe llamar al comprador desde la app (queda registrado), esperar mínimo 3 minutos (GPS confirma), y sacar foto de la puerta (se toma offline, sincroniza después). Sin foto no puede cerrar el pedido
- Política de costos: si el comprador no estaba en casa, no recupera el costo de envío (el viaje fue real, el repartidor cumplió su parte). Solo se devuelve el valor del producto si este vuelve al comercio
- Si el GPS confirma que el repartidor nunca fue al domicilio: fraude → suspensión inmediata automática, Moovy cubre todo al comprador
- Si un repartidor supera 5% de "no entregado" en un mes: revisión manual automática

**CONOCIDO-005 — Posible falta de navegación entre secciones**
Percepción del founder: puede faltar enlaces para que el usuario se mueva mejor por la plataforma. Validar navegando somosmoovy.com con ojos de usuario nuevo antes de calificar la severidad.

---

## LOS 7 ROLES

Sos el consejo directivo de Moovy. Hoy no ejecutás tareas: **auditás**. Leé CLAUDE.md y PROJECT_STATUS.md. Luego recorrés el código completo.

---

### ROL 1 — CEO de Producto
**Tu pregunta**: ¿Tiene cada actor exactamente la información que necesita, en el momento que la necesita?

- ¿Sabe el comprador cuánto va a pagar en total ANTES de confirmar? (producto + envío, sin sorpresas)
- ¿Sabe cuándo llega su pedido, con qué precisión?
- ¿Recibe aviso cuando el repartidor está cerca? (para estar en casa)
- ¿Sabe si el comercio está abierto antes de armar el carrito?
- ¿Sabe el comercio cuánto va a cobrar neto (con o sin comisión) por cada pedido?
- ¿Entiende el repartidor exactamente a dónde ir, qué entregar, a quién, y cuánto cobra?
- ¿El admin tiene visibilidad en tiempo real del estado del sistema?
- ¿El comprador entiende para qué es el PIN de entrega cuando lo recibe?

---

### ROL 2 — CTO / Arquitecto
**Tu pregunta**: ¿Qué falla en producción bajo uso real?

- Errores silenciosos: try/catch que tragan errores sin loguear
- Race conditions: dos repartidores aceptando el mismo pedido simultáneamente
- Estados huérfanos: pedidos que quedan en estado indefinido
- Timeouts: MercadoPago tarda 30 segundos en responder
- Carga concurrente: 10 personas comprando en el mismo comercio al mismo tiempo
- Idempotencia: ¿las operaciones críticas se pueden reintentar sin consecuencias?
- Jobs/crons: ¿hay tareas programadas que pueden fallar sin alertar a nadie?
- Logs: ¿hay suficiente traza para debuggear un problema en producción a las 2am?
- Sistema PIN: ¿es idempotente? ¿qué pasa si el mismo PIN se ingresa dos veces? ¿tiene expiración?
- Sincronización offline: ¿qué pasa si el dispositivo del repartidor sincroniza el mismo evento dos veces?

---

### ROL 3 — Especialista en pagos
**Tu pregunta**: ¿Puede alguna operación de dinero quedar en estado incorrecto?

- Webhook de MP: ¿qué pasa si llega tarde, duplicado, o no llega?
- Splits: ¿se calcula bien en todos los casos? (0% mes 1, 8% mes 2+, 12% marketplace, con descuento de puntos, con reembolso parcial)
- Cobro instantáneo al comercio: ¿funciona realmente? ¿hay alguna condición que lo bloquee?
- Doble cobro: ¿puede un usuario ser cobrado dos veces por el mismo pedido?
- Puntos MOOVER: ¿se otorgan solo cuando el pedido llega a DELIVERED? ¿o hay un bug que los otorga antes?
- Autocompra (CONOCIDO-002): si un usuario se compra a sí mismo, ¿los puntos se acreditan igual? ¿se genera comisión sobre sí mismo?
- Subastas (CONOCIDO-003): ¿hay dinero pre-autorizado o reservado durante la subasta? ¿qué pasa con ese dinero si el flujo de pago no existe?
- No-entrega: si el comprador no estaba, ¿el sistema devuelve solo el producto y retiene correctamente el costo de envío?
- Efectivo: ¿el sistema de rendición de efectivo y compensación cruzada funciona según la Biblia Financiera?

---

### ROL 4 — Seguridad (OWASP)
**Tu pregunta**: ¿Puede un usuario malicioso hacerle daño a otro usuario o al sistema?

- IDOR: ¿puede un usuario ver o modificar pedidos de otro cambiando un ID en la URL?
- Auth: ¿hay algún endpoint que debería requerir auth y no la tiene?
- Escalación de roles: ¿puede un comprador acceder a endpoints de admin o comercio?
- Rate limiting: ¿se puede hacer brute force del login? ¿spam de pedidos? ¿spam de ofertas en subastas?
- Validación: ¿se valida todo lo que llega del cliente, o se confía en el frontend?
- Secrets: ¿hay keys de MercadoPago hardcodeadas? ¿producción y test están bien separados?
- CORS: ¿configurado correctamente para producción?
- Inyección: ¿puede alguien inyectar HTML o SQL a través de nombres de productos o comentarios?
- PINs: ¿son suficientemente aleatorios? ¿se pueden adivinar por fuerza bruta? ¿expiran?
- Autocompra: ¿el bloqueo se puede bypassear creando una segunda cuenta con el mismo usuario?

---

### ROL 5 — QA Senior
**Tu pregunta**: ¿Qué exactamente se rompe cuando un usuario real usa esto?

Simulá estos escenarios:
- Comercio cierra durante el checkout de un comprador
- Repartidor acepta un pedido y pierde señal — flujo offline con PIN
- Pago con MP queda en "pendiente" por 2 horas
- Stock 1, dos usuarios compran al mismo tiempo
- Usuario cancela durante la preparación
- Repartidor llega, el comprador no está, saca la foto, marca "no pude entregar" — ¿el flujo es claro y el costo de envío queda correctamente retenido?
- Repartidor intenta marcar "entregado" sin ingresar el PIN — ¿el sistema lo bloquea?
- Usuario gana una subasta — ¿puede pagar? ¿recibe notificación? (CONOCIDO-003)
- Usuario intenta comprar su propio producto (CONOCIDO-002)
- Admin necesita reembolsar un pedido de hace 3 días
- Conexión lenta: ¿hay doble-submit posible en el checkout?
- Comercio nuevo sin productos: ¿qué ve?
- No hay repartidores disponibles: ¿qué ve el comprador?

---

### ROL 6 — UX y comunicación
**Tu pregunta**: ¿Entiende el usuario qué hacer en cada momento, incluso cuando algo falla?

- Estados de carga: ¿hay feedback cuando algo tarda, o la pantalla se congela?
- Estados de error: ¿el mensaje dice qué pasó y qué hacer, o solo dice "error"?
- Estados vacíos: ¿hay pantallas en blanco cuando no hay datos?
- Confirmaciones: ¿acciones destructivas piden confirmación?
- PIN de entrega: ¿el comprador entiende para qué es cuando lo recibe? ¿el mensaje es claro?
- Aviso de llegada: ¿hay notificación cuando el repartidor está cerca, para que el comprador esté listo?
- Mobile: ¿botones tocables con el dedo, sin zoom inesperado en formularios?
- Textos: ¿hay placeholders, textos en inglés, o mensajes técnicos visibles al usuario?
- Flujos sin salida: ¿hay algún flujo que lleva a un callejón? (especialmente subastas y post-pago)
- Navegación: ¿el usuario puede moverse por toda la plataforma sin quedar atrapado? (CONOCIDO-005)

---

### ROL 7 — Experto local Ushuaia
**Tu pregunta**: ¿Funciona esto en Ushuaia, específicamente?

- Zona C (El Escondido, Dos Banderas, La Cima): ¿el flujo offline del PIN funciona con señal intermitente?
- Costa Susana: ¿está correctamente excluida del servicio con mensaje claro al usuario?
- Clima extremo: ¿los comercios pueden cerrar de emergencia? ¿ops puede desactivar zonas manualmente?
- Fraude de entrega: ¿el sistema PIN resuelve el problema que tenía PedidosYa con sus comercios locales?
- Alertas al owner: si algo falla con dinero a las 3am, ¿cómo se entera el admin?
- Onboarding de comercios: ¿es simple para un comerciante sin experiencia técnica?
- Diferenciadores: ¿hay algo que PedidosYa hace que Moovy no hace y que un usuario va a extrañar en el primer pedido?

---

## ENTREGABLE: ISSUES.md

```markdown
# Moovy — Issues pre-lanzamiento
Generado: [fecha]
Total: [N] | Críticos: [N] | Importantes: [N] | Menores: [N]

## 🔴 CRÍTICOS — Bloquean el lanzamiento
### ISSUE-001 — [título]
**Detectado por**: [rol]
**Qué pasa**: [descripción concreta]
**Escenario**: [cuándo ocurre]
**Impacto**: [consecuencia real]
**Dónde**: [archivo(s)]
**Cómo resolverlo**: [solución técnica]

## 🟡 IMPORTANTES — Afectan experiencia, no bloquean
[misma estructura]

## 🟢 MENORES — Pulir post-lanzamiento
[más breve]

## ✅ Lo que está bien (no tocar)
[Lista corta]

## ⏱ Estimación
Issues críticos = [X] días de trabajo con dedicación full
```

**Reglas**: Los 5 issues conocidos van incluidos con la severidad que corresponda. Máximo 8 críticos — si hay más, los peores 8, el resto pasan a importantes. Cada issue tiene que ser accionable. No dupliques: si dos roles detectan lo mismo, es un solo issue.
