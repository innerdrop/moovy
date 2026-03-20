"use client";

import { useState, useRef, useCallback } from "react";
import {
    Upload,
    FileSpreadsheet,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    ArrowLeft,
    Download,
    Loader2,
    Eye,
    Rocket,
    SkipForward,
} from "lucide-react";
import Link from "next/link";
import { toast } from "@/store/toast";

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

interface ImportResponse {
    summary: { total: number; created: number; skipped: number; errors: number; dryRun: boolean };
    results: ImportResult[];
}

const EXPECTED_HEADERS = [
    "name", "slug", "description", "price", "costPrice", "stock", "minStock",
    "categorySlug", "packageCategory", "maxWeightGrams", "maxLengthCm",
    "maxWidthCm", "maxHeightCm", "volumeScore", "allowedVehicles",
];

function splitCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === "," && !inQuotes) {
            result.push(current);
            current = "";
        } else {
            current += ch;
        }
    }
    result.push(current);
    return result;
}

function parseCsv(text: string): ImportRow[] {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];

    const headerLine = lines[0].replace(/^\uFEFF/, "");
    const headers = headerLine.split(",").map((h) => h.trim().replace(/^"|"$/g, ""));

    const rows: ImportRow[] = [];
    for (let i = 1; i < lines.length; i++) {
        const values = splitCsvLine(lines[i]);
        if (values.length < 3) continue;

        const obj: Record<string, string> = {};
        headers.forEach((h, idx) => {
            obj[h] = values[idx]?.trim().replace(/^"|"$/g, "") || "";
        });

        if (!obj.name || obj.name.startsWith("GASEOSAS") || obj.name.startsWith("TÓNICAS") ||
            obj.name.startsWith("AGUAS") || obj.name.startsWith("BEBIDAS") ||
            obj.name.startsWith("JUGOS") || obj.name.startsWith("ENERGIZANTES")) {
            continue;
        }

        rows.push({
            name: obj.name || "",
            slug: obj.slug || "",
            description: obj.description || "",
            price: parseFloat(obj.price) || 0,
            costPrice: parseFloat(obj.costPrice) || 0,
            stock: parseInt(obj.stock) || 100,
            minStock: parseInt(obj.minStock) || 5,
            categorySlug: obj.categorySlug || "",
            packageCategory: obj.packageCategory || "",
            maxWeightGrams: parseInt(obj.maxWeightGrams) || 0,
            maxLengthCm: parseInt(obj.maxLengthCm) || 0,
            maxWidthCm: parseInt(obj.maxWidthCm) || 0,
            maxHeightCm: parseInt(obj.maxHeightCm) || 0,
            volumeScore: parseInt(obj.volumeScore) || 1,
            allowedVehicles: obj.allowedVehicles || "",
        });
    }
    return rows;
}

async function parseExcelFile(file: File): Promise<ImportRow[]> {
    const XLSX = await import(/* webpackIgnore: true */ "https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs");
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const jsonData: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

    return jsonData
        .filter((row: Record<string, unknown>) => {
            const name = String(row.name || "").trim();
            return name && !name.startsWith("GASEOSAS") && !name.startsWith("TÓNICAS") &&
                !name.startsWith("AGUAS") && !name.startsWith("BEBIDAS") &&
                !name.startsWith("JUGOS") && !name.startsWith("ENERGIZANTES");
        })
        .map((row: Record<string, unknown>) => ({
            name: String(row.name || "").trim(),
            slug: String(row.slug || "").trim(),
            description: String(row.description || "").trim(),
            price: parseFloat(String(row.price)) || 0,
            costPrice: parseFloat(String(row.costPrice)) || 0,
            stock: parseInt(String(row.stock)) || 100,
            minStock: parseInt(String(row.minStock)) || 5,
            categorySlug: String(row.categorySlug || "").trim(),
            packageCategory: String(row.packageCategory || "").trim(),
            maxWeightGrams: parseInt(String(row.maxWeightGrams)) || 0,
            maxLengthCm: parseInt(String(row.maxLengthCm)) || 0,
            maxWidthCm: parseInt(String(row.maxWidthCm)) || 0,
            maxHeightCm: parseInt(String(row.maxHeightCm)) || 0,
            volumeScore: parseInt(String(row.volumeScore)) || 1,
            allowedVehicles: String(row.allowedVehicles || "").trim(),
        }));
}

