# Prompt 1 — Auditoría inicial + generación de CLAUDE.md + arrancar a ejecutar

> **Uso**: Una sola vez. Pegá todo el contenido de abajo en Cowork.

---

Tu misión tiene 3 fases en esta sesión. Las 3 se hacen hoy, en orden.

---

## FASE 1 — Leé todo el proyecto (en silencio, no me muestres el proceso)

Explorá cada archivo relevante del proyecto Moovy. Necesitás entender:
- Stack, arquitectura, estructura de carpetas
- Cada modelo de datos (campos, relaciones)
- Cada endpoint de API
- Cada pantalla del frontend
- Integraciones externas (MercadoPago, email, mapas, etc.)
- Seguridad (auth, permisos, validaciones)
- Infraestructura (Docker, VPS, scripts de deploy)
- Leé el CLAUDE.md existente si hay uno y verificá si coincide con el código real

Recorré mentalmente estos 4 flujos y anotá dónde se rompe cada uno:
- Comprador: registro → buscar → comprar → pagar → tracking → recibir → calificar
- Comercio: registro → aprobación → cargar productos → recibir pedido → preparar → cobrar
- Repartidor: registro → aprobación → conectarse → recibir pedido → retirar → entregar → cobrar
- Admin: login → dashboard → aprobar usuarios → ver métricas → gestionar

---

## FASE 2 — Generá los 2 archivos (compactos y al grano)

### ARCHIVO 1: CLAUDE.md

Reemplazá o actualizá el CLAUDE.md con esta estructura. Cada sección debe ser DENSA y CORTA. No prosa. No explicaciones largas. Datos puros.

```markdown
# MOOVY
Última actualización: [fecha]
Marketplace + tienda virtual + delivery. Ushuaia, Argentina (80k hab).
Diferenciador: el comercio cobra instantáneamente.
Stack: [framework] + [DB] + [ORM] + [frontend] + [auth method]
Hosting: VPS Hostinger. Deploy: scripts PowerShell → SSH.

## Estructura
[Solo las carpetas importantes, 2-3 niveles, una línea por carpeta con descripción corta]

## Modelos de datos
[Una línea por modelo: nombre → campos clave → relaciones → estado (ok/incompleto/le falta X)]

## Módulos
[Una línea por módulo con emoji y nota:]
✅ Auth — /ruta — JWT + roles, funciona
🟡 Pagos — /ruta — MP integrado parcial, falta webhook
🔴 Delivery — /ruta — existe pero sin dispatch engine
❌ Emails — no existe
[etc.]

## Flujos (dónde se rompe cada uno)
Comprador: registro ✅ → buscar ✅ → carrito 🟡(falta X) → checkout 🔴(se rompe en Y) → ...
Comercio: registro ✅ → aprobación ❌ → ...
Repartidor: ...
Admin: ...

## Seguridad (resumen)
- Endpoints sin auth: [lista corta]
- IDOR posible: [sí/no, dónde]
- Rate limiting: [sí/no]
- CORS: [estado]
- Secrets expuestos: [sí/no]

## Decisiones tomadas
[Inferidas del código, una por línea]
- Auth: JWT con [método], expiración [X]
- Pagos: MercadoPago [tipo de integración]
- DB: [tipo] con [ORM]
- Deploy: PowerShell scripts → VPS vía SSH

## Reglas de negocio
[Inferidas del código, una por línea]
- Comisión Moovy: [X% o no definido]
- Propinas: [100% repartidor o no implementado]
- [etc.]

## Variables de entorno
[Lista agrupada por servicio, sin valores]

## Scripts
start.ps1: crear rama | finish.ps1: cerrar y merge a develop | publish.ps1: commit+push+dump DB | devmain.ps1: deploy a producción | sync.ps1: sincronizar proyecto

## Instrucciones para cada sesión
1. Leé este archivo y PROJECT_STATUS.md antes de hacer cualquier cosa
2. Trabajá las tareas en orden de PROJECT_STATUS.md
3. Commiteá seguido con mensajes claros
4. Cuando completes tareas, marcalas [x] en PROJECT_STATUS.md
5. Si tomás decisiones de arquitectura, agregalas a "Decisiones tomadas"
6. Al cierre actualizá la fecha de este archivo
```

IMPORTANTE: El CLAUDE.md no debe superar las 150 líneas. Si te pasás, recortá. Cada línea debe aportar información que cambie una decisión. Si no cambia nada, no va.

### ARCHIVO 2: PROJECT_STATUS.md

```markdown
# Moovy — Tareas pendientes
Score: [X/100] | P0: [N] tareas | P1: [N] | P2: [N]
Última actualización: [fecha]

## P0 — Sin esto no se lanza
- [ ] Tarea — archivo(s) afectados — S/M/L/XL
- [ ] ...

## P1 — Sin esto los usuarios se van
- [ ] ...

## P2 — Esto lo hace competitivo
- [ ] ...

## Backlog futuro (P3/P4)
[Solo títulos, una línea cada uno, sin detalle]

## Completadas
[Acá se mueven las tareas terminadas con fecha]
```

REGLAS DE LA LISTA:
- Máximo 45 tareas visibles con detalle (15 por bloque P0/P1/P2)
- El resto va a "Backlog futuro" solo como títulos
- Cada tarea debe ser ejecutable en una sentada (si es XL, partila en 2)
- Orden por dependencia: primero lo que desbloquea otras cosas
- Cuando una tarea se completa, se mueve a "Completadas" con fecha

---

## FASE 3 — Arrancá a ejecutar

Con los dos archivos creados, empezá a resolver tareas P0 inmediatamente. No pares. Usá el tiempo restante de esta sesión para avanzar todo lo que puedas.

Para cada tarea que completes:
1. Implementá la solución
2. Marcala como [x] en PROJECT_STATUS.md
3. Commiteá con mensaje descriptivo

Cuando se te acabe el contexto o la sesión, hacé un commit final con todo lo pendiente y mostrá:

1. Score actualizado
2. Tareas completadas hoy
3. Próxima tarea para mañana
4. Bloqueantes que necesiten mi decisión (si los hay)
5. Tu veredicto: ¿cuántas sesiones más para completar P0?

---

## CONTEXTO DE NEGOCIO (para tus decisiones)

- Moovy opera en Ushuaia: 80.000 hab, clima extremo, boca a boca es todo
- 4 actores: comprador, comercio, repartidor, admin/owner
- Métodos de pago: MercadoPago, transferencia bancaria, efectivo
- El comercio cobra AL INSTANTE (diferenciador vs PedidosYa/Rappi)
- Webapp ahora, app nativa Android después
- Lo opera una sola persona con IA
- Meta: lanzar lo antes posible, impecable, sin errores de dinero

## REGLAS

- No me preguntes nada salvo decisiones de negocio que solo yo puedo tomar
- Para todo lo técnico, tomá la decisión más segura y documentala
- Sé brutalmente honesto en el score y el diagnóstico
- Si algo está bien hecho, decilo. Si está mal, decilo.
- Pensá siempre: "¿qué pasa si esto falla frente a un usuario real en Ushuaia?"
