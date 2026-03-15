# PLAN: Rediseño Integral del Portal Repartidor MOOVY

**Fecha:** 15 de Marzo 2026
**Estado:** PLAN — sin modificaciones a archivos
**Prioridad:** Alta

---

## 1. BUGS CRÍTICOS ENCONTRADOS

### 1.1 — 404 en `/repartidor` (desde Mi Perfil)

**Problema:** El link "Panel de Repartidor" en `mi-perfil/page.tsx` (línea 269) apunta a `href="/repartidor"`, pero NO existe `page.tsx` en esa ruta raíz. La estructura real es:

```
src/app/repartidor/
├── login/page.tsx          ← público
├── registro/page.tsx       ← público
└── (protected)/
    ├── dashboard/page.tsx  ← el dashboard real
    ├── ganancias/
    ├── historial/
    ├── pedidos/
    ├── perfil/
    └── soporte/
```

**Solución:** Crear `src/app/repartidor/page.tsx` como redirect:
- Si el usuario tiene rol DRIVER activo → redirect a `/repartidor/(protected)/dashboard`
- Si no tiene rol DRIVER → redirect a `/repartidor/login`
- Alternativa más simple: cambiar el `href` en mi-perfil a `/repartidor/dashboard` (directo al dashboard dentro del route group `(protected)`)

**Recomendación experta:** Crear el archivo de redirect. Es más robusto, funciona como entry point canónico y los otros portales (comercios, vendedor, ops) probablemente también necesitan esto.

### 1.2 — Navegación "atrás" va a `/` en vez de la tienda

**Problema:** En `ProfileView.tsx` (línea 317), el link "Ir a la tienda" apunta a `href="/"` que es la landing/home page, no la tienda propiamente. El usuario espera volver a donde estaba comprando.

**Solución:** Cambiar `href="/"` a `href="/tienda"` que es la ruta canónica de la tienda dentro del route group `(store)`.

### 1.3 — Inconsistencia `/` vs `/tienda`

**Problema:** En toda la app se usa `/` y `/tienda` indistintamente para referirse a la tienda. El `BottomNav` de la tienda usa `/tienda`, pero muchos links usan `/`.

**Solución:** Auditar y unificar. `/` debería ser la landing pública, `/tienda` la experiencia de compra con sesión.

---

## 2. AUDITORÍA COMPLETA DE RUTAS Y LINKS

### 2.1 — Links inter-portal desde Mi Perfil

| Destino | Link actual | Estado | Fix necesario |
|---------|-------------|--------|---------------|
| Panel Vendedor | `/vendedor` | ⚠️ Verificar | Crear redirect si no existe root page |
| Panel Repartidor | `/repartidor` | ❌ 404 | Crear redirect → `/repartidor/dashboard` |
| Panel Comercio | `/comercios` | ✅ OK | — |
| Panel Operaciones | `/ops` | ✅ OK | — |

### 2.2 — Links dentro del portal repartidor

| Componente | Link | Destino | Estado |
|-----------|------|---------|--------|
| ProfileView | `href="/"` | "Ir a tienda" | ❌ Va a landing, no a tienda |
| ProfileView | signOut callbackUrl | `/repartidor/login` | ✅ OK |
| Error boundary | backHref | `/repartidor/dashboard` | ✅ OK |
| RiderBottomNav | tabs | SPA tabs (no links) | ✅ OK |

### 2.3 — Entry points por portal

| Portal | Root page | ¿Existe? | Acción |
|--------|-----------|----------|--------|
| Store (`/`) | `(store)/page.tsx` | ✅ | — |
| Repartidor (`/repartidor`) | — | ❌ | Crear redirect |
| Comercios (`/comercios`) | Verificar | ⚠️ | Verificar |
| Vendedor (`/vendedor`) | Verificar | ⚠️ | Verificar |
| OPS (`/ops`) | Verificar | ⚠️ | Verificar |

---

## 3. REDISEÑO DEL DASHBOARD — Análisis del diseño actual

### 3.1 — Problemas del layout actual

El dashboard actual tiene un diseño **map-first** donde el mapa ocupa la parte superior (220px card) y es lo primero que se ve. Esto tiene varios problemas:

