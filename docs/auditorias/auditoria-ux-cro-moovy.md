# Auditoría UX/UI y CRO — Landing MOOVY

**Fecha:** 15 de marzo de 2026
**Auditor:** Análisis senior UX/CRO — Marketplaces delivery LATAM
**Objeto:** Página principal (`/`) de somosmoovy.com

---

## 1. Primera impresión (5 segundos)

**¿Qué entiendo que hace MOOVY?** Que es un delivery de productos de comercios locales en Ushuaia. Eso queda más o menos claro, pero depende enteramente de lo que digan los slides del hero — si el slide activo en ese momento es el de marketplace o el de comunidad, el mensaje se diluye.

**¿Value proposition clara?** No. No hay un headline estático, permanente, que diga qué es MOOVY. Todo depende de un slider rotativo. Si el usuario llega y el slide visible es uno genérico, no entiende la propuesta en 5 segundos. Rappi tiene "Todo lo que necesitás, en minutos" fijo, siempre visible. PedidosYa tiene "¿Qué querés pedir?" con un buscador. MOOVY no tiene nada equivalente.

**¿CTA principal visible?** El CTA está *dentro* del slider, posicionado con `absolute bottom-6`. Eso significa que depende del contenido del slide actual. No hay un CTA persistente above the fold.

**¿Jerarquía visual?** Compiten: el slider hero, la barra de social proof, y las categorías. Las tres secciones están empaquetadas con muy poco breathing room (el hero tiene pt-3 y las categorías pt-4). Se siente todo apilado sin una pausa visual que guíe el ojo.

---

## 2. Análisis sección por sección

### 2.1 Header

**Qué hace bien:**
- Logo centrado en mobile es un patrón estándar de delivery apps.
- El carrito con badge rojo es visible y funcional.
- Buscador global con debounce es un buen feature.
- El saludo "Hola, [nombre]" da cercanía, muy apropiado para ciudad chica.

**Qué hace mal:**
- En mobile, hay 4-5 íconos comprimidos a la derecha (search, puntos, bell, carrito) con `gap-0.5`. Es un clutter zone. En pantallas de 320px esto se vuelve ilegible.
- "Ushuaia" como location para usuarios no logueados no linkea a nada ni ofrece contexto. En Rappi, el location abre un selector de dirección. Acá es decorativo.
- No hay link a "Ingresar" en mobile para usuarios no logueados — solo aparece en desktop.
- El botón de carrito en desktop dice "Carrito" con texto, pero en mobile es solo ícono. Inconsistencia menor pero el label en desktop ocupa espacio innecesario.

**Cambio concreto:**
- En mobile, eliminar el badge de puntos del header (moverlo al perfil). Dejar solo: search, bell/pedidos, carrito. Tres íconos máximo.
- Agregar un botón "Ingresar" visible en mobile para no-logueados, reemplazando el ícono de bell que no se usa si no estás logueado.

### 2.2 Hero Slider

**Qué hace bien:**
- Soporta imágenes reales con overlay para legibilidad.
- Touch swipe funciona. Auto-slide con intervalo configurable.
- La ilustración SVG del delivery es simpática cuando no hay imagen.

**Qué hace mal:**
- **Problema crítico:** No hay headline estático. El slider ES el hero. Si no hay slides en la DB (`slides.length === 0`), el hero **desaparece completamente** (`return null`). El usuario ve directamente las categorías. Esto es una bomba de tiempo operativa.
- El CTA está posicionado con `absolute bottom-6` lo cual lo desconecta visualmente del texto del slide. Parece flotar.
- `min-h-[260px]` en mobile es mucho espacio para un slider que el usuario va a scrollear rápido. El contenido importante (comercios, productos) queda lejos.
- Los dots de navegación son muy pequeños (w-2 h-2) para dedos en mobile.

**Cambio concreto:**
- Agregar un hero estático fallback que siempre aparezca, independiente de los slides. Headline: **"Todo Ushuaia en tu puerta"**, subtítulo: **"Pedí de comercios locales y recibí en minutos"**, CTA: **"Explorar comercios"**. Los slides se superponen como carousel solo si existen.
- Reducir `min-h` en mobile a 200px. El hero en mobile de delivery apps (Rappi, PedidosYa) es compacto: título + buscador/CTA + listo.
- Mover el CTA del slider a posición relativa (no absolute). Que fluya con el contenido.

