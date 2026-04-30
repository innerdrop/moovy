# Entrevista a Repartidor de PedidosYa — Ushuaia

**Objetivo**: Entender la experiencia real del repartidor en PedidosYa para diseñar una experiencia superior en MOOVY.

**Tono**: Conversación informal, de igual a igual. No es un interrogatorio — es un café con alguien que sabe del rubro. Que sienta que su opinión vale y que puede influir en cómo se construye algo nuevo.

**Consejo**: No tomes notas visibles todo el tiempo — grabá audio con permiso ("¿Te jode si grabo? Es para no olvidarme nada"). Las mejores respuestas salen cuando la persona se relaja.

---

## Lo que ya sabemos de PedidosYa (leé esto ANTES de la entrevista)

Esto es lo que investigamos sobre cómo funciona la app para repartidores. Usalo como contexto para hacer preguntas inteligentes — si ya sabés algo, podés ir directo al grano y preguntar "cómo es ESO en Ushuaia" en vez de preguntas genéricas.

**Zonas de logueo**: El repartidor elige en qué zona geográfica va a trabajar antes de conectarse. En ciudades grandes hay muchas zonas; en Ushuaia probablemente sean pocas. La app muestra un "mapa de calor" con zonas rojas donde hay más demanda.

**Turnos por bloques**: Los turnos son bloques (aparentemente de 4 horas). Se reservan desde la app. Los repartidores mejor rankeados acceden primero al calendario (miércoles/jueves), el resto los viernes. Los top 3 del ranking pueden tomar hasta 2 turnos/día (3 en fines de semana). Los de ranking bajo solo trabajan si los de arriba sueltan un turno.

**Ranking/Scoring (5 niveles)**: Hay 5 categorías. El nivel 1 es el mejor. Factores que lo afectan: no rechazar pedidos, no faltar fines de semana/feriados, buenas calificaciones de clientes y comercios, antigüedad, velocidad de entrega, tener activado el "modo automático" de recepción. El sistema penaliza inactividad, rechazos y ausencias. GPS supervisa cada segundo.

**Modo automático vs manual**: Existe un modo donde los pedidos se aceptan automáticamente. Tenerlo activado mejora el scoring. Esto es clave: en MOOVY el driver siempre ve cuánto va a ganar ANTES de aceptar. En PedidosYa, el modo automático te quita esa elección.

**Algoritmo Hurrier**: Sistema de asignación que predice demanda y asigna por cercanía, eficiencia, tipo de vehículo (bici/moto/auto) y si tiene modo automático activo.

**Batching**: Les mandan varios pedidos juntos (múltiples pickups en un viaje). Los repartidores se quejan de que pagan lo mismo o menos por más trabajo.

**Pagos**: Semanales por transferencia a CBU. Adelantos diarios en efectivo. Propinas digitales 100% para el repartidor, depositadas con el pago semanal. PedidosYa absorbe el costo de la transacción de propina.

**Equipamiento**: PedidosYa vende mochilas y equipamiento a través de una tienda online propia.

**Seguro**: Ofrecen algún tipo de cobertura por accidentes, pero los detalles son difusos.

**Ley nueva 2026**: Por primera vez en Argentina, las plataformas están obligadas a revelar cómo funciona su algoritmo de asignación y qué factores afectan la calificación del repartidor.

---

## Apertura (5 min)

Arrancá humano. Contale qué es MOOVY en 30 segundos, que es de Ushuaia, que estás armando el equipo de repartidores para la etapa de prueba y que su experiencia real te interesa más que cualquier estudio de mercado.

> "Estoy armando algo acá en Ushuaia, una app de delivery local. Antes de lanzar necesito entender bien cómo es el día a día real de un repartidor, no lo que dice internet. Por eso te busqué a vos."

---

## Bloque 1 — El día a día (10 min)

El objetivo acá es entender la rutina operativa completa.

