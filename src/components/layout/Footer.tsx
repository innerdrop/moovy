"use client";

import Link from "next/link";
import Image from "next/image";
import {
    Instagram,
    Mail,
    Phone,
} from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-white font-sans pt-10 pb-6 mt-6">
            <div className="max-w-7xl mx-auto px-5">
                {/* Top section: Brand + columns */}
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">

                    {/* 1. Brand */}
                    <div className="col-span-2 md:col-span-1 space-y-4">
                        <Link href="/" className="inline-block">
                            <Image
                                src="/logo-moovy-white.svg"
                                alt="MOOVY"
                                width={120}
                                height={38}
                                className="h-8 w-auto"
                                priority={false}
                            />
                        </Link>
                        <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                            Revolucionando el delivery en el Fin del Mundo. Conectamos todo Ushuaia en una sola plataforma.
                        </p>
                        <div className="flex gap-3">
                            <SocialLink href="https://instagram.com/somosmoovy" icon={Instagram} label="Instagram" />
                        </div>
                    </div>

                    {/* 2. Explorar */}
                    <div>
                        <h4 className="text-white font-bold mb-3 text-sm">Explorar</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><FooterLink href="/">Pedir Ahora</FooterLink></li>
                            <li><FooterLink href="/marketplace">Marketplace</FooterLink></li>
                            <li><FooterLink href="/puntos">Programa MOOVER</FooterLink></li>
                            <li><FooterLink href="/repartidor/registro">Ser Repartidor</FooterLink></li>
                            <li><FooterLink href="/comercio/registro">Registrar Comercio</FooterLink></li>
                            <li><FooterLink href="/nosotros">Quiénes Somos</FooterLink></li>
                            <li><FooterLink href="/comisiones">Tarifas</FooterLink></li>
                            <li><FooterLink href="/ayuda">Centro de Ayuda</FooterLink></li>
                        </ul>
                    </div>

                    {/* 3. Legal — dos sub-columnas en mobile */}
                    <div>
                        <h4 className="text-white font-bold mb-3 text-sm">Legal</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><FooterLink href="/terminos">Términos Generales</FooterLink></li>
                            <li><FooterLink href="/privacidad">Privacidad</FooterLink></li>
                            <li><FooterLink href="/cookies">Cookies</FooterLink></li>
                            <li><FooterLink href="/devoluciones">Devoluciones</FooterLink></li>
                            <li><FooterLink href="/cancelaciones">Cancelaciones</FooterLink></li>
                            <li><FooterLink href="/terminos-vendedor">T. Vendedores</FooterLink></li>
                            <li><FooterLink href="/terminos-repartidor">T. Repartidores</FooterLink></li>
                            <li><FooterLink href="/terminos-comercio">T. Comercios</FooterLink></li>
                        </ul>
                    </div>

                    {/* 4. Contacto */}
                    <div className="col-span-2 md:col-span-1">
                        <h4 className="text-white font-bold mb-3 text-sm">Contacto</h4>
                        <ul className="space-y-3 text-sm text-gray-400">
                            <li className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-[#e60012] shrink-0" />
                                <a href="mailto:somosmoovy@gmail.com" className="hover:text-white transition">somosmoovy@gmail.com</a>
                            </li>
                            <li className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-[#e60012] shrink-0" />
                                <a href="https://wa.me/5492901553173" target="_blank" className="hover:text-white transition">
                                    WhatsApp
                                </a>
                            </li>
                        </ul>
                        <p className="text-xs text-gray-600 mt-4">
                            Ushuaia, Tierra del Fuego, Argentina
                        </p>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-gray-800 pt-5 text-center text-xs text-gray-500">
                    <p>&copy; {new Date().getFullYear()} MOOVY. Todos los derechos reservados.</p>
                </div>
            </div>
        </footer>
    );
}

function SocialLink({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[#e60012] transition-all"
        >
            <Icon className="w-4 h-4" />
        </a>
    );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link href={href} className="hover:text-white transition-colors">
            {children}
        </Link>
    );
}
