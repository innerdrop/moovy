import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { AlertCircle, LogOut } from "lucide-react";

export default async function CuentaSuspendidaPage() {
  const session = await auth();

  // If not suspended, redirect to home
  if (!session || !(session.user as any).isSuspended) {
    redirect("/");
  }

  const suspendedUntil = (session.user as any).suspendedUntil
    ? new Date((session.user as any).suspendedUntil)
    : null;
  const suspensionReason = (session.user as any).suspensionReason;

  const isTemporarySuspension = suspendedUntil !== null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 max-w-md w-full text-center space-y-6">
        {/* Logo MOOVY */}
        <div className="flex justify-center">
          <div className="text-4xl font-bold text-[#e60012]">MOOVY</div>
        </div>

        {/* Alert Icon */}
        <div className="mx-auto w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-[#e60012]" />
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Cuenta Suspendida
          </h1>
          <p className="text-gray-500 mt-2">
            {isTemporarySuspension
              ? "Tu cuenta fue suspendida temporalmente."
              : "Tu cuenta ha sido suspendida."}
          </p>
        </div>

        {/* Reason (if available) */}
        {suspensionReason && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-[#e60012]">Motivo:</span>{" "}
              {suspensionReason}
            </p>
          </div>
        )}

        {/* Suspension End Date (if temporary) */}
        {isTemporarySuspension && suspendedUntil && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-blue-700">Se reactivará:</span>{" "}
              {suspendedUntil.toLocaleDateString("es-AR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        )}

        {/* Message */}
        <div className="text-gray-600">
          <p className="text-sm">
            Si creés que esto es un error o tenés preguntas, contactá a nuestro
            equipo de soporte.
          </p>
        </div>

        {/* Support Links */}
        <div className="flex flex-col gap-3">
          <a
            href="mailto:soporte@somosmoovy.com"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
          >
            Contactar Soporte
          </a>
        </div>

        {/* Logout Button */}
        <div className="border-t border-gray-200 pt-6">
          <Link
            href="/api/auth/signout"
            className="inline-flex items-center justify-center gap-2 text-gray-600 hover:text-[#e60012] transition font-medium text-sm"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