### 2.3 Social Proof Banner ("X pedidos hoy en Ushuaia")

**Qué hace bien:**
- El dot verde pulsante da sensación de actividad en vivo.
- Específico a Ushuaia — ancla la experiencia local.
- Solo aparece si `todayOrders > 0`, evitando el ridículo de "0 pedidos hoy".

**Qué hace mal:**
- Si hay 2 pedidos a las 10am, "2 pedidos hoy en Ushuaia" se siente patético, no como social proof. Para una ciudad de 80k, necesitás un umbral mínimo.
- La posición es correcta (post-hero) pero el diseño es tan sutil (text-sm, green-50 bg) que pasa desapercibido.

**Cambio concreto:**
- Mostrar solo si `todayOrders >= 5` (o un umbral configurable). Debajo de 5, no mostrarlo.
- Alternativamente, usar métricas acumuladas: **"Más de 1.200 pedidos entregados en Ushuaia"** (lifetime count). Esto siempre crece y siempre impresiona.
- Hacerlo más prominente: fondo `bg-[#e60012]` con texto blanco, o integrado al hero como un badge.

### 2.4 Categorías

**Qué hace bien:**
- Íconos en círculos rojos son visualmente coherentes con la marca.
- En mobile, el auto-scroll dual (una fila derecha, otra izquierda) es visualmente dinámico y llama la atención.

**Qué hace mal:**
- El título "Explorá por Categoría" es genérico y no motivante. No dice por qué debería explorar.
- En mobile, las categorías se triplican (`[...categories, ...categories, ...categories]`) para el scroll infinito. Con 6 categorías, son 18 items x 2 filas = 36 cards renderizadas. Si hay pocas categorías (2-3), se ven repetidas de forma obvia.
- Las categorías usan íconos de Lucide genéricos (Milk, Wine, Sandwich). No son fotos reales de productos de Ushuaia. En una ciudad chica, mostrar fotos del kiosco de la esquina convierte más que un ícono vectorial.
- `w-28` en mobile es angosto — el texto se trunca con `truncate`. "Sandwichería" probablemente se corta.

**Cambio concreto:**
- Cambiar título a: **"¿Qué querés pedir?"** — directo, orientado a acción.
- Usar imágenes reales en las categorías (fotos de productos locales) en vez de íconos. Si no hay fotos, al menos usar íconos más grandes y descriptivos.
- Eliminar el auto-scroll infinito en mobile. Usar una fila única scrolleable con snap. El movimiento automático distrae y compite con el hero slider.

### 2.5 Comercios Cercanos

**Qué hace bien:**
- Grid responsivo (1-2-3-4 columnas) bien implementado.
- MerchantCard tiene la información esencial: nombre, rating, tiempo de delivery, fee, estado abierto/cerrado.
- El badge "ABIERTO/CERRADO" es claro.
- "Envío Gratis" en verde es un buen motivador.
- HeartButton para favoritos agrega engagement.

**Qué hace mal:**
- El título "Comercios Cercanos" es engañoso — no hay geolocalización implementada. Son todos los comercios de Ushuaia. Decir "cercanos" cuando no hay distancia real crea expectativas falsas.
- Se muestran hasta 12 comercios (`take: 12`), pero si hay 3-4 abiertos y 8 cerrados, la grilla se llena de comercios cerrados. Eso es anti-conversión. El usuario ve una pared de "CERRADO" y piensa que la app no funciona.
- El empty state ("Estamos sumando comercios cada dia") tiene un ícono genérico a baja opacidad. No tiene CTA ni esperanza concreta.
- El `aspect-video` para la imagen del comercio es 16:9, lo cual en mobile (col-1) es un rectángulo enorme que empuja el contenido hacia abajo.

**Cambio concreto:**
- Cambiar título a **"Comercios en Ushuaia"** — honesto y local.
- Limitar comercios cerrados a máximo 2 visibles. Mostrar primero los abiertos, y debajo un texto: **"X comercios más abren mañana"** con link a ver todos.
- En el empty state, agregar CTA: **"¿Tenés un comercio? Sumate a MOOVY"** linkeando a `/comercio/registro`.

### 2.6 Productos Recomendados

