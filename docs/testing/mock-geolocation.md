# Mockear ubicación GPS para testing — Chrome DevTools

> Rama: `chore/seed-mundo-real`. Documento para correr el checklist pre-launch
> sin tener que salir físicamente a las direcciones reales en Ushuaia.

## Por qué mockear el GPS

Varios endpoints de Moovy validan que el dispositivo del usuario esté **a menos
de 100m del destino** antes de aceptar acciones críticas. Por ejemplo:

- El driver no puede ingresar el PIN de retiro si no está dentro de los 100m del comercio
- El driver no puede ingresar el PIN de entrega si no está dentro de los 100m del cliente
- El cliente no puede confirmar pedidos sin geolocalización válida

Para testear el flow completo desde tu computadora **sin moverte**, usás el panel
"Sensors" de Chrome DevTools que le **miente al `navigator.geolocation`** y le hace
creer al browser que estás en cualquier lat/lng que vos definas.

Esto es lo que usan los QA teams de Rappi/PedidosYa para sus pruebas internas.

## Cómo abrir el panel Sensors

1. Abrir Chrome DevTools: `F12` o `Ctrl+Shift+I` (Windows) / `Cmd+Opt+I` (Mac)
2. Click en los 3 puntos verticales arriba a la derecha del panel
3. **More tools → Sensors**
4. Aparece un panel inferior con tres secciones: Location / Orientation / Idle state
5. En **Location**, dropdown "No override" → cambiar a **"Custom location..."**
6. Escribir lat y lng en los inputs
7. La página recibe `navigator.geolocation` mockeado con esos valores

**Importante**: el override **persiste mientras DevTools esté abierto**. Si cerrás
DevTools, vuelve a la geolocalización real del navegador.

## Coordenadas para copiar — cuentas test

Las cuentas seedeadas con `seed-real-world-test.ts` están distribuidas en las
3 zonas de delivery para cubrir la matriz completa de pruebas:

| Cuenta | Email | Zona | Dirección | Lat | Lng |
|---|---|---|---|---|---|
| **Buyer Centro** | `buyer.test@moovy.local` (Address 1, default) | **A** ×1.0 | Av. San Martín 850 | `-54.806` | `-68.302` |
| **Buyer Intermedia** | `buyer.test@moovy.local` (Address 2) | **B** ×1.15 | Las Primulas 191 | `-54.793` | `-68.310` |
| **Buyer Alta** | `buyer.test@moovy.local` (Address 3) | **C** ×1.35 | Haruwen 2329 | `-54.785` | `-68.320` |
| Merchant | `merchant.test@moovy.local` | A | Magallanes 250 | `-54.808` | `-68.309` |
| Driver | `driver.test@moovy.local` | A | Magallanes 600 | `-54.807` | `-68.311` |
| Seller | `seller.test@moovy.local` | A | Magallanes 900 | `-54.806` | `-68.313` |

Password único de todas las cuentas: `Test1234!`

## Lógica de zonas en Ushuaia

Las zonas las marcan calles principales reales:

- **Zona A** (Centro): desde el Canal Beagle al sur hasta **Av. Alem (Ruta 3)** al norte
- **Zona B** (Intermedia): desde **Av. Alem** hasta **Las Primulas**
- **Zona C** (Alta): desde **Las Primulas** hacia las montañas

El buyer tiene 3 direcciones (una por zona) y elige cuál usar al hacer cada
checkout. Eso te permite probar las 3 multiplicadores sin cambiar nada más.

Las otras 3 cuentas (Merchant, Driver, Seller) están agrupadas en Magallanes
(Zona A, céntrica) — el flow de retiro y entrega del driver pasa siempre por
ahí, y el multiplicador de zona se aplica al **destino del pedido** (la dirección
elegida por el buyer en checkout), no al origen.

## Flow típico durante el checklist

Cuando estés actuando como **driver** y necesitás validar PINs (pickup en el
comercio + delivery en el cliente), vas a tener que **cambiar la ubicación
mockeada DOS veces** durante el mismo test:

1. **Antes del PIN de retiro**: setear lat/lng al **comercio** (-54.808 / -68.306, Zona A)
2. **Antes del PIN de entrega**: setear lat/lng a la **dirección de destino del pedido**
   (la que el buyer eligió en checkout — Centro / Intermedia / Alta)

Tip: pegá las 6 coords en un sticky note al costado de la pantalla mientras corrés
el checklist, así no perdés tiempo buscándolas.

## Tip avanzado — perfil de Chrome separado para testing

Si vas a estar logueado como Buyer en una pestaña, Driver en otra y Admin OPS
en una tercera, conviene usar **perfiles distintos de Chrome** (cada uno con su
propia sesión y cookies):

1. Click en avatar arriba a la derecha de Chrome → **Add another profile**
2. Crear "Moovy QA Buyer", "Moovy QA Driver", "Moovy QA Admin"
3. Cada perfil mantiene su propio Sensors override y su propia sesión

Sin esto, tendrías que estar logueando y deslogueando todo el tiempo entre roles.

## Si querés probar más allá del seed

Cualquier dirección de Ushuaia funciona. Para sacar las coords de una dirección
específica:

1. Abrir Google Maps, buscar la dirección
2. Click derecho en el pin → **What's here?**
3. Las coords aparecen en una tarjeta abajo: `-54.8019, -68.3030`
4. Pegar en el panel Sensors

## Limitaciones

- El override solo afecta a la **pestaña activa**, no a toda la app
- Si el código consulta GPS por **otro lado** que no sea `navigator.geolocation`
  (ej: API externa de tracking), el mock no funciona ahí
- En producción NUNCA hacer esto — es solo para development/QA

## Troubleshooting

**El sensor dice "Custom location" pero la app sigue pidiendo permiso de
geolocalización**: tenés que aceptar el permiso una vez (con el override
activo). Después funciona.

**El override no se aplica**: cerrar y reabrir DevTools. A veces se "olvida"
después de un hot-reload de Next.js.
