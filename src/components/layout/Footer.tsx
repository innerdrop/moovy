"use client";

import Link from "next/link";
import {
    Facebook,
    Instagram,
    Twitter,
    Mail,
    Phone,
    ArrowRight
} from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-gray-900 border-t border-white/10 text-white font-sans pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

                    {/* 1. Brand & About */}
                    <div className="space-y-6">
                        <Link href="/" className="inline-block">
                            <span className="text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "'Junegull', sans-serif" }}>
                                MOOVY
                            </span>
                        </Link>
                        <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                            Revolucionando el delivery en el Fin del Mundo. Conectamos todo Ushuaia en una sola plataforma.
                        </p>
                        <div className="flex gap-4">
                            <SocialLink href="#" icon={Instagram} label="Instagram" />
                            <SocialLink href="#" icon={Facebook} label="Facebook" />
                            <SocialLink href="#" icon={Twitter} label="Twitter" />
                        </div>
                    </div>

                    {/* 2. Quick Links */}
                    <div>
                        <h4 className="text-white font-bold mb-6 text-lg">Explorar</h4>
                        <ul className="space-y-4 text-sm text-gray-400">
                            <li><FooterLink href="/tienda">Pedir Ahora</FooterLink></li>
                            <li><FooterLink href="/repartidor/registro">Quiero ser Repartidor</FooterLink></li>
                            <li><FooterLink href="/comercio/registro">Registrar mi Comercio</FooterLink></li>
                            <li><FooterLink href="/puntos">Programa MOOVER</FooterLink></li>
                        </ul>
                    </div>

                    {/* 3. Support & Legal */}
                    <div>
                        <h4 className="text-white font-bold mb-6 text-lg">Soporte</h4>
                        <ul className="space-y-4 text-sm text-gray-400">
                            <li><FooterLink href="/ayuda">Centro de Ayuda</FooterLink></li>
                            <li><FooterLink href="/contacto">Contacto</FooterLink></li>
                            <li><FooterLink href="/terminos">Términos y Condiciones</FooterLink></li>
                            <li><FooterLink href="/privacidad">Política de Privacidad</FooterLink></li>
                        </ul>
                    </div>

                    {/* 4. Contact Info */}
                    <div>
                        <h4 className="text-white font-bold mb-6 text-lg">Contacto</h4>
                        <ul className="space-y-4 text-sm text-gray-400">
                            <li className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-[#e60012] shrink-0" />
                                <a href="mailto:hola@moovy.app" className="hover:text-white transition">hola@moovy.app</a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-[#e60012] shrink-0" />
                                <span className="hover:text-white transition cursor-pointer">Consultas por WhatsApp</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
                    <p>© {new Date().getFullYear()} MOOVY. Todos los derechos reservados.</p>
                    <p>Hecho con ❤️ en Ushuaia</p>
                </div>
            </div>
        </footer>
    );
}

function SocialLink({ href, icon: Icon, label }: { href: string, icon: any, label: string }) {
    return (
        <a
            href={href}
            aria-label={label}
            className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[#e60012] hover:text-white transition-all hover:-translate-y-1"
        >
            <Icon className="w-5 h-5" />
        </a>
    );
}

function FooterLink({ href, children }: { href: string, children: React.ReactNode }) {
    return (
        <Link href={href} className="flex items-center gap-2 hover:text-[#e60012] hover:pl-2 transition-all duration-300 group">
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            {children}
        </Link>
    );
}
