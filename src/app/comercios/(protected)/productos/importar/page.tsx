"use client";

// Importación de productos por CSV — panel comercio.
// Rama: feat/import-productos-comercio
//
// Flujo: subir CSV → mapear columnas (tu columna → campo Moovy) → validar y
// previsualizar → importar como borradores. Toma nombre, descripción, precio y
// barcode (valida EAN-8/12/13; los irregulares quedan vacíos). El resto (foto,
// tamaño, categoría) lo completa el comercio después.

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, FileText, Loader2, CheckCircle2, AlertTriangle, X } from "lucide-react";

type Field = "name" | "price" | "description" | "barcode" | "stock";
type Mapping = Record<Field, number | null>;

const FIELDS: { key: Field; label: string; required: boolean; hint: string }[] = [
    { key: "name", label: "Nombre del producto", required: true, hint: "obligatorio" },
    { key: "price", label: "Precio", required: true, hint: "obligatorio" },
    { key: "description", label: "Descripción", required: false, hint: "opcional" },
    { key: "barcode", label: "Código de barras", required: false, hint: "opcional" },
    { key: "stock", label: "Stock", required: false, hint: "opcional" },
];

// Parser CSV minimalista: soporta comillas, comas dentro de comillas, CRLF y BOM.
function parseCsv(text: string): { headers: string[]; rows: string[][] } {
    const clean = text.replace(/^﻿/, "");
    const out: string[][] = [];
    let field = "";
    let row: string[] = [];
    let inQuotes = false;
    for (let i = 0; i < clean.length; i++) {
        const c = clean[i];
        if (inQuotes) {
            if (c === '"') {
                if (clean[i + 1] === '"') { field += '"'; i++; }
                else inQuotes = false;
            } else field += c;
        } else if (c === '"') inQuotes = true;
        else if (c === ",") { row.push(field); field = ""; }
        else if (c === "\n") { row.push(field); out.push(row); row = []; field = ""; }
        else if (c === "\r") { /* skip */ }
        else field += c;
    }
    if (field.length > 0 || row.length > 0) { row.push(field); out.push(row); }
    const nonEmpty = out.filter((r) => r.some((v) => v.trim() !== ""));
    const headers = nonEmpty.length ? nonEmpty[0] : [];
    const rows = nonEmpty.slice(1);
    return { headers, rows };
}

// EAN-8, UPC-12 o EAN-13 numéricos. El resto se considera código interno → vacío.
function isValidBarcode(v: string): boolean {
    const s = v.trim();
    return /^\d{8}$/.test(s) || /^\d{12}$/.test(s) || /^\d{13}$/.test(s);
}

function parsePrice(v: string): number | null {
    if (!v) return null;
    // admite "3978", "3978,50", "3.978,50", "3978.5"
    let s = v.trim().replace(/[^\d.,-]/g, "");
    if (s.includes(",") && s.includes(".")) s = s.replace(/\./g, "").replace(",", ".");
    else if (s.includes(",")) s = s.replace(",", ".");
    const n = parseFloat(s);
    return isFinite(n) ? n : null;
}

function autodetect(headers: string[], rows: string[][]): Mapping {
    const m: Mapping = { name: null, price: null, description: null, barcode: null, stock: null };
    const norm = headers.map((h) => h.toLowerCase().trim());
    const find = (re: RegExp) => norm.findIndex((h) => re.test(h));
    m.name = find(/nombre|producto|articulo|art[íi]culo|name|descripcion_producto/);
    m.description = find(/descrip|detalle|obs/);
    m.price = find(/precio|price|valor|importe|pvp|venta/);
    m.barcode = find(/barcode|c[óo]digo|codigo|ean|sku|cod\b/);
    m.stock = find(/stock|cantidad|existencia|disp/);
    for (const k of Object.keys(m) as Field[]) if (m[k] === -1) m[k] = null;

    // Heurística de contenido para lo que no se detectó por encabezado.
    const sample = rows.slice(0, 30);
    const colIsMostlyLongDigits = (idx: number) =>
        sample.filter((r) => /^\d{8,14}$/.test((r[idx] || "").trim())).length >= sample.length * 0.6;
    const colNumericStats = (idx: number) => {
        const nums = sample.map((r) => parsePrice(r[idx] || "")).filter((n): n is number => n !== null);
        return { count: nums.length, median: nums.sort((a, b) => a - b)[Math.floor(nums.length / 2)] ?? 0 };
    };
    const used = () => new Set(Object.values(m).filter((v) => v !== null) as number[]);
    if (m.barcode === null) {
        for (let i = 0; i < headers.length; i++) if (!used().has(i) && colIsMostlyLongDigits(i)) { m.barcode = i; break; }
    }
    if (m.price === null) {
        // columna numérica no-barcode con mediana "de precio" (1..1e7)
        let best = -1, bestScore = 0;
        for (let i = 0; i < headers.length; i++) {
            if (used().has(i)) continue;
            const s = colNumericStats(i);
            if (s.count >= sample.length * 0.6 && s.median >= 1 && s.median < 1e7 && !colIsMostlyLongDigits(i)) {
                if (s.count > bestScore) { best = i; bestScore = s.count; }
            }
        }
        if (best >= 0) m.price = best;
    }
    if (m.name === null) {
        // primera columna de texto no usada
        for (let i = 0; i < headers.length; i++) {
            if (used().has(i)) continue;
            const textish = sample.filter((r) => /[a-zA-Z]/.test((r[i] || ""))).length >= sample.length * 0.6;
            if (textish) { m.name = i; break; }
        }
    }
    return m;
}

