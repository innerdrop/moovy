// Script para activar modo mantenimiento directamente
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function enableMaintenance() {
    try {
        const result = await prisma.storeSettings.upsert({
            where: { id: 'settings' },
            update: {
                isMaintenanceMode: true,
                maintenanceMessage: '¡Volvemos pronto! Estamos trabajando para mejorar tu experiencia.'
            },
            create: {
                id: 'settings',
                isMaintenanceMode: true,
                maintenanceMessage: '¡Volvemos pronto! Estamos trabajando para mejorar tu experiencia.'
            }
        });

        console.log('✅ Modo mantenimiento ACTIVADO:', result);
        console.log('📱 La landing en www.somosmoovy.com mostrará "Volvemos Pronto"');
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

enableMaintenance();