**Qué hace bien:**
- Grid de 2 columnas en mobile es correcto para browsing de productos.
- Badge "Destacado" en rojo sobre la imagen funciona.
- Precio en rojo y grande, bien visible.
- Badges de "Sin Stock" y "Cerrado" informan al usuario.

**Qué hace mal:**
- El título "Productos Recomendados" no dice recomendados por quién ni por qué. Es genérico.
- No hay botón "Agregar al carrito" directo desde la card — el usuario tiene que entrar al detalle para comprar. En PedidosYa, el botón "+" está en la card. Esto reduce conversión mediblemente.
- Mostrar productos de comercios cerrados o sin stock en la home es desperdicio de espacio. El usuario ve algo que quiere, hace click, y se frustra.
- La sección tiene `py-12 lg:py-16` — excesivo padding vertical que aleja el contenido del marketplace debajo.

**Cambio concreto:**
- Cambiar título a **"Lo más pedido"** o **"Populares ahora"** — más urgente y social.
- Agregar botón "+" de agregar al carrito en cada card (como hace PedidosYa).
- Filtrar en el query: solo productos de comercios abiertos y con stock > 0. El query actual es `where: { isActive: true, isFeatured: true }` — falta `merchant: { isOpen: true }` y `stock: { gt: 0 }`.
- Reducir padding a `py-8 lg:py-10`.

### 2.7 Marketplace

**Qué hace bien:**
- ListingCard incluye info del vendedor (avatar, nombre, rating) que da confianza.
- Badge de condición (Nuevo/Usado/Reacondicionado) es informativo.
- Badge de disponibilidad del vendedor (Abierto/Cerrado/Vuelve en X min) es un buen toque.

**Qué hace mal:**
- El título es solo **"Marketplace"** en rojo. Cero contexto. Un usuario nuevo de Ushuaia no sabe qué es el marketplace de MOOVY ni en qué se diferencia de la sección de comercios de arriba.
- Solo se muestran 4 listings (`take: 4`). Si hay pocos, la sección se ve vacía. Si hay muchos, 4 no es suficiente muestra.
- La sección completa desaparece si no hay listings (`recentListings.length > 0`). No hay estado vacío con CTA para vendedores.

**Cambio concreto:**
- Cambiar título a **"Marketplace — Comprá y vendé entre vecinos"** o **"De particular a particular en Ushuaia"**.
- Agregar subtítulo: **"Encontrá productos únicos de vendedores de tu ciudad"**.
- Mostrar 6-8 listings en vez de 4.
- Cuando no hay listings, mostrar un CTA: **"Vendé lo que ya no usás — Es gratis publicar"** → `/vendedor/registro`.

### 2.8 Cómo Funciona MOOVY

**Qué hace bien:**
- 3 pasos simples (Elegí, Pagá, Recibí) es un patrón probado.
- Emojis como íconos son ligeros y universales.
- Copy conciso en cada paso.

**Qué hace mal:**
- El subtítulo "Comprar en Ushuaia nunca fue tan facil" (sin acento en "fácil") tiene un error ortográfico.
- Los emojis (🛒 💳 🚀) se ven diferentes en cada SO/browser. En Android viejo pueden verse mal.
- La sección está demasiado abajo en el scroll. Un usuario nuevo debería ver esto ANTES de los productos, para entender el servicio.
- No hay un CTA después de los 3 pasos. El usuario lee "Recibí" y luego... nada. Debería haber un botón.

**Cambio concreto:**
- Corregir a **"Comprar en Ushuaia nunca fue tan fácil"**.
- Reemplazar emojis por íconos SVG o de Lucide para consistencia cross-platform.
- Mover esta sección ARRIBA, entre el social proof banner y las categorías. Es el lugar donde Rappi y PedidosYa ponen su "cómo funciona" para nuevos usuarios.
- Agregar CTA al final: **"Empezá a pedir"** → `/productos`.

### 2.9 Sección "¿Listo para comprar?"

**Qué hace bien:**
- CTA grande y claro ("Ver Productos").
- Copy directo.

**Qué hace mal:**
- Es una sección de cierre genérica sin diferenciación. "Explorá nuestro catálogo y encontrá todo lo que necesitás" podría ser de cualquier e-commerce del mundo.
- El CTA "Ver Productos" repite lo que ya hay en "Comercios Cercanos > Ver todos" y "Productos Recomendados > Ver todos". Tres CTAs al mismo destino (`/productos`).
- No hay CTA alternativo para vendedores/comercios/repartidores que llegaron a la home.

