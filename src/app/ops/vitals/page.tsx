import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Web Vitals | Panel de Operaciones",
  description: "Monitor de rendimiento de Web Vitals en tiempo real",
};

export default function VitalsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Web Vitals</h1>
        <p className="text-gray-600 mt-1">
          Monitoreo de rendimiento de usuarios reales en MOOVY
        </p>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* LCP */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                LCP
              </p>
              <p className="text-gray-900 text-lg font-semibold mt-1">
                Largest Contentful Paint
              </p>
            </div>
            <span className="text-2xl">🎨</span>
          </div>
          <div className="mt-4 space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>✅ Bueno:</span>
              <span className="font-mono">&le; 2.5s</span>
            </div>
            <div className="flex justify-between">
              <span>⚠️ Necesita mejora:</span>
              <span className="font-mono">2.5s - 4s</span>
            </div>
            <div className="flex justify-between">
              <span>❌ Pobre:</span>
              <span className="font-mono">&gt; 4s</span>
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Tiempo en que el contenido visual más grande es renderizado en pantalla.
          </p>
        </div>

        {/* FID / INP */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                INP
              </p>
              <p className="text-gray-900 text-lg font-semibold mt-1">
                Interaction to Next Paint
              </p>
            </div>
            <span className="text-2xl">⚡</span>
          </div>
          <div className="mt-4 space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>✅ Bueno:</span>
              <span className="font-mono">&le; 200ms</span>
            </div>
            <div className="flex justify-between">
              <span>⚠️ Necesita mejora:</span>
              <span className="font-mono">200ms - 500ms</span>
            </div>
            <div className="flex justify-between">
              <span>❌ Pobre:</span>
              <span className="font-mono">&gt; 500ms</span>
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Latencia de respuesta a las interacciones del usuario (clics, toques, teclado).
          </p>
        </div>

        {/* CLS */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                CLS
              </p>
              <p className="text-gray-900 text-lg font-semibold mt-1">
                Cumulative Layout Shift
              </p>
            </div>
            <span className="text-2xl">📐</span>
          </div>
          <div className="mt-4 space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>✅ Bueno:</span>
              <span className="font-mono">&le; 0.1</span>
            </div>
            <div className="flex justify-between">
              <span>⚠️ Necesita mejora:</span>
              <span className="font-mono">0.1 - 0.25</span>
            </div>
            <div className="flex justify-between">
              <span>❌ Pobre:</span>
              <span className="font-mono">&gt; 0.25</span>
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Cambios de posición inesperados de elementos durante la carga.
          </p>
        </div>

        {/* TTFB */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                TTFB
              </p>
              <p className="text-gray-900 text-lg font-semibold mt-1">
                Time to First Byte
              </p>
            </div>
            <span className="text-2xl">🌐</span>
          </div>
          <div className="mt-4 space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>✅ Bueno:</span>
              <span className="font-mono">&le; 600ms</span>
            </div>
            <div className="flex justify-between">
              <span>⚠️ Necesita mejora:</span>
              <span className="font-mono">600ms - 1200ms</span>
            </div>
            <div className="flex justify-between">
              <span>❌ Pobre:</span>
              <span className="font-mono">&gt; 1200ms</span>
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Tiempo desde que se inicia la solicitud hasta que se recibe el primer byte.
          </p>
        </div>

        {/* FCP */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                FCP
              </p>
              <p className="text-gray-900 text-lg font-semibold mt-1">
                First Contentful Paint
              </p>
            </div>
            <span className="text-2xl">📊</span>
          </div>
          <div className="mt-4 space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>✅ Bueno:</span>
              <span className="font-mono">&le; 1.8s</span>
            </div>
            <div className="flex justify-between">
              <span>⚠️ Necesita mejora:</span>
              <span className="font-mono">1.8s - 3s</span>
            </div>
            <div className="flex justify-between">
              <span>❌ Pobre:</span>
              <span className="font-mono">&gt; 3s</span>
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Tiempo en que el primer contenido (texto, imagen) se pinta en pantalla.
          </p>
        </div>

        {/* Debug Info */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 uppercase tracking-wide">
                Debug
              </p>
              <p className="text-gray-900 text-lg font-semibold mt-1">
                Estadísticas en Desarrollo
              </p>
            </div>
            <span className="text-2xl">🔧</span>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            En desarrollo, las métricas se muestran en la consola del navegador con colores:
          </p>
          <div className="mt-3 space-y-2 text-sm font-mono">
            <p>
              <span style={{ color: "green" }}>● Verde:</span> Bueno
            </p>
            <p>
              <span style={{ color: "orange" }}>● Naranja:</span> Necesita mejora
            </p>
            <p>
              <span style={{ color: "red" }}>● Rojo:</span> Pobre
            </p>
          </div>
          <p className="mt-4 text-xs text-blue-600">
            En producción, las métricas se envían a <code>/api/analytics/vitals</code>
          </p>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-amber-50 rounded-lg border border-amber-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Próximos pasos</h2>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>
            <strong>Integración externa:</strong> Enviar datos a un servicio de analytics
            externo (Vercel Analytics, DataDog, Sentry, etc.)
          </li>
          <li>
            <strong>Dashboard en tiempo real:</strong> Agregar gráficos para visualizar
            tendencias de rendimiento
          </li>
          <li>
            <strong>Alertas:</strong> Configurar notificaciones cuando las métricas
            empeoren
          </li>
          <li>
            <strong>Análisis por página:</strong> Desglosar rendimiento por ruta
            (tienda, checkout, etc.)
          </li>
          <li>
            <strong>Historial:</strong> Guardar datos en la base de datos para análisis
            histórico
          </li>
        </ul>
      </div>

      {/* API Documentation */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">API Documentation</h2>
        <div className="space-y-4 text-sm text-gray-700">
          <div>
            <p className="font-mono font-semibold mb-2">POST /api/analytics/vitals</p>
            <p className="mb-3">Envía una métrica de Web Vitals al servidor.</p>
            <div className="bg-white p-3 rounded border border-gray-200 font-mono text-xs overflow-auto">
              <p className="mb-2">// Payload:</p>
              <pre>{`{
  "name": "LCP",
  "value": 2.3,
  "rating": "good",
  "id": "metric-id",
  "url": "/page",
  "timestamp": 1234567890
}`}</pre>
            </div>
          </div>

          <div>
            <p className="font-mono font-semibold mb-2">
              GET /api/analytics/vitals (solo en desarrollo)
            </p>
            <p>
              Recupera estadísticas agregadas de las métricas almacenadas (percentiles,
              promedios, distribución de ratings).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
