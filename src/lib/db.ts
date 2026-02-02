// Direct database access via Prisma (PostgreSQL compatible)
import { prisma } from "@/lib/prisma";

// Re-export types compliant with frontend expectations
export interface Product {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    costPrice: number;
    stock: number;
    minStock: number;
    isActive: boolean;
    isFeatured: boolean;
    createdAt: Date; // Changed from string to Date for Prisma compatibility
    updatedAt: Date;
    categories: Array<{ category: { id: string; name: string; slug: string } }>;
    images: Array<{ id: string; url: string; alt: string | null }>;
    image?: string | null; // Helper property for frontend compatibility
    merchantId?: string; // Changed to match frontend expectation (undefined instead of null)
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    isActive: boolean;
    order: number;
    image?: string | null;
}

export async function getAllProducts(): Promise<Product[]> {
    try {
        const products = await prisma.product.findMany({
            where: {
                merchantId: { not: null } // Solo productos con comercio asignado
            },
            include: {
                categories: {
                    include: {
                        category: true
                    }
                },
                images: true
            },
            orderBy: { createdAt: 'desc' }
        });

        // Map to ensure compatibility
        return products.map(p => ({
            ...p,
            merchantId: p.merchantId || undefined, // Convert null to undefined
            image: p.images[0]?.url || null
        }));
    } catch (error) {
        console.error("[DB] Error fetching products:", error);
        return [];
    }
}

export async function getAllCategories(): Promise<Category[]> {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { order: 'asc' }
        });
        return categories;
    } catch (error) {
        console.error("[DB] Error fetching categories:", error);
        return [];
    }
}

export async function getProductById(id: string): Promise<Product | null> {
    try {
        const product = await prisma.product.findFirst({
            where: {
                id,
                merchantId: { not: null } // Solo productos con comercio asignado
            },
            include: {
                categories: {
                    include: {
                        category: true
                    }
                },
                images: true
            }
        });

        if (!product) return null;

        return {
            ...product,
            merchantId: product.merchantId || undefined, // Convert null to undefined
            image: product.images[0]?.url || null
        };
    } catch (error) {
        console.error("[DB] Error fetching product:", error);
        return null;
    }
}

// Admin operations - using standard Prisma patterns
// These functions might be redundant if admin pages use Prisma directly, 
// but kept for compatibility with existing calls.

export async function createProduct(data: {
    name: string;
    slug: string;
    description?: string;
    price: number;
    costPrice: number;
    stock?: number;
    minStock?: number;
    isActive?: boolean;
    isFeatured?: boolean;
    categoryId?: string;
    image?: string; // Optional single image for simple creation
}): Promise<string | null> {
    try {
        const product = await prisma.product.create({
            data: {
                name: data.name,
                slug: data.slug,
                description: data.description,
                price: data.price,
                costPrice: data.costPrice,
                stock: data.stock || 0,
                minStock: data.minStock || 5,
                isActive: data.isActive ?? true,
                isFeatured: data.isFeatured ?? false,
                categories: data.categoryId ? {
                    create: {
                        categoryId: data.categoryId
                    }
                } : undefined,
                images: data.image ? {
                    create: {
                        url: data.image,
                        order: 0
                    }
                } : undefined
            }
        });
        return product.id;
    } catch (error) {
        console.error("[DB] Error creating product:", error);
        return null;
    }
}

export async function updateProduct(id: string, data: Partial<{
    name: string;
    description: string;
    price: number;
    costPrice: number;
    stock: number;
    minStock: number;
    isActive: boolean;
    isFeatured: boolean;
}>): Promise<boolean> {
    try {
        await prisma.product.update({
            where: { id },
            data
        });
        return true;
    } catch (error) {
        console.error("[DB] Error updating product:", error);
        return false;
    }
}

export async function deleteProduct(id: string): Promise<boolean> {
    try {
        await prisma.product.delete({
            where: { id }
        });
        return true;
    } catch (error) {
        console.error("[DB] Error deleting product:", error);
        return false;
    }
}
