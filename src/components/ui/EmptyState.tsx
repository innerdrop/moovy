import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * ISSUE-028: Componente unificado de estados vacíos.
 *
 * Uso:
 * ```tsx
 * <EmptyState
 *   icon={Heart}
 *   title="Todavía no tenés favoritos"
 *   description="Tocá el corazón en tus comercios o productos y los vas a ver acá."
 *   primaryCta={{ label: "Explorar comercios", href: "/tiendas" }}
 * />
 * ```
 *
 * Variantes visuales:
 * - tone="neutral" (default): gris suave, para listas sin datos (sin urgencia).
 * - tone="brand": acento rojo MOOVY, para pantallas donde queremos empujar al CTA.
 * - tone="marketplace": acento violeta, para marketplace.
 *
 * Regla: SIEMPRE ofrecer al menos un CTA. Un estado vacío sin CTA deja al
 * usuario sin próxima acción — es la definición de dead-end.
 */

type Tone = "neutral" | "brand" | "marketplace";
type Size = "sm" | "md" | "lg";

export type EmptyStateCta = {
    label: string;
    href?: string;
    onClick?: () => void;
    variant?: "primary" | "secondary";
};

export interface EmptyStateProps {
    /** Icono de lucide-react (ej: Heart, Search, ShoppingBag) */
    icon?: LucideIcon;
    /** Título principal — debería ser corto y empático en español argentino */
    title: string;
    /** Subtexto explicativo opcional */
    description?: string;
    /** CTA primario (botón lleno) */
    primaryCta?: EmptyStateCta;
    /** CTA secundario (link outline) */
    secondaryCta?: EmptyStateCta;
    /** Contenido custom debajo de los CTAs (ej: chips, hints) */
    children?: ReactNode;
    /** Acento visual */
    tone?: Tone;
    /** Tamaño del padding vertical y escala tipográfica */
    size?: Size;
    /** className extra para el contenedor */
    className?: string;
}

const TONE_STYLES: Record<Tone, { iconBg: string; iconColor: string; primaryBg: string; primaryHover: string }> = {
    neutral: {
        iconBg: "bg-gray-100",
        iconColor: "text-gray-500",
        primaryBg: "bg-gray-900",
        primaryHover: "hover:bg-gray-800",
    },
    brand: {
        iconBg: "bg-red-50",
        iconColor: "text-[#e60012]",
        primaryBg: "bg-[#e60012]",
        primaryHover: "hover:bg-[#c20010]",
    },
    marketplace: {
        iconBg: "bg-purple-50",
        iconColor: "text-[#7C3AED]",
        primaryBg: "bg-[#7C3AED]",
        primaryHover: "hover:bg-[#6D28D9]",
    },
};

const SIZE_STYLES: Record<Size, { padding: string; iconBox: string; iconSize: string; title: string; desc: string }> = {
    sm: {
        padding: "py-8 px-4",
        iconBox: "w-12 h-12",
        iconSize: "w-6 h-6",
        title: "text-base font-semibold",
        desc: "text-sm",
    },
    md: {
        padding: "py-12 px-4",
        iconBox: "w-16 h-16",
        iconSize: "w-8 h-8",
        title: "text-lg lg:text-xl font-bold",
        desc: "text-sm lg:text-base",
    },
    lg: {
        padding: "py-16 lg:py-20 px-4",
        iconBox: "w-20 h-20",
        iconSize: "w-10 h-10",
        title: "text-xl lg:text-2xl font-black",
        desc: "text-base lg:text-lg",
    },
};

function CtaButton({ cta, primary, tone }: { cta: EmptyStateCta; primary: boolean; tone: Tone }) {
    const toneCfg = TONE_STYLES[tone];
    const className = primary
        ? `inline-flex items-center justify-center gap-2 ${toneCfg.primaryBg} ${toneCfg.primaryHover} text-white font-semibold px-5 py-2.5 rounded-xl shadow-sm transition active:scale-[0.98]`
        : "inline-flex items-center justify-center gap-2 border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 font-medium px-5 py-2.5 rounded-xl transition";

    if (cta.href) {
        return (
            <Link href={cta.href} className={className}>
                {cta.label}
            </Link>
        );
    }
    return (
        <button type="button" onClick={cta.onClick} className={className}>
            {cta.label}
        </button>
    );
}

export default function EmptyState({
    icon: Icon,
    title,
    description,
    primaryCta,
    secondaryCta,
    children,
    tone = "neutral",
    size = "md",
    className = "",
}: EmptyStateProps) {
    const toneCfg = TONE_STYLES[tone];
    const sizeCfg = SIZE_STYLES[size];

    return (
        <div
            className={`flex flex-col items-center justify-center text-center ${sizeCfg.padding} ${className}`}
            role="status"
            aria-live="polite"
        >
            {Icon && (
                <div
                    className={`${sizeCfg.iconBox} ${toneCfg.iconBg} rounded-full flex items-center justify-center mb-4`}
                >
                    <Icon className={`${sizeCfg.iconSize} ${toneCfg.iconColor}`} aria-hidden="true" />
                </div>
            )}
            <h3 className={`${sizeCfg.title} text-gray-900 mb-2 max-w-md`}>{title}</h3>
            {description && (
                <p className={`${sizeCfg.desc} text-gray-500 max-w-md mb-6`}>{description}</p>
            )}
            {(primaryCta || secondaryCta) && (
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto justify-center">
                    {primaryCta && <CtaButton cta={primaryCta} primary tone={tone} />}
                    {secondaryCta && (
                        <CtaButton
                            cta={{ ...secondaryCta, variant: "secondary" }}
                            primary={false}
                            tone={tone}
                        />
                    )}
                </div>
            )}
            {children && <div className="mt-4">{children}</div>}
        </div>
    );
}
