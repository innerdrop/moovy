# Moovy — Histórico cronológico de ramas

> **Este archivo NO se carga automáticamente en sesiones de Claude.**
> Se consulta bajo demanda con grep cuando se necesita contexto histórico
> de una rama, una decisión, o un bug específico.
> 
> Para info canónica y perdurable, ver `.claude/CLAUDE.md`.
> Para issues abiertos hoy, ver `ISSUES.md`.
> Para tareas del sprint actual, ver `PROJECT_STATUS.md`.

---

## 2026-05-10 (rama `feat/ops-badge-pendientes`)

feat(ops): badge amarillo de pendientes en sidebar OPS

Smoke test produccion 2026-05-07 (observacion 1B con captura img03):
cuando un usuario se registra como repartidor o como comercio, el admin
no tiene ningun indicador visual en el sidebar de que hay trabajo
pendiente. El item "En Vivo" ya tiene su live indicator verde con
contador de pedidos activos, pero "Usuarios" y "Pipeline Comercios"
quedaban sin badge — el admin tenia que entrar a cada seccion para
descubrir si habia algo nuevo. Mauro pidio "circulito amarillo con
numero como En Vivo pero para los pendientes".

CAMBIOS:

1) src/app/api/admin/pending-counts/route.ts (NUEVO)
   - GET con auth ADMIN. Devuelve { merchants, drivers, total }.
   - Counts por approvalStatus = "PENDING" sobre Merchant y Driver
     (ambos modelos tienen indice en approvalStatus, ver schema linea
     699 y 867 — count es O(log n)).
   - Filtro adicional por owner.deletedAt / user.deletedAt = null para
     no contar registros huerfanos de cuentas eliminadas (no son
     actionables por el admin).
   - Sin cache server-side: dos counts indexados son baratos y queremos
     que el badge baje al instante cuando se aprueba un caso.
   - Behavior degradado: si falla auth o query, devuelve ceros para no
     romper el render del sidebar (mismo patron que /api/admin/active-orders).

2) src/components/ops/OpsSidebar.tsx
   - Items "Usuarios" y "Pipeline Comercios" estrenan campo
     badge: "pending-total" / "pending-merchants" respectivamente.
   - Nuevo state pendingMerchants / pendingDrivers + useEffect con
     polling cada 60s al endpoint nuevo. Polling separado del de
     activeOrders (15s) porque la cadencia es distinta.
   - Render del badge: bg-yellow-400, texto slate-900 bold, min-w 20px,
     h-5, px-1.5, rounded-full, text-[10px]. Estilo consistente con el
     live indicator pero amarillo en vez de verde con ping.
   - 0 pendientes -> no muestra nada (limpio).
   - 1-99 -> muestra el numero.
   - >99 -> muestra "99+" (formatBadgeCount helper).

QUE NO CAMBIA:
- Schema de DB no se toca (Merchant.approvalStatus y Driver.approvalStatus
  ya existian con sus indices).
- "En Vivo" sigue con su live-indicator verde (no se toco).
- Ningun otro item del sidebar cambia.

DECISION DE SCOPE:
Sellers no se incluyen en el badge porque su flow es distinto: no
requieren aprobacion admin, se autoactivan al cargar CUIT en
/api/auth/activate-seller. No tienen "pending state" comparable.

VERIFICACION SUGERIDA POST-DEPLOY:
- Registrar un driver de prueba en staging y confirmar que el badge
  amarillo aparece en "Usuarios" dentro de 60s.
- Aprobar el driver desde el panel y confirmar que el badge baja en
  el siguiente polling.
- Repetir con merchant: verificar badge en "Usuarios" Y en "Pipeline
  Comercios".

**Archivos:** ISSUES.md, src/app/api/admin/pending-counts/route.ts, src/components/ops/OpsSidebar.tsx

## 2026-05-10 (rama `feat/welcome-emails-driver-merchant`)

feat(emails): conectar welcome emails de driver y merchant al registro

Smoke test produccion 2026-05-07 (observacion 3B): cuando un usuario se
registra como repartidor o como comercio, no recibe ningun email de
confirmacion. Solo el admin/owner recibe la notificacion ("nuevo driver
pendiente" / "nueva solicitud de comercio"), mientras que el solicitante
queda "en el aire" durante las 24-48hs habiles que tarda la revision de
documentacion. Resultado: ansiedad post-registro y churn pre-onboarding.

Las funciones de email ya estaban escritas hace varias ramas atras:

  - sendDriverRequestReceivedEmail   (src/lib/email-p0.ts:126)
  - sendMerchantRequestReceivedEmail (src/lib/email-p0.ts:30)

Y tambien sus entradas correspondientes en EMAIL_REGISTRY con status
"new" y trigger documentado:

  - id 14 "driver_request_received"   trigger: POST /api/auth/activate-driver
  - id  6 "merchant_request_received" trigger: POST /api/auth/register/merchant

Pero el TRIGGER nunca estuvo conectado en el endpoint correspondiente.
Esto rompe la regla #11 del CLAUDE.md ("Email transaccional - funcion
exportada + entrada en EMAIL_REGISTRY + trigger conectado"): tener los
dos primeros sin el tercero deja al sistema con la ilusion de que el
email se manda, cuando en realidad nadie lo dispara.

CAMBIOS:

1) src/app/api/auth/register/driver/route.ts
   - Import de sendDriverRequestReceivedEmail desde @/lib/email-p0.
   - Trigger fire-and-forget despues del email a admin que ya existia.
   - Pasa email + driverName (fullName ya construido del firstName +
     lastName) + vehicleType (uppercase ya normalizado).
   - Errores se loguean en consola, no bloquean la response.

2) src/app/api/auth/register/merchant/route.ts
   - Import de sendMerchantRequestReceivedEmail desde @/lib/email-p0.
   - Trigger fire-and-forget despues de los dos emails a admin que ya
     existian (sendMerchantRequestNotification + sendAdminNewMerchantPendingEmail).
   - Pasa email + businessName + contactName (firstName + lastName trimmed).
   - Errores se loguean en consola, no bloquean la response.

QUE NO CAMBIA:
- email-p0.ts no se toco. Las funciones ya estaban listas.
- email-registry.ts no se toco. Las entradas ya estaban registradas.
- email.ts (legacy sendMerchantRequestNotification) sigue mandando al
  admin. Mantenemos ambos canales (admin + merchant) sin solapar.
- Schema de DB no se toca.
- Ningun otro endpoint cambia.

QUEDA PARA OTRA RAMA (no incluido aca):
- Welcome email para SELLER al activar su perfil de marketplace
  (/api/auth/activate-seller). No tiene funcion ni entry en EMAIL_REGISTRY,
  asi que requiere mas trabajo: crear sendSellerActivatedEmail, agregar
  entry, y conectar trigger. Scope distinto, mejor en otra rama.

VERIFICACION SUGERIDA POST-DEPLOY:
- Registrar un driver de prueba en staging y confirmar que llegan dos
  emails: uno al admin (notificacion) y uno al driver (acuse).
- Idem con merchant: tres emails (dos al admin, uno al merchant).

**Archivos:** ISSUES.md, src/app/api/auth/register/driver/route.ts, src/app/api/auth/register/merchant/route.ts

## 2026-05-10 (rama `fix/ops-form-paridad-registro`)

fix(ops): modal Crear cuenta pide firstName + lastName separados

Smoke test produccion 2026-05-07 (observacion 1A): el modal "Crear cuenta"
del panel OPS pedia el nombre completo en un solo campo, mientras que los
formularios publicos de /registro y /repartidor/registro piden firstName
y lastName por separado. El endpoint /api/admin/users/create cubria la
diferencia partiendo el string por el primer espacio:

  firstName: data.name.split(" ")[0],
  lastName: data.name.split(" ").slice(1).join(" ")

Esto rompia con nombres compuestos. Ejemplo:
  "Maria del Carmen Di Tella" -> firstName "Maria",
                                 lastName "del Carmen Di Tella"

Con apellidos compuestos que tambien tienen espacio, la separacion era
arbitraria y dejaba User.firstName y User.lastName con datos incoherentes
respecto a lo que el mismo user habria cargado por su cuenta.

CAMBIOS:

1) src/components/ops/CreateUserModal.tsx
   - State: campo unico "name" reemplazado por "firstName" + "lastName".
   - Form: input "Nombre completo" reemplazado por dos inputs (Nombre /
     Apellido) en grid 2 columnas. Ambos required, min 2 / max 50 chars.
   - resetForm, handleSubmit y disabled del boton actualizados.
   - Body del POST envia firstName + lastName separados.

2) src/app/api/admin/users/create/route.ts
   - Zod discriminatedUnion (3 variantes: BUYER/DRIVER/SELLER): "name"
     reemplazado por "firstName" + "lastName" (ambos min 2 / max 50).
   - Construye fullName = firstName + " " + lastName antes del create.
   - User.create usa firstName/lastName directos del input (no mas split).
   - User.name = fullName (preserva la columna legacy para queries).
   - SellerProfile.displayName: default a fullName en vez de data.name.
   - Audit log targetName sigue funcionando porque sale del select
     {id, email, name} del User.create.

QUE NO CAMBIA:
- Schema de DB no se toca (User.firstName, User.lastName, User.name ya
  existian).
- Magic-link / token reset / 24h expiry / placeholder password: igual.
- Flujo anti-resurreccion de cuentas eliminadas: igual.
- Email "Bienvenido a MOOVY - configura tu contraseña": sigue recibiendo
  el name (full) por el campo result.user.name.

**Archivos:** ISSUES.md, src/app/api/admin/users/create/route.ts, src/components/ops/CreateUserModal.tsx

## 2026-05-10 (rama `fix/confirmacion-driver-campos-vacios`)

fix(driver-registro): step 3 no muestra "—" en filas opcionales

Smoke test de produccion 2026-05-07 (observacion 2B con captura img02): en
/repartidor/registro paso 3 (Confirmacion), el "Resumen de tu solicitud"
mostraba siempre las filas DNI, CUIT, Color, Patente y los 4 vencimientos
(Licencia, Seguro, RTO, Cedula verde) con "—" cuando el driver no las habia
cargado. Esto contradice la rama feat/registro-simplificado (2026-04-27)
que volvio TODOS estos campos opcionales en el registro: el driver los
completa despues en su panel. La pantalla de confirmacion daba sensacion
de "te falta cargar algo", justo lo opuesto al mensaje deseado.

CAMBIOS en src/app/repartidor/registro/RepartidorRegistroClient.tsx (step 3):
- Filas DNI y CUIT: solo se renderizan si formData.dni / formData.cuit
  tienen valor (wrapped en {formData.X && (<>...</>)}).
- Filas Color y Patente: dentro del bloque isMotorized, cada una solo se
  renderiza si su valor esta cargado.
- Bloque "Vencimientos cargados" entero: solo aparece si motorizado AND al
  menos uno de los 4 (licencia/seguro/RTO/cedula verde) esta cargado. Cada
  fila individual tambien condicional.
- Filas Nombre y Vehiculo siguen renderizandose siempre (Nombre es required;
  Vehiculo es required en step 2 - ambos se completan en el registro).

QUE NO CAMBIA:
- formData type igual (todos los campos opcionales siguen como string con
  default "").
- Endpoint /api/auth/register/driver no cambia: sigue aceptando todos
  estos campos como opcionales.
- Pagina /repartidor/(protected)/perfil (donde el driver completa los docs
  faltantes) no se toco.

OBSERVACION 2C (resuelta en paralelo, sin codigo):
Misma sesion smoke test detecto React error #418 en /terminos-repartidor.
Causa: Cloudflare Email Address Obfuscation reemplazaba legal@somosmoovy.com
en el HTML server-side post-SSR, causando hydration mismatch. Fix: desactivado
desde Cloudflare Dashboard (Scrape Shield > Email Obfuscation: OFF). No
requirio cambios de codigo.

**Archivos:** ISSUES.md, src/app/repartidor/registro/RepartidorRegistroClient.tsx

## 2026-05-08 (rama `style/quienes-somos-rediseno`)

style: rediseno /nosotros con Claude Design - piloto de la fase de diseno

PROBLEMA QUE RESUELVE:
La pagina /nosotros (titulada "Quienes Somos") era el primer test del
nuevo proceso de diseno con Claude Design. Visualmente la version anterior
tenia 10 problemas identificados en el diagnostico previo:

1) Hero gigante con 3 lineas a 96px font-black - gritaba en lugar de seducir
2) Cero imagenes/ilustracion de Ushuaia - hablaba de la ciudad sin mostrarla
3) font-black peso 900 abusado - todo se sentia igual de gritado
4) CTAs duplicados 3 veces - fatiga
5) CTA final con fondo rojo entero - patron "panic red" amateur
6) Stats en rojo + black + 5xl - visualmente agresivo
7) Cero social proof / trust signals
8) Background blanco uniforme - falta diferenciacion entre secciones
9) Falta jerarquia - todas las secciones del mismo peso
10) Sin "wow moment" - nada visual memorable

PROPOSITO DEL PILOTO:
Validar end-to-end el workflow de diseno: Claude Design (descripcion natural -> generacion AI) -> screenshot -> aprobacion -> traduccion a Next.js + Tailwind 4 -> pagina en produccion. Si el ciclo funcionaba con una pagina de baja complejidad, el metodo escala a las ~50 surfaces que necesita Moovy.

DISENO DE SOFIA VEGA (Principal Product Designer, via Claude Design):
Filosofia visual: "blanco que respira con un hilo de rojo en momentos clave".
El rojo aparece SOLO en: CTA primario, % de las stats, faro/luz del hero,
borde izquierdo del cierre de historia, dato de contacto, linea sobre el
CTA final. Plus Jakarta Sans en el design original; en implementacion
usamos Nunito (font real del proyecto, metricas similares, mas calido por
terminales redondeadas).

CAMBIOS:

1) src/app/nosotros/page.tsx (REESCRITO desde cero)
   - Server component con metadata + JSON-LD structured data preservados
   - 7 secciones nuevas con alternancia #fff / #fafaf9 para diferenciar
   - Navbar sticky con back arrow + logo Moovy
   - Hero: titulo "Nacimos en Ushuaia." en una sola linea, subtitulo gris,
     lede, 2 CTAs (rojo + outline), ilustracion vectorial de montanas + faro
     Les Eclaireurs con la luz roja como unico acento de color
   - Historia: 5 parrafos con el cierre destacado con borde-izquierdo rojo
   - Stats: 4 numeros con count-up animado (80k habitantes, 0% retencion,
     8% comision, 80% repartidores)
   - Diferenciadores: 4 cards con iconos lucide-react (Zap/Scale/MessageCircle/MapPin)
   - Comercios: 60-40 grid con texto + CTAs a la izquierda, FAQ accordion
     a la derecha
   - Contacto: 3 cards (WhatsApp / Email / Instagram) con hover lift + arrow
     translate
   - CTA final: fondo crema calido #faf7f3 con linea roja 3px arriba, "Empezar"
     en CTA rojo + "Suma tu comercio" outline. Reemplaza el fondo oscuro
     #111827 original que competia visualmente con el footer (dos bloques
     oscuros seguidos = pesado).

2) src/app/nosotros/_components/StatsCounter.tsx (NUEVO)
   - Client component (use client)
   - IntersectionObserver con threshold 0.3 para activar animacion al scroll
   - 800ms ease-out cubic count-up via requestAnimationFrame
   - El "%" rojo Moovy (#e60012, 28-32px) y el numero entero negro (#111827,
     48-56px) - el hilo de rojo del que habla el design rationale

3) src/app/nosotros/_components/MerchantFAQ.tsx (NUEVO)
   - Client component (use client)
   - Accordion con un solo item abierto a la vez
   - El icono Plus rota 45 grados a "x" rojo cuando el item se abre
   - max-height transition para animar el panel

ICONOS:
Los SVG inline genericos del export de Claude Design se reemplazaron por
componentes lucide-react que ya estan instalados en el proyecto:
ArrowLeft, ArrowRight, Mail, Instagram, MessageCircle, Zap, Scale, MapPin, Plus.

CTAs CONECTADOS A RUTAS REALES:
- "Pedir ahora" -> /tienda
- "Suma tu comercio" -> /comercio/registro (4 ocurrencias)
- "Habla con nosotros" -> WhatsApp +54 9 2901 553173 con prefill comercio
- "Empezar" -> /empezar
- WhatsApp generico -> wa.me con prefill "Hola Moovy! Me gustaria saber mas"
- Email -> mailto:somosmoovy@gmail.com con subject prefill
- Instagram -> instagram.com/somosmoovy

CONSERVADO INTACTO:
- Metadata SEO (title, description, keywords, openGraph)
- JSON-LD Organization structured data
- Footer existente (@/components/layout/Footer)
- Datos reales (numero WhatsApp, email, Instagram)
- Copy de la historia (la frase del repartidor a -5C se queda)

ITERACIONES:
v1: CTA final con fondo #111827 oscuro tal como diseno Sofia.
v2 (post-feedback): cambiamos CTA final a #faf7f3 crema calido sutil + linea
roja 3px arriba. El fondo oscuro original competia con el footer creando
"dos bloques oscuros seguidos" que se sentian pesados. Ahora el footer es
el unico momento oscuro de la pagina.

VALIDACION DEL METODO (lo importante de este piloto):
- Claude Design genera output decente al primer prompt si se prompted con
  brand-specific descriptive language y constraints claros (mobile-first,
  exact tokens, voz argentina, EVITAR list)
- Iteracion via feedback en lenguaje natural funciona bien
- Export como standalone HTML + extraccion de bundle base64+gzip funciona
  programaticamente para obtener HTML/CSS limpio
- Traduccion HTML/CSS -> Next.js + Tailwind 4 + lucide-react es 1:1 con
  pequenos ajustes (font swap Nunito por Plus Jakarta, iconos a lucide)
- Tiempo total del piloto: ~90 min (30 min Claude Design + 30 min
  traduccion a codigo + 30 min iteracion)

SIGUIENTES PASOS DOCUMENTADOS:
- Rama style/tienda-skeleton: rediseno de la home/tienda con metodo de
  3 sub-sesiones (Skeleton -> Components -> Composed) para evitar generar
  algo busy y sin foco en una sola sesion.
- Roadmap completo: ~10 paginas Buyer + 6 Comercio + 5 Repartidor + 20
  OPS + estaticas. Total ~50 surfaces visuales.

TESTING:
- TSC strict paso limpio
- Verificacion visual en localhost:3000/nosotros con Chrome DevTools
  iPhone 14 Pro Max (430x932) confirmada por el CEO
- Hover states de cards y CTAs funcionan
- FAQ accordion abre/cierra con animacion de icono +/x
- Stats count-up se dispara al entrar en viewport
- Links externos abren en target=_blank con rel=noopener noreferrer
- JSON-LD valido, metadata correcta para SEO

NO TOCADOS:
- Footer existente
- Layout root
- Cualquier otra pagina del sitio
- next.config.ts (la URL /nosotros se mantiene; el redirect /equipo.html
  -> /nosotros sigue intacto)

URL CONSERVADA:
La URL queda como /nosotros (el titulo y el JSON-LD son "Quienes Somos").
Mover a /quienes-somos hubiera roto SEO/redirects historicos sin beneficio.

**Archivos:** src/app/nosotros/_components/MerchantFAQ.tsx, src/app/nosotros/_components/StatsCounter.tsx, src/app/nosotros/page.tsx

## 2026-05-07 (rama `feat/sentry-revenue-error-pages`)

feat: error tracking con Sentry + reporte diario de revenue al CEO + 404/500 con marca

PROBLEMA QUE RESUELVE:
Pre-launch nos faltaban tres piezas de visibilidad operativa que las
empresas serias tienen desde el dia 1:

1) Si la app rompe en produccion en el navegador de un usuario, no nos
   enteramos hasta que alguien nos escribe por WhatsApp 3 dias despues.
   Sin error tracking estabamos ciegos a errores reales del cliente.

2) El CEO abre el dia sin un pulso operativo claro. Tener que entrar a
   /ops/dashboard y mirar 8 KPIs distintos cada manana es friccion.
   Falta un "daily flash" matutino con los numeros que importan.

3) Las paginas 404 y 500 default de Next son blancas, en ingles, sin
   marca. Primer error que ve un comprador = "esta app es trucha".

CAMBIOS:

1) SENTRY — error tracking client + server + edge con PII scrubbing AAIP
   ─────────────────────────────────────────────────────────────────────
   Archivos nuevos:
     - src/lib/sentry-scrub.ts
       Helper canonico de scrubbing. Patrones: emails, CBU 22 digitos,
       CUIT XX-XXXXXXXX-X, DNI 7-8 digitos, MP tokens (APP_USR-*, TEST-*),
       JWT, Bearer, PIN 4 digitos, tarjetas. Headers Authorization/Cookie/
       x-api-key/x-cron-secret/x-mp-signature siempre [REDACTED].
       Hook beforeSend canonico scrubSentryEvent que se aplica en todos los
       runtimes. Cumple Ley 25.326 — ningun PII sale a Sentry (US-based).

     - sentry.client.config.ts (browser)
       tracesSampleRate 10% prod / 100% dev. ignoreErrors de network/
       extensions/cross-origin scripts. denyUrls de chrome-extension/
       googletagmanager. Activacion condicional: si no hay DSN, no init.

     - sentry.server.config.ts (Node runtime)
       tracesSampleRate 20% prod. ignoreErrors de AbortError/ECONNRESET/
       P1001 transitorios. beforeBreadcrumb tambien con scrub.

     - sentry.edge.config.ts (proxy.ts middleware)
       tracesSampleRate 5% prod (alto trafico). Scrub minimo por
       limitaciones del Edge runtime (sin require dinamico).

     - instrumentation.ts
       Hook canonico de Next 16. register() carga server o edge config
       segun NEXT_RUNTIME. onRequestError captura errores RSC/streaming
       que no llegan a route handlers.

   Modificados:
     - next.config.ts
       Wrappeado con withSentryConfig. tunnelRoute "/monitoring" para
       esquivar adblockers + simplificar CSP. CSP actualizado con
       *.sentry.io. hideSourceMaps removido (Sentry v9 lo maneja auto).
       Activacion condicional: si NEXT_PUBLIC_SENTRY_DSN no esta seteado,
       devuelve nextConfig sin wrappear. Local dev sin proyecto Sentry
       funciona normal.

     - src/app/error.tsx + src/app/global-error.tsx
       Sentry.captureException(error) en useEffect. Las paginas 404/500/
       global-error ya existian con marca Moovy — solo agregamos el hook
       de captura.

   Decisiones canonicas (documentadas en CLAUDE.md):
     - PII scrubbing OBLIGATORIO antes de enviar a Sentry
     - Tunnel /monitoring para esquivar adblockers
     - Sample rates: client 10% / server 20% / edge 5% en prod
     - Source maps solo en CI con SENTRY_AUTH_TOKEN
     - Activacion condicional por DSN

2) CRON DAILY REVENUE SUMMARY — email matutino al CEO
   ───────────────────────────────────────────────────
   Archivo nuevo:
     - src/app/api/cron/daily-revenue-summary/route.ts
       Corre 9 AM ART (12 UTC). Calcula KPIs del dia anterior y dispara
       email al alert_emails (configurable desde MoovyConfig).

       KPIs incluidos:
         - Pedidos DELIVERED ayer + delta % vs anteayer
         - GMV (suma de subtotales)
         - Revenue Moovy = sum(moovyCommission) + sum(operationalCost)
         - Pagos a comercios (sum(merchantPayout) Order / sellerPayout SubOrder)
         - Pagos a repartidores (sum(driverPayoutAmount) snapshot, fallback
           a deliveryFee × 0.8 para single-vendor sin snapshot)
         - Pedidos cancelados ayer (status CANCELLED + updatedAt en ventana)
         - No-shows reportados ayer (Order.noShowReportedAt en ventana)
         - Drivers/comercios activos (al menos 1 pedido entregado)
         - Top 3 comercios por # pedidos
         - Drivers con fraudScore >= 2 (alerta — 3 = auto-suspend)
         - Pedidos AWAITING_PAYMENT acumulados >1h (señal de cron stale)

       Idempotencia: AuditLog con action="daily-revenue-summary-YYYY-MM-DD"
       como key. Si retrigger manual desde /ops/crons mismo dia, skip y
       devuelve { skipped: true, reason: "already_sent_today" }.

       Timezone: hardcoded UTC-3 (Argentina sin DST). Window de "ayer" se
       calcula en hora local AR para alinear con el dia natural del CEO.

   Modificados:
     - src/lib/email-admin-ops.ts
       Funcion sendDailyRevenueSummaryEmail + interface DailyRevenueSummaryData.
       Email pro estilo "daily flash" con KPIs grandes arriba (pedidos +
       revenue), bloque financiero, top 3 comercios, alertas condicionales
       (fraudScore / no-shows / pending stuck), CTA al panel OPS.

     - src/lib/email-registry.ts
       Entry #63 admin_daily_revenue_summary. generatePreview() con datos
       sample. Aparece en /ops/emails para que el admin pueda preview.

     - src/lib/cron-health.ts
       Entry "daily-revenue-summary" en CRON_EXPECTATIONS con maxHours: 30
       (corre 1× por dia). Aparece automaticamente en /ops/crons sin
       cambios al dashboard.

3) PAGINAS DE ERROR (404 + 500) — ya existian, conectadas a Sentry
   ──────────────────────────────────────────────────────────────
   Las paginas /not-found, /error y /global-error ya estaban creadas con
   marca Moovy de ramas anteriores. En esta solo agregamos el hook
   Sentry.captureException(error) en error.tsx y global-error.tsx para
   que los errores boundary-caught lleguen al panel.

DOCUMENTACION:
- .claude/CLAUDE.md
  + Variable de entorno: Sentry: NEXT_PUBLIC_SENTRY_DSN, SENTRY_ORG,
    SENTRY_PROJECT, SENTRY_AUTH_TOKEN (solo build/CI)
  + Tabla de Dependencias externas: nueva fila "Sentry"
  + NPM clave: + @sentry/nextjs 9
  + Seccion nueva "Sentry — decisiones canonicas" con 6 items
    (scrubbing, tunnel, sample rates, source maps, activacion condicional,
    error pages)

VARIABLES DE ENTORNO NUEVAS:
- NEXT_PUBLIC_SENTRY_DSN  (publico por diseño, va al cliente)
- SENTRY_ORG              (slug org, ej: "moovy-u7")
- SENTRY_PROJECT          (slug proyecto, ej: "moovy")
- SENTRY_AUTH_TOKEN       (SECRETO — solo en build/CI para subir source maps;
                          se genera mas adelante cuando llegue el deploy)

CRON LINE PARA EL VPS (agregar al crontab):
0 12 * * * curl -X POST -H "Authorization: Bearer $(grep ^CRON_SECRET /var/www/moovy/.env | cut -d= -f2)" https://somosmoovy.com/api/cron/daily-revenue-summary > /dev/null 2>&1

12:00 UTC = 9:00 AM ART. Misma autenticacion via $(grep) que el resto de
crons del VPS.

NPM:
- @sentry/nextjs ^9.0.0 agregado en package.json (146 paquetes nuevos)

TESTING:
- TSC strict paso limpio post-fixes:
  * next.config.ts: sourcemaps en lugar de hideSourceMaps (Sentry v9 API)
  * route.ts: SubOrder no tiene merchantPayout (solo Order); usar sellerPayout
- Verificacion sugerida en runtime:
  * Disparar test event: npx @sentry/wizard@latest -i nextjs (saltearlo,
    pero el wizard tiene un step "throw an error" que sirve)
  * O simplemente abrir /sentry-example-page si existe
  * Verificar que el evento aparezca en moovy-u7.sentry.io con PII redactado
  * Curl al cron daily-revenue-summary con CRON_SECRET, verificar que llega
    el email al alert_emails configurado

POST-LAUNCH ANOTADO:
- Cuando hagamos devmain.ps1 a prod, generar SENTRY_AUTH_TOKEN en
  Sentry > Settings > Auth Tokens (scopes: project:releases, org:read)
  y agregarlo al .env del VPS para que el build suba source maps.
- Considerar upgrade a Sentry Team plan (USD 26/mes) cuando crucemos
  los 5K errors/month del free tier (mes 3-4 estimado).
- Activar Session Replay cuando upgrade a paid plan — util para debug
  de bugs que el usuario describe mal por chat.

**Archivos:** .claude/CLAUDE.md, docs/referencias/observaciones_prod.md, instrumentation.ts, next.config.ts, package-lock.json, package.json, sentry.client.config.ts, sentry.edge.config.ts (+8 mas)

## 2026-05-07 (rama `docs/terms-privacy-pre-launch`)

docs: actualizacion de terminos y privacidad pre-launch

PROBLEMA QUE RESUELVE:
Las ramas de funcionalidad introdujeron flows nuevos (cancelacion automatica
de pago pendiente, no-show, PIN doble, GPS continuo, retencion 30d de logs)
sin actualizar la documentacion legal correspondiente. Argentina exige
notificacion expresa de tratamiento de datos (Ley 25.326), reembolsos y
cancelaciones (Ley 24.240), y las defensas en disputas se pierden si los
terminos no cubren explicitamente cada caso.

CAMBIOS:

1) /privacidad — nueva subseccion 2.4 "Informacion operativa de la entrega"
   - Notas para el repartidor (texto que el cliente escribe en checkout)
   - GPS continuo del repartidor cada 30s durante delivery
   - Logs de auditoria operativa (CronRunLog) con retencion 30 dias rolling
   - Datos de pago de MercadoPago (sin almacenar tarjetas)
   Bump fecha "Enero 2026" -> "7 de mayo de 2026".

2) /terminos — clausulas nuevas en secciones existentes (sin tocar TOC)
   En seccion 5 (Compras y Pagos):
     - Cancelacion automatica por falta de pago (timeout 30 min)
     - Reembolso automatico por pago tardio (race window)
   En seccion 6 (Entregas y Horarios):
     - Politica de cliente ausente / no-show (10 min espera, cobro 100%)
     - Como evitar el no-show (push, instrucciones)
     - Impugnacion de no-show con ventana de 24h post-evento
   Bump fecha "22 de marzo de 2026" -> "7 de mayo de 2026".

3) /terminos-comercio — nueva seccion 7 "PIN del Comercio y Devoluciones por
   No-Show" + renumeracion subsiguientes (8-13)
   - PIN doble del pedido (4 digitos pickup + 4 digitos delivery)
   - Devolucion por no-show: comercio recibe con MISMO PIN del pickup
   - Cobro al comercio en no-show: recibe normal, MOOVY come la comision
   - Cancelacion por el comercio: solo en PENDING/CONFIRMED/PREPARING
   Bump fecha "Marzo 2026" -> "7 de mayo de 2026".

4) /terminos-repartidor — nueva seccion 9 "Sistema Operativo de Seguridad"
   con 5 subsecciones + renumeracion subsiguientes (10-12)
   9.1 PIN doble 4 digitos (pickup + delivery)
   9.2 Geofence 100m + 50m gracia
   9.3 GPS continuo durante delivery (cada 30s)
   9.4 Politica de no-show + bonus $300 compensatorio + hold 24h del payout
   9.5 fraudScore con auto-suspend a 3 incidentes registrados
   Bump fecha "Marzo 2026" -> "7 de mayo de 2026".

NO TOCADOS:
- /terminos-vendedor: marketplace separado del flow de delivery, no requiere
  actualizacion en esta rama.
