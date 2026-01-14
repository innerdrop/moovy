// API Route: Products CRUD
import { NextRequest, NextResponse } from "next/server";
import { getAllProducts, createProduct } from "@/lib/db";

export async function GET() {
    try {
        const products = getAllProducts();
        return NextResponse.json(products);
    } catch (error) {
        console.error("[API] Error fetching products:", error);
        return NextResponse.json({ error: "Error fetching products" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();

        // Validate required fields
        if (!data.name || !data.price || !data.costPrice) {
            return NextResponse.json(
                { error: "Nombre, precio y costo son requeridos" },
                { status: 400 }
            );
        }

        // Create product
        const productId = createProduct({
            name: data.name,
            slug: data.slug,
            description: data.description,
            price: Number(data.price),
            costPrice: Number(data.costPrice),
            stock: Number(data.stock) || 0,
            minStock: Number(data.minStock) || 5,
            isActive: data.isActive !== false,
            isFeatured: data.isFeatured === true,
            categoryId: data.categoryId || undefined,
        });

        if (productId) {
            return NextResponse.json({ success: true, id: productId });
        } else {
            return NextResponse.json({ error: "Error creating product" }, { status: 500 });
        }
    } catch (error) {
        console.error("[API] Error creating product:", error);
        return NextResponse.json({ error: "Error creating product" }, { status: 500 });
    }
}

