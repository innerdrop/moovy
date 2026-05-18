# Moovy — Pre-Launch QA Checklist

> Documento vivo de control de calidad antes del lanzamiento público.
>
> **Cómo usarlo**:
>
> - Cada item es un **test** que tenés que ejecutar. Marcalo con su estado real.
> - Estados: `[ ]` pendiente · `[✅]` pasa · `[❌]` falla · `[⚠️]` parcial / con observaciones · `[🚫]` bloqueado por otra cosa
> - Criticidad: 🔴 bloquea el lanzamiento (si falla, no lanzamos) · 🟡 no bloquea (se puede arreglar después)
> - Cada item tiene dos secciones para que cualquiera pueda probarlo:
>   - **Cómo probarlo**: los pasos concretos a seguir
>   - **Qué deberías ver**: lo que tiene que pasar si funciona bien
> - Si algo falla, sumá una observación con `Obs:` indicando qué pasó.
> - Cuando termines, abrí el HTML companion (`prelaunch-checklist.html`) o pedile a Claude "leé el checklist y armá el plan de acción"
>
> **Última actualización**: 2026-05-17

---

## 🛒 Buyer (Comprador)

### Registro y login

- [ ] 🔴 **Crear una cuenta nueva**
  - **Cómo probarlo**: Entrá a `/empezar`. Completá un email que NO hayas usado antes en Moovy, una contraseña, tu nombre y apellido. Aceptá los términos y condiciones. Dale "Crear cuenta".
  - **Qué deberías ver**: Quedás logueado automáticamente (tu nombre aparece arriba). En pocos minutos te llega a la casilla un email de bienvenida con el asunto "Bienvenido a Moovy" — si no aparece, revisá spam.

- [ ] 🔴 **No se puede crear cuenta con un email que ya fue eliminado**
  - **Cómo probarlo**: Probá crear cuenta con un email de un usuario que ya borraste o que pediste eliminar de Moovy.
  - **Qué deberías ver**: Te sale un mensaje claro tipo "Este email no se puede usar" o similar. NO te permite crear la cuenta nueva con ese mismo email.

- [ ] 🔴 **Sin aceptar términos no se puede registrar**
  - **Cómo probarlo**: Empezá a crear una cuenta pero no toques el checkbox de "Acepto los términos". Intentá darle a "Crear cuenta".
  - **Qué deberías ver**: El botón está bloqueado o te tira un error que dice que tenés que aceptar los términos. Cuando los aceptás, ahí sí podés crear cuenta.

- [ ] 🔴 **Login con email y contraseña correctos**
  - **Cómo probarlo**: Andá a `/login`, escribí tu email y contraseña, dale "Ingresar".
  - **Qué deberías ver**: Te lleva al inicio de la tienda y arriba a la derecha aparece tu nombre. Si cerrás y volvés a abrir el browser, seguís logueado por hasta 7 días.

- [ ] 🔴 **Login con contraseña incorrecta lo bloquea**
  - **Cómo probarlo**: Andá a `/login`, escribí tu email correcto pero una contraseña inventada. Dale "Ingresar".
  - **Qué deberías ver**: Te aparece un mensaje claro "Credenciales inválidas" o "Email o contraseña incorrectos". NO te logueás.

- [ ] 🟡 **Recuperar contraseña olvidada**
  - **Cómo probarlo**: En `/login`, click en "Olvidé mi contraseña". Poné tu email. Revisá la casilla, abrí el link de recuperación, elegí una nueva contraseña.
  - **Qué deberías ver**: Te llega el email con el link en pocos minutos. El link te lleva a una página para poner contraseña nueva. Después podés loguear con la nueva.

- [ ] 🔴 **Cerrar sesión limpia los datos**
  - **Cómo probarlo**: Logueado, andá a tu perfil y dale "Cerrar sesión".
  - **Qué deberías ver**: Te lleva a la pantalla de inicio sin tu nombre arriba. Si refrescás, seguís deslogueado. NO ves más tu carrito ni tus pedidos.

- [ ] 🟡 **Una cuenta auto-eliminada no puede volver a entrar**
  - **Cómo probarlo**: Eliminate la cuenta desde el perfil. Después intentá loguear con el mismo email y contraseña.
  - **Qué deberías ver**: NO te deja loguear. Te aparece un mensaje sugiriendo que contactes soporte si querés recuperar la cuenta.

### Tienda y navegación

- [ ] 🔴 **La página de inicio carga rápido**
  - **Cómo probarlo**: Abrí `https://somosmoovy.com` en una pestaña incógnito. Cronometrá hasta que ves el contenido completo (no solo el spinner).
  - **Qué deberías ver**: Carga en menos de 3 segundos en conexión normal. Aparecen el banner principal, las categorías y los comercios destacados. En 3G simulado (DevTools → Network → Slow 3G) debería seguir cargando antes de los 6-8 segundos.

- [ ] 🔴 **Comercios sin logo no aparecen en la tienda pública**
  - **Cómo probarlo**: En el panel OPS, dejá un comercio sin foto/logo subido. Después entrá a la tienda como comprador y buscá ese comercio en el listado de la categoría.
  - **Qué deberías ver**: El comercio NO aparece. Los compradores solo ven comercios que ya tienen logo cargado.

- [ ] 🔴 **Comercios todavía no aprobados no aparecen en la tienda**
  - **Cómo probarlo**: Creá un comercio nuevo en estado pendiente de aprobación (sin aprobarlo todavía desde OPS). Entrá a la tienda como comprador.
  - **Qué deberías ver**: El comercio pendiente NO aparece a los compradores. Solo aparece cuando lo aprobás desde OPS.

- [ ] 🔴 **Las categorías filtran bien los comercios**
  - **Cómo probarlo**: En la home, click en una categoría como "Restaurantes" o "Pizzería".
  - **Qué deberías ver**: La página solo muestra comercios de esa categoría. Si vas a "Heladería", no deberías ver pizzerías.

- [ ] 🔴 **La búsqueda encuentra lo que buscás**
  - **Cómo probarlo**: En la barra de búsqueda escribí el nombre de un comercio o producto que sabés que existe.
  - **Qué deberías ver**: Aparecen resultados relevantes en menos de medio segundo. El comercio/producto buscado figura entre los primeros.

- [ ] 🟡 **Buscar algo que no existe muestra mensaje amigable**
  - **Cómo probarlo**: Buscá algo random como "xyzabc123".
  - **Qué deberías ver**: NO ves una pantalla en blanco. Aparece un mensaje tipo "No encontramos resultados" con un botón para volver al inicio.

- [ ] 🔴 **Comercio cerrado por horario se ve como cerrado**
  - **Cómo probarlo**: Entrá a la página de un comercio en un horario en que sabés que está cerrado (ej. de noche si abre solo de día).
  - **Qué deberías ver**: Aparece un cartel claro "Cerrado" + el próximo horario de apertura. NO podés agregar productos al carrito.

- [ ] 🔴 **Comercios fuera de zona de cobertura muestran mensaje**
  - **Cómo probarlo**: Configurá tu dirección de entrega en una zona que sabés que NO cubre Moovy. Entrá a un comercio.
  - **Qué deberías ver**: Aparece un mensaje "No entregamos en esta zona" o similar. NO podés finalizar la compra.

### Carrito y compra

- [ ] 🔴 **Agregar producto al carrito desde la home**
  - **Cómo probarlo**: En la home o en un comercio, click "Agregar al carrito" en un producto.
  - **Qué deberías ver**: Aparece un cartelito (toast) tipo "Producto agregado". El contador del icono de carrito en el menú de abajo sube en 1.

- [ ] 🔴 **Subir y bajar cantidad de un producto en el carrito**
  - **Cómo probarlo**: Abrí el carrito. Usá los botones + y − para cambiar cantidades de un producto.
  - **Qué deberías ver**: El subtotal de ese producto se recalcula bien (si vale $500 y ponés 3, el subtotal del producto es $1.500). El total del carrito también se actualiza.

- [ ] 🔴 **Eliminar un producto del carrito**
  - **Cómo probarlo**: En el carrito, click en el icono de tacho o "X" de un producto.
  - **Qué deberías ver**: El producto desaparece de la lista. El total se ajusta al nuevo monto sin ese producto.

- [ ] 🔴 **El carrito no se pierde si cerrás el browser**
  - **Cómo probarlo**: Agregá productos al carrito. Cerrá la pestaña o el browser completo. Volvelo a abrir y entrá a Moovy.
  - **Qué deberías ver**: Los productos siguen en el carrito tal como los dejaste. Esto requiere que estés logueado.

- [ ] 🔴 **Pago con MercadoPago (sandbox)**
  - **Cómo probarlo**: Hacé un pedido y elegí pago con MercadoPago. Usá una tarjeta de prueba (ej. 4509 9535 6623 3704, vencimiento 11/30, CVV 123).
  - **Qué deberías ver**: Te lleva a la página de MercadoPago. Después de pagar te trae de vuelta a Moovy con un cartel "Pago confirmado". El pedido aparece en `/mis-pedidos` con estado "Confirmado".

- [ ] 🔴 **Pago en efectivo cuando está activado en OPS**
  - **Cómo probarlo**: Desde OPS asegurate que el flag `buyer.cash-payment` esté en ON. Después como buyer, hacé un pedido y en el checkout elegí pagar al recibir con efectivo.
  - **Qué deberías ver**: El pedido se crea sin pasar por MercadoPago. Queda como "Esperando confirmación del comercio". El driver te lo cobra cuando llega.

- [ ] 🔴 **Pago en efectivo desactivado en OPS no aparece**
  - **Cómo probarlo**: Desde OPS poné el flag `buyer.cash-payment` en OFF. Como buyer, andá al checkout.
  - **Qué deberías ver**: La opción "Pagar en efectivo" NO aparece. Solo se ve MercadoPago. Si la había antes, desaparece después del cambio.

- [ ] 🔴 **Pedidos programados (entregar más tarde)**
  - **Cómo probarlo**: Asegurate que el flag de entregas programadas esté en ON en OPS. En el checkout elegí "Entregar más tarde" y seleccioná una franja horaria.
  - **Qué deberías ver**: El pedido se crea con una etiqueta "Programado" y la hora elegida. NO se asigna un driver inmediatamente — el comercio tiene tiempo de prepararlo.

- [ ] 🔴 **Cupón válido aplica descuento**
  - **Cómo probarlo**: En el checkout, escribí el código de un cupón válido que tengas y dale "Aplicar".
  - **Qué deberías ver**: El total baja por el monto del descuento. El cupón aparece confirmado con un check verde. El descuento lo absorbe Moovy, no el comercio (verificable después en el detalle del pedido).

- [ ] 🟡 **Cupón vencido o mal escrito da error específico**
  - **Cómo probarlo**: Probá poner un cupón inventado o uno que sepas que está vencido.
  - **Qué deberías ver**: Aparece un error claro tipo "Cupón inválido" o "Cupón vencido". NO aplica descuento.

- [ ] 🔴 **Usar puntos MOOVER para descuento**
  - **Cómo probarlo**: Andá al checkout teniendo al menos 500 puntos en tu cuenta. Buscá el widget de "Usar mis puntos" y ponete a usar puntos.
  - **Qué deberías ver**: Podés usar mínimo 500 puntos, máximo hasta el 20% del subtotal del pedido. El total baja por el equivalente en pesos (1 punto = $1). Si tu pedido es $2.000, podés usar máximo 400 puntos.

- [ ] 🔴 **No se puede pagar $0**
  - **Cómo probarlo**: Aplicá tantos descuentos / puntos que el total llegue a $0 o negativo.
  - **Qué deberías ver**: NO te deja confirmar el pedido. Aparece un mensaje tipo "El monto mínimo es X" o similar. El sistema debe pedir siempre un pago positivo.

- [ ] 🔴 **Pedidos fuera de zona de cobertura se bloquean**
  - **Cómo probarlo**: Configurá tu dirección de entrega en una zona que está marcada como excluida en OPS. Intentá hacer un pedido.
  - **Qué deberías ver**: NO te deja confirmar. Aparece un mensaje "No entregamos en esta zona" antes de pagar.

- [ ] 🔴 **Comercio que pausa la tienda durante tu checkout**
  - **Cómo probarlo**: Tené el checkout abierto. Pedile a alguien con acceso al panel del comercio que pause la tienda (o hacelo vos en otra pestaña). Intentá confirmar el pedido.
  - **Qué deberías ver**: Aparece un mensaje claro "Este comercio cerró temporalmente". NO se confirma el pedido. Te invita a volver más tarde.

- [ ] 🔴 **Producto sin stock durante el checkout**
  - **Cómo probarlo**: Tené el checkout abierto con un producto. Desde el panel del comercio bajá el stock de ese producto a 0. Volvé al checkout e intentá confirmar.
  - **Qué deberías ver**: El producto sin stock se marca como no disponible. Te deja continuar la compra sin ese producto, no te bloquea el resto.

### Seguir el pedido

- [ ] 🔴 **Mis pedidos lista todos tus pedidos**
  - **Cómo probarlo**: Entrá a `/mis-pedidos` después de haber hecho varios pedidos.
  - **Qué deberías ver**: Aparece la lista completa de tus pedidos con los más recientes primero. Cada uno muestra el número, el comercio, el estado actual, la fecha y el total.

- [ ] 🔴 **Filtros entre pedidos activos y finalizados**
  - **Cómo probarlo**: En `/mis-pedidos`, alterná entre los filtros "Activos" y "Finalizados".
  - **Qué deberías ver**: "Activos" muestra solo los que están en curso (esperando, confirmados, en camino). "Finalizados" muestra los entregados y los cancelados.

- [ ] 🔴 **Ver detalle del pedido**
  - **Cómo probarlo**: En `/mis-pedidos`, tocá un pedido para abrirlo.
  - **Qué deberías ver**: Te lleva a `/mis-pedidos/[id]` con el detalle completo: estado actual, productos, total, dirección de entrega, datos del comercio y (si ya hay) del driver.

- [ ] 🔴 **El estado del pedido se actualiza en vivo**
  - **Cómo probarlo**: Tené abierta la pantalla de detalle del pedido. Pedile a alguien del comercio que confirme el pedido desde su panel.
  - **Qué deberías ver**: La pantalla se actualiza SOLA en pocos segundos. NO hace falta refrescar manualmente. El estado cambia de "Pendiente" a "Confirmado" automáticamente.

- [ ] 🔴 **El mapa del tracking se mueve con el repartidor**
  - **Cómo probarlo**: Cuando el pedido tiene driver asignado y está en camino, abrí el detalle del pedido en el celular.
  - **Qué deberías ver**: Aparece un mapa con la posición del driver. Cada 10 segundos aproximadamente se actualiza y ves cómo se va acercando.

- [ ] 🔴 **Aviso cuando el repartidor está cerca**
  - **Cómo probarlo**: Esperá hasta que el driver esté a menos de 500 metros de tu dirección.
  - **Qué deberías ver**: Te llega una notificación push (si las tenés habilitadas) diciendo que el driver está cerca. También aparece un cartel destacado en la app.

- [ ] 🔴 **Chat con el comercio mientras el pedido está activo**
  - **Cómo probarlo**: En el detalle del pedido (estado entre Pendiente y Listo), buscá el botón de chat con el comercio. Mandá un mensaje.
  - **Qué deberías ver**: El mensaje aparece en la pantalla del comercio. Sus respuestas vuelven al chat en vivo, sin refrescar.

- [ ] 🔴 **Chat con el repartidor desde que está asignado hasta la entrega**
  - **Cómo probarlo**: Cuando el pedido pasa a "Repartidor asignado", buscá el chat con el driver y mandá un mensaje.
  - **Qué deberías ver**: El driver lo recibe en su app y puede responderte. El chat queda disponible hasta que el pedido se entrega.

- [ ] 🔴 **Después de entregado se ocultan los chats y teléfonos**
  - **Cómo probarlo**: Una vez que el pedido pasa a "Entregado", abrí su detalle.
  - **Qué deberías ver**: Los botones de chat y de llamar al comercio o al driver desaparecen. Ya no podés contactarlos directamente desde la app.

- [ ] 🟡 **Acceso a soporte visible en cualquier momento**
  - **Cómo probarlo**: En el detalle de un pedido, busca el botón de soporte en cualquier estado (pendiente, en camino, entregado).
  - **Qué deberías ver**: Siempre hay un acceso visible a soporte (botón "Ayuda" o "¿Tenés problemas?"). Te lleva a contactar al equipo de Moovy.

- [ ] 🔴 **Modal de calificación aparece después de entregado**
  - **Cómo probarlo**: Cuando un pedido se marca como "Entregado", abrí la app (o ya estaba abierta).
  - **Qué deberías ver**: Aparece automáticamente una ventana grande para calificar el pedido, con estrellas para el comercio y para el repartidor.

- [ ] 🔴 **El modal NO se tapa con la barra de navegación**
  - **Cómo probarlo**: Abrí el modal de calificación en un celular. Probá mover el dedo y ver si todos los botones del modal están visibles.
  - **Qué deberías ver**: Se ven completos los botones "Calificar más tarde" y "Enviar y cerrar". NADA queda tapado por la barra de navegación de abajo.

- [ ] 🔴 **Si cerrás el modal sin calificar, vuelve a aparecer**
  - **Cómo probarlo**: Cuando aparezca el modal de calificación, cerralo con la X o con "Calificar más tarde". Cerrá y reabrí la app, o volvé al detalle del pedido.
  - **Qué deberías ver**: El modal vuelve a aparecer hasta que califiques. Si nunca calificás, sigue apareciendo en los próximos accesos al pedido entregado.

- [ ] 🔴 **Calificar al repartidor guarda la calificación correctamente**
  - **Cómo probarlo**: En el modal post-entrega, calificá al driver con estrellas y un comentario opcional. Click "Enviar".
  - **Qué deberías ver**: El modal se cierra con un toast "¡Gracias por tu calificación!". El pedido sigue en estado "Entregado" (no vuelve a Pendiente ni cambia). La calificación queda guardada y el promedio del driver se actualiza.

- [ ] 🔴 **Calificar al comercio guarda sin afectar el pedido**
  - **Cómo probarlo**: En el modal, calificá al comercio con estrellas y comentario. Enviá.
  - **Qué deberías ver**: Se guarda la calificación. El pedido sigue siendo "Entregado". Si el comentario tiene insultos o palabras prohibidas, queda como "pendiente de moderación" hasta que OPS lo revise.

### Puntos MOOVER

- [ ] 🔴 **El botón MOOVER está siempre visible**
  - **Cómo probarlo**: Mirá el menú de abajo en cualquier pantalla del comprador (logueado o no).
  - **Qué deberías ver**: El círculo central rojo con la estrella (MOOVER) está SIEMPRE visible. NO se puede ocultar desde OPS.

- [ ] 🔴 **Pantalla de puntos muestra tu saldo**
  - **Cómo probarlo**: Tocá el orbe MOOVER del menú de abajo, o andá a `/puntos`.
  - **Qué deberías ver**: Ves tu saldo actual de puntos, el total ganado en tu historia, y el valor equivalente en pesos.

- [ ] 🔴 **Ganás puntos cuando el pedido se marca como entregado**
  - **Cómo probarlo**: Hacé un pedido por ejemplo de $1.000. Esperá a que se marque como Entregado.
  - **Qué deberías ver**: Te llegan al saldo 10 puntos por cada $1.000 gastados (puede ser más si tu nivel es más alto). Si gastaste $2.500, tu saldo sube en 25 puntos.

- [ ] 🔴 **Los puntos no se duplican si el pedido se entrega dos veces**
  - **Cómo probarlo**: Pedile a OPS o a alguien técnico que vuelva a disparar el evento de entrega del mismo pedido. O simulalo de alguna forma.
  - **Qué deberías ver**: Tu saldo NO se duplica. Los puntos se asignan una sola vez por pedido, no importa cuántas veces se procese el evento.

- [ ] 🔴 **Usar puntos en el checkout (1 punto = $1)**
  - **Cómo probarlo**: En el checkout con un pedido de $2.000, usá 400 puntos (que son el máximo del 20%).
  - **Qué deberías ver**: El total baja $400. Si intentás usar más de 400 puntos (20% del pedido) o menos de 500 puntos (mínimo), te bloquea.

- [ ] 🔴 **Subir de nivel automáticamente al hacer pedidos**
  - **Cómo probarlo**: Completá 5 pedidos en los últimos 90 días para llegar a SILVER. Después llegá a 15 para GOLD, y a 40 para BLACK.
  - **Qué deberías ver**: Cuando llegás a esos números, tu nivel cambia automáticamente. En la pantalla de puntos se ve tu nivel actual.

- [ ] 🔴 **El saldo nunca queda negativo**
  - **Cómo probarlo**: Intentá usar más puntos de los que tenés en el checkout, o hacé acciones rápidas concurrentes.
  - **Qué deberías ver**: El sistema NO permite que el saldo baje de 0. Si pasa algo raro, te muestra un error claro.

- [ ] 🟡 **Cancelar un pedido devuelve los puntos usados y reversa los ganados**
  - **Cómo probarlo**: Hacé un pedido usando puntos. Cancelá el pedido (o pedile al comercio que lo rechace).
  - **Qué deberías ver**: Los puntos que habías usado vuelven a tu saldo. Si ya te habían dado puntos por ese pedido al entregarlo, esos se descuentan.

- [ ] 🟡 **Los puntos se vencen a los 6 meses sin actividad**
  - **Cómo probarlo**: Esto es difícil de testear en menos tiempo, pero podés revisar la lógica con el equipo técnico o probar acelerando el cron.
  - **Qué deberías ver**: Si pasaste 6 meses sin hacer pedidos, los puntos viejos vencen y se descuentan automáticamente.

- [ ] 🟡 **Bonus al crear cuenta**
  - **Cómo probarlo**: Creá una cuenta nueva.
  - **Qué deberías ver**: Te llegan automáticamente 1.000 puntos de regalo (durante el primer mes desde el lanzamiento) o 500 puntos (después del mes 1).

- [ ] 🟡 **Bonus de referidos al completar el primer pedido**
  - **Cómo probarlo**: Compartí tu link de referido. Que tu amigo se registre con ese link y haga su primer pedido. Esperá a que se entregue.
  - **Qué deberías ver**: Cuando ese pedido se marca como entregado, vos recibís 1.000 puntos y tu amigo 500. NO se otorgan al registrarse, solo al completar el primer pedido.

### Marketplace

- [ ] 🔴 **El botón Marketplace está siempre visible**
  - **Cómo probarlo**: Mirá el menú de abajo en cualquier pantalla del comprador.
  - **Qué deberías ver**: El icono de Marketplace (tienda) está SIEMPRE visible. NO se puede ocultar desde OPS.

- [ ] 🔴 **La pantalla de Marketplace carga los productos**
  - **Cómo probarlo**: Tocá el botón "Marketplace" en el menú.
  - **Qué deberías ver**: Ves la lista de productos de vendedores particulares (no comercios). Cada uno con su foto, precio y nombre del vendedor.

- [ ] 🔴 **Filtros del Marketplace funcionan**
  - **Cómo probarlo**: En Marketplace, probá filtrar por categoría, rango de precio y condición (nuevo / usado / reacondicionado).
  - **Qué deberías ver**: La lista se actualiza dejando solo los productos que cumplen los filtros aplicados.

- [ ] 🔴 **Buscar dentro del Marketplace**
  - **Cómo probarlo**: Escribí el nombre de un producto en la barra de búsqueda del Marketplace.
  - **Qué deberías ver**: Aparecen solo los listings que matchean. La búsqueda funciona en los nombres y descripciones.

- [ ] 🔴 **Ver detalle de un producto del Marketplace**
  - **Cómo probarlo**: Tocá un producto del listado.
  - **Qué deberías ver**: Te lleva al detalle con todas las fotos, descripción completa, precio y datos del vendedor.

- [ ] 🔴 **Comprar un producto del Marketplace**
  - **Cómo probarlo**: Agregá un listing al carrito y procesá la compra.
  - **Qué deberías ver**: Se crea un pedido con ese producto. El vendedor recibe la notificación, no el comercio (porque el item es del marketplace).

### Perfil y datos personales

- [ ] 🔴 **Mi perfil muestra los datos correctos**
  - **Cómo probarlo**: Andá a `/mi-perfil`.
  - **Qué deberías ver**: Aparecen tu nombre, email, teléfono y dirección. Todo coincide con lo que ingresaste al registrarte.

- [ ] 🔴 **Editar dirección con autocompletado de Google**
  - **Cómo probarlo**: En mi perfil, click "Editar dirección". Empezá a escribir tu dirección.
  - **Qué deberías ver**: Aparecen sugerencias de Google Places mientras escribís. Al elegir una, se completa con la calle y número correctos.

- [ ] 🔴 **Cambiar contraseña**
  - **Cómo probarlo**: En mi perfil, click "Cambiar contraseña". Poné la actual, la nueva 2 veces, dale "Guardar".
  - **Qué deberías ver**: Te confirma con un mensaje "Contraseña actualizada". En el próximo login tenés que usar la nueva.

- [ ] 🟡 **Direcciones múltiples (Casa, Trabajo, etc.)**
  - **Cómo probarlo**: Si está implementado, agregá una segunda dirección. En el checkout elegí cuál usar.
  - **Qué deberías ver**: Podés guardar varias direcciones y elegirlas como "Casa", "Trabajo", etc. En el checkout aparece el selector.

- [ ] 🔴 **Eliminar mi cuenta (auto-delete)**
  - **Cómo probarlo**: En mi perfil → Eliminar mi cuenta. Confirmá.
  - **Qué deberías ver**: Tu cuenta queda eliminada. El email se anonimiza (queda como "deleted-xxx@moovy"). Te cierra sesión inmediatamente.

- [ ] 🔴 **Notificaciones push funcionan**
  - **Cómo probarlo**: Cuando entrás por primera vez, te pide permisos para enviar notificaciones. Acept.
  - **Qué deberías ver**: Después, cuando pasa algo importante (driver cerca, pedido confirmado, etc.) recibís notificaciones aunque no tengas la app abierta.

---

## 🏪 Comercio (Merchant)

### Registro y aprobación

- [ ] 🔴 **Registrarse como comercio**
  - **Cómo probarlo**: Andá a `/comercios/registro`. Completá todos los datos requeridos (nombre del comercio, dirección, contacto, CUIT, etc.).
  - **Qué deberías ver**: Después del registro queda pendiente de aprobación. NO podés operar todavía. Te llega un email confirmando el registro y diciéndote que esperes la aprobación.

- [ ] 🔴 **Email confirmando que tu solicitud fue recibida**
  - **Cómo probarlo**: Después de registrarte, revisá la casilla del email que usaste.
  - **Qué deberías ver**: En pocos minutos te llega un email "Recibimos tu registro" o similar. Si no aparece, revisá spam.

- [ ] 🔴 **Subir documentos requeridos**
  - **Cómo probarlo**: Ya registrado pero pendiente, andá a la sección "Mis documentos". Subí DNI, CUIT, monotributo y lo que pida la lista.
  - **Qué deberías ver**: Cada documento se sube por separado y queda con estado "Pendiente". Te confirma con un check cada vez que subís uno.

- [ ] 🔴 **El CUIT se valida con la regla oficial**
  - **Cómo probarlo**: En el registro o al subir el CUIT, escribí un número que NO sea un CUIT válido (ej. 20-12345678-1).
  - **Qué deberías ver**: El sistema lo rechaza con un mensaje específico tipo "CUIT inválido". Solo acepta CUITs con el dígito verificador correcto.

- [ ] 🔴 **OPS aprueba documento por documento**
  - **Cómo probarlo**: Desde OPS, abrí el comercio pendiente. Aprobá los documentos de a uno (no todos juntos). Después de aprobar el último requerido, el comercio se activa automáticamente.
  - **Qué deberías ver**: Cada documento cambia su estado individual. Cuando TODOS los obligatorios están aprobados, el comercio pasa de "Pendiente" a "Aprobado" SIN un click adicional.

- [ ] 🔴 **Aprobación con documento físico pide una nota**
  - **Cómo probarlo**: En OPS, elegí aprobar un documento con la opción "Aprobado físicamente" (no por documento digital).
  - **Qué deberías ver**: Te obliga a escribir una nota de al menos 5 caracteres explicando por qué. NO te deja aprobar sin justificación.

- [ ] 🔴 **Rechazar documento con motivo**
  - **Cómo probarlo**: En OPS, rechazá un documento de un comercio escribiendo el motivo (ej. "Foto borrosa").
  - **Qué deberías ver**: El comercio recibe una notificación con el motivo. El documento queda en estado "Rechazado". El comercio puede volver a subirlo.

- [ ] 🔴 **Email cuando se aprueba el comercio**
  - **Cómo probarlo**: Aprobá todos los documentos requeridos de un comercio. Revisá la casilla del comercio.
  - **Qué deberías ver**: Le llega un email "¡Tu comercio fue aprobado!" o similar, dándole la bienvenida y explicándole los próximos pasos.

- [ ] 🔴 **No se pueden editar documentos aprobados**
  - **Cómo probarlo**: Como comercio con documentos aprobados, intentá cambiar el CUIT o el DNI subidos.
  - **Qué deberías ver**: NO te deja editar directamente. Te muestra un mensaje "Para cambiar este documento, contactá soporte" o requiere abrir un pedido de cambio formal.

- [ ] 🟡 **Pedir cambio en datos aprobados queda registrado**
  - **Cómo probarlo**: Como comercio aprobado, pedí un cambio en un documento.
  - **Qué deberías ver**: Se crea un "pedido de cambio" que queda registrado. OPS lo revisa, lo aprueba o lo rechaza. Todo queda con historial.

### Panel de pedidos

- [ ] 🔴 **Dashboard del comercio**
  - **Cómo probarlo**: Logueado como comercio aprobado, andá a `/comercios`.
  - **Qué deberías ver**: Ves un resumen con métricas básicas: pedidos del día, ventas, estado de la tienda (abierta/cerrada), etc.

- [ ] 🔴 **Lista de pedidos con filtros**
  - **Cómo probarlo**: En el panel del comercio, andá a "Pedidos". Probá filtrar por estado (Pendientes, En preparación, Entregados, etc.) y por fecha.
  - **Qué deberías ver**: La lista se actualiza con solo los pedidos del filtro elegido.

- [ ] 🔴 **Notificación cuando llega un pedido nuevo**
  - **Cómo probarlo**: Tené el panel abierto. Pedile a alguien que haga un pedido a tu comercio.
  - **Qué deberías ver**: Suena una alerta sonora, aparece un cartel visual con los datos del pedido, y (si tenés permitidas las notificaciones push) te llega una al celular.

- [ ] 🔴 **Confirmar un pedido pendiente**
  - **Cómo probarlo**: En un pedido en estado "Pendiente", click "Confirmar".
  - **Qué deberías ver**: El pedido pasa a "Confirmado / En preparación". El cliente recibe una notificación que su pedido fue aceptado.

- [ ] 🔴 **Rechazar un pedido cancela y devuelve la plata**
  - **Cómo probarlo**: En un pedido pendiente pagado con MercadoPago, click "Rechazar" y elegí un motivo.
  - **Qué deberías ver**: El pedido pasa a "Rechazado". El cliente recibe una notificación. Si pagó con MP, el reembolso se procesa automáticamente.

- [ ] 🔴 **Marcar pedido como listo busca repartidor**
  - **Cómo probarlo**: En un pedido "En preparación", click "Marcar como listo".
  - **Qué deberías ver**: El pedido pasa a "Listo". El sistema empieza a buscar un repartidor disponible. En pocos segundos/minutos se asigna uno.

- [ ] 🔴 **PIN de retiro solo se muestra cuando llega el driver Y el pedido está listo**
  - **Cómo probarlo**: Verificá el comportamiento del PIN en dos escenarios: (1) driver llegó pero el pedido todavía no está listo, y (2) pedido listo pero driver todavía no llegó.
  - **Qué deberías ver**: En ambos casos el PIN NO aparece. SOLO aparece cuando se cumplen las dos condiciones: pedido listo + driver físicamente en el comercio.

- [ ] 🔴 **Timeout en pedidos pendientes**
  - **Cómo probarlo**: Recibí un pedido y no lo confirmes ni lo rechaces. Esperá hasta que pase el tiempo límite configurado en OPS.
  - **Qué deberías ver**: El botón "Aceptar" se bloquea automáticamente. Aparece un cartel indicando que el pedido expiró por timeout. NO podés confirmarlo después.

- [ ] 🔴 **Pedidos programados con tiempo restante**
  - **Cómo probarlo**: Recibí un pedido marcado como "Programado para más tarde".
  - **Qué deberías ver**: Aparece en la lista con un badge "Programado" y la hora exacta de entrega. Calcula y muestra cuánto falta hasta el slot.

- [ ] 🔴 **El monto que ve el comercio es "Tu venta" sin envío**
  - **Cómo probarlo**: Abrí un pedido y mirá los montos visibles.
  - **Qué deberías ver**: Ves "Tu venta: $X" (que es el subtotal de tus productos, SIN el costo de envío). Y debajo "Cobrás $Y (-Z% comisión)" con el neto que efectivamente vas a recibir después de la comisión Moovy.

- [ ] 🔴 **Chat con el cliente desde el pedido**
  - **Cómo probarlo**: En un pedido activo (no entregado), buscá el botón de chat.
  - **Qué deberías ver**: Se abre una conversación con el cliente. Podés mandar mensajes y los recibís en vivo sin refrescar.

### Productos del catálogo

- [ ] 🔴 **Crear un producto manualmente**
  - **Cómo probarlo**: En el panel del comercio → Productos → Nuevo. Completá nombre, descripción, precio, stock, imagen.
  - **Qué deberías ver**: El producto se guarda. Aparece inmediatamente en la lista de productos del comercio y queda visible para los compradores.

- [ ] 🔴 **Elegir tamaño/peso del producto (selector visual)**
  - **Cómo probarlo**: Al crear un producto, en la sección "Tamaño" elegí entre las categorías visuales (Sobre, Pequeño, Mediano, Grande, etc.). Después probá el "modo avanzado" para tipear gramos exactos.
  - **Qué deberías ver**: Las dos formas funcionan. El tamaño que elegís determina qué vehículo se asigna para entregarlo (bici, moto, auto).

- [ ] 🔴 **Editar producto muestra el banner flotante**
  - **Cómo probarlo**: Entrá a editar un producto existente. Cambiá un campo (ej. el precio).
  - **Qué deberías ver**: Aparece un banner flotante en la parte inferior con un punto amarillo pulsante y el texto "Tenés cambios sin guardar" más los botones "Descartar" y "Guardar".

- [ ] 🔴 **Eliminar un producto pide confirmación**
  - **Cómo probarlo**: Click en el icono de tacho de un producto.
  - **Qué deberías ver**: Aparece una confirmación. Si confirmás, el producto desaparece de la lista (pero queda guardado internamente — soft delete — por si después se necesita auditoría).

- [ ] 🔴 **Importar productos del catálogo Moovy**
  - **Cómo probarlo**: En "Productos → Nuevo", andá a la sección de "Catálogo Moovy" si tu comercio compró un paquete. Elegí una categoría y dale "Importar".
  - **Qué deberías ver**: Los productos del catálogo se agregan a tu lista con fotos profesionales ya cargadas. Podés editarlos después si querés cambiar el precio.

- [ ] 🔴 **El stock baja con cada venta**
  - **Cómo probarlo**: Anotá el stock de un producto. Hacé un pedido como buyer comprando 1 unidad. Esperá a que se confirme.
  - **Qué deberías ver**: El stock del producto bajó en 1. Si tenías 10, ahora tenés 9.

- [ ] 🔴 **Subir foto de producto se comprime y queda cuadrada**
  - **Cómo probarlo**: Subí una foto grande (más de 2MB) en un producto.
  - **Qué deberías ver**: La foto se comprime automáticamente (queda menos pesada) y se recorta a formato cuadrado (1:1) si era rectangular.

- [ ] 🟡 **Categorías custom del comercio**
  - **Cómo probarlo**: Si está implementado, creá una categoría propia (ej. "Promo del día") y agregale productos.
  - **Qué deberías ver**: La categoría aparece en la página del comercio en la tienda pública. Los compradores pueden filtrar por ella.

- [ ] 🟡 **Productos destacados**
  - **Cómo probarlo**: Marcá algunos productos como "destacados" si está implementado.
  - **Qué deberías ver**: Esos productos aparecen primeros o con un badge especial en la tienda del comercio.

### Configuración del comercio

- [ ] 🔴 **Editar perfil del comercio con banner flotante**
  - **Cómo probarlo**: En "Mi comercio", cambiá cualquier dato (nombre, descripción, etc.).
  - **Qué deberías ver**: Aparece el banner flotante "Tenés cambios sin guardar" con botones Descartar y Guardar. Si descartás, se recarga la página con los datos originales.

- [ ] 🔴 **Cambiar horarios de atención**
  - **Cómo probarlo**: En la sección de horarios, cambiá el horario de un día (ej. hacé que el lunes abra de 10 a 14h en vez de 9 a 18h).
  - **Qué deberías ver**: Se guarda. En la página pública del comercio, durante esas horas aparece como "Abierto" y fuera como "Cerrado".

- [ ] 🔴 **Cambiar la imagen del comercio**
  - **Cómo probarlo**: En "Mi comercio", subí una nueva foto de portada.
  - **Qué deberías ver**: Se comprime automáticamente. En la tienda pública el comercio aparece con la foto nueva en pocos segundos.

- [ ] 🔴 **Conectar tu cuenta de MercadoPago**
  - **Cómo probarlo**: En la sección de pagos, click "Conectar MercadoPago". Te redirige a MP, te logueás, autorizás Moovy.
  - **Qué deberías ver**: Volvés al panel y aparece "MercadoPago conectado". Ahora los pagos van directo a tu cuenta MP (con la comisión Moovy descontada automáticamente).

- [ ] 🔴 **Pausar la tienda temporalmente**
  - **Cómo probarlo**: En el dashboard, click "Pausar tienda".
  - **Qué deberías ver**: La tienda pasa a estado "Cerrado" inmediatamente. En la tienda pública aparece como cerrado, aunque el horario sea normal. Volvés a abrirlo cuando quieras.

- [ ] 🔴 **El nivel de fidelidad (BRONCE/PLATA/ORO/DIAMANTE) muestra la comisión correcta**
  - **Cómo probarlo**: En la sección de tu comercio, andá a "Comisión actual".
  - **Qué deberías ver**: Aparece tu nivel actual (BRONCE, PLATA, ORO o DIAMANTE) y el porcentaje de comisión que pagás (BRONCE 8% → DIAMANTE 5%).

- [ ] 🟡 **Redes sociales visibles en tu perfil público**
  - **Cómo probarlo**: Llená los campos de Instagram, Facebook y WhatsApp. Guardá. Andá a la tienda pública y buscá tu comercio.
  - **Qué deberías ver**: En la página de tu comercio aparecen los iconos de Instagram, FB y WhatsApp con los links correctos.

### Pagos recibidos

- [ ] 🔴 **OPS genera el archivo de pagos a comercios**
  - **Cómo probarlo**: Desde OPS, en la sección de Payouts, generá un PayoutBatch para "Comercios" del último periodo.
  - **Qué deberías ver**: Se descarga un archivo CSV con la lista de comercios, cada uno con el monto que se les debe, sus datos bancarios y los pedidos incluidos.

- [ ] 🔴 **Al marcar el batch como pagado, los pedidos se marcan en la DB**
  - **Cómo probarlo**: En OPS, después de hacer la transferencia real por MP o banco, marcá el batch como "Pagado".
  - **Qué deberías ver**: Los pedidos incluidos quedan marcados como "Comisión pagada" en su detalle. NO se pueden incluir en otro batch.

- [ ] 🔴 **El comercio ve su historial de pagos recibidos**
  - **Cómo probarlo**: Logueado como comercio, entrá a la sección de pagos / payouts en tu panel.
  - **Qué deberías ver**: Aparece la lista de pagos recibidos con fecha, monto, cantidad de pedidos incluidos. Podés ver el detalle de cada pago.

- [ ] 🟡 **El comercio puede descargar su CSV de pagos**
  - **Cómo probarlo**: En el historial de pagos, click "Descargar CSV".
  - **Qué deberías ver**: Se descarga un archivo con tus pagos del periodo elegido.

---

## 🛵 Repartidor (Driver)

### Registro y aprobación

- [ ] 🔴 **Registro como repartidor**
  - **Cómo probarlo**: Andá a `/repartidor/registro`. Completá nombre, contacto, DNI, datos bancarios (CBU o alias), vehículo.
  - **Qué deberías ver**: Después del registro quedás pendiente de aprobación. Te llega un email con los próximos pasos (cargar documentos).

- [ ] 🔴 **Subir documentos: DNI, licencia, seguro, RTO, cédula verde**
  - **Cómo probarlo**: En el panel del driver pendiente, sección "Mis documentos". Subí fotos claras de cada documento requerido.
  - **Qué deberías ver**: Cada documento queda con estado "Pendiente de revisión". OPS los aprueba uno por uno desde su panel.

- [ ] 🔴 **El RTO no es obligatorio pero la declaración jurada de T&C sí**
  - **Cómo probarlo**: Probá registrarte sin subir el RTO pero aceptando todos los términos.
  - **Qué deberías ver**: Te permite continuar SIN el RTO. Pero NO te permite avanzar sin aceptar los términos y la declaración jurada de responsabilidad.

- [ ] 🔴 **El CBU se valida con la regla oficial**
  - **Cómo probarlo**: Al cargar tus datos bancarios, probá poner un CBU inventado.
  - **Qué deberías ver**: Te tira error específico tipo "CBU inválido". Solo acepta CBUs con la suma de control correcta (regla del BCRA).

- [ ] 🔴 **Después del registro hay un botón para cargar documentación**
  - **Cómo probarlo**: Completá el registro de driver y mirá la pantalla final.
  - **Qué deberías ver**: Aparece un botón claro "Cargar mi documentación" que te lleva al panel del driver pendiente. NO te quedás atrapado sin saber dónde ir.

- [ ] 🔴 **La pantalla de confirmación muestra los datos cargados**
  - **Cómo probarlo**: Después del registro, mirá la pantalla de confirmación.
  - **Qué deberías ver**: Muestra DNI, CUIT, nombre, etc. con los valores que ingresaste. NO aparecen campos vacíos donde debería haber datos.

- [ ] 🔴 **Sin errores de consola al aceptar términos**
  - **Cómo probarlo**: Abrí las herramientas de desarrollador (F12 → Console) antes de aceptar los T&C en el registro. Aceptá y mirá la consola.
  - **Qué deberías ver**: NO aparecen errores rojos en la consola. Si aparece alguno, anotalo en la observación.

- [ ] 🔴 **Aviso automático antes de que venza un documento**
  - **Cómo probarlo**: Configurá una fecha de vencimiento próxima en un documento (ej. licencia que vence en 3 días). Esperá al cron diario.
  - **Qué deberías ver**: 7 días antes te llega un primer aviso. A los 3 días un segundo. A 1 día un tercero. Si llega el vencimiento sin actualizar, tu cuenta se suspende automáticamente.

- [ ] 🔴 **Al aprobarte como driver, te llega email y se activa el rol**
  - **Cómo probarlo**: Desde OPS, aprobá todos los documentos requeridos de un driver pendiente.
  - **Qué deberías ver**: Le llega un email "¡Tu cuenta fue aprobada!" al driver. La próxima vez que entre, ya puede ir online y recibir pedidos.

### Estado online y asignación de pedidos

- [ ] 🔴 **Toggle online / offline**
  - **Cómo probarlo**: Logueado como driver aprobado, busca el toggle de "Online" en el dashboard. Pasalo a ON y después a OFF.
  - **Qué deberías ver**: Cuando estás en ON, podés recibir pedidos. Cuando estás en OFF, NO. El cambio se aplica al instante.

- [ ] 🔴 **El estado online persiste si refrescás la pantalla**
  - **Cómo probarlo**: Poneté en ON. Refrescá la pantalla.
  - **Qué deberías ver**: Seguís en estado ON. NO se resetea a OFF cada vez que recargás.

- [ ] 🔴 **Pide permisos de ubicación al ir online**
  - **Cómo probarlo**: Primera vez que activás ONLINE en un browser/dispositivo nuevo.
  - **Qué deberías ver**: Te aparece el cartel del browser pidiendo permitir acceso a tu ubicación. Si aceptás, podés ir online. Si rechazás, NO te deja.

- [ ] 🔴 **Sin permiso de ubicación no podés ir online**
  - **Cómo probarlo**: En la configuración del browser, denegá el permiso de ubicación a Moovy. Después intentá pasar a ONLINE.
  - **Qué deberías ver**: Te aparece un mensaje claro "Necesitamos tu ubicación para asignarte pedidos cercanos" + instrucciones para habilitarlo. NO podés ir online sin GPS.

- [ ] 🔴 **Asignación de pedido suena y se ve**
  - **Cómo probarlo**: Estando ONLINE y disponible, pedile a alguien que haga un pedido en tu zona.
  - **Qué deberías ver**: Suena una alarma fuerte. Aparece un cartel grande con los datos del pedido: comercio, dirección, distancia, ganancia estimada. Y te llega push al celular.

- [ ] 🔴 **Aceptar un pedido empieza el tracking**
  - **Cómo probarlo**: Aceptá una asignación.
  - **Qué deberías ver**: La pantalla cambia a "En camino al comercio" con el mapa y la ruta. Tu ubicación empieza a enviarse al server cada 10 segundos.

- [ ] 🔴 **Rechazar libera el pedido para otro driver**
  - **Cómo probarlo**: Cuando te asignen un pedido, click "Rechazar" o no respondas hasta el timeout.
  - **Qué deberías ver**: El pedido vuelve a la cola y otro driver cercano lo recibe en pocos segundos. Vos volvés al estado libre.

- [ ] 🔴 **Timeout sin responder reasigna automáticamente**
  - **Cómo probarlo**: Recibí una asignación y dejá pasar el tiempo sin tocar nada.
  - **Qué deberías ver**: Después del timeout configurado en OPS, el pedido se reasigna al próximo driver. Vos volvés a estar disponible.

- [ ] 🟡 **Un solo driver puede llevar 2 pedidos cercanos a la vez**
  - **Cómo probarlo**: Hacé 2 pedidos en lugares cercanos (menos de 3 km entre comercio y entrega) que tengan al mismo driver disponible.
  - **Qué deberías ver**: Al mismo driver le llegan los 2 pedidos en secuencia o agrupados. Los puede hacer en un solo trip si conviene.

- [ ] 🟡 **Cuando no hay drivers disponibles, el cliente recibe un mensaje y reembolso**
  - **Cómo probarlo**: Asegurate que no haya drivers ONLINE en la zona. Hacé un pedido.
  - **Qué deberías ver**: El cliente recibe una notificación "No conseguimos repartidor" después del intento. El pedido pasa a estado "Sin repartidor" y, si era MP, el reembolso se procesa automáticamente.

### PIN doble (retiro y entrega)

- [ ] 🔴 **Llegar al comercio activa el estado "En el comercio"**
  - **Cómo probarlo**: Como driver, andá hacia la dirección del comercio.
  - **Qué deberías ver**: Cuando estás a menos de 100 metros (geofence), el sistema detecta tu llegada. Tu estado pasa a "En el comercio". El comercio recibe la notificación y ve el PIN de retiro en su panel.

- [ ] 🔴 **Ingresar PIN correcto retira el pedido**
  - **Cómo probarlo**: Pedile al comercio que te diga el PIN de retiro (4 dígitos). Ingresalo en tu app.
  - **Qué deberías ver**: El PIN se valida. El pedido pasa a "Retirado / En camino al cliente". Empieza el tracking de la segunda parte del viaje.

- [ ] 🔴 **PIN incorrecto muestra cuántos intentos te quedan**
  - **Cómo probarlo**: Ingresá un PIN inventado.
  - **Qué deberías ver**: Aparece un mensaje rojo "PIN incorrecto. Te quedan X intentos". El contador baja con cada intento fallido.

- [ ] 🔴 **Después del máximo de intentos, aparecen botones de soporte visibles**
  - **Cómo probarlo**: Ingresá un PIN equivocado tantas veces como el límite (5 por defecto).
  - **Qué deberías ver**: El pedido se bloquea. Pero a la altura del mensaje rojo aparecen DOS BOTONES PROMINENTES: uno rojo "Reportar problema y desbloquear" que abre el modal de reporte, y otro link "o escribí a soporte por WhatsApp" que abre WhatsApp con un mensaje pre-armado.

- [ ] 🔴 **PIN fuera de geofence (lejos del lugar) se bloquea con soporte**
  - **Cómo probarlo**: Como driver, intentá ingresar el PIN cuando estás a más de 100 metros del comercio o del cliente.
  - **Qué deberías ver**: El sistema te dice "Estás a X metros del destino. Acercate más e intentá de nuevo". Y aparecen los mismos botones de soporte para escalar el caso si hay un problema de GPS real.