- /terminos-moover: programa de fidelidad standalone, no aplica.

LEYES ARGENTINAS COBERTAS:
- Ley 25.326 (Proteccion de Datos Personales): subseccion 2.4 de privacidad
  declara explicitamente que datos se recopilan, para que, cuanto se retienen,
  y cumple principio de minimizacion.
- Ley 24.240 (Defensa del Consumidor): seccion 5 de terminos generales
  declara reembolsos automaticos con plazo (5-15 dias), metodo y notificacion.
- Ley 26.951 (Antispam Argentina): los emails transaccionales son
  consentimiento implicito (necesarios para el servicio), no requieren
  opt-in explicito. Marketing si requiere — manejado en otra rama.

POST-LAUNCH ANOTADO:
- Disparar email "terms_updated" (la funcion ya existe en email-legal-ux.ts)
  a usuarios existentes notificandoles del cambio. NO disparado en esta rama
  porque no hay usuarios existentes pre-launch — al lanzar, los usuarios nuevos
  aceptan estos terminos directamente al registrarse.
- Cuando se active "leave at door" (post-launch), agregar clausula sobre foto
  del paquete con numero de puerta (no fachada) para preservar privacidad.

TESTING:
- TSC strict pasa limpio (paginas son JSX puro con strings, sin tipos complejos).
- Verificacion visual sugerida: abrir /terminos, /privacidad, /terminos-comercio
  y /terminos-repartidor en browser y comprobar que renderizan sin errores
  de hidratacion ni warnings.

**Archivos:** src/app/privacidad/page.tsx, src/app/terminos-comercio/page.tsx, src/app/terminos-repartidor/page.tsx, src/app/terminos/page.tsx

## 2026-05-07 (rama `chore/email-templates-faltantes`)

chore: 4 templates de email faltantes (payment timeout, late refund, no-show)

PROBLEMA QUE RESUELVE:
Las ramas anteriores (cancelacion de pago pendiente, no-show flow) crearon
endpoints y crons que mandaban PUSH al cliente, pero NO email. Eso es un
problema legal (Ley 24.240 exige notificacion documentada de cancelaciones y
reembolsos) y de UX (clientes con push deshabilitado no se enteran).

Esta rama completa los 4 emails que faltaban siguiendo el patron canonico de
EMAIL_REGISTRY + funciones en email-legal-ux.ts + tag igual al id del registry.

TEMPLATES NUEVOS (4):

1) payment_timeout_cancelled — al comprador
   Trigger: cron cancel-stale-pending-payments cancela pedido sin pago confirmado
   en 30 min.
   Funcion: sendPaymentTimeoutCancelledEmail
   Cubre: pedido cancelado, stock restaurado, instrucciones si MP retiene fondos.

2) payment_late_refund — al comprador
   Trigger: webhook MP confirma pago APPROVED en pedido ya cancelado (race con
   timeout o cancelacion manual del cliente).
   Funcion: sendPaymentLateRefundEmail
   Cubre: notificacion expresa de reembolso automatico (Ley 24.240), monto exacto,
   plazo estimado 5-15 dias habiles, metodo (mismo del pago original).

3) customer_no_show_returned — al comprador
   Trigger: endpoint report-no-show (driver espero 10 min y cliente no aparecio).
   Funcion: sendCustomerNoShowReturnedEmail
   Cubre: el repartidor llego pero no te encontramos, el pedido vuelve al
   comercio, el cobro se mantiene (estandar industria), instrucciones de
   impugnacion + sugerencias para evitarlo.

4) merchant_order_returned — al comercio
   Trigger: endpoint report-no-show (paralelo al email del comprador).
   Funcion: sendMerchantOrderReturnedEmail
   Cubre: aviso al comercio que un pedido vuelve, instrucciones de recibirlo con
   el mismo PIN del pickup, aclaracion que el cobro al comercio NO se afecta
   (Moovy come la comision en no-show).

REGISTRO EN EMAIL_REGISTRY:

  Numbers 60-63, category "Ciclo de vida — Pagos" / "Ciclo de vida — Entrega".
  Status "new" hasta validar en produccion. Visibles en /ops/emails con preview.

TRIGGERS CONECTADOS:

  - src/app/api/cron/cancel-stale-pending-payments/route.ts:
    fire-and-forget despues del notifyBuyer push.
  - src/lib/order-payment-confirm.ts (bloque late payment detection):
    despues del refundOrderIfPaid, fire-and-forget del email.
  - src/app/api/driver/orders/[id]/report-no-show/route.ts:
    fire-and-forget DOS emails (buyer + merchant) despues del notifyCustomer push.
    Ampliado el findUnique para incluir order.user.email/firstName y
    order.merchant.email/name (necesarios para los emails).

PATRON USADO:

  Todas las funciones siguen el patron canonico de email-legal-ux.ts:
    - Importan { sendEmail, emailLayout, emailButton, emailInfoBox, emailAlertBox,
      baseUrl } desde "./email"
    - Async, devuelven Promise<boolean> (resultado del sendEmail)
    - Tag = id del EMAIL_REGISTRY (trazabilidad en logs Pino)
    - Manejo de buyerName null (greeting condicional)
    - Subject claro con orderNumber

  Los triggers son fire-and-forget para no bloquear el flow operativo del
  cron/endpoint si SMTP esta caido.

TESTING:
- TSC strict pasa limpio.
- Verificacion: /ops/emails muestra los 4 nuevos (numbers 60-63), preview
  renderiza correctamente con datos de SAMPLE.
- Trigger smoke test: crear pedido → abandonar pago → esperar cron → verificar
  email recibido por el buyer (en sandbox SMTP en local).

POST-LAUNCH:
- En produccion verificar que los emails llegan con SMTP_HOST de produccion.
- Considerar agregar email al driver cuando completa devolucion (gana bonus
  $300). Hoy solo recibe push genérico, podria ser un email "te depositamos
  X bonus por viaje fallido".

**Archivos:** src/app/api/cron/cancel-stale-pending-payments/route.ts, src/app/api/driver/orders/[id]/report-no-show/route.ts, src/lib/email-legal-ux.ts, src/lib/email-registry.ts, src/lib/order-payment-confirm.ts

## 2026-05-07 (rama `feat/no-show-flow`)

feat: flow no-show completo (driver llega, cliente no aparece, devolucion al comercio)

PROBLEMA QUE RESUELVE:
La regla canonica de Moovy es "el pedido jamas se cierra sin PIN". Pero hay un
escenario edge: driver llega al domicilio del cliente y el cliente no esta.
Antes de esta rama no habia flow operativo para eso — el driver quedaba
trabado sin poder ni entregar ni devolver.

NUEVOS ESTADOS DEL DRIVER STATE MACHINE:

  driverStatus: ON_ROUTE_TO_CUSTOMER -> AT_CUSTOMER (driver entro al geofence)
              -> WAITING_FOR_CUSTOMER (driver toco "Llegue", timer 10 min)
              -> DELIVERED (cliente aparece, dicta PIN, fin)
              o RETURNING_TO_MERCHANT (cliente NO aparece, vuelve al comercio)
              -> RETURNED (driver devuelve con PIN del comercio)

ENDPOINTS NUEVOS:

1) POST /api/driver/orders/[id]/start-waiting
   - Driver toca "Llegue al cliente" en el dashboard.
   - Setea driverStatus=WAITING_FOR_CUSTOMER, waitingStartedAt=now.
   - Push al cliente: "Tu repartidor llego. PIN: 4321. Tenes 10 minutos."
   - Audit log de la transicion.
   - Solo permite desde ON_ROUTE_TO_CUSTOMER o AT_CUSTOMER (idempotente).

2) POST /api/driver/orders/[id]/report-no-show
   - Driver marca "Cliente no responde".
   - VALIDACION ANTI-FRAUDE: rechaza si pasaron <10 min desde waitingStartedAt
     (admin puede saltarse el chequeo via override). Devuelve remainingSeconds
     para que el frontend muestre countdown preciso.
   - Setea driverStatus=RETURNING_TO_MERCHANT, noShowReportedAt, noShowFlag=true,
     payoutHoldUntil=+24h (anti-fraude: si cliente impugna, hold del payout).
   - Push al cliente: "No te encontramos. Si fue error, reporta ahora."
   - Audit log con elapsedMinutes para investigacion en disputas.

3) POST /api/driver/orders/[id]/return-to-merchant
   - Driver vuelve al comercio. Comercio le da el MISMO PIN del pickup.
   - Driver lo ingresa, valida con verifyOrderOrSubOrderPin (rate limit, geofence,
     timing-safe compare).
   - Si OK: cierra como driverStatus=RETURNED, merchantStatus=RETURNED, status=RETURNED.
   - Audit log final del flow.

LOGICA FINANCIERA NO-SHOW:

src/lib/orders/order-totals.ts agrega applyNoShowAdjustment(snapshot, noShowFlag):
  - Cliente paga 100% (responsabilidad de estar disponible).
  - Comercio recibe normal (ya cocino/preparo).
  - Driver recibe payout completo + bonus NO_SHOW_DRIVER_BONUS_ARS (default 300).
  - Moovy come la comision (gesto de buena fe, separa cobro tipico).
  - NO modifica el snapshot persistido — calcula los cobros AJUSTADOS al hacer
    payouts. Asi se respeta la regla canonica "el snapshot original no se
    recalcula" (necesaria para cierres fiscales AFIP).

NOTIFICACIONES NUEVAS (src/lib/notifications.ts):

  - notifyCustomerDriverArrived: push urgente con PIN + countdown 10 min.
  - notifyCustomerNoShowReported: push empatico para impugnacion temprana.

UI DRIVER (src/app/repartidor/(protected)/dashboard/page.tsx):

  - Nuevos riderStage: "waiting_customer" y "returning_to_merchant".
  - Componente NoShowWaitingPanel:
    * Timer countdown 10 min visible (formato MM:SS, tabular-nums).
    * Boton "PIN del cliente" (abre keypad para que el cliente dicte).
    * Boton "Cliente no responde" disabled hasta cumplir 10 min reales (anti-fraude
      del frontend, redundante con la del backend pero mejor UX).
    * Confirm dialog antes de reportar no-show.
  - Componente NoShowReturnPanel:
    * Banner rojo "Volver al comercio".
    * Boton "Ingresar PIN del comercio" abre keypad en modo returnToMerchantMode.
  - SwipeToConfirm modificado: en deliveryStatus=PICKED_UP/IN_DELIVERY, el swipe
    llama a /start-waiting (no directo a DELIVERED).
  - PinModal soporta returnToMerchantMode: cuando true, valida contra
    /return-to-merchant en vez de /verify-pickup-pin.
  - Endpoint /api/driver/dashboard expone driverStatus, merchantStatus,
    waitingStartedAt, noShowReportedAt para que el frontend distinga estados.

PROTECCIONES ANTI-FRAUDE DEL DRIVER:

  - waitingStartedAt SOLO seteado por endpoint /start-waiting (no editable
    por el driver directamente).
  - report-no-show rechaza si <10 min desde waitingStartedAt.
  - payoutHoldUntil=+24h: si el cliente impugna y prueba que estaba en casa,
    el payout queda congelado durante esa ventana para review manual.
  - Audit logs en cada transicion con timestamps + elapsedMinutes.

CONSIDERACION DE PRODUCTO:
  El cliente paga 100% en no-show es estandar industria (Rappi, PedidosYa, Glovo).
  La responsabilidad legal de estar en el domicilio es del cliente. Argentina
  defensa del consumidor (Ley 24.240) exige notificacion clara y oportunidad
  de impugnar — la notificacion push tras no-show con boton "Reportar fraude"
  cubre esto.

TESTING:
- TSC strict pasa limpio.
- Smoke test manual sugerido:
    1. Driver retira pedido con PIN del comercio.
    2. Driver llega al domicilio del cliente (geofence).
    3. Toca "Llegue al cliente" → ve panel WAITING con countdown 10 min.
    4. Espera 10 min reales.
    5. Toca "Cliente no responde" → confirma → ve panel RETURN.
    6. Vuelve al comercio. Comercio le dicta el mismo PIN del pickup.
    7. Ingresa PIN → cierra como RETURNED.

POST-LAUNCH:
- Hold 24h del payout: la logica de payouts batch (post-launch) tiene que
  respetar payoutHoldUntil antes de procesar.
- Sistema de impugnacion: cliente que recibio push de no-show puede tocar
  boton "Estaba en casa, reportar fraude" para abrir caso en /ops/fraude.
  No implementado en esta rama — endpoint y panel quedan para rama legal/UX.

**Archivos:** src/app/api/driver/dashboard/route.ts, src/app/api/driver/orders/[id]/report-no-show/route.ts, src/app/api/driver/orders/[id]/return-to-merchant/route.ts, src/app/api/driver/orders/[id]/start-waiting/route.ts, src/app/repartidor/(protected)/dashboard/page.tsx, src/lib/notifications.ts, src/lib/orders/order-totals.ts

## 2026-05-07 (rama `feat/driver-offer-map-and-timer`)

feat: mapa preview + timer countdown visible en oferta del driver

PROBLEMA QUE RESUELVE:
El modal de oferta del driver tenía dos puntos débiles vs apps grandes:
  1. SIN MAPA: solo mostraba "501m, 9 min" como texto. El driver no podía
     ver visualmente la ruta antes de aceptar (Rappi/Uber Eats sí lo muestran).
  2. TIMER OCULTO: el sistema tenía `assignmentExpiresAt` en DB pero el driver
     no veía el countdown. La oferta podía expirar mientras decidía y aparecía
     el error "esta oferta ya no está disponible" sin warning previo.

CAMBIOS:

1) Componente NUEVO: src/components/rider/DriverOfferMapPreview.tsx
   - Mini mapa estático ~150px de altura optimizado para el modal de oferta.
   - 2 AdvancedMarkerElement: comercio (azul, label "A") y cliente (rojo, "B").
   - Polyline dashed naranja entre origen y destino.
   - Auto-fit a bounds con padding generoso (no se pegan al borde).
   - Sin interacción (gestureHandling: none, draggable: false, scrollwheel: false).
   - Por qué un componente NUEVO en vez de reusar RiderMiniMap:
     * RiderMiniMap es 1000+ líneas para navegación activa (turn-by-turn,
       off-route detection, head-up camera).
     * Para el preview de oferta no necesitamos eso — solo orientación visual.
     * Línea recta dashed evita 1 llamada extra a Routes API por cada oferta
       (el driver puede recibir 10-20 ofertas/hora; el costo sumaría rápido).

2) Hook NUEVO: useOfferCountdown(expiresAt, onExpire)
   - Calcula segundos restantes hasta expiresAt, re-renderiza cada 1s.
   - Dispara onExpire() cuando llega a 0 (auto-dismiss del card).
   - Retorna: secondsLeft, progressPercent (para la barra), isUrgent (<=10s),
     isExpired.
   - Cleanup automático del setInterval en unmount.

3) Componente NUEVO interno: OfferCard
   - Extraído del .map() inline porque los hooks no pueden usarse dentro de
     un map directo.
   - Renderiza el card completo: header, ganancia, mapa preview, direcciones,
     notas del cliente, botones.
   - Usa useOfferCountdown para tener el timer encapsulado por card (cada
     oferta tiene su propio expiresAt independiente).

4) Mejoras visuales del card:
   - Barra de progreso arriba (1.5px alto): naranja por default, rojo cuando
     isUrgent. Se vacía linealmente. Reemplaza el "pulse gradient" estático.
   - Botón ACEPTAR muestra "Aceptar (32s) →" con tabular-nums.
   - Color del botón cambia a rojo cuando faltan ≤10s (urgencia visual).
   - Botón disabled cuando isExpired (muestra "Expiró").
   - Estado de loading "Aceptando..." con spinner mientras se acepta.
   - Markers visuales A/B con letras (más profesional que circulitos sin texto).

DECISIONES DE PRODUCTO:

- Línea recta dashed en vez de Routes API: el driver tiene mapa real-time
  cuando acepta. El preview es solo orientación. Ahorra costo de API.
- Mapa solo se muestra si las 4 coords (merchant + customer) están presentes.
  Si alguna falta, el card cae al layout sin mapa (graceful degradation).
- Auto-dismiss respeta el dismissedOfferIds existente: la oferta expirada
  desaparece del modal pero queda registro local en el set hasta que
  fetchDashboard() la limpia del backend.

TESTING:
- TSC strict pasa limpio.
- Verificación visual: cuando llega una oferta nueva, el mapa renderiza con
  los 2 markers, la barra empieza llena (naranja) y se vacía. A los 10s
  cambia a rojo. Al llegar a 0 el card desaparece automáticamente.

POST-LAUNCH (anotado, NO en esta rama):
- Si en el futuro el costo de Maps no es problema, swap la línea dashed por
  Routes API real para ver el camino exacto (ETA + tráfico).
- Mostrar también la posición actual del driver (un 3er marker) en el preview.

**Archivos:** src/app/repartidor/(protected)/dashboard/page.tsx, src/components/rider/DriverOfferMapPreview.tsx

## 2026-05-07 (rama `feat/driver-availability-checkout`)

feat: pre-validación de drivers en checkout (banner rojo/amarillo + bloqueo)

PROBLEMA QUE RESUELVE:
Antes de esta rama, si el cliente hacía un pedido cuando no había drivers
disponibles, el flow era:
  1. Cliente paga con MP
  2. Sistema busca driver -> no hay
  3. 30 min después, cron auto-cancela + refund automatico
  4. Cliente queda con mala experiencia ("pagué algo que se canceló solo")

Mejor experiencia: avisarle ANTES de pagar, así decide si esperar o usar pickup.

CAMBIOS:

1) Endpoint /api/delivery/availability mejorado
   - Antes: count global de drivers online (sin filtro por zona).
   - Ahora: si recibe ?merchantId=X, hace query PostGIS ST_DWithin con radio
     leído de MoovyConfig.driver_search_radius_meters (default 50km, mismo
     criterio que assignment-engine).
   - Nuevos campos en response: estimatedWaitMinutes (5/8/12 min según
     cantidad de drivers), radiusMeters, hasDrivers.
   - Filtros canónicos: isOnline + isActive + approvalStatus=APPROVED +
     availabilityStatus=DISPONIBLE + ubicacion IS NOT NULL.

2) Hook + banner en checkout (src/app/(store)/checkout/page.tsx)
   - useEffect re-fetcha availability cada 30s con merchantId del primer
     vendor del carrito.
   - Banner rojo si availableDrivers === 0:
     "Sin repartidores disponibles ahora" + sugerencia de pickup.
   - Banner amarillo si availableDrivers === 1:
     "Solo 1 repartidor — puede haber demora (~12 min)".
   - Banner verde mini si availableDrivers >= 2:
     "X repartidores disponibles. Asignación estimada: ~X min".
   - Solo se muestra si delivery="home" + deliveryType="IMMEDIATE" (pickup
     y programado no necesitan driver inmediato).

3) Bloqueo del botón "Confirmar Pedido"
   - Disabled si availableDrivers === 0 + delivery="home" + IMMEDIATE.
   - Cliente todavía puede usar pickup o programar (deliveryType=SCHEDULED
     se fuerza automáticamente cuando hasDrivers=false, ya estaba implementado).

DECISIONES DEL CONSEJO QUE NO ENTRARON:

- Inicialmente planeamos diferir notifyMerchant hasta tener driver asignado
  (para que el comercio no cocine si no va a haber driver). Tras analizar el
  flow real (búsqueda de drivers ocurre cuando merchant marca "Listo", NO al
  pagar) y considerando la nueva pre-validación, esta capa quedó innecesaria.
  La cocina paralela mientras se busca driver ahorra 10-20 min al cliente.
  El escenario edge "comercio cocinó pero no hay driver" está cubierto por:
  (a) la pre-validación que acabamos de hacer, (b) auto-refund automático del
  cron retry-assignments cuando no se asigna driver tras 6 intentos.

- Inicialmente planeamos radio expansivo 3km -> 5km -> 8km. No es necesario:
  Ushuaia es chica, el radio default 50km cubre toda la ciudad.

CAPAS DE PROTECCION RESULTANTES (defense-in-depth):

  Capa 1: pre-validación al checkout (esta rama) → cliente sabe ANTES.
  Capa 2: búsqueda de driver con PostGIS radio 50km (existente).
  Capa 3: cron retry-assignments (existente, max 3 retries con escalado).
  Capa 4: auto-cancel + refund automático tras 6 intentos (existente).

TESTING:
- TSC strict pasa limpio.
- Endpoint testeable con: GET /api/delivery/availability?merchantId=X
- Verificación visual: poner offline todos los drivers y ver banner rojo,
  poner 1 driver online y ver banner amarillo, 2+ ver verde.

**Archivos:** src/app/(store)/checkout/page.tsx, src/app/api/delivery/availability/route.ts

## 2026-05-07 (rama `chore/cron-monitoring-completo`)

chore: monitoreo completo de crons + alertas email + retention 30d + panel pro

PROBLEMA QUE RESUELVE:
Antes de esta rama, el panel /ops/crons mostraba solo 7 de los 16 crons del
sistema, y dentro de esos 7 uno (process-broadcasts) aparecia "Nunca corrio"
aunque estaba corriendo. Los otros 9 crons funcionaban silenciosamente sin
visibilidad. Si alguno fallaba a las 3am, nadie se enteraba hasta que un
cliente reportaba un sintoma.

OBJETIVO: monitoreo completo nivel pro (Datadog/Sentry-style).

CAMBIOS:

1) Envolver con recordCronRun los 9 crons que no lo tenian
   - assignment-tick, cart-recovery, close-auctions, merchant-timeout,
     mp-reconcile, retry-assignments, scheduled-notify, seller-resume,
     update-merchant-tiers
   Ahora todos registran en CronRunLog y aparecen en el dashboard.

2) Bug fix: process-broadcasts aparecia "Nunca corrio"
   - Causa: el handler usaba recordCronRun pero el return final era
     `return NextResponse.json(stats)` donde stats era el resultado del
     wrapper, no un NextResponse valido. La excepcion al serializar se tragaba
     en el try/catch y nunca se registraba el run en CronRunLog.
   - Fix: tipar `recordCronRun<NextResponse>` y devolver
     `result: NextResponse.json(...) as NextResponse` desde el callback.

3) Helper cron-health.ts ampliado con metricas pro
   - Tipo CronHealth extendido con: successRate24h, successRate7d,
     avgDurationMs, totalRuns24h, totalRuns7d, consecutiveFailures.
   - Funcion getRecentCronErrors(jobName) para drawer de detalle.
   - Funcion shouldAlertCronFailures con check de idempotencia anti-spam
     (solo 1 alerta por hora por cron).

4) Sistema de alertas por email automaticas
   - sendCronFailureAlertIfNeeded() llamada desde recordCronRun cuando un cron
     acumula 3+ fallos consecutivos.
   - Email a NOTIFICATION_EMAIL (fallback OPS_LOGIN_EMAIL) con detalle del
     error, count de fallos, link al panel.
   - Idempotente via AuditLog action="CRON_FAILURE_ALERT_EMAIL_SENT".
   - Fire-and-forget: si el email falla, NO bloquea el throw del error real.

5) CRON_EXPECTATIONS completado
   - Agregadas 9 entries que faltaban + 1 nueva (cleanup-cron-runs).
   - Ahora son 17 crons registrados, todos visibles en /ops/crons.

6) Endpoints nuevos
   - POST /api/admin/crons/[jobName]/trigger — boton "Ejecutar ahora".
     Reutiliza el endpoint del cron real con el CRON_SECRET, asi se preserva
     toda la logica (auth + recordCronRun + side effects).
   - GET /api/admin/crons/[jobName]/errors — lista de ultimos 20 errores
     para el drawer del panel.

7) Cron nuevo: cleanup-cron-runs
   - Diario 2:30am, retention 30 dias configurable via MoovyConfig.
   - Sin esto, CronRunLog crece ~7K filas/dia y degrada el panel.

8) Panel /ops/crons rediseñado nivel pro
   - Banner rojo arriba si hay failing/stale.
   - Stats agregadas (4 cards: OK / atrasados / fallando / nunca corrio).
   - Filtros por estado (chips clickables).
   - Cards mejoradas: success rate barra mini, tiempo promedio, runs 24h,
     consecutive failures destacados.
   - Botones "Ejecutar ahora" + "Ver errores" en cada card.
   - Drawer modal con stack trace de errores recientes (responsive).
   - Auto-refresh 30s (solo si pestaña visible).

9) VPS — crontab regenerado
   - 18 entries totales (17 crons + 1 backup diario DB).
   - Migrado de TOKEN hardcodeado a `$(grep ^CRON_SECRET .env)` para que
     rotaciones del secret no requieran editar el crontab.
   - Cron nuevo cleanup-cron-runs activado (2:30am).

PENDIENTE QUE SE DIFIERE:
- Implementacion completa de campañas de publicidad (process-broadcasts cron
  ya esta arreglado pero la logica de campañas se decide post-launch).

TESTING:
- TSC strict pasa limpio (npx tsc --noEmit --skipLibCheck).
- Verificacion en VPS: 18 entries en crontab, cleanup-cron-runs registrado
  en CRON_EXPECTATIONS.

POST-DEPLOY EN PRODUCCION (despues de devmain.ps1):
- Verificar /ops/crons: deberian aparecer los 17 crons (era 7 antes).
- Verificar que los nuevos cron cards tengan metricas: success rate 24h,
  tiempo promedio, runs 24h.
- Probar boton "Ejecutar ahora" en cualquier cron.
- Probar drawer "Ver errores" (puede estar vacio si nunca fallaron).

**Archivos:** docs/referencias/observaciones_prod.md, src/app/api/admin/crons/[jobName]/errors/route.ts, src/app/api/admin/crons/[jobName]/trigger/route.ts, src/app/api/cron/assignment-tick/route.ts, src/app/api/cron/cart-recovery/route.ts, src/app/api/cron/cleanup-cron-runs/route.ts, src/app/api/cron/close-auctions/route.ts, src/app/api/cron/merchant-timeout/route.ts (+8 mas)

## 2026-05-06 (rama `chore/export-delivery-zones-to-prod`)

chore: script para exportar delivery zones a produccion

PROBLEMA QUE RESUELVE:
Las zonas de delivery son polígonos PostGIS (tipo Unsupported() en Prisma).
`prisma db push` solo sincroniza schema, NO copia data. Los seeds normales
no pueden insertar polígonos via Prisma Client. Hasta ahora no había forma
limpia de transferir las zonas configuradas localmente (con sus polígonos
dibujados a mano en /ops/zonas-delivery) a la DB de produccion.

SOLUCION:
- scripts/export-delivery-zones-to-prod.ts (NUEVO)
  - Lee las zonas locales con $queryRaw (incluye ST_AsText del polygon)
  - Genera scripts/seed-delivery-zones-prod.sql con INSERTs idempotentes
    (ON CONFLICT (name) DO NOTHING) usando ST_GeomFromText() para polígonos
  - Modo PREVIEW por default (dry-run, no toca nada)
  - Modo --write genera el archivo SQL
  - Tabla preview con vértices por zona para verificar antes de exportar

FLUJO COMPLETO DE DEPLOY DE ZONAS:
  Local:
    1. npx tsx scripts/export-delivery-zones-to-prod.ts          (preview)
    2. npx tsx scripts/export-delivery-zones-to-prod.ts --write  (genera SQL)
    3. .\scripts\finish.ps1                                       (commit + push)
    4. .\scripts\devmain.ps1                                      (deploy a prod)

  En el servidor de produccion (despues del deploy):
    1. npx prisma db push                                         (sincroniza schema)
    2. npx tsx scripts/apply-postgis-zones-index.ts               (crea indice GIST)
    3. psql $DATABASE_URL -f scripts/seed-delivery-zones-prod.sql (carga las zonas)

IDEMPOTENCIA:
ON CONFLICT (name) DO NOTHING — correr el SQL dos veces es seguro. Si una
zona ya existe en produccion, NO se sobreescribe (defensa contra race).
Para reemplazar: borrar manualmente desde /ops/zonas-delivery primero o
DELETE en produccion antes de re-correr el seed.

ZONAS EXPORTADAS EN ESTA RUN:
- Zona C — Alta / Dificil   (×1.35, +$350, 26 vertices)
- Zona B — Intermedia       (×1.15, +$150, 80 vertices)
- Zona A — Centro           (×1.00,   +$0, 79 vertices)
- USHUAIA                   (×1.00,   +$0,  8 vertices, capa base displayOrder=0)

**Archivos:** scripts/export-delivery-zones-to-prod.ts, scripts/seed-delivery-zones-prod.sql

## 2026-05-06 (rama `feat/payment-pending-cancellation`)

feat: cancelacion de pago pendiente + descripcion de producto obligatoria

PROBLEMA RAIZ que resuelve:
Cuando el buyer paga con MercadoPago pero abandona el redirect (cierra pestaña,
vuelve atras, error de red), el pedido quedaba "fantasma" en estado AWAITING_PAYMENT
para siempre. Stock reservado, cliente sin poder hacer nada, comercio sin saber.

SOLUCION (4 capas, defense-in-depth):

1. UI BUYER — banner inmediato (sin espera de minutos):
   - src/app/(store)/mis-pedidos/page.tsx
   - Apenas el cliente entra a "Mis Pedidos" con un pedido en AWAITING_PAYMENT,
     ve banner ambar con dos acciones: "Continuar pago" (redirect a MP via
     mpPreferenceId) y "Cancelar pedido" (con confirm modal).
   - Banner desaparece automaticamente cuando paymentStatus pasa a PAID
     (probing existente vs MP API) o cuando status pasa a CANCELLED.
   - Filtro `isPendingPayment()` chequea: status NO terminal AND paymentStatus
     pendiente AND paymentMethod=mercadopago.

2. CRON AUTO-CANCEL (red de seguridad):
   - src/app/api/cron/cancel-stale-pending-payments/route.ts (NUEVO)
   - Corre cada minuto. Cancela pedidos con createdAt > 30 min sin pago
     confirmado. Restaura stock (Listing + Product) en transaccion Serializable.
   - Timeout configurable desde MoovyConfig.payment_pending_timeout_minutes.
   - Wrapped en recordCronRun para healthcheck OPS.
   - Audit log + notifyBuyer + sockets a admin/customer/merchant.

3. WEBHOOK MP — pago tardio post-cancelacion -> refund automatico:
   - src/lib/order-payment-confirm.ts
   - Antes: si MP confirmaba un pago despues de que el pedido estaba CANCELLED,
     el sistema REACTIVABA el pedido (status pasaba a CONFIRMED). Doble bug:
     reactivaba contra la voluntad del cliente Y se quedaba con la plata.
   - Ahora: detecta TERMINAL_STATUSES_LATE_PAYMENT antes del update. Si esta
     terminal, NO reactiva. Persiste el Payment para audit, marca paymentStatus=PAID
     para que refundOrderIfPaid lo detecte, dispara refund automatico.
   - Audit log con action LATE_PAYMENT_AFTER_CANCELLATION.
   - Defense-in-depth: si race condition entre query y update, refund tambien.

4. CRON_EXPECTATIONS:
   - src/lib/cron-health.ts: agregada entrada cancel-stale-pending-payments
     (maxHours: 1) para que el dashboard OPS lo monitoree.

FIX BONUS: PIN prematuro al comercio
- src/app/api/merchant/orders/route.ts
- Antes: PIN aparecia al comercio apenas el driver llegaba (DRIVER_ARRIVED),
  sin importar si el comercio habia marcado "Listo para retirar". El comercio
  veia el PIN cuando todavia no habia terminado de preparar.
