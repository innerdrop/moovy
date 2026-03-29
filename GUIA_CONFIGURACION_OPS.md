# MOOVY — Guía de Configuración del Panel OPS

**Basada en Biblia Financiera v3.0 — Lanzamiento 30 de marzo de 2026**

Esta guía te indica EXACTAMENTE qué valores cargar en cada sección del panel OPS para que los cálculos de envío, comisiones, puntos y todo el sistema financiero funcione correctamente desde el día 1.

**IMPORTANTE**: Seguir esta guía EN ORDEN. Cada sección depende de la anterior.

---

## PRE-REQUISITOS

Antes de empezar, verificar que:

1. Estás logueado como ADMIN en `somosmoovy.com/ops` (o `localhost:3000/ops` en local)
2. La base de datos tiene los seeds básicos corridos (`npx prisma db seed`)
3. El archivo `.env` tiene las variables de MercadoPago (aunque sean de test)

---

## PASO 1: Biblia Financiera (`/ops/config-biblia`)

Esta es la FUENTE DE VERDAD. Todos los demás paneles leen de acá.

### 1.1 Sección COMISIONES

| Campo | Valor Biblia v3 | Notas |
|-------|-----------------|-------|
| Comisión comercios | **8** (%) | Mes 2+. Para mes 1 (0%) ver nota abajo |
| Comisión sellers marketplace | **12** (%) | Desde día 1, sin período gratis |
| Comisión repartidor | **80** (%) | 80% del costo REAL del viaje |

**NOTA MES 1**: La Biblia dice 0% comisión a comercios los primeros 30 días. Como el sistema no tiene campo temporal automático para esto, hay DOS opciones:
- **Opción A (recomendada)**: Poner comisión en 0% ahora, y el 30 de abril cambiarla a 8% manualmente
- **Opción B**: Dejarlo en 8% y aplicar el descuento manualmente al liquidar con cada comercio

### 1.2 Sección PUNTOS MOOVER

| Campo | Valor Biblia v3 | Notas |
|-------|-----------------|-------|
| Puntos por peso gastado | **0.01** | Esto es 10 pts por $1,000 (0.01 × 1000 = 10) |
| Valor del punto (ARS) | **1.0** | 1 punto = $1 de descuento |
| Min puntos para canjear | **500** | Mínimo 500 puntos ($500 de descuento) |
| Max descuento (%) | **20** | Máximo 20% del subtotal |
| Bono registro | **1000** | Boost lanzamiento mes 1 (cambiar a 500 el 1 de mayo) |
| Bono referidor | **1000** | Quien invita a un amigo |
| Bono referido | **500** | El amigo invitado |
| Bono reseña | **25** | Por dejar una calificación |
| Compra mín para bono signup | **5000** | El signup bonus se activa con 1ra compra de $5,000+ |
| Compra mín para referral | **8000** | El referido debe comprar $8,000+ para que ambos ganen |
| Ventana de niveles (días) | **90** | Los niveles se calculan sobre pedidos de los últimos 90 días |

**VERIFICACIÓN MATEMÁTICA**: Con estos valores, un pedido de $20,000:
- Gana: 20,000 × 0.01 = 200 puntos
- Esos 200 puntos valen: 200 × $1 = $200 de descuento futuro
- Cashback efectivo: $200 / $20,000 = 1% ✓ (coincide con Biblia v3)

**BOOST LANZAMIENTO**: Durante los primeros 30 días (30 mar - 30 abr), todos los puntos se duplican. Esto se debe implementar como multiplicador 2x en la config, y desactivarlo el 1 de mayo.

### 1.3 Sección NIVELES MOOVER (Tier Config)

Si existe la configuración de tiers/niveles:

| Nivel | Pedidos en 90 días | Earn multiplier | Beneficios |
|-------|-------------------|-----------------|------------|
| **MOOVER** | 0 (todos) | ×1.0 (10 pts/$1K) | Acceso básico |
| **SILVER** | 5 | ×1.25 (12.5 pts/$1K) | Badge perfil |
| **GOLD** | 15 | ×1.5 (15 pts/$1K) | Badge + soporte prioritario |
| **BLACK** | 40 | ×2.0 (20 pts/$1K) | Badge + soporte VIP + eventos |

### 1.4 Sección DELIVERY / LOGÍSTICA

| Campo | Valor Biblia v3 | Notas |
|-------|-----------------|-------|
| Precio nafta super (ARS/litro) | **1591** | Nafta super en Ushuaia al 26/03/2026 |
| Factor ida+vuelta | **2.2** | 1.0 ida + 1.0 vuelta + 0.2 espera |
| Costo operativo embebido (%) | **5** | Se suma al delivery: subtotal × 5% |

### 1.5 Sección VEHÍCULOS (si existe)

