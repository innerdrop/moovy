import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

interface ImportRow {
    name: string;
    slug: string;
    description: string;
    price: number;
    costPrice: number;
    stock: number;
    minStock: number;
    categorySlug: string;
    packageCategory: string;
    maxWeightGrams: number;
    maxLengthCm: number;
    maxWidthCm: number;
    maxHeightCm: number;
    volumeScore: number;
    allowedVehicles: string;
}

interface ImportResult {
    row: number;
    name: string;
    status: "created" | "skipped" | "error";
    reason?: string;
}

function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

// POST - Bulk import products from parsed data (JSON array)
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const body = await request.json();
        const { rows, dryRun = false } = body as { rows: ImportRow[]; dryRun?: boolean };

        if (!rows || !Array.isArray(rows) || rows.length === 0) {
            return NextResponse.json({ error: "No se recibieron filas para importar" }, { status: 400 });
        }

        if (rows.length > 500) {
            return NextResponse.json({ error: "Máximo 500 productos por importación" }, { status: 400 });
        }

        // Pre-fetch all categories and package categories for mapping
        const [categories, packageCategories, existingSlugs] = await Promise.all([
            prisma.category.findMany({ select: { id: true, slug: true, name: true } }),
            prisma.packageCategory.findMany({ where: { isActive: true } }),
            prisma.product.findMany({
                where: { merchantId: null },
                select: { slug: true },
            }),
        ]);

        const categoryMap = new Map(categories.map((c) => [c.slug, c.id]));
        const pkgCatMap = new Map(packageCategories.map((p) => [p.name, p.id]));
        const existingSlugSet = new Set(existingSlugs.map((p) => p.slug));

        const results: ImportResult[] = [];
        let created = 0;
        let skipped = 0;
        let errors = 0;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNum = i + 1;

            // Validate required fields
            if (!row.name?.trim()) {
                results.push({ row: rowNum, name: "(vacío)", status: "error", reason: "Nombre vacío" });
                errors++;
                continue;
            }

            const slug = row.slug?.trim() || generateSlug(row.name);

            // Check duplicate slug
            if (existingSlugSet.has(slug)) {
                results.push({ row: rowNum, name: row.name, status: "skipped", reason: `Slug "${slug}" ya existe` });
                skipped++;
                continue;
            }

            // Validate packageCategory
            const pkgCatName = row.packageCategory?.trim()?.toUpperCase();
            if (pkgCatName && !pkgCatMap.has(pkgCatName)) {
                results.push({
                    row: rowNum,
                    name: row.name,
                    status: "error",
                    reason: `PackageCategory "${pkgCatName}" no existe. Opciones: ${[...pkgCatMap.keys()].join(", ")}`,
                });
                errors++;
                continue;
            }

            // Resolve category
            const catSlug = row.categorySlug?.trim();
            let categoryId: string | null = null;
            if (catSlug) {
                categoryId = categoryMap.get(catSlug) || null;
                if (!categoryId) {
                    results.push({
                        row: rowNum,
                        name: row.name,
                        status: "error",
                        reason: `Categoría "${catSlug}" no existe. Categorías: ${[...categoryMap.keys()].join(", ")}`,
                    });
                    errors++;
                    continue;
                }
            }

            if (dryRun) {
                results.push({ row: rowNum, name: row.name, status: "created", reason: "Validación OK (dry run)" });
                created++;
                existingSlugSet.add(slug);
                continue;
            }

            // Create product
            try {
                await prisma.product.create({
                    data: {
                        name: row.name.trim(),
                        slug,
                        description: row.description?.trim() || null,
                        price: Number(row.price) || 0,
                        costPrice: Number(row.costPrice) || 0,
                        stock: Number(row.stock) || 100,
                        minStock: Number(row.minStock) || 5,
                        isActive: true,
                        isFeatured: false,
                        merchantId: null, // Master catalog product
                        packageCategoryId: pkgCatName ? pkgCatMap.get(pkgCatName) : undefined,
                        categories: categoryId
                            ? { create: { categoryId } }
                            : undefined,
                    },
                });

                results.push({ row: rowNum, name: row.name, status: "created" });
                created++;
                existingSlugSet.add(slug);
            } catch (err: any) {
                const msg = err?.message?.includes("Unique constraint")
                    ? "Slug duplicado"
                    : err?.message?.slice(0, 80) || "Error desconocido";
                results.push({ row: rowNum, name: row.name, status: "error", reason: msg });
                errors++;
            }
        }

        // Audit log
        await logAudit({
            action: "BULK_IMPORT_PRODUCTS",
            entityType: "Product",
            entityId: `import-${new Date().toISOString()}`,
            userId: session.user.id,
            details: {
                totalRows: rows.length,
                created,
                skipped,
                errors,
                dryRun,
            },
        });

        return NextResponse.json({
            summary: { total: rows.length, created, skipped, errors, dryRun },
            results,
        });
    } catch (error) {
        console.error("Import error:", error);
        return NextResponse.json({ error: "Error al importar productos" }, { status: 500 });
    }
}