- ¿Cuántas horas por día le dedicás a PedidosYa? ¿Todos los días?
- ¿Cómo decidís cuándo conectarte y cuándo no? ¿Hay horarios que rinden más?
- ¿Usás bici, moto o auto? ¿Alguna vez tuviste que cambiar de vehículo por el clima?
- Un día normal en Ushuaia con nieve o lluvia fuerte: ¿seguís laburando o te desconectás? ¿La app te compensa algo extra por el clima?
- ¿Cuántos pedidos hacés en un día bueno? ¿Y en uno malo?
- ¿Hay zonas de Ushuaia donde no te gusta ir? ¿Por qué? (distancia, caminos feos, poca propina, señal de celular)

---

## Bloque 2 — Turnos, zonas y ranking (10 min)

PedidosYa tiene un sistema de turnos, zonas y ranking que determina cuánto trabaja cada repartidor. Necesitamos entender cómo funciona esto en la práctica — y especialmente en Ushuaia.

**Zonas de logueo (check-in):**
- ¿Cómo funciona lo de las zonas de logueo? ¿Tenés que elegir una zona antes de conectarte?
- ¿Cuántas zonas hay en Ushuaia? ¿Podés agregar o cambiar zonas? ¿Hay zonas mejores que otras?
- ¿Ves el mapa de calor (zonas rojas) que muestra dónde hay más demanda? ¿Funciona bien acá o es irrelevante porque Ushuaia es chica?
- ¿Te pasó de estar logueado en una zona y que te manden a buscar un pedido a otra zona lejana?

**Sistema de turnos:**
- ¿Cómo reservás los turnos? ¿Son bloques de 4 horas? ¿De cuántas horas?
- Tengo entendido que los turnos se liberan por ranking: los mejor rankeados eligen primero (miércoles/jueves) y el resto después (viernes). ¿Es así acá? ¿Cuándo se liberan en Ushuaia?
- ¿Cuántos turnos podés agarrar por día? ¿Y por semana?
- ¿Te pasó de quedarte sin turnos disponibles? ¿Podés trabajar sin turno reservado (modo libre)?
- ¿Los turnos de viernes, sábado y feriados son difíciles de conseguir?

**Ranking y scoring:**
- ¿Sabés cómo funciona tu puntaje/ranking? ¿Qué lo sube y qué lo baja?
- Leí que influyen: no rechazar pedidos, calificaciones de clientes/comercios, estar en horas de alta demanda, antigüedad, velocidad de entrega. ¿Coincide con tu experiencia?
- ¿Existe lo del "modo automático" de recepción de pedidos? ¿Tenerlo activado te sube el ranking?
- ¿Sentís que el ranking te obliga a aceptar pedidos que no te convienen para no perder puntaje?
- ¿Te pasó de bajar de categoría? ¿Cuántas categorías hay? ¿Qué nivel tenés vos?
- ¿Sabés de repartidores que están en el nivel más bajo y prácticamente no pueden trabajar?

---

## Bloque 3 — La app por dentro (10 min)

Acá necesitamos entender la interfaz y la mecánica de asignación concreta.

**Asignación de pedidos:**
- Cuando te llega un pedido, ¿qué información ves antes de aceptar? (distancia, monto, dirección, nombre del comercio, qué pidió el cliente)
- ¿Cuánto tiempo tenés para aceptar o rechazar? ¿Qué pasa si rechazás muchos seguidos?
- ¿Podés ver cuánto vas a ganar ANTES de aceptar el pedido?
- ¿Te mandan pedidos en lote (dos o tres pickups juntos)? ¿Cómo funciona? ¿Pagan extra por eso o es la misma plata para más trabajo?
- ¿Alguna vez aceptaste un pedido y después te arrepentiste? ¿Por qué? ¿Podés cancelar sin penalización?

**Navegación y pasos:**
- ¿La app te muestra la ruta? ¿Es buena la navegación o usás Google Maps aparte?
- ¿Tenés que marcar cada paso? (llegué al comercio, retiré, en camino, entregué) ¿Es engorroso o rápido?
- ¿Tenés que sacar foto al entregar? ¿O escanear algo?