| Vehículo | Rendimiento (L/100km) | Costo/km (ARS) | Fee mínimo (ARS) |
|----------|----------------------|----------------|------------------|
| **Bicicleta** | 0 | $15 | $800 |
| **Moto 150cc** | 3 | $73 | $1,500 |
| **Auto chico** | 9.3 | $193 | $2,200 |
| **Auto mediano** | 10.7 | $222 | $2,500 |
| **Pickup / SUV** | 12.5 | $269 | $3,000 |
| **Flete / Camión** | 15 | $329 | $3,800 |

**Cálculo del costo/km**: precio_nafta / (rendimiento_km_por_litro). Ej moto: $1,591 / (100/3) = $1,591 / 33.3 = ~$47.77/km. NOTA: La Biblia dice $73/km para moto, lo que sugiere que incluye un markup por desgaste/mantenimiento además de nafta pura.

### 1.6 Sección ZONAS

| Zona | Multiplicador | Bonus driver |
|------|--------------|--------------|
| **A — Centro y Costa** | ×1.00 | $0 |
| **B — Intermedia** | ×1.15 | +$150 |
| **C — Alta / Difícil** | ×1.35 | +$350 |

**Barrios por zona** (copiar al configurar):

**ZONA A**: Centro, General Belgrano, El Libertador, Los Fueguinos, 12 de Octubre, La Cantera, Los Morros, La Oca, Canal de Beagle, Balcones del Beagle, Bahía, Parque, Cañadón del Parque, Albatros, Soberanía Nacional, La Colina, Kaikén, Felipe Varela, Bella Vista, Los Andes, Perón, El Ecológico, Mirador del Beagle, El Jardín.

**ZONA B**: Río Pipo, Latinoamericano, Malvinas Argentinas, Los Alakalufes I y II, Bosque del Faldeo, Las Terrazas, La Cumbre, Andino, Valle de Andorra (sector consolidado).

**ZONA C**: El Escondido, Dos Banderas, La Cima, Las Raíces, Raíces IV, Kaupén, Mirador de los Andes / 640 Viviendas, Valle de Andorra (sector nuevo/informal).

**EXCLUIDA (sin servicio)**: Costa Susana — sin señal celular confiable.

### 1.7 Sección MULTIPLICADORES DINÁMICOS

**Clima** (activación manual por OPS):

| Condición | Multiplicador | Cuándo activar |
|-----------|--------------|----------------|
| Normal | ×1.00 | Día normal, sin precipitaciones |
| Lluvia/nieve leve | ×1.15 | Conducible pero lento |
| Temporal fuerte | ×1.30 | Viento >40km/h, nieve intensa |

**Demanda** (solo gastronomía, NO marketplace):

| Condición | Multiplicador | Cuándo activar |
|-----------|--------------|----------------|
| Normal | ×1.00 | Lunes a jueves |
| Alta | ×1.20 | Viernes y sábado |
| Pico | ×1.40 | Feriados, viernes-sábado post-23hs, eventos especiales |

**Bonus nocturno**: +30% al fee del repartidor entre 23:00 y 07:00. Lo paga Moovy, NO se le cobra al comprador.

---

## PASO 2: Configuración Logística (`/ops/configuracion-logistica`)

Esta sección maneja la asignación de repartidores, no los precios.

| Campo | Valor recomendado | Notas |
|-------|-------------------|-------|
| Timeout respuesta driver | **120** seg (2 min) | Tiempo para que el driver acepte |
| Timeout confirmación merchant | **300** seg (5 min) | Tiempo para que el comercio confirme |
| Intentos máximos de asignación | **5** | Cuántos drivers probar antes de cancelar |
| Radio búsqueda drivers | **5** km | Radio PostGIS para buscar drivers cercanos |

---

## PASO 3: Configuración General (`/ops/configuracion`)

Campos de UI/experiencia, NO financieros (los financieros van en Biblia):

| Campo | Valor | Notas |
|-------|-------|-------|
| Nombre de la tienda | **MOOVY** | |
| Moneda | **ARS** | |
| Zona horaria | **America/Argentina/Ushuaia** | |
| Horario operación | **00:00 - 23:59** | Moovy opera 24hs |

---

## PASO 4: Protocolo de Efectivo para Repartidores

Verificar en la Biblia (`/ops/config-biblia`), sección de efectivo:

| Campo | Valor Biblia v3 | Notas |
|-------|-----------------|-------|
| Entregas solo MP (driver nuevo) | **10** | Primeras 10 entregas = solo MercadoPago |
| Límite deuda L1 (10-30 entregas) | **$15,000** | |
| Límite deuda L2 (30-60 entregas) | **$25,000** | |
| Límite deuda L3 (60+ entregas) | **$40,000** | |

---

## PASO 5: Categorías de Paquete Marketplace

Si existe tabla DeliveryRate o configuración de categorías:

