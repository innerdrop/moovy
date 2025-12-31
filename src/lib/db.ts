// Direct database access for product operations
// Uses better-sqlite3 directly to bypass Prisma adapter issues

import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");

function getDb() {
    return new Database(dbPath);
}

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
    createdAt: string;
    updatedAt: string;
    categories: Array<{ category: { id: string; name: string; slug: string } }>;
    images: Array<{ id: string; url: string; alt: string | null }>;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    isActive: boolean;
    order: number;
}

export function getAllProducts(): Product[] {
    const db = getDb();
    try {
        const products = db.prepare(`
            SELECT * FROM Product ORDER BY createdAt DESC
        `).all() as any[];

        // Get categories for each product
        const categoryStmt = db.prepare(`
            SELECT c.id, c.name, c.slug FROM Category c
            JOIN ProductCategory pc ON pc.categoryId = c.id
            WHERE pc.productId = ?
        `);

        // Get images for each product
        const imageStmt = db.prepare(`
            SELECT id, url, alt FROM ProductImage WHERE productId = ? LIMIT 1
        `);

        const result = products.map(p => ({
            ...p,
            isActive: Boolean(p.isActive),
            isFeatured: Boolean(p.isFeatured),
            categories: (categoryStmt.all(p.id) as any[]).map(c => ({ category: c })),
            images: imageStmt.all(p.id) as any[],
        }));

        db.close();
        return result;
    } catch (error) {
        console.error("[DB] Error fetching products:", error);
        db.close();
        return [];
    }
}

export function getAllCategories(): Category[] {
    const db = getDb();
    try {
        const categories = db.prepare(`
            SELECT * FROM Category ORDER BY "order" ASC
        `).all() as any[];

        db.close();
        return categories.map(c => ({
            ...c,
            isActive: Boolean(c.isActive),
        }));
    } catch (error) {
        console.error("[DB] Error fetching categories:", error);
        db.close();
        return [];
    }
}

export function getProductById(id: string): Product | null {
    const db = getDb();
    try {
        const product = db.prepare("SELECT * FROM Product WHERE id = ?").get(id) as any;
        if (!product) {
            db.close();
            return null;
        }

        const categories = db.prepare(`
            SELECT c.id, c.name, c.slug FROM Category c
            JOIN ProductCategory pc ON pc.categoryId = c.id
            WHERE pc.productId = ?
        `).all(id) as any[];

        const images = db.prepare(`
            SELECT id, url, alt FROM ProductImage WHERE productId = ?
        `).all(id) as any[];

        db.close();
        return {
            ...product,
            isActive: Boolean(product.isActive),
            isFeatured: Boolean(product.isFeatured),
            categories: categories.map(c => ({ category: c })),
            images,
        };
    } catch (error) {
        console.error("[DB] Error fetching product:", error);
        db.close();
        return null;
    }
}

export function createProduct(data: {
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
}): string | null {
    const db = getDb();
    try {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        db.prepare(`
            INSERT INTO Product (id, name, slug, description, price, costPrice, stock, minStock, isActive, isFeatured, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            id,
            data.name,
            data.slug,
            data.description || null,
            data.price,
            data.costPrice,
            data.stock || 0,
            data.minStock || 5,
            data.isActive !== false ? 1 : 0,
            data.isFeatured ? 1 : 0,
            now,
            now
        );

        // Link to category if provided
        if (data.categoryId) {
            db.prepare(`
                INSERT INTO ProductCategory (id, productId, categoryId)
                VALUES (?, ?, ?)
            `).run(crypto.randomUUID(), id, data.categoryId);
        }

        db.close();
        console.log("[DB] Product created:", data.name);
        return id;
    } catch (error) {
        console.error("[DB] Error creating product:", error);
        db.close();
        return null;
    }
}

export function updateProduct(id: string, data: Partial<{
    name: string;
    description: string;
    price: number;
    costPrice: number;
    stock: number;
    minStock: number;
    isActive: boolean;
    isFeatured: boolean;
}>): boolean {
    const db = getDb();
    try {
        const updates: string[] = [];
        const values: any[] = [];

        if (data.name !== undefined) { updates.push("name = ?"); values.push(data.name); }
        if (data.description !== undefined) { updates.push("description = ?"); values.push(data.description); }
        if (data.price !== undefined) { updates.push("price = ?"); values.push(data.price); }
        if (data.costPrice !== undefined) { updates.push("costPrice = ?"); values.push(data.costPrice); }
        if (data.stock !== undefined) { updates.push("stock = ?"); values.push(data.stock); }
        if (data.minStock !== undefined) { updates.push("minStock = ?"); values.push(data.minStock); }
        if (data.isActive !== undefined) { updates.push("isActive = ?"); values.push(data.isActive ? 1 : 0); }
        if (data.isFeatured !== undefined) { updates.push("isFeatured = ?"); values.push(data.isFeatured ? 1 : 0); }

        updates.push("updatedAt = ?");
        values.push(new Date().toISOString());
        values.push(id);

        db.prepare(`UPDATE Product SET ${updates.join(", ")} WHERE id = ?`).run(...values);
        db.close();
        return true;
    } catch (error) {
        console.error("[DB] Error updating product:", error);
        db.close();
        return false;
    }
}

export function deleteProduct(id: string): boolean {
    const db = getDb();
    try {
        db.prepare("DELETE FROM ProductCategory WHERE productId = ?").run(id);
        db.prepare("DELETE FROM ProductImage WHERE productId = ?").run(id);
        db.prepare("DELETE FROM Product WHERE id = ?").run(id);
        db.close();
        return true;
    } catch (error) {
        console.error("[DB] Error deleting product:", error);
        db.close();
        return false;
    }
}
