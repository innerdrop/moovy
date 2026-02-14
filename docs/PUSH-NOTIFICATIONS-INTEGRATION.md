// =====================================================
// EJEMPLO DE INTEGRACIÓN: Push Notifications en Dashboard de Repartidor
// =====================================================
// Como usar el hook usePushNotifications en el dashboard

import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useEffect } from "react";

export default function RiderDashboard() {
  const { 
    isSupported, 
    permission, 
    isSubscribed, 
    requestPermission 
  } = usePushNotifications();

  // Solicitar permiso cuando el repartidor se conecte
  useEffect(() => {
    if (isSupported && permission === 'default' && !isSubscribed) {
      // Mostrar banner o botón para pedir permiso
      // IMPORTANTE: Debe ser disparado por un click del usuario
    }
  }, [isSupported, permission, isSubscribed]);

  const handleEnableNotifications = async () => {
    const success = await requestPermission();
    if (success) {
      console.log("✅ Notificaciones habilitadas");
    } else {
      console.log("❌ Permiso denegado");
    }
  };

  return (
    <div>
      {/* Mostrar cuadro de alerta si no tiene push habilitado */}
      {isSupported && !isSubscribed && (
        <div className="bg-yellow-50 p-4 rounded-lg mb-4">
          <p className="font-semibold">📬 Recibe alertas de pedidos</p>
          <p className="text-sm text-gray-600">
            Habilita las notificaciones para recibir ofertas incluso con la pantalla bloqueada.
          </p>
          <button 
            onClick={handleEnableNotifications}
            className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Activar Notificaciones
          </button>
        </div>
      )}

      {/* Resto del dashboard... */}
    </div>
  );
}

// =====================================================
// ENVIAR PUSH DESDE EL SERVIDOR
// =====================================================
// Cuando se asigna una orden a un repartidor

async function notifyRider(driverId: string, orderId: string) {
  try {
    await fetch('http://localhost:3000/api/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ process.env.INTERNAL_API_TOKEN}`
      },
      body: JSON.stringify({
        userId: driverId,
        title: '🚀 Nueva oferta de entrega',
        body: `Orden #${orderId} - Toca para ver detalles`,
        data: {
          orderId,
          url: `/repartidor/dashboard?order=${orderId}`
        }
      })
    });
  } catch (error) {
    console.error('Error sending push:', error);
  }
}
