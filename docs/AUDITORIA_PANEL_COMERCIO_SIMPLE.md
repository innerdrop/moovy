# Qué encontré en el panel del comercio — explicado simple
Fecha: 2026-07-07 · Versión para leer sin saber programar. (El detalle técnico está en AUDITORIA_PANEL_COMERCIO.md, ese es para Claude.)

---

## GRUPO 1 — El panel le muestra números de plata equivocados al comercio

**1. Los "Ingresos de Hoy" están inflados.**
- *Qué pasa hoy*: si un cliente compra $10.000 en productos y paga $2.000 de envío, el panel le dice al comercio "hoy ingresaste $12.000".
- *Por qué está mal*: los $2.000 del envío no son del comercio — son del repartidor y de Moovy. El comercio va a comparar ese número con la plata que le llegó a su MercadoPago y no le va a cerrar. Va a pensar que Moovy le debe plata.
- *Qué voy a hacer*: que el panel muestre solo la plata que es del comercio.

**2. El contador "Pedidos de hoy (completados)" miente.**
- *Qué pasa hoy*: dice "completados" pero cuenta todos los pedidos, incluso los cancelados y los que todavía no salieron.
- *Qué voy a hacer*: que cuente lo que dice contar.

**3. La lista "Pedidos Recientes" tiene dos problemas.**
- Muestra el monto con el envío incluido (mismo problema del punto 1).
- Los estados aparecen en inglés: "PENDING", "PREPARING". Tu kiosquero de Ushuaia no tiene por qué saber inglés.
- *Qué voy a hacer*: montos correctos y estados en español ("Pendiente", "Preparando").

**4. La pantalla "Pagos" también suma el envío en "Ventas totales".**
- Igual que el punto 1, pero en otra pantalla.

**5. El porcentaje de comisión que se muestra puede no coincidir con lo cobrado.**
- *Qué pasa hoy*: la pantalla muestra la comisión de HOY (por ejemplo 10%). Pero si un pedido viejo se cobró con otra comisión (por ejemplo 0% del primer mes gratis), los números de esa lista no coinciden con el porcentaje del cartel.
- *Qué voy a hacer*: que cada pedido muestre la comisión con la que realmente se cobró.

**En resumen el Grupo 1**: es como si el recibo de sueldo dijera un número y el banco te depositara otro. Todo lo de este grupo va en una sola tanda de trabajo.

---

## GRUPO 2 — Un problema de seguridad/confiabilidad invisible pero importante

**El problema, con una analogía**: cuando alguien entra a Moovy, le damos un "carnet" que dice quién es y qué puede hacer. Ese carnet dura 7 días. El problema: varias funciones del panel del comercio revisan el CARNET en vez de preguntar a la BASE DE DATOS (la verdad actualizada).

**¿Por qué importa?** Dos situaciones reales:
- Un comercio recién aprobado entra al panel y le dice "No autorizado" — porque su carnet viejo todavía dice que no es comercio. (Este bug ya nos pasó en junio y lo arreglamos en una parte; ahora encontré que quedaron 9 funciones más con el mismo defecto, incluyendo "guardar mi perfil" y "abrir/cerrar tienda".)
- Al revés: si algún día suspendés a un comercio, podría seguir operando hasta 7 días con el carnet viejo.

**Qué voy a hacer**: que esas 9 funciones pregunten siempre a la base de datos, como ya hacen las demás.

---

## GRUPO 3 — Limpieza y pulido (varias cositas chicas)

1. **Una pantalla que debería estar oculta, está accesible.** Vos decidiste que "Paquetes" no se use en el lanzamiento (está apagado en tu panel de control). Pero quedó una pantalla y un botón del menú que no respetan ese apagado.
2. **Dos "puertas de servicio" que ya no llevan a ningún lado.** Código viejo que nadie usa. Se borra para que no confunda.
3. **La pantalla de Reseñas tarda más de lo necesario.** Para averiguar un dato chiquito, pide un informe gigante. Se cambia por la pregunta chiquita.
4. **Si falla la conexión, el panel se queda mudo.** En varias pantallas, si internet falla, el comercio no ve ningún aviso — parece que no hay pedidos cuando en realidad no cargaron. Se agregan avisos de "no pudimos cargar, reintentá".
5. **Precio inventado en Paquetes.** Si a una pantalla le falta el precio configurado, muestra "$500" inventado en vez de avisar que falta configurar. Con tu regla de "si falta config, no operar", se corrige.
6. **Ventanitas de confirmación feas.** Algunas confirmaciones ("¿Eliminar producto?") usan el cartel gris del navegador en vez del diseño de Moovy. Se unifican.
7. **Faltan acentos** en algunos textos ("configuracion" → "configuración").

---

## LA DECISIÓN QUE TENÉS QUE TOMAR VOS

**Existe una "medalla de nivel" para comercios que nunca se mostró.**

Te explico: tu sistema de comisiones tiene niveles — BRONCE (10%), PLATA (9%), ORO (8%), DIAMANTE (7%). Cuanto más vende un comercio, sube de nivel y **paga menos comisión**. Eso ya funciona por detrás: las comisiones se cobran bien según el nivel.

Lo que descubrí: alguien programó una tarjetita visual preciosa que le muestra al comercio "Sos nivel BRONCE, te faltan X ventas para ser PLATA y pagar 9% en vez de 10%"... y quedó guardada en un cajón. Nunca se puso en ninguna pantalla.

**Tus opciones:**
- **(a) Mostrarla en el panel del comercio** — mi recomendación: es gratis (ya está hecha, solo hay que "colgarla"), y le da al comercio un motivo para vender más con Moovy. Es el mismo truco de las aerolíneas con las millas.
- **(b) Borrarla** — si no querés que los comercios sepan de los niveles todavía.
- **(c) Dejarla en el cajón** y decidir después del lanzamiento.

---

## Orden de trabajo propuesto

1. **Grupo 1** (números de plata) — lo más urgente: es la confianza del comercio.
2. **Grupo 2** (el carnet viejo) — invisible pero te evita soporte y riesgos.
3. **Grupo 3** (limpieza) — pulido final.
4. Tu decisión de la medalla — cuando quieras, no bloquea nada.