export default function ImportarProductosPage() {
    const [fileName, setFileName] = useState("");
    const [headers, setHeaders] = useState<string[]>([]);
    const [rows, setRows] = useState<string[][]>([]);
    const [mapping, setMapping] = useState<Mapping>({ name: null, price: null, description: null, barcode: null, stock: null });
    const [step, setStep] = useState<"upload" | "map" | "result">("upload");
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<{ created: number; updated: number; skipped: number; total: number; errors: { row: number; reason: string }[] } | null>(null);
    const [error, setError] = useState("");

    function onFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!/\.(csv|tsv|txt)$/i.test(file.name)) {
            setError("Subí un archivo CSV. Si tenés Excel, usá 'Guardar como → CSV (UTF-8)'.");
            return;
        }
        setError("");
        const reader = new FileReader();
        reader.onload = () => {
            const { headers, rows } = parseCsv(String(reader.result || ""));
            if (rows.length === 0) { setError("El archivo no tiene filas de datos."); return; }
            setHeaders(headers);
            setRows(rows);
            setMapping(autodetect(headers, rows));
            setFileName(file.name);
            setStep("map");
        };
        reader.readAsText(file, "utf-8");
    }

    // Preview + validación en base al mapeo.
    const preview = useMemo(() => {
        if (mapping.name === null || mapping.price === null) return null;
        let valid = 0, invalidName = 0, invalidPrice = 0, barcodeKept = 0, barcodeDropped = 0;
        const payload: any[] = [];
        for (const r of rows) {
            const name = (r[mapping.name] || "").trim();
            const price = parsePrice(r[mapping.price] || "");
            if (!name) { invalidName++; continue; }
            if (price === null || price < 0) { invalidPrice++; continue; }
            let barcode: string | null = null;
            if (mapping.barcode !== null) {
                const raw = (r[mapping.barcode] || "").trim();
                if (raw && isValidBarcode(raw)) { barcode = raw; barcodeKept++; }
                else if (raw) barcodeDropped++;
            }
            const description = mapping.description !== null ? (r[mapping.description] || "").trim() : "";
            const stock = mapping.stock !== null ? Math.max(0, Math.round(parsePrice(r[mapping.stock] || "") || 0)) : undefined;
            payload.push({ name, price, description: description || undefined, barcode: barcode || undefined, stock });
            valid++;
        }
        return { valid, invalidName, invalidPrice, barcodeKept, barcodeDropped, payload };
    }, [mapping, rows]);

    async function doImport() {
        if (!preview || preview.payload.length === 0) return;
        setImporting(true);
        setError("");
        try {
            const res = await fetch("/api/comercios/products/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rows: preview.payload }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || "No se pudo importar."); return; }
            setResult(data);
            setStep("result");
        } catch {
            setError("Error de conexión al importar.");
        } finally {
            setImporting(false);
        }
    }

    const colOptions = headers.map((h, i) => ({ i, label: h.trim() || `Columna ${i + 1} (sin nombre)` }));

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-16">
            <div className="flex items-center gap-4">
                <Link href="/comercios/productos" className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-blue-600 transition shadow-sm">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Importar productos</h1>
                    <p className="text-sm text-gray-500 font-medium">Subí un CSV con tu lista y los cargamos en un paso</p>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-semibold flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" /> {error}
                </div>
            )}

            {/* Paso 1: subir */}
            {step === "upload" && (
                <label className="block bg-white border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center cursor-pointer hover:border-blue-300 transition">
                    <Upload className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p className="font-semibold text-gray-700">Elegí tu archivo CSV</p>
                    <p className="text-xs text-gray-400 mt-1">Desde Excel: “Guardar como → CSV (UTF-8)”. Hasta 2.000 productos.</p>
                    <input type="file" accept=".csv,.tsv,.txt" className="hidden" onChange={onFile} />
                </label>
            )}

            {/* Paso 2: mapear */}
            {step === "map" && (
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                            <FileText className="w-4 h-4" /> <span className="font-semibold">{fileName}</span>
                            <span className="text-gray-400">· {rows.length} filas</span>
                        </div>
                        <p className="text-sm font-bold text-gray-900 mb-1">Asociá tus columnas</p>
                        <p className="text-xs text-gray-500 mb-4">Decinos qué columna de tu archivo corresponde a cada dato. Ya intentamos adivinarlo.</p>
                        <div className="space-y-3">
                            {FIELDS.map((f) => (
                                <div key={f.key} className="flex items-center gap-3">
                                    <div className="w-48 flex-shrink-0">
                                        <span className="text-sm font-semibold text-gray-800">{f.label}</span>
                                        <span className={`ml-1 text-[10px] ${f.required ? "text-red-500" : "text-gray-400"}`}>{f.hint}</span>
                                    </div>
                                    <select
                                        value={mapping[f.key] ?? ""}
                                        onChange={(e) => setMapping({ ...mapping, [f.key]: e.target.value === "" ? null : Number(e.target.value) })}
                                        className="flex-1 border rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                                    >
                                        <option value="">— No importar —</option>
                                        {colOptions.map((c) => (
                                            <option key={c.i} value={c.i}>{c.label}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Vista previa + validación */}
                    {mapping.name === null || mapping.price === null ? (
                        <div className="p-4 bg-amber-50 border border-amber-100 text-amber-700 rounded-2xl text-sm font-semibold">
                            Asigná al menos <b>Nombre</b> y <b>Precio</b> para continuar.
                        </div>
                    ) : preview && (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                                    <p className="text-2xl font-bold text-green-700">{preview.valid}</p>
                                    <p className="text-xs text-green-700">listas para importar</p>
                                </div>
                                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                                    <p className="text-2xl font-bold text-gray-700">{preview.invalidName + preview.invalidPrice}</p>
                                    <p className="text-xs text-gray-500">se saltean (sin nombre/precio)</p>
                                </div>
                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                                    <p className="text-2xl font-bold text-blue-700">{preview.barcodeKept}</p>
                                    <p className="text-xs text-blue-700">con código válido</p>
                                </div>
                                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                                    <p className="text-2xl font-bold text-amber-700">{preview.barcodeDropped}</p>
                                    <p className="text-xs text-amber-700">código irregular → vacío</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="px-4 py-2 border-b text-xs font-bold text-gray-400 uppercase tracking-wider">Vista previa (primeras 5)</div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 text-gray-500">
                                            <tr>
                                                <th className="text-left px-4 py-2 font-semibold">Nombre</th>
                                                <th className="text-left px-4 py-2 font-semibold">Precio</th>
                                                <th className="text-left px-4 py-2 font-semibold">Código</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {preview.payload.slice(0, 5).map((p, i) => (
                                                <tr key={i} className="border-t">
                                                    <td className="px-4 py-2 text-gray-900">{p.name}</td>
                                                    <td className="px-4 py-2 text-gray-700">${p.price.toLocaleString("es-AR")}</td>
                                                    <td className="px-4 py-2 text-gray-400">{p.barcode || "—"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
                                Los productos entran como <b>borradores</b> (ocultos). Después les cargás la <b>foto</b> y el <b>tamaño</b> y los publicás.
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => { setStep("upload"); setRows([]); setHeaders([]); }} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition flex items-center gap-1.5">
                                    <X className="w-4 h-4" /> Cambiar archivo
                                </button>
                                <button onClick={doImport} disabled={importing || preview.valid === 0} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                                    {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                    Importar {preview.valid} productos
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Paso 3: resultado */}
            {step === "result" && result && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center space-y-4">
                    <CheckCircle2 className="w-14 h-14 mx-auto text-green-500" />
                    <h2 className="text-xl font-bold text-gray-900">Importación lista</h2>
                    <p className="text-gray-600">
                        Se crearon <b>{result.created}</b> productos nuevos
                        {result.updated > 0 && <> y se actualizaron <b>{result.updated}</b></>}.
                        {result.skipped > 0 && <> Se saltearon <b>{result.skipped}</b> filas con problemas.</>}
                    </p>
                    <p className="text-sm text-gray-500">Están como borradores. Cargales una foto para publicarlos.</p>
                    <div className="flex gap-3 justify-center pt-2">
                        <Link href="/comercios/productos" className="px-5 py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition">
                            Ver mis productos
                        </Link>
                        <button onClick={() => { setStep("upload"); setResult(null); setRows([]); setHeaders([]); setFileName(""); }} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition">
                            Importar otro archivo
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
