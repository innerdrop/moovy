// Store Layout - Layout de la Tienda
import Header from "@/components/layout/Header";
import CartSidebar from "@/components/layout/CartSidebar";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import WelcomeSplash from "@/components/home/WelcomeSplash";

export default function StoreLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <footer className="bg-[#001F3F] text-white py-12 border-t-4 border-turquoise">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Logo & Info */}
                        <div>
                            <h3 className="text-2xl font-script text-turquoise mb-2">
                                Polirrubro San Juan
                            </h3>
                            <p className="text-gray-300 text-sm">
                                Tu polirrubro de confianza. Delivery las 24 horas, todos los días.
                            </p>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h4 className="font-semibold mb-3">Enlaces Rápidos</h4>
                            <ul className="space-y-2 text-sm text-gray-300">
                                <li><a href="/productos" className="hover:text-turquoise transition">Productos</a></li>
                                <li><a href="/login" className="hover:text-turquoise transition">Mi Cuenta</a></li>
                                <li><a href="/contacto" className="hover:text-turquoise transition">Contacto</a></li>
                            </ul>
                        </div>

                        {/* Contact */}
                        <div>
                            <h4 className="font-semibold mb-3">Ubicación y Horario</h4>
                            <p className="text-sm text-gray-300">
                                🕐 Abierto las 24 horas<br />
                                📍 Gdor. Paz 714, Ushuaia<br />
                                🗺️ Tierra del Fuego, Argentina<br />
                                📞 <a href="https://wa.me/5492901614080" className="hover:text-turquoise transition">Pedidos por WhatsApp</a>
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-white/10 text-center text-sm text-gray-400">
                        © {new Date().getFullYear()} Polirrubro San Juan. Todos los derechos reservados.
                    </div>
                </div>
            </footer>
            <CartSidebar />
            <WhatsAppButton />
            <WelcomeSplash />
        </div>
    );
}
