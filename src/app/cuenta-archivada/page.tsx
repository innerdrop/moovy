import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Archive, LogOut } from "lucide-react";

export default async function CuentaArchivadaPage() {
  const session = await auth();

  // If not archived, redirect to home
  if (!session || !(session.user as any).isArchived) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 max-w-md w-full text-center space-y-6">
        {/* Logo MOOVY */}
        <div className="flex justify-center">
          <div className="text-4xl font-bold text-[#e60012]">MOOVY</div>
        </div>

        {/* Archive Icon */}
        <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
          <Archive className="w-10 h-10 text-gray-500" />
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Cuenta Archivada
          </h1>
          <p className="text-gray-500 mt-2">
            Tu cuenta fue archivada por el equipo de MOOVY.
          </p>
        </div>

        {/* Message */}
        <div className="text-gray-600">
          <p className="text-sm">
            Para obtener más información o reactivar tu cuenta, contactá a
            nuestro equipo de soporte.
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
