// Script to fix encoding issues in existing database records
import { prisma } from "../src/lib/prisma";

// Fix encoding by detecting and replacing corrupted patterns
function fixEncoding(text: string | null): string | null {
    if (!text) return text;

    let fixed = text;

    // Pattern: double question marks usually mean a corrupted accent
    // We'll look for specific patterns and fix them
    const patterns: [RegExp, string][] = [
        // Common UTF-8 double-encoded patterns
        [/\?\?/g, ""],  // Remove standalone ??
        [/Ã¡/g, "a"],
        [/Ã©/g, "e"],
        [/Ã­/g, "i"],
        [/Ã³/g, "o"],
        [/Ãº/g, "u"],
        [/Ã±/g, "n"],
        [/Ã¼/g, "u"],
        [/Ã/g, "A"],
        [/Ã‰/g, "E"],
        [/Ã/g, "I"],
        [/Ã"/g, "O"],
        [/Ãš/g, "U"],
        [/Ã'/g, "N"],
    ];

    for (const [pattern, replacement] of patterns) {
        fixed = fixed.replace(pattern, replacement);
    }

    return fixed;
}

async function fixDatabase() {
    console.log("Starting encoding fix...\n");

    // Fix Categories
    console.log("Fixing Categories...");
    const categories = await prisma.category.findMany();
    for (const cat of categories) {
        const fixedName = fixEncoding(cat.name);
        const fixedDesc = fixEncoding(cat.description);

        if (fixedName !== cat.name || fixedDesc !== cat.description) {
            await prisma.category.update({
                where: { id: cat.id },
                data: {
                    name: fixedName || cat.name,
                    description: fixedDesc,
                },
            });
            console.log("Fixed: " + cat.name + " -> " + fixedName);
        }
    }

    // Fix Products
    console.log("\nFixing Products...");
    const products = await prisma.product.findMany();
    let productCount = 0;
    for (const prod of products) {
        const fixedName = fixEncoding(prod.name);
        const fixedDesc = fixEncoding(prod.description);

        if (fixedName !== prod.name || fixedDesc !== prod.description) {
            await prisma.product.update({
                where: { id: prod.id },
                data: {
                    name: fixedName || prod.name,
                    description: fixedDesc,
                },
            });
            productCount++;
        }
    }
    console.log("Fixed " + productCount + " products");

    // Fix Merchants
    console.log("\nFixing Merchants...");
    const merchants = await prisma.merchant.findMany();
    for (const merch of merchants) {
        const fixedName = fixEncoding(merch.name);
        const fixedDesc = fixEncoding(merch.description);

        if (fixedName !== merch.name || fixedDesc !== merch.description) {
            await prisma.merchant.update({
                where: { id: merch.id },
                data: {
                    name: fixedName || merch.name,
                    description: fixedDesc,
                },
            });
            console.log("Fixed: " + merch.name + " -> " + fixedName);
        }
    }

    console.log("\nEncoding fix complete!");
}

fixDatabase()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
