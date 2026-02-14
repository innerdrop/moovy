# 🚀 Setup Completo: Web Push Notifications

## ✅ Estado Actual

Todo el código **ya está implementado**. Solo falta configurar las variables de entorno.

---

## 📋 Paso 1: Agregar Variables al `.env`

Abrí tu archivo `.env` y agregá estas líneas (copiá los valores de `.env.vapid.example`):

```env
# ============================================
# WEB PUSH NOTIFICATIONS (VAPID)
# ============================================
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BIZfTRUpC_i-g3A_R0BbSOUk3DCtO5mSuSnR4M-nbEDDut1pH18sUzcWsoSjeqU6ZPIIuQZeUsLK0SQPTAJVnL2w
VAPID_PRIVATE_KEY=wK6rbHekJMyztgh-FIzUCPDzdn0Xgf6sb1zMM1KOb4E
VAPID_SUBJECT=mailto:tu_correo_real@ejemplo.com

# Token de seguridad para /api/push/send (inventá uno secreto)
INTERNAL_API_TOKEN=moovy_push_secret_2026_cambiar_en_produccion
```

> [!IMPORTANT]
> - Cambiá `VAPID_SUBJECT` por tu email real
> - Cambiá `INTERNAL_API_TOKEN` por una clave aleatoria segura
> - **NO subas** el `.env` a Git (ya está en `.gitignore`)

---

## 🔧 Paso 2: Restart del Servidor

```bash
# Matá el servidor actual (Ctrl+C)
npm run dev:full
```

---

## ✅ Verificación

### En el Dashboard del Repartidor
1. Abrí `http://localhost:3000/repartidor/dashboard`
2. **Deberías ver** un banner pidiendo permisos de notificación (después de ~2 segundos)
3. Click en "Activar Notificaciones"
4. El navegador te va a pedir permiso → Aceptá

### Confirmación en Consola
Deberías ver este log en la terminal del servidor:
```
[Push] VAPID configured successfully
```

---

## 📱 Problema: iOS / iPhone

### ❌ Safari NO Soporta Web Push
- iOS Safari **no tiene** soporte para Web Push Notifications (Apple no lo implementó)
- Esto es una limitación de Apple, no de tu código

### ✅ Alternativas para Testear

#### Opción 1: Chrome en Escritorio (Más fácil)
```bash
# Abrí Chrome en tu PC
http://localhost:3000/repartidor/dashboard
```
- Funcionan perfecto las notificaciones
- Podés testear con la pantalla minimizada

#### Opción 2: Chrome Android (Si tenés acceso)
- Pedile a alguien que tenga Android
- O usá un **emulador Android** en Windows

#### Opción 3: Emulador Android Studio (Gratis)
1. Descargá Android Studio
2. Creá un dispositivo virtual con Play Store
3. Instalá Chrome desde Play Store
4. Conectate a `http://10.0.2.2:3000` (IP especial del emulador)

#### Opción 4: BrowserStack / LambdaTest (Pago)
- Servicios en la nube para testear en dispositivos reales Android

---

## 🎯 Qué Funciona y Qué No

| Plataforma | Web Push | Workaround |
|------------|----------|------------|
| ✅ Chrome Desktop | ✅ SÍ | - |
| ✅ Chrome Android | ✅ SÍ | - |
| ✅ Firefox Desktop | ✅ SÍ | - |
| ✅ Firefox Android | ✅ SÍ | - |
| ❌ Safari Desktop (macOS) | ❌ NO | - |
| ❌ Safari iOS (iPhone) | ❌ NO | **Necesitás app nativa** |

---

## 🔔 Cómo se Activa Automáticamente

1. Repartidor abre el dashboard
2. Después de 2 segundos, aparece un banner (línea 134-143 de `page.tsx`)
3. Click en "Activar" → pide permiso
4. Se guarda la suscripción en DB
5. Cuando asignes una orden, se envía la push automáticamente (línea 165 de `logistics.ts`)

---

## 🧪 Test Manual en Chrome Desktop

### Paso 1: Activar Permisos
```
1. Dashboard → Botón "Activar Notificaciones"
2. Aceptar permiso en el navegador
```

### Paso 2: Simular Asignación de Orden
```typescript
// En DevTools Console del dashboard
fetch('/api/driver/orders/simulate-assignment', {
  method: 'POST'
})
```

### Paso 3: Minimizar Chrome
- La notificación debería aparecer aunque Chrome esté minimizado

---

## 🚨 Troubleshooting

### No aparece el banner de permisos
1. Verificá que las VAPID keys estén en `.env`
2. Restart del servidor (`npm run dev:full`)
3. Abrí DevTools Console → buscá errores de Push

### Notificación no llega
1. Verificá que aceptaste permisos
2. DevTools → Application → Service Workers → Ver que esté "activated"
3. Verificá logs del servidor: `[Push] Sent to...`

### Error "VAPID not configured"
- Falta alguna variable en `.env`
- Verificá con: `echo $NEXT_PUBLIC_VAPID_PUBLIC_KEY` (Linux/Mac) o `$env:NEXT_PUBLIC_VAPID_PUBLIC_KEY` (PowerShell)

---

## ✅ Checklist Final

- [ ] Variables en `.env` agregadas
- [ ] Servidor reiniciado
- [ ] Log `[Push] VAPID configured successfully` visible
- [ ] Banner aparece en dashboard después de 2s
- [ ] Permisos aceptados en Chrome
- [ ] Service Worker activo en DevTools
- [ ] Test con Chrome Desktop exitoso