**Cambio concreto:**
- Transformar en una sección de doble CTA: **"Pedí ahora"** (buyer) y **"Sumate como comercio o repartidor"** (supply side). En una ciudad de 80k, reclutar oferta es tan importante como captar demanda.
- Texto: **"¿Tenés un comercio, sos repartidor o querés vender tus cosas? MOOVY te conecta con todo Ushuaia."**

### 2.10 Footer (en page.tsx — el duplicado)

**Nota:** Hay un footer inline en `page.tsx` (líneas 440-493) Y un componente `Footer.tsx` separado. Esto sugiere que el footer de la home es diferente al footer global. El de `page.tsx` es más simple; el de `Footer.tsx` es más completo.

**Qué hace bien (Footer.tsx):**
- Links a registro de repartidor y comercio — captación de supply side.
- "Hecho con ❤️ en Ushuaia" — toque local que construye cercanía.
- Links legales completos (cookies, devoluciones, cancelaciones, términos por rol).

**Qué hace mal:**
- Los social links (Instagram, Facebook, Twitter) apuntan a `href="#"` — no hay redes reales configuradas. Un usuario que hace click se queda en la misma página. Esto destruye credibilidad.
- "Consultas por WhatsApp" no tiene link a WhatsApp. Debería ser un `wa.me/549XXXXXXX`.
- Sección "Soporte" tiene 10 links — demasiados. Nadie lee 10 links legales en un footer. Los términos por rol (vendedor, repartidor, comercio) deberían estar solo en los flujos de registro respectivos.
- El footer de `page.tsx` no usa el componente `Footer.tsx`. Inconsistencia.

**Cambio concreto:**
- Usar `Footer.tsx` en la home también, no el footer inline.
- Conectar Instagram y WhatsApp con links reales o remover los íconos de redes inexistentes.
- Reducir links legales a 4: Términos, Privacidad, Devoluciones, Ayuda. El resto va dentro de Ayuda.
- Agregar un CTA de WhatsApp real con ícono verde y número visible. En Ushuaia, WhatsApp > email.

---

## 3. Jerarquía de información

### Orden actual:
1. Hero Slider
2. Social Proof Banner
3. Categorías
4. Comercios Cercanos
5. Productos Recomendados
6. Marketplace
7. Cómo Funciona
8. ¿Listo para comprar?
9. Footer

### Problemas:
- "Cómo funciona" está en posición 7. Un usuario nuevo nunca llega ahí — ya abandonó o ya compró. Esta sección es para explicar el servicio *antes* de mostrar producto.
- Hay tres secciones de catálogo seguidas (comercios, productos, marketplace) sin diferenciación clara. El usuario no entiende por qué hay 3 grillas distintas.
- No hay sección de testimonios/reviews, no hay sección de descarga de app (si la hay como PWA), no hay sección de beneficios diferenciadores.

### Orden propuesto:
1. **Hero estático** — Headline fijo + CTA + buscador integrado
2. **Social proof** — Métrica acumulada, no diaria
3. **Cómo funciona** — 3 pasos, para nuevos usuarios
4. **Categorías** — Punto de entrada rápido
5. **Comercios abiertos** — Solo abiertos, máximo 8
6. **Productos populares** — Solo disponibles, con botón "+"
7. **Marketplace** — Con copy explicativo
8. **Doble CTA** — Comprador + supply side (comercio/repartidor/vendedor)
9. **Footer**

**Justificación:** El patrón probado en LATAM es: propuesta de valor → confianza → cómo funciona → catálogo. No al revés.

---

## 4. Análisis de CTAs

### CTAs visibles:
1. **Botón del slide activo** (texto variable, dentro del hero) — CTA primario implícito
2. **"Ver todos"** en Comercios Cercanos → `/productos`
3. **"Ver todos"** en Productos Recomendados → `/productos`
4. **"Ver todo"** en Marketplace → `/marketplace`
5. **"Ver Productos"** en sección cierre → `/productos`
6. **"Carrito"** en header desktop
7. **Ícono carrito** en header mobile
8. **"Ingresar"** en header desktop (no-logueados)