- Ahora: PIN solo aparece si AMBAS son verdad: (a) driver llego (deliveryStatus=
  DRIVER_ARRIVED o driverStatus=AT_MERCHANT) Y (b) comercio marco listo
  (merchantStatus=READY/PICKED_UP/RETURNED o legacy status correspondiente).
- Compat retro: pedidos pre-rama state-machine-paralela con merchantStatus=null
  caen al fallback legacy.

FIX BONUS: descripcion de producto obligatoria
- src/app/comercios/actions.ts
- Bug: el comercio reportaba "Invalid input: expected string, received null" al
  editar productos. Causa: schema Zod tenia description.optional() pero
  formData.get() retorna null (no undefined) para campos vacios, y .optional()
  NO acepta null.
- Decision de producto: descripciones venden y son SEO-relevantes (Rappi,
  MercadoLibre obligan). Cambiamos a z.string().min(10, "...") con mensaje claro.
- Implicacion: productos legacy con descripcion null se fuerzan a completarse al
  editar. Intencional — oportunidad para completar catalogo pre-launch.

POST-LAUNCH (anotado, NO en esta rama):
- feat/driver-offer-map-and-timer: mapa preview + countdown en oferta del driver
- feat/driver-availability-checkout: pre-validacion drivers + auto-refund sin drivers
- feat/no-show-flow: UI driver para WAITING_FOR_CUSTOMER, devolucion al comercio
- Otros campos obligatorios al editar producto (categoria, peso) en rama propia

**Archivos:** src/app/(store)/mis-pedidos/page.tsx, src/app/api/cron/cancel-stale-pending-payments/route.ts, src/app/api/merchant/orders/route.ts, src/app/comercios/actions.ts, src/lib/cron-health.ts, src/lib/order-payment-confirm.ts

## 2026-05-06 (rama `fix/state-machine-paralela-merchant-driver`)

fix: state machine paralela merchant + driver, PIN 4 digitos, bulk fix de filtros de estados

PROBLEMA RAIZ: el campo `Order.status` mezclaba el flujo del comercio con el del driver
en un solo string. Eso bloqueaba paralelismo (merchant no podia marcar listo si el
driver ya habia llegado) y multiples filtros hardcodeados de estados activos olvidaban
agregar estados nuevos del flujo (DRIVER_ARRIVED), haciendo que pedidos en curso
"desapareciera" o quedaran mal clasificados en buyer/comercio/driver/admin.

SCHEMA (Order y SubOrder):
- merchantStatus: PREPARING -> READY -> PICKED_UP -> RETURNED (independiente)
- driverStatus: ASSIGNED -> AT_MERCHANT -> ON_ROUTE_TO_CUSTOMER -> AT_CUSTOMER ->
  WAITING_FOR_CUSTOMER -> DELIVERED (independiente; alt: RETURNING_TO_MERCHANT -> RETURNED)
- waitingStartedAt, noShowReportedAt, payoutHoldUntil, noShowFlag (preparados
  para futura rama de no-show flow)
- `status` legacy queda como vista derivada (deriveLegacyStatus)

HELPER CANONICO src/lib/orders/order-status-machine.ts:
- legacyStatusToParallel + getEffectiveMerchantStatus + getEffectiveDriverStatus
  para back-fill y compat con consumers viejos
- DRIVER_ACTIVE_STATUSES, DRIVER_HISTORICAL_STATUSES (parallel)
- LEGACY_TERMINAL_STATUSES, LEGACY_ACTIVE_STATUSES (legacy)
- Patron canonico: enumerar terminales (chico, estable) y derivar
  "activo = NO terminal" -> estados nuevos del flujo caen automaticamente
  en activos sin tocar filtros

PIN doble cambiado de 6 a 4 digitos:
- src/lib/pin.ts: generatePin, sanitizePinInput, formatPinForDisplay
- src/lib/pin-verification.ts: validacion shape
- src/components/rider/PinKeypad.tsx: PIN_LENGTH + textos UI
- scripts/test-pin-verification.ts: tests + regex actualizados
- Razon: estandar industria (Rappi/PedidosYa/Uber Eats/Glovo). UX a -5C
  con guantes. Anti-fraude conservado por rate limit + geofence + auto-suspend.

BUG 1 - Driver dashboard mandaba pedidos a Historial:
- src/app/api/driver/dashboard/route.ts: filtra por driverStatus paralelo +
  fallback legacy con OR (cubre pedidos viejos sin merchantStatus seteado).

BUG 2 - Merchant bloqueado para "Listo" cuando driver ya llego:
- src/app/api/merchant/orders/[id]/ready/route.ts: chequea merchantStatus,
  no status legacy. Permite marcar listo independiente del driverStatus.

BUG 3 - Buyer ve pedido en Historial al "Llegue al comercio":
- src/app/(store)/mis-pedidos/page.tsx: invertido a TERMINAL_STATUSES + activo derivado
- src/app/(store)/mis-pedidos/[orderId]/page.tsx: agregado DRIVER_ARRIVED al
  timeline + showMap + tracking
- src/components/orders/OrderTrackingMiniMap.tsx: TRACKABLE_STATUSES con DRIVER_ARRIVED

BUG 4 - Comercio panel manda pedido a "Todos":
- src/app/comercios/(protected)/pedidos/page.tsx: isActiveStatus() derivado
  (NO completed AND NO failed). failedStatuses ampliado con REFUNDED, EXPIRED,
  RETURNED para futuro-proof.

BULK FIX (5 endpoints + KPI dashboard):
- src/app/api/orders/active/route.ts
- src/app/api/admin/active-orders/route.ts
- src/app/api/ops/orders/live/route.ts (+ bucket driverFlow nuevo)
- src/app/ops/(protected)/dashboard/page.tsx (KPI activeOrders)
- src/app/api/driver/orders/route.ts (3 tabs)
Todos migrados a `notIn: LEGACY_TERMINAL_STATUSES` para que estados nuevos
del flujo no rompan los listings.

CLAIM y STATUS endpoints actualizados para mantener parallel + legacy en sync:
- src/app/api/driver/orders/[id]/claim/route.ts: setea driverStatus="ASSIGNED"
- src/app/api/driver/orders/[id]/status/route.ts: actualiza driverStatus +
  merchantStatus en cada transicion (DRIVER_ARRIVED, PICKED_UP, DELIVERED)

BUG 5 - Comercio no se actualiza en tiempo real con nuevos pedidos:
- src/app/comercios/(protected)/pedidos/page.tsx: polling adaptativo bajado
  de 60s a 10s constante. Socket sigue como primary path. Agregado log visible
  en consola para debug del estado de conexion.

BUG 6 - Notas del cliente al repartidor no llegaban al driver:
- src/app/api/driver/dashboard/route.ts: deliveryNotes en payload de oferta
  + pedido activo
- src/app/api/driver/orders/route.ts: deliveryNotes en output de 3 tabs
- src/app/repartidor/(protected)/dashboard/page.tsx: banner ambar con notas
  visible en oferta (antes de aceptar) y en pedido activo (durante todo el flow).
- Type Order y PendingOrderOffer: deliveryNotes?: string | null

INFRA:
- scripts/start.ps1: fix em-dash em-dash UTF-8 sin BOM (rompia parser PowerShell 5.1)
- scripts/tsc-strict.ps1: reescritura ASCII puro (sin box-drawing chars,
  emojis, em-dashes, tildes en comentarios). Captura log del build a archivo
  temporal y lo muestra si falla (antes silenciaba el output con Out-Null).
- scripts/finish.ps1: pre-flight PSParser::Tokenize + invocacion via
  powershell.exe -File (subproceso) para que parse errors propaguen exit code.
  Antes silenciosamente continuaba commiteando aunque tsc-strict no parseara.
- scripts/clean-old-orders.ts: script ad-hoc para limpiar pedidos viejos de
  prueba sin tocar zonas, comercios, drivers, productos.

TESTING:
- 12/12 tests de PIN pasando (tras update a 4 digitos)
- DB limpiada: 23 orders viejos eliminados, 4 zonas / 5 merchants / 4 drivers /
  9 products preservados
- Smoke test end-to-end del flow normal (buyer paga -> comercio acepta y marca
  listo -> driver retira con PIN 4 digitos -> delivery con PIN 4 digitos -> DELIVERED)
  funciona sin trabarse en ningun panel (buyer / comercio / driver / ops live).

POST-LAUNCH (anotado, NO en esta rama):
- feat/payment-pending-cancellation: cancelar pedidos sin pago + cron auto-cancel 30min
- feat/driver-offer-map-and-timer: mapa preview en oferta + countdown visible
- feat/driver-availability-checkout: pre-validacion drivers + auto-refund sin drivers
- No-show flow completo (UI driver para WAITING_FOR_CUSTOMER, devolucion al comercio)
- Limpieza de PIN sanitization en api/orders/[id]/route.ts (incluir DRIVER_ARRIVED
  cuando se implemente AT_CUSTOMER en parallel)

**Archivos:** prisma/schema.prisma, scripts/clean-old-orders.ts, scripts/finish.ps1, scripts/start.ps1, scripts/test-pin-verification.ts, scripts/tsc-strict.ps1, src/app/(store)/mis-pedidos/[orderId]/page.tsx, src/app/(store)/mis-pedidos/page.tsx (+16 mas)

## 2026-05-05 (rama `fix/delivery-fee-preview-vs-cobro`)

fix(delivery): unificar fee preview vs cobro + auto-flujo de ramas + zona fallback. Bug crítico: el preview en /api/delivery/calculate usaba calculateDeliveryCost (delivery.ts, fórmula maestra con factor 2.2) mientras que POST /api/orders usaba calculateShippingCost (shipping-cost-calculator.ts, por categoría de paquete) — el cliente veía $2.763 en checkout pero al pagar se cobraba $1.315 (FRAUD ALERT por diff >25%). Fix: el preview ahora replica EXACTAMENTE el flow del POST (calculateShippingCost MEDIUM/STANDARD/orderTotal=0 → suma operacional 5% subtotal → climate multiplier → zone multiplier). Cliente y server muestran el mismo monto al peso. UX checkout: agregado useEffect con debounce 500ms que dispara calculateDelivery automáticamente al cargar el checkout cuando hay address con street+number (no exige lat/lng — el endpoint hace geocoding fallback con Google Maps si faltan coords). Antes el fee solo aparecía al tocar "Continuar al pago"; ahora se muestra inline en "Tu Pedido" desde el primer render. Helper delivery-zones.ts: getZoneForLocation devuelve la zona con displayOrder más BAJO como fallback cuando no hay match en ningún polígono — patrón "capa base + modificadoras" estilo Glovo/Rappi/PedidosYa que elimina los gaps milimétricos entre zonas dibujadas a mano. Cero gaps lógicos: si el admin solo dibuja B y C, las direcciones que caen fuera caen automáticamente en A. Quitado el modal de warning de overlaps en /ops/zonas-delivery porque el approach nuevo asume overlaps intencionales (Zona A grande cubre todo, B y C encima ganan por displayOrder DESC); el endpoint sigue logueando overlapsCount en Pino para debug futuro. Doble verificación TypeScript: tsconfig.json mantiene .next/dev/types en include (Next.js lo regenera en cada start del dev) pero suma .next/dev en exclude (TSC respeta exclude sobre include). tsconfig.strict.json nuevo extiende del base e incluye TODO. scripts/tsc-strict.ps1 nuevo limpia .next, regenera tipos con next build, y corre tsc strict. scripts/finish.ps1 ahora ejecuta tsc-strict ANTES de cualquier acción de git/db; si falla aborta el commit con SKIP_TSC=1 como override. Auto-flujo de ramas: scripts/finish.ps1 lee .commit-message del root si existe (en vez del prompt interactivo), lo usa para el commit y lo borra post-exitoso. scripts/start.ps1 lee .next-branch (formato "tipo nombre" en una o dos líneas), crea la rama sin prompts y borra el archivo. Sanitiza el nombre (espacios → guiones, sin chars especiales). Ambos archivos en .gitignore. Mauro deja de pegar mensajes y elegir tipos: yo los dejo pre-cargados. Fallback a modo interactivo si los archivos no existen. Archivos modificados: src/app/api/delivery/calculate/route.ts, src/app/(store)/checkout/page.tsx, src/lib/delivery-zones.ts, src/app/ops/(protected)/zonas-delivery/ZonesDeliveryClient.tsx, tsconfig.json, scripts/finish.ps1, scripts/start.ps1, .gitignore. Archivos nuevos: tsconfig.strict.json, scripts/tsc-strict.ps1.

**Archivos:** .gitignore, scripts/finish.ps1, scripts/start.ps1, scripts/tsc-strict.ps1, src/app/(store)/checkout/page.tsx, src/app/api/delivery/calculate/route.ts, src/app/ops/(protected)/zonas-delivery/ZonesDeliveryClient.tsx, src/lib/delivery-zones.ts (+2 mas)

## 2026-05-05 (rama `chore/seed-mundo-real`)

chore(seed): runbook orquestador para "prueba de mundo real" pre-launch. 5 archivos nuevos: scripts/seed-package-categories.ts (6 PackageCategory + DeliveryRate según Biblia v3 — MICRO/SMALL/MEDIUM/LARGE/XL/FLETE con base $800–$8.000 y precio/km $15–$329), scripts/seed-real-world-test.ts (cuentas test idempotentes con bcrypt — Buyer con 3 direcciones distribuidas en zonas A/B/C: San Martín 850, Las Primulas 191, Haruwen 2329; Merchant aprobado con docs APPROVED + 5 productos con weightGrams/volumeMl/packageCategoryId en Magallanes 250; Driver MOTO online aprobado en Magallanes 600; Seller marketplace aprobado en Magallanes 900; password único Test1234!; helper archiveStaleAddresses limpia direcciones zombies cuando el seed cambia de calles entre runs), scripts/setup-mundo-real.ts (runbook orquestador que corre 7 pasos en cadena via spawnSync con dry-run + --execute), docs/testing/mock-geolocation.md (guía Chrome DevTools Sensors con 6 coords copiables y explicación de cómo el multiplicador aplica al destino del pedido), docs/testing/checklist-mundo-real.md (8 categorías ~50 casos: Setup base, Pagos MP, PIN doble, Flujos críticos, Zonas, Seguridad, Ushuaia específico, Infra). Bug fix scripts/seed-categories.ts: el findUnique buscaba por slug pero el constraint de DB es por name → cambiado a findFirst con OR sobre slug y name (P2002 resuelto). Actualización del precio de combustible en seed-biblia-launch.ts: nafta súper YPF Ushuaia $1.607 → $1.658 (valor confirmado por founder 2026-04-30). Cotización USD referencia: blue $1.395 → oficial $1.400 (cierre abril 2026). Validation final con validate-ops-config.ts: 9/9 tests pasaron limpios. El cambio en CLAUDE.md de la rama anterior (decisión arquitectónica de zonas con polígonos PostGIS) viaja con este commit. Setup completo verificado end-to-end: 7/7 pasos en 12s sin errores.

**Archivos:** .claude/CLAUDE.md, docs/testing/checklist-mundo-real.md, docs/testing/mock-geolocation.md, scripts/seed-biblia-launch.ts, scripts/seed-categories.ts, scripts/seed-package-categories.ts, scripts/seed-real-world-test.ts, scripts/setup-mundo-real.ts

## 2026-05-03 (rama `feat/zonas-delivery-multiplicador`)

