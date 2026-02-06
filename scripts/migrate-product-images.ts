/**
 * Script para migrar imágenes de productos existentes
 * Busca productos que tengan archivos de imagen en /public/uploads/products
 * y crea registros en ProductImage si no existen
 * 
 * Ejecutar con: npx ts-node scripts/migrate-product-images.ts
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function migrateProductImages() {
    console.log("🔍 Buscando productos sin imágenes...\n");

    // Get all products
    const products = await prisma.product.findMany({
        include: {
            images: true
        }
    });

    console.log(`📦 Total de productos: ${products.length}`);

    // Products without images
    const productsWithoutImages = products.filter(p => p.images.length === 0);
    console.log(`🖼️  Productos sin imágenes: ${productsWithoutImages.length}\n`);

    if (productsWithoutImages.length === 0) {
        console.log("✅ Todos los productos ya tienen imágenes vinculadas.");
        await prisma.$disconnect();
        return;
    }

    // Check uploads directory for images
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "products");

    if (!fs.existsSync(uploadsDir)) {
        console.log("❌ No existe el directorio de uploads: " + uploadsDir);
        await prisma.$disconnect();
        return;
    }

    const uploadedFiles = fs.readdirSync(uploadsDir);
    console.log(`📁 Archivos en uploads/products: ${uploadedFiles.length}\n`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const product of productsWithoutImages) {
        // Try to find a matching image file based on product slug or name
        const productSlug = product.slug.toLowerCase();
        const productName = product.name.toLowerCase().replace(/\s+/g, "-");

        // Look for files that might match this product
        const matchingFile = uploadedFiles.find(file => {
            const fileName = file.toLowerCase();
            return fileName.includes(productSlug) || fileName.includes(productName);
        });

        if (matchingFile) {
            const imageUrl = `/uploads/products/${matchingFile}`;

            try {
                await prisma.productImage.create({
                    data: {
                        productId: product.id,
                        url: imageUrl,
                        alt: product.name,
                        order: 0
                    }
                });
                console.log(`✅ ${product.name} -> ${imageUrl}`);
                migratedCount++;
            } catch (error) {
                console.log(`⚠️  Error al migrar ${product.name}: ${error}`);
                skippedCount++;
            }
        } else {
            console.log(`⏭️  ${product.name} - No se encontró imagen coincidente`);
            skippedCount++;
        }
    }

    console.log("\n📊 Resumen:");
    console.log(`   ✅ Migrados: ${migratedCount}`);
    console.log(`   ⏭️  Sin imagen encontrada: ${skippedCount}`);

    await prisma.$disconnect();
}

// Also create a function to list all existing images that are not linked
async function listOrphanImages() {
    console.log("\n🔍 Buscando imágenes sin vincular...\n");

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "products");

    if (!fs.existsSync(uploadsDir)) {
        console.log("❌ No existe el directorio de uploads");
        return;
    }

    const uploadedFiles = fs.readdirSync(uploadsDir);
    const linkedImages = await prisma.productImage.findMany({
        select: { url: true }
    });

    const linkedUrls = new Set(linkedImages.map(img => img.url));

    const orphanFiles = uploadedFiles.filter(file => {
        const url = `/uploads/products/${file}`;
        return !linkedUrls.has(url);
    });

    if (orphanFiles.length > 0) {
        console.log(`📁 Imágenes no vinculadas (${orphanFiles.length}):`);
        orphanFiles.forEach(file => console.log(`   - ${file}`));
    } else {
        console.log("✅ Todas las imágenes están vinculadas a productos.");
    }
}

// Main execution
async function main() {
    try {
        await migrateProductImages();
        await listOrphanImages();
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