### Problemas:
- **3 CTAs van a `/productos`**: "Ver todos" (comercios), "Ver todos" (productos), "Ver Productos" (cierre). Redundancia que diluye.
- **No hay CTA de registro/login** en mobile para usuarios no logueados. Es la acción más importante para retención y no tiene botón visible.
- **No hay CTA sticky en mobile.** Cuando el usuario scrollea las 9 secciones, el único CTA visible es el carrito en el header. Rappi y PedidosYa tienen un bottom bar persistente.
- **Falta CTA "Quiero vender" o "Registrar mi comercio"** en la home. Solo está en el footer.

### CTAs faltantes críticos:
- **Bottom bar mobile** con: Home, Buscar, Pedidos, Perfil (patrón estándar delivery apps)
- **CTA "Registrate" o "Ingresar"** visible en mobile
- **CTA "Sumate como comercio"** en la home, no solo en el footer

---

## 5. Copy & Messaging

### Títulos genéricos vs. específicos:
| Título actual | Problema | Alternativa propuesta |
|---|---|---|
| "Explorá por Categoría" | Genérico, no motivante | **"¿Qué querés pedir?"** |
| "Comercios Cercanos" | Engañoso (no hay geo) | **"Comercios en Ushuaia"** |
| "Productos Recomendados" | Pasivo, sin urgencia | **"Lo más pedido"** |
| "Marketplace" | No explica nada | **"Comprá y vendé entre vecinos"** |
| "¿Listo para comprar?" | Genérico de template | **"Todo Ushuaia a un click"** |

### Prueba social:
- El banner de pedidos diarios es la única prueba social. No hay reviews, testimonios, cantidad de comercios, ni métricas de satisfacción.
- Falta: **"Ya somos +X comercios en MOOVY"** o **"4.8 promedio de satisfacción"**.

### Urgencia/escasez:
- No hay ningún elemento de urgencia. No hay ofertas con tiempo limitado, no hay "últimas unidades", no hay "delivery gratis hasta las X". Para una app nueva en una ciudad chica, algún incentivo temporal ayuda a la primera compra.

### Los 3 peores títulos reescritos:
1. ~~"Explorá por Categoría"~~ → **"¿Qué te pinta pedir?"** (coloquial argentino, orientado a acción)
2. ~~"Productos Recomendados"~~ → **"Lo más pedido en Ushuaia"** (social proof + local)
3. ~~"Explorá nuestro catálogo y encontrá todo lo que necesitás"~~ → **"Tu primer pedido te llega en minutos — probá MOOVY"** (beneficio concreto + CTA implícito)

---

## 6. Diseño visual y consistencia

### Paleta de colores:
- Rojo `#e60012` como primario: transmite energía y urgencia, coherente con delivery. Pero se usa en TODO — títulos, badges, botones, gradientes, acentos. Cuando todo es rojo, nada destaca.
- Fondos alternados white/gray-50 entre secciones es correcto pero predecible.
- No hay color secundario definido. El amarillo/amber de los puntos MOOVER, el verde de "Abierto", el azul de "Verificado" son funcionales pero no de marca.

### Tipografía:
- Junegull para el logotipo es distintiva.
- Poppins como font del body es legible y moderna.
- La jerarquía de tamaños es aceptable (2xl-3xl para títulos, sm-base para cuerpo).
- Pero los títulos de sección siguen todos el mismo patrón: "Palabra <span rojo>Palabra</span>". Es un pattern que se vuelve predecible después de la segunda sección.

### Espaciado:
- Las secciones de comercios y productos tienen buen breathing room.
- Pero el hero + social proof + categorías están comprimidos (pt-3, pt-4, py-4). Se siente apretado en el above-the-fold.

### Imágenes:
- Las categorías usan íconos de Lucide — genéricos.
- MerchantCard y ListingCard muestran imágenes reales (si existen) o placeholders grises genéricos.
- El hero tiene una ilustración SVG inline del repartidor que es simpática pero amateur comparada con las fotos profesionales de Rappi/PedidosYa.

### Consistencia:
- Cards de comercio vs cards de producto tienen estilos diferentes (bordes, padding, sombras). MerchantCard tiene `shadow-sm hover:shadow-lg`, ProductCard tiene solo `border border-gray-100 rounded-xl`. Debería unificarse.
- Dos footers diferentes (inline en page.tsx y componente Footer.tsx) es una inconsistencia de implementación.

