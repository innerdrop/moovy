// Configuración Biblia Financiera — Panel OPS
// Todos los parámetros operativos y financieros de Moovy configurables sin tocar código
import { getFullOpsConfig } from "@/lib/ops-config";
import { BookOpen } from "lucide-react";
import BibliaConfigClient from "./BibliaConfigClient";

export default async function BibliaConfigPage() {
  const config = await getFullOpsConfig();

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            Biblia Financiera
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Configuración completa de parámetros operativos y financieros
          </p>
        </div>
      </div>

      <BibliaConfigClient initialConfig={config} />
    </div>
  );
}
