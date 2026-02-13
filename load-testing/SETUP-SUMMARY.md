# 🧪 Setup Profesional de Load Testing - RESUMEN

## ✅ Archivos Creados

### 📁 Infraestructura
- `docker-compose.monitoring.yml` - Prometheus + Grafana
- `load-testing/prometheus/prometheus.yml` - Config de Prometheus
- `load-testing/grafana/provisioning/` - Auto-provisioning de Grafana
- `load-testing/grafana/dashboards/moovy-load-testing.json` - Dashboard

### 🧪 Scripts de Testing (k6)
- `load-testing/k6/customer-flow.js` - Simula clientes (100 usuarios peak)
- `load-testing/k6/rider-websocket.js` - Simula 20 riders con WebSocket
- `load-testing/k6/spike-test.js` - Test de picos de tráfico (200 usuarios)

### 🛠️ Scripts de Utilidad
- `scripts/setup-monitoring.ps1` - Iniciar/detener monitoreo
- `scripts/run-load-tests.ps1` - Ejecutar tests de carga
- `prisma/seed-load-test.ts` - Generar datos de prueba

### 📚 Documentación
- `load-testing/README.md` - Guía completa
- `load-testing/INSTALL-K6.md` - Instalación de k6

## 🚀 Quick Start

```powershell
# 1. Instalar k6 (si no lo tenés)
choco install k6

# 2. Generar datos de prueba
npx tsx prisma/seed-load-test.ts

# 3. Iniciar monitoreo
.\scripts\setup-monitoring.ps1

# 4. Ejecutar tests
.\scripts\run-load-tests.ps1

# 5. Ver resultados
# Abrir http://localhost:3001 (admin/admin)
```

## 📊 Escenarios Incluidos

| Escenario | Usuarios | Duración | Simula |
|-----------|----------|----------|--------|
| Customer Flow | 100 peak | 13 min | Navegación + Compras |
| Rider WebSocket | 20 concurrent | 10 min | Updates de ubicación |
| Spike Test | 200 peak | 10 min | Hora pico de almuerzo |

## 🎯 Métricas Monitoreadas

- ✅ API Response Time (p95 < 2s)
- ✅ Error Rate (< 5%)
- ✅ WebSocket Stability (< 5% errors)
- ✅ Requests per Second
- ✅ Database Query Performance

## 🔍 Siguiente Paso

1. **Ejecutar baseline test:**
   ```powershell
   .\scripts\run-load-tests.ps1 -Test customer
   ```

2. **Analizar en Grafana:**
   - Identificar cuellos de botella
   - Ver límites del sistema
   - Detectar memory leaks

3. **Optimizar:**
   - Agregar índices a DB donde sea necesario
   - Implementar caché (Redis)
   - Escalar horizontalmente si es necesario

---

**¿Dudas?** Ver `load-testing/README.md` para documentación completa.