- [ ] 🔴 **Ingresar PIN correcto en la entrega**
  - **Cómo probarlo**: Llegá al cliente. Pedile el PIN de entrega y poné los 4 dígitos.
  - **Qué deberías ver**: El PIN se valida. El pedido pasa a "Entregado". Tu estado vuelve a "Disponible" y podés recibir el próximo pedido.

- [ ] 🔴 **PIN de entrega también se puede bloquear y aparecen botones de soporte**
  - **Cómo probarlo**: Igual al caso del PIN de retiro pero en la entrega — ingresá mal el PIN 5 veces.
  - **Qué deberías ver**: Mismo flujo: el pedido se bloquea pero aparecen botones de soporte (Reportar problema + WhatsApp).

- [ ] 🔴 **3 o más bloqueos suspenden automáticamente al driver**
  - **Cómo probarlo**: Esto es un escenario adversarial — un driver que tiene varios bloqueos de PIN seguidos.
  - **Qué deberías ver**: Después de 3 incidentes de PIN bloqueado, el sistema suspende automáticamente al driver hasta que un admin revise. Esto previene fraudes.

- [ ] 🔴 **Reportar problema desde el modal manda email a soporte**
  - **Cómo probarlo**: Cuando se bloquea el PIN, dale al botón "Reportar problema y desbloquear". En el modal, escribí qué pasó. Enviar.
  - **Qué deberías ver**: El reporte se envía. Llega un email al equipo de Moovy con todo el contexto (orderId, distancia, comentario). Vos ves un cartel "Reporte enviado, vamos a contactarte".

- [ ] 🔴 **WhatsApp soporte abre con mensaje pre-armado contextual**
  - **Cómo probarlo**: En el modal del PIN bloqueado, click en "o escribí a soporte por WhatsApp".
  - **Qué deberías ver**: Se abre WhatsApp (en mobile la app, en desktop WhatsApp Web) con un mensaje pre-armado distinto según el error: "se bloqueó por intentos" o "problema de GPS", incluyendo el pedido.

### Ganancias y pagos

- [ ] 🔴 **La pantalla de ganancias tiene 2 pestañas: "Ganancias" y "Pagos recibidos"**
  - **Cómo probarlo**: Andá a "Mis ganancias" en el panel del driver.
  - **Qué deberías ver**: Hay dos tabs arriba: "Ganancias" (detalle de cuánto ganaste por entrega) y "Pagos recibidos" (historial de transferencias que te hizo Moovy).

- [ ] 🔴 **Selector de período: semana, mes, meses pasados, todo el tiempo**
  - **Cómo probarlo**: En la pestaña "Ganancias", abrí el dropdown del período.
  - **Qué deberías ver**: Tenés opciones: "Esta semana", "Este mes", los últimos 12 meses uno por uno (ej. "Abril 2026", "Marzo 2026"), y "Todo el tiempo".

- [ ] 🔴 **La pestaña "Pagos recibidos" muestra cada transferencia que te hicieron**
  - **Cómo probarlo**: Andá a la pestaña "Pagos recibidos".
  - **Qué deberías ver**: Cada transferencia que Moovy te hizo aparece con la fecha, el monto, la cantidad de pedidos que incluía y la cuenta destino.

- [ ] 🔴 **El total acumulado de pagos es correcto**
  - **Cómo probarlo**: En la pestaña "Pagos recibidos", mirá el total arriba.
  - **Qué deberías ver**: El número refleja la suma de todos los pagos recibidos. Si te pagaron $10.000 una vez y $7.500 otra, el total es $17.500.

- [ ] 🔴 **Propinas declaradas aparecen separadas**
  - **Cómo probarlo**: Mirá la pantalla de ganancias después de pedidos donde el cliente declaró propina.
  - **Qué deberías ver**: Las propinas aparecen en una sección aparte (NO sumadas a tus ganancias). El sistema avisa: "Estas propinas no las procesa Moovy, las recibís directo del cliente".

- [ ] 🟡 **Aviso si no cargaste alias bancario para recibir propinas**
  - **Cómo probarlo**: Como driver sin alias cargado, andá a ganancias.
  - **Qué deberías ver**: Aparece un cartel amarillo recordándote que cargues tu alias en tu perfil para que los compradores puedan dejarte propina por transferencia.

- [ ] 🔴 **El GPS se sube cada 10 segundos durante un pedido activo**
  - **Cómo probarlo**: Tené un pedido activo (en camino al comercio o al cliente). Mirá el log de network en DevTools o pedile al equipo técnico que confirme.
  - **Qué deberías ver**: Cada ~10 segundos hay una request al backend con la nueva posición GPS del driver. El cliente ve el mapa actualizado en tiempo real.

---

## 🛍️ Vendedor Marketplace (Seller)

### Registro y configuración

- [ ] 🔴 **Registro como vendedor**
  - **Cómo probarlo**: Andá a `/vendedor/registro`. Completá los datos requeridos (datos personales, fiscales, contacto).
  - **Qué deberías ver**: Se crea tu perfil de vendedor. Te llega un email de bienvenida explicando los próximos pasos.

- [ ] 🔴 **Email de bienvenida al registrarse**
  - **Cómo probarlo**: Revisá la casilla del email que usaste para registrarte.
  - **Qué deberías ver**: Llega un email "Bienvenido vendedor a Moovy" con instrucciones.

- [ ] 🔴 **Validación de documentos fiscales + DNI/CUIT**
  - **Cómo probarlo**: Subí tu documentación fiscal (monotributo, AFIP) y el DNI/CUIT.
  - **Qué deberías ver**: Quedan en estado "Pendiente". OPS los aprueba uno por uno.

- [ ] 🔴 **Aprobación de admin activa la cuenta**
  - **Cómo probarlo**: OPS aprueba todos los documentos.
  - **Qué deberías ver**: Te activan como vendedor. Ya podés publicar productos en el marketplace.

- [ ] 🟡 **Conectar MercadoPago para recibir pagos directos**
  - **Cómo probarlo**: En la sección de pagos del panel del seller, click "Conectar MP".
  - **Qué deberías ver**: Te redirige a MP, autorizás, volvés con la cuenta conectada. Los pagos van directos a tu cuenta con la comisión de Moovy descontada.

### Publicar productos (listings)

- [ ] 🔴 **Crear un listing nuevo**
  - **Cómo probarlo**: En el panel del seller, click "Nuevo listing". Subí foto, descripción, precio, elegí categoría y peso del paquete.
  - **Qué deberías ver**: El listing se guarda y aparece en el Marketplace público. Los compradores ya lo pueden ver.

- [ ] 🔴 **Editar un listing existente**
  - **Cómo probarlo**: Tocá un listing tuyo en la lista, cambiá el precio o la descripción, guardá.
  - **Qué deberías ver**: Los cambios se reflejan en el Marketplace en pocos segundos.

- [ ] 🔴 **Pausar/activar un listing**
  - **Cómo probarlo**: En el detalle de tu listing, click "Pausar".
  - **Qué deberías ver**: El listing desaparece del Marketplace público pero queda en tu lista para reactivar después.

- [ ] 🔴 **Eliminar un listing**
  - **Cómo probarlo**: Click en el icono de tacho del listing y confirmá.
  - **Qué deberías ver**: Desaparece del Marketplace. Internamente queda guardado (soft delete) por auditoría.

- [ ] 🔴 **Variantes (talle, color, etc.)**
  - **Cómo probarlo**: Si tu producto tiene variantes (ej. ropa con talles S/M/L), creá variantes con sus stocks individuales.
  - **Qué deberías ver**: Los compradores pueden elegir entre las variantes al comprar. El stock baja de la variante elegida.

- [ ] 🔴 **El stock baja con cada venta**
  - **Cómo probarlo**: Tené un listing con stock 5. Hacé que alguien lo compre.
  - **Qué deberías ver**: El stock baja a 4 automáticamente. Si llega a 0, el listing se marca como agotado.

### Panel de pedidos del seller

- [ ] 🔴 **Lista de pedidos al vendedor**
  - **Cómo probarlo**: Como seller, andá a `/vendedor/pedidos`.
  - **Qué deberías ver**: Aparecen solo los pedidos de tus listings (no los de comercios). Cada uno con el detalle de qué se vendió.

- [ ] 🔴 **Filtros por estado**
  - **Cómo probarlo**: Probá los filtros (Pendientes, En proceso, Entregados, Cancelados).
  - **Qué deberías ver**: La lista se filtra correctamente. Los pedidos viejos no aparecen si elegiste "Pendientes".

- [ ] 🔴 **"Tu venta" muestra subtotal, "Cobrás" muestra el neto con 12% descontado**
  - **Cómo probarlo**: Abrí un pedido tuyo y mirá los montos.
  - **Qué deberías ver**: Ves "Tu venta: $X" (el precio sin envío) y "Cobrás: $Y" (con la comisión Moovy de 12% descontada automáticamente).

- [ ] 🔴 **Chat con el comprador del listing**
  - **Cómo probarlo**: En un pedido activo, click en chat con el comprador.
  - **Qué deberías ver**: Se abre la conversación. Podés mandar mensajes que llegan al buyer en vivo.

- [ ] 🔴 **Chat con el driver para coordinar retiro**
  - **Cómo probarlo**: Cuando un driver tiene asignado tu pedido, click en chat con el driver.
  - **Qué deberías ver**: Podés coordinar el retiro del producto con el repartidor (dónde y cuándo).

- [ ] 🔴 **Notificación cuando llega un pedido nuevo**
  - **Cómo probarlo**: Tené el panel abierto. Que alguien compre uno de tus listings.
  - **Qué deberías ver**: Suena alerta, aparece cartel visual, llega push.

---

## 🛠️ OPS (Equipo Moovy)

### Login y acceso

- [ ] 🔴 **Login OPS solo para admins**
  - **Cómo probarlo**: Entrá a `/ops/login` con credenciales de admin.
  - **Qué deberías ver**: Entrás al panel OPS. Si alguien intenta con credenciales de un usuario normal, el sistema lo rechaza.

- [ ] 🔴 **Bloqueo de rutas OPS sin rol admin**
  - **Cómo probarlo**: Logueado como usuario normal (no admin), pegá la URL `/ops/usuarios` en el browser.
  - **Qué deberías ver**: El sistema te redirige al login o te bloquea con un mensaje de "Acceso denegado".

- [ ] 🔴 **Logout limpia la sesión**
  - **Cómo probarlo**: En el panel OPS, click "Cerrar sesión".
  - **Qué deberías ver**: Te lleva al login y borra la sesión. Si pegás `/ops/usuarios` en la URL, te pide loguear de nuevo.

- [ ] 🔴 **Selector de panel post-login**
  - **Cómo probarlo**: Si tu cuenta tiene varios roles (admin + comercio, por ejemplo), después de loguear elegí a qué panel querés ir.
  - **Qué deberías ver**: Aparece una pantalla con tarjetas para cada rol disponible. Elegís y vas al panel correcto.

### Gestión de usuarios

- [ ] 🔴 **La lista de usuarios aparece con paginación**
  - **Cómo probarlo**: Andá a `/ops/usuarios`.
  - **Qué deberías ver**: Aparecen los primeros 20-50 usuarios. Al final hay botones de "Siguiente página". Los datos visibles: nombre, email, rol, fecha de registro, estado.

- [ ] 🔴 **Auto-refresh cada 30 segundos cuando la pestaña está visible**
  - **Cómo probarlo**: Dejá `/ops/usuarios` abierto en una pestaña. Pedile a alguien que se registre. Esperá hasta 30 segundos sin tocar nada.
  - **Qué deberías ver**: La lista se actualiza sola y aparece el nuevo registro. Cuando cambiás a otra pestaña, el auto-refresh se pausa para no consumir recursos.

- [ ] 🔴 **Botón "Actualizar" manual + label "Hace X segundos"**
  - **Cómo probarlo**: En `/ops/usuarios`, mirá el botón "Actualizar" y la fecha que muestra cuándo fue la última actualización.
  - **Qué deberías ver**: El label dice "Actualizado hace 5 segundos / 1 minuto", etc. y se actualiza solo. El botón te permite forzar refresh manual sin esperar al auto.

- [ ] 🔴 **Filtros por rol**
  - **Cómo probarlo**: Probá los filtros: "Compradores", "Comercios", "Repartidores", "Vendedores", "Admins".
  - **Qué deberías ver**: La lista se filtra correctamente. Solo aparecen usuarios del rol elegido.

