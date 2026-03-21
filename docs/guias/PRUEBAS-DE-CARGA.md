# 🔥 Moovy — Pruebas de Carga (Documento Maestro)

> Guía completa para ejecutar, monitorear e interpretar pruebas de carga en Moovy.

---

## 📋 Índice

1. [Arquitectura del Sistema](#-arquitectura-del-sistema)
2. [Requisitos Previos](#-requisitos-previos)
3. [Inicio Rápido](#-inicio-rápido)
4. [Herramientas Disponibles](#-herramientas-disponibles)
5. [Ejecutar Pruebas](#-ejecutar-pruebas)
6. [Monitoreo con Grafana](#-monitoreo-con-grafana)
7. [Interpretar Resultados](#-interpretar-resultados)
8. [Métricas Expuestas](#-métricas-expuestas)
9. [Escenarios de Prueba](#-escenarios-de-prueba)
10. [Troubleshooting](#-troubleshooting)
11. [Estructura de Archivos](#-estructura-de-archivos)

---

## 🏗 Arquitectura del Sistema

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Load Test      │     │   Moovy App      │     │   Prometheus     │
│   (PowerShell    │────▶│   (Next.js)      │◀────│   (Recolector)   │
│    o k6)         │     │   :3000           │     │   :9090          │
└──────────────────┘     │                  │     └────────┬─────────┘
                         │  /api/metrics ───┤              │
                         └──────────────────┘              │
                                                    ┌──────▼─────────┐
                                                    │   Grafana      │
                                                    │   (Dashboard)  │
                                                    │   :3002        │
                                                    └────────────────┘
```

**Flujo:**
1. El **script de carga** bombardea la app con requests simultáneos
2. La app expone telemetría en **`/api/metrics`** (formato Prometheus)
3. **Prometheus** recolecta esos datos cada 15 segundos
4. **Grafana** los visualiza en tiempo real en dashboards

---

## ✅ Requisitos Previos

| Requisito | Verificar con | Instalación |
|---|---|---|
| **Docker Desktop** | `docker --version` | [docker.com](https://docker.com) |
| **Node.js 18+** | `node --version` | [nodejs.org](https://nodejs.org) |
| **PowerShell 5+** | `$PSVersionTable` | Viene con Windows |
| **k6** _(opcional)_ | `k6 version` | Ver `load-testing/INSTALL-K6.md` |

---

## 🚀 Inicio Rápido

### Primer uso (3 pasos)

```powershell
# 1. Levantar monitoreo (Prometheus + Grafana)
.\scripts\setup-monitoring.ps1

# 2. Compilar y arrancar la app en producción
npm run build
npm start

# 3. En OTRA terminal, ejecutar el test
.\scripts\simple-load-test.ps1 -Users 10 -DurationSeconds 30
```

### Accesos

| Servicio | URL | Credenciales |
|---|---|---|
| **Moovy App** | http://localhost:3000 | — |
| **Grafana** | http://localhost:3002 | `admin` / `admin` |
| **Prometheus** | http://localhost:9090 | — |
| **Métricas raw** | http://localhost:3000/api/metrics | — |

---

## 🛠 Herramientas Disponibles

### 1. `simple-load-test.ps1` (Recomendado)
Script en PowerShell puro. No requiere instalar nada extra.

```powershell
.\scripts\simple-load-test.ps1 -Users <N> -DurationSeconds <S> [-BaseURL <URL>]
```

**Parámetros:**

| Parámetro | Default | Descripción |
|---|---|---|
| `-Users` | 10 | Usuarios virtuales simultáneos |
| `-DurationSeconds` | 30 | Duración del test en segundos |
| `-BaseURL` | http://localhost:3000 | URL base de la app |

**Ejemplos:**

```powershell
# Test suave (desarrollo)
.\scripts\simple-load-test.ps1 -Users 5 -DurationSeconds 20

# Test medio (staging)
.\scripts\simple-load-test.ps1 -Users 25 -DurationSeconds 60

# Test intenso (pre-producción)
.\scripts\simple-load-test.ps1 -Users 50 -DurationSeconds 120

# Test extremo (encontrar límites)
.\scripts\simple-load-test.ps1 -Users 100 -DurationSeconds 180
```

**Endpoints testeados:**
- `/` — Página principal
- `/tienda` — Catálogo de productos
- `/api/products` — API de productos
- `/api/metrics` — Endpoint de métricas

### 2. Scripts k6 (Avanzado)
Requiere instalar k6. Más potente para escenarios complejos.

```powershell
# Test de flujo de cliente
.\scripts\run-load-tests.ps1 -TestType customer

# Test de WebSockets (riders)
.\scripts\run-load-tests.ps1 -TestType rider

# Test de spike (pico de tráfico)
.\scripts\run-load-tests.ps1 -TestType spike

# Todos los tests
.\scripts\run-load-tests.ps1 -TestType all
```

---

## 📊 Monitoreo con Grafana

### Iniciar/Detener

```powershell
# Iniciar Prometheus + Grafana
.\scripts\setup-monitoring.ps1

# Detener todo
docker compose -f docker-compose.monitoring.yml down

# Ver estado de contenedores
docker ps
```

### Dashboard "Moovy Load Testing"

Acceder a: **http://localhost:3002** → Dashboards → **Moovy Load Testing**

**Paneles disponibles:**

| Panel | Qué muestra | Bueno | Malo |
|---|---|---|---|
| **API Response Time** | Tiempo promedio de respuesta | < 200ms | > 2000ms |
| **Requests per Second** | Capacidad de throughput | > 10 req/s | < 1 req/s |
| **Error Rate** | Porcentaje de errores 5xx | "No data" (= 0%) | > 5% |
| **Node.js Memory Usage** | RAM usada por la app | < 300MB | > 500MB |

> **Tip:** Configurar el rango de tiempo a "Last 5 minutes" y refresh a "5s" para ver datos en tiempo real durante un test.

---

## 📈 Interpretar Resultados

### Evaluación del Script

| Estado | Condición | Significado |
|---|---|---|
| 🟢 **EXCELENTE** | Éxito ≥ 95% y p95 < 2s | La app soporta la carga sin problemas |
| 🟡 **ACEPTABLE** | Éxito ≥ 90% y p95 < 3s | Funciona pero con margen de mejora |
| 🔴 **REQUIERE ATENCIÓN** | Éxito < 90% o p95 > 3s | Hay cuellos de botella que resolver |

### Métricas Clave

| Métrica | Qué es | Objetivo |
|---|---|---|
| **Total Requests** | Cuántos requests se hicieron | Mayor = más cobertura |
| **Exitosos** | Requests con respuesta 2xx | ≥ 95% |
| **Errores** | Requests fallidos (timeout, 5xx) | ≤ 5% |
| **Requests/seg** | Throughput de la app | > 10 |
| **Tiempo promedio** | Latencia media | < 500ms |
| **p95** | 95% de requests tardaron menos de... | < 2000ms |

### ⚠️ Modo Dev vs Producción

| Aspecto | `npm run dev` | `npm run build && npm start` |
|---|---|---|
| **Velocidad** | Lento (recompila) | Rápido (precompilado) |
| **Tasa de éxito** | ~50-70% | ~95-100% |
| **Uso para tests** | ❌ No recomendado | ✅ Siempre usar este |
| **p95 típico** | 800-3000ms | 50-200ms |

> [!IMPORTANT]
> **SIEMPRE** ejecutar pruebas de carga contra el build de producción.
> Los resultados en modo dev NO son representativos del rendimiento real.

---

## 🔬 Métricas Expuestas

La app expone métricas en formato Prometheus en `/api/metrics`.

### Métricas Personalizadas

| Métrica | Tipo | Labels | Descripción |
|---|---|---|---|
| `http_requests_total` | Counter | method, route, status | Total de requests HTTP |
| `http_request_duration_ms` | Histogram | method, route, status | Duración en ms |

### Métricas Automáticas de Node.js

| Métrica | Descripción |
|---|---|
| `nodejs_heap_size_used_bytes` | Memoria heap usada |
| `nodejs_heap_size_total_bytes` | Memoria heap total |
| `nodejs_eventloop_lag_seconds` | Lag del event loop |
| `nodejs_gc_duration_seconds` | Duración del garbage collector |
| `process_cpu_user_seconds_total` | Uso de CPU |
| `process_resident_memory_bytes` | Memoria residente |

### Rutas con Tracking

| Ruta | Métodos |
|---|---|
| `/api/metrics` | GET |
| `/api/orders` | GET, POST |

> Para agregar tracking a más rutas, importar desde `@/lib/metrics`:
> ```typescript
> import { httpRequestsTotal, httpRequestDuration } from "@/lib/metrics";
> ```

---

## 🎯 Escenarios de Prueba

### 1. Prueba de Humo (Smoke Test)
**Objetivo:** Verificar que todo funciona.
```powershell
.\scripts\simple-load-test.ps1 -Users 2 -DurationSeconds 10
```
**Esperado:** 100% éxito, < 100ms promedio.

### 2. Carga Normal
**Objetivo:** Simular tráfico esperado en horario normal.
```powershell
.\scripts\simple-load-test.ps1 -Users 10 -DurationSeconds 60
```
**Esperado:** ≥ 98% éxito, < 300ms p95.

### 3. Carga Alta
**Objetivo:** Simular horario pico (mediodía, cena).
```powershell
.\scripts\simple-load-test.ps1 -Users 30 -DurationSeconds 120
```
**Esperado:** ≥ 95% éxito, < 1000ms p95.

### 4. Estrés
**Objetivo:** Encontrar el punto de quiebre de la app.
```powershell
.\scripts\simple-load-test.ps1 -Users 50 -DurationSeconds 180
```
**Esperado:** Identificar en qué punto la app empieza a degradarse.

### 5. Spike (con k6)
**Objetivo:** Simular explosión repentina de tráfico.
```powershell
.\scripts\run-load-tests.ps1 -TestType spike
```
**Esperado:** La app se recupera después del pico.

---

## 🔧 Troubleshooting

### "No data" en Grafana

1. Verificar que Prometheus está corriendo: `docker ps | Select-String prometheus`
2. Verificar que la app está respondiendo: abrir http://localhost:3000/api/metrics en el navegador
3. Verificar conexión Prometheus → App: abrir http://localhost:9090/targets y verificar que `moovy-app` está "UP"
4. En Grafana, ir a **Explore** → seleccionar datasource **Prometheus** → escribir `up` → debe mostrar valor `1`

### Grafana no abre

- Verificar que el puerto 3002 no está en uso: `netstat -ano | findstr :3002`
- Reiniciar contenedores: `docker compose -f docker-compose.monitoring.yml restart`

### Muchos errores en el test

| Causa | Solución |
|---|---|
| Estás en modo dev | Usar `npm run build && npm start` |
| Endpoint no existe | Verificar rutas en el script |
| Base de datos lenta | Revisar queries lentos en logs |
| Puerto ocupado | Verificar `netstat -ano \| findstr :3000` |

### Docker no arranca

```powershell
# Verificar Docker está corriendo
docker info

# Si no, abrir Docker Desktop manualmente
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
```

---

## 📁 Estructura de Archivos

```
moovy/
├── docs/
│   └── PRUEBAS-DE-CARGA.md          ← Este documento
├── scripts/
│   ├── simple-load-test.ps1          ← Test de carga (PowerShell)
│   ├── run-load-tests.ps1            ← Ejecutor de tests k6
│   └── setup-monitoring.ps1          ← Iniciar/detener monitoreo
├── load-testing/
│   ├── README.md                     ← Documentación técnica
│   ├── INSTALL-K6.md                 ← Guía de instalación k6
│   ├── SETUP-SUMMARY.md              ← Resumen del setup
│   ├── k6/
│   │   ├── customer-flow.js          ← Flujo de cliente (k6)
│   │   ├── rider-websocket.js        ← WebSockets de riders (k6)
│   │   └── spike-test.js             ← Test de spike (k6)
│   ├── prometheus/
│   │   └── prometheus.yml            ← Config de Prometheus
│   └── grafana/
│       ├── dashboards/
│       │   └── moovy-load-testing.json  ← Dashboard de Grafana
│       └── provisioning/
│           ├── datasources/
│           │   └── prometheus.yml    ← Datasource config
│           └── dashboards/
│               └── dashboards.yml    ← Dashboard provisioning
├── docker-compose.monitoring.yml     ← Docker Compose del monitoring
├── src/
│   ├── lib/
│   │   └── metrics.ts                ← Métricas centralizadas
│   └── app/api/
│       └── metrics/route.ts          ← Endpoint /api/metrics
└── prisma/
    └── seed-load-test.ts             ← Seeder de datos de prueba
```

---

## 📝 Checklist Antes de Correr Tests

- [ ] Docker Desktop está corriendo
- [ ] Contenedores de monitoreo activos (`.\scripts\setup-monitoring.ps1`)
- [ ] App compilada en producción (`npm run build`)
- [ ] App corriendo (`npm start`)
- [ ] Grafana accesible en http://localhost:3002
- [ ] Dashboard "Moovy Load Testing" seleccionado
- [ ] Rango de tiempo en "Last 5 minutes", refresh en "5s"

---

> **Última actualización:** Febrero 2026
> **Versión de Moovy:** 0.1.0
> **Stack de monitoreo:** Prometheus + Grafana (Docker)
