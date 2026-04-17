import { create } from "zustand";

interface ConfirmState {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel: string;
    variant: "danger" | "warning" | "default";
    onConfirm: (() => void) | null;
    onCancel: (() => void) | null;
}

interface ConfirmStore extends ConfirmState {
    show: (opts: {
        title: string;
        message: string;
        confirmLabel?: string;
        cancelLabel?: string;
        variant?: "danger" | "warning" | "default";
        onConfirm: () => void;
        onCancel?: () => void;
    }) => void;
    close: () => void;
}

const initial: ConfirmState = {
    isOpen: false,
    title: "",
    message: "",
    confirmLabel: "Confirmar",
    cancelLabel: "Cancelar",
    variant: "default",
    onConfirm: null,
    onCancel: null,
};

export const useConfirmStore = create<ConfirmStore>((set) => ({
    ...initial,
    show: (opts) =>
        set({
            isOpen: true,
            title: opts.title,
            message: opts.message,
            confirmLabel: opts.confirmLabel ?? "Confirmar",
            cancelLabel: opts.cancelLabel ?? "Cancelar",
            variant: opts.variant ?? "default",
            onConfirm: opts.onConfirm,
            onCancel: opts.onCancel ?? null,
        }),
    close: () => set(initial),
}));

/**
 * Helper imperativo: retorna una Promise<boolean>
 * Uso: const ok = await confirm({ title: "...", message: "..." });
 */
export function confirm(opts: {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "warning" | "default";
}): Promise<boolean> {
    return new Promise((resolve) => {
        useConfirmStore.getState().show({
            ...opts,
            onConfirm: () => {
                useConfirmStore.getState().close();
                resolve(true);
            },
            onCancel: () => {
                useConfirmStore.getState().close();
                resolve(false);
            },
        });
    });
}
