"use client";

// feat/driver-bank-mp (2026-04-26)
//
// Form del driver para cargar/editar su CBU o Alias bancario.
// Sin estos datos MOOVY no puede pagarle el payout semanal vía MP Bulk Transfer.
//
// Self-contained: fetch al cargar + PATCH al guardar. Validación cliente con
// el mismo helper que el server (`validateBankAccount` en src/lib/bank-account.ts)
// para feedback inmediato sin round-trip al backend.

import { useState, useEffect } from "react";
import { Banknote, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "@/store/toast";
import { validateBankAccount } from "@/lib/bank-account";

interface BankAccountState {
    bankCbu: string | null;
    bankAlias: string | null;
    bankAccountUpdatedAt: string | null;
    hasBankAccount: boolean;
}

export default function DriverBankAccountForm() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [data, setData] = useState<BankAccountState | null>(null);
    const [cbuInput, setCbuInput] = useState("");
    const [aliasInput, setAliasInput] = useState("");
    const [cbuError, setCbuError] = useState<string | null>(null);
    const [aliasError, setAliasError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch("/api/driver/bank-account");
                if (!res.ok) throw new Error("Error cargando datos");
                const d: BankAccountState = await res.json();
                if (cancelled) return;
                setData(d);
                setCbuInput(d.bankCbu ?? "");
                setAliasInput(d.bankAlias ?? "");
            } catch (err) {
                console.error(err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // Validación live (no muestra error si el campo está vacío)
    function validateCbu(v: string) {
        const trimmed = v.trim();
        if (!trimmed) { setCbuError(null); return; }
        const r = validateBankAccount(trimmed);
        setCbuError(r.valid && r.type === "CBU" ? null : (r.error || "Formato inválido"));
    }

    function validateAlias(v: string) {
        const trimmed = v.trim();
        if (!trimmed) { setAliasError(null); return; }
        const r = validateBankAccount(trimmed);
        setAliasError(r.valid && r.type === "ALIAS" ? null : (r.error || "Formato inválido"));
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        const cbu = cbuInput.trim();
        const alias = aliasInput.trim();

        if (!cbu && !alias) {
            toast.error("Tenés que cargar al menos un CBU o un Alias");
            return;
        }
        if (cbu && cbuError) { toast.error("Corregí el CBU antes de guardar"); return; }
        if (alias && aliasError) { toast.error("Corregí el Alias antes de guardar"); return; }

        setSaving(true);
        try {
            const res = await fetch("/api/driver/bank-account", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bankCbu: cbu || null,
                    bankAlias: alias || null,
                }),
            });
            const d = await res.json();
            if (!res.ok) {
                toast.error(d.error || "Error al guardar");
                return;
            }
            setData({
                bankCbu: d.bankCbu,
                bankAlias: d.bankAlias,
                bankAccountUpdatedAt: d.bankAccountUpdatedAt,
                hasBankAccount: d.hasBankAccount,
            });
            toast.success("Datos bancarios guardados");
        } catch {
            toast.error("Error de conexión");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Cargando datos bancarios...</span>
            </div>
        );
    }

    const hasAccount = data?.hasBankAccount ?? false;

    return (
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Banknote className="w-5 h-5 text-emerald-700" />
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-gray-900">Datos bancarios para cobrar</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Acá te depositamos tus ganancias cada lunes. Cargá un CBU o un Alias.
                    </p>
                </div>
            </div>

            {!hasAccount && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-900">
                        <strong>Sin estos datos no podemos pagarte.</strong> Cargá tu CBU o Alias para entrar al
                        próximo lote de pagos.
                    </p>
                </div>
            )}

            {hasAccount && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-emerald-900">
                        <strong>Datos guardados.</strong> Vamos a depositar tus ganancias en esta cuenta los lunes.
                    </p>
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-3">
                <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1 block">
                        CBU (22 dígitos)
                    </label>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={cbuInput}
                        onChange={(e) => { setCbuInput(e.target.value); validateCbu(e.target.value); }}
                        placeholder="0000003100000000000000"
                        className={`w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                            cbuError ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-emerald-200"
                        }`}
                    />
                    {cbuError && <p className="text-xs text-red-600 mt-1">{cbuError}</p>}
                </div>

                <div className="text-center text-xs text-gray-400 my-1">— o —</div>

                <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1 block">
                        Alias (6-20 caracteres)
                    </label>
                    <input
                        type="text"
                        value={aliasInput}
                        onChange={(e) => { setAliasInput(e.target.value); validateAlias(e.target.value); }}
                        placeholder="MI.ALIAS.MERCADOPAGO"
                        className={`w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                            aliasError ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-emerald-200"
                        }`}
                    />
                    {aliasError && <p className="text-xs text-red-600 mt-1">{aliasError}</p>}
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    {hasAccount ? "Actualizar datos" : "Guardar datos bancarios"}
                </button>
            </form>

            {data?.bankAccountUpdatedAt && (
                <p className="text-xs text-gray-400 mt-3 text-center">
                    Última actualización: {new Date(data.bankAccountUpdatedAt).toLocaleDateString("es-AR")}
                </p>
            )}
        </div>
    );
}