1. **El mapa sin contexto no aporta valor:** Cuando el repartidor está offline o esperando pedidos, un mapa vacío ocupa espacio premium sin dar información útil.
2. **Prioridad visual incorrecta:** Lo más importante para un repartidor al abrir la app es: ¿Estoy conectado? ¿Tengo pedidos? ¿Cuánto gané hoy? El mapa es secundario.
3. **Duplicación de UI:** El estado online/offline y las stats aparecen tanto en el card mode como en el fullscreen BottomSheet, creando redundancia.
4. **El "Toca para abrir mapa" es un paso extra innecesario** para acceder a la navegación durante un pedido activo.

### 3.2 — Cómo lo hacen las mejores apps del mundo

**DoorDash (Dasher):**
- Dashboard centrado en GANANCIAS y ESTADO como primer elemento visual
- Mapa aparece SOLO cuando hay un pedido activo
- Layout limpio: estado → stats del día → lista de ofertas disponibles
- Barra inferior simple: Inicio / Programar / Ganancias / Perfil

**Uber Eats Driver:**
- Pantalla principal: botón gigante "Conectarse" como hero
- Al conectarse: mapa fullscreen con overlay de stats en la parte inferior
- Sin mapa cuando está offline — solo un card con earnings y un CTA

**Rappi (Soyrappi):**
- Estado de conexión como header fijo con gradiente
- Stats en grid compacto (pedidos, ganancias, calificación)
- Mapa solo se activa con pedido
- Notificaciones de nuevos pedidos como modal overlay

### 3.3 — Propuesta de rediseño: "Status-First Dashboard"

**Concepto:** El dashboard prioriza el ESTADO y la ACCIÓN del repartidor. El mapa es una herramienta de navegación, no un elemento decorativo.

#### Layout propuesto — SIN pedido activo (offline):

```
┌─────────────────────────────┐
│  ○ MOOVY          🔔  ⚙️   │ ← Header con logo, notif, settings
├─────────────────────────────┤
│                             │
│  ┌─────────────────────┐    │
│  │  👤 Hola, Mauro     │    │
│  │  ⭐ 4.9  •  Nivel 3 │    │ ← Saludo + rating + nivel
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │    ⏻ CONECTARSE     │    │ ← Botón hero grande
│  │  Toca para empezar  │    │
│  └─────────────────────┘    │
│                             │
│  ┌──────┐  ┌──────────┐    │
│  │ $2.5K│  │  12      │    │ ← Stats: Ganancias + Completados
│  │ Hoy  │  │ Entregas │    │
│  └──────┘  └──────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │ 📊 Resumen semanal  │    │ ← Mini gráfico de ganancias
│  │ ▃▅▇▅▃▇█            │    │    (motivacional)
│  └─────────────────────┘    │
│                             │
├─────────────────────────────┤
│ 🏠  💰  📋  💬  👤        │ ← Bottom nav
└─────────────────────────────┘
```

#### Layout propuesto — Conectado, esperando ofertas:

```
┌─────────────────────────────┐
│  ● CONECTADO    🔔  ⚙️     │ ← Punto verde animado
├─────────────────────────────┤
│                             │
│  ┌─────────────────────┐    │
│  │  📡 Buscando...     │    │
│  │  Estás en la zona   │    │ ← Animación sutil
│  │  [mapa mini radius] │    │    mapa PEQUEÑO mostrando
│  │  ● Tu ubicación     │    │    solo radio de alcance
│  └─────────────────────┘    │
│                             │
│  ┌──────┐  ┌──────────┐    │
│  │ $2.5K│  │  12      │    │
│  │ Hoy  │  │ Entregas │    │
│  └──────┘  └──────────┘    │
│                             │
│  ⏻ DESCONECTARSE            │ ← Botón secundario
│                             │
├─────────────────────────────┤
│ 🏠  💰  📋  💬  👤        │
└─────────────────────────────┘
```

#### Layout propuesto — CON pedido activo:

```
┌─────────────────────────────┐
│  [═══ MAPA FULLSCREEN ═══] │
│  [                        ] │
│  [   🚗 → 📍 comercio    ] │ ← Mapa ocupa todo
│  [                        ] │
│  [  📍 cliente            ] │
│  [                        ] │
│  [  [← Inicio]  [MAPS→]  ] │ ← Floating buttons
├─────────────────────────────┤
│ ┌───────────────────────┐   │
│ │ #ORD-1234             │   │ ← BottomSheet con info
│ │ Comercio → Cliente    │   │
│ │ ☎️ Llamar             │   │
│ │                       │   │
│ │ ═══ Deslizá → Llegué  │   │ ← SwipeToConfirm
│ └───────────────────────┘   │
└─────────────────────────────┘
```

