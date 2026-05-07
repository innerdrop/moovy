# Observaciones detectadas en smoke test de producción

# 1 - /ops

1A - En el panel de OPS se puede crear un usuario, un repartidor o dar de alta un comercio, pero el formulario es distinto al original. Por ejemplo, en OPS me pide que coloque el nombre completo en un solo box de entrada, pero en repartidor/registro el nombre y el apellido te lo pide en dos campos separados, esto luego quizás genere conflicto. El formulario de OPS debe solicitar los mismos campos que el registro disponible al cliente solo que OPS puede evadir los campos obligatorios ya que es justamente el admin de moovy.

1B - Cuando un usuario nuevo, sea el rol que sea, se registre, deberia haber un indicador de cuantas solicitudes nuevas hay en el boton de Usuarios en el menú como lo tiene "En Vivo" que se pone en verde cuando hay un nuevo pedido, solo que en usuarios deberia figurar el numero de pendientes por aprobacion que hay dentro de un circulo amarillo (img03)

# 2 - /repartidor/registro

2A - En el formulario del driver en la pagina 2 del registro indica que luego se le pedirá RTO. Creo que el RTO no deberia ser obligatorio por moovy, cualquier cosa, si transito para al vehiculo, se le hara la multa al conductor por falta de RTO y creo que eso no tiene que ver con moovy, que opina el área Legal sobre esto? Si no es necesario, lo vamos a quitar del formulario y también no vamos a pedir el RTO, por lo tanto, si la decision es quitarlo, lo quitamos.

2B - En la pagina 3 del registro del Driver, en la pagina de confirmación, los campos que no fueron solicitados no deberían aparecer, por ejemplo, el DNI, el CUIT, todo esos datos no los pide el formulario, no debería aparecer en la pagina de confirmación (img02)

2C - En los términos y condiciones del repartidor, chequeando la consola, me aparece un error en produccion que no sé que significa (ver img01)

# 3 - /login

3a - Cuando el usuario ingresa al sitio y quiere loguearse, deberia poder seleccionar a qué panel quiere ingresar. Obviamente si no tiene alguno de los roles, no podrá. Pero hoy el login solo ingresa directamente a al tienda. En realidad esta bien porque no importa que tipo de rol elijas siempre vas a poder entrar a al tienda con el mismo correo. Pero entonces, no se que opinara el consejo, pero en ingresar deberia uno poder seleccionar con que rol quiere entrar

3b - Cuando una persona se registra con un rol, debe llegarle un correo que le de la bienvenida con el rol principal que elijió, por ejemplo: Se registra primero como driver, entonces le llega un correo electronico de bienvenida como driver, mientras carga sus documentos y moovy aprueba su perfil como driver, puede acceder con su mismo correo y contraseña a la tienda, al marketplace o incluso en Mi Perfil, puede registrar su comercio o ser vendedor en marketplace. (Esto es solo un ejeplo, quizas solo hay que agregarlo en Email de OPS como un nuevo correo automatico mas)