feat(delivery): zonas con multiplicador editable + UX pro de dibujo (pintar + click + edit inline). Schema: modelo DeliveryZone con PostGIS Polygon SRID 4326 + GiST index, multiplier/driverBonus/displayOrder/isActive editables; SubOrder agrega 3 campos snapshot inmutables (zoneCode/zoneMultiplier/zoneDriverBonus, audit AAIP/AFIP). Helper canónico src/lib/delivery-zones.ts (getZoneForLocation, getZoneSnapshotForLocation, cache TTL 1h con invalidación, ray casting, overlap por displayOrder DESC). Endpoints CRUD admin con detección de overlaps via ST_Intersects + audit log Pino + invalidación cache. Endpoint público /api/delivery-zones/check con rate limit 60/min. Integración en motor: POST /api/orders consulta zona del destino, aplica multiplicador a delivery fee total y per-group multi-vendor; buildSubOrderFinancialSnapshot suma zoneDriverBonus al driverPayoutAmount. Fix crítico: /api/delivery/calculate deja de hardcodear ZONA_A — detecta zona real y devuelve zoneSnapshot al frontend (evita mismatch entre preview y cobro). Display checkout cliente: línea "↳ Zona X +Y%" debajo del envío (Defensa del Consumidor 24.240). Componente reutilizable ZoneBadge para integración en panel driver. UI /ops/zonas-delivery con 3 modos de dibujo: (1) "Click por click" rojo paso-a-paso con undo+limpiar, (2) "Pintar zona" violeta freehand drag con simplificación Douglas-Peucker (tolerance 0.0001 ≈ 11m), (3) edición inline de zonas existentes con vértices arrastrables sin redibujar. Listener global mouseup en window evita que modo Pintar quede pegado si soltás fuera del mapa. Hard delete con confirmación textual literal "BORRAR" (regla #26). Toggle visibilidad con Eye/EyeOff (no Power). Modal warning amarillo cuando zona se solapa con otras (informativo, no bloquea). Script apply-default-zone-polygons.ts --force ahora requiere --confirm SOBRESCRIBIR doble (regla #26 anti-accidente, después de incidente que perdió polígonos manuales). Seed seed-delivery-zones.ts 3 zonas A/B/C según Biblia v3 (multiplier 1.0/1.15/1.35, bonus 0/150/350) con polígonos NULL hasta que admin dibuje. Test test-delivery-zones.ts con 5 casos point-in-polygon. BibliaConfigClient deja de editar zonas legacy y redirige a /ops/zonas-delivery. seed-biblia-launch.ts marca zoneMultipliersJson como deprecado + actualiza nafta YPF Ushuaia $1.999 (abril 2026) y USD oficial $1.400 (cierre abril 2026). useGoogleMaps hook agrega library "drawing".

**Archivos:** prisma/schema.prisma, scripts/apply-default-zone-polygons.ts, scripts/apply-postgis-zones-index.ts, scripts/seed-biblia-launch.ts, scripts/seed-delivery-zones.ts, scripts/setup-postgis-zones.sql, scripts/test-delivery-zones.ts, src/app/(store)/checkout/page.tsx (+13 mas)

## 2026-05-03 (rama `refactor/separar-motor-y-finanzas`)

refactor(orders): separar Motor Logístico vs Reparto Financiero + persistir snapshot inmutable en SubOrder. Schema: SubOrder agrega 5 campos nullable — tripCost, operationalCost, driverPayoutAmount, merchantCommissionRate, merchantCommissionSource. Helper nuevo getEffectiveCommissionWithSource() en merchant-loyalty.ts devuelve {rate, source: OVERRIDE|FIRST_MONTH|TIER|FALLBACK} para audit AAIP/AFIP. Nuevo orquestador chico src/lib/orders/order-totals.ts (buildSubOrderFinancialSnapshot) centraliza el cálculo de los 5 campos persistibles, recibiendo precomputedMerchantRate/Source para evitar query duplicada cuando el endpoint ya consultó. orders/route.ts: validatedGroupFees Map ahora incluye operationalCost por grupo; antes de tx.subOrder.create se llama el snapshot helper y se persisten los 5 campos. payouts.ts: si subOrder.driverPayoutAmount != null para todos los SubOrders del driver en el order, suma esos valores exactos en vez de aproximar con DRIVER_SHARE 0.70. Si alguno es null (orders pre-rama, multi-vendor con drivers mixtos), fallback a la lógica vieja — cero regresión. CLAUDE.md: la sección "Reglas de negocio canónicas" se divide en Motor Logístico (fórmula del viaje, vehículos, zonas, clima, asignación, peso volumétrico, marketplace categorías) y Reparto Financiero (comisiones merchant/seller, costo operativo, share driver, puntos, publicidad, protocolo efectivo). Se quita el bonus nocturno 23-07h (no estaba implementado y se decidió no comprometerlo pre-launch). El refactor mayor (unificar delivery.ts + shipping-cost-calculator.ts en un solo orquestador computeOrderTotals que reemplace los 27 archivos consumidores) queda para mes 1 post-launch — esta rama hace el cambio mínimo viable que cierra el problema de plata real (sobrepago al driver con subtotales altos).

**Archivos:** .claude/CLAUDE.md, prisma/schema.prisma, src/app/api/orders/route.ts, src/lib/merchant-loyalty.ts, src/lib/orders/order-totals.ts, src/lib/payouts.ts

## 2026-05-03 (rama `feat/bloqueo-comercio-cerrado`)

feat(store): bloqueo de compras cuando el comercio está cerrado (pausa manual o fuera de horario). Antes los componentes ProductCard / HomeProductCard / products/ProductCard solo chequeaban merchant.isOpen crudo (pausa manual) y no respetaban scheduleJson + horario actual + timezone Ushuaia, así que un cliente podía agregar al carrito en una tienda fuera de horario y el server rechazaba después con error tarde. Ahora el chequeo se hace al render con checkMerchantSchedule (que ya existía) + nuevo getMerchantOpenViewModel que devuelve {isCurrentlyOpen, nextOpenLabel}. Cambios: (1) Helper getMerchantOpenViewModel en src/lib/merchant-schedule.ts — toma merchant {isOpen, scheduleJson} y devuelve estado real + label "Abre 18:00" o "Abre Mañana 09:00". (2) Las 3 ProductCard refactorizadas para aceptar isCurrentlyOpen + nextOpenLabel opcionales; cuando vienen los respetan, sino fallback a isOpen legacy. Botón "+" deshabilitado en gris si la tienda está cerrada + badge con label de apertura. (3) Páginas (store)/page.tsx y (store)/productos/page.tsx enriquecen featured/listado con el viewModel antes de pasarlos al card. (4) Endpoint /api/products/[slug] selecciona scheduleJson y devuelve isCurrentlyOpen + nextOpenLabel calculados. (5) ProductDetailClient computa merchantIsOpen desde el endpoint y muestra banner amarillo "Tienda cerrada — Abre Mañana 09:00" arriba del producto, botones "Agregar al carrito" en gris con texto "Tienda cerrada", chequeo en handleAddToCart con toast.error si intenta forzar. (6) /api/orders POST ya tenía validateMerchantCanReceiveOrders desde antes — defensa server-side final intacta. Lo que NO se tocó: ListingCard del marketplace usa otro sistema (SellerAvailability), CartSidebar warning queda para mes 1 (server ya rechaza checkout con tienda cerrada). UX patrón: alineado con Rappi/PedidosYa/Glovo — ver el producto sí, comprarlo no hasta que abra.

**Archivos:** src/app/(store)/page.tsx, src/app/(store)/productos/[slug]/ProductDetailClient.tsx, src/app/(store)/productos/[slug]/page.tsx, src/app/(store)/productos/page.tsx, src/app/api/products/[slug]/route.ts, src/components/home/HomeProductCard.tsx, src/components/products/ProductCard.tsx, src/components/store/ProductCard.tsx (+1 mas)

## 2026-05-01 (rama `feat/peso-volumen-productos`)

feat(products): peso y volumen real por producto + selector visual Glovo-style + cache global con sugerencia. Schema agrega Product.weightGrams/volumeMl + tabla ProductWeightCache (sha256 nameHash, source SEED/AI/HEURISTIC/MANUAL, hitCount, suggestedVehicle). Helper src/lib/product-weight.ts: cascada EXPLICIT > CATEGORY > FALLBACK + heurística por keywords (litros, kilos, ml, packs, ~25 productos típicos AR). Tipos ProductSize + SIZE_METADATA con 5 categorías visuales (MICRO/SMALL/MEDIUM/LARGE/XL) inspiradas en Glovo/Cabify, cada una con icono lucide, displayName, descripción, ejemplos, peso/volumen interno, vehículo recomendado. UI: SizeSelector.tsx nuevo (5 cards visuales) + NewProductForm/EditProductForm refactorizados para usar SizeSelector como UI principal + toggle "Modo avanzado" para tipear gramos exactos (caso farmacia/seller con productos heterogéneos). Endpoint POST /api/comercios/products/suggest-weight con auth merchant/admin, rate limit 100/h IP, Zod en body, cascada cache→IA(stub)→heurística→null, devuelve suggestedSize mapeando peso a categoría. Flag ENABLE_AI_WEIGHT_SUGGEST=false por default (stub Haiku queda listo para enchufar en mes 2). Server actions createProduct/updateProduct extendidas con Zod. Seed dataset 130+ productos comunes argentinos (bebidas, almacén, lácteos, snacks, comida rápida, helados, limpieza, farmacia, ferretería, indumentaria, mueblería, electro). Script seed idempotente con dry-run + --execute. Decisiones: campos opcionales con fallback (Opción B); UX por categorías visuales (Camino B, votado por 11 roles del consejo). Costo IA pre-launch: $0 (cache semilla cubre productos comunes); cuando se prenda flag con API key real, ~$5/mes estimado con cache lleno. Bug colateral resuelto: actions.ts estaba truncado en develop (toggleMerchantOpen) — reparado.

**Archivos:** prisma/schema.prisma, scripts/seed-data/product-weight-cache.json, scripts/seed-product-weight-cache.ts, src/app/api/comercios/products/suggest-weight/route.ts, src/app/comercios/(protected)/productos/[id]/page.tsx, src/app/comercios/actions.ts, src/components/comercios/EditProductForm.tsx, src/components/comercios/NewProductForm.tsx (+2 mas)

## 2026-04-30 (rama `chore/verificar-nueva-ubicacion`)

chore: validar workflow start.ps1 + finish.ps1 + auto-changelog + push + merge desde C:\dev\moovy tras mudanza del 2026-04-30. Repo movido desde C:\Users\Mauro\Desktop\moovy por bug de OneDrive truncando archivos silenciosamente. Sin cambios funcionales, solo timestamp y registro de la mudanza en PROJECT_STATUS.md.

**Archivos:** PROJECT_STATUS.md

## 2026-04-30 (rama `fix/utf8-encoding-pipeline`)

fix(deploy): pipeline de export usa docker cp (bytes raw UTF-8) en vez de PowerShell `>` que rompia tildes. ISSUE-061. Cambios: finish.ps1 y publish.ps1 ahora hacen `pg_dump -f /tmp/dump.sql` adentro del container y `docker cp` al disco; pull-db.ps1 mismo metodo en remoto via SSH; nuevo scripts/validate-db-encoding.ts (Prisma + regex CP-437/Latin-1) detecta mojibake en Category/Product/Merchant si el dump quedo roto. Antes el redirect > de PowerShell decodificaba bytes UTF-8 de pg_dump con codepage de Windows y escribia UTF-16 LE BOM, corrompiendo Pizzeria/Electronica. Verificado: prod tiene tildes correctas, el bug solo contaminaba database_dump.sql del repo.

**Archivos:** ISSUES.md, PROJECT_STATUS.md, scripts/finish.ps1, scripts/publish.ps1, scripts/pull-db.ps1, scripts/validate-db-encoding.ts

## 2026-04-30 (rama `chore/update-prompts-readme`)

chore: actualizar README de prompts-cowork con prompts vigentes (PROMPT_5/6) y archivar legacy (1-4)

**Archivos:** docs/prompts-cowork/README.md

## 2026-04-29 (rama `chore/cleanup-docs-and-deploy-guide`)

chore(docs): cleanup de docs obsoletos + DEPLOY_GUIA.md nuevo + README reescrito. Fase 1: nuevo DEPLOY_GUIA.md en raiz (267 lineas) que reemplaza al DEPLOY_CHECKLIST.md viejo, cubre setup SSH keys, workflow dry-run+deploy, modos del script, troubleshooting completo de los 8 bugs reales que encontramos durante el rollout (TS errors pre-flight, lock zombie, env vars missing, pg_dump version mismatch, smoke 503 timing, escapes bash anidados, pm2 reload solo moovy, manifest stale post git reset --hard, puerto socket-server real 3004 no 3001, cache browser/cloudflare), rollback con tags git, logs persistentes, checklist mental pre-deploy, y referencias a docs canonicas. Fase 2: limpieza de 22 archivos obsoletos. 8 auditorias (ANALISIS-FINANCIERO, AUDIT_EMAILS, AUDIT_LOGISTICS, AUDIT_PAGOS, MOOVY_Security_Fixes, auditoria-portal-repartidor, auditoria-ux-cro, role-system-audit) + 3 planes (CAMBIOS_COMPARTIDOS_EMAILS, CAMBIOS_COMPARTIDOS_LOGISTICS, PLAN-RIDER-REDESIGN) consolidados en .claude/CHANGELOG-auditorias.md (~70K tokens, no se carga auto, accesible bajo demanda con grep) y borrados de docs/auditorias/ y docs/planes/ (carpetas vaciadas y eliminadas). 5 prompts del sprint inicial (PROMPT_1_INICIAL, PROMPT_2_DIARIO, PROMPT_3_CONSEJO_EXPERTOS, PROMPT_4_UX_COMPLETO, README_FASE_FINAL) borrados — ya cumplieron su funcion, PROMPT_5 (vigente) y PROMPT_6 (go/nogo del lanzamiento) se mantienen. 4 docs sueltos borrados de raiz: SMOKE_TEST.md (reemplazado por checklist en PROMPT_5), SUPPORT_SYSTEM.md (info ya en codigo), DEPLOY_CHECKLIST.md (reemplazado por DEPLOY_GUIA.md), guia_paralelo_con_tus_scripts.md (obsoleto). docs/referencias/PRUEBA-SISTEMA.md y docs/guias/FLUJO-DE-TRABAJO.md (589 lineas del 2026-02-13 sobre 2 devs trabajando en paralelo con Antigravity, scripts inexistentes refresh.ps1 y emergency-reset.ps1, referencia a DEPLOY_CHECKLIST ya borrado) tambien eliminados. entrevista-repartidor-pedidosya.md movido de raiz a docs/referencias/. Fase 3: README.md reescrito (179 lineas) — antes era el default boilerplate de Next.js, ahora describe Moovy real (stack, estructura, setup local, workflow de feature, deploy, links a docs canonicas, reglas de negocio resumidas, marca, troubleshooting). database_dump.sql verificado en .gitignore (linea 46), no se commitea. Beneficios: claridad mental al abrir el repo (lo que ves refleja realidad, sin auditorias de marzo confundiendo), reduccion de ruido en grep y find, single source of truth para deploy en DEPLOY_GUIA.md, README profesional para futuros devs/auditorias. Sin cambios de codigo de la app, solo docs y READMEs. Trade-off: las auditorias historicas siguen disponibles via .claude/CHANGELOG-auditorias.md si alguien las necesita para auditoria legal/AAIP, pero ya no contaminan docs/auditorias/.

**Archivos:** .claude/CHANGELOG-auditorias.md, DEPLOY_CHECKLIST.md, DEPLOY_GUIA.md, README.md, SMOKE_TEST.md, SUPPORT_SYSTEM.md, docs/auditorias/ANALISIS-FINANCIERO-MOOVY.md, docs/auditorias/AUDIT_EMAILS.md (+17 mas)

## 2026-04-29 (rama `fix/devmain-clean-build`)

fix(deploy): rm -rf .next antes de cada build para evitar manifest stale de Next.js 16. Bug detectado en producción real: el endpoint /api/onboarding existía en src/app/api/onboarding/route.ts (77 líneas, archivo correcto en VPS), el build de Next.js incluyó la ruta (route.js, route.js.map, route_client-reference-manifest.js generados en .next/server/app/api/onboarding/), pero la app servía 404 a esa URL incluso después de pm2 reload moovy + pm2 restart moovy --update-env. Causa raíz: Next.js 16 con Turbopack hace builds incrementales — si detecta que un archivo "no cambió", lo skipea para ahorrar tiempo. Cuando el deploy hace git fetch + reset --hard, los archivos se actualizan pero el cache de .next/ queda con un manifest viejo que no incluye la nueva ruta. Resultado: rutas existentes en disco y compiladas en .next/server/app/ pero NO registradas en el manifest interno que mapea URLs a route handlers. La única forma de garantizar que el manifest está sincronizado es regenerar todo el .next/ desde cero. Fix: agregar rm -rf .next antes de npm run build en los 2 lugares donde se hace deploy/build remoto: scripts/devmain.ps1 (paso 12 deploy en VPS) y scripts/rollback.ps1 (rollback de código). Trade-off: build limpio tarda ~30-60 segundos más que build incremental, deploy total pasa de ~40-60s a ~90-120s. Vale la pena: confiabilidad > velocidad para deploys de producción que manejan dinero. Mismo patrón que usa Vercel/Netlify/Railway internamente — siempre arrancan de cero. Sin parche, sin cache mágico, deterministic. Verificado: el rebuild manual ejecutado hoy (rm -rf .next && npm run build && pm2 restart moovy) resolvió el 404 instantáneamente, /api/onboarding ahora responde 401 Unauthorized correctamente tanto en localhost:3002 como vía Nginx en https://somosmoovy.com. Lecciones: (a) los builds incrementales son una footgun en deploys de prod, especialmente cuando se combinan con git reset --hard que cambia archivos pero no invalida cache; (b) la "solución profesional definitiva" para deploy reproducible es siempre arrancar el build desde estado limpio.

**Archivos:** scripts/devmain.ps1, scripts/rollback.ps1

## 2026-04-29 (rama `fix/health-types`)

fix(health): tipo de checks acepta url + propiedades arbitrarias para spread del socket-server. Bug TS atrapado por el pre-flight del nuevo devmain.ps1: TS2353 "Object literal may only specify known properties, and url does not exist in type". El tipo Record<string, { status, latencyMs, error }> no permitía agregar url ni hacer ...spread del response del socket-server (que devuelve connectedDrivers, crons, status, uptime). Fix: tipo extendido a Record<string, { status, latencyMs?, error?, url?, [k: string]: unknown }>. El [k: string]: unknown permite el spread del JSON del socket-server sin romper TS. Verificación: npx tsc --noEmit --skipLibCheck con tsconfig completo del proyecto pasa limpio (el check sobre archivo aislado falla por path aliases pero eso es expected). Atrapado por el flujo defensivo del devmain.ps1 antes del deploy real, exactamente lo que el sistema tenía que hacer.

**Archivos:** src/app/api/health/route.ts

## 2026-04-29 (rama `fix/devmain-smoke-socket-pm2`)

fix(deploy): smoke retry + SQL toggles via stdin + pm2 reload all + /api/health puerto interno + limpieza. Bug 1: smoke test un solo intento causaba falsos positivos cuando Next.js+Turbopack tardaba en estar listo — ahora 5 intentos con backoff 5/15/30/50/80s, si cualquier intento responde 200 healthOk = true. Bug 2: SQL maintenance toggle docker exec -c con escapes anidados PowerShell -> SSH -> bash -> docker -> psql se rompía con "unexpected EOF" — ahora pipe via stdin con docker exec -i, SQL crudo viaja sin escapes nested (5 lugares: devmain ON x1 + OFF x2, rollback ON x1 + OFF x1). Bug 3: limpieza .claude/test-write-check.txt residual de testing del filesystem mount entre VM y Windows. Bug 4: pm2 reload moovy solo reiniciaba app Next.js, no los otros 5 procesos pm2 del VPS (mjobs, moovy-socket que llevaba 15 dias sin reload, og-deco, vora-web, vsolutions) — ahora pm2 reload all --update-env en los 3 lugares (devmain command + 2 en rollback), beneficio adicional --update-env recarga env vars del .env. Bug 5 (descubierto en testing): /api/health hacia fetch a NEXT_PUBLIC_SOCKET_URL que en VPS apunta a https://somosmoovy.com (URL pública para clientes browser) — server-to-server eso pasa por Nginx y llega a Next.js (no al socket), 404. El socket-server real escucha en localhost:3004 (SOCKET_PORT=3004 en .env, confirmado con ss -tlnp PID 3072708 puerto 3004). Fix: nueva prioridad de selección de URL en /api/health — SOCKET_INTERNAL_URL > http://localhost:$SOCKET_PORT > NEXT_PUBLIC_SOCKET_URL > http://localhost:3001 fallback. Ahora el chequeo va a localhost:3004 directo al socket-server. Bonus: incluir url usado en el JSON de respuesta para debug. Diagnóstico completo del path: VPS hostea 4 instancias de Next.js (puertos 3000-3003 = moovy + 3 apps de otros proyectos), socket-server en 3004, Postgres docker en 3005. Lecciones (a) NEXT_PUBLIC_* es para clientes browser, no para fetch server-to-server (b) cuando un VPS multi-tenant tiene varias apps Next.js, los defaults de puerto del código son trampas (c) los smoke tests funcionan: detectaron config drift entre .env y código del endpoint que llevaba semanas oculto. Sin cambios en lógica de la app, solo scripts PowerShell + 1 endpoint health. TS clean en src/app/api/health/route.ts.

**Archivos:** scripts/devmain.ps1, scripts/rollback.ps1, src/app/api/health/route.ts

## 2026-04-29 (rama `fix/devmain-smoke-and-escapes`)

fix(deploy): smoke test con retry/backoff + SQL toggles sin escapes anidados + limpiar test-write-check.txt. Bug 1 (smoke test paso 13): un solo intento con 5s de espera causaba falsos positivos cuando Next.js+Turbopack tardaba en estar listo para servir trafico real (deploy real del 2026-04-28 reporto DEPLOY CON ERRORES aunque la app estaba 100% OK confirmado por Mauro en browser). Fix: bucle de 5 intentos con backoff acumulado de 5s/15s/30s/50s/80s; si cualquier intento responde 200 cortamos y marcamos healthOk. pm2 jlist solo se chequea si healthOk pasa primero. Bug 2 (SQL maintenance toggle pasos 10 y 14): docker exec moovy-db psql -c "UPDATE \"StoreSettings\"..." con escapes anidados PowerShell -> SSH -> bash -> docker -> psql se rompia con "unexpected EOF while looking for matching" en bash. Las llaves \`\" eran interpretadas como caracter literal por PowerShell antes de pasarlo a SSH. Fix: pipe via stdin con docker exec -i; SQL viaja como string crudo por stdin sin pasar por -c, cero escapes nested. Patron aplicado a 5 lugares: devmain.ps1 paso 10 ON x1 + paso 14 OFF x2 + rollback.ps1 ON x1 + OFF x1. Bug 3 (limpieza): borrado .claude/test-write-check.txt que se colo en una sesion anterior de testing del filesystem mount entre VM y Windows. TS check no aplica (solo cambios PowerShell). Atrapado por deploy real exitoso en lo funcional pero con falso REPORTE DE ERRORES en consola — los 3 fixes se hacen para que el proximo deploy real reporte OK limpio sin errores en pantalla.

**Archivos:** .claude/test-write-check.txt, scripts/devmain.ps1, scripts/rollback.ps1

## 2026-04-28 (rama `fix/devmain-pg-dump-docker`)

fix(deploy): pg_dump y psql usan docker exec en VPS para evitar mismatch de versiones. Bug detectado en deploy real (paso 9 backup pre-deploy): pg_dump del sistema operativo del VPS es version 14.22 pero el server de Postgres es 15.4, pg_dump rechaza dump por mismatch ("aborting because of server version mismatch"). Mismo problema potencial con psql (mas tolerante pero menos predecible). Fix: ejecutar todos los comandos de Postgres desde adentro del container "moovy-db" con docker exec, donde la version del cliente coincide con el server. Mismo patron que ya usa scripts/finish.ps1 para el dump local. Cambios en devmain.ps1 (5 lugares): paso 9 backup pre-deploy (pg_dump), paso 10 maintenance ON (psql), paso 14 maintenance OFF x2 (psql), paso 12 modo CleanProd DROP SCHEMA (psql). Cambios en rollback.ps1 (4 lugares): pre-rollback backup (pg_dump), restore desde backup (psql DROP + psql < file con docker exec -i para stdin), maintenance ON (psql), maintenance OFF (psql). Verificacion: docker ps en VPS confirmo container "moovy-db" presente. Cero referencias remanentes a "pg_dump -h 127.0.0.1" ni "psql -h 127.0.0.1" en ambos scripts. El fix elimina la dependencia de qué version del cliente Postgres tenga instalada el host del VPS — todo se ejecuta desde el container donde la version coincide siempre por construccion. Lecciones: cuando Postgres corre en Docker pero el cliente en el host, deploy scripts deben usar docker exec para evitar version drift entre cliente y server. Patron consistente: si el server esta en container, los clientes tambien.

**Archivos:** scripts/devmain.ps1, scripts/rollback.ps1

## 2026-04-28 (rama `fix/devmain-bash-escapes`)

fix(deploy): arreglar escapes bash y check de env vars en devmain.ps1. Bug 1 (paso 6 lock check): el comando ssh tenia backticks (`$(...)`) y comillas escapadas (\"...\") que se rompian al pasar de PowerShell -> SSH -> bash, causando "unexpected EOF while looking for matching" en stderr. Reescrito como string plano dentro de bash -c '...' con comillas simples, sin escapes multinivel; logica equivalente: si /tmp/moovy-deploy.lock existe y tiene <30min => LOCKED, si tiene >=30min => STALE (zombie, limpiar), si no existe => NONE. Bug 2 (paso 7 env vars): el check exigia 6 env vars exactos pero NextAuth v5 acepta indistintamente AUTH_SECRET o NEXTAUTH_SECRET — VPS con setup viejo solo tiene uno y el script abortaba con "5/6 env vars criticos". Reescrito con lista de hard required (DATABASE_URL, CRON_SECRET, MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET, los 4 obligatorios) + lista de alternativos (AUTH_SECRET o NEXTAUTH_SECRET, al menos uno). Aborta solo si falta un hard o si no hay ningun alternativo. Output mas claro: lista cuales faltan en vez de dar un conteo opaco. Sin cambios funcionales en el resto del script. Atrapado por dry-run real con SSH keys ya configuradas (paso 5 healthcheck pasaba por primera vez). Lecciones: (a) escapes anidados PowerShell-SSH-bash son frutilla podrida, mejor escribir scripts bash inline simples sin variables intermedias del shell remoto; (b) checks de env vars deben respetar nombres alternativos del framework subyacente (NextAuth, Prisma, etc.).

**Archivos:** scripts/devmain.ps1

## 2026-04-28 (rama `chore/finish-auto-changelog`)

chore(deploy): finish.ps1 elimina prompt interactivo de docs y auto-genera entry en CHANGELOG.md. Antes el script preguntaba (s/n) si queres actualizar docs cuando detectaba cambios en src/ o prisma/, lo que era friccion innecesaria y riesgo de apretar mal (default era s, abortaba el cierre). Ahora flow automatico: detecta archivos staged, genera entry markdown con header "## YYYY-MM-DD (rama nombre)" + mensaje del commit + lista de archivos (primeros 8 + "(+N mas)" si hay mas), inserta en CHANGELOG.md justo despues del separador "---" del header, hace git add CHANGELOG.md, y commitea todo junto. Sin preguntas. Param -NoChangelog para skipear en ramas basura. Recordatorios NO BLOQUEANTES al final del cierre: si commit message menciona ISSUE-### sugiere mover el issue de abierto a resuelto en ISSUES.md; si tocaste archivos canonicos (schema.prisma, roles.ts, auth.ts, email-registry.ts, proxy.ts) sugiere verificar CLAUDE.md por decision nueva o regla acumulada #29+. Solo print, no abortan, no preguntan. Esto cumple regla nueva de Mauro: el flow normal de finish.ps1 debe ser zero-decision para no introducir errores humanos. CHANGELOG se mantiene actualizado solo. Si una rama necesita updates manuales en CLAUDE.md o ISSUES.md, lo hacemos cuando podemos en otra rama, sin bloquear el cierre actual.

**Archivos:** scripts/finish.ps1

## 2026-04-25 (sprint pre-launch en curso — 6 ramas chicas cerradas en una jornada después del deploy + DB clean + onboarding de comercio/driver. **Contexto**: post-deploy del 2026-04-24, Mauro empezó a testear E2E en producción y detectó múltiples cosas para pulir. Se trabajó con el patrón "una rama chica por feature, script de validación obligatorio, build local antes del deploy". **Ramas cerradas hoy en orden cronológico**: (1) `auto-refresh-rol-aprobado` — JWT del user se refresca solo cuando admin aprueba su comercio/driver/seller, eliminó la fricción de "logout + login para entrar al panel post-aprobación". Socket event `roles_updated` emitido desde 6 puntos (4 endpoints approve/reject merchant+driver + 2 helpers de auto-activación por docs) + nuevo componente `RoleUpdateListener` montado en `Providers.tsx` que escucha el event, dispara `useSession.update({refreshRoles:true})` (que el JWT callback en auth.ts:230 ya soportaba desde el rediseño de roles del 2026-04-10), muestra toast diferenciado por tono y navega al portal después de 1.5s. Helper canónico `src/lib/role-change-notify.ts` con `emitRoleUpdate({userId, role, action, message, portalUrl})`. (2) `fix/comercio-onboarding-completo` — 4 cambios relacionados al onboarding: (a) banner azul "Podés completar la documentación más tarde" en `/comercio/registro` paso 3 con lista de los 7 requisitos para visibilidad pública, (b) `OnboardingChecklist` auto-hide cuando `canOpenStore=true` (antes esperaba `isComplete` que requería MP recomendado, prácticamente nunca se ocultaba), (c) aprobación OPS distingue DIGITAL vs PHYSICAL — schema agrega `<doc>ApprovalSource` + `<doc>ApprovalNote` para los 5 docs Merchant + 8 docs Driver; cuando admin aprueba PHYSICAL exige nota de mín 5 chars (auditoría AAIP); el doc queda APPROVED sin URL (admin recibió el papel/email/whatsapp), (d) logo obligatorio: `approveMerchantTransition` y `approveDriverTransition` validan `Merchant.image` / `User.image` antes de marcar APPROVED, throw con `code: LOGO_MISSING` / `PHOTO_MISSING` que los endpoints catchean → 400. Auto-activación por docs respeta el bloqueo (último doc se aprueba pero la transición global queda PENDING). 26 campos nuevos en schema. (3) `ops-upload-logo-merchant` — hotfix de la rama anterior + dos extras del mismo dominio: (a) endpoint nuevo `PATCH /api/admin/merchants/[id]/logo` + sub-componente `MerchantLogoAdmin` en `/ops/usuarios/[id]` para que admin suba el logo en nombre del merchant (caso real: comercio entrega logo en USB/WhatsApp), reusa `<ImageUpload>` existente, audita con action `MERCHANT_LOGO_UPDATED_BY_ADMIN`, (b) **bug crítico de UX en `/api/merchant/onboarding`**: chequeaba `Boolean(merchant.cuit)` para `hasCuit` etc., excluyendo aprobaciones físicas. Cambiado a `merchant.cuitStatus === "APPROVED"` para los 5 docs. Sin esto, los merchants veían "Te falta CUIT" indefinidamente aunque el admin ya hubiera aprobado físicamente, (c) UI OPS muestra caja amarilla "Aprobación física — nota del admin" cuando `approvalSource === PHYSICAL` (recordatorio para auditoría) + chip dice "APPROVED · físico"; UI Merchant en `/comercios/configuracion` muestra banner verde "Aprobado por administrador — recibimos este documento fuera del sistema" en lugar del upload + sin botón "Solicitar cambio" (no hay nada que reemplazar — el original vive en oficina). Endpoint admin `users-unified/[id]` extendido para devolver los nuevos campos source/note del merchant. (4) `wording-publico-no-ops` — reemplazado "OPS" por "el equipo de Moovy" en TODOS los textos visibles al usuario. OPS es jerga interna y exponerla erosiona la marca + confunde al user. Variantes según contexto natural ("revisado por", "la va a resolver", "Respuesta del equipo:" en historiales, "Comentario del equipo:" en emails). 5 archivos modificados (12 reemplazos): `SettingsForm.tsx` (7 toasts/textos del merchant), `ProfileView.tsx` (5 toasts/textos del driver), 2 endpoints `change-request/route.ts` (mensajes de error 409), `email.ts` (2 emails de change request resolved). NO se tocó: comentarios de código (internos), `src/app/ops/**`, `src/components/ops/**`, `src/lib/email-admin-ops.ts`, paths URL `/ops/...`. Script `scripts/validate-no-ops-public.ts` con regex que filtra comentarios y reporta cualquier mención a "OPS" en strings de texto user-facing. (5) `fix/driver-profile-decrypt-cuit` — bug visible: el campo CUIT/CUIL del panel del driver mostraba el ciphertext hex `9dadd36061412e5816f0a4ed` en lugar del valor legible. Causa: `GET /api/driver/profile` devolvía `driver.cuit` directo desde Prisma sin pasar por `decryptDriverData()`. Fix: 1 import + wrap del response. **Bug latente adicional encontrado en la auditoría**: `POST /api/driver/documents/update` guardaba el CUIT en DB sin cifrar — cualquier driver que actualizaba su CUIT desde el panel quedaba con plaintext en `Driver.cuit`, violando convención AAIP. Resuelto en la misma rama agregando `encryptDriverData(updateData)` antes del `prisma.driver.update`. `decrypt()` es defensivo (devuelve plaintext as-is si no tiene formato cifrado) y `encryptIfNeeded` es idempotente — por eso no se requiere migración de datos. (6) `fix/modales-aprobacion-docs` — bug visual: el flujo de aprobación de doc usaba 3 pop-ups nativos del browser ("localhost:3000 says") — feos, sin marca, default engañoso. Nuevo componente `src/components/ops/DocApprovalModal.tsx` con diseño Moovy: 2 cards radio explícitos (Digital/Físico) con icono y descripción, textarea condicional con contador live (5-500 chars), botón Aprobar deshabilitado hasta validación OK, focus management, cierre con Escape, animación fade-in zoom-in. Handlers `handleApproveDocument` (merchant + driver) refactorizados: antes ~70 líneas duplicadas de window.confirm + window.prompt + confirm() del store + fetch; ahora ~30 líneas — cada handler solo abre el modal con state local + un único callback `submitApprovalDecision` compartido entre merchant y driver dispara el fetch al endpoint correspondiente según el `entity`. Eliminados todos los `window.confirm/prompt` del flujo de approve doc. **Sprint stats**: 6 ramas mergeadas a develop, ~30 archivos tocados (15 nuevos + 15 modificados), 6 scripts de validación nuevos en `scripts/validate-*.ts`, 26 campos nuevos en schema (`prisma db push` corrió en localhost), TS clean en cada rama, build local pasó antes de cada deploy. **Tasks pendientes para próxima sesión**: rama #3 del plan de ramas (`fix/auth-bloqueo-y-reset` — warning intentos restantes + fix botón desbloquear cuenta + auditoría reset password). Después: `fix/producto-multifoto-carousel` (bug visible: producto con 3+ fotos solo muestra la primera), `feat/ops-crear-cuentas` (admin crea cuentas buyer/driver/seller). Post-launch: `feat/driver-bank-mp` (Driver no tiene campos bancarios en schema), `feat/propinas-driver`, fix encoding UTF-8 en deploys (task #115 + auto-memory). **Reglas nuevas del sprint**: (#19) cualquier endpoint admin que cambie el set de roles derivados de un usuario DEBE llamar `emitRoleUpdate` al final del happy path. (#20) cuando un campo del modelo tiene un "status" derivado por workflow de aprobación, los chequeos downstream (checklist, listados, badges) DEBEN basarse en el status, NUNCA en si el campo de origen tiene valor — si no, las aprobaciones manuales/físicas/admin-en-nombre-de quedan invisibles. (#21) cualquier doc con auditoría legal (AAIP/AFIP/municipal) DEBE permitir aprobación PHYSICAL con nota libre — algunos comercios entregan papeles en oficina y forzar digitalización es fricción innecesaria; la nota es la prueba en caso de auditoría externa. (#22) cualquier string que vaya a renderizarse a un comercio/repartidor/comprador/vendedor (toasts, banners, emails, push) NUNCA debe usar "OPS" — siempre "el equipo de Moovy" o variante natural. (#23) cualquier endpoint que (a) lea de un modelo con campos cifrados Y devuelva esos campos al frontend del propio dueño DEBE aplicar el helper `decrypt<Modelo>Data` antes del response; (b) escriba en uno de esos campos DEBE aplicar `encrypt<Modelo>Data` antes del Prisma update. (#24) cualquier nuevo flujo de OPS que requiera input del admin con validación NO debe usar `window.confirm/window.prompt` nativos — crear un componente modal específico siguiendo el patrón visual de `ConfirmModal` (backdrop blur, card blanca, rojo MOOVY en CTA, focus management). Los pop-ups nativos rompen completamente la sensación de app de marca.)

## 2026-04-24 (rama `chore/prelaunch-polish-pwa-sound-email` RESUELTA — 3 pulidos post-audit UX + limpieza de deuda técnica en una sola pasada. **Contexto**: después de cerrar las 5 ramas grandes del día, quedaban 3 cabos sueltos documentados: (a) PWA prompt solo montado en `(store)/layout.tsx` — merchants/drivers/vendedores que entraban directo a su portal no lo veían, (b) los helpers `playAlertBeep` y `triggerVibration` del hook `useRiderPrefs` estaban exportados pero sin consumidor real — los toggles de Config del driver servían solo como preview, no disparaban cuando llegaba una oferta real, (c) drift crítico entre el registry de emails y el código: el admin editaba templates en `/ops/emails` que apuntan a las versiones P0 de `src/lib/email-p0.ts` (`sendMerchantApprovedEmail`, `sendMerchantRejectedEmail`, `sendDriverRejectedEmail`), pero 4 endpoints del admin disparaban las versiones legacy de `src/lib/email.ts` (`sendMerchantApprovalEmail`, `sendMerchantRejectionEmail`, `sendDriverRejectionEmail`) — el admin nunca veía sus cambios porque eran copy distintos. **Cambios**: (1) **PWA prompt en 3 layouts más**: `src/app/repartidor/(protected)/layout.tsx` + `src/app/comercios/(protected)/layout.tsx` + `src/app/vendedor/(protected)/layout.tsx` ahora montan `PWAInstallPrompt`. El componente es self-gated por `display-mode: standalone` + `localStorage.moovy_pwa_prompt_seen`, entonces cada user ve el prompt UNA sola vez — no importa por cuál layout entre primero. En iPhone pasa a aparecer desde el driver/merchant también, que era crítico para que reciban push notifications de pedidos entrantes. (2) **Feedback UX al llegar oferta**: `src/hooks/useDriverSocket.ts` en el handler del evento `orden_pendiente` ahora llama `loadRiderPrefs()` + `playAlertBeep()` si `soundAlerts === true` + `triggerVibration([200, 100, 200])` (patrón pulso-pausa-pulso) si `vibration === true`. Los helpers leen localStorage directo en cada invocación para evitar closures stale (el socket listener se crea una sola vez pero el user puede cambiar la pref en cualquier momento). Try/catch defensivo para que un fallo en el feedback no bloquee el procesamiento del evento crítico. En iOS la vibración falla silenciosamente (Apple nunca implementó Vibration API); en todos los Chrome/Firefox funciona. (3) **Consolidación de 3 emails legacy duplicados**: eliminadas las funciones `sendMerchantApprovalEmail`, `sendMerchantRejectionEmail`, `sendDriverRejectionEmail` de `src/lib/email.ts`. Dejado un comentario con la razón para futuros devs. Migrados 4 endpoints que las usaban: `/api/admin/merchants/[id]/approve/route.ts` + `/api/admin/merchants/[id]/reject/route.ts` + `/api/admin/merchants/[id]/documents/approve/route.ts` (en el path auto-activated) + `/api/admin/drivers/[id]/reject/route.ts`. Las versiones P0 requieren shape `{email, businessName, contactName, reason?}` en vez de parámetros posicionales — los endpoints ya tienen el `owner.name` en el select de Prisma, mapeo trivial. Resultado: lo que el admin edita en `/ops/emails` es EXACTAMENTE lo que recibe el merchant/driver cuando se aprueba/rechaza. **Archivos modificados (9)**: 3 layouts (driver/comercios/vendedor), `useDriverSocket.ts`, `email.ts` (3 funciones eliminadas), 4 endpoints admin. **Archivos nuevos**: 0. **TS clean** 0 errores nuevos. **Bug adyacente detectado + fixeado**: al editar el layout driver, el Edit tool introdujo null bytes (mismo patrón pre-existente del byte null documentado en email-registry.ts). Limpiado con `tr -d '\0'` antes del TS check. **Regla nueva #17**: los endpoints del admin que disparan emails transaccionales DEBEN usar las versiones registradas en `EMAIL_REGISTRY`. Si hay dos versiones del mismo email (legacy vs nueva), la legacy debe eliminarse y TODOS los callers migrar a la nueva — si no, el preview del panel OPS miente. **Regla nueva #18**: todo nuevo layout protegido por rol DEBE montar `PWAInstallPrompt` al final. Los users de Moovy pueden entrar a su portal directo desde el login sin pasar por la tienda, y sin el prompt no aprenden a instalar la PWA.)

## 2026-04-24 (rama `fix/driver-settings-pwa` RESUELTA — driver settings persistentes + batería iOS fallback + tutorial PWA por plataforma. **Contexto**: Mauro probó el panel de configuración del driver y detectó que "Modo claro" no se aplicaba al recargar (solo al click), los toggles sonido/vibración no tenían consumidor, el chip de batería en iPhone mostraba solo "—" sin explicación, y al registrarse no había guía para instalar Moovy como PWA (crítico en iPhone: sin instalar no llegan push notifications). **Cambios**: (1) Nuevo hook `src/hooks/useRiderPrefs.ts` que centraliza prefs (theme, mapsApp, soundAlerts, vibration, batteryThreshold, autoDisconnectMinutes) + expone `loadRiderPrefs()`, `applyThemeToDom(mode)`, `playAlertBeep()` (Web Audio API, oscillator 880Hz A5 con gain ramp — sin archivo audio), `triggerVibration(pattern)` (wrapea navigator.vibrate con try/catch, iOS falla silencioso), y el hook `useRiderPrefs()` con `prefs`, `updatePref`, `playSoundIfEnabled`, `vibrateIfEnabled` (los "IfEnabled" leen localStorage directo para evitar closures stale). (2) Nuevo componente `src/components/rider/RiderPrefsInitializer.tsx` — effect-only, aplica tema persistido on mount. Montado en `src/app/repartidor/(protected)/layout.tsx`. Resuelve el bug "modo claro no persiste". (3) `src/components/rider/views/SettingsView.tsx` — preview inmediato al prender toggles: `soundAlerts=true` dispara `playAlertBeep()` al toque, `vibration=true` dispara `triggerVibration([100,50,100])`. El driver ve/siente al instante que el toggle funciona. (4) `src/app/repartidor/(protected)/dashboard/page.tsx` — chip batería ahora muestra "No disp." + tooltip explicativo cuando `!battery.supported` (iOS). Antes: "—" sin contexto. (5) Nuevo componente `src/components/onboarding/PWAInstallPrompt.tsx` — modal con detección de plataforma (iOS, Android Chrome, Desktop, other) via userAgent. Self-gated por `display-mode: standalone` + `localStorage.moovy_pwa_prompt_seen`. En iOS muestra pasos textuales "Compartir → Agregar a inicio → Agregar" + warning destacado sobre que sin PWA no hay push. En Android Chrome usa `beforeinstallprompt` event nativo para botón "Instalar" con UX del browser. Delay 3s antes de aparecer. Montado en `src/app/(store)/layout.tsx` junto a BuyerOnboardingTour y CookieBanner. **Archivos nuevos (3)**: `src/hooks/useRiderPrefs.ts`, `src/components/rider/RiderPrefsInitializer.tsx`, `src/components/onboarding/PWAInstallPrompt.tsx`. **Archivos modificados (4)**: layout driver (monta initializer), dashboard driver (batería iOS label), SettingsView (preview), (store) layout (monta PWA prompt). **TS clean** 0 errores nuevos. **Limitaciones documentadas**: (a) iOS cualquier browser = WebKit. Battery API, vibration, push sin PWA instalada no funcionan — Apple. (b) PWA prompt solo en (store)/layout.tsx — merchant/driver que van directo a su portal no lo ven hasta navegar al store (pendiente montar en los 4 layouts). (c) `playSoundIfEnabled` y `vibrateIfEnabled` exportados pero solo consumidos desde SettingsView preview — el flow "new offer de pedido al driver" todavía no los llama (pendiente cablear al socket listener). **Regla nueva #16**: toda preferencia de usuario en localStorage DEBE (a) hook centralizado con helpers especializados, (b) Initializer component que aplica on mount (no depender del toggle), (c) feedback inmediato al activar para que el user confirme que funciona.)

## 2026-04-24 (rama `fix/merchant-onboarding-polish` RESUELTA — 3 pulidos UX del merchant pre-launch. **Contexto**: post-testeo Mauro pidió que los horarios del merchant arranquen TODOS cerrados por default (no asumir horario genérico — cada comercio decide), que el checklist "Requisitos Obligatorios 7/7" del dashboard del merchant sea menos invasivo visualmente (antes: progress bar gigante + lista de 9 items desplegada), y que verifique que la tienda no aparezca públicamente hasta estar APPROVED (gate de seguridad). **Cambios**: (1) `DEFAULT_MERCHANT_SCHEDULE` en `src/lib/merchant-schedule.ts` ahora tiene los 7 días = null. Antes: lunes-viernes 9-21 + sábado 10-14 + domingo cerrado. Cualquier merchant sin scheduleJson queda cerrado automáticamente, forzando configuración explícita. Impacto colateral: merchants aprobados que no hayan configurado schedule antes del deploy quedan cerrados — el onboarding checklist los agarra porque `hasSchedule` ya era requisito obligatorio. (2) `src/app/comercios/(protected)/OnboardingChecklist.tsx` rediseñado de lista full a banner compacto: 1 línea con ícono + "Te faltan X pasos para activar tu tienda" + subtítulo con "Próximo: <primer paso pendiente>" + botón rojo "Continuar" (deep-link al primer step faltante) + toggle chevron para expandir a lista completa. Mobile-first: botón Continuar va abajo como full-width en pantallas chicas. (3) `src/app/(store)/tiendas/page.tsx` y `src/app/(store)/page.tsx` (home) ahora filtran por `approvalStatus: "APPROVED"` además de `isActive: true`. Defense in depth: un merchant PENDING o REJECTED jamás aparece en listados públicos aunque por drift DB tenga `isActive: true` mal seteado. **Archivos modificados (4)**: `src/lib/merchant-schedule.ts`, `src/app/comercios/(protected)/OnboardingChecklist.tsx`, `src/app/(store)/tiendas/page.tsx`, `src/app/(store)/page.tsx`. **TS clean** 0 errores nuevos. **Regla nueva #14**: todo listado público de actores (merchants, drivers, sellers) DEBE combinar `isActive` + `approvalStatus === "APPROVED"` en el where. Confiar solo en `isActive` deja superficie de drift. **Regla nueva #15**: los defaults del sistema deben ser conservadores — si un merchant no configuró algo crítico (horario, dirección, docs), el default debe ser "NO operar" en vez de "operar con un genérico". El genérico oculta problemas; el default cerrado los fuerza a explicitarse.)

## 2026-04-24 (rama `feat/ops-crons-panel` RESUELTA — panel de monitoreo de crons + migración sistémica de 19 endpoints driver API para resolver bug de JWT stale, en una sola pasada. **Contexto**: Mauro reportó que al entrar a `/repartidor/ganancias` el backend respondía 403. El endpoint `/api/driver/earnings` usaba el patrón legacy `hasAnyRole(session, ["DRIVER", "ADMIN"])` que lee el JWT `roles[]`; si el user activó su rol DRIVER después del login (o por cualquier drift del token), el JWT no tiene "DRIVER" en `roles[]` y tira 403 aunque en DB el Driver esté activo. El bug histórico ya había sido fixeado en `proxy.ts` el 2026-04-15 (el middleware dejó de chequear rol para `/repartidor/*` porque el JWT está stale) pero los 20 endpoints API nunca fueron migrados al mismo criterio. **Auditoría**: grep de `hasAnyRole.*DRIVER` detectó el patrón repetido en 20 archivos del portal driver + 2 endpoints generales en `/api/orders`. Es deuda técnica heredada de la refactorización del 2026-04-10 ("Los roles NO se guardan, se DERIVAN"). **Scope entregado en una rama**: (1) **Panel /ops/crons** — nuevo helper-free panel de monitoreo. Endpoint `GET /api/admin/crons` con filtros por jobName + rango de fechas + paginación 50, devuelve `{ health, registered, runs, total }`. Página `src/app/ops/(protected)/crons/page.tsx` con grid arriba de tarjetas por cron (status chip color-coded healthy/stale/failing/never-ran + última corrida + error si hay + detección de crons "legacy" con runs en DB pero ya no en CRON_EXPECTATIONS) + tabla histórica abajo con columnas Cron/Inicio/Duración/Items/Resultado, mobile cards. Auto-refresh cada 30s condicionado a `document.visibilityState === "visible"` (ahorra queries). Nav item "Crons" agregado a `OpsSidebar` sección Sistema con icono `Activity`. **Dashboard fix**: el alert de cron en `/ops/dashboard` tenía `href: "/ops/configuracion-logistica"` hardcodeado que llevaba a Motor Logístico (bug). Cambiado a `href: /ops/crons?jobName=<cron>` con deep-link al panel nuevo filtrado por el cron específico. (2) **Helper canónico para driver API auth** — nuevo `src/lib/driver-auth.ts` exporta `requireDriverApi(options?: { allowAdmin?: boolean })`. Consulta `prisma.driver.findUnique({ where: { userId } })` (source of truth, alineado con `computeUserAccess` del layout protegido). Retorna `NextResponse` con 401/403 o `{ userId, driver, isAdmin }`. Cuando `allowAdmin: true`, un admin sin Driver propio pasa (driver puede ser null). Uso: `const authResult = await requireDriverApi({ allowAdmin: true }); if (authResult instanceof NextResponse) return authResult; const { driver } = authResult;`. (3) **Migración de 19 endpoints** reemplazando legacy `auth() + session check + hasAnyRole + findUnique driver` por una sola línea del helper: `src/app/api/driver/earnings/route.ts` (piloto), `orders/[id]/{verify-pickup-pin,verify-delivery-pin,status,reject,claim,accept}/route.ts`, `sub-orders/[id]/{verify-pickup-pin,verify-delivery-pin}/route.ts`, `toggle-status/route.ts`, `status/route.ts` (solo PUT; GET no tenía hasAnyRole), `orders/route.ts`, `orders/pending/route.ts`, `shift-summary/route.ts`, `location/route.ts` (PUT + GET), `location/history/route.ts`, `documents/change-request/route.ts` (POST + GET), `documents/update/route.ts`, `api/orders/[id]/accept/route.ts`. Ajustes específicos: `driver/orders/[id]/status/route.ts` agregó optional chaining + guard para admin override path (driver puede ser null); `documents/change-request/route.ts` POST mantiene un findUnique adicional porque necesita select específico de 8 status fields. **Endpoint skippeado**: `src/app/api/orders/[id]/route.ts` PATCH acepta ADMIN/MERCHANT/DRIVER (3 roles) — fuera del scope del helper driver-only, se mantiene el legacy `hasAnyRole`. **Archivos nuevos (3)**: `src/lib/driver-auth.ts`, `src/app/api/admin/crons/route.ts`, `src/app/ops/(protected)/crons/page.tsx`. **Archivos modificados (22)**: los 19 endpoints migrados + `src/app/ops/(protected)/dashboard/page.tsx` (href del alert) + `src/components/ops/OpsSidebar.tsx` (nav item Crons) + `src/lib/driver-auth.ts` (no, ese es nuevo — el helper). **TS clean**: 0 errores nuevos en archivos de esta rama. **Regla nueva #13**: los endpoints API del portal driver DEBEN usar `requireDriverApi()` del helper canónico en vez de `hasAnyRole(session, ["DRIVER"])`. El JWT `roles[]` es cache, la DB es source of truth. Por cada endpoint que se agregue al portal driver, reusar el helper. Aplica el mismo criterio que ya se aplicó en `proxy.ts` (2026-04-15) y en los layouts protegidos (`requireDriverAccess`, 2026-04-10).)

## 2026-04-24 (rama `feat/emails-lanzamiento-completo` RESUELTA — auditoría integral de emails + 24 emails nuevos registrados/creados + 2 crons nuevos + 3 bugs adyacentes en una sola pasada. **Contexto**: Mauro pidió auditar exhaustivamente todos los emails del sistema pre-lanzamiento. Estado inicial: 32 emails en `email-registry.ts` vs 44 funciones `sendXxxEmail` en el código (gap de 12 no registrados) + fantasma `password_changed` apuntando a código inline + duplicaciones legacy entre `email.ts` y `email-p0.ts` + gaps legales (cambio de email, export ARCO listo, cambio TOS/privacy, opt-out marketing) + gaps UX críticos (driver asignado, pedido en camino con PIN, listo para pickup, recordatorio de calificar, puntos acreditados, puntos por vencer, avisos al admin de nuevos registros/solicitudes, referral activado). **Fase 1 — Limpieza**: (a) registradas las 12 funciones existentes de docs/change-requests/expirations de merchant+driver en `email-registry.ts` (entries 200-216), (b) extraído `sendPasswordChangedEmail` del inline de `/api/auth/change-password/route.ts` a función exportada en `src/lib/email.ts`, endpoint migrado a usar la función (fire-and-forget), entrada `password_changed` del registry actualizada para apuntar a la función real. Las funciones legacy duplicadas (sendMerchantApprovalEmail, sendMerchantRejectionEmail, sendDriverRejectionEmail de `email.ts`) se mantuvieron porque SÍ están en uso activo en 3 endpoints de approve/reject — decisión: mantener, consolidar post-launch. **Fase 2 — Emails legales (obligatorios por Ley 25.326 AAIP + Ley 24.240 + Ley 26.951)**: 4 funciones nuevas en `src/lib/email-legal-ux.ts`: `sendEmailChangeConfirmationEmail` (al nuevo + alert al viejo, no conectada, pendiente endpoint), `sendDataExportReadyEmail` (no conectada, para futuro export asíncrono ARCO), `sendTermsUpdatedEmail` (manual desde cron futuro al bumpear `PRIVACY_POLICY_VERSION`/`TERMS_VERSION`), `sendMarketingOptOutConfirmedEmail` (conectado a PATCH `/api/profile/privacy` cuando `marketingConsent` pasa true→false, idempotente). **Fase 3 — Emails UX críticos**: 5 funciones UX buyer/driver en `src/lib/email-legal-ux.ts`: `sendDriverAssignedEmail` (al buyer desde assignment-engine post-accept, con driver, vehículo, teléfono enmascarado `•••• 4521`, ETA estimado server-side con haversine a 25 km/h), `sendOrderOnTheWayEmail` (al buyer desde `/api/driver/orders/[id]/status` PICKED_UP si no es pickup, con PIN gigante en el subject y body), `sendOrderReadyForPickupEmail` (al buyer si isPickup al marcar READY, con dirección del merchant), `sendRateOrderReminderEmail` (via cron 24-48h post-DELIVERED sin ratedAt, idempotente), `sendPointsEarnedEmail` (al buyer al DELIVERED si awarded>0, con nuevo saldo y tier). 6 funciones UX admin/operativos en `src/lib/email-admin-ops.ts`: `sendAdminNewMerchantPendingEmail` (conectado a register/merchant), `sendAdminNewDriverPendingEmail` (conectado a register/driver), `sendAdminNewChangeRequestEmail` (disponible pero NO conectada, las específicas ya están activas), `sendPointsExpiringEmail` (al user vía cron diario con threshold 150 días inactividad, idempotente via `User.pointsExpiryNotifiedAt` + reset en `awardOrderPointsIfDelivered` y en gasto de puntos para defense-in-depth), `sendDriverAutoActivatedEmail` (desde `approveDriverDocument` post-transition), `sendReferralActivatedEmail` (desde `activatePendingBonuses` al referidor con balance actualizado). **2 crons nuevos registrados en `CRON_EXPECTATIONS`**: `rate-order-reminder` (maxHours 30) y `points-expiring-reminder` (maxHours 30). Ambos con `verifyBearerToken` ANTES de `recordCronRun` + patrón atómico `updateMany WHERE flag IS NULL + count === 1` antes del side effect. **Schema**: `Order.rateReminderSentAt DateTime?` y `User.pointsExpiryNotifiedAt DateTime?` agregados. Requiere `npx prisma db push && npx prisma generate` post-merge. **Registry consolidado**: 32 → 59 emails en `src/lib/email-registry.ts` (12 de Fase 1 con numbers 200-216, 9 de Fase 2+3 buyer con numbers 300-308, 6 de Fase 3 admin/ops con numbers 310-315). Cada entrada con `generatePreview()` que refleja visualmente el email real. **Bugs adyacentes resueltos en la misma rama** (respuesta al feedback "revisar cabos sueltos"): (a) **Pipeline 500 error** en `/api/admin/pipeline-comercios`: causa — mi query incluía `deletedAt: null` pero `Merchant` no tiene campo `deletedAt` (confundido con `User`). Fix: removido el filtro de los 3 findMany + select extendido para incluir `name: true` (campo obligatorio) además del `businessName` opcional; UI cambia a `m.businessName || m.name` como display name; (b) **Tarjetas de ficha usuario cerradas por default**: `expandedMerchant/Driver/Seller` inicializados en `false` en `/ops/usuarios/[id]/page.tsx` para que el admin expanda solo lo que necesita ver en vez de recibir un muro de información; (c) **Filtro "Pendientes" de /ops/usuarios**: analizado — funciona correctamente (chequea `merchant.approvalStatus === "PENDING"` o `driver.approvalStatus === "PENDING"`), el estado PENDING cubre a todos los comercios/drivers con docs faltantes. Extender con `DocumentChangeRequest` pendientes queda documentado para post-launch. **Paralelización usada**: Fase 2 + Fase 3 ejecutadas con 2 agentes concurrentes en prompts completamente autónomos — cada uno creó su archivo, conectó triggers, y devolvió el bloque de entries del registry listo para pegar. Yo consolidé el registry al final manualmente (los agentes explícitamente tenían prohibido tocar `email-registry.ts` para evitar conflicts). Ambos agentes reportaron TS clean. **Archivos nuevos (4)**: `src/lib/email-legal-ux.ts` (9 funciones), `src/lib/email-admin-ops.ts` (6 funciones), `src/app/api/cron/rate-order-reminder/route.ts`, `src/app/api/cron/points-expiring-reminder/route.ts`. **Archivos modificados (12)**: `src/lib/email.ts` (sendPasswordChangedEmail agregado), `src/lib/email-registry.ts` (27 entries nuevas + fantasma `password_changed` apuntando a función real), `src/lib/cron-health.ts` (2 crons nuevos en CRON_EXPECTATIONS), `src/lib/driver-document-approval.ts` (trigger auto-activated), `src/lib/points.ts` (trigger referral activated + reset pointsExpiryNotifiedAt), `src/lib/assignment-engine.ts` (trigger driver assigned), `src/app/api/auth/change-password/route.ts` (inline → función), `src/app/api/auth/register/merchant/route.ts` (trigger admin new merchant), `src/app/api/auth/register/driver/route.ts` (trigger admin new driver), `src/app/api/profile/privacy/route.ts` (trigger opt-out confirmado), `src/app/api/driver/orders/[id]/status/route.ts` (trigger on-the-way + points earned), `src/app/api/merchant/orders/[id]/ready/route.ts` (trigger ready for pickup), `src/app/api/orders/route.ts` (reset de pointsExpiryNotifiedAt al gastar puntos), `src/app/api/admin/pipeline-comercios/route.ts` (fix deletedAt + name select), `src/app/ops/(protected)/pipeline-comercios/page.tsx` (fix display name con fallback), `src/app/ops/(protected)/usuarios/[id]/page.tsx` (tarjetas cerradas por default), `prisma/schema.prisma` (2 campos nuevos). **Funciones creadas pero NO conectadas (esperado)**: `sendEmailChangeConfirmationEmail` (no hay endpoint de cambio de email hoy), `sendDataExportReadyEmail` (export hoy es sync, para futuro async), `sendTermsUpdatedEmail` (para cron manual futuro al bumpear versión), `sendAdminNewChangeRequestEmail` (las específicas ya están activas, genérica queda como fallback). **TS clean**: 0 errores nuevos en archivos de esta rama (1010 totales son los pre-existentes conocidos: `.next/dev/types/*`, `node_modules/.prisma/client` pre-regenerate, `privacidad/page.tsx` TS1127, `order-chat.ts` TS1127, `socket-server.ts` TS1127, `comercio/info/page.tsx` TS1127, `email-registry.ts` TS1127 del byte null pre-existente que NO pude limpiar desde Edit/Write tools pero no afecta runtime). **Pendiente post-merge**: (1) `npx prisma db push && npx prisma generate` local para los 2 campos nuevos. Sin eso, los 2 crons nuevos + el trigger de points-earned tiran "Unknown field" al primer run. (2) Registrar `POST /api/cron/rate-order-reminder` y `POST /api/cron/points-expiring-reminder` en el runner externo con `Authorization: Bearer ${CRON_SECRET}` — ambos diarios. (3) Consolidar post-launch las duplicaciones legacy email.ts/email-p0.ts en un solo archivo. **Regla nueva #11**: todo email transaccional nuevo DEBE (a) tener función exportada en `src/lib/email*.ts` (nunca inline en endpoints — fantasma como `password_changed` no permitido), (b) entrada en `EMAIL_REGISTRY` con `generatePreview()` que refleje fielmente el HTML real, (c) trigger conectado en el endpoint que corresponde. Si la función existe pero no se puede conectar aún (endpoint futuro), documentarlo con `status: 'new'` en registry y en CLAUDE.md. **Regla nueva #12**: todo cron nuevo que envía comunicaciones masivas o triggerea side effects sensibles DEBE usar patrón idempotente `updateMany WHERE flag IS NULL + count === 1` antes del side effect, con el flag que se resetea al evento que lo justifica. Evita duplicados bajo race conditions del cron.)

## 2026-04-24 (rama `fix/ops-email-templates` RESUELTA — 7 features de CRM/OPS implementadas en una sola pasada para que Mauro pueda operar 100% desde el panel sin tocar código, post-lanzamiento. **Contexto**: auditoría del panel OPS reveló que hoy ~50 emails transaccionales viven hardcodeados en `src/lib/email.ts`/`email-p0.ts`/`email-registry.ts`, no hay forma de dejar notas internas en la ficha de un user, el `AuditLog` se escribe pero no hay UI para consultarlo, no hay broadcast push/email segmentado, no hay pipeline visual de onboarding de comercios, no hay panel consolidado de pagos pendientes a drivers/merchants ni playbook de procedimientos. Refund manual + gestión de categorías ya existían (audit first evitó duplicación). **7 features entregadas**: (1) **Plantillas de email editables** — nuevo modelo `EmailTemplate` (key unique + subject + bodyHtml + placeholders JSON + category + recipient + isActive + version + lastEditedBy), helper `src/lib/email-templates.ts` con `renderEmailTemplate(key, vars)` que hace DB lookup con cache TTL 60s + escape HTML en placeholders + fallback a null si template no existe/inactivo (callers siguen usando hardcode como failover), endpoints GET/POST `/api/admin/email-templates`, GET/PATCH/DELETE `/api/admin/email-templates/[id]` (DELETE es soft: `isActive:false`, PATCH incrementa `version` y audita before/after), endpoint one-time `POST /api/admin/email-templates/seed` que itera `EMAIL_REGISTRY` de `lib/email-registry.ts` sembrando los ~50 templates, `src/app/ops/(protected)/emails/page.tsx` convertido de viewer a editor: drawer full-screen con form (subject, placeholders-as-chips, bodyHtml textarea monospace, checkbox isActive) + preview live en iframe sandbox DOMPurify sanitizado, badge "DB vN" / "Hardcoded" por email, botón "Sembrar faltantes" visible si `dbTemplateCount < totalEmails`. (2) **Notas internas + Visor AuditLog** — nuevo modelo `AdminNote` (userId+adminId+content+pinned+createdAt+updatedAt, cascade onDelete del user, índices `[userId, pinned, createdAt]` y `[adminId]`), relaciones agregadas a User (`adminNotesAbout` y `adminNotesWritten`), endpoints GET/POST `/api/admin/notes`, PATCH/DELETE `/api/admin/notes/[id]` (PATCH con ownership check, DELETE permisivo para cualquier admin con content en audit para histórico), componente `src/components/ops/AdminNotesSection.tsx` (textarea Ctrl+Enter, pin/unpin toggle, edición inline, delete con confirm, optimistic UI, char counter 0/2000), integrado en `ops/usuarios/[id]/page.tsx` entre header y tabs para visibilidad constante, nuevo endpoint `GET /api/admin/audit` con filtros combinables (action, entityType, entityId contains, userId exacto, dateFrom/dateTo, take/skip), nueva página `ops/auditoria/page.tsx` con tabla desktop + cards mobile + KNOWN_ACTIONS pre-poblado con 40+ actions grepados del código (mergedo con actions que aparezcan en response usando useMemo) + expandible por fila con JSON formateado + paginación 50/pág. (3) **Segmentador** — `src/lib/user-segments.ts` con `SegmentFiltersSchema` Zod, `buildSegmentWhere(filters)` que traduce a Prisma where (role USER/COMERCIO/DRIVER/SELLER/ADMIN, isSuspended, hasMarketingConsent — obligatorio para marketing por Ley 26.951, minPoints/maxPoints, createdAfter/Before, hasOrdered, noOrdersInDays, city partial match), `countSegment`, `previewSegment` (count + sample 10), `iterateSegmentUserIds` cursor-based async generator para el cron, `parseSegmentFilters` defensivo ante JSON corrupto. Nuevo modelo `UserSegment` (name + description + filters JSON + lastCount cached + createdBy + isActive). Endpoints GET/POST `/api/admin/segments`, GET/PATCH/DELETE `/api/admin/segments/[id]` (DELETE soft si tiene campañas asociadas via integridad referencial), POST `/api/admin/segments/preview` (30/60s rate limit, ejecuta filtros y devuelve count + sample). Página `ops/segmentos/page.tsx` con split view: lista izq + editor derecha, preview debounced 400ms, banner amarillo Ley 26.951 si `hasMarketingConsent !== true`, botón "Usar en broadcast" que deep-linka a `/ops/broadcast?segmentId=...`. (4) **Broadcast** — nuevo modelo `BroadcastCampaign` (name + channel push|email|both + segmentId + templateId? + customTitle/Body/Url + status DRAFT|SCHEDULED|RUNNING|COMPLETED|FAILED|CANCELLED + scheduledAt/startedAt/completedAt + totalRecipients/sentCount/failedCount + **lastCursor** para resume del cron). Endpoints CRUD completos + `/[id]/launch` (DRAFT→RUNNING o SCHEDULED con totalRecipients calculado inline) + `/[id]/cancel` (SCHEDULED|RUNNING→CANCELLED). **Cron nuevo `POST /api/cron/process-broadcasts`** registrado en `CRON_EXPECTATIONS` con maxHours:2, auth via verifyBearerToken ANTES de recordCronRun, auto-promueve SCHEDULED con scheduledAt≤now a RUNNING, procesa hasta PROCESS_CAMPAIGNS_PER_RUN=5 campañas RUNNING, toma BATCH_SIZE=200 recipients con cursor sobre el segmento, para cada user envía push via `sendPushToUser` (tag `broadcast-${id}`) y/o email via `sendEmail` con renderEmailTemplate helper cuando hay templateId (fallback a `renderPlaceholders` inline si template no existe), actualiza `sentCount`/`failedCount`/`lastCursor` atomicamente, marca COMPLETED cuando batch.length===0. Página `ops/broadcast/page.tsx` con form nueva campaña (segmento + template opcional + custom title/body/url + schedule datetime-local) + lista con status chips color-coded + progress bar en RUNNING + botones Lanzar ahora / Programar / Cancelar / Borrar (solo DRAFT). Suspense boundary por useSearchParams. Warning amarillo sobre Ley 26.951 antes de crear. (5) **Pipeline kanban de onboarding** — sin schema nuevo, todo derivado. Endpoint `GET /api/admin/pipeline-comercios` que devuelve 4 columnas: `pendiente_docs` (PENDING sin todos los docs AFIP/habilitación/CUIT/CBU), `en_revision` (PENDING con docs completos), `aprobados` (APPROVED últimos 30d por `approvedAt`), `rechazados` (REJECTED últimos 30d por `updatedAt`). Página `ops/pipeline-comercios/page.tsx` con 4 columnas bordered color-coded, cada card clickeable navega a `/ops/usuarios/[ownerId]`, chips de faltantes en pendiente_docs ("Sin constancia AFIP", "Sin habilitación", "Sin CUIT", "Sin CBU"), razón de rechazo visible en rojo para rechazados. (6) **Pagos pendientes con batches** — nuevos modelos `PayoutBatch` (batchType DRIVER|MERCHANT + status DRAFT|GENERATED|PAID|CANCELLED + periodStart/End + totalAmount + itemCount + csvPath + generatedBy + paidBy/paidAt + notes) y `PayoutItem` (batchId + recipientType + recipientId + recipientName/bankAccount/cuit denormalizados + amount + ordersIncluded JSON array). `src/lib/payouts.ts` con `DRIVER_SHARE=0.70` (aproximación 80% del costo real del viaje × 87.5% que es costo vs 5% operativo), helpers `getAlreadyPaidOrderIds(type)` (parsea ordersIncluded de batches PAID, Set<string>) y `getOrderIdsInOpenBatches(type, excludeBatchId?)` (batches DRAFT|GENERATED para prevenir double-pay race), `getPendingDriverPayouts()` y `getPendingMerchantPayouts()` que excluyen ambos sets, usan `Order.merchantPayout` para merchants y `Order.deliveryFee * DRIVER_SHARE` para drivers (aproximación por ahora — schema no guarda riderEarnings por orden). Driver bank: prioriza `bankCbu`, fallback a `bankAlias`. `buildPayoutCsv(batch)` retorna "CUIT;Nombre;CBU/Alias;Monto;Concepto" para import a MP Bulk Transfer. Endpoint GET `/api/admin/payouts/pending?type=DRIVER|MERCHANT` (saldos agrupados por recipient con totales). GET `/api/admin/payouts/batches?type&status`, POST `/api/admin/payouts/batches` (valida que todos tengan bankAccount antes de generar, crea batch+items en `$transaction`, calcula periodStart desde la orden más vieja). GET `/api/admin/payouts/batches/[id]?format=csv|json` (content-disposition attachment para descargar CSV). DELETE `/api/admin/payouts/batches/[id]` (cancelar DRAFT o GENERATED, PAID bloqueado). **Endpoint crítico POST `/api/admin/payouts/batches/[id]/mark-paid`**: requiere body Zod `{confirmText: literal("CONFIRMAR PAGO")}` — rechaza cualquier otro string, rate limit 5/60s, corre en `$transaction` isolationLevel Serializable que actualiza PayoutBatch.status + paidBy + paidAt, y para MERCHANT batches marca todos los Order.commissionPaid=true consumidos por el batch. AuditLog `PAYOUT_BATCH_PAID` con batchType+totalAmount+itemCount+notes. **MOOVY NUNCA dispara plata sola** — este endpoint solo registra lo que el admin YA transfirió afuera via MP Bulk Transfer/banco. Página `ops/pagos-pendientes/page.tsx` con tabs Repartidores/Comercios, stats "recipients + orders + total pendiente", tabla de pendientes con checkboxes + seleccionar todos, alert rojo inline si recipient sin CBU, botón "Generar batch" abre confirm con monto total, sección batches existentes con status chips + botones "Descargar CSV" (window.location.href) / "Marcar PAID" (window.prompt pidiendo "CONFIRMAR PAGO") / "Cancelar". (7) **Playbook** — nuevos modelos `PlaybookChecklist` (name + description + category onboarding|approval|escalation|incident|other + isActive + order) y `PlaybookStep` (checklistId cascade + content + order + required). Endpoints GET/POST `/api/admin/playbook`, GET/PATCH/DELETE `/api/admin/playbook/[id]`, POST `/api/admin/playbook/[id]/steps`, PATCH/DELETE `/api/admin/playbook/[id]/steps/[stepId]` (PATCH con order hace reordenamiento densificado en `$transaction`), POST `/api/admin/playbook/[id]/reorder-steps` (valida cardinalidad exacta de stepIds vs steps actuales para prevenir drift). Página `ops/playbook/page.tsx` con split view desktop (sidebar agrupado por categoría + detalle), edición inline con on-blur, drag&drop `@dnd-kit/sortable` con PointerSensor+TouchSensor + optimistic UI + revert on error, `prompt()` nativo para "Agregar paso" (rápido, consistente con pattern consulta+edición), empty state con "Cargar checklists de ejemplo" que siembra 4 iniciales (Alta comercio / Revisión docs driver / Pedido demorado >30 min / Reclamo comercio por pago). **Sidebar OPS actualizado** (`src/components/ops/OpsSidebar.tsx`): nueva sección "CRM" con Segmentos + Broadcast, `/ops/pipeline-comercios` agregado a sección "Actores", `/ops/auditoria` en "Operaciones", `/ops/pagos-pendientes` en "Finanzas", `/ops/playbook` en "Sistema". Íconos nuevos: FileText, Send, Filter, GitBranch, Wallet, ClipboardCheck. **Archivos nuevos (26)**: `src/lib/email-templates.ts`, `src/lib/user-segments.ts`, `src/lib/payouts.ts`, `src/app/api/admin/email-templates/route.ts` + `[id]/route.ts` + `seed/route.ts`, `src/app/api/admin/notes/route.ts` + `[id]/route.ts`, `src/app/api/admin/audit/route.ts`, `src/app/api/admin/segments/route.ts` + `[id]/route.ts` + `preview/route.ts`, `src/app/api/admin/broadcast/route.ts` + `[id]/route.ts` + `[id]/launch/route.ts` + `[id]/cancel/route.ts`, `src/app/api/cron/process-broadcasts/route.ts`, `src/app/api/admin/pipeline-comercios/route.ts`, `src/app/api/admin/payouts/pending/route.ts` + `batches/route.ts` + `batches/[id]/route.ts` + `batches/[id]/mark-paid/route.ts`, `src/app/api/admin/playbook/route.ts` + `[id]/route.ts` + `[id]/steps/route.ts` + `[id]/steps/[stepId]/route.ts` + `[id]/reorder-steps/route.ts`, `src/app/ops/(protected)/auditoria/page.tsx`, `src/app/ops/(protected)/segmentos/page.tsx`, `src/app/ops/(protected)/broadcast/page.tsx`, `src/app/ops/(protected)/pipeline-comercios/page.tsx`, `src/app/ops/(protected)/pagos-pendientes/page.tsx`, `src/app/ops/(protected)/playbook/page.tsx`, `src/components/ops/AdminNotesSection.tsx`. **Archivos modificados**: `prisma/schema.prisma` (7 modelos nuevos: EmailTemplate, AdminNote, PlaybookChecklist, PlaybookStep, UserSegment, BroadcastCampaign, PayoutBatch, PayoutItem + relaciones en User), `src/components/ops/OpsSidebar.tsx` (6 nav items nuevos + 1 sección CRM), `src/lib/cron-health.ts` (entrada process-broadcasts maxHours 2), `src/app/ops/(protected)/emails/page.tsx` (de viewer a editor), `src/app/ops/(protected)/usuarios/[id]/page.tsx` (integra AdminNotesSection). **Pendiente post-merge**: `npx prisma db push && npx prisma generate` local para registrar los 8 modelos nuevos. Sin eso, todos los endpoints nuevos tirarán runtime "Unknown field emailTemplate/adminNote/userSegment/etc does not exist on type PrismaClient". **TS clean**: 0 errores nuevos en archivos de esta rama (los 1010 errores totales del check full son los pre-existentes documentados: `.next/dev/types/*` auto-generados, `node_modules/.prisma/client` pre-regenerate, `src/app/privacidad/page.tsx` TS1127, `src/types/order-chat.ts` TS1127, `scripts/socket-server.ts` TS1127, `src/app/comercio/info/page.tsx` TS1127, `src/lib/email-registry.ts` TS1127). **Paralelización usada**: Ronda 1 ejecutada con 3 agentes concurrentes (email templates / notas+audit / playbook) — cero conflictos porque el schema + sidebar estaban pre-consolidados por Claude antes de disparar. Rondas 2 y 3 secuenciales por Claude (segmentador + broadcast por dependencia, pagos por ser plata sensible). **Reglas nuevas del board**: (#8) toda operación que transfiera dinero real DEBE requerir confirmación textual explícita (ej: literal "CONFIRMAR PAGO") en body del request — no alcanza con un click de botón — y correr en `$transaction` con `isolationLevel: "Serializable"` para evitar race conditions de double-pay; además el endpoint NUNCA ejecuta la transferencia en sí, solo registra lo que el admin ya hizo afuera. (#9) cualquier feature de comunicación masiva (broadcast email/push, campaign scheduling) DEBE usar cursor-based resume para ser safe ante crashes del cron, y DEBE validar consentimiento de marketing (Ley 26.951) antes de disparar — sea en el segmento (preferido) o en el broadcast endpoint. (#10) el panel OPS es la única interfaz operativa post-launch — todo parámetro editable (copy, segmentos, playbooks, categorías) debe vivir en DB con UI CRUD desde `/ops`; NUNCA en constantes del código, NUNCA via archivos de config que requieran deploy.)

## 2026-04-23 (rama `fix/onboarding-repartidor-complet` RESUELTA — onboarding repartidor end-to-end, 3 bloques P0/P1/P2 en una sola pasada. **Contexto**: mismo día del merge de `fix/onboarding-comercio-completo` — consejo de expertos auditó el flujo de repartidor en paralelo y detectó patrones equivalentes de fragilidad. **Issues encontrados** (equivalentes a los del comercio, más los específicos del driver): (P0-1) driver registration guardaba la URL del documento en `Driver.licenciaUrl`/`seguroUrl`/`vtvUrl` sin triple de aprobación (status + approvedAt + rejectionReason) — el admin solo podía aprobar o rechazar al driver completo, sin granularidad por doc. (P0-2) no existía constancia CUIT/Monotributo como doc formal — solo el campo text `Driver.cuit` encriptado, sin URL de prueba fiscal. (P0-3) CUIT sin validación de checksum AFIP — un string de 11 dígitos aleatorios pasaba. (P0-4) no había hard-lock server-side para docs aprobados — el driver podía subir cualquier URL nueva via `/api/driver/documents/update` y reemplazar silenciosamente una licencia aprobada. (P0-5) no existía auto-activación al aprobar todos los docs — el admin tenía que recordar aprobar al driver globalmente después de aprobar cada doc. (P1-1) cédula verde (titularidad del vehículo) **no era obligatoria** para motorizados — Decreto 779/95 lo requiere, legalmente nosotros somos responsables subsidiarios si opera con un vehículo que no es suyo. (P1-2) licencia/seguro/RTO tenían vencimiento implícito en la foto pero no había campo `<doc>ExpiresAt` ni cron que avise al driver antes del vencimiento ni auto-suspenda al vencer — operábamos con docs vencidos sin saberlo. (P1-3) si un driver necesitaba actualizar un doc aprobado (renovación de licencia, cambio de póliza), no había flujo formal — era por WhatsApp/email. (P2-1) bicis/patinetas no se diferenciaban de motos — se les pedían los 8 docs igual, fricción innecesaria para los delivery de mochila. (P2-2) antigüedad del vehículo sin validación por tipo — un auto del 1990 pasaba igual que uno del 2020 cuando el clima de Ushuaia (salino + heladas) requiere vehículos más nuevos. **Arquitectura del fix** (4 capas con defense in depth): (1) **Schema Prisma** — agregados 8 triples `<campo>Status String @default("PENDING") + <campo>ApprovedAt DateTime? + <campo>RejectionReason String?` en Driver para los 8 docs: `cuit`, `constanciaCuitUrl` (nuevo campo URL que guarda la constancia AFIP, no el texto CUIT), `dniFrenteUrl`, `dniDorsoUrl`, `licenciaUrl`, `seguroUrl`, `vtvUrl`, `cedulaVerdeUrl` (nuevo campo URL obligatorio para motorizados). Además 4 pares `<campo>ExpiresAt DateTime? + <campo>NotifiedStage Int @default(0)` para los 4 docs con vencimiento (licencia/seguro/vtv/cedulaVerde). NotifiedStage: 0=ninguna alerta enviada, 1=aviso 7d, 2=aviso 3d, 3=aviso 1d, 4=vencido+auto-suspended. Nuevo modelo `DriverDocumentChangeRequest` (id/driverId/field/reason/status PENDING|APPROVED|REJECTED/resolvedBy?/resolvedAt?/adminNote?/createdAt) con índices `[driverId, status]` y `[driverId, field]`. Requiere `npx prisma db push && npx prisma generate` post-merge. (2) **Librerías nuevas**: `src/lib/cuit.ts` con `validateCuit(value)` — sanitiza separadores (guiones/espacios), chequea 11 dígitos, valida prefijo (20/23/24/27/30/33/34) y calcula checksum AFIP con ponderación `[5,4,3,2,7,6,5,4,3,2]` + módulo 11 + reglas 10/11 para el dígito verificador. Retorna `{ valid: boolean, normalized?: string, error?: string }`. `isValidCuit(value)` wrapper booleano. También `dniToCuitPrefix(dni, sex)` y `getCuitPossibilities(dni)` para auto-completar en el form. `src/lib/driver-document-approval.ts`: exporta `DRIVER_DOCUMENT_COLUMNS` (mapa de 8 entries con columna Prisma / label humano / tipo text-vs-url / flags hasExpiration/motorizedOnly), constantes `NON_MOTORIZED_TYPES = ["BICI","BICICLETA","PATIN","PATINETA","TRICI"]`, helpers `isMotorizedVehicle(vt)` y `getRequiredDriverDocumentFields(vt)` (devuelve 4 docs para no-motorizado, 8 para motorizado). Funciones `approveDriverDocument({driverId, field, adminId, ctx})` y `rejectDriverDocument({driverId, field, adminId, reason, ctx})` dentro de `$transaction` serializable: (a) update del `<campo>Status` + `ApprovedAt` (o `RejectionReason`), (b) AuditLog `DRIVER_DOCUMENT_APPROVED`/`REJECTED` con detalles, (c) si el approve deja a TODOS los docs requeridos (según vehicleType) en APPROVED, llama inline a `approveDriverTransition` para activar (`approvalStatus: APPROVED`, `isActive: true`, `approvedAt: now`) + audit `DRIVER_AUTO_ACTIVATED`. `resetDriverDocumentToPending({driverId, field, ctx})` — resetea el triple a `PENDING + null + null` y además `NotifiedStage: 0` si el doc tiene vencimiento. (3) **Endpoints nuevos**: `POST /api/driver/documents/change-request` (driver-only, rate limit 5/60s, Zod `{documentField, reason 10-500 chars}` — valida APPROVED + no-pending-duplicate, inserta `DriverDocumentChangeRequest`, audit, email admin). `GET /api/driver/documents/change-request` lista solicitudes propias enriquecidas con `documentLabel`. `POST /api/admin/drivers/[id]/change-requests/[requestId]/resolve` (admin-only, Zod `{action: "APPROVE"|"REJECT", adminNote?}`) — en APPROVE llama `resetDriverDocumentToPending` + para URL docs setea el URL a null (fuerza re-upload), marca solicitud APPROVED + email al driver; en REJECT solo marca REJECTED + note. `GET /api/admin/drivers/[id]/change-requests` lista todas. `POST /api/admin/drivers/[id]/documents/approve` y `/reject` — thin wrappers sobre approve/rejectDriverDocument. `PATCH /api/driver/documents/update` extendido: (a) valida CUIT via `validateCuit()` antes de encriptar, 400 con error específico si inválido; (b) parsea expirations via `parseExpirationDate()` con rango today-1d a today+20y (rechaza fechas pasadas y implausibles); (c) chequea `<campo>Status === "APPROVED"` ANTES de escribir — si está aprobado, retorna 403 "Documento bloqueado, solicitá un cambio primero" (hard lock server-side); (d) para docs no-APPROVED, llama `resetDriverDocumentToPending` al setear el nuevo URL. (4) **Cron de vencimientos** `POST /api/cron/driver-docs-expiry` — corre diario (integrado en el external runner). Envuelto en `recordCronRun("driver-docs-expiry", fn)` (ver ISSUE-026). Auth CRON_SECRET ANTES del recordCronRun (no ensuciar healthcheck con intentos 401). Itera los 4 docs con vencimiento (`EXPIRING_FIELDS = ["licenciaUrl", "seguroUrl", "vtvUrl", "cedulaVerdeUrl"]`) y para cada uno: **Path EXPIRED**: `findMany` drivers con `<expCol> < now + <stageCol> < 4 + <statusCol> APPROVED`, para cada uno hace `updateMany({where: {id, [stageCol]: {lt: 4}}, data: {[statusCol]: "EXPIRED", [stageCol]: 4}})` — atómico, si count===0 es race perdido y skipea. Si gana la carrera, cuenta como expired, consulta `getRequiredDriverDocumentFields(vehicleType)` y si el doc ES requerido llama `prisma.driver.update({data: {isSuspended: true, suspendedAt: now, suspensionReason: "Documento vencido: <label>", isOnline: false, availabilityStatus: "FUERA_DE_SERVICIO"}})` + AuditLog `DRIVER_AUTO_SUSPENDED_BY_EXPIRY` + email `sendDriverDocExpiredEmail` + push `"⛔ Documento vencido"`. **Path WARNINGS**: itera thresholds 1d→3d→7d (el más cercano primero para que no se doble avise), para cada threshold busca drivers con `<expCol> gte now + lte now+Nd + <stageCol> < threshold.stage + APPROVED`, bump atómico del stage via `updateMany WHERE stage < threshold.stage`, envía `sendDriverDocExpiringEmail` + push con copy diferenciado por stage (última llamada / actualizalo / renoválo sin apuros). Registrado en `CRON_EXPECTATIONS` de `src/lib/cron-health.ts` como `driver-docs-expiry: { maxHours: 30, label: "Avisos de vencimiento de documentos de repartidor" }` para que el dashboard OPS alerte si deja de correr. (5) **UI registro** `src/app/repartidor/registro/RepartidorRegistroClient.tsx` — rediseño completo del form con sección de Documentos reorganizada. Campo CUIT/Monotributo nuevo con validación live (llama `isValidCuit` on-change, muestra ✅ verde si válido / ✖ rojo si no) + autocomplete opcional a partir del DNI (usa `getCuitPossibilities(dni)` para sugerir 20-DNI-X / 23-DNI-X / 27-DNI-X con el dígito verificador calculado). Nuevo upload obligatorio "Constancia AFIP / Monotributo" (PDF o imagen) con campo `constanciaCuitUrl`. Para motorizados: el upload "Cédula verde" ahora es obligatorio (antes no existía el field), al lado de Licencia/Seguro/RTO. Campos de fecha de vencimiento requeridos bajo cada uno de los 4 docs (licencia/seguro/RTO/cédula verde) — validación client-side: no pasada, no más de 20 años futuro. Sección "Vehículo" condicional: si `vehicleType ∈ NON_MOTORIZED_TYPES`, se ocultan campos `vehicleBrand/Model/Year/Color/LicensePlate/licenciaUrl/seguroUrl/vtvUrl/cedulaVerdeUrl/expires*` y se muestra cartel "Para bicicletas y patinetas solo necesitamos DNI + CUIT". `src/app/api/auth/register/driver/route.ts` y `/api/auth/activate-driver/route.ts` extendidos con (a) validación CUIT checksum, (b) validación constanciaCuitUrl obligatorio, (c) validación cedulaVerdeUrl obligatorio para motorizados, (d) validación antigüedad del vehículo por tipo (`MAX_VEHICLE_AGE_YEARS = {MOTO: 15, AUTO: 25, CAMIONETA: 25, PICKUP: 25, SUV: 25, FLETE: 30}`), (e) parseo + validación de 4 expirations para motorizados, (f) docs no-motorizados nulleados explícitamente aunque vengan en el body. (6) **UI OPS** `src/app/ops/(protected)/usuarios/[id]/page.tsx` — nueva sub-sección `<DriverDocumentsAdmin>` con 8 tarjetas (filtradas según vehicleType), cada una con status chip color-coded, badge de vencimiento si aplica (rojo si vencido, naranja si ≤3d, amber si ≤7d, slate si >7d), botones inline "Aprobar" / "Rechazar (motivo)" por doc, visor del URL, y razón de rechazo en caja roja si REJECTED/EXPIRED. Sub-sección `<DriverChangeRequestsAdmin>` lista solicitudes con botones "Aprobar" (dispara reset + email) y "Rechazar (nota)". Toast verde "Repartidor activado automáticamente" cuando la aprobación del último doc dispara auto-activación. (7) **UI ProfileView driver** `src/components/rider/views/ProfileView.tsx` — sección nueva "Mis Documentos" entre Info del Vehículo y Reseñas. 8 `<DriverDocCard>` (filtradas a 4 para no-motorizados usando `isMotorizedClient(formData.vehicleType)` + `useMemo`). Cada card: status chip, `ExpirationBadge` para los 4 con vencimiento (umbral alineado con el cron: vencido red-200 / ≤1d red-100 / ≤3d orange-100 / ≤7d amber-100 / >7d slate-100), caja roja con razón si REJECTED/EXPIRED, acción según estado: (a) CUIT en PENDING/REJECTED muestra input inline + botón Save que PATCH a update-docs; (b) docs URL sin vencimiento (constancia/dni) muestran label-as-button "Subir/Reemplazar documento" con file input oculto que dispara upload automático; (c) docs URL con vencimiento (licencia/seguro/vtv/cédula) tras elegir archivo muestran panel de confirmación con nombre del archivo + date input + botón "Subir con vencimiento" (2 pasos, previene upload sin fecha); (d) cuando APPROVED muestra link "Ver documento" + botón amber "Solicitar cambio" (deshabilitado si ya hay pending, muestra "Solicitud pendiente"). Modal `<DriverChangeRequestModal>` con textarea 10-500 chars + live counter, tema green-600 consistente con portal driver. Historial de solicitudes resueltas en `<details>` colapsable. Estado como `Record<DriverDocKey, DocFieldState>` single source, refresca desde `/api/driver/profile` (que ya devuelve todos los campos via `include` sin select filter — no requirió backend change). **Emails nuevos en `src/lib/email.ts`**: `sendDriverDocumentApproved(driverEmail, driverName, fieldLabel)`, `sendDriverDocumentRejected(driverEmail, driverName, fieldLabel, reason)`, `sendDriverAutoActivated(driverEmail, driverName)`, `sendDriverChangeRequestResolved(driverEmail, driverName, fieldLabel, approved)`, `sendDriverDocExpiringEmail(driverEmail, driverName, fieldLabel, daysRemaining, expiresAt)` (copy diferenciado por daysRemaining ≤1/3/7), `sendDriverDocExpiredEmail(driverEmail, driverName, fieldLabel, expiresAt)` — tono habitual MOOVY, firing-and-forget desde los endpoints y el cron. **Archivos nuevos**: `src/lib/cuit.ts`, `src/lib/driver-document-approval.ts`, `src/app/api/driver/documents/change-request/route.ts`, `src/app/api/driver/documents/update/route.ts`, `src/app/api/admin/drivers/[id]/change-requests/route.ts`, `src/app/api/admin/drivers/[id]/change-requests/[requestId]/route.ts`, `src/app/api/admin/drivers/[id]/documents/approve/route.ts`, `src/app/api/admin/drivers/[id]/documents/reject/route.ts`, `src/app/api/cron/driver-docs-expiry/route.ts`. **Archivos modificados**: `prisma/schema.prisma`, `src/app/api/admin/users-unified/[id]/route.ts` (select completo de los nuevos triples + expirations + decrypt del CUIT), `src/app/api/auth/register/driver/route.ts`, `src/app/api/auth/activate-driver/route.ts`, `src/app/ops/(protected)/usuarios/[id]/page.tsx`, `src/app/repartidor/registro/RepartidorRegistroClient.tsx`, `src/components/rider/views/ProfileView.tsx`, `src/lib/cron-health.ts` (agregada entrada `driver-docs-expiry`), `src/lib/email.ts`. **Pendiente post-merge**: correr `npx prisma db push && npx prisma generate` local para registrar los 8 triples + 4 pares de expiration/stage + modelo `DriverDocumentChangeRequest`. Sin eso todos los endpoints de documentos tirarán runtime "Unknown field" / "driverDocumentChangeRequest does not exist" al primer call. **TS clean** sobre la rama — únicos errores en el check full son los 3 pre-existentes conocidos (`.next/dev/types/routes.d.ts` TS1010, `.next/dev/types/validator.ts` TS1005, `node_modules/.prisma/client/index.d.ts` TS1005 — todos auto-generados o pending de regenerate). Cero errores en archivos de esta rama. **Regla nueva #5** (extensión de #1 del comercio): aplicable a TODO actor con documentación legal — merchant, driver, seller. Los 4 principios de approval por doc (per-doc status, hard-lock server-side, change-request formal con audit, auto-activación al completar) son obligatorios para cualquier nueva categoría de actor que maneje docs. **Regla nueva #6**: todo doc con vencimiento legal (licencia, seguro, RTO, cédula verde, VTV, habilitación municipal, registro sanitario, carnet manipulador alimentos) DEBE tener (a) campo `<doc>ExpiresAt` en el modelo del actor, (b) campo `<doc>NotifiedStage Int @default(0)` para idempotencia del cron, (c) cron diario registrado en `CRON_EXPECTATIONS` que avise al actor 7/3/1d antes y auto-suspenda al vencer + marque el status como EXPIRED. La vigilancia manual del admin no es opción — somos legalmente responsables si un driver opera con licencia vencida. **Regla nueva #7**: cualquier campo requerido que dependa de otro campo condicional (ej: licencia requerida solo si vehículo motorizado, registro sanitario solo si comercio de alimentos) DEBE expresar esa regla en un helper `getRequiredXFields(condition)` centralizado, consumido por tanto el form client-side como el endpoint server-side como la auto-activación. Nunca repetir la lógica en dos lugares.)

## 2026-04-23 (rama `fix/onboarding-comercio-completo` RESUELTA — 6 issues interconectados del onboarding de comercio en una sola pasada end-to-end. **Síntoma original detectado por Mauro**: documentos subidos durante el registro aparecían como "Cargado/Presentado" en el dashboard del comercio pero como "Sin cargar" en el panel OPS — el registro guardaba la URL en `Merchant.constanciaAfipUrl/habilitacionMunicipalUrl/registroSanitarioUrl` pero el OPS consultaba campos que no existían o estaban desalineados. Auditoría full del flujo reveló 5 issues estructurales adicionales: (1) `Merchant.bankAccount` era un único campo String sin distinguir CBU (22 dígitos + checksum BCRA) de Alias (6-20 alfanuméricos) — un alias inválido pasaba validación; (2) el comercio podía reemplazar un documento ya APROBADO sin ningún lock — suficiente para que el comercio cambie la CBU después de la aprobación y cobre a otra cuenta; (3) OPS solo tenía aprobación/rechazo global del comercio — sin granularidad por documento, el admin no podía pedir "volveme a subir solo la habilitación municipal"; (4) no existía auto-activación cuando los 4-5 documentos requeridos estaban todos aprobados — el admin tenía que acordarse de hacer el click manual; (5) si un comercio necesitaba actualizar un dato aprobado (ej: cambió de banco), no había flujo formal — era por WhatsApp o email, sin trazabilidad. **Arquitectura del fix** (4 capas con defense in depth): (1) **Schema Prisma**: agregados 5 pares `<campo>Status String @default("PENDING") + <campo>RejectionReason String?` en Merchant — `cuitStatus/cuitRejectionReason`, `bankAccountStatus/bankAccountRejectionReason`, `constanciaAfipStatus/constanciaAfipRejectionReason`, `habilitacionMunicipalStatus/habilitacionMunicipalRejectionReason`, `registroSanitarioStatus/registroSanitarioRejectionReason`. Tipo String (no enum) por el patrón histórico del proyecto (approvalStatus, etc.) para evitar migrations rotas. Nuevo modelo `MerchantDocumentChangeRequest` (id/merchantId/field/reason/status PENDING|APPROVED|REJECTED/resolvedBy?/resolvedAt?/adminNote?/createdAt) con índices `[merchantId, status]` y `[merchantId, field]`. Requiere `npx prisma db push && npx prisma generate` post-merge. (2) **Librerías nuevas**: `src/lib/bank-account.ts` con `validateBankAccount(value)` — autodetecta CBU vs Alias por longitud+composición, CBU valida checksum BCRA de los 22 dígitos (ponderación 7-1-3-9-7-1-3-9 + módulo 10 en los 2 dígitos de control por banco + sucursal), Alias valida 6-20 chars `^[A-Z0-9.]+$`. Retorna `{ valid: boolean, kind: "CBU" | "ALIAS" | "INVALID", error?: string }`. `src/lib/merchant-document-approval.ts` con `approveMerchantDocument({merchantId, field, adminId, ctx})` y `rejectMerchantDocument({merchantId, field, adminId, reason, ctx})` — ambas dentro de `$transaction` serializable que (a) actualiza el `<campo>Status` y `<campo>RejectionReason`, (b) inserta AuditLog con action `MERCHANT_DOCUMENT_APPROVED`/`REJECTED` + details JSON con field/reason, (c) en approve, consulta los 5 status post-update y si **todos los requeridos** están APPROVED (registroSanitario solo si category ∈ FOOD_BUSINESS_TYPES) llama `approveMerchantTransition` inline para auto-activar (isActive=true + isVerified=true + approvalStatus=APPROVED + audit `MERCHANT_AUTO_ACTIVATED` con details de qué docs gatillaron). Constante `FOOD_BUSINESS_TYPES = new Set([...12 categorías alimenticias])` exportada para reuso en UI. (3) **Endpoints**: `POST /api/merchant/documents/change-request` (merchant-only, rate limit 5/60s, Zod `{field, reason 10-500 chars}` — valida que el field esté APPROVED y que no exista otra solicitud PENDING para el mismo field, inserta MerchantDocumentChangeRequest, audit `MERCHANT_CHANGE_REQUEST_CREATED`, push al admin). `GET /api/merchant/documents/change-request` devuelve todas las solicitudes del merchant del usuario logueado. `POST /api/admin/merchants/[id]/change-requests/[requestId]/resolve` (admin-only, Zod `{action: "APPROVE" | "REJECT", adminNote?}`) — en APPROVE resetea el campo correspondiente a `<campo>Status: "PENDING"` + `<campo>RejectionReason: null` y para URL docs lo nullea (fuerza re-upload), marca la solicitud como APPROVED con resolvedBy+resolvedAt+adminNote, audit `MERCHANT_CHANGE_REQUEST_APPROVED`. En REJECT solo marca REJECTED + note. `GET /api/admin/merchants/[id]/change-requests` lista todas las solicitudes del merchant. `POST /api/admin/merchants/[id]/documents/[field]/approve` y `/reject` (admin-only) — thin wrappers sobre approve/rejectMerchantDocument. `PATCH /api/merchant/update-docs` extendido: cuando el merchant sube un doc con status PENDING o REJECTED, guarda la URL + resetea status a PENDING; cuando el status es APPROVED, retorna 403 "Documento bloqueado" (hard lock server-side, defense in depth sobre el UI). (4) **UI Merchant** `src/components/comercios/SettingsForm.tsx` — completamente reescrito el DocumentsSection. Tipo `DocStatus = "PENDING" | "APPROVED" | "REJECTED"`, mirror client-side `FOOD_TYPES = new Set([...])` para gatear Registro Sanitario (solo food). 5 tarjetas (`<DocumentRow>`) — CUIT (text), CBU/Alias (text), Constancia AFIP (url), Habilitación Municipal (url), Registro Sanitario (url condicional). Cada tarjeta muestra status chip color-coded (gris "Sin cargar" / amber "En revisión" / verde "Aprobado" / rojo "Rechazado") + ícono `Lock` cuando APPROVED + razón de rechazo en caja roja cuando REJECTED. Si APPROVED: doc bloqueado, se muestra botón amber "Solicitar cambio" que abre `<ChangeRequestModal>` (textarea min 10/max 500 chars con live char counter, role="dialog" aria-modal, click-outside para cerrar, POST al endpoint, feedback inline). Si hay solicitud pendiente para ese field, el botón se deshabilita y muestra "Ya tenés una solicitud pendiente". Sección de solicitudes: tarjetas amber para pendientes (con fecha y reason), `<details>` colapsable para historial (APPROVED/REJECTED). Para fields en PENDING/REJECTED con kind text: input inline + botón "Guardar"/"Actualizar" que llama update-docs. Para kind url: label-as-button "Reemplazar documento" o "Subir documento" con file input oculto. Todo sin prop drilling — `docState` como `Record<DocKey, {value, status, rejectionReason}>` single source. `src/app/comercios/(protected)/configuracion/page.tsx` ahora descifra fiscal data (`decryptMerchantData`) y pasa los valores reales de cuit/bankAccount (no solo booleanos) + los 5 pares status/reason al componente. (5) **UI OPS** `src/app/ops/(protected)/usuarios/[id]/page.tsx` — reemplazada la sección genérica "Documentación" por `<MerchantDocumentsAdmin>` con las mismas 5 tarjetas pero en modo admin: botones inline "Aprobar" / "Rechazar" (este abre prompt de razón) para cada doc, además del visor de cada URL. Segunda sub-sección `<ChangeRequestsAdmin>` lista solicitudes pendientes de este comercio con botones "Aprobar" y "Rechazar (nota)" — la aprobación dispara el reset del campo + notifica al comercio que puede re-subir. Cuando la aprobación del último doc requerido dispara auto-activación, el panel muestra un toast verde "Comercio activado automáticamente — los 4-5 documentos requeridos están aprobados". (6) **Validación CBU/Alias endurecida**: `src/app/api/auth/register/merchant/route.ts` y `/api/auth/activate-merchant` y `/api/merchant/update-docs` ahora pasan el bankAccount por `validateBankAccount()` antes de encriptar. Si `validateBankAccount` retorna `valid: false`, devuelven 400 con el error específico — "CBU inválido: checksum incorrecto" o "Alias inválido: debe tener 6-20 caracteres alfanuméricos y puntos". El formulario de registro (`src/app/comercio/registro/page.tsx`) también valida client-side con el mismo helper para mejor UX. **Emails**: `src/lib/email.ts` agregó plantillas `merchantDocumentApproved(merchantName, fieldLabel)`, `merchantDocumentRejected(merchantName, fieldLabel, reason)`, `merchantAutoActivated(merchantName)` y `merchantChangeRequestResolved(merchantName, fieldLabel, approved)` — todas con el tono habitual de MOOVY. Triggered desde los endpoints admin correspondientes con try/catch fire-and-forget. **Archivos nuevos**: `src/lib/bank-account.ts`, `src/lib/merchant-document-approval.ts`, `src/app/api/admin/merchants/[id]/change-requests/route.ts`, `src/app/api/admin/merchants/[id]/change-requests/[requestId]/resolve/route.ts`, `src/app/api/admin/merchants/[id]/documents/[field]/approve/route.ts`, `src/app/api/admin/merchants/[id]/documents/[field]/reject/route.ts`, `src/app/api/merchant/documents/change-request/route.ts`. **Archivos modificados**: `prisma/schema.prisma`, `src/app/api/admin/users-unified/[id]/route.ts`, `src/app/api/auth/activate-merchant/route.ts`, `src/app/api/auth/register/merchant/route.ts`, `src/app/api/merchant/update-docs/route.ts`, `src/app/comercio/registro/page.tsx`, `src/app/comercios/(protected)/configuracion/page.tsx`, `src/app/ops/(protected)/usuarios/[id]/page.tsx`, `src/components/comercios/SettingsForm.tsx`, `src/lib/email.ts`. **Pendiente post-merge**: correr `npx prisma db push && npx prisma generate` local para registrar los 10 nuevos campos en Merchant + el modelo MerchantDocumentChangeRequest. Sin eso, todos los endpoints de documentos tirarán runtime error "Unknown field" / "merchantDocumentChangeRequest does not exist". **TS clean** sobre los 3 archivos de UI (SettingsForm, configuracion/page, ops/usuarios/[id]/page) — los ~20 errores que aparecen son TODOS Prisma client stale en los archivos server-side (routes + lib/merchant-document-approval), mismo patrón documentado en ramas ISSUE-054/031/032 — resuelve con `prisma generate`. **Regla nueva #1**: cualquier documento/dato aprobado por OPS (fiscal, bancario, habilitante) DEBE quedar hard-locked server-side — el UI nunca es defensa suficiente. El único camino para modificar un dato aprobado es el flujo formal de change-request con auditoría completa. **Regla nueva #2**: cualquier campo que requiera validación específica del país (CBU argentino, CUIT, DNI, patente) DEBE tener su helper de validación en `src/lib/` con test de checksum donde aplique, NUNCA confiar en regex simple del UI. El mismo helper se invoca en TODOS los endpoints que reciben ese campo (registro, activate, update, etc.). **Regla nueva #3**: cuando un flujo multi-step tenga una condición de "todos los pasos completos" (onboarding, verificación, aprobación), la transición final DEBE ser automática dentro de la misma transacción que cierra el último paso — nunca requerir un click admin separado. El admin manual es solo para casos excepcionales, no para el happy path. **Regla nueva #4**: si un usuario tiene que pedir un cambio a un dato aprobado, el flujo DEBE ser formal (modelo + endpoint + audit + notificaciones), nunca via WhatsApp/email/soporte. La trazabilidad legal lo requiere — en caso de disputa, hay que poder mostrar "el comercio pidió el cambio el X, lo aprobó el admin Y el Z".)

## 2026-04-22 (rama `fix/menores-data-ops` RESUELTA — 3 issues de data + operaciones end-to-end en una pasada: ISSUE-032 + ISSUE-029 + ISSUE-026. **ISSUE-032 (zonas excluidas 100% configurables desde OPS)**: reemplaza el hardcode histórico de Costa Susana por un sistema genérico. Schema: `StoreSettings.excludedZonesJson String?` (array JSON con objetos `{id, name, lat, lng, radiusKm, reason, active, createdAt, updatedAt}` — se eligió campo único sobre tabla propia porque Ushuaia tendrá <20 zonas, el overhead de tabla + FK compensa recién a 100+). Requiere `npx prisma db push && npx prisma generate` post-merge. Nuevo `src/lib/excluded-zones.ts`: interfaz `ExcludedZone` + `parseExcludedZones(raw)` (defensa contra JSON corrupto — devuelve array vacío, nunca crashea), `getExcludedZone(lat, lng, zones)` con O(n) Haversine y primer match activo, `validateZoneInput(input)` con rangos: name 1-50 chars, lat/lng válidos, radiusKm 0.1-3km, reason 1-200 chars. Endpoints `GET/POST /api/ops/settings/excluded-zones` y `PATCH/DELETE /api/ops/settings/excluded-zones/[id]` (admin-only, rate limit 30/60s mutaciones). Panel OPS `/ops/zonas-excluidas` (`ExcludedZonesClient.tsx`, 28.5KB): tabla responsive (cards mobile + tabla desktop), modal crear/editar con **mini-mapa Google Maps** — marker draggable + slider de radio con visualización circular en tiempo real, toggle `active` inline por row (permite pausar zona sin borrar historial). Integración defense in depth: `src/app/api/delivery/calculate/route.ts` lee el JSON, parsea, y si el destino cae en zona activa devuelve 409 `{errorCode: "ZONE_EXCLUDED", zoneName, reason}` — el checkout muestra la razón al buyer sin código técnico. `src/app/api/orders/route.ts` re-valida server-side antes de crear la orden (por si el front se saltó el check via request directo). Doble gate garantiza que NINGÚN pedido hacia zona excluida se llegue a crear. **ISSUE-029 (soldCount excluye auto-compras del seller)**: limitación de Prisma: `_count: { select: { orderItems: { where: {...} } } }` NO puede referenciar campos del registro padre (el `userId` del seller en el Listing parent). No hay manera de filtrar "excluir items cuyo `Order.userId === SellerProfile.userId` del Listing" en una sola query Prisma. Fix: nuevo helper `src/lib/listing-counts.ts` exporta `getSoldCountsExcludingAutoPurchases(listingIds): Promise<Map<string, number>>` con una sola query `$queryRaw` + `Prisma.join` que hace JOIN OrderItem → Order → Listing → SellerProfile con filtro `o."userId" <> sp."userId"` y `GROUP BY oi."listingId"`. Short-circuit a `new Map()` si array vacío (evita `IN ()` SQL inválido). Una sola query batch sin importar volumen de listings. Migrado en 3 sitios: `src/app/api/listings/route.ts` (listado general — removed `orderItems` del `_count`, soldCount desde map), `src/app/api/listings/featured/route.ts` (destacados — eliminado el `_count` completo que solo tenía orderItems), `src/app/(store)/marketplace/vendedor/[id]/page.tsx` (perfil del vendedor — mantuvo `favorites` en `_count`, removió orderItems, soldCount desde map). **ISSUE-026 (healthcheck de crons genérico)**: sistema reusable para que el dashboard OPS alerte si cualquier cron registrado no corrió en su ventana esperada. Schema: nuevo modelo `CronRunLog` (id/jobName/startedAt/completedAt/success/durationMs/itemsProcessed/errorMessage) con índices `[jobName, startedAt]` y `[jobName, success, completedAt]`. Requiere `npx prisma db push && npx prisma generate` post-merge. Nuevo `src/lib/cron-health.ts`: wrapper `recordCronRun(jobName, fn)` crea row ANTES de correr `fn`, captura success/error/duración/items y UPDATE al final. Acepta shape `{ result, itemsProcessed }` para tomar el count explícito (ej: `deleteMany().count`) o forma plana. Re-throwea el error original para no ocultar fallas. Config canónica `CRON_EXPECTATIONS: Record<jobName, { maxHours, label }>` — arranca con `"cleanup-location-history": { maxHours: 30, label: "Limpieza de historial GPS" }`. Para un cron nuevo: wrap + agregar entrada acá. `getCronsHealthSummary()` devuelve `CronHealth[]` con status derivado: `healthy` (último success dentro de maxHours), `stale` (último success hace más → warning, runner puede tener hiccup pero data no corrupta), `failing` (último intento terminó con `success: false` → danger), `never-ran` (jamás registrado → danger). Dos queries paralelas por cron (último success + último intento cualquiera) para distinguir stale-por-fallo de stale-por-deploy-nuevo. `src/app/api/cron/cleanup-location-history/route.ts` envuelve el `deleteMany` en `recordCronRun(..., () => ({ result: del, itemsProcessed: del.count }))`. **Defense in depth**: el `verifyBearerToken` queda ANTES de `recordCronRun` — así intentos no autorizados (attackers probando CRON_SECRET) no ensucian el log con runs spurios. `src/app/ops/(protected)/dashboard/page.tsx` importa `getCronsHealthSummary()` con `.catch(() => [])` (safe fallback pre-migración). Loop pushea alerts: `failing` → danger `"Cron X falló en su último intento: <error>"`, `stale` → warning `"Cron X no corre hace Yh (esperado cada Zh)"`, `never-ran` → danger `"Cron X nunca se ejecutó — revisar configuración del runner"`. Link a `/ops/configuracion-logistica`. **Archivos nuevos**: `src/lib/excluded-zones.ts`, `src/lib/listing-counts.ts`, `src/lib/cron-health.ts`, `src/app/api/ops/settings/excluded-zones/route.ts`, `src/app/api/ops/settings/excluded-zones/[id]/route.ts`, `src/app/ops/(protected)/zonas-excluidas/page.tsx`, `src/app/ops/(protected)/zonas-excluidas/ExcludedZonesClient.tsx`. **Archivos modificados**: `prisma/schema.prisma`, `src/app/api/delivery/calculate/route.ts`, `src/app/api/orders/route.ts`, `src/app/api/listings/route.ts`, `src/app/api/listings/featured/route.ts`, `src/app/(store)/marketplace/vendedor/[id]/page.tsx`, `src/app/api/cron/cleanup-location-history/route.ts`, `src/app/ops/(protected)/dashboard/page.tsx`. **Pendiente post-merge**: correr `npx prisma db push && npx prisma generate` local para registrar `StoreSettings.excludedZonesJson` + el modelo `CronRunLog`. Sin eso, el panel de zonas fallará al escribir y el dashboard tirará runtime error al consultar CronRunLog. **TS clean** sobre archivos nuevos/modificados (los errores pre-existentes siguen: `.next/dev/types/*` generados, `node_modules/.prisma/client` pre-generate, `src/app/privacidad/page.tsx` TS1127, `src/types/order-chat.ts` TS1127, `scripts/socket-server.ts` TS1127 — ninguno de esta rama). **Regla nueva #1**: parámetros operativos configurables (zonas, radios, tiempos, mínimos) DEBEN vivir en `StoreSettings`/`MoovyConfig` + OPS UI, NUNCA en constantes del código. Si un admin necesita tocar código para activar/desactivar algo de operaciones, el sistema está mal diseñado. **Regla nueva #2**: cualquier contador público (N vendidos, N favoritos, N pedidos) DEBE auditar el self-reference case — si el dueño del registro puede inflarlo auto-referenciándose, excluirlo explícitamente via raw query o filtro. Confiar en `_count` implícito de Prisma oculta este tipo de bug. **Regla nueva #3**: todo cron nuevo DEBE envolverse en `recordCronRun` + registrarse en `CRON_EXPECTATIONS`. Un cron sin healthcheck es un cron que falla callado — inaceptable si la ausencia de su ejecución degrada la DB o la UX.)

## 2026-04-21 (rama `fix/menores-merchant-driver` RESUELTA — 4 issues end-to-end merchant/driver en una sola pasada: ISSUE-031 + ISSUE-050 + ISSUE-051 + ISSUE-025. **ISSUE-031 (push de bienvenida al primer pedido del merchant)**: schema agregó `Merchant.firstOrderWelcomeSentAt DateTime?` (requiere `npx prisma db push` + `npx prisma generate` local post-merge). Nuevo helper `notifyMerchantFirstOrderWelcome(merchantUserId, merchantName, orderNumber)` en `src/lib/notifications.ts` con title `🎉 ¡Tu primer pedido en MOOVY!`, body `"${merchantName}: recibiste tu primer pedido ${orderNumber}. Confirmalo rápido para que tu comprador se lleve una gran experiencia."` y tag único `merchant-first-order-${merchantUserId}` distinto de `new-order-*` para no colapsar en el lock screen con el push regular. Nuevo helper `tryNotifyMerchantFirstOrderWelcome(merchantId, merchantUserId, merchantName, orderNumber)` en `src/app/api/orders/route.ts` que envuelve el patrón atómico battle-tested: `prisma.merchant.updateMany({where: {id, firstOrderWelcomeSentAt: null}, data: {firstOrderWelcomeSentAt: now}})` + check `count === 1` — solo ganamos la carrera UNA vez aunque dos orders del mismo merchant lleguen casi simultáneas. Si count=0 (ya se envió o race perdido), skipea el push silenciosamente. Invocado desde 4 sitios en la creación de orden (single-vendor cash, single-vendor MP approved, multi-vendor cash por SubOrder, multi-vendor MP approved por SubOrder) con `.catch(err => logger.error(...))` fire-and-forget para no bloquear la respuesta al buyer. **ISSUE-050 (OPS dashboard sin "Max $0" fantasma)**: en `src/app/ops/(protected)/dashboard/page.tsx` las 3 sub-stats del hero card (Ticket promedio, Ticket máximo, Pedidos sin asignar) ahora renderean solo si la stat principal es > 0 — si no hay pedidos hoy no tiene sentido mostrar "Max $0" ni "Ticket promedio $0" ocupando pantalla. Con flag `hasOrders = pedidosHoy > 0` los tres chips secundarios se ocultan completos (`hasOrders && (<div>...</div>)`), dejando solo el número grande de pedidosHoy (0) y un copy más limpio. Un panel con datos reales sigue viéndose igual. **ISSUE-051 (strip superior del driver dashboard)**: nuevo bloque de 3 chips debajo del header, encima del stats grid, en `src/app/repartidor/(protected)/dashboard/page.tsx`. Chips: (a) GPS — ícono `MapPin`, estado dinámico: "GPS activo" (verde, cuando hay `location`), "GPS cacheado" (amber, cuando `lowPowerGps`), "Sin GPS" (rojo, cuando `error` o sin location). Reemplaza el chip "zona" originalmente planeado porque Moovy no tiene helper lat/lng → zona (las zonas A/B/C son solo multiplicadores en el cálculo de fee); el GPS status es operativamente más útil para el driver. (b) Vehículo — emoji + label legible (`vehicleTypeIcon()` + `vehicleTypeToSpanish()` de `@/lib/vehicle-type-mapping`). El endpoint `src/app/api/driver/dashboard/route.ts` ahora expone `vehicleType: driver.vehicleType || null` en el response (evitando un round-trip extra — ya cargábamos el driver). (c) Batería — ícono `Battery` con estados: verde ≥30%, amber <30%, rojo <15%, ícono `Zap` cuando `batteryRaw.charging`. Si `batteryRaw.supported === false` (iOS Safari), el chip no se renderea. Divisores verticales (`w-px h-5 bg-gray-200`) entre chips. **ISSUE-025 (modo ahorro de batería para GPS)**: `src/hooks/useGeolocation.ts` ahora acepta `{ lowPower?: boolean }`. Cuando `lowPower === true`, `navigator.geolocation.watchPosition` recibe `{ enableHighAccuracy: false, maximumAge: 30000, timeout: 15000 }` — deshabilita el GPS hardware (~50mW sostenidos), usa triangulación celular/wifi y permite lecturas cacheadas hasta 30s. La precisión baja de ~5m a ~50m, aceptable para el mini-mapa y para el geofence del PIN de entrega (100m + gracia GPS 50m). El `useEffect` re-ejecuta `watchPosition` cuando `lowPower` cambia (la API nativa no tiene `setOptions`). En `dashboard/page.tsx`: `const batteryRaw = useBattery()` ahora vive arriba del todo (pre-dependencia de useGeolocation), flag derivado `lowPowerGps = batteryRaw.supported && batteryRaw.level !== null && batteryRaw.level < 0.15 && !batteryRaw.charging`, se pasa como `useGeolocation({ lowPower: lowPowerGps })`. Polling del endpoint pasa de 30s a 60s cuando `lowPowerGps` para ahorrar además bandwidth + parseo. Aviso one-shot al driver vía ref: `lowPowerNoticeShownRef.current` + `toast.warning("Batería baja — activamos modo ahorro GPS (ubicación menos precisa) para que sigas trabajando más tiempo.", 6000)` solo la primera vez que cruza el umbral; si la batería vuelve a subir (enchufó) y baja otra vez, NO re-muestra (fatigaría al driver). Duplicación previa de `useBattery()` en línea ~199 reemplazada por `const battery = batteryRaw` (single source). **Archivos nuevos**: ninguno (todos los cambios son extensión de archivos existentes). **Archivos modificados**: `prisma/schema.prisma`, `src/lib/notifications.ts`, `src/app/api/orders/route.ts`, `src/app/ops/(protected)/dashboard/page.tsx`, `src/app/repartidor/(protected)/dashboard/page.tsx`, `src/app/api/driver/dashboard/route.ts`, `src/hooks/useGeolocation.ts`. **Pendiente post-merge**: Mauro debe correr `npx prisma db push && npx prisma generate` local para que el cliente Prisma conozca `Merchant.firstOrderWelcomeSentAt` — sin esto, el primer POST /api/orders tirará "Unknown field". **TS clean** sobre los archivos modificados (los errores que aparecen son los pre-existentes: `.next/dev/types/*` generados, `node_modules/.prisma/client` pendiente, `src/app/privacidad/page.tsx` TS1127, `src/types/order-chat.ts` TS1127, `scripts/socket-server.ts` TS1127 — ninguno de esta rama). **Regla nueva**: cualquier trigger "first-time" del merchant/driver/seller (primer pedido, primer pago recibido, primera calificación, primer retiro) debe usar el mismo patrón atómico `updateMany WHERE flag IS NULL + count === 1` que ISSUE-054/013/031. Nunca `findFirst → if(!flag) send → update` secuencial porque permite doble disparo bajo concurrencia. El flag debe vivir en el modelo del dominio (no en tabla auxiliar) para que la atomicidad sea libre de locks.)

## 2026-04-21 (rama `fix/menores-ux-buyer` RESUELTA — 4 issues UX del buyer en una pasada: ISSUE-028 + ISSUE-048 + ISSUE-049 + ISSUE-030. **ISSUE-028 (EmptyState unificado)**: nuevo componente `src/components/ui/EmptyState.tsx` — único source of truth para estados vacíos en toda la app. Props: `icon` (LucideIcon opcional), `title`, `description`, `primaryCta { label, href?, onClick? }`, `secondaryCta` (mismo shape), `children` (slot para chips/hints), `tone` (`"neutral" | "brand" | "marketplace"`), `size` (`"sm" | "md" | "lg"`), `className`. Internamente: tablas `TONE_STYLES` (iconBg/iconColor/primaryBg/primaryHover — rojo MOOVY para brand, violeta marketplace, gris neutral) y `SIZE_STYLES` (padding + icon box + typography scales). El `CtaButton` interno soporta ambos contratos (href → `<Link>`, onClick → `<button>`). Accesibilidad: `role="status" aria-live="polite"`. Migradas las 3 superficies de mayor impacto: (a) `/mi-perfil/favoritos/page.tsx` — empty state global (tone brand, size lg, CTA dual "Explorar comercios" + "Ver productos") y helper `EmptyTab` reescrito con mapa `ctaByLabel` (comercios→/tiendas, productos→/productos, publicaciones→/marketplace); (b) `/mis-pedidos/page.tsx` — tab "En curso" y "Historial" con titles/descriptions diferenciados y CTAs a /productos + /tiendas; (c) `/store/[slug]/page.tsx` — empty state cuando el merchant no cargó productos, ícono `ShoppingBag` + CTA "Ver otros comercios" → `/tiendas`. **Regla nueva**: todo empty state DEBE ofrecer al menos un CTA. Un empty sin CTA es dead-end por definición — el usuario no tiene próxima acción y abandona. **ISSUE-048 (una sola barra de búsqueda en home)**: en desktop el home mostraba simultáneamente el botón rojo del `HomeHero` y el input central del `AppHeader` — dos CTAs compitiendo visualmente. Mobile ya estaba resuelto porque el hero emite un evento custom `moovy:hero-search-visibility` cada vez que entra/sale del viewport (via IntersectionObserver), y el header mobile escuchaba ese evento para ocultar su buscador compacto. Se extendió el mismo patrón al desktop: el wrapper del input central del `AppHeader` ahora se oculta con transición `opacity-0 + pointer-events-none + invisible` cuando `isHomepage && heroSearchVisible`. Agregado `aria-hidden` al wrapper y `tabIndex={-1}` al input para que sea realmente inaccesible cuando está invisible (no queda en el tab order). Un solo event listener, un solo source of truth visual. En páginas internas (`/tiendas`, `/marketplace`, detail pages, perfil, etc.) el header conserva su buscador siempre visible — la regla aplica exclusivamente al home. **ISSUE-049 (tienda sin "Otros (2)")**: en `store/[slug]/page.tsx` se agregó `FLAT_LIST_THRESHOLD = 5` + flag `useFlatList = totalProducts > 0 && totalProducts < FLAT_LIST_THRESHOLD`. Los productos ahora se normalizan primero (`normalizedProducts` con `image + merchantId + merchant.isOpen` respetando el estado real del horario) y SOLO se agrupan por categoría si `!useFlatList`. La sticky de pills solo se renderiza si hay más de una categoría (`!useFlatList && categories.length > 1`). Cuando `useFlatList === true`, rendereamos una única grilla de `<ProductCard>` sin headers per-category, sin contadores, sin pills — un layout limpio para merchants que recién arrancan con 1-4 productos. Evita el patrón "Otros (2)" que se lee experimental y sucio. **ISSUE-030 (marketplace header sin contadores vacíos)**: en `marketplace/page.tsx` stats row del hero. Agregada constante `SHOW_STATS_COUNTS_AT = 10` + flag `showHardStats = heroTotal >= SHOW_STATS_COUNTS_AT`. Si estamos arriba del umbral, se mantienen las dos pills duras (publicaciones + categorías) + "Compra protegida". Si estamos debajo, caen a un copy suave: ícono `Users` + texto "Publicaciones de vecinos" + "Compra protegida". Evita que en early-stage (ej: 5 publicaciones reales contra 18 categorías seed vacías) el header transmita "plataforma vacía" al buyer nuevo — los números aparecen solos cuando realmente valen la pena. **Archivos nuevos**: `src/components/ui/EmptyState.tsx`. **Archivos modificados**: `src/components/layout/AppHeader.tsx`, `src/app/(store)/mi-perfil/favoritos/page.tsx`, `src/app/(store)/mis-pedidos/page.tsx`, `src/app/(store)/store/[slug]/page.tsx`, `src/app/(store)/marketplace/page.tsx`. **TS clean** sobre todos los archivos modificados (los errores que aparecen son los pre-existentes: `.next/dev/types/*` generados, `node_modules/.prisma/client`, `src/app/privacidad/page.tsx` TS1127, `src/types/order-chat.ts` TS1127, `scripts/socket-server.ts` TS1127 — ninguno de esta rama). **Regla nueva**: cuando un componente muestra contadores de catálogo/inventario en pantallas de entrada (home, marketplace, categoría), siempre gatearlos por volumen mínimo razonable — "3 publicaciones" se lee peor que un copy cualitativo. Mostrar números duros solo cuando hay señal de actividad real.)

## 2026-04-21 (rama `fix/menores-seguridad` RESUELTA — ISSUE-024 + ISSUE-027 cerrados en una sola pasada de seguridad. **ISSUE-024 (puntos race condition)**: `recordPointsTransaction` en `src/lib/points.ts` ahora corre con `{ isolationLevel: "Serializable" }`. Síntoma teórico previo: si un mismo user gasta puntos desde dos tabs/dispositivos simultáneos, ambas transacciones leían el mismo `pointsBalance` y persistían dos updates con el mismo `newBalance` — efectivamente regalando puntos al user y descontando solo uno de los dos pedidos. Con Serializable, una de las dos transacciones falla con P2034 (serialization failure) y se reintenta hasta 3 veces con backoff lineal (50/100/150ms). Después de 3 intentos retorna `false` y el caller decide cómo manejarlo (típicamente: error al user, que reintenta). Constantes `POINTS_TX_MAX_RETRIES=3`, `POINTS_TX_RETRY_BASE_MS=50` exportadas implícitamente vía top-level. Detección de P2034 hecha defensivamente: chequea `error.code === "P2034"` + `error.meta?.code === "40001"` + regex `/could not serialize/i` sobre `error.message` — Prisma tiene historial de cambiar el shape del error entre versiones. **ISSUE-027 (reset-password timing-safe)**: defense in depth en 2 capas. (1) `src/app/api/auth/forgot-password/route.ts` ahora hashea el token con `sha256` ANTES de guardarlo en `User.resetToken`. El token plaintext SOLO viaja por email (en el `resetLink`). Si la DB se filtra, los tokens activos no sirven al atacante porque solo tiene el hash. (2) `src/app/api/auth/reset-password/route.ts` hashea el token recibido, busca el user con `where: { resetToken: hash, resetTokenExpiry: { gt: now } }`, y luego hace `crypto.timingSafeEqual(Buffer.from(user.resetToken, "hex"), Buffer.from(tokenHash, "hex"))` — incluso aunque la query Prisma ya filtró, comparamos hashes byte-a-byte en tiempo constante para evitar cualquier side channel residual del WHERE clause (cache hits, B-tree lookups, etc.). Helper local `timingSafeEqualHex(a, b)` con guard de longitud + try/catch alrededor de `Buffer.from(.., "hex")` por si el input no es hex válido. Validación de input también endurecida: `typeof token !== "string"` ahora rechaza temprano. **Pendiente operativo post-deploy**: los tokens activos generados antes del deploy (máximo 1h de vida) dejan de funcionar porque están guardados en plaintext y la nueva validación los hashea — los ≤5 usuarios afectados deben pedir un nuevo reset. Aceptable porque la ventana de deploy es chica y reset-password es low-volume. **Archivos modificados**: `src/lib/points.ts`, `src/app/api/auth/forgot-password/route.ts`, `src/app/api/auth/reset-password/route.ts`. **TS clean** (solo errores pre-existentes). **Regla nueva**: cualquier token de uso único (reset-password, magic links, invite codes, OAuth state) debe almacenarse hasheado en DB. El plaintext es ephemeral y solo debe existir en el canal donde se entrega al user (email/SMS/URL). La validación siempre debe usar `crypto.timingSafeEqual` sobre buffers de la misma longitud, nunca `===` directo.)

## 2026-04-21 (rama `feat/home-accesos-favorito` RESUELTA — ISSUE-012 accesos directos a Favoritos y Puntos MOOVER desde la home. **Síntoma / motivación**: Favoritos no tenía acceso directo desde ningún lado (estaba enterrado en `/mi-perfil/favoritos`, el usuario tenía que ir a perfil → bajar → favoritos, 3 taps); Puntos sí tenía acceso desde el BottomNav (botón central con estrella) y desde el AppHeader pero el usuario no veía el balance hasta entrar al detalle. Ambas son señales de personalización que aumentan la retención — si el usuario ve "1.250 pts · Canjealos" en el home, sabe que tiene algo que perder y vuelve. **Arquitectura**: (1) Nuevo componente `src/components/home/QuickAccessRow.tsx` (Server Component): lee `auth()` → si hay userId hace UNA query a `prisma.user.findUnique` con `select: { pointsBalance: true, _count: { select: { favorites: true } } }` (select explícito, cero N+1). Try/catch alrededor: si la query falla (DB down, user deleted mid-session), cae silenciosamente al estado deslogueado — el home NUNCA se rompe por este widget. (2) Render: `<section>` con `<div className="grid grid-cols-2 gap-3 lg:gap-4">` — 2 cards lado a lado en mobile-first, sin wrap en desktop. **Card Favoritos**: gradiente `from-rose-50 to-red-50`, círculo rojo MOOVY `#e60012` con `<Heart fill="white">` en blanco, hover `border-rose-200 + shadow-md + scale-110` en el icono. **Card Puntos MOOVER**: gradiente `from-amber-50 to-orange-50`, círculo gradient `from-amber-400 to-orange-500` con `<Star fill="white">` en blanco. Ambas con `<ArrowRight>` sutil al lado del título que se mueve 0.5 al hover. Active state `scale-[0.98]` para feedback táctil. (3) Textos dinámicos por cardinalidad — Favoritos logueado: 0 guardados → "Aún no guardaste ninguno. Tocá el ❤ en tus comercios.", 1 → "1 guardado · Entrá rápido a tu comercio", N → "N guardados · Entrá rápido a ellos"; Puntos logueado: 0 → "Sumá con cada pedido · 10 pts por cada $1.000", N → "N pts · Canjealos en tu próxima compra" (usa `toLocaleString("es-AR")` para formato "1.250"). Deslogueado: CTAs genéricos con `href` `/login?redirect=<destino>` para que vuelva al lugar correcto post-login. (4) `aria-label` compuesto con title+subtitle para lectores de pantalla, touch targets ≥44px (card completa es clickeable), `line-clamp-2` en el subtítulo para prevenir desborde en textos largos. (5) Integración en `src/app/(store)/page.tsx`: import arriba, invocación envuelta en `<AnimateIn animation="reveal">` entre `<HomeFeed>` y el bloque de `<CategoryGrid>` — primera fila visible después del hero/filtros, alta descubribilidad pero sin tapar el contenido principal. **Scope intencional**: el componente es async Server Component porque necesita `auth()` + 1 query; si bloquea el render del home sería un problema, pero como es la segunda sección (después de HomeFeed que ya es dinámico) y es una query trivial (<5ms), no empeora el TTFB. No usamos `Suspense` boundary porque agregar un fallback visual sería más disrupción que el tiempo que ahorra. **Archivos nuevos**: `src/components/home/QuickAccessRow.tsx`. **Archivos modificados**: `src/app/(store)/page.tsx` (import + insertion). **TS clean** (solo errores pre-existentes: `.next/dev/types/*` generados + `src/types/order-chat.ts` TS1127 + `scripts/socket-server.ts` TS1127 + `src/app/privacidad/page.tsx` TS1127 + `node_modules/.prisma/client` pendiente de regenerate). **Regla nueva**: accesos de personalización (favoritos, puntos, direcciones, pedidos recientes) deben tener entry points en el home, no solo en `/mi-perfil`. La home es la primera pantalla que ve el usuario al abrir la app — cualquier señal "tenés algo tuyo acá" aumenta retención.)

## 2026-04-21 (rama `retry-cron-escalation` RESUELTA — ISSUE-015 auto-cancelación final del cron de retry. **Síntoma / motivación**: el cron `retry-assignments` (corre cada 5min) SÍ reintentaba la asignación hasta `MAX_RETRIES = 3` y después escalaba a admin via `notifyAdminOfStuckOrder`, pero NO cerraba el flujo: el pedido quedaba `CONFIRMED` indefinidamente sin driver, el buyer miraba el mapa sin entender qué pasaba, el dinero del MP seguía retenido y nadie le daba un bonus compensatorio. Consecuencia operativa: admin tenía que cancelar manualmente desde OPS, refund manual desde MP panel, bonus manual — 4-5min de trabajo humano por incidente + exposición reputacional. **Arquitectura del fix** (idempotente, defense in depth): (1) En `src/app/api/cron/retry-assignments/route.ts` se agregó `AUTO_CANCEL_THRESHOLD = 6` (~30min de espera total con cron cada 5min: 3 retries propios + 3 retries admin-notified sin éxito) + constantes `AUTO_CANCEL_REASON = "No conseguimos repartidor disponible para tu pedido"` y `AUTO_CANCEL_BONUS_POINTS = 500`. (2) Nueva función `autoCancelStuckOrder(orderBrief, attempts)` que encapsula el cierre completo: primero `prisma.$transaction` atómico que marca Order como `CANCELLED` + `cancelReason` + `adminNotes` con timestamp, apaga SubOrders `updateMany`, restaura stock iterando items (product o listing `increment`), libera `driverId`/`pendingDriverId` (defensivo) y borra `PendingAssignment`; después en secuencia con try/catch individual: (a) si el pedido era `paymentMethod: mercadopago && paymentStatus: PAID` busca el `Payment` con `mpStatus: approved` y dispara `createRefund(mpPaymentId)` — on success actualiza `order.paymentStatus: REFUNDED` + `payment.mpStatus: refunded` con detail descriptivo, on failure emite `refund_failed` a `admin:orders` para que admin lo resuelva manual, (b) `reverseOrderPoints(orderId, reason)` para devolver REDEEM al buyer (idempotente via `Order.pointsEarned/pointsUsed` — nunca dobla reversión), (c) `recordPointsTransaction(userId, "BONUS", 500, description, orderId)` para otorgar el bonus compensatorio, (d) `notifyBuyerOrderAutoCancelled(userId, orderNumber, orderId, bonusAwarded, wasRefunded)` — nuevo helper en `src/lib/notifications.ts` con title `😔 No encontramos repartidor`, body dinámico que incluye las líneas "Te devolvimos el pago" (si refund OK) y "Te regalamos 500 puntos MOOVER por la espera" (si bonus OK), tag `order-autocancelled-${orderNumber}` (distinto de `order-cancelled` para que no colapse el push en el lock screen con una cancelación manual previa del merchant/buyer), (e) sockets `order_cancelled` con flag `auto: true` + `refunded` + `bonusAwarded` + `attempts` a `merchant:${merchantId}`, `admin:orders` y `customer:${userId}`. (3) Loop principal modificado en `POST`: agregada una nueva rama `if (assignmentLogs.length >= AUTO_CANCEL_THRESHOLD)` ANTES del `if (assignmentLogs.length >= MAX_RETRIES)` — cuando hay ≥6 intentos fallidos invoca `autoCancelStuckOrder` en try/catch (si tira excepción se loguea pero el cron sigue con las demás órdenes), y después llama igualmente a `notifyAdminOfStuckOrder` con mensaje completo que incluye refund status + bonus, para que el panel OPS mantenga visibilidad del incidente. Contador `autoCancelled` agregado al response JSON. **Defense in depth**: el `$transaction` ya garantiza el cierre del pedido aunque fallen después refund/points/push — el pedido queda `CANCELLED` sin importar qué side effect falló, y los logs + socket `refund_failed` permiten recovery manual. **Idempotencia end-to-end**: una vez `CANCELLED`, el `where: { status: "CONFIRMED" }` del query inicial del cron excluye la orden de runs futuros. El auto-cancel NO corre si `fullOrder.status === "CANCELLED" || "DELIVERED"` (early return). `reverseOrderPoints` y `recordPointsTransaction` son idempotentes via `pointsEarned/pointsUsed`. **Scope intencional**: single-vendor Orders en `stuckOrders` query. Multi-vendor SubOrder auto-cancel queda para fase 2 porque el refund parcial (cancelar 1 de 3 vendedores con un solo pago MP) requiere lógica de prorrateo que no existe aún en el codebase — admin lo maneja manual por ahora. **Archivos modificados**: `src/app/api/cron/retry-assignments/route.ts`, `src/lib/notifications.ts`. **TS clean** (los únicos errores son los pre-existentes: `node_modules/.prisma/client`, `.next/dev/types/*` generados, `src/types/order-chat.ts` TS1127, `scripts/socket-server.ts` TS1127, `src/app/privacidad/page.tsx` TS1127). **Regla nueva**: cualquier cron de retry/escalación debe tener un "floor" de auto-resolución automática — no dejar al buyer esperando indefinidamente ni empujar el trabajo a admin manual. Umbral recomendado: 2× el umbral de escalación (o 30min absolutos, lo que sea menor). El auto-cierre debe incluir refund, reversión de puntos, bonus compensatorio y push — el buyer merece cierre limpio aunque falle la capa de asignación.)

## 2026-04-21 (rama `feat/push-repartidor-cerca` RESUELTA — ISSUE-013 push "tu repartidor está cerca". **Síntoma / motivación**: el buyer sabe cuando su pedido entra a IN_DELIVERY (push genérico de "está en camino") pero se queda mirando el mapa hasta que el driver toca timbre. En Ushuaia hace -5°C, queremos que el buyer pueda calentar la comida / tener cambio listo / prepararse cuando el driver está realmente por llegar. Complementa el PIN de entrega (ISSUE-001): el push de proximidad recuerda el código justo cuando lo va a necesitar. **Arquitectura**: (1) Schema Prisma: nuevo campo `nearDestinationNotified Boolean @default(false)` agregado a `Order` (single-vendor) Y `SubOrder` (multi-vendor: cada SubOrder tiene su driver independiente, cada uno dispara su push). Requiere `npx prisma db push` + `npx prisma generate` local post-merge. (2) `src/lib/notifications.ts` — nueva función `notifyBuyerDriverNear(userId, orderNumber, orderId, deliveryPin?)` con title `🏍️ Tu repartidor está cerca` y body dinámico: si tenemos `deliveryPin` (pedido ya PICKED_UP, lo normal) → `"Tené listo el código de entrega: XXX XXX"`; si no (edge case) → `"Tu pedido ${orderNumber} está por llegar. Revisá la app."`. Tag `order-near-${orderNumber}` distinto de `order-pin-*` e `order-in_delivery` para NO colapsar con pushes previos en el lock screen (el buyer los ve acumulados). Deep link a `/mis-pedidos/${orderId}`. (3) `src/lib/driver-proximity.ts` (NUEVO) — helper `checkAndNotifyNearDestination({driverId, driverLat, driverLng})`. Constantes: `NEAR_DESTINATION_METERS = 300` (Biblia UX: ≈3-5 min caminando en Ushuaia), `DELIVERY_ACTIVE_STATES = ["PICKED_UP", "IN_DELIVERY"] as const`. Dos paths en secuencia: **Path 1 (single-vendor)** `prisma.order.findMany({where: {driverId, deliveryStatus in ACTIVE_STATES, nearDestinationNotified: false, deletedAt: null}, take: 10})` con include de `address.{latitude,longitude}` + `deliveryPin`. Para cada order calcula `calculateDistance(driverLat, driverLng, destLat, destLng) * 1000` y si < 300m hace `prisma.order.updateMany({where: {id, nearDestinationNotified: false}, data: {nearDestinationNotified: true}})` ATÓMICO — solo si `update.count === 1` (ganamos la carrera, ningún otro request disparó) llamamos a `notifyBuyerDriverNear`. **Path 2 (multi-vendor)** mismo patrón sobre `prisma.subOrder.findMany({where: {driverId, deliveryStatus in ACTIVE_STATES, nearDestinationNotified: false, order: {deletedAt: null}}, take: 10})` con include de `order.{id, userId, orderNumber, address}` + `deliveryPin` a nivel SubOrder (multi-vendor tiene PINs por SubOrder). Un buyer con 3 vendedores recibe hasta 3 pushes — uno por cada driver que cruza el radio. Errores se loguean con `console.error` y nunca throwean (fire-and-forget). (4) `src/app/api/driver/location/route.ts` — después del update exitoso de coords + history, se invoca `checkAndNotifyNearDestination({driverId, driverLat: latitude, driverLng: longitude}).catch(err => console.error(...))` FIRE-AND-FORGET. El handler devuelve la respuesta HTTP sin esperar el check (crítico: la UI del driver dashboard pollea GPS cada 10s, no puede bloquearse por un push fallido). **Defensa de concurrencia**: el patrón `updateMany WHERE flag=false` es el mismo usado en ISSUE-054 (`DriverAvailabilitySubscription.notifiedAt`) — si dos updates GPS llegan casi simultáneos y ambos ven el flag en false, solo el primero gana (count=1), el segundo ve count=0 y skipea el push. Cero duplicados sin necesidad de transaction ni lock. **Cap de queries**: `take: 10` por path porque un driver no debería tener >10 entregas activas simultáneas (smart batching limita a 3-4 normalmente); el cap previene que una race condition crónica genere queries largas. **Idempotencia end-to-end**: una vez notificado, `nearDestinationNotified: true` impide cualquier re-push aunque el driver salga y vuelva al radio (común en Ushuaia con calles con poca señal). Si se quisiera resetear (ej: pedido devuelto al comercio por problema), habría que resetear el flag manualmente desde OPS, pero ese flujo no es común. **Archivos modificados**: `prisma/schema.prisma`, `src/lib/notifications.ts`, `src/app/api/driver/location/route.ts`. **Archivos nuevos**: `src/lib/driver-proximity.ts`. **TS clean** en los archivos nuevos/modificados (los errores pre-existentes de `.next/dev/types/*` generados + `src/app/privacidad/page.tsx` TS1127 + `src/types/order-chat.ts` TS1127 + `scripts/socket-server.ts` TS1127 + `node_modules/.prisma/client` pendiente de regenerate son los mismos que quedaron de las ramas anteriores, no de ésta). **Pendiente post-merge**: Mauro debe correr `npx prisma db push && npx prisma generate` local para que el cliente Prisma conozca `nearDestinationNotified` — sin esto, el código tirará runtime error "Unknown field" al primer GPS update del driver. **Regla nueva**: cualquier notificación post-pedido que tenga una transición "one-time" (one-shot: se dispara UNA vez y no se repite) debe usar el patrón `flag: false` + `updateMany WHERE flag: false` + check `count === 1` antes de disparar el side effect. Nunca usar `findFirst` → `if(!flag) send → update` secuencial porque permite doble disparo bajo concurrencia.)

## 2026-04-21 (rama `fix/chat-multidireccional` RESUELTA — chat orden multidireccional completo. Hasta ahora el OrderChat solo soportaba BUYER_MERCHANT, BUYER_DRIVER y BUYER_SELLER (buyer-céntrico). Problema: en multi-vendor el buyer veía UN solo card "Chat con vendedor" aunque el pedido tuviera 3 sellers, y el driver no tenía forma de coordinar con el comercio ni con los vendedores marketplace. **Arquitectura**: (1) Schema `OrderChat` ya tenía los enums `DRIVER_MERCHANT` y `DRIVER_SELLER` + campo `subOrderId` desde el WIP previo (commit `ddfd78f9`) — esta rama solo completa la UI de los 4 portales. (2) Buyer en `src/app/(store)/mis-pedidos/[orderId]/page.tsx`: reemplazado el card único de vendedor por un `map` sobre `order.subOrders?.filter(so => so.seller)` que monta UN `OrderChatPanel` por SubOrder con `subOrderId={so.id}` — ahora el buyer ve una card de chat por cada vendedor marketplace presente en el pedido. (3) Driver dashboard backend `src/app/api/driver/dashboard/route.ts`: el include de `activeOrders` ahora trae `subOrders: { id, driverId, seller: { id, displayName, userId } }`. El helper formateador agrega dos campos al response: `hasMerchant: !!order.merchant?.name` (para decidir si mostrar chat DRIVER_MERCHANT — en marketplace-only puede ser null) y `sellersEnPedido: Array<{subOrderId, sellerName}>` filtrado por `so.driverId === driver.id || !so.driverId` (un driver solo ve los vendedores cuyas SubOrders le fueron asignadas o en single-vendor delivery donde el driver está a nivel Order). Además se empezó a devolver `orderNumber` como campo distinto del display `orderId` para poder pasarlo al `OrderChatPanel` limpio. (4) Driver UI `src/app/repartidor/(protected)/dashboard/page.tsx`: fix de bug pre-existente — el chat BUYER_DRIVER pasaba `pedidoActivo.orderId` (display ID tipo "MOV-1234" que venía del `order.orderNumber || order.id.slice(-6)`) cuando el endpoint `/api/order-chat` espera el Prisma `id` cuid. Corregido a `pedidoActivo.id`. Agregados DRIVER_MERCHANT (condicional a `hasMerchant`) y DRIVER_SELLER (map sobre `sellersEnPedido` con `subOrderId`). La interface local `Order` extendida con `hasMerchant?: boolean` y `sellersEnPedido?: Array<{subOrderId, sellerName}>`. (5) Merchant UI `src/app/comercios/(protected)/pedidos/page.tsx`: el contenedor de chats cambió a `flex flex-wrap gap-2`. Agregado `DRIVER_MERCHANT` condicional a `order.driver?.user?.name` (solo aparece cuando el pedido ya fue asignado a un driver). (6) Seller backend `src/app/api/seller/orders/route.ts`: el include del `prisma.subOrder.findMany` ahora trae `driver` a nivel SubOrder (multi-vendor: cada SubOrder tiene driver propio, usado principalmente para el chat DRIVER_SELLER) + en `order.*` ahora vienen `id` y `driver` (fallback single-vendor cuando la SubOrder no tiene driver propio pero el Order sí). (7) Seller UI `src/app/vendedor/(protected)/pedidos/page.tsx`: interface `SubOrder` extendida con `driver?: { id, user: { name } }` y `order.driver?: ...`. Bloque de chats cambiado a `flex flex-wrap gap-2` con dos panels: `BUYER_SELLER` (bug histórico fixed: antes NO tenía `subOrderId`, ahora sí — el vendedor abría un chat compartido entre todos los pedidos del buyer con él en vez de scopeado a la SubOrder) y el nuevo `DRIVER_SELLER` (solo aparece cuando `sub.driver || order.driver` está presente, usa `subOrderId={order.id}` de la SubOrder). **Scoping de multi-vendor**: todos los chats no-BUYER_MERCHANT ahora llevan `subOrderId` — un pedido multi-vendor genera N chats independientes (uno por cada par seller/driver × SubOrder). Un pedido single-vendor sigue funcionando porque el API normaliza null/undefined en el lado del resolver. **Archivos modificados**: `src/app/(store)/mis-pedidos/[orderId]/page.tsx`, `src/app/api/driver/dashboard/route.ts`, `src/app/repartidor/(protected)/dashboard/page.tsx`, `src/app/comercios/(protected)/pedidos/page.tsx`, `src/app/api/seller/orders/route.ts`, `src/app/vendedor/(protected)/pedidos/page.tsx`. **Archivos del WIP previo (ya commiteados en `ddfd78f9`, no modificados en esta rama)**: `src/types/order-chat.ts` (enum + quick responses), `src/app/api/order-chat/route.ts` (POST/GET con resolveParticipants multi-rol), `src/app/api/order-chat/[chatId]/route.ts`, `src/app/api/order-chat/existing/route.ts`, `src/components/orders/OrderChatPanel.tsx` (soporte 5 chatTypes + paleta emerald para DRIVER_*), `src/lib/order-chat-notify.ts` (push + socket per-chatType), `scripts/socket-server.ts`. **TS clean** (0 errores sobre todo el repo con `npx tsc --noEmit --skipLibCheck`). **Regla nueva**: cualquier nuevo `OrderChatPanel` en multi-vendor DEBE pasar `subOrderId` de la SubOrder correspondiente. Sin ese scope, los mensajes de vendedores distintos en el mismo pedido se mezclan en un único chat.)

## 2026-04-21 (rama `fix/privacy-policy-aaip-compliance` RESUELTA — compliance integral Ley 25.326 + AAIP. **Síntoma**: pre-launch audit legal detectó que la plataforma no cumplía con varios requisitos de la Ley de Protección de Datos Personales de Argentina y la Resolución 47/2018 de AAIP: faltaba banner de cookies granular, no había endpoint de export (ARCO acceso/portabilidad), no se registraba el consentimiento con versión/IP/timestamp (auditable), no existía flujo de opt-in marketing separado (Ley 26.951 "No Llame"), no había panel de privacidad para que el user vea/revoque sus consentimientos, y los formularios de registro no pedían confirmación explícita de mayoría de edad. **Arquitectura del fix** (7 fases): (1) Schema Prisma: nuevo modelo `ConsentLog` (id/userId/consentType/version/action/ipAddress/userAgent/details/acceptedAt, índices `[userId,consentType]` y `[acceptedAt]`, cascade onDelete). Campos nuevos en `User`: `termsConsentVersion`, `privacyConsentVersion`, `age18Confirmed` (default false), `marketingConsent` (default false), `marketingConsentAt?`, `marketingConsentRevokedAt?`, `cookiesConsent?` (JSON), `cookiesConsentAt?`. Campo `acceptedPrivacyAt?` en `Driver` y `SellerProfile`. Requiere `npx prisma db push` + `npx prisma generate` local. (2) `src/lib/legal-versions.ts`: constantes canónicas `PRIVACY_POLICY_VERSION="2.0"`, `TERMS_VERSION="1.1"`, `COOKIES_POLICY_VERSION="1.1"`, `MARKETING_CONSENT_VERSION="1.0"` + enums `CONSENT_TYPES` (TERMS/PRIVACY/MARKETING/COOKIES) y `CONSENT_ACTIONS` (ACCEPT/REVOKE). Regla: solo bumpear versiones acá, nunca hardcodear en otros archivos. (3) `src/lib/consent.ts`: helper `recordConsent({userId, consentType, version, action, request, details})` que hace INSERT inmutable en `ConsentLog` extrayendo IP de `x-forwarded-for` (o `x-real-ip` fallback) y User-Agent (trunca a 500 chars). Nunca update — el log es append-only para auditoría AAIP. (4) Banner de cookies `src/components/legal/CookieBanner.tsx`: client component montado en `(store)/layout.tsx`, 3 acciones (Aceptar todas / Rechazar no esenciales / Configurar). Panel de settings con toggle por categoría (Essential siempre ON y disabled, Functional, Analytics, Marketing). Storage `localStorage.moovy_cookies_consent_v1`. Endpoint `POST /api/cookies/consent` (rate limit 10/60s, Zod `{essential: true, analytics, functional, marketing}`) que persiste en `User.cookiesConsent` + `recordConsent({consentType:"COOKIES"})` si está logueado, o 200 para client-side storage si no. (5) Export ARCO `GET /api/profile/export-data`: rate limit 3/10min, devuelve JSON descargable `moovy-datos-<userId>-<fecha>.json` con bloques `datosPersonales`, `direcciones`, `pedidos` (con items, SubOrders, delivery info), `transaccionesDePuntos`, `favoritos`, `suscripcionesPush`, `referidos`, `consentimientos` (todo el ConsentLog del user), `perfilRepartidor`, `comerciosPropios`, `perfilVendedor`. Loguea `USER_DATA_EXPORTED` en audit. Es el ejercicio del derecho de acceso (Art. 14) y portabilidad (Art. 19 bis). (6) Forms de registro actualizados: `auth/register/route.ts` (buyer) ahora valida `acceptTerms`, `acceptPrivacy`, `age18Confirmed` (400 si falta). Persiste `termsConsentAt/Version`, `privacyConsentAt/Version`, `age18Confirmed: true`, `marketingConsent` y `marketingConsentAt` (condicional). Llama `recordConsent` para TERMS, PRIVACY y opcionalmente MARKETING después del $transaction (try/catch — si falla el log, el registro no se tumba). Mismo pattern aplicado a `auth/register/driver/route.ts`, `auth/register/merchant/route.ts` (PATH B new user escribe los 4 campos de versión), y `auth/activate-seller/route.ts` (nuevo campo `acceptedPrivacy` requerido en body, valida + persiste + log). UI del `(store)/registro/page.tsx` (buyer) agrega checkbox obligatorio "Confirmo que soy mayor de 18 años" y checkbox opcional "Quiero recibir ofertas y novedades por email/push". Merchant/driver/seller UIs ya tenían ambos checkboxes, solo se ajustó el API consumer del `VendedorRegistroClient.tsx` para mandar `acceptedPrivacy: true`. (7) Panel de privacidad `src/app/(store)/mi-perfil/privacidad/page.tsx`: 5 secciones — banner ARCO, exportar datos (botón descarga), consentimientos vigentes (cards con versión + fecha + badge "Al día"/"Revisar vX.X" con link a /terminos o /privacidad; card marketing con toggle activar/revocar; card cookies con link a /cookies), historial de consentimientos (lista últimos 50 eventos del ConsentLog con badge color-coded Aceptó/Revocó/Actualizó + fecha + IP), contacto DPO `privacidad@somosmoovy.com`, y eliminar cuenta (link a `/mi-perfil/datos` que ya tiene el flujo). Endpoint `src/app/api/profile/privacy/route.ts`: GET devuelve `{current: {terms, privacy, marketing, cookies, age18Confirmed}, history: ConsentLog[]}` con flag `upToDate` calculado por versión latest vs aceptada. PATCH con Zod `{marketingConsent: boolean}` que actualiza `User.marketingConsent/marketingConsentAt/marketingConsentRevokedAt` + inserta `ConsentLog` con action ACCEPT o REVOKE. Rate limit 10/60s. Nuevo link "Privacidad y Datos" en `/mi-perfil` (icono Shield emerald) debajo de Favoritos. Página `/cookies` actualizada a v1.1 con banner gradient que explica el control del user y link al panel de privacidad. **Archivos nuevos**: `src/lib/legal-versions.ts`, `src/lib/consent.ts`, `src/components/legal/CookieBanner.tsx`, `src/app/api/cookies/consent/route.ts`, `src/app/api/profile/export-data/route.ts`, `src/app/api/profile/privacy/route.ts`, `src/app/(store)/mi-perfil/privacidad/page.tsx`. **Archivos modificados**: `prisma/schema.prisma`, `src/app/api/auth/register/route.ts`, `src/app/api/auth/register/driver/route.ts`, `src/app/api/auth/register/merchant/route.ts`, `src/app/api/auth/activate-seller/route.ts`, `src/app/(store)/registro/page.tsx`, `src/app/vendedor/registro/VendedorRegistroClient.tsx`, `src/app/(store)/layout.tsx`, `src/app/(store)/mi-perfil/page.tsx`, `src/app/cookies/page.tsx`. **Regla nueva**: cualquier cambio a documentos legales (terms/privacy/cookies/marketing) DEBE (a) bumpear la constante en `src/lib/legal-versions.ts`, (b) mostrar al user el banner "Revisar vX.X" en el panel de privacidad, (c) pedir re-aceptación si el cambio es material (no typos). El historial en `ConsentLog` es la prueba legal de qué versión aceptó cada user — nunca update, solo insert. **TS clean** para los archivos nuevos/modificados de AAIP (los 3 errores pre-existentes son `src/types/order-chat.ts` y `scripts/socket-server.ts` con TS1127 chars inválidos — no parte de esta rama — y `node_modules/.prisma/client` pendiente de `prisma generate`). **Pendiente post-merge**: Mauro debe correr `npx prisma db push && npx prisma generate` local para regenerar el cliente con el nuevo modelo `ConsentLog` + campos nuevos en `User`/`Driver`/`SellerProfile`.)

## 2026-04-21 (rama `user-deletion-no-resurrection` RESUELTA — bug crítico de resurrección de cuentas, ISSUE-060. **Síntoma detectado por Mauro**: eliminó un usuario desde OPS, el mismo usuario volvió a registrarse con el mismo mail, y el sistema le trajo TODA su data vieja (comercios aprobados, productos, fiscal data, tokens MP). **Causa raíz**: `src/app/api/auth/register/route.ts` tenía un code path "reactivar" que, si detectaba un `User` con `deletedAt != null` en el email consultado, hacía `tx.user.update({deletedAt: null, password: nuevo, ...})` y seguía — PERO sin tocar los `Merchant`/`Driver`/`SellerProfile` colgados del `ownerId` viejo. Resultado: el registro "nuevo" quedaba con los comercios aprobados, fiscal data encriptada (cuit/cbu/cuil/ownerDni), `mpAccessToken/mpRefreshToken/mpUserId/mpEmail`, órdenes históricas y productos intactos. **Arquitectura del fix** (defense in depth, 4 capas): (1) `auth/register/route.ts` — eliminado el path de reactivación. Si existe `User` con `deletedAt != null` → **410** "Esta cuenta fue eliminada. Si creés que fue un error, escribinos a soporte." + audit log `ACCOUNT_RESURRECTION_BLOCKED`. Si existe con `deletedAt: null` → 409 "email en uso" (comportamiento previo). El `$transaction` quedó con el path "user nuevo" únicamente. (2) `auth/register/merchant/route.ts` — mismo check `if (existingUser?.deletedAt)` añadido antes del check de merchants colgados. Misma respuesta 410 + audit con `source: "auth/register/merchant"` y `businessName`. (3) `admin/users/[id]/delete/route.ts` — cascada completa dentro del `$transaction` serializable: Merchant queda `isActive: false`, `isOpen: false`, `approvalStatus: "REJECTED"`, `rejectionReason: "Cuenta eliminada por administrador"`, `isSuspended: true`, `suspendedAt: now`, y se **nullean** `cuit, cuil, bankAccount, ownerDni, mpAccessToken, mpRefreshToken, mpUserId, mpEmail`. Driver queda `isActive: false`, `isOnline: false`, `availabilityStatus: "FUERA_DE_SERVICIO"`, `approvalStatus: "REJECTED"`, `isSuspended: true`, + nulls `cuit, latitude, longitude`. SellerProfile queda `isActive: false`, `isOnline: false`, `isSuspended: true`, `displayName: "[Cuenta eliminada]"`, `bio: null`, + nulls `cuit, bankAlias, bankCbu, mpAccessToken, mpRefreshToken, mpUserId, mpEmail`. **Decisión intencional**: admin-delete NO anonimiza el email del User — lo mantiene "quemado" para que todo re-registro futuro responda 410. Admin que elimina desde OPS está tomando decisión grave (fraude/abuso), el email debe quedar bloqueado sin intervención humana adicional. (4) `profile/delete/route.ts` — agregada la cascada que FALTABA para Merchant (bug pre-existente: self-delete no apagaba comercios aprobados, los dejaba operativos bajo un User anonimizado). Mismo apagado que admin-delete. Además se agregaron `deletedAt: now`, `isSuspended: true`, `suspendedAt: now`, `suspensionReason: "Cuenta eliminada por el usuario"` al update del User — antes el código anonimizaba email/phone/password sin marcar `deletedAt` explícitamente. El Driver/Seller cascade también recibió REJECTED + fiscal data nulleada (antes solo deactivaban). **Self-delete sigue anonimizando email** (`deleted-${userId}@deleted.moovy.local`) — libera el unique constraint para que la persona pueda volver con cuenta fresca. Admin-delete NO anonimiza — email "quemado". La diferencia es deliberada: el usuario que se auto-elimina merece la opción de volver; el usuario echado por admin no. **Audit log nueva acción**: `ACCOUNT_RESURRECTION_BLOCKED` con `details: { email, deletedAt, source, timestamp, businessName? }`. **Script de detección**: `scripts/cleanup-resurrected-users.ts` (read-only). Tres heurísticas: (a) `User.updatedAt - createdAt > 7d` + merchants APPROVED aprobados pre-update; (b) `bonusActivated: false` + `pendingBonusPoints > 0` + cuenta > 30d + merchants APPROVED; (c) `termsConsentAt > createdAt + 7d`. Reporta candidatos con todos los detalles (merchants con approvedAt, drivers, sellers) para que el admin decida manualmente desde OPS. No modifica nada. Uso: `npx tsx scripts/cleanup-resurrected-users.ts`. **TS clean** (solo error pre-existente en `node_modules/.prisma/client` desde ISSUE-021). **Archivos modificados**: `src/app/api/auth/register/route.ts`, `src/app/api/auth/register/merchant/route.ts`, `src/app/api/admin/users/[id]/delete/route.ts`, `src/app/api/profile/delete/route.ts`, `scripts/cleanup-resurrected-users.ts` (nuevo). **Regla nueva**: nunca un endpoint de registro debe escribir sobre un User soft-deleted. La única operación válida contra `deletedAt != null` es la restauración explícita del admin o el cascading cleanup en delete. Cualquier intento de "reactivación" silenciosa es un bug por definición.)

## 2026-04-21 (rama `avisame-driver-disponible` RESUELTA — ISSUE-054 "avisame cuando haya repartidor". Nuevo flujo end-to-end para cuando el buyer llega al checkout sin repartidores disponibles: se suscribe con un tap, queda registrado con su ubicación + merchantId (opcional), y recibe push apenas un driver pasa a `isOnline: true` en un radio de 5km. **Schema**: nuevo modelo `DriverAvailabilitySubscription` (id/userId/latitude/longitude/merchantId?/createdAt/expiresAt/notifiedAt?) con relaciones a `User` y `Merchant` (onDelete: Cascade / SetNull). Índices: `userId`, `(notifiedAt, expiresAt)` y `merchantId`. Requiere `npx prisma db push` + `npx prisma generate` local. **Endpoint `POST /api/notifications/driver-available-subscribe`**: auth via `auth()`, rate limit 10/min por IP (`applyRateLimit`), Zod `{ latitude: [-90, 90], longitude: [-180, 180], merchantId: string(1,50)? }`. Antes de crear, valida que `merchantId` exista si viene (evita FKs rotas). Si ya hay sub activa para mismo user + merchant + ubicación a <~100m (delta 0.001°), REFRESCA `expiresAt` y ubicación en vez de duplicar. Enforcement `MAX_ACTIVE_SUBS_PER_USER=3` (429 si supera). TTL `SUBSCRIPTION_TTL_HOURS=4`. Devuelve `{ success, subscriptionId, expiresAt, refreshed }`. DELETE `?id=<subscriptionId>` con ownership check. **Helper `src/lib/driver-availability.ts`**: `notifyAvailabilitySubscribers({driverId, driverLat, driverLng})` busca subs con `notifiedAt: null, expiresAt > now` (cap 500), filtra por Haversine ≤ `NOTIFY_RADIUS_KM=5`. Procesa en chunks de `PUSH_CONCURRENCY=10` con `Promise.allSettled`. Para cada sub hace `updateMany({where:{id, notifiedAt: null}, data:{notifiedAt: now}})` ATÓMICO — si dos drivers se conectan en simultáneo, solo uno gana la carrera, el otro ve `count: 0` y skipea el push (zero doble notificación). Push: `title: "🏍️ ¡Ya hay repartidor en tu zona!"`, `body: "Entrá al checkout y completá tu pedido antes que vuelva a subir la demanda."`, `url: "/checkout"`, `tag: "driver-available-${sub.id}"`. Retorna `{candidates, notified, errors}`. Errores se loguean con pino, nunca throwean. Filtro "dentro del radio del BUYER" (no del comercio) porque el buyer es quien espera en su dirección; el driver se mueve hacia el merchant después. **Trigger en `PUT /api/driver/status`**: antes del update leemos `previous.isOnline` con `findUnique`; `wasOffline = !previous?.isOnline`. Después del update + PostGIS, si `driver.isOnline && wasOffline` disparamos `notifyAvailabilitySubscribers(...).catch(err => console.error(...))` fire-and-forget (no bloquea response). Solo se activa en la transición offline → online real, NO en toggles `DISPONIBLE ↔ OCUPADO` mientras ya estaba online — así evitamos spam cuando el driver pausa para ir al baño y vuelve. **UI checkout** (`src/app/(store)/checkout/page.tsx`): card de "no hay repartidores" rediseñada en el step 1. CTA primaria `🔔 Avisame cuando haya repartidor` (botón MOOVY rojo, full-width). Disabled + hint "Completá tu dirección abajo para activar el aviso" si `!address.latitude || !address.longitude`. Handler `handleSubscribeToDriverAvailable` POST al endpoint, toast.success en éxito, toast.error con mensaje del backend en falla. Estado optimistic `availabilitySubscribed`: al confirmar, la CTA se reemplaza por badge verde `✓ Te avisamos cuando haya` (ya no se puede volver a tocar). Texto top reemplazado a "Suele durar menos de 15 min en esta zona". Alternativas secundarias abajo, separadas por border-top: "Programar para más tarde" (cambia a `deliveryType SCHEDULED`) y "Retirar en local" (cambia a `deliveryMethod pickup`). Iconos: `Clock`, `Bell`, `CheckCircle`, `Loader2`. TS clean (solo errores pre-existentes en `node_modules/.prisma/client` desde ISSUE-021 — se limpian con el `prisma generate` post-schema).)

## 2026-04-21 (rama `fix/driver-offline-mid-delivery` RESUELTA — ISSUE-010 cron detecta driver offline mid-delivery. Extendido `src/app/api/cron/retry-assignments/route.ts` con dos queries nuevas que corren después del retry existente: (1) `prisma.order.findMany` con `driverId: { not: null }` + `deliveryStatus IN [DRIVER_ASSIGNED, DRIVER_ARRIVED, PICKED_UP]` + `status NOT IN [CANCELLED, DELIVERED]` + `OR: [driver.isOnline false, driver.lastLocationAt null, driver.lastLocationAt < now - 15min]` para single-vendor; (2) la misma lógica aplicada a `prisma.subOrder.findMany` para multi-vendor (cada SubOrder tiene su propio `driverId`). Ambas queries están capadas en 50 resultados — Ushuaia (80k hab) no debería tener >50 pedidos mid-delivery simultáneos. Nueva función `notifyAdminOfOfflineDriver({orderId, orderNumber, subOrderId?, driverId, driverName, deliveryStatus, minutesOffline, driverIsOnline, lastLocationAt})` emite socket event `driver_offline_mid_delivery` a tres rooms: `admin:<userId>` (cada admin), `admin:orders` y `admin:drivers` (cualquier panel puede renderizar el incidente). **No se reasigna automáticamente** porque el driver puede tener el paquete en mano (PICKED_UP) — la reasignación requiere coordinación humana (llamar al driver, ver si recuperó señal, etc.). Constantes top-level: `DRIVER_OFFLINE_THRESHOLD_MINUTES = 15`, `DRIVER_OFFLINE_ACTIVE_STATES = ["DRIVER_ASSIGNED","DRIVER_ARRIVED","PICKED_UP"] as const`. Se eliminó el `early return` cuando `stuckOrders.length === 0` — antes, si no había órdenes stuck en CONFIRMED, el cron retornaba sin correr el check nuevo; ahora siempre llega al final. El response JSON agrega `driverOfflineAlerts` al payload de stats. Admins reciben el alert cada run del cron (cada 5min) mientras la condición persista — mismo patrón que `stuck_order_alert` del ISSUE-015. TS clean (únicos errores son pre-existentes en `node_modules/.prisma/client` por el `npx prisma generate` pendiente desde ISSUE-021).)

## 2026-04-21 (rama `fix/checkout-breadcrumb-y-tour-buyer` RESUELTA — 2 issues UX pre-launch: ISSUE-055+056 (checkout con 3 tabs Entrega→Pago→Confirmar + tipo de entrega mudado al paso Entrega) + ISSUE-021 (tour buyer primera vez, 3 pantallas). **ISSUE-055+056**: `src/app/(store)/checkout/page.tsx` rediseñado de flujo 1→2 (Envío standalone eliminado, el costo de envío se ve inline en el sidebar "Tu Pedido") a 3 tabs claras Entrega → Pago → Confirmar. El breadcrumb superior muestra el paso actual, los completados con `CheckCircle` y los pendientes con número en círculo gris, con `aria-current="step"` en el activo. El bloque "¿Cuándo querés recibirlo?" (Inmediata vs Programada + `TimeSlotPicker`) se movió del paso Pago al paso Entrega — ahora vive junto al método de entrega (home/pickup) y la dirección, porque es una decisión del "cuándo" de la logística, no del pago. El paso Pago es solo `PointsWidget` + radio Efectivo/MP + "Continuar a confirmar". Paso Confirmar: resumen con cards para dirección (link "Cambiar" → step 1), tipo de entrega (con horario si programada), método de pago (link "Cambiar" → step 2), puntos aplicados (si `pointsUsed > 0`, card verde) y botón final "Confirmar Pedido" (disabled si `SCHEDULED && !slot` o no-pickup sin range). El sidebar "Tu Pedido" ya tenía el desglose completo de ISSUE-059 así que se mantuvo intacto. Import de `AlertCircle` eliminado (lo usaba solo el step 2 standalone viejo). **ISSUE-021**: schema `User.onboardingCompletedAt DateTime?` (requiere `npx prisma db push` + `npx prisma generate`). `src/app/api/onboarding/route.ts` con GET (`{ shouldShow: boolean }`) + POST (marca `new Date()`, idempotente — si ya estaba completo devuelve `alreadyCompleted: true` sin sobrescribir). `src/components/onboarding/BuyerOnboardingTour.tsx`: cliente, 3 slides full-screen (sheet desde abajo en mobile, modal centrado en desktop) con gradientes de marca (rojo MOOVY / violeta marketplace / amber-orange puntos). Slide 1 qué es Moovy (comercios locales, pago instantáneo, repartidores Ushuaia), slide 2 cómo pedir (flow aceptación → retiro → tracking), slide 3 puntos de bienvenida (10pts/$1k, 1pt=$1, referidos). Dots clickeables para saltar entre slides. Botón X top-right + botón "Saltar" bottom ambos marcan completado. Optimistic close con flag `localStorage` (`moovy_onboarding_done_<userId>`) por si el POST falla por red — evita re-mostrar. Self-gated: useSession authenticated + `GET /api/onboarding` devuelve `shouldShow: true`. Montado en `src/app/(store)/layout.tsx` junto al PromoPopup. Body scroll lockeado mientras está visible. Accesibilidad: `role="dialog" aria-modal="true" aria-label="Tour de bienvenida"`.)