export default function ImportProductosPage() {
    const [parsedRows, setParsedRows] = useState<ImportRow[]>([]);
    const [fileName, setFileName] = useState("");
    const [loading, setLoading] = useState(false);
    const [parsing, setParsing] = useState(false);
    const [response, setResponse] = useState<ImportResponse | null>(null);
    const [step, setStep] = useState<"upload" | "preview" | "results">("upload");
    const fileRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback(async (file: File) => {
        setParsing(true);
        setFileName(file.name);
        try {
            let rows: ImportRow[];
            if (file.name.endsWith(".csv") || file.name.endsWith(".tsv")) {
                const text = await file.text();
                rows = parseCsv(text);
            } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
                rows = await parseExcelFile(file);
            } else {
                toast.error("Formato no soportado. Usá .xlsx o .csv");
                setParsing(false);
                return;
            }

            if (rows.length === 0) {
                toast.error("No se encontraron productos válidos en el archivo");
                setParsing(false);
                return;
            }

            setParsedRows(rows);
            setStep("preview");
            toast.success(`Se encontraron ${rows.length} productos para importar`);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "formato inválido";
            console.error("Parse error:", err);
            toast.error(`Error al leer el archivo: ${message}`);
        }
        setParsing(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
        },
        [handleFile]
    );

    const handleSubmit = async (dryRun: boolean) => {
        setLoading(true);
        try {
            const res = await fetch("/api/ops/import-products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rows: parsedRows, dryRun }),
            });

            if (!res.ok) {
                const err = await res.json();
                toast.error(err.error || "Error al importar");
                setLoading(false);
                return;
            }

            const data: ImportResponse = await res.json();
            setResponse(data);
            setStep("results");

            if (dryRun) {
                toast.info(`Simulación completada: ${data.summary.created} válidos, ${data.summary.errors} errores`);
            } else {
                toast.success(`Importación completada: ${data.summary.created} productos creados`);
            }
        } catch {
            toast.error("Error de conexión al importar");
        }
        setLoading(false);
    };

    const reset = () => {
        setParsedRows([]);
        setFileName("");
        setResponse(null);
        setStep("upload");
        if (fileRef.current) fileRef.current.value = "";
    };

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/ops/catalogo-paquetes" className="p-2 hover:bg-gray-100 rounded-lg transition">
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Importar Productos Masivamente</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Cargá un archivo Excel (.xlsx) o CSV con el catálogo de productos para agregarlos al sistema.
                    </p>
                </div>
            </div>

            {/* Step indicators */}
            <div className="flex items-center gap-2 mb-8">
                {[
                    { key: "upload", label: "1. Subir archivo" },
                    { key: "preview", label: "2. Revisar datos" },
                    { key: "results", label: "3. Resultados" },
                ].map((s, idx) => (
                    <div key={s.key} className="flex items-center gap-2">
                        <div
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                                step === s.key
                                    ? "bg-red-50 text-red-600 ring-1 ring-red-200"
                                    : step === "results" || (step === "preview" && idx === 0)
                                    ? "bg-green-50 text-green-600"
                                    : "bg-gray-100 text-gray-400"
                            }`}
                        >
                            {(step === "results" || (step === "preview" && idx === 0)) && s.key !== step ? (
                                <CheckCircle2 className="w-4 h-4" />
                            ) : null}
                            {s.label}
                        </div>
                        {idx < 2 && <div className="w-8 h-px bg-gray-200" />}
                    </div>
                ))}
            </div>

            {/* Step 1: Upload */}
            {step === "upload" && (
                <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-red-300 hover:bg-red-50/30 transition-all cursor-pointer"
                    onClick={() => fileRef.current?.click()}
                >
                    <input
                        ref={fileRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        className="hidden"
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleFile(f);
                        }}
                    />
                    {parsing ? (
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-12 h-12 text-red-500 animate-spin" />
                            <p className="text-gray-600 font-medium">Leyendo archivo...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
                                <FileSpreadsheet className="w-8 h-8 text-red-500" />
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-gray-800">
                                    Arrastrá tu archivo acá o hacé clic para seleccionar
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Soporta archivos .xlsx y .csv · Máximo 500 productos por carga
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Format guide */}
                    <div className="mt-8 p-4 bg-gray-50 rounded-xl text-left max-w-lg mx-auto">
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                            Columnas requeridas en el archivo
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {EXPECTED_HEADERS.map((h) => (
                                <span key={h} className="px-2 py-0.5 bg-white border border-gray-200 rounded text-xs text-gray-600 font-mono">
                                    {h}
                                </span>
                            ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-3">
                            La primera fila debe contener estos headers exactos. Las filas de categoría (GASEOSAS, JUGOS, etc.) se ignoran automáticamente.
                        </p>
                    </div>
                </div>
            )}

            {/* Step 2: Preview */}
            {step === "preview" && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <FileSpreadsheet className="w-5 h-5 text-green-600" />
                            <span className="font-medium text-gray-800">{fileName}</span>
                            <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                                {parsedRows.length} productos
                            </span>
                        </div>
                        <button onClick={reset} className="text-sm text-gray-500 hover:text-red-500 transition">
                            Cambiar archivo
                        </button>
                    </div>

                    {/* Preview table */}
                    <div className="border rounded-xl overflow-hidden mb-6">
                        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                            <table className="w-full text-xs">
                                <thead className="bg-gray-50 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium text-gray-500">#</th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-500">Nombre</th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-500">Categoría</th>
                                        <th className="px-3 py-2 text-center font-medium text-gray-500">Pkg</th>
                                        <th className="px-3 py-2 text-center font-medium text-gray-500">Peso (g)</th>
                                        <th className="px-3 py-2 text-center font-medium text-gray-500">L×A×H</th>
                                        <th className="px-3 py-2 text-center font-medium text-gray-500">Vol</th>
                                        <th className="px-3 py-2 text-center font-medium text-gray-500">Vehículos</th>
                                        <th className="px-3 py-2 text-right font-medium text-gray-500">Precio</th>
                                        <th className="px-3 py-2 text-center font-medium text-gray-500">Stock</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parsedRows.map((row, i) => (
                                        <tr key={i} className={`border-t ${i % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                                            <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                                            <td className="px-3 py-2 font-medium text-gray-800 max-w-[200px] truncate">{row.name}</td>
                                            <td className="px-3 py-2 text-gray-600">{row.categorySlug || "—"}</td>
                                            <td className="px-3 py-2 text-center">
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                                    row.packageCategory === "MICRO" ? "bg-blue-50 text-blue-600" :
                                                    row.packageCategory === "SMALL" ? "bg-green-50 text-green-600" :
                                                    row.packageCategory === "MEDIUM" ? "bg-yellow-50 text-yellow-700" :
                                                    row.packageCategory === "LARGE" ? "bg-orange-50 text-orange-600" :
                                                    "bg-red-50 text-red-600"
                                                }`}>
                                                    {row.packageCategory}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-center text-gray-600">{row.maxWeightGrams}</td>
                                            <td className="px-3 py-2 text-center text-gray-500">{row.maxLengthCm}×{row.maxWidthCm}×{row.maxHeightCm}</td>
                                            <td className="px-3 py-2 text-center font-mono font-bold text-gray-700">{row.volumeScore}</td>
                                            <td className="px-3 py-2 text-center text-gray-500 text-[10px]">{row.allowedVehicles}</td>
                                            <td className="px-3 py-2 text-right text-gray-600">{row.price > 0 ? `$${row.price.toLocaleString()}` : "—"}</td>
                                            <td className="px-3 py-2 text-center text-gray-600">{row.stock}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500">
                            Los productos se crearán como catálogo maestro (sin comercio asignado).
                            El <strong>packageCategory</strong> asigna automáticamente las restricciones de vehículo.
                        </p>
                        <div className="flex gap-3 shrink-0">
                            <button
                                onClick={() => handleSubmit(true)}
                                disabled={loading}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                                Simular (Dry Run)
                            </button>
                            <button
                                onClick={() => handleSubmit(false)}
                                disabled={loading}
                                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                                Importar {parsedRows.length} productos
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 3: Results */}
            {step === "results" && response && (
                <div>
                    {/* Summary cards */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        {[
                            { label: "Total", value: response.summary.total, color: "bg-gray-50 text-gray-800" },
                            { label: "Creados", value: response.summary.created, color: "bg-green-50 text-green-700" },
                            { label: "Omitidos", value: response.summary.skipped, color: "bg-yellow-50 text-yellow-700" },
                            { label: "Errores", value: response.summary.errors, color: "bg-red-50 text-red-700" },
                        ].map((c) => (
                            <div key={c.label} className={`p-4 rounded-xl ${c.color}`}>
                                <p className="text-2xl font-bold">{c.value}</p>
                                <p className="text-sm opacity-70">{c.label}</p>
                            </div>
                        ))}
                    </div>

                    {response.summary.dryRun && (
                        <div className="p-3 mb-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-sm text-blue-700">
                            <Eye className="w-4 h-4 shrink-0" />
                            Esto fue una <strong>simulación</strong>. No se crearon productos. Si todo se ve bien, volvé a importar sin Dry Run.
                        </div>
                    )}

                    {/* Results table */}
                    <div className="border rounded-xl overflow-hidden mb-6">
                        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-medium text-gray-500">Fila</th>
                                        <th className="px-4 py-2 text-left font-medium text-gray-500">Producto</th>
                                        <th className="px-4 py-2 text-center font-medium text-gray-500">Estado</th>
                                        <th className="px-4 py-2 text-left font-medium text-gray-500">Detalle</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {response.results.map((r) => (
                                        <tr key={r.row} className="border-t">
                                            <td className="px-4 py-2 text-gray-400">{r.row}</td>
                                            <td className="px-4 py-2 font-medium text-gray-800 max-w-[250px] truncate">{r.name}</td>
                                            <td className="px-4 py-2 text-center">
                                                {r.status === "created" && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-xs font-medium">
                                                        <CheckCircle2 className="w-3 h-3" /> Creado
                                                    </span>
                                                )}
                                                {r.status === "skipped" && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-50 text-yellow-600 rounded-full text-xs font-medium">
                                                        <SkipForward className="w-3 h-3" /> Omitido
                                                    </span>
                                                )}
                                                {r.status === "error" && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-xs font-medium">
                                                        <XCircle className="w-3 h-3" /> Error
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2 text-gray-500 text-xs">{r.reason || "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={reset}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                        >
                            <Upload className="w-4 h-4" />
                            Importar otro archivo
                        </button>
                        <Link
                            href="/ops/catalogo-paquetes"
                            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition"
                        >
                            Ir al Catálogo de Paquetes
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