**Comunicación y bugs:**
- ¿La app te permite comunicarte con el cliente? ¿Y con el comercio? ¿Funciona bien?
- ¿Te pasó que la app se bugueó, se cerró o perdiste conexión en medio de una entrega? ¿Qué hiciste? ¿Perdiste el pedido?
- ¿Usás el Centro de Autogestión (portal web)? ¿Para qué lo usás? ¿Sirve o es confuso?

**Equipamiento:**
- ¿PedidosYa te dio mochila/equipamiento o te lo tuviste que comprar? ¿Cuánto te costó?
- ¿Te exigen usar la mochila con el logo? ¿Qué pasa si no la usás?

---

## Bloque 4 — La plata (10 min)

Este es el bloque más importante. Acá salen los dolores reales.

**Ingresos:**
- ¿Cuánto ganás en un día promedio? ¿Y en una semana buena? ¿Y en una mala?
- ¿Cuánto te pagan por pedido? ¿Es fijo o varía? ¿Sabés cómo se calcula?
- ¿Sentís que ganás lo justo por lo que hacés? ¿Qué cambiarías del modelo de pago?

**Cobro y liquidación:**
- ¿Cómo te paga PedidosYa? Tengo entendido que es semanal por transferencia (CBU). ¿Es así? ¿Hay adelantos diarios en efectivo?
- ¿Alguna vez tuviste un problema con un pago? (que no te llegó, que fue menos de lo esperado, que se demoró)
- ¿Podés ver en la app un desglose de cuánto ganaste por cada pedido, o solo ves el total semanal?

**Efectivo:**
- ¿Manejás efectivo del cliente? ¿Cómo funciona la rendición? ¿Cuánto acumulás antes de tener que devolver?
- ¿Te descuentan el efectivo del próximo pago semanal? ¿Alguna vez se complicó con eso?

**Propinas y bonos:**
- Las propinas digitales: ¿llegan enteras o PedidosYa se queda con algo? ¿Se depositan con el pago semanal?
- ¿Y las propinas en efectivo? ¿Son comunes en Ushuaia?
- ¿Te ofrecen bonos por hacer X cantidad de pedidos en un turno? ¿Son alcanzables o son un espejismo?
- ¿Hay incentivos por trabajar en horarios malos (nocturno, lluvia, feriados)?

**La pregunta clave:**
- Si pudieras elegir: ¿preferirías cobrar al instante después de cada entrega o un monto acumulado cada semana? (Esto es clave — MOOVY paga al instante)

---

## Bloque 5 — Soporte y problemas (5 min)

- Cuando tenés un problema (cliente que no aparece, dirección equivocada, pedido roto), ¿a quién recurrís?
- ¿Cuánto tardan en responderte? ¿Sentís que te ayudan o que te mandan respuestas automáticas?
- ¿Alguna vez te culparon de algo que no fue tu culpa? (pedido equivocado que armó el comercio, demora del local)
- ¿Hay algún canal de comunicación entre repartidores? (grupo de WhatsApp, foro, sindicato)
- ¿Alguna vez te suspendieron o te penalizaron? ¿Por qué? ¿Fue justo?

---

## Bloque 6 — Lo que no funciona (5 min)

Pregunta directa. Dejalo desahogarse.

- Si pudieras cambiar UNA cosa de PedidosYa mañana, ¿cuál sería?
- ¿Qué es lo que más te frustra del día a día?
- ¿Hay algo que PedidosYa te prometió cuando empezaste y después no cumplió?
- ¿Conocés repartidores que se fueron? ¿Por qué se fueron?
- ¿Sentís que PedidosYa valora a los repartidores o que son descartables?

**Sobre el algoritmo y la nueva ley:**
- ¿Sabés que desde este año la ley obliga a las plataformas a explicar cómo funciona su algoritmo de asignación? ¿Te llegó alguna info de PedidosYa sobre eso?
- ¿Sentís que el algoritmo es justo o que tiene favoritismos?
- ¿Alguna vez sentiste que el sistema te "castigó" sin explicación? (menos pedidos de golpe, turnos peores, etc.)

---

## Bloque 7 — Ushuaia específico (5 min)

Inteligencia local que no se encuentra en ningún otro lado.

