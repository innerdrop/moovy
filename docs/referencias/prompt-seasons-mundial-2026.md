# MOOVY Seasons Templates — Prompt Experto

## Prompt para usar al iniciar la implementación

---

Actúa como un **Senior UX Engineer especializado en experiencias inmersivas, motion design y theming dinámico para apps web** con experiencia en e-commerce de alto tráfico y campañas estacionales virales (Black Friday de Amazon, Singles Day de Alibaba, campañas mundialistas de Rappi/PedidosYa).

### Contexto del proyecto

MOOVY es una app de delivery y marketplace construida con **Next.js 16, React 19, TypeScript, Tailwind CSS**. Necesito implementar un **sistema de Seasons Templates**: temas visuales temporales que transforman la apariencia de la app durante eventos especiales, activables y desactivables por rango de fechas desde el panel de administración (OPS).

### Primera temporada: Mundial de Fútbol 2026 — Argentina Tricampeona

Argentina ganó su tercera Copa del Mundo. La app debe respirar fútbol argentino durante todo el torneo. El objetivo es que cada usuario que entre sienta la euforia mundialista y quiera quedarse, explorar y comprar.

### Requisitos de diseño y UX

#### 1. Sistema de theming (arquitectura)
- Crear un `SeasonThemeProvider` (React Context) que envuelva la app y aplique el tema activo.
- Los temas se definen como objetos JSON con: paleta de colores, assets (URLs de imágenes/SVGs/Lottie), efectos habilitados, rango de fechas (inicio/fin), y flag de activación.
- El tema activo se obtiene de una API (`/api/config/season`) que consulta la base de datos. Cachear en cliente con `staleWhileRevalidate`.
- Fallback graceful: si no hay tema activo o falla la API, la app se ve normal (sin tema).
- El panel OPS debe poder activar/desactivar temas, previsualizar, y programar fechas.

#### 2. Paleta de colores mundialista argentina
- Primarios: celeste (#75AADB), blanco (#FFFFFF), dorado campeón (#D4AF37).
- Acentos: azul profundo (#1C3A5F), verde césped (#2D8B46).
- Los colores del tema deben aplicarse mediante CSS custom properties (`--season-primary`, `--season-accent`, etc.) que sobreescriben las variables base de la app.
- Los componentes existentes NO deben modificarse; el tema se aplica por cascada CSS.

#### 3. Efectos visuales obligatorios

**a) Confeti celeste y blanco (celebración argentina)**
- Al abrir la app por primera vez en la sesión: lluvia de confeti de 4 segundos con papelitos celestes, blancos y algunos dorados.
- Usar canvas (`<canvas>`) con requestAnimationFrame para rendimiento. NO usar librerías pesadas.
- Los papelitos deben rotar en 3D (CSS transform o cálculo en canvas) y caer con física realista (gravedad + viento lateral sutil).
- Respetar `prefers-reduced-motion`: si el usuario tiene animaciones reducidas, mostrar solo un banner estático festivo.

**b) Pelotas de fútbol flotantes**
- Pelotas SVG (o emoji ⚽ estilizado) que aparecen desde los bordes y rebotan suavemente contra los límites del viewport.
- Máximo 3 pelotas simultáneas en mobile, 5 en desktop.
- Deben ser **no intrusivas**: `pointer-events: none`, `z-index` bajo (detrás de modals y sheets pero encima del fondo).
- Animación con CSS `@keyframes` + `will-change: transform` para GPU acceleration.
- Se activan al hacer scroll (parallax trigger) y desaparecen con fade-out después de 8 segundos.

**c) Efecto de entrada mundialista (splash)**
- Al cargar la landing o la home, mostrar un overlay de 2.5 segundos con:
  - Fondo gradiente celeste → blanco → celeste.
  - 3 estrellas doradas (★★★) que aparecen una por una con scale + glow.
  - Texto "ARGENTINA TRICAMPEÓN" con tipografía bold que entra con slide-up.
  - Transición de salida: el overlay se divide en dos (como cortina) y revela la app.
- Solo se muestra 1 vez por sesión (`sessionStorage` flag).
- Skip button visible desde el segundo 0.5 ("Saltar →").

**d) Scroll effects**
- Parallax sutil en el hero banner de la home (camiseta argentina o estadio de fondo).
- Al hacer scroll down: las pelotas flotantes se activan.
- Al llegar a secciones de productos/listings: micro-animación de entrada (fade-up + scale desde 0.95) con `IntersectionObserver`.
- Efecto "wave" en los separadores de sección: línea ondulada celeste y blanca animada.

