"use client";

// OPS/CRM — Notas internas del admin sobre un user.
// Visible solo en /ops/usuarios/[id]. No se muestra al user final.
// El autor puede editar su nota; cualquier admin puede borrarla y pinear/despinearla.

import { useCallback, useEffect, useState } from "react";
import {
    StickyNote,
    Pin,
    PinOff,
    Pencil,
    Trash2,
    Loader2,
    Send,
    X,
    Check,
} from "lucide-react";
import { toast } from "@/store/toast";
import { confirm } from "@/store/confirm";

interface AdminNote {
    id: string;
    userId: string;
    adminId: string;
    content: string;
    pinned: boolean;
    createdAt: string;
    updatedAt: string;
    admin: { id: string; name: string | null; email: string };
}

interface AdminNotesSectionProps {
    userId: string;
    currentAdminId: string;
}

const MAX_LEN = 2000;

function formatDate(iso: string): string {
    try {
        return new Date(iso).toLocaleString("es-AR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return iso;
    }
}

export function AdminNotesSection({ userId, currentAdminId }: AdminNotesSectionProps) {
    const [notes, setNotes] = useState<AdminNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newContent, setNewContent] = useState("");
    const [newPinned, setNewPinned] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");
    const [savingId, setSavingId] = useState<string | null>(null);

    const fetchNotes = useCallback(async () => {
        try {
            const res = await fetch(`/api/admin/notes?userId=${encodeURIComponent(userId)}`);
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || "Error al cargar notas");
            }
            const data = await res.json();
            setNotes(Array.isArray(data.items) ? data.items : []);
        } catch (e: any) {
            toast.error(e?.message || "Error al cargar notas");
            setNotes([]);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        void fetchNotes();
    }, [fetchNotes]);

    const handleCreate = async () => {
        const content = newContent.trim();
        if (!content) {
            toast.error("La nota no puede estar vacía");
            return;
        }
        if (content.length > MAX_LEN) {
            toast.error(`Máximo ${MAX_LEN} caracteres`);
            return;
        }

        setCreating(true);
        try {
            const res = await fetch("/api/admin/notes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, content, pinned: newPinned }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || "Error al crear");
            }
            const data = await res.json();
            // Optimistic-ish: push and resort
            setNotes((prev) => {
                const next = [data.note as AdminNote, ...prev];
                return next.sort((a, b) => {
                    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
                    return (
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    );
                });
            });
            setNewContent("");
            setNewPinned(false);
            toast.success("Nota agregada");
        } catch (e: any) {
            toast.error(e?.message || "No se pudo crear la nota");
        } finally {
            setCreating(false);
        }
    };

    const handleTogglePin = async (note: AdminNote) => {
        // Solo el autor puede editar (PATCH) — si no es autor, bloqueamos pin/unpin
        if (note.adminId !== currentAdminId) {
            toast.error("Solo el autor puede pinear o editar la nota");
            return;
        }
        setSavingId(note.id);
        const previous = notes;
        // Optimistic update
        setNotes((prev) =>
            [...prev]
                .map((n) => (n.id === note.id ? { ...n, pinned: !n.pinned } : n))
                .sort((a, b) => {
                    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
                    return (
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    );
                })
        );
        try {
            const res = await fetch(`/api/admin/notes/${note.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pinned: !note.pinned }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || "Error");
            }
            toast.success(note.pinned ? "Nota despineada" : "Nota pineada");
        } catch (e: any) {
            // Rollback
            setNotes(previous);
            toast.error(e?.message || "No se pudo actualizar");
        } finally {
            setSavingId(null);
        }
    };

    const startEdit = (note: AdminNote) => {
        if (note.adminId !== currentAdminId) {
            toast.error("Solo el autor puede editar la nota");
            return;
        }
        setEditingId(note.id);
        setEditContent(note.content);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditContent("");
    };

    const handleSaveEdit = async (note: AdminNote) => {
        const content = editContent.trim();
        if (!content) {
            toast.error("La nota no puede estar vacía");
            return;
        }
        if (content.length > MAX_LEN) {
            toast.error(`Máximo ${MAX_LEN} caracteres`);
            return;
        }
        if (content === note.content) {
            cancelEdit();
            return;
        }

        setSavingId(note.id);
        try {
            const res = await fetch(`/api/admin/notes/${note.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || "Error");
            }
            const data = await res.json();
            setNotes((prev) =>
                prev.map((n) => (n.id === note.id ? (data.note as AdminNote) : n))
            );
            toast.success("Nota actualizada");
            cancelEdit();
        } catch (e: any) {
            toast.error(e?.message || "No se pudo actualizar");
        } finally {
            setSavingId(null);
        }
    };

    const handleDelete = async (note: AdminNote) => {
        const ok = await confirm({
            title: "Borrar nota",
            message:
                "¿Seguro que querés borrar esta nota interna? Esta acción no se puede deshacer.",
            confirmLabel: "Borrar",
            cancelLabel: "Cancelar",
            variant: "danger",
        });
        if (!ok) return;

        setSavingId(note.id);
        const previous = notes;
        // Optimistic remove
        setNotes((prev) => prev.filter((n) => n.id !== note.id));
        try {
            const res = await fetch(`/api/admin/notes/${note.id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || "Error");
            }
            toast.success("Nota borrada");
        } catch (e: any) {
            // Rollback
            setNotes(previous);
            toast.error(e?.message || "No se pudo borrar");
        } finally {
            setSavingId(null);
        }
    };

    const handleNewKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Ctrl+Enter o Cmd+Enter envía
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            if (!creating) void handleCreate();
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-amber-200 overflow-hidden">
            <div className="px-6 sm:px-8 py-4 sm:py-5 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <StickyNote className="w-5 h-5 text-amber-700" />
                </div>
                <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900">
                        Notas internas
                    </h2>
                    <p className="text-xs text-gray-600">
                        Solo visibles para operadores y admins. El usuario nunca las ve.
                    </p>
                </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
                {/* Nueva nota */}
                <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 focus-within:border-amber-300 focus-within:ring-2 focus-within:ring-amber-100 transition">
                    <label htmlFor="new-admin-note" className="sr-only">
                        Nueva nota interna
                    </label>
                    <textarea
                        id="new-admin-note"
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value.slice(0, MAX_LEN))}
                        onKeyDown={handleNewKeyDown}
                        placeholder="Ej: 'Llamé al comercio por reclamo del pedido #MOV-123. Aclaró que el retraso fue por el clima. Cerrado sin compensación.'"
                        rows={3}
                        disabled={creating}
                        className="w-full resize-y min-h-[72px] text-sm text-gray-900 bg-transparent border-0 focus:ring-0 focus:outline-none placeholder:text-gray-400 disabled:opacity-50"
                    />
                    <div className="mt-2 flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3">
                            <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-600 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={newPinned}
                                    onChange={(e) => setNewPinned(e.target.checked)}
                                    disabled={creating}
                                    className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-300"
                                />
                                <Pin className="w-3.5 h-3.5" />
                                Pinear arriba
                            </label>
                            <span className="text-xs text-gray-400">
                                {newContent.length}/{MAX_LEN}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={handleCreate}
                            disabled={creating || newContent.trim().length === 0}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#e60012] hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition min-h-[44px]"
                            aria-label="Agregar nota"
                        >
                            {creating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            Agregar nota
                        </button>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2">
                        Tip: Ctrl + Enter envía.
                    </p>
                </div>

                {/* Lista de notas */}
                {loading ? (
                    <div className="flex items-center justify-center py-8 text-gray-400 text-sm">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Cargando notas...
                    </div>
                ) : notes.length === 0 ? (
                    <div className="text-center py-8 text-sm text-gray-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        Aún no hay notas internas sobre este usuario.
                    </div>
                ) : (
                    <ul className="space-y-2.5">
                        {notes.map((note) => {
                            const isAuthor = note.adminId === currentAdminId;
                            const isEditing = editingId === note.id;
                            const isSaving = savingId === note.id;
                            const isEdited =
                                new Date(note.updatedAt).getTime() -
                                    new Date(note.createdAt).getTime() >
                                1000;

                            return (
                                <li
                                    key={note.id}
                                    className={`border rounded-xl p-3 sm:p-4 transition ${
                                        note.pinned
                                            ? "bg-amber-50/60 border-amber-200"
                                            : "bg-white border-slate-200 hover:border-slate-300"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                                            {note.pinned && (
                                                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                                                    <Pin className="w-3 h-3" /> Pineada
                                                </span>
                                            )}
                                            <span className="text-xs font-semibold text-gray-800 truncate">
                                                {note.admin.name ||
                                                    note.admin.email.split("@")[0] ||
                                                    "Admin"}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {formatDate(note.createdAt)}
                                            </span>
                                            {isEdited && (
                                                <span className="text-[10px] text-gray-400 italic">
                                                    · editada
                                                </span>
                                            )}
                                        </div>

                                        {!isEditing && (
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                {isAuthor && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleTogglePin(note)}
                                                            disabled={isSaving}
                                                            className="p-2 rounded-lg text-gray-500 hover:bg-amber-100 hover:text-amber-700 disabled:opacity-50 transition"
                                                            aria-label={
                                                                note.pinned
                                                                    ? "Despinear nota"
                                                                    : "Pinear nota"
                                                            }
                                                            title={
                                                                note.pinned
                                                                    ? "Despinear"
                                                                    : "Pinear"
                                                            }
                                                        >
                                                            {note.pinned ? (
                                                                <PinOff className="w-4 h-4" />
                                                            ) : (
                                                                <Pin className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => startEdit(note)}
                                                            disabled={isSaving}
                                                            className="p-2 rounded-lg text-gray-500 hover:bg-slate-100 hover:text-gray-900 disabled:opacity-50 transition"
                                                            aria-label="Editar nota"
                                                            title="Editar"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(note)}
                                                    disabled={isSaving}
                                                    className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition"
                                                    aria-label="Borrar nota"
                                                    title="Borrar"
                                                >
                                                    {isSaving ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {isEditing ? (
                                        <div>
                                            <textarea
                                                value={editContent}
                                                onChange={(e) =>
                                                    setEditContent(
                                                        e.target.value.slice(0, MAX_LEN)
                                                    )
                                                }
                                                rows={3}
                                                disabled={isSaving}
                                                className="w-full resize-y min-h-[72px] text-sm text-gray-900 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300 disabled:opacity-50"
                                            />
                                            <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
                                                <span className="text-xs text-gray-400">
                                                    {editContent.length}/{MAX_LEN}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={cancelEdit}
                                                        disabled={isSaving}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                        Cancelar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSaveEdit(note)}
                                                        disabled={
                                                            isSaving ||
                                                            editContent.trim().length === 0
                                                        }
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#e60012] text-white hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                                    >
                                                        {isSaving ? (
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        ) : (
                                                            <Check className="w-3.5 h-3.5" />
                                                        )}
                                                        Guardar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                                            {note.content}
                                        </p>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
