# 🧪 Moovy Load Testing Suite

Sistema profesional de pruebas de carga para Moovy usando **k6**, **Prometheus** y **Grafana**.

## 📋 Pre-requisitos

- **Docker** y **Docker Compose** instalados
- **k6** instalado localmente ([descarga aquí](https://k6.io/docs/get-started/installation/))
- Moovy corriendo en `localhost:3000`
- Socket server corriendo en `localhost:3001`

## 🚀 Quick Start

### 1. Levantar infraestructura de monitoreo

```powershell
# Iniciar Prometheus + Grafana
docker-compose -f docker-compose.monitoring.yml up -d

# Verificar que estén corriendo
docker ps
```

**Accesos:**
- Grafana: http://localhost:3001 (admin/admin)
- Prometheus: http://localhost:9090

### 2. Ejecutar tests de carga

#### Test de Clientes (HTTP)
```powershell
k6 run load-testing/k6/customer-flow.js
```

#### Test de Riders (WebSocket)
```powershell
k6 run load-testing/k6/rider-websocket.js
```

#### Spike Test (Hora Pico)
```powershell
k6 run load-testing/k6/spike-test.js
```

#### Test Completo (HTTP + WebSocket)
```powershell
# En una terminal
k6 run load-testing/k6/customer-flow.js

# En otra terminal (simultáneo)
k6 run load-testing/k6/rider-websocket.js
```

### 3. Ver resultados en Grafana

1. Abrir http://localhost:3001
2. Login: `admin` / `admin`
3. Ir a **Dashboards** → **Moovy Load Testing**
4. Ver métricas en tiempo real

## 📊 Escenarios de Testing

### 1. Customer Flow Test
- **Duración:** 13 minutos
- **Usuarios:** 0 → 10 → 50 → 100 → 50 → 0
- **Simula:**
  - Navegación de homepage
  - Búsqueda de comercios
  - Vista de productos
  - Agregar al carrito
  - Checkout

**Thresholds:**
- 95% de requests < 2 segundos
- < 5% de errores HTTP

### 2. Rider WebSocket Test
- **Duración:** 10 minutos
- **Riders:** 20 conectados simultáneamente
- **Simula:**
  - Actualización de ubicación cada 5 segundos
  - Aceptar/rechazar órdenes (80% aceptación)
  - Flujo completo de delivery

**Thresholds:**
- < 5% error en conexiones WebSocket
- Sesiones estables por 5+ minutos

### 3. Spike Test
- **Duración:** 10 minutos
- **Usuarios:** 20 → 200 (spike) → 20
- **Simula:**
  - Hora pico de almuerzo (12-14hs)
  - 10x tráfico normal repentino

**Thresholds:**
- 95% de requests < 3 segundos (más permisivo)
- < 10% de errores (aceptable en spike)

## 🎯 Métricas Clave

| Métrica | Threshold | Descripción |
|---------|-----------|-------------|
| `http_req_duration` | p95 < 2s | Latencia de API |
| `http_req_failed` | < 5% | Tasa de error HTTP |
| `ws_connection_errors` | < 5% | Errores de WebSocket |
| `ws_session_duration` | p95 > 5min | Estabilidad de conexión |

## 🛠️ Comandos Útiles

### Ejecutar con más usuarios
```powershell
k6 run --vus 200 --duration 15m load-testing/k6/customer-flow.js
```

### Ver output detallado
```powershell
k6 run --verbose load-testing/k6/customer-flow.js
```

### Ejecutar contra otro servidor
```powershell
$env:BASE_URL="https://moovy.example.com"
k6 run load-testing/k6/customer-flow.js
```

### Guardar resultados en archivo
```powershell
k6 run --out json=results.json load-testing/k6/customer-flow.js
```

## 📈 Interpretación de Resultados

### ✅ Sistema Saludable
```
✓ http_req_duration..............: avg=450ms  p95=1200ms
✓ http_req_failed................: 1.2%
✓ ws_connection_errors...........: 0.5%
```

### ⚠️ Requiere Atención
```
✗ http_req_duration..............: avg=1200ms  p95=3500ms
✓ http_req_failed................: 8%
✗ ws_connection_errors...........: 12%
```

### 🚨 Sistema Colapsado
```
✗ http_req_duration..............: avg=5000ms  p95=timeout
✗ http_req_failed................: 45%
✗ ws_connection_errors...........: 80%
```

## 🔧 Troubleshooting

### "Cannot connect to localhost:3000"
```powershell
# Verificar que Moovy esté corriendo
npm run dev:full
```

### "WebSocket connection failed"
```powershell
# Verificar socket server
# El socket server debe estar en puerto 3001
```

### "Out of memory" durante test
```powershell
# Reducir usuarios virtuales
k6 run --vus 50 load-testing/k6/customer-flow.js
```

## 📚 Recursos

- [k6 Documentation](https://k6.io/docs/)
- [Grafana Dashboards](https://grafana.com/grafana/dashboards/)
- [Prometheus Query Guide](https://prometheus.io/docs/prometheus/latest/querying/basics/)

## 🎓 Próximos Pasos

1. **Crear datos de prueba:**
   ```powershell
   npm run db:seed
   ```

2. **Ejecutar test baseline:**
   ```powershell
   k6 run load-testing/k6/customer-flow.js
   ```

3. **Monitorear en Grafana:**
   - Identificar cuellos de botella
   - Verificar uso de CPU/RAM
   - Analizar queries lentas en DB

4. **Optimizar:**
   - Agregar índices a DB
   - Implementar caché (Redis)
   - Optimizar queries N+1
