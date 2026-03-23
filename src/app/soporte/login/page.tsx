import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { loginAction } from "./actions";

export const metadata = {
    title: "Soporte - Login",
    description: "Portal de soporte MOOVY"
};

export default async function SoporteLoginPage() {
    const session = await auth();

    if (session?.user) {
        redirect("/soporte");
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="inline-block bg-[#e60012] text-white rounded-lg p-3 mb-4">
                        <svg
                            className="w-8 h-8"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3 .97 4.29L2 22l6.29-.97C9.5 21.61 10.96 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">MOOVY Soporte</h1>
                    <p className="text-slate-300">Portal de operadores de soporte</p>
                </div>

                {/* Form */}
                <form action={loginAction as any} className="bg-white rounded-lg shadow-xl p-8 space-y-6">
                    <input type="hidden" name="redirectTo" value="/soporte" />

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e60012] focus:border-transparent outline-none transition"
                            placeholder="operador@moovy.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                            Contraseña
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e60012] focus:border-transparent outline-none transition"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-[#e60012] text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                    >
                        Ingresar
                    </button>
                </form>

                {/* Footer */}
                <p className="text-center text-slate-400 text-sm mt-6">
                    © 2026 MOOVY - Soporte al cliente
                </p>
            </div>
        </div>
    );
}
