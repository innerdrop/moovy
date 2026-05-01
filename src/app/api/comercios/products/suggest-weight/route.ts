// API: POST /api/comercios/products/suggest-weight
// Rama: feat/peso-volumen-productos
//
// Devuelve una sugerencia de peso/volumen para un producto a partir de su nombre
// (y descripción opcional). Usa cache global como fuente primaria, IA como
// fuente secundaria (cuando ENABLE_AI_WEIGHT_SUGGEST=true), y heurística por
// keywords como último recurso (gratis, instantáneo).
//
// FLUJO:
//   1. Auth: solo MERCHANT o ADMIN.
//   2. Rate limit: 100 sugerencias/hora por IP (defensa contra script malicioso).
//   3. Validación Zod del body.
//   4. Normaliza nombre + hashea (sha256).
//   5. Busca en ProductWeightCache. Hit → incrementa hitCount, devuelve.
//   6. Miss + flag IA ON + ANTHROPIC_API_KEY presente → llama Haiku, persiste.
//   7. Miss + flag IA OFF (o sin key) → heurística por keywords. NO persiste
//      (la heurística es determinística, no aporta dato nuevo).
//   8. Si ni heurística matchea → devuelve null (cliente carga manual).
//
// IMPORTANTE: el endpoint NUNCA falla silenciosamente. Si la IA está prendida
// pero la API no responde, hace fallback a heurística y loguea warn. El form
// del comercio siempre recibe respuesta utilizable.

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import { applyHeuristic, getSizeFromWeight, hashProductName, normalizeProductName, ProductSize } from "@/lib/product-weight";
import logger from "@/lib/logger";

const productLogger = logger.child({ module: "products" });

const SuggestRequestSchema = z.object({
  name: z.string().trim().min(2, "Nombre muy corto").max(200, "Nombre muy largo"),
  description: z.string().max(2000).optional().nullable(),
});

type SuggestSource = "CACHE" | "AI" | "HEURISTIC" | "NONE";

interface SuggestResponse {
  weightGrams: number | null;
  volumeMl: number | null;
  packageCategoryId: string | null;
  suggestedVehicle: string | null;
  /** Categoría visual sugerida (MICRO/SMALL/MEDIUM/LARGE/XL) — UI principal del comerciante */
  suggestedSize: ProductSize | null;
  source: SuggestSource;
  confidence: number;
  matchedPatterns?: string[];
}

export async function POST(request: Request) {
  // ─── Auth ──────────────────────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user?.id || !hasAnyRole(session, ["MERCHANT", "ADMIN"])) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // ─── Rate limit (100/hora por IP) ──────────────────────────────────────────
  const limit = await applyRateLimit(request, "products:suggest-weight", 100, 3600_000);
  if (limit) return limit;

  // ─── Body validation ───────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const parsed = SuggestRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Parámetros inválidos", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { name, description } = parsed.data;
  const startedAt = Date.now();

  // ─── Cache lookup ──────────────────────────────────────────────────────────
  const nameHash = hashProductName(name);
  try {
    const cached = await prisma.productWeightCache.findUnique({
      where: { nameHash },
    });

    if (cached) {
      // Hit — incrementar contador (best-effort, no bloquea respuesta)
      prisma.productWeightCache
        .update({
          where: { id: cached.id },
          data: { hitCount: { increment: 1 } },
        })
        .catch((err) => {
          productLogger.warn({ err, nameHash }, "Failed to increment hitCount");
        });

      productLogger.info(
        {
          userId: session.user.id,
          source: "CACHE",
          cacheSource: cached.source,
          latencyMs: Date.now() - startedAt,
          confidence: cached.confidence,
        },
        "Weight suggestion served from cache"
      );

      const response: SuggestResponse = {
        weightGrams: cached.weightGrams,
        volumeMl: cached.volumeMl,
        packageCategoryId: cached.packageCategoryId,
        suggestedVehicle: cached.suggestedVehicle,
        suggestedSize: getSizeFromWeight(cached.weightGrams),
        source: "CACHE",
        confidence: cached.confidence,
      };
      return NextResponse.json(response);
    }
  } catch (err) {
    productLogger.error({ err, nameHash }, "Cache lookup failed — falling through");
    // No retornamos error: seguimos con IA/heurística
  }

  // ─── IA (Haiku) si está habilitada y configurada ───────────────────────────
  const aiEnabled = process.env.ENABLE_AI_WEIGHT_SUGGEST === "true";
  const aiKeyPresent = Boolean(process.env.ANTHROPIC_API_KEY);

  if (aiEnabled && aiKeyPresent) {
    // STUB pre-launch: la integración real con Anthropic queda lista para
    // enchufar en mes 2 cuando se genere la API key paga. Por ahora, si el
    // flag está ON pero estamos en un entorno sin la integración construida,
    // logueamos warn y caemos a heurística para no bloquear al comercio.
    //
    // Cuando se implemente, esta sección debe:
    //   1. Llamar a Anthropic con prompt: "Devolveme weightGrams y volumeMl
    //      JSON para este producto: {name} - {description}".
    //   2. Parsear respuesta como { weightGrams, volumeMl, suggestedVehicle }.
    //   3. Persistir en ProductWeightCache con source:"AI", confidence segun
    //      el modelo (Haiku = ~75-85 promedio).
    //   4. Devolver la sugerencia con source:"AI".
    productLogger.warn(
      { userId: session.user.id, name },
      "AI weight suggestion enabled but integration not implemented yet — falling back to heuristic"
    );
  }

  // ─── Heurística por keywords (fallback determinístico) ─────────────────────
  const heuristic = applyHeuristic(name, description ?? null);

  if (heuristic) {
    productLogger.info(
      {
        userId: session.user.id,
        source: "HEURISTIC",
        latencyMs: Date.now() - startedAt,
        confidence: heuristic.confidence,
        matchedPatterns: heuristic.matchedPatterns,
      },
      "Weight suggestion served from heuristic"
    );

    const response: SuggestResponse = {
      weightGrams: heuristic.weightGrams,
      volumeMl: heuristic.volumeMl,
      packageCategoryId: null,
      suggestedVehicle: null,
      suggestedSize: getSizeFromWeight(heuristic.weightGrams),
      source: "HEURISTIC",
      confidence: heuristic.confidence,
      matchedPatterns: heuristic.matchedPatterns,
    };
    return NextResponse.json(response);
  }

  // ─── No hay sugerencia ─────────────────────────────────────────────────────
  productLogger.info(
    {
      userId: session.user.id,
      source: "NONE",
      latencyMs: Date.now() - startedAt,
      normalizedName: normalizeProductName(name),
    },
    "No weight suggestion available — manual entry required"
  );

  const response: SuggestResponse = {
    weightGrams: null,
    volumeMl: null,
    packageCategoryId: null,
    suggestedVehicle: null,
    suggestedSize: null,
    source: "NONE",
    confidence: 0,
  };
  return NextResponse.json(response);
}