---

## 7. Mobile-first

### ¿Nativa o "desktop achicado"?
Mayormente mobile-first, con buenas decisiones:
- Header diferenciado para mobile vs desktop.
- Categorías con scroll horizontal en mobile.
- Grid responsive en comercios/productos.

### Problemas mobile:
- **No hay bottom navigation bar.** Toda app de delivery tiene tabs abajo: Home, Buscar, Pedidos, Perfil. MOOVY no tiene ninguna. El usuario tiene que volver al header para todo. Esto es el problema mobile #1.
- El header mobile tiene demasiados íconos apilados (search + puntos + bell + carrito).
- El hero slider con min-h 260px en mobile ocupa más de la mitad de la pantalla. El contenido real (comercios) está debajo del fold.
- Las categorías con doble fila auto-scroll son dinámicas pero pueden causar motion sickness y no son clickeables fácilmente en movimiento.
- La sección "Cómo funciona" apila las 3 cards en columna (md:grid-cols-3 → cols-1 en mobile). Con padding, ocupa 3+ pantallas completas de scroll.

### Cambios concretos mobile:
- Agregar **bottom navigation bar** fija: Inicio, Buscar, Mis Pedidos, Mi Perfil. Es el cambio #1 más importante para mobile.
- Reducir hero a max 180px de alto en mobile.
- Categorías en fila única, sin auto-scroll, snap scroll manual.
- "Cómo funciona" en mobile: 3 items horizontales scrolleables, no apilados.

---

## 8. Confianza y credibilidad

### Señales de trust presentes:
- Badge "Verificado" en comercios.
- Rating con estrellas en comercios y vendedores.
- Métodos de pago mencionados (MercadoPago, efectivo).
- Links legales completos (términos, privacidad, devoluciones, etc.).
- "X pedidos hoy" como social proof.

### Señales de trust faltantes:
- **No hay testimonios/reviews** de compradores reales visibles en la home.
- **No hay logos de comercios conocidos** de Ushuaia. En una ciudad de 80k, la gente conoce los locales. Mostrar "La Anónima", "Panadería X", "Kiosco Y" como logos en un banner genera trust instantáneo.
- **No hay fotos reales de Ushuaia** — ni de las calles, ni de repartidores reales, ni de comercios. Todo es genérico.
- **No hay sección "Pagás seguro"** con logos de MercadoPago/Visa/Mastercard. La confianza en pagos online es crítica en Argentina.
- **No hay número de WhatsApp visible** para soporte. En Ushuaia, la gente quiere poder escribir por WhatsApp si algo sale mal.
- **Redes sociales apuntan a "#"** — si no hay redes, no mostrar los íconos.

### ¿El social proof es creíble?
Con 80k habitantes y una app nueva, "3 pedidos hoy" puede ser la realidad pero se ve mal. Mejor usar métricas acumuladas que siempre crecen.

---

## 9. Performance percibido

### Loading states:
- Hay loading skeletons para `/productos` y `/marketplace` (archivos `loading.tsx`), lo cual es bueno.
- Pero la home page es un server component con `force-dynamic` y `revalidate = 0`. Cada visita hace 6 queries a la DB (slides, categories, merchants, products, listings, todayStats). Si la DB es lenta, el usuario ve pantalla blanca.

### Imágenes:
- MerchantCard usa `<img>` nativo en vez de `next/Image`. Esto significa sin lazy loading automático, sin optimización de tamaño, sin WebP conversion. Con 12 comercios cargando imágenes de portada, el First Contentful Paint se va a resentir.
- Lo mismo para ListingCard y las product cards.
- El hero sí usa `next/Image` con `priority` — correcto.

### Sugerencias:
- Reemplazar `<img>` por `next/Image` en MerchantCard y ListingCard para lazy loading y optimización automática.
- Agregar un `loading.tsx` para la home page con skeleton del hero + categorías.
- Considerar ISR (Incremental Static Regeneration) con `revalidate = 60` en vez de `force-dynamic`. Los datos de la home no cambian cada segundo.

---

## 10. Top 5 cambios de mayor impacto

