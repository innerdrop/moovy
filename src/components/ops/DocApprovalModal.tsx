"use client";

/**
 * DocApprovalModal — modal con diseño Moovy para aprobar un documento desde OPS.
 *
 * Reemplaza el flujo viejo basado en window.confirm() + window.prompt() (3 pop-ups
 * nativos del browser, feos, sin marca). Acá un solo modal con:
 *   - Radio explícito DIGITAL / FÍSICO (sin defaults engañosos).
 *   - Si elige FÍSICO: textarea con contador, mín 5 chars.
 *   - Botón Aprobar deshabilitado hasta que la elección esté completa.
 *
 * Sirve tanto para docs del merchant como del driver. El caller pasa el `label`
 * del doc (ej: "CUIT", "Habilitación Municipal") y un `onConfirm({source, note})`
 * que el modal invoca cuando el admin confirma.
 *
 * Diseño coherente con ConfirmModal: backdrop blur, card blanca redondeada,
 * rojo MOOVY en el CTA primario, animación fade-in zoom-in.
 */

import { useEffect, useRef, useState } from "react";
import { CheckCircle, Upload, FileText, X } from "lucide-react";

const NOTE_MIN_CHARS = 5;
const NOTE_MAX_CHARS = 500;

export type ApprovalSource = "DIGITAL" | "PHYSICAL";

export interface DocApprovalConfirmation {
    source: ApprovalSource;
    note: string | null;
}

interface DocApprovalModalProps {
    isOpen: boolean;
    docLabel: string;
    /** Si true, deshabilita TODO el modal (durante el fetch al backend). */
    submitting?: boolean;
    onClose: () => void;
    onConfirm: (data: DocApprovalConfirmation) => void | Promise<void>;
}

export default function DocApprovalModal({
    isOpen,
    docLabel,
    submitting = false,
    onClose,
    onConfirm,
}: DocApprovalModalProps) {
    const [source, setSource] = useState<ApprovalSource>("DIGITAL");
    const [note, setNote] = useState("");
    const cancelRef = useRef<HTMLButtonElement>(null);

    // Reset state cada vez que se abre (evita arrastrar valores de un doc anterior).
    useEffect(() => {
        if (isOpen) {
            setSource("DIGITAL");
            setNote("");
            // Focus al cancelar primero (default seguro).
            setTimeout(() => cancelRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Cerrar con Escape.
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !submitting) onClose();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [isOpen, onClose, submitting]);

    if (!isOpen) return null;

    const trimmedNote = note.trim();
    const isPhysical = source === "PHYSICAL";
    const physicalNoteValid = !isPhysical || trimmedNote.length >= NOTE_MIN_CHARS;
    const canConfirm = !submitting && physicalNoteValid;

    const handleConfirm = () => {
        if (!canConfirm) return;
        onConfirm({
            source,
            note: isPhysical ? trimmedNote : null,
        });
    };

    return (
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
            onClick={() => !submitting && onClose()}
        >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start gap-4 mb-5">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-gray-900">
                            Aprobar documento
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                            Vas a aprobar <strong>{docLabel}</strong>. ¿Cómo lo recibiste?
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => !submitting && onClose()}
                        disabled={submitting}
                        className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
                        aria-label="Cerrar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Selector source */}
                <div className="space-y-3 mb-5">
                    <button
                        type="button"
                        onClick={() => !submitting && setSource("DIGITAL")}
                        disabled={submitting}
                        className={`w-full text-left p-4 rounded-xl border-2 transition flex items-start gap-3 disabled:opacity-50 ${
                            source === "DIGITAL"
                                ? "border-[#e60012] bg-red-50/50"
                                : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                    >
                        <div className="flex-shrink-0 mt-0.5">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${source === "DIGITAL" ? "border-[#e60012]" : "border-gray-300"}`}>
                                {source === "DIGITAL" && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#e60012]" />
                                )}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 font-semibold text-sm text-gray-900">
                                <Upload className="w-4 h-4" />
                                Digital
                            </div>
                            <p className="text-xs text-gray-600 mt-0.5">
                                Ya está cargado en el sistema y lo revisaste.
                            </p>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => !submitting && setSource("PHYSICAL")}
                        disabled={submitting}
                        className={`w-full text-left p-4 rounded-xl border-2 transition flex items-start gap-3 disabled:opacity-50 ${
                            source === "PHYSICAL"
                                ? "border-[#e60012] bg-red-50/50"
                                : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                    >
                        <div className="flex-shrink-0 mt-0.5">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${source === "PHYSICAL" ? "border-[#e60012]" : "border-gray-300"}`}>
                                {source === "PHYSICAL" && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#e60012]" />
                                )}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 font-semibold text-sm text-gray-900">
                                <FileText className="w-4 h-4" />
                                Físico
                            </div>
                            <p className="text-xs text-gray-600 mt-0.5">
                                Lo recibiste en papel, email o WhatsApp. Vas a tener que escribir una nota.
                            </p>
                        </div>
                    </button>
                </div>

                {/* Textarea de nota — sólo si physical */}
                {isPhysical && (
                    <div className="mb-5">
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            Nota (¿cómo recibiste el documento?)
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX_CHARS))}
                            placeholder="Ej: Recibido en oficina el 25/04/2026, copia escaneada en email a admin@somosmoovy.com"
                            rows={3}
                            disabled={submitting}
                            className="w-full text-sm text-gray-900 bg-white border-2 border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#e60012] resize-none disabled:opacity-50"
                            autoFocus
                        />
                        <div className="flex items-center justify-between mt-1">
                            <p className={`text-xs ${trimmedNote.length < NOTE_MIN_CHARS ? "text-amber-600" : "text-gray-500"}`}>
                                {trimmedNote.length < NOTE_MIN_CHARS
                                    ? `Faltan ${NOTE_MIN_CHARS - trimmedNote.length} caracteres mínimo`
                                    : "Mínimo cumplido"}
                            </p>
                            <p className="text-xs text-gray-400">
                                {trimmedNote.length}/{NOTE_MAX_CHARS}
                            </p>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                    <button
                        ref={cancelRef}
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={!canConfirm}
                        className="px-4 py-2.5 text-sm font-semibold text-white bg-[#e60012] hover:bg-[#cc000f] rounded-xl transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        {submitting ? "Guardando..." : "Aprobar"}
                    </button>
                </div>
            </div>
        </div>
    );
}
