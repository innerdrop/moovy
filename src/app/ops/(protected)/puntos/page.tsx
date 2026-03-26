import { redirect } from "next/navigation";

/**
 * Página legacy de Puntos MOOVER — redirige a Biblia Financiera.
 *
 * La configuración de puntos se maneja exclusivamente desde la Biblia Financiera
 * (sección "Programa MOOVER") para evitar duplicación de parámetros y conflictos
 * entre endpoints.
 *
 * Consolidado: 2026-03-26
 */
export default function PointsConfigRedirect() {
  redirect("/ops/config-biblia");
}