**Cambios clave del rediseño:**

1. **Eliminar mapa-card en modo idle** — Reemplazar por un mini-mapa circular (solo radio) cuando está conectado, o eliminarlo completamente cuando está offline.
2. **Botón de conexión como hero element** — Grande, central, imposible de perder.
3. **Stats siempre visibles** — Ganancias y completados en grid compacto, visibles en todos los estados.
4. **Mapa fullscreen SOLO con pedido activo** — Transición automática cuando se acepta un pedido.
5. **Header con acceso a configuración** — Icono ⚙️ para settings (ver sección 5).
6. **Saludo personalizado** — Humaniza la experiencia, muestra rating y nivel.

---

## 4. ANÁLISIS DE COLORES

### 4.1 — Paleta actual

| Elemento | Color | Hex | Uso |
|----------|-------|-----|-----|
| Primario MOOVY | Rojo | `#e60012` | Branding, CTAs, nav activa |
| Online | Verde esmeralda | `emerald-500` | Estado conectado |
| Offline | Rojo/Gris | `#e60012` / gris | Estado desconectado |
| Oferta nueva | Naranja | `orange-500` | Popup de pedidos |
| Navegación | Azul Google | `#4285F4` | Botón MAPS |
| Dark mode BG | Gris oscuro | `#0f1117` | Fondo principal |
| Dark mode Surface | Gris medio | `#1a1d27` | Cards |
| Dark mode Alt | Gris claro | `#22252f` | Elementos secundarios |

### 4.2 — Problemas detectados

1. **Rojo sobrecargado:** El rojo `#e60012` se usa para TODO: marca, botones, íconos, estado offline, nav activa. Pierde jerarquía.
2. **Contraste naranja/rojo:** Las ofertas (naranja) y la marca (rojo) son tonos cercanos; se confunden visualmente.
3. **Dark mode bien implementado** pero los colores de acento no cambian — el rojo `#e60012` sobre fondo `#0f1117` tiene buen contraste, pero podría suavizarse.
4. **Sin identidad visual diferenciada** por estado: todo usa el mismo rojo.

### 4.3 — Propuesta de paleta mejorada

**Sistema de colores semánticos:**

| Contexto | Light | Dark | Uso |
|----------|-------|------|-----|
| Marca (accent) | `#e60012` | `#ff2d3a` | Logo, branding sutil |
| CTA Principal | `#e60012` | `#e60012` | Botones primarios |
| Estado online | `#10b981` (emerald-500) | `#34d399` | Botón conectado, indicadores |
| Estado offline | `#6b7280` (gray-500) | `#9ca3af` | Botón desconectado (NO rojo) |
| Oferta/Alerta | `#f59e0b` (amber-500) | `#fbbf24` | Nuevos pedidos |
| Info/Nav | `#3b82f6` (blue-500) | `#60a5fa` | Navegación, links |
| Éxito | `#22c55e` (green-500) | `#4ade80` | Entrega completada |
| Background | `#f9fafb` | `#0f1117` | Fondo principal |
| Surface | `#ffffff` | `#1a1d27` | Cards |
| Text primary | `#111827` | `#f9fafb` | Texto principal |
| Text secondary | `#6b7280` | `#9ca3af` | Texto secundario |

**Cambio principal:** Estado offline pasa de ROJO a GRIS neutro. El rojo se reserva para la marca y CTAs, no para estados pasivos.

---

## 5. NUEVA FUNCIONALIDAD: CONFIGURACIÓN DEL REPARTIDOR

### 5.1 — Pantalla de Settings (⚙️)

Accesible desde el header del dashboard o desde la tab "Perfil".

**Secciones propuestas:**

1. **Apariencia**
   - Toggle dark mode: Automático (OS) / Siempre claro / Siempre oscuro
   - Esto agrega un override sobre `prefers-color-scheme`

2. **Notificaciones**
   - Push para nuevos pedidos: ON/OFF
   - Sonido de alerta: ON/OFF
   - Vibración: ON/OFF