| Categoría | Peso cobrable | Fee BASE (ARS) | Vehículo mínimo |
|-----------|--------------|----------------|-----------------|
| **SOBRE** | 0-2 kg | $800 | Bici/Moto |
| **PEQUEÑO** | 2-5 kg | $1,200 | Moto |
| **MEDIANO** | 5-15 kg | $2,500 | Auto chico |
| **GRANDE** | 15-30 kg | $3,500 | Auto/SUV |
| **EXTRA GRANDE** | 30-70 kg | $5,000 | Pickup/SUV |
| **FLETE** | 70+ kg | $8,000 | Flete/Camión |

**Peso cobrable** = max(peso_real_kg, largo_cm × ancho_cm × alto_cm / 5000)

---

## PASO 6: Verificación Post-Configuración

Después de cargar TODOS los valores, hacer estas verificaciones:

### Test 1: Cálculo de envío (María, pedido de $20,000)

Escenario: Pedido de comida $20,000, moto, 3km, Zona A, clima normal.

```
Costo/km moto: $73
Distancia efectiva: 3km × 2.2 = 6.6km
Costo base viaje: $73 × 6.6 = $481.80
Comparar con mínimo moto: $1,500 > $481, usar $1,500
Multiplicador Zona A: $1,500 × 1.0 = $1,500
Multiplicador clima: $1,500 × 1.0 = $1,500
Costo operativo: $20,000 × 5% = $1,000
DELIVERY VISIBLE: $1,500 + $1,000 = $2,500 ✓
TOTAL MARÍA: $20,000 + $2,500 = $22,500
```

Distribución del delivery de $2,500:
- Repartidor: 80% de $1,500 (viaje) = **$1,200**
- Moovy: 20% de $1,500 + $1,000 (operativo) = **$1,300**

### Test 2: Pago con MercadoPago

```
Total cobrado: $22,500
MercadoPago cobra: 4% × $22,500 = -$900
Moovy recibe neto: $21,600
Paga al comercio (mes 1, 0%): -$20,000
Paga al repartidor: -$1,200
MOOVY GANA: $400 ✓
```

### Test 3: Puntos MOOVER

```
María gasta $20,000 (nivel MOOVER básico)
Puntos ganados: $20,000 × 0.01 = 200 puntos
Valor en ARS: 200 × $1 = $200
Cashback: $200 / $20,000 = 1% ✓

Próximo pedido de $15,000:
Max descuento: $15,000 × 20% = $3,000
María tiene 200 puntos → usa $200 de descuento
Paga: $15,000 - $200 = $14,800
```

### Test 4: Zona C con mal clima

```
Pedido $20,000, moto, 4km, Zona C, temporal fuerte:
Costo base: max($73 × 4 × 2.2, $1,500) = max($642.4, $1,500) = $1,500
Zona C: $1,500 × 1.35 = $2,025
Clima temporal: $2,025 × 1.30 = $2,632.50
Operativo: $20,000 × 5% = $1,000
DELIVERY VISIBLE: $2,632.50 + $1,000 = $3,632.50
Repartidor: 80% de $2,632.50 + bonus Zona C ($350) = $2,456
```

---

## CHECKLIST FINAL

Antes de dar por configurado el panel, verificar:

- [ ] Biblia Financiera: comisiones cargadas (0% mes 1 comercios, 8% mes 2+, 12% sellers)
- [ ] Biblia Financiera: puntos MOOVER con valores Biblia v3
- [ ] Biblia Financiera: boost lanzamiento activado (×2 puntos, desactivar 1 de mayo)
- [ ] Biblia Financiera: delivery con factor 2.2 y 5% operativo
- [ ] Biblia Financiera: vehículos con costos/km y fees mínimos
- [ ] Biblia Financiera: zonas A/B/C con multiplicadores y bonus driver
- [ ] Biblia Financiera: multiplicadores clima (normal/lluvia/temporal)
- [ ] Biblia Financiera: protocolo efectivo (10 entregas, límites progresivos)
- [ ] Config logística: timeouts de driver y merchant
- [ ] Config general: horario 24hs, zona horaria correcta
- [ ] Categorías marketplace: 6 categorías con fees BASE
- [ ] Test de cálculo: pedido $20,000 en moto a 3km Zona A = delivery $2,500

---

## RECORDATORIOS MENSUALES

| Fecha | Acción |
|-------|--------|
| **1 de mayo 2026** | Cambiar comisión comercios de 0% a 8%. Desactivar boost ×2 de puntos. Cambiar signup bonus de 1,000 a 500. |
| **Cada lunes** | Revisar multiplicador de clima si hay cambios estacionales |
| **Cada viernes** | Activar multiplicador demanda alta (×1.20) para viernes-sábado |
| **Cada feriado** | Activar multiplicador pico (×1.40) |
| **Mensual** | Verificar precio de nafta super. Si cambió >5%, actualizar costos/km de vehículos |

---

*Documento generado el 29 de marzo de 2026 — Basado en Biblia Financiera v3.0*
