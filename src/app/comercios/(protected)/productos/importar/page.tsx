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

// Corrige "mojibake" de doble codificación (texto UTF-8 leído como Mac Roman y
// re-guardado) — común en exports de Excel/sistemas de gestión viejos. Ej: el
// archivo trae literalmente "MU√ëECO" en vez de "MUÑECO". Solo actúa si detecta
// los marcadores (√ o ¬), así NO toca archivos sanos. Mapa verificado contra el
// archivo real de Pixel Point.
const MOJIBAKE: [string, string][] = [
    ["√±", "ñ"], ["√ë", "Ñ"], ["√°", "á"], ["√©", "é"], ["√≠", "í"], ["√≥", "ó"], ["√∫", "ú"],
    ["√Å", "Á"], ["√â", "É"], ["√ç", "Í"], ["√ì", "Ó"], ["√ö", "Ú"], ["√º", "ü"], ["√ú", "Ü"],
    ["¬ø", "¿"], ["¬°", "¡"], ["√†", "à"], ["√®", "è"], ["√¢", "â"], ["√™", "ê"], ["√Æ", "î"],
    ["√¥", "ô"], ["√ª", "û"], ["√´", "ë"], ["√Ø", "ï"], ["√∂", "ö"],
];
function fixMojibake(s: string): string {
    if (s.indexOf("√") === -1 && s.indexOf("¬") === -1) return s;
    let out = s;
    for (const [bad, good] of MOJIBAKE) out = out.split(bad).join(good);
    return out;
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
    // Una columna "id-like" (header id/nro/orden, o secuencia 1,2,3…) NUNCA es
    // precio. Este era el bug: la autodetección agarraba `id` como precio.
    const isIdLike = (idx: number) => {
        const h = norm[idx] || "";
        if (/^(id|n[°º]?|nro\.?|orden|#|item|linea|línea)$/.test(h)) return true;
        const vals = sample.map((r) => parseInt((r[idx] || "").trim(), 10)).filter((n) => Number.isFinite(n));
        if (vals.length >= sample.length * 0.8) {
            const sorted = [...vals].sort((a, b) => a - b);
            const consecutive = sorted.every((v, k) => k === 0 || v === sorted[k - 1] + 1);
            if (consecutive && sorted[0] <= 2) return true; // arranca en 0/1/2 y va de a 1
        }
        return false;
    };
    if (m.price === null) {
        // columna numérica, NO barcode, NO id-like, con mediana "de precio".
        // Elegimos la de MAYOR mediana (los precios suelen ser más grandes que ids/stock).
        let best = -1, bestMedian = -1;
        for (let i = 0; i < headers.length; i++) {
            if (used().has(i) || colIsMostlyLongDigits(i) || isIdLike(i)) continue;
            const s = colNumericStats(i);
            if (s.count >= sample.length * 0.6 && s.median >= 1 && s.median < 1e7) {
                if (s.median > bestMedian) { best = i; bestMedian = s.median; }
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
    // feat/import-revision: códigos editados por el comercio en el paso de revisión.
    // Key = índice de fila en `rows`. Valor = código nuevo (o "" si lo borró).
    const [codeOverrides, setCodeOverrides] = useState<Record<number, string>>({});
    // feat/import-revision: filas que el comercio quitó de la importación desde la
    // lista de revisión (por índice en `rows`). No se importan.
    const [excludedRows, setExcludedRows] = useState<Set<number>>(new Set());
    // feat/recargo-moovy-y-tamano-toggle: el precio del archivo es el del LOCAL.
    // Recargo del lote (%) que se le aplica a todos, o escotilla "ya son finales".
    const [markupPercent, setMarkupPercent] = useState<string>("");
    const [treatAsFinal, setTreatAsFinal] = useState(false);

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
            // fix/mojibake: corregir doble codificación antes de parsear (Ñ, acentos).
            const { headers, rows } = parseCsv(fixMojibake(String(reader.result || "")));
            if (rows.length === 0) { setError("El archivo no tiene filas de datos."); return; }
            setHeaders(headers);
            setRows(rows);
            setMapping(autodetect(headers, rows));
            setFileName(file.name);
            setStep("map");
        };
        reader.readAsText(file, "utf-8");
    }

    // Código final de una fila: el que editó el comercio (override) o el del archivo.
    const codeForRow = (rowIdx: number): string => {
        if (rowIdx in codeOverrides) return (codeOverrides[rowIdx] || "").trim();
        if (mapping.barcode === null) return "";
        return (rows[rowIdx]?.[mapping.barcode] || "").trim();
    };

    // Filas con código IRREGULAR según el archivo original. Set ESTABLE (no depende
    // de los overrides) para que la lista de revisión no cambie mientras editan.
    const irregularRows = useMemo(() => {
        if (mapping.name === null || mapping.price === null || mapping.barcode === null) return [];
        const list: { rowIdx: number; name: string; original: string }[] = [];
        rows.forEach((r, i) => {
            const name = (r[mapping.name!] || "").trim();
            const price = parsePrice(r[mapping.price!] || "");
            if (!name || price === null || price < 0) return;
            const raw = (r[mapping.barcode!] || "").trim();
            if (raw && !isValidBarcode(raw)) list.push({ rowIdx: i, name, original: raw });
        });
        return list;
    }, [mapping, rows]);

    // Preview + validación (aplica overrides). Los códigos irregulares se CONSERVAN
    // como código interno (no se descartan).
    const preview = useMemo(() => {
        if (mapping.name === null || mapping.price === null) return null;
        let valid = 0, invalidName = 0, invalidPrice = 0, validEan = 0, internal = 0, noCode = 0, excluded = 0;
        const payload: any[] = [];
        rows.forEach((r, i) => {
            const name = (r[mapping.name!] || "").trim();
            const price = parsePrice(r[mapping.price!] || "");
            if (!name) { invalidName++; return; }
            if (price === null || price < 0) { invalidPrice++; return; }
            if (excludedRows.has(i)) { excluded++; return; } // el comercio lo quitó en la revisión
            const code = codeForRow(i);
            if (!code) noCode++;
            else if (isValidBarcode(code)) validEan++;
            else internal++;
            const description = mapping.description !== null ? (r[mapping.description] || "").trim() : "";
            const stock = mapping.stock !== null ? Math.max(0, Math.round(parsePrice(r[mapping.stock] || "") || 0)) : undefined;
            payload.push({ name, price, description: description || undefined, barcode: code || undefined, stock });
            valid++;
        });
        return { valid, invalidName, invalidPrice, validEan, internal, noCode, excluded, payload };
    }, [mapping, rows, codeOverrides, excludedRows]);

    async function doImport() {
        if (!preview || preview.payload.length === 0) return;
        setImporting(true);
        setError("");
        try {
            const res = await fetch("/api/comercios/products/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // El precio de payload es el del LOCAL; el server deriva el final con
                // el recargo del lote (o lo respeta si son precios finales).
                body: JSON.stringify({
                    rows: preview.payload,
                    markupPercent: treatAsFinal ? 0 : (Number(markupPercent) || 0),
                    treatAsFinal,
                }),
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

    // feat/recargo-moovy-y-tamano-toggle: precio final para la vista previa. El
    // precio mapeado es el del local; le aplicamos el recargo del lote (salvo escotilla).
    const markupNum = treatAsFinal ? 0 : (Number(markupPercent) || 0);
    const finalPriceOf = (base: number) => (treatAsFinal || markupNum <= 0) ? base : Math.round(base * (1 + markupNum / 100));

    const colOptions = headers.map((h, i) => ({ i, label: h.trim() || `Columna ${i + 1} (sin nombre)` }));
    // Primer valor no vacío de una columna — se muestra de ejemplo bajo el selector
    // para que un mapeo malo (ej: precio → id) se note al instante.
    const sampleFor = (idx: number | null): string => {
        if (idx === null) return "";
        for (const r of rows) { const v = (r[idx] || "").trim(); if (v) return v; }
        return "";
    };

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
                            {FIELDS.map((f) => {
                                const sample = sampleFor(mapping[f.key]);
                                return (
                                    <div key={f.key} className="flex items-start gap-3">
                                        <div className="w-48 flex-shrink-0 pt-2">
                                            <span className="text-sm font-semibold text-gray-800">{f.label}</span>
                                            <span className={`ml-1 text-[10px] ${f.required ? "text-red-500" : "text-gray-400"}`}>{f.hint}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <select
                                                value={mapping[f.key] ?? ""}
                                                onChange={(e) => setMapping({ ...mapping, [f.key]: e.target.value === "" ? null : Number(e.target.value) })}
                                                className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                                            >
                                                <option value="">— No importar —</option>
                                                {colOptions.map((c) => (
                                                    <option key={c.i} value={c.i}>{c.label}</option>
                                                ))}
                                            </select>
                                            {sample && <p className="text-[11px] text-gray-400 mt-1 ml-1 truncate">muestra: <span className="font-medium text-gray-500">{sample}</span></p>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Precio en Moovy — feat/recargo-moovy-y-tamano-toggle: el precio
                        del archivo es el del LOCAL. Recargo del lote o escotilla. */}
                    {mapping.price !== null && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                            <div>
                                <p className="text-sm font-bold text-gray-900">Precio de venta en Moovy</p>
                                <p className="text-xs text-gray-500 mt-0.5">El precio de tu archivo es el de tu local. Sumale un recargo para la venta en Moovy, o marcá que ya son tus precios finales.</p>
                            </div>
                            {!treatAsFinal && (
                                <div className="flex flex-wrap items-end gap-3">
                                    <div className="w-40">
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Recargo Moovy (%)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.5"
                                                placeholder="0"
                                                value={markupPercent}
                                                onChange={(e) => setMarkupPercent(e.target.value)}
                                                onWheel={(e) => e.currentTarget.blur()}
                                                className="w-full border rounded-lg px-3 py-2 pr-8 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 font-bold"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 pb-2 flex-1 min-w-[180px]">Se aplica a <b>todos</b> los productos del archivo. Después podés ajustar cada uno.</p>
                                </div>
                            )}
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={treatAsFinal}
                                    onChange={(e) => setTreatAsFinal(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300"
                                />
                                <span className="text-sm text-gray-700">Estos ya son mis precios finales de Moovy (no aplicar recargo)</span>
                            </label>
                        </div>
                    )}

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
                                    <p className="text-2xl font-bold text-blue-700">{preview.validEan}</p>
                                    <p className="text-xs text-blue-700">con código de barras</p>
                                </div>
                                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                                    <p className="text-2xl font-bold text-amber-700">{preview.internal}</p>
                                    <p className="text-xs text-amber-700">con código interno</p>
                                </div>
                            </div>

                            {/* Revisión de códigos irregulares (feat/import-revision): editables, se conservan como interno */}
                            {irregularRows.length > 0 && (
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                    <div className="flex items-center gap-2 mb-1">
                                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                                        <p className="text-sm font-bold text-gray-900">Revisar {irregularRows.length} códigos internos{excludedRows.size > 0 && <span className="text-gray-400 font-normal"> · {excludedRows.size} quitados</span>}</p>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-4">No son códigos de barras estándar (suelen ser códigos internos de productos sueltos o por peso). Los guardamos <b>tal cual</b>. Podés editarlos, o <b>quitar</b> los que no sean productos (ej: recargas, ajustes) para que no se importen.</p>
                                    <div className="max-h-72 overflow-y-auto divide-y border rounded-xl">
                                        {irregularRows.map((ir) => {
                                            const current = codeForRow(ir.rowIdx);
                                            const stateLabel = !current ? "vacío" : isValidBarcode(current) ? "✓ de barras" : "interno";
                                            const stateColor = !current ? "text-gray-400" : isValidBarcode(current) ? "text-green-600" : "text-amber-600";
                                            const isExcluded = excludedRows.has(ir.rowIdx);
                                            return (
                                                <div key={ir.rowIdx} className={`flex items-center gap-3 px-3 py-2 ${isExcluded ? "bg-gray-50" : ""}`}>
                                                    <span className={`flex-1 text-sm truncate ${isExcluded ? "text-gray-400 line-through" : "text-gray-700"}`}>{ir.name}</span>
                                                    {isExcluded ? (
                                                        <>
                                                            <span className="w-40 text-[11px] text-gray-400 text-center">no se importa</span>
                                                            <button type="button" onClick={() => setExcludedRows((prev) => { const n = new Set(prev); n.delete(ir.rowIdx); return n; })} className="w-16 text-[11px] font-semibold text-blue-600 hover:underline text-right">restaurar</button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <input
                                                                value={current}
                                                                onChange={(e) => setCodeOverrides({ ...codeOverrides, [ir.rowIdx]: e.target.value })}
                                                                className="w-40 border rounded-lg px-2 py-1 text-sm font-mono focus:ring-2 focus:ring-blue-500/20"
                                                                placeholder="código"
                                                            />
                                                            <span className={`text-[11px] w-14 text-right ${stateColor}`}>{stateLabel}</span>
                                                            <button type="button" onClick={() => setExcludedRows((prev) => new Set(prev).add(ir.rowIdx))} title="No importar este" className="text-gray-300 hover:text-red-500 transition p-1">
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="px-4 py-2 border-b text-xs font-bold text-gray-400 uppercase tracking-wider">Vista previa (primeras 5)</div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 text-gray-500">
                                            <tr>
                                                <th className="text-left px-4 py-2 font-semibold">Nombre</th>
                                                <th className="text-left px-4 py-2 font-semibold">Precio Moovy</th>
                                                <th className="text-left px-4 py-2 font-semibold">Código</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {preview.payload.slice(0, 5).map((p, i) => (
                                                <tr key={i} className="border-t">
                                                    <td className="px-4 py-2 text-gray-900">{p.name}</td>
                                                    <td className="px-4 py-2 text-gray-700">
                                                        ${finalPriceOf(p.price).toLocaleString("es-AR")}
                                                        {markupNum > 0 && !treatAsFinal && (
                                                            <span className="text-[11px] text-gray-400 ml-1">(local ${p.price.toLocaleString("es-AR")})</span>
                                                        )}
                                                    </td>
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
