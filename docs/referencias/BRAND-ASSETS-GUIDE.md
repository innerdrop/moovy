# MOOVY — Guía Completa de Assets de Marca

## Color principal nuevo: Violeta `#7C3AED`

| Variante | Hex | Uso |
|----------|-----|-----|
| Violeta oscuro | `#5B21B6` | Hover states, bordes activos |
| Violeta principal | `#7C3AED` | Color primario (botones, acentos, links) |
| Violeta claro | `#8B5CF6` | Backgrounds suaves, badges |
| Violeta muy claro | `#EDE9FE` | Fondos de secciones, highlights |

---

## 1. LOGOS — Qué necesitás crear

### Logo principal (texto "MOOVY")

| Archivo | Tamaño | Formato | Uso |
|---------|--------|---------|-----|
| `logo-moovy.png` | 280×90 px | PNG con fondo transparente | Header de la app (se muestra a ~70-100px de ancho) |
| `logo-moovy-white.png` | 280×90 px | PNG con fondo transparente | Footer, fondos oscuros |
| `logo-moovy.svg` | Vectorial | SVG | Ideal para web (escala sin perder calidad, pesa menos) |

**Recomendación pro:** Las empresas grandes usan SVG para el logo en web. Un SVG pesa 2-5KB vs un PNG que pesa 8-40KB. Además escala perfecto en pantallas retina. Si podés, generá el logo en SVG y reemplazá los PNG.

### Monograma (solo la "M" o isotipo)

| Archivo | Tamaño | Formato | Uso |
|---------|--------|---------|-----|
| `moovy-m.png` | 512×512 px | PNG con fondo transparente | Splash screen, avatar default, loading |

---

## 2. FAVICONS — Todos los que necesitás

Los favicons son los íconos que aparecen en la pestaña del navegador, cuando guardás la página en el home del celular, etc.

### Archivos necesarios

| Archivo | Tamaño | Formato | Dónde va | Para qué |
|---------|--------|---------|----------|----------|
| `favicon.ico` | 32×32 px | ICO | `/public/` | Pestaña del navegador (formato legacy) |
| `favicon.png` | 32×32 px | PNG | `/public/` | Pestaña del navegador (moderno) |
| `favicon-16x16.png` | 16×16 px | PNG | `/public/` | Pestaña en navegadores viejos |
| `favicon-32x32.png` | 32×32 px | PNG | `/public/` | Pestaña en navegadores modernos |
| `apple-touch-icon.png` | 180×180 px | PNG (sin transparencia) | `/public/` | iPhone: "Agregar a inicio" |
| `icon-192x192.png` | 192×192 px | PNG | `/public/icons/` | Android: "Agregar a inicio" + PWA |
| `icon-512x512.png` | 512×512 px | PNG | `/public/icons/` | Android splash screen + PWA install |
| `maskable-icon-512.png` | 512×512 px | PNG (con safe zone) | `/public/icons/` | Android: ícono adaptable (redondo/cuadrado) |

### Cómo hacer el maskable icon

El maskable icon es especial: Android lo recorta en diferentes formas (círculo, cuadrado redondeado, etc.). Tu diseño debe estar dentro de la "safe zone" — un círculo centrado que ocupa el 80% del ícono. El 20% restante es padding que puede cortarse.

**Herramienta:** https://maskable.app/editor — subís tu ícono y te muestra cómo queda recortado.

---

## 3. OPEN GRAPH (OG) — Lo que se ve en WhatsApp, Twitter, Google

Cuando alguien comparte `somosmoovy.com` por WhatsApp o lo encuentra en Google, se muestra una imagen preview. Esta es la imagen OG.

| Archivo | Tamaño | Formato | Dónde va |
|---------|--------|---------|----------|
| `og-default.png` | 1200×630 px | PNG o JPG | `/public/` |

**Qué debe tener:** Logo MOOVY centrado + tagline "Todo Ushuaia en tu puerta" + fondo violeta con gradiente. Debe verse bien en miniatura (WhatsApp lo muestra a ~300px de ancho).

**Recomendación:** También podés crear OG images para páginas específicas:
- `og-marketplace.png` — Para cuando comparten un link del marketplace
- `og-tienda.png` — Para la tienda

---

## 4. DÓNDE VAN LOS ARCHIVOS

```
public/
├── favicon.ico              ← Favicon ICO (32x32)
├── favicon.png              ← Favicon PNG (32x32)
├── favicon-16x16.png        ← Favicon 16px
├── favicon-32x32.png        ← Favicon 32px
├── apple-touch-icon.png     ← Apple touch (180x180) ← NUEVO
├── og-default.png           ← OG image (1200x630)
├── logo-moovy.png           ← Logo principal (280x90)
├── logo-moovy-white.png     ← Logo blanco (280x90)
├── logo-moovy.svg           ← Logo SVG (opcional, recomendado)
├── moovy-m.png              ← Monograma (512x512)
├── hero-person.png          ← Persona del hero
├── manifest.json            ← Manifest PWA
├── icons/
│   ├── icon-192x192.png     ← PWA icon
│   ├── icon-512x512.png     ← PWA icon grande
│   └── maskable-icon-512.png ← PWA maskable ← NUEVO
```

---

## 5. CÓMO LO HACEN LAS GRANDES EMPRESAS

### Formato de logo
- **Rappi:** SVG para web, PNG solo como fallback
- **Mercado Libre:** SVG inline (embedded en el HTML, carga instantánea)
- **Uber Eats:** SVG con lazy load

### Favicons
- Usan **una sola fuente** (un PNG 512x512 del isotipo) y generan todas las variantes con herramientas como https://realfavicongenerator.net
- El favicon NO es el logo completo, es el isotipo/monograma (la "M" de MOOVY, no el texto completo)

### OG Images
- Generan OG images dinámicas con el nombre del producto/comercio (Vercel tiene `@vercel/og` para esto)
- Siempre 1200×630 px

### Optimización de carga
- **SVG** para logos (pesan 2-5KB, escalan infinito)
- **WebP** para fotos (50-70% más liviano que PNG/JPG)
- **Preload** del logo en el `<head>` para que cargue primero
- **Font subsetting:** Solo cargan los caracteres que usan de la tipografía

---

## 6. CHECKLIST PARA MAURO

- [ ] Crear logo "MOOVY" en violeta (#7C3AED) — formato PNG 280×90 + SVG si es posible
- [ ] Crear variante blanca del logo — PNG 280×90
- [ ] Crear isotipo/monograma "M" en violeta — PNG 512×512
- [ ] Generar favicons desde el monograma (usar https://realfavicongenerator.net)
- [ ] Crear `apple-touch-icon.png` (180×180) — monograma con fondo violeta
- [ ] Crear `maskable-icon-512.png` — monograma con padding 20% y fondo violeta
- [ ] Crear `og-default.png` (1200×630) — logo + tagline + fondo violeta
- [ ] Colocar todos los archivos en `/public/` según la estructura de arriba
- [ ] Avisarme para que actualice las referencias en el código
