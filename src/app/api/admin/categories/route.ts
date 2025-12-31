// API Route: Categories
import { NextResponse } from "next/server";
import { getAllCategories } from "@/lib/db";

export async function GET() {
    try {
        const categories = getAllCategories();
        return NextResponse.json(categories);
    } catch (error) {
        console.error("[API] Error fetching categories:", error);
        return NextResponse.json({ error: "Error fetching categories" }, { status: 500 });
    }
}