- ¿Cuántos repartidores activos calculás que hay en Ushuaia para PedidosYa?
- ¿Hay momentos del año donde faltan repartidores? (temporada turística, invierno extremo)
- ¿Qué comercios mandan más pedidos? ¿Cuáles son los más organizados y cuáles un desastre?
- ¿Los turistas usan PedidosYa acá? ¿Hay diferencia con los pedidos de locales?
- ¿Hay zonas donde directamente no llegan pedidos o es inviable entregar?
- ¿Costa Susana aparece en la app? ¿Alguna vez te mandaron para allá?

---

## Bloque 8 — La propuesta MOOVY (10 min)

Ahora le contás lo que MOOVY ofrece y medís su reacción en tiempo real.

Contale estas cosas de a una y observá su cara:

1. **"En MOOVY el repartidor cobra al instante después de cada entrega."** — ¿Qué le parece? ¿Cambiaría algo para él?

2. **"El repartidor se queda con el 80% del costo real del viaje."** — ¿Es más o menos de lo que gana ahora? Pedile que haga la cuenta mental.

3. **"Hay bonus por clima (lluvia, nieve) y por horario nocturno (+30%)."** — ¿PedidosYa tiene algo así?

4. **"Hay zonas con bonus extra. Zona difícil paga más."** — ¿Le parece justo? ¿Cuáles serían las zonas difíciles de Ushuaia según él?

5. **"Antes de aceptar un pedido, ves cuánto vas a ganar."** — ¿Hoy puede hacer eso?

6. **"Soporte humano, local, que te responde en minutos."** — ¿Qué reacción genera?

7. **"Sistema de niveles: cuanto más entregas hacés, mejores condiciones tenés."** — ¿Le motiva o le parece humo?

8. **"En MOOVY no hay ranking que te obligue a aceptar pedidos malos para no perder puntaje. Vos elegís qué aceptás."** — ¿Esto le cambiaría la forma de trabajar?

9. **"No hay turnos por ranking. Te conectás cuando querés, sin reservar."** — ¿Cómo reacciona comparado con el sistema de PedidosYa?

**Pregunta de cierre del bloque**: "Si todo esto fuera real y estuviera funcionando la semana que viene, ¿te sumarías? ¿Qué necesitarías ver para confiar?"

---

## Bloque 9 — Logística de prueba piloto (5 min)

Si la entrevista fue bien y hay interés genuino:

- ¿Estaría dispuesto a participar en la etapa de prueba? (pedidos reales, pagados, pero volumen bajo al principio)
- ¿Con qué vehículo participaría?
- ¿Qué horarios tendría disponibles?
- ¿Tiene algún amigo repartidor que también estaría interesado?
- ¿Qué documentación tiene al día? (DNI, licencia, seguro, RTO)
- ¿Seguiría con PedidosYa en paralelo o lo dejaría?

---

## Cierre

Agradecele genuinamente. Decile que su input va a moldear cómo funciona la app para todos los repartidores. Dejale tu contacto y pedile el suyo.

> "Todo lo que me contaste hoy va a estar reflejado en cómo funciona MOOVY para los repartidores. No es una app que hicimos en una oficina sin preguntar — la estamos construyendo con la gente que la va a usar."

---

## Después de la entrevista — Qué hacer con la info

1. **Escuchá la grabación** y anotá las 5 frases más potentes (las que reflejan dolor real)
2. **Compará** lo que te dijo con lo que MOOVY ya tiene diseñado — ¿hay gaps?
3. **Priorizá** los 3 problemas más graves que mencionó. Si MOOVY ya los resuelve, es diferenciador confirmado. Si no, hay que resolverlos antes de lanzar.
4. **Mapa de zonas**: con lo que te cuente, validá las zonas A/B/C de MOOVY y la exclusión de Costa Susana
5. **Compensación**: hacé las cuentas de lo que gana en PedidosYa vs lo que ganaría en MOOVY con los mismos pedidos. Si MOOVY paga más, es tu argumento de venta. Si paga menos, hay que revisar la Biblia.
