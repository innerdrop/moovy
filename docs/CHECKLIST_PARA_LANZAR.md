# Lo que falta para lanzar Moovy

> Checklist simple. Tildá a medida que vas cerrando. Actualizado: 2026-06-18.
> (Lo grande de QA está en `prelaunch-checklist.html`; esto es solo lo que queda.)

---

## Antes del launch

### 1. Configurar las categorías de la home
- [ ] En `/ops/categorias`, activar/ordenar las categorías que se ven en la portada.
- Sin esto, la home no muestra categorías.

### 2. Pintar / confirmar las zonas de cobertura
- [ ] En `/ops/zonas-delivery`, confirmar que las zonas donde repartís estén bien dibujadas.
- Fuera de esas zonas, el checkout bloquea el pedido.

### 3. Probar un pago real con MercadoPago
- [ ] Hacer 1 compra real de punta a punta y ver que el pago entra.
- [ ] (Si podés) probar el split con 3 cuentas MP distintas (comprador, comercio, Moovy).

### 4. Re-probar 5 cositas sueltas (solo mirar que anden)
- [ ] **Bonus de bienvenida**: cuenta nueva → `/puntos` muestra "1.000 puntos pendientes" (se activan con 1ra compra de $5.000+).
- [ ] **Email al comercio**: registrarse como comercio → llega el mail "Recibimos tu registro".
- [ ] **Errores en OPS**: una acción que falla a propósito muestra un aviso rojo claro (no "Error 500").
- [ ] **Variantes de producto**: un listing con talle/color → el comprador elige y baja el stock correcto.
- [ ] **Fuera de zona**: dirección en zona excluida → el checkout no deja pagar y avisa "No entregamos en esta zona".

---

## El día del launch

### 5. Limpiar los datos de prueba
- [ ] Correr el script de limpieza (borra pedidos/cuentas de prueba, deja la config intacta).

### 6. Abrir la tienda al público
- [ ] Correr `.\scripts\abrir-tienda.ps1` (saca la cortina "Próximamente").

---

## Ya está hecho ✅ (para tu tranquilidad)
- Deploy del batch a producción
- Cortina puesta (sitio privado hasta el launch)
- Crons andando de nuevo
- Campana de notificaciones en OPS
- Sección de Puntos (wording + chip de saldo)
- Logo del comercio (confirmado)