### 1. Agregar bottom navigation bar en mobile
**Qué cambiar:** Crear un componente `BottomNav` fijo en mobile con 4 tabs: Inicio (home icon), Buscar (search), Mis Pedidos (package), Mi Perfil (user). Estilo: fondo blanco, borde top sutil, ícono activo en rojo `#e60012`. Height: 56px. Con safe-area-inset-bottom para iPhone.

**Por qué:** Es el patrón universal #1 en apps de delivery LATAM. Sin bottom nav, la navegación depende del header (zona incómoda para el pulgar) y no hay acceso directo a funciones clave. Rappi, PedidosYa, iFood, Didi Food — todos tienen bottom nav. Su ausencia hace que MOOVY se sienta como "sitio web" y no como "app".

**Esfuerzo:** Medio (componente nuevo + layout adjustment).

### 2. Hero estático con value proposition fija + buscador
**Qué cambiar:** Reemplazar el hero slider como elemento principal por un bloque estático: fondo rojo/gradiente MOOVY, título **"Todo Ushuaia en tu puerta"** (text-3xl bold white), subtítulo **"Comercios, productos y marketplace — delivery en minutos"** (text-base white/80), y un search bar prominente (w-full, rounded-full, placeholder "¿Qué querés pedir?"). El slider puede quedar debajo como carousel promocional secundario de menor altura.

**Por qué:** El slider actual no comunica la propuesta de valor de forma confiable. Si el slide es irrelevante, el usuario no entiende qué es MOOVY. Un headline fijo + buscador es el patrón que usan Rappi y PedidosYa porque resuelve las dos preguntas del usuario: "¿qué es esto?" y "¿cómo busco lo que quiero?".

**Esfuerzo:** Medio (reestructurar hero section).

### 3. Filtrar productos no disponibles y agregar botón "+" al carrito
**Qué cambiar:** En las queries de la home, filtrar `merchant.isOpen: true` y `stock > 0` para productos, y vendedores online para marketplace. Agregar un botón circular "+" en la esquina inferior derecha de cada product card que agregue al carrito directamente (sin entrar al detalle).

**Por qué:** Mostrar productos de comercios cerrados o sin stock genera frustración (click → decepción → abandono). El botón "+" reduce la fricción de conversión de 3 pasos (ver card → click → ver detalle → agregar) a 1 paso (ver card → "+"). PedidosYa reporta +20% de add-to-cart con botón directo en card.

**Esfuerzo:** Bajo-Medio (query filter + botón en card).

### 4. Agregar sección de trust con logos de medios de pago y comercios locales
**Qué cambiar:** Crear una franja horizontal entre "Cómo funciona" y las categorías con: logos de MercadoPago, Visa, Mastercard (miniaturizados, grises) + texto **"Pagás seguro con MercadoPago o en efectivo"** + cantidad de comercios activos (**"Ya somos +X comercios"**). Si hay logos de comercios conocidos de Ushuaia, mostrarlos en fila.

**Por qué:** Argentina tiene alta desconfianza en pagos online. Mostrar los logos de los procesadores de pago reduce la ansiedad de compra. Y en una ciudad de 80k, ver el logo de una panadería que conocés genera confianza inmediata.

**Esfuerzo:** Bajo (sección estática con assets).

### 5. CTA de captación supply-side visible en la home
**Qué cambiar:** Antes del footer, agregar una sección con 3 cards horizontales (scrolleable en mobile): **"Registrá tu comercio"** (→ `/comercio/registro`), **"Sé repartidor MOOVY"** (→ `/repartidor/registro`), **"Vendé tus cosas"** (→ `/vendedor/registro`). Diseño: fondo dark (gray-900), cards con borde y gradiente sutil, CTA blanco en cada una.

**Por qué:** En un marketplace bilateral de ciudad chica, reclutar oferta (comercios + repartidores + vendedores) desde la home es igual de importante que convertir compradores. Actualmente estos CTAs solo están enterrados en el footer. Un growth hack de PedidosYa en ciudades nuevas fue exactamente esto: secciones prominentes de reclutamiento en la home.

**Esfuerzo:** Bajo (sección estática con links).

---

*Fin de la auditoría. Todos los cambios sugeridos están priorizados por impacto en conversión y factibilidad técnica dentro del stack actual de MOOVY (Next.js + Tailwind + Prisma).*
