
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const replacements: Record<string, string> = {
    'cñsmico': 'cósmico',
    'Tardño': 'Tardío',
    'Tñnica': 'Tónica',
    'Manñ': 'Maní',
    'Rosñ': 'Rosé',
    '??rabe': 'Árabe',
    'Cl??sica': 'Clásica',
    'Salm??n': 'Salmón',
    'Vi??a': 'Viña',
    'Tama??o': 'Tamaño',
    'Lim??n': 'Limón',
    '??': 'ñ'
};

async function repair() {
    console.log('--- Iniciando reparación de caracteres ---');

    // 1. Repair Categories
    const categories = await prisma.category.findMany();
    for (const cat of categories) {
        let newName = cat.name;
        let newDesc = cat.description;

        for (const [broken, fixed] of Object.entries(replacements)) {
            if (newName.includes(broken)) newName = newName.replace(new RegExp(broken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fixed);
            if (newDesc?.includes(broken)) newDesc = newDesc.replace(new RegExp(broken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fixed);
        }

        if (newName !== cat.name || newDesc !== cat.description) {
            await prisma.category.update({
                where: { id: cat.id },
                data: { name: newName, description: newDesc }
            });
            console.log(`Categoría reparada: ${cat.name} -> ${newName}`);
        }
    }

    // 2. Repair Products
    const products = await prisma.product.findMany();
    for (const prod of products) {
        let newName = prod.name;
        let newDesc = prod.description;

        for (const [broken, fixed] of Object.entries(replacements)) {
            if (newName.includes(broken)) newName = newName.replace(new RegExp(broken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fixed);
            if (newDesc?.includes(broken)) newDesc = newDesc.replace(new RegExp(broken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fixed);
        }

        if (newName !== prod.name || newDesc !== prod.description) {
            await prisma.product.update({
                where: { id: prod.id },
                data: { name: newName, description: newDesc }
            });
            console.log(`Producto reparado: ${prod.name} -> ${newName}`);
        }
    }

    console.log('--- Reparación finalizada ---');
}

repair()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
