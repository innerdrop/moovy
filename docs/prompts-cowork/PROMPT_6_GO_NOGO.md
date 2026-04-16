# Prompt 6 — Veredicto final: ¿Moovy está listo para lanzar?

> **Uso**: Una sola vez. Cuando creés que ya está todo. Antes de habilitar somosmoovy.com al público.
> **Salida esperada**: Veredicto binario con justificación. Sin vaguedades.

---

Leé CLAUDE.md, PROJECT_STATUS.md e ISSUES.md.

Hoy no implementás nada. Hoy **decidís si esto sale o no**.

---

## Parte 1 — Estado de issues

Listá cada issue que existía en ISSUES.md y confirmá su estado:
- ✅ Resuelto y verificado
- ⚠️ Resuelto pero no verificado en producción
- 🔴 Aún abierto
- 🔵 Convertido en deuda técnica aceptada (con justificación)

Si hay algún 🔴 abierto → el veredicto es **NO-GO**. No continuás.

---

## Parte 2 — Prueba de humo en somosmoovy.com

Ejecutás estos flujos completos en el ambiente de producción, no en staging:

**Flujo 1 — Pedido completo con pago digital**
Comprador nuevo se registra → busca un comercio → agrega producto → paga con MercadoPago → recibe confirmación → ve el tracking → el comercio entrega al repartidor con PIN de retiro → el repartidor entrega al comprador con PIN de entrega → comprador califica.

**Flujo 2 — Verificación del sistema PIN**
Intentar marcar "entregado" sin ingresar el PIN del comprador → el sistema debe bloquearlo.
Completar el flujo con PIN correcto → pedido se cierra, ganancias reflejadas.

**Flujo 3 — No-entrega**
Repartidor marca "no pude entregar" → sistema exige foto → pedido pasa a "en devolución" → costo de envío retenido correctamente, solo el producto se reembolsa.

**Flujo 4 — Subasta completa**
Vendedor publica producto en subasta → ofertante hace oferta → subasta cierra → ganador recibe notificación → ganador puede ir al checkout y pagar → envío se coordina.

**Flujo 5 — Pago rechazado**
Comprador intenta pagar → MercadoPago rechaza → ve mensaje de error claro → puede reintentar sin que el pedido quede en estado raro.

**Flujo 6 — Autocompra bloqueada**
Usuario intenta comprar su propio producto del marketplace → sistema lo bloquea con mensaje claro.

Por cada flujo: ✅ completo sin problemas / ⚠️ con problemas menores / 🔴 roto.

Si hay algún flujo 🔴 → el veredicto es **NO-GO**.

---

## Parte 3 — Preguntas de negocio

Respondé sí / no / parcial:

- ¿Puede un comercio de Ushuaia registrarse hoy sin ayuda técnica?
- ¿Puede un repartidor registrarse hoy sin ayuda técnica?
- ¿El sistema PIN doble está implementado y funciona en los 6 flujos descritos?
- ¿El flujo de subastas está completo: oferta → cierre → pago → envío?
- ¿Un usuario puede comprar sus propios productos? (debe ser NO)
- ¿El mapa de seguimiento funciona correctamente en ambas versiones?
- ¿El admin tiene visibilidad completa en tiempo real?
- ¿Hay alguna operación de dinero que pueda quedar sin registro?
- ¿Costa Susana muestra mensaje de zona sin cobertura?
- ¿Hay algún mensaje visible al usuario que diga "lorem ipsum", "TODO" o esté en inglés?

Si hay algún "no" en las primeras dos o en la pregunta del sistema PIN → documentarlo antes del veredicto.

---

## Parte 4 — Deuda técnica aceptada

Listá todo lo que NO está resuelto pero que conscientemente decidís lanzar igual:

```
- [descripción] → [por qué es aceptable lanzar con esto] → [cuándo se resuelve]
```

Máximo 5 ítems. Si hay más de 5, el producto no está listo.

---

## Parte 5 — Veredicto

### ✅ GO — Moovy puede lanzar
```
VEREDICTO: GO
Fecha: [fecha]
Issues críticos abiertos: 0
Flujos de humo: 6/6 ✅
Deuda técnica aceptada: [N] items
Próximo hito post-lanzamiento: [qué se hace la semana siguiente]
```

### 🔴 NO-GO — Moovy no puede lanzar todavía
```
VEREDICTO: NO-GO
Razón principal: [la más grave, una línea]
Issues bloqueantes: [lista]
Flujos rotos: [lista]
Estimación para GO: [X días con dedicación full]
Próxima sesión: empezá por [issue específico]
```

---

**Regla final**: Si dudás entre GO y NO-GO, es NO-GO. Una ciudad de 80.000 habitantes no perdona un lanzamiento caído. El boca a boca destruye en 24 horas lo que tardó meses en construirse.
