# Prompts de Cowork — Moovy (Fase Final)

Estos son los prompts para la etapa crítica pre-lanzamiento.
Los Prompts 1 y 2 anteriores quedan archivados — ya cumplieron su función.

## Archivos

| Archivo | Qué hace | Frecuencia |
|---------|----------|------------|
| `PROMPT_3_CONSEJO_EXPERTOS.md` | Auditoría con 7 roles expertos + 5 issues conocidos del smoke test | Una sola vez |
| `PROMPT_4_UX_COMPLETO.md` | Auditoría UX pantalla por pantalla, incluyendo flujos del sistema PIN y subastas | Una sola vez (en paralelo al 3) |
| `PROMPT_5_DIARIO_FINAL.md` | Daily de resolución de issues con checklist de verificación | Todos los días |
| `PROMPT_6_GO_NOGO.md` | Veredicto final de lanzamiento con 6 flujos de humo en producción | Una sola vez, al final |

## Secuencia

**Día 1**: Corré el Prompt 3 y el Prompt 4 (podés abrirlos en paralelo en dos sesiones de Cowork).
→ Resultado: ISSUES.md generado con todo lo que hay que resolver.

**Días siguientes**: Prompt 5 cada día hasta que ISSUES.md no tenga nada en 🔴 ni 🟡.

**Último día**: Prompt 6. Si el veredicto es GO, abrís Moovy al público en somosmoovy.com.

## Issues ya conocidos (incorporados al Prompt 3)

El Prompt 3 ya incluye estos 5 issues del smoke test para que Opus los incorpore directamente al ISSUES.md sin redescubrirlos:

1. Bug del mapa de seguimiento horizontal (reset de viewport al hacer zoom)
2. Autocompra de productos propios permite fraude de puntos MOOVER
3. Flujo de subastas incompleto — crítico, no puede salir al público
4. Sistema PIN doble de entrega — no implementado (definido completamente en el prompt)
5. Posible falta de navegación entre secciones — a validar en somosmoovy.com

## Políticas de negocio ya definidas (incorporadas en los prompts)

- **Sistema PIN doble**: PIN de retiro (comercio → repartidor) + PIN de entrega (comprador → repartidor). Sin PIN del comprador no se puede marcar "entregado".
- **Flujo offline**: PINs se descargan al aceptar el pedido, funcionan sin señal, sincronizan al recuperar conexión. La foto de la puerta también se toma offline.
- **Comprador no estaba en casa**: no recupera el costo de envío. Solo se reembolsa el producto si vuelve al comercio. El repartidor cobra su 80% igual.
- **Repartidor fraudulento**: GPS confirma que no fue al domicilio → suspensión inmediata automática, Moovy cubre todo al comprador.
- **Historial de incidentes**: más de 5% de "no entregado" en un mes activa revisión manual.

## Diferencia con los Prompts 1 y 2

Los Prompts 1 y 2 eran de construcción: generar estructura, avanzar features, tachar tareas.
Esta suite es de certificación: verificar, corregir, y confirmar antes de abrir al público.

La regla nueva más importante está en el Prompt 5: **ninguna tarea se cierra sin haber probado el caso feliz y al menos un caso de error**.
