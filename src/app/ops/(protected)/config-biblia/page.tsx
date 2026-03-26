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
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3 italic">
            <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/20 not-italic">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            Biblia Financiera
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2 ml-1">
            Configuración completa de parámetros operativos y financieros
          </p>
        </div>
      </div>

      <BibliaConfigClient initialConfig={config} />
    </div>
  );
}