- [ ] 🔴 **Tabs con contadores por estado**
  - **Cómo probarlo**: Mirá las pestañas: "Pendientes", "Aprobados", "Rechazados".
  - **Qué deberías ver**: Cada pestaña tiene un número que es la cantidad de usuarios en ese estado. Al hacer click se filtra por ese estado.

- [ ] 🔴 **Badge de pendientes en el menú de OPS**
  - **Cómo probarlo**: Tené algunos comercios o drivers pendientes de aprobación. Mirá el menú lateral del panel OPS.
  - **Qué deberías ver**: Junto a "Usuarios" o "Aprobaciones" hay un badge rojo con el número de pendientes que hay para revisar.

- [ ] 🔴 **Crear admin desde OPS coincide con registro público**
  - **Cómo probarlo**: Desde OPS, andá a "Crear usuario admin". Compará los campos con el registro público.
  - **Qué deberías ver**: Los campos son los mismos. NO hay diferencias entre lo que pide el formulario público y el de OPS.

- [ ] 🔴 **Eliminar usuario desde OPS no anonimiza el email**
  - **Cómo probarlo**: Desde OPS, eliminá una cuenta de usuario.
  - **Qué deberías ver**: La cuenta queda eliminada (soft delete) pero el email original se conserva en la DB (a diferencia del self-delete que sí lo anonimiza). El email NO se puede usar para crear otra cuenta nueva.

### Pedidos en vivo

- [ ] 🔴 **Vista de pedidos en vivo se actualiza en tiempo real**
  - **Cómo probarlo**: Andá a `/ops/pedidos/live`. Pedile a alguien que haga un pedido o que un driver cambie de estado.
  - **Qué deberías ver**: La pantalla se actualiza sin refrescar manualmente. Los cambios de estado aparecen al instante.

- [ ] 🔴 **Reembolso manual con confirmación textual**
  - **Cómo probarlo**: Desde OPS, abrí un pedido y dale "Reembolsar".
  - **Qué deberías ver**: Te pide escribir literalmente "ELIMINAR DEFINITIVAMENTE" (sin comillas) para confirmar. Si lo escribís mal, el botón sigue deshabilitado.

- [ ] 🔴 **Reasignar driver con audit log**
  - **Cómo probarlo**: Cambiá el driver de un pedido activo manualmente desde OPS.
  - **Qué deberías ver**: El driver original recibe la notificación de que se le quitó el pedido. El nuevo lo recibe. Queda un registro en el audit log con quién hizo el cambio y por qué.

- [ ] 🔴 **Override de geofence con audit log**
  - **Cómo probarlo**: Cuando un driver tiene bloqueado el PIN por estar fuera del rango, desde OPS dale "Permitir confirmar igual".
  - **Qué deberías ver**: El driver puede ingresar el PIN. Queda registrado en audit que se forzó manualmente, quién lo hizo y para qué pedido.

### Aprobaciones de documentos

- [ ] 🔴 **Cada documento tiene su propio estado**
  - **Cómo probarlo**: Abrí los documentos de un comercio o driver pendiente.
  - **Qué deberías ver**: Cada documento (DNI, CUIT, licencia, etc.) tiene su botón "Aprobar / Rechazar" individual. NO se aprueban todos juntos.

- [ ] 🔴 **Aprobación física pide nota mínima**
  - **Cómo probarlo**: Elegí aprobar un documento con la opción "Físico" (no por imagen subida).
  - **Qué deberías ver**: Te pide escribir una nota de al menos 5 caracteres. NO te deja aprobar sin justificación.

- [ ] 🔴 **Cuando todos los obligatorios están aprobados, el usuario se activa solo**
  - **Cómo probarlo**: Aprobá el último documento requerido de un comercio o driver.
  - **Qué deberías ver**: El usuario pasa de "Pendiente" a "Aprobado" SIN un click adicional. Se le habilita el panel completo automáticamente.

- [ ] 🔴 **El JWT del usuario se actualiza automáticamente al aprobarse**
  - **Cómo probarlo**: Tené al usuario aprobado con la pestaña abierta del panel pendiente. Aprobalo desde OPS.
  - **Qué deberías ver**: La pestaña del usuario se actualiza sola y le aparece el panel completo. NO tiene que cerrar sesión y volver a loguear.

- [ ] 🔴 **Errores de OPS se muestran en toasts**
  - **Cómo probarlo**: Hacé una operación OPS que falle a propósito (ej. aprobar algo que ya está aprobado).
  - **Qué deberías ver**: Aparece un toast rojo con el mensaje específico del error, no genérico "Error 500".

### Configuración del sistema

- [ ] 🔴 **La biblia financiera v3 es editable**
  - **Cómo probarlo**: Andá a `/ops/config-biblia` o donde esté el panel de configuración. Modificá un parámetro (ej. el porcentaje del repartidor).
  - **Qué deberías ver**: El cambio se guarda. Se aplica a los pedidos NUEVOS (los viejos NO se recalculan retroactivamente).

- [ ] 🔴 **Editar zonas de delivery dibujando polígonos**
  - **Cómo probarlo**: Andá a `/ops/zonas-delivery`. Dibujá un polígono nuevo en el mapa.
  - **Qué deberías ver**: La zona queda guardada. Los pedidos nuevos dentro de esa zona tienen el multiplicador configurado.

- [ ] 🔴 **Zonas excluidas se manejan desde OPS**
  - **Cómo probarlo**: En el panel de zonas, agregá una zona como "Excluida".
  - **Qué deberías ver**: Los compradores en esa zona reciben el mensaje "No entregamos acá". NO podés finalizar la compra desde una dirección en zona excluida.

- [ ] 🔴 **Configuración de puntos editable**
  - **Cómo probarlo**: En el panel de puntos, cambiá un parámetro (ej. cuántos puntos por dólar).
  - **Qué deberías ver**: El cambio se aplica a pedidos nuevos. Los existentes no se afectan.

- [ ] 🔴 **Niveles de fidelidad (tiers) editables**
  - **Cómo probarlo**: Cambiá el porcentaje de comisión de un tier (ej. BRONCE pasa de 8% a 7%).
  - **Qué deberías ver**: Los comercios en ese tier tienen la nueva comisión en sus pedidos futuros.

- [ ] 🔴 **Templates de email editables con preview**
  - **Cómo probarlo**: Andá a `/ops/emails`. Editá el texto del email de bienvenida del comprador. Click "Preview".
  - **Qué deberías ver**: Ves cómo va a quedar el email con los datos de prueba. Podés guardar el cambio y se usa para todos los emails futuros.

- [ ] 🔴 **Playbooks (checklists internos) editables**
  - **Cómo probarlo**: Editá un playbook desde OPS (ej. el checklist de aprobación de drivers).
  - **Qué deberías ver**: Los cambios se aplican. Próximos usuarios siguen el playbook actualizado.

- [ ] 🔴 **Segmentos de usuarios + broadcast campaigns con consentimiento**
  - **Cómo probarlo**: Creá un segmento (ej. "Compradores activos últimos 30 días") y armá una campaña de email.
  - **Qué deberías ver**: La campaña solo se envía a los usuarios que dieron consentimiento de marketing. Los que no, quedan excluidos automáticamente.

- [ ] 🔴 **Feature flags togglean en tiempo real**
  - **Cómo probarlo**: En `/ops/feature-flags`, cambiá el estado de un flag (ej. `buyer.cash-payment`). Sin refrescar nada en el sitio, esperá 30 segundos.
  - **Qué deberías ver**: Después de 30 segundos (cache), el cambio se aplica en toda la app. Los usuarios ven o dejan de ver la feature.

- [ ] 🔴 **Los flags `buyer.marketplace` y `buyer.puntos-moover` NO aparecen en el panel**
  - **Cómo probarlo**: Andá a `/ops/feature-flags` y mirá la lista completa.
  - **Qué deberías ver**: Esos 2 flags NO están en la lista. Si están, fue porque no corriste el script de cleanup en la DB de prod. Avisame para correrlo.

### Pagos a comercios y repartidores

- [ ] 🔴 **Generar PayoutBatch para drivers**
  - **Cómo probarlo**: En `/ops/payouts`, elegí "Drivers" + el periodo (ej. semana del 10 al 17). Click "Generar".
  - **Qué deberías ver**: Se descarga un CSV con todos los drivers a pagar, montos, cuentas bancarias y pedidos incluidos.

- [ ] 🔴 **Generar PayoutBatch para comercios**
  - **Cómo probarlo**: Igual al anterior pero eligiendo "Comercios".
  - **Qué deberías ver**: Mismo flujo, otro CSV con la lista de comercios.

- [ ] 🔴 **Marcar como pagado con confirmación**
  - **Cómo probarlo**: Después de hacer las transferencias en MercadoPago o banco, vení a OPS y dale "Marcar como pagado" al batch.
  - **Qué deberías ver**: Te pide escribir "CONFIRMAR PAGO" (sin comillas) para confirmar. Después de eso, el batch queda registrado como pagado y los pedidos incluidos no se pueden volver a incluir en otro batch.

- [ ] 🔴 **Reembolso manual con confirmación**
  - **Cómo probarlo**: Hacé un reembolso manual de un pedido desde OPS.
  - **Qué deberías ver**: Pide confirmación textual. Después dispara el reembolso por MP, manda email al cliente y queda en audit log.

- [ ] 🔴 **El CSV cuadra con la fórmula financiera**
  - **Cómo probarlo**: Abrí un CSV de payouts. Sumá manualmente los montos de comisión + delivery fee + (1 - % rider).
  - **Qué deberías ver**: El total que figura como ingreso Moovy en el CSV coincide con la suma de las partes. NO hay diferencias de centavos ni redondeo raro.

---

## 🔧 Cross-cutting (transversal)

### Seguridad

- [ ] 🔴 **Test IDOR: un usuario no puede ver pedidos de otro**
  - **Cómo probarlo**: Como usuario A, copiá la URL `/mis-pedidos/123abc`. Después logueate como usuario B y pegá esa misma URL en el browser.
  - **Qué deberías ver**: Te aparece un error 403 "Acceso denegado". NUNCA podés ver el pedido de otro usuario, incluso si conocés el ID.

- [ ] 🔴 **Test IDOR: un driver no puede marcar el PIN de otro driver**
  - **Cómo probarlo**: Como driver A, intentá hacer la petición de confirmar PIN para un pedido asignado al driver B.
  - **Qué deberías ver**: El sistema rechaza con 403. NUNCA podés interactuar con pedidos de otro driver.

- [ ] 🔴 **Test IDOR: un comercio no puede editar productos de otro**
  - **Cómo probarlo**: Como comercio A, intentá editar un producto del comercio B (cambiá el ID en la URL).
  - **Qué deberías ver**: 403 Acceso denegado. Solo podés editar productos propios.

- [ ] 🔴 **Rate limit en endpoints públicos**
  - **Cómo probarlo**: Hacé más de 60 peticiones por minuto desde la misma IP a un endpoint público (ej. la lista de comercios).
  - **Qué deberías ver**: Después de las 60, devuelve error 429 "Demasiadas peticiones, esperá un minuto". Esto previene abusos.

- [ ] 🔴 **Rate limit en login (anti brute force)**
  - **Cómo probarlo**: Probá loguear con contraseña incorrecta 5 veces seguidas en menos de un minuto.
  - **Qué deberías ver**: Después del 5to intento te bloquea con "Demasiados intentos, esperá X minutos". Esto previene ataques de fuerza bruta.

- [ ] 🔴 **Validación de inputs en todos los formularios**
  - **Cómo probarlo**: En cualquier form (registro, checkout, etc.), enviá datos malformados (campos vacíos, tipos incorrectos, valores extremos).
  - **Qué deberías ver**: El backend rechaza con errores específicos. NO se rompe el server ni se guardan datos inválidos.

- [ ] 🔴 **Upload de imágenes valida tipo y tamaño**
  - **Cómo probarlo**: Probá subir un archivo PDF disfrazado de .jpg, o una imagen de más de 10MB.
  - **Qué deberías ver**: El sistema rechaza con error claro. Solo acepta archivos que sean realmente imágenes y de menos de 10MB.

- [ ] 🔴 **SQL injection bloqueada**
  - **Cómo probarlo**: En cualquier campo de búsqueda o input, escribí cosas tipo `'; DROP TABLE Users; --`.
  - **Qué deberías ver**: El sistema lo trata como texto literal. NO se ejecuta como SQL. Las queries usan parámetros bindings.

- [ ] 🔴 **XSS bloqueado en campos visibles**
  - **Cómo probarlo**: En un campo de comentario o descripción, escribí `<script>alert('xss')</script>`.
  - **Qué deberías ver**: El texto se muestra como texto plano. NO se ejecuta el script. NO aparece el alert.

- [ ] 🔴 **CSRF: requests cross-origin bloqueadas**
  - **Cómo probarlo**: Esto es difícil de probar manualmente — pedile al equipo técnico que confirme.
  - **Qué deberías ver**: Las peticiones desde dominios externos son rechazadas por el sistema. Solo somosmoovy.com puede hacer requests autenticadas.

- [ ] 🔴 **Tokens de MercadoPago están cifrados en la DB**
  - **Cómo probarlo**: Pedile al equipo técnico que mire en la DB el campo `mpAccessToken` de un comercio conectado.
  - **Qué deberías ver**: El valor NO es legible. Está cifrado. Solo se descifra cuando el server lo necesita para hacer una petición a MP.

- [ ] 🔴 **CUIT, CBU, DNI cifrados at-rest**
  - **Cómo probarlo**: Pedile al equipo técnico que verifique los campos sensibles en la DB.
  - **Qué deberías ver**: Valores cifrados. Solo se descifran cuando se devuelven al usuario dueño del dato.

- [ ] 🔴 **Audit log para acciones críticas**
  - **Cómo probarlo**: Hacé un reembolso, una eliminación, una reasignación de driver, o un cambio de rol.
  - **Qué deberías ver**: Cada una de esas acciones queda registrada en la tabla de audit con: quién, cuándo, qué y por qué. Consultable desde OPS.

- [ ] 🟡 **Headers de seguridad básicos configurados**
  - **Cómo probarlo**: Pedile al equipo técnico que verifique los headers HTTP en la respuesta del server.
  - **Qué deberías ver**: Headers como CSP, X-Frame-Options, X-Content-Type-Options bien configurados.

### Performance (velocidad)

- [ ] 🔴 **La home carga rápido en 3G simulado**
  - **Cómo probarlo**: Abrí DevTools (F12) → Network → Throttling → "Slow 3G". Recargá la home.
  - **Qué deberías ver**: La página carga en menos de 6-8 segundos. NO se queda en blanco mucho tiempo — al menos aparece un skeleton mientras carga.

- [ ] 🔴 **Listas de muchos pedidos tienen paginación**
  - **Cómo probarlo**: Como admin, andá a `/ops/pedidos` con más de 50 pedidos en la DB.
  - **Qué deberías ver**: NO se cargan todos juntos. La página muestra 20-50 con botones de "Siguiente".

- [ ] 🔴 **Mapas con muchos markers no traban el browser**
  - **Cómo probarlo**: En `/ops/pedidos/live` con varios pedidos activos, mirá el mapa.
  - **Qué deberías ver**: El mapa se mueve fluido aunque haya 20+ markers. NO se freezea.

- [ ] 🔴 **Imágenes optimizadas (no pesan kilos)**
  - **Cómo probarlo**: En DevTools → Network → filtrar por "Img". Cargá una página con muchas fotos de productos.
  - **Qué deberías ver**: Cada imagen pesa entre 30-200 KB, no megabytes. Están comprimidas y optimizadas.

- [ ] 🟡 **Lazy loading donde aplica**
  - **Cómo probarlo**: Pedile al equipo técnico que confirme.
  - **Qué deberías ver**: Componentes pesados (mapas, modales grandes) se cargan solo cuando se necesitan, no de entrada.

- [ ] 🟡 **No hay N+1 queries en consultas DB**
  - **Cómo probarlo**: Equipo técnico revisa los logs de Prisma con `?logging=true`.
  - **Qué deberías ver**: NO hay queries repetidas (ej. una query por cada item de un listado). Se usan includes / joins.

- [ ] 🟡 **Configuraciones se cachean por 30 segundos**
  - **Cómo probarlo**: Después de cambiar una configuración en OPS, esperá hasta 30 segundos para verla aplicada en la app.
  - **Qué deberías ver**: El cambio se aplica después del ciclo de cache (no es instantáneo, pero es predecible).

### Legal y privacidad

- [ ] 🔴 **Términos y condiciones accesibles**
  - **Cómo probarlo**: Andá a `/terminos`.
  - **Qué deberías ver**: La página carga el texto actualizado de los T&C. Es legible, está bien formateada.

- [ ] 🔴 **Política de privacidad accesible**
  - **Cómo probarlo**: Andá a `/politica-privacidad`.
  - **Qué deberías ver**: La página carga el texto actualizado de la política. Cumple con los requisitos legales argentinos (AAIP).

- [ ] 🔴 **Aceptación de T&C queda registrada (ConsentLog)**
  - **Cómo probarlo**: Creá una cuenta nueva aceptando los términos. Pedile al equipo técnico que verifique el ConsentLog en la DB.
  - **Qué deberías ver**: Existe una fila en `ConsentLog` con tu userId, el timestamp, el contenido aceptado y la versión de los T&C.

- [ ] 🔴 **Eliminación de usuarios es soft delete**
  - **Cómo probarlo**: Eliminá una cuenta. Pedile al equipo técnico que verifique en la DB.
  - **Qué deberías ver**: El usuario sigue existiendo en la tabla con `deletedAt != null`. NO se borra físicamente — eso preserva integridad referencial con pedidos viejos.

- [ ] 🔴 **Auto-delete anonimiza el email del usuario eliminado**
  - **Cómo probarlo**: Eliminá tu cuenta desde el perfil. Verificá el email en la DB.
  - **Qué deberías ver**: El email original se anonimiza (ej. `deleted-abc123@moovy.invalid`). Eso permite que otro pueda usar ese email después.

- [ ] 🔴 **Auto-delete cierra todas las sesiones activas**
  - **Cómo probarlo**: Loguéate en 2 dispositivos. En uno eliminá tu cuenta. En el otro intentá usar la app.
  - **Qué deberías ver**: La otra sesión queda inválida y te saca al login. NO podés seguir operando con la cuenta eliminada.

- [ ] 🔴 **Eliminar pedidos pide confirmación textual**
  - **Cómo probarlo**: Como admin, intentá eliminar un pedido definitivamente desde el endpoint correspondiente.
  - **Qué deberías ver**: Te exige escribir literalmente "ELIMINAR DEFINITIVAMENTE" (sin comillas) para confirmar. NO te deja con un solo click.

- [ ] 🔴 **Datos sensibles cifrados en la DB**
  - **Cómo probarlo**: Verificá en la DB que campos como `cuit`, `cbu`, `dni`, `mpAccessToken` estén cifrados.
  - **Qué deberías ver**: Los valores se ven como strings encriptados, no en texto plano. Solo se descifran al servir al dueño.

- [ ] 🟡 **El usuario puede exportar sus datos (GDPR/AAIP)**
  - **Cómo probarlo**: En el perfil, buscá una opción "Descargar mis datos".
  - **Qué deberías ver**: Si está implementado, recibís un archivo con todos tus datos. Si no está, marca este item como 🚫 bloqueado por feature pendiente.

- [ ] 🟡 **Política de retención de logs documentada**
  - **Cómo probarlo**: Revisá la documentación interna o pedísela al equipo técnico.
  - **Qué deberías ver**: Está documentado cuánto tiempo se guardan los logs (audit, GPS tracking, etc.) antes de borrarse.

### Infraestructura y configuración

- [ ] 🔴 **Todas las variables de entorno seteadas en producción**
  - **Cómo probarlo**: Pedile al equipo técnico que verifique el archivo `.env.production` o las variables del VPS.
  - **Qué deberías ver**: Están todas las críticas: DATABASE_URL, MP_*, SMTP_*, SENTRY_*, VAPID_*, GOOGLE_MAPS_*. NO hay nada vacío.

- [ ] 🔴 **PostgreSQL con PostGIS arriba en producción**
  - **Cómo probarlo**: Pedile al equipo técnico que verifique con `docker ps` o equivalente en el VPS.
  - **Qué deberías ver**: El container de la DB está corriendo. La extensión PostGIS está habilitada (para geolocalización).

- [ ] 🔴 **Webhook de MercadoPago apuntando a producción**
  - **Cómo probarlo**: En el panel de MP, buscá la configuración de webhooks.
  - **Qué deberías ver**: La URL del webhook apunta a `https://somosmoovy.com/api/webhooks/mp` (la URL de prod, no localhost ni staging).

- [ ] 🔴 **El SMTP envía emails correctamente**
  - **Cómo probarlo**: Disparar un email de bienvenida desde producción y revisá la casilla del destinatario.
  - **Qué deberías ver**: Llega el email en menos de 2-3 minutos. NO rebota. NO va a spam (verificar en la primera prueba).

- [ ] 🔴 **Sentry recibe errores del cliente, server y edge**
  - **Cómo probarlo**: Disparar un error a propósito (ej. visitar una URL que sabés que rompe). Después abrí el dashboard de Sentry.
  - **Qué deberías ver**: El error aparece en Sentry con el contexto completo: URL, usuario, navegador, stack trace.

- [ ] 🔴 **Tunnel route de Sentry funciona**
  - **Cómo probarlo**: Con un ad-blocker activo, disparar un error en la app.
  - **Qué deberías ver**: Sentry sigue recibiendo el error porque va por el dominio propio `/monitoring`, no por Sentry directo. NO lo bloquea el ad-blocker.

- [ ] 🔴 **Sentry NO captura datos sensibles**
  - **Cómo probarlo**: Disparar un error después de loguear y hacer un pago. Revisá el evento en Sentry.
  - **Qué deberías ver**: NO aparecen emails, CBU, CUIT, tokens, ni ninguna info sensible. El scrubbing funcionó y reemplazó esos valores por `[REDACTED]`.

- [ ] 🔴 **Servidor de Socket.IO arriba**
  - **Cómo probarlo**: Abrí la app y hacé un pedido. Mirá si los cambios de estado llegan en tiempo real.
  - **Qué deberías ver**: Las actualizaciones aparecen al instante sin refrescar. Significa que el server de sockets está funcionando.

- [ ] 🔴 **Tareas programadas (cron) corren**
  - **Cómo probarlo**: Pedile al equipo técnico que verifique los logs del cron del servidor.
  - **Qué deberías ver**: Los crons configurados (vencimientos de docs, cleanup de GPS antiguo, broadcasts) corren a los tiempos programados. La tabla `CronRunLog` tiene entradas recientes.

- [ ] 🟡 **Redis está arriba o fallback in-memory funciona**
  - **Cómo probarlo**: Equipo técnico verifica.
  - **Qué deberías ver**: O hay un Redis corriendo o, si no, el fallback in-memory del rate-limit funciona en su lugar.

### Monitoreo y observabilidad

- [ ] 🔴 **Logs estructurados con contexto**
  - **Cómo probarlo**: Equipo técnico revisa los logs de Pino en producción.
  - **Qué deberías ver**: Cada línea de log incluye: orderId, userId, action, timestamp. Permite buscar fácil por orderId qué pasó con un pedido.

- [ ] 🔴 **Los webhooks loguean recepción, procesamiento y resultado**
  - **Cómo probarlo**: Hacé un pago de prueba con MP. Revisá los logs del webhook.
  - **Qué deberías ver**: Hay 3 entradas: "Webhook recibido", "Procesando", "Resultado: PAID / FAILED / etc.".

- [ ] 🔴 **Sentry recibe errores en tiempo real**
  - **Cómo probarlo**: Disparar un error intencional y mirá Sentry en una pestaña al lado.
  - **Qué deberías ver**: En menos de 1 minuto el error aparece en Sentry, con todo el contexto y el stack trace.

- [ ] 🔴 **Healthcheck endpoint responde**
  - **Cómo probarlo**: Pegá `https://somosmoovy.com/api/healthcheck` en el browser.
  - **Qué deberías ver**: Responde con `200 OK` y un mensaje tipo `{"status": "ok"}`. Si no responde, el servidor está caído.

- [ ] 🔴 **El CronRunLog se llena con cada ejecución**
  - **Cómo probarlo**: Pedile al equipo técnico que mire la tabla `CronRunLog`.
  - **Qué deberías ver**: Hay entradas recientes por cada cron configurado, con timestamps y status (success/failure).

- [ ] 🟡 **Métricas básicas visibles (request count, error rate, latency)**
  - **Cómo probarlo**: Si está implementado, abrir un dashboard de métricas (Grafana, Datadog, etc.).
  - **Qué deberías ver**: Ves trafico, errores, latencia p95. Si no está implementado, marca este item como 🚫.