3. **Navegación**
   - App de mapas preferida: Google Maps / Waze / Apple Maps
   - Evitar autopistas: ON/OFF

4. **Turno**
   - Auto-desconectar después de X horas inactivo
   - Recordatorio de batería: umbral configurable (20%, 15%, 10%)

5. **Cuenta**
   - Ver datos personales
   - Documentación (DNI, licencia, seguro)
   - Cerrar sesión

### 5.2 — Implementación técnica

- Nuevo componente: `src/components/rider/views/SettingsView.tsx`
- Almacenamiento: `localStorage` para preferencias de UI (dark mode, app de mapas)
- API para preferencias server-side: `/api/driver/preferences` (POST/GET)
- Nueva tab en `RiderBottomNav` o accesible desde icono en header

---

## 6. PLAN DE EJECUCIÓN POR FASES

### Fase 1: Fixes críticos (1 rama — `fix/rider-routing`)
**Archivos a modificar:** 3-4

1. Crear `src/app/repartidor/page.tsx` — redirect inteligente a dashboard o login
2. Cambiar `href="/"` → `href="/tienda"` en `ProfileView.tsx`
3. Cambiar `href="/repartidor"` → `href="/repartidor/dashboard"` en `mi-perfil/page.tsx` (o confiar en el redirect del punto 1)
4. Verificar que `/vendedor`, `/comercios`, `/ops` tengan root redirects similares

### Fase 2: Rediseño dashboard layout (1 rama — `feat/rider-dashboard-v2`)
**Archivos a modificar:** 2-3

1. Refactorizar `dashboard/page.tsx` — nuevo layout "Status-First"
   - Estado offline: hero connect button + stats + saludo
   - Estado online sin pedido: mini-mapa circular + "buscando" + stats
   - Estado con pedido activo: mapa fullscreen automático + BottomSheet (ya existe)
2. Actualizar `RiderMiniMap` para soportar modo "radius" (solo punto del driver + radio)
3. Agregar header con saludo personalizado

### Fase 3: Paleta de colores y dark mode override (1 rama — `feat/rider-colors`)
**Archivos a modificar:** 3-5

1. Refactorizar variables CSS `--rider-*` con la nueva paleta semántica
2. Estado offline → gris en vez de rojo
3. Crear `useThemePreference` hook (auto/light/dark)
4. Aplicar nueva paleta en dashboard y componentes rider

### Fase 4: Pantalla de configuración (1 rama — `feat/rider-settings`)
**Archivos a modificar:** 4-5

1. Crear `SettingsView.tsx`
2. API `/api/driver/preferences`
3. Hook `useThemePreference` (si no se hizo en Fase 3)
4. Integrar en dashboard (icono header o nueva tab)
5. Almacenamiento local + API

### Fase 5: Polish final (1 rama — `feat/rider-polish-v2`)
**Archivos a modificar:** 3-4

1. Mini gráfico de ganancias semanales en dashboard idle
2. Animaciones de transición entre estados (offline → online → con pedido)
3. Resumen semanal motivacional
4. Testing integral de todos los flujos

---

## 7. ESTIMACIÓN DE ESFUERZO

| Fase | Complejidad | Archivos | Riesgo |
|------|-------------|----------|--------|
| 1. Fixes críticos | Baja | 3-4 | Bajo |
| 2. Rediseño layout | Alta | 2-3 | Medio (archivo grande) |
| 3. Colores | Media | 3-5 | Bajo |
| 4. Settings | Media | 4-5 | Bajo |
| 5. Polish | Media | 3-4 | Bajo |

**Orden recomendado:** Fase 1 → Fase 2 → Fase 3 → Fase 4 → Fase 5

Las fases 1 y 3 pueden hacerse en paralelo si se prefiere.

---

## 8. BENCHMARKS DE REFERENCIA

Las decisiones de diseño están basadas en análisis de:

- **DoorDash Dasher** (mayo 2025): layout simplificado, earnings tracking en tiempo real, "Earn by Time" mode
- **Uber Eats Driver**: botón de conexión como hero, mapa solo con pedido activo, instant cash-out
- **Rappi Soyrappi**: estado de conexión como header fijo, stats en grid compacto
- **Principios UX clave del mercado**: transparencia en ganancias, flexibilidad, incentivos visibles, optimización de rutas, feedback continuo