**e) Micro-interacciones**
- Al agregar un producto al carrito: animación de gol (pelota entra al carrito con efecto de red).
- Al completar una compra: confeti burst + sonido de gol (silenciado por default, activable).
- Hover en product cards: borde inferior que se llena como barra de carga en celeste.
- Badge "PROMO MUNDIAL" con shimmer dorado en productos con descuento.

#### 4. Assets y recursos visuales
- Todas las imágenes/SVGs deben estar en `/public/seasons/mundial-2026/`.
- Usar SVGs inline para íconos (pelotas, estrellas, trofeo) para poder animarlos con CSS.
- Background pattern opcional: textura sutil de césped o hexágonos tipo pelota con opacity 0.03.
- Lazy load todos los assets del tema (no bloquear el render inicial de la app).

#### 5. Performance (crítico)
- El tema NO debe aumentar el LCP en más de 200ms.
- Todos los efectos de canvas/animación deben pausarse cuando la tab no es visible (`document.hidden`).
- Animaciones CSS sobre propiedades compuestas únicamente (`transform`, `opacity`).
- Bundle del tema en chunk separado con `dynamic()` import de Next.js.
- Si el dispositivo es de gama baja (detectar con `navigator.hardwareConcurrency <= 4` o `navigator.deviceMemory <= 4`), reducir efectos: sin confeti canvas, sin pelotas flotantes, solo colores y badges.

#### 6. Responsive y accesibilidad
- Mobile-first. Los efectos se escalan: menos partículas, menos pelotas, splash más corto (1.5s).
- Respetar `prefers-reduced-motion` en TODOS los efectos.
- Respetar `prefers-color-scheme` (dark mode del portal repartidor debe adaptar los colores del tema).
- Contraste mínimo WCAG AA en todos los textos sobre fondos del tema.
- Los efectos decorativos llevan `aria-hidden="true"`.

#### 7. Estructura de archivos esperada
```
src/
  seasons/
    types.ts                    # SeasonTheme interface, SeasonConfig
    SeasonThemeProvider.tsx      # Context provider + CSS variable injection
    hooks/
      useSeason.ts              # Hook para acceder al tema activo
      useSeasonEffects.ts       # Hook para controlar efectos (confeti, pelotas)
    effects/
      ConfettiCanvas.tsx        # Canvas de confeti (celeste/blanco/dorado)
      FloatingBalls.tsx         # Pelotas rebotando en viewport
      WorldCupSplash.tsx        # Overlay de entrada mundialista
      GoalAnimation.tsx         # Animación de gol (add to cart)
      WaveSection.tsx           # Separador ondulado animado
    themes/
      mundial-2026.ts           # Config específica del tema mundial
    components/
      PromoBadge.tsx            # Badge "PROMO MUNDIAL" con shimmer
      SeasonBanner.tsx          # Banner hero temático
public/
  seasons/
    mundial-2026/
      hero-desktop.webp
      hero-mobile.webp
      ball.svg
      star.svg
      trophy.svg
      pattern-grass.svg
```

#### 8. API y panel OPS
- `GET /api/config/season` — Retorna el tema activo (o null). Público, cacheable.
- `POST /api/admin/seasons` — CRUD de temas (solo ADMIN).
- En el panel OPS: sección "Temporadas" donde se pueden crear, editar, activar/desactivar y programar temas.
- Cada tema tiene: nombre, slug, fecha inicio, fecha fin, enabled (boolean), config JSON.

### Reglas de ejecución
1. Presentar el plan completo con lista de archivos a crear/modificar ANTES de escribir código.
2. Esperar aprobación explícita.
3. Crear rama con el workflow del proyecto (scripts/start.ps1).
4. NO modificar componentes existentes directamente; el tema se aplica por composición y CSS cascade.
5. Verificar TypeScript con `npx tsc --noEmit`.
6. Al terminar: lista de archivos + resultado tsc.

### Tono y estilo del resultado
Quiero que el código sea **production-ready**, no un prototipo. Componentes tipados, comentarios en español donde aclaren lógica compleja, y que cualquier desarrollador del equipo pueda entender la arquitectura en 5 minutos leyendo el `types.ts` y el provider.

---

*Este prompt está optimizado para obtener una implementación completa, performante y escalable del sistema de Seasons Templates de MOOVY.*