### Pagos y MercadoPago

- [ ] 🔴 **Webhook de MP recibe eventos reales en producción**
  - **Cómo probarlo**: Hacé un pago real (o de prueba) con tarjeta APRO (aprobado).
  - **Qué deberías ver**: En pocos segundos el webhook se dispara y el pedido pasa a "Confirmado". El cliente recibe la notificación.

- [ ] 🔴 **El webhook valida que el monto coincide con el total**
  - **Cómo probarlo**: Esto es un test adversarial — el equipo técnico puede simular un webhook con monto distinto al total real.
  - **Qué deberías ver**: Si el monto del webhook NO coincide (con tolerancia de $1) con el total del pedido, el webhook RECHAZA. NO se marca como pagado.

- [ ] 🔴 **El mismo webhook recibido 2 veces no duplica nada**
  - **Cómo probarlo**: El equipo técnico puede mandar el mismo evento dos veces.
  - **Qué deberías ver**: La segunda vez se detecta por el eventId determinístico y se ignora. El pedido NO se procesa dos veces.

- [ ] 🔴 **Pago rechazado dispara reembolso y restaura stock**
  - **Cómo probarlo**: Usá una tarjeta de rechazo (CALL: 4509 9535 6623 3704 con titular OTHE).
  - **Qué deberías ver**: El pedido pasa a "Pago rechazado". El stock que se había descontado se vuelve a sumar. El reembolso automático se dispara para devolver lo que MP pudo haber capturado.

- [ ] 🔴 **El eventId del webhook NO es aleatorio**
  - **Cómo probarlo**: Equipo técnico verifica el código.
  - **Qué deberías ver**: El eventId es determinístico (basado en orderId + paymentId), NO un UUID random. Eso garantiza idempotencia.

- [ ] 🔴 **Las tarjetas de prueba funcionan según su comportamiento**
  - **Cómo probarlo**: Hacé 3 pagos con las cards: APRO (aprueba), CONT (contingencia), CALL (rechaza).
  - **Qué deberías ver**: Cada una se comporta como dice — APRO confirma el pedido, CONT lo deja pendiente, CALL lo rechaza.

- [ ] 🔴 **Split payment funciona cuando el comercio tiene MP OAuth conectado**
  - **Cómo probarlo**: Tené un comercio con MP conectado vía OAuth. Hacé un pedido pagado con MP.
  - **Qué deberías ver**: El pago va directo a la cuenta MP del comercio con la comisión Moovy descontada automáticamente. Moovy no toca la plata del comercio.

- [ ] 🔴 **Comisión mes 1 del comercio es 0%**
  - **Cómo probarlo**: Crea un comercio nuevo, aprobalo, hacé pedidos en los primeros 30 días.
  - **Qué deberías ver**: Cada pedido cobra 0% de comisión a ese comercio durante los primeros 30 días desde su creación.

- [ ] 🔴 **Comisión mes 2 BRONCE es 8%**
  - **Cómo probarlo**: Comercio con más de 30 días que está en nivel BRONCE (los nuevos arrancan ahí).
  - **Qué deberías ver**: Cada pedido le cobra 8% de comisión. Si vendió $1.000, el ingreso para Moovy es $80.

- [ ] 🔴 **Comisión seller marketplace es 12% desde el día 1**
  - **Cómo probarlo**: Vendedor del marketplace con cualquier antigüedad.
  - **Qué deberías ver**: Cada pedido le cobra 12% desde el primer día. NO tiene período de gracia.

- [ ] 🔴 **Cupón aplicado lo absorbe Moovy, no el comercio**
  - **Cómo probarlo**: Mirá la fórmula financiera de un pedido con cupón aplicado.
  - **Qué deberías ver**: El descuento del cupón se descuenta del ingreso Moovy, NO de lo que cobra el comercio.

### Comunicaciones (matriz de notificaciones)

- [ ] 🔴 **Pedido creado → notificación al buyer**
  - **Cómo probarlo**: Hacé un pedido como buyer y mirá la app + email + mensajes in-app.
  - **Qué deberías ver**: Te llega: push notification "Tu pedido fue recibido", email con detalles, y cartel in-app en mis pedidos.

- [ ] 🔴 **Pedido confirmado por el comercio → notificación al buyer**
  - **Cómo probarlo**: El comercio confirma un pedido tuyo.
  - **Qué deberías ver**: Push "Tu pedido fue confirmado" + email con el comprobante.

- [ ] 🔴 **Pedido listo (READY) → notificación al buyer**
  - **Cómo probarlo**: El comercio marca el pedido como listo.
  - **Qué deberías ver**: Push "Tu pedido está listo, buscamos repartidor" + actualización en mis pedidos.

- [ ] 🔴 **Driver asignado → notificación al buyer + activación de chat**
  - **Cómo probarlo**: El sistema asigna un driver al pedido.
  - **Qué deberías ver**: Push "Tu repartidor está en camino: [nombre]" + el chat con el driver queda activo en el detalle del pedido.

- [ ] 🔴 **Driver en camino al cliente (PICKED_UP) → notificación al buyer**
  - **Cómo probarlo**: El driver retira el pedido del comercio (escanea PIN).
  - **Qué deberías ver**: Push "Tu pedido ya fue retirado, está en camino" + el mapa empieza a mostrar el viaje del driver hacia tu dirección.

- [ ] 🔴 **Driver cerca del destino → notificación al buyer**
  - **Cómo probarlo**: El driver se acerca a menos de 500m del cliente.
  - **Qué deberías ver**: Push "Tu repartidor está cerca, prepará tus datos" + cartel destacado en mis pedidos.

- [ ] 🔴 **Pedido entregado → notificación al buyer + modal de calificación**
  - **Cómo probarlo**: El driver confirma la entrega con el PIN.
  - **Qué deberías ver**: Push "¡Pedido entregado!" + cuando abrís la app aparece automáticamente el modal de calificación.

- [ ] 🔴 **Pedido cancelado por el comercio → notificación al buyer + reembolso**
  - **Cómo probarlo**: El comercio rechaza un pedido pagado con MP.
  - **Qué deberías ver**: Push "Tu pedido fue rechazado" + email con motivo + reembolso automático procesado.

- [ ] 🔴 **Pedido sin driver (UNASSIGNABLE) → notificación al buyer + reembolso**
  - **Cómo probarlo**: Hacé un pedido en zona/horario sin drivers disponibles. Esperá a que el sistema lo declare unassignable.
  - **Qué deberías ver**: Push "No conseguimos repartidor" + email + reembolso automático.

- [ ] 🔴 **Welcome email al registrarse (por cada rol)**
  - **Cómo probarlo**: Creá una cuenta nueva como buyer, otra como comercio, otra como driver y otra como seller.
  - **Qué deberías ver**: Cada uno recibe su email de bienvenida específico: BuyerWelcome / MerchantWelcome / DriverWelcome / SellerWelcome.

- [ ] 🔴 **OPS recibe email cuando un comentario queda en moderación**
  - **Cómo probarlo**: Como buyer, dejá una reseña con una palabra prohibida (palabrota, ofensa).
  - **Qué deberías ver**: El comentario queda en moderación. El equipo Moovy recibe un email avisando para revisar.

- [ ] 🟡 **Push de recordatorio si no calificaste un pedido entregado**
  - **Cómo probarlo**: Esperá 24h después de un pedido entregado sin calificar.
  - **Qué deberías ver**: Te llega un push amable "¿Qué tal estuvo tu pedido del [fecha]?". Si ya calificaste, no llega.

### Soporte y UX general

- [ ] 🔴 **WhatsApp soporte funciona cuando el GPS bloquea al driver**
  - **Cómo probarlo**: Bloqueá un PIN por geofence. Click "o escribí a soporte por WhatsApp".
  - **Qué deberías ver**: Se abre WhatsApp (app o web) con un mensaje pre-armado mencionando el problema de GPS y el pedido.

- [ ] 🔴 **WhatsApp soporte funciona cuando el PIN se bloquea por intentos**
  - **Cómo probarlo**: Errá el PIN 5 veces. Click el link de soporte.
  - **Qué deberías ver**: Se abre WhatsApp con mensaje pre-armado diferente al GPS: dice "se bloqueó por superar intentos" y menciona el pedido.

- [ ] 🔴 **Botón universal "¿Tenés problemas?" al final del PIN**
  - **Cómo probarlo**: En cualquier momento del modal del PIN, sin haber errado ni geofence, mirá el botón al final.
  - **Qué deberías ver**: Siempre hay un botón "¿Tenés problemas? Hablá con soporte" abajo del todo. Funciona como fallback genérico.

- [ ] 🔴 **Página `/soporte` accesible y funcional**
  - **Cómo probarlo**: Andá a `https://somosmoovy.com/soporte`.
  - **Qué deberías ver**: La página carga con info de contacto, WhatsApp link, email de soporte, etc. NO está rota ni vacía.

- [ ] 🔴 **Errores user-facing dicen qué hacer**
  - **Cómo probarlo**: Provocá distintos errores (login incorrecto, payment failed, geofence, etc.).
  - **Qué deberías ver**: Cada mensaje de error dice claramente qué hacer (ej. "Esperá 5 minutos e intentá de nuevo" o "Tu pago fue rechazado, probá con otra tarjeta"). NUNCA dice solo "Error 500" o "Internal Server Error".

- [ ] 🔴 **Mensajes en español argentino, sin anglicismos innecesarios**
  - **Cómo probarlo**: Recorré toda la app y prestá atención a los textos.
  - **Qué deberías ver**: "Andá", "Dale", "Listo", "Probá", "Mirá" en lugar de "Vaya", "Vea", etc. NO usa "Login" si puede decir "Iniciar sesión". NO usa "Submit" si puede decir "Enviar".

- [ ] 🔴 **NUNCA aparece la palabra "OPS" en textos visibles al usuario**
  - **Cómo probarlo**: Recorré la app y buscá la palabra "OPS" en mensajes, errores, emails.
  - **Qué deberías ver**: NO aparece. En su lugar dice "el equipo de Moovy", "soporte" o similar.

- [ ] 🔴 **NUNCA se menciona a competidores en textos visibles**
  - **Cómo probarlo**: Buscá "PedidosYa", "Rappi", "MercadoLibre" en cualquier texto user-facing.
  - **Qué deberías ver**: NO aparecen. Moovy es un movimiento, no una comparación.

- [ ] 🔴 **Pantallas vacías son amigables**
  - **Cómo probarlo**: Andá a "Mis pedidos" cuando todavía no hiciste ninguno. Mirá la pantalla.
  - **Qué deberías ver**: En lugar de un blanco vacío, aparece un mensaje + ícono + CTA tipo "Todavía no hiciste pedidos. Empezá a explorar la tienda".

- [ ] 🔴 **Cargas muestran skeletons (no spinners en pantalla blanca)**
  - **Cómo probarlo**: Refrescá una página con conexión lenta.
  - **Qué deberías ver**: En lugar de pantalla en blanco con un spinner, ves placeholders grises con la forma del contenido. Mejora la sensación de velocidad.

- [ ] 🔴 **Todo lo crítico funciona en mobile (mobile-first)**
  - **Cómo probarlo**: Hacé todos los flujos importantes desde un celular real (NO desde DevTools simulando).
  - **Qué deberías ver**: Registro, login, búsqueda, checkout, tracking, calificación — todo es usable en pantalla chica. Botones grandes, texto legible.

- [ ] 🔴 **Botones se pueden tocar fácil con el dedo (≥44px)**
  - **Cómo probarlo**: En mobile, intentá tocar los botones más chicos de la app.
  - **Qué deberías ver**: Ningún botón es tan chico que se hace difícil tocarlo. El mínimo aproximado es 44px de altura, lo que recomienda Apple/Google.

---

## 📊 Resumen de progreso

Cuando termines de testear, pedile a Claude:

> "Leé el archivo `PRELAUNCH_CHECKLIST.md` y armá el plan de acción para lanzar."

Y Claude va a:

1. Contar % testeado total y por sección
2. Listar todos los ❌ y ⚠️ ordenados por criticidad (🔴 primero)
3. Listar los 🚫 con la razón del bloqueo
4. Proponer plan de acción priorizado
5. Decir si estamos listos para lanzar o qué falta

---

_Generado por la rama `chore/prelaunch-qa-checklist` — última edición de explicaciones en `chore/checklist-explicaciones-amigables` (2026-05-17)_
