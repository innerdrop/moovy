"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
    ChevronLeft, User, Star, Package, ShoppingCart, Mail, Phone,
    Shield, Loader2, CheckCircle, XCircle, Save, Edit, Eye
} from "lucide-react";
import { formatPrice } from "@/lib/delivery";

interface SellerDetail {
    id: string;
    displayName: string | null;
    bio: string | null;
    avatar: string | null;
    cuit: string | null;
    isActive: boolean;
    isVerified: boolean;
    totalSales: number;
    rating: number | null;
    commissionRate: number;
    createdAt: string;
    user: { name: string | null; email: string; phone: string | null };
    _count: { listings: number; subOrders: number };
    listings?: Array<{ id: string; title: string; price: number; isActive: boolean; images: { url: string }[] }>;
}

export default function SellerDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [seller, setSeller] = useState<SellerDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editData, setEditData] = useState({ commissionRate: 0, bio: "" });
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchSeller();
    }, [id]);

    const fetchSeller = async () => {
        try {
            const res = await fetch(`/api/admin/sellers/${id}`);
            if (res.ok) {
                const data = await res.json();
                setSeller(data);
                setEditData({ commissionRate: data.commissionRate, bio: data.bio || "" });
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/sellers/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editData),
            });
            if (res.ok) {
                fetchSeller();
                setEditMode(false);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setSaving(false);
        }
    };

    const toggleStatus = async (field: "isVerified" | "isActive") => {
        if (!seller) return;
        setActionLoading(true);
        try {
            await fetch(`/api/admin/sellers/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [field]: !seller[field] }),
            });
            fetchSeller();
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#e60012]" /></div>;
    }

    if (!seller) {
        return <div className="text-center py-20"><p className="text-gray-500">Vendedor no encontrado</p><Link href="/ops/vendedores" className="text-[#e60012] hover:underline mt-2 inline-block">Volver</Link></div>;
    }

    return (
        <div className="space-y-6">
            <Link href="/ops/vendedores" className="inline-flex items-center text-gray-500 hover:text-gray-900 transition">
                <ChevronLeft className="w-4 h-4 mr-1" /> Volver a Vendedores
            </Link>

            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center overflow-hidden border border-emerald-100">
                            {seller.avatar ? (
                                <img src={seller.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-8 h-8 text-emerald-300" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-gray-900">{seller.displayName || seller.user.name || "Sin nombre"}</h1>
                                {seller.isVerified && <CheckCircle className="w-5 h-5 text-blue-500" />}
                            </div>
                            <p className="text-slate-500 flex items-center gap-2"><Mail className="w-4 h-4" /> {seller.user.email}</p>
                            {seller.user.phone && <p className="text-slate-500 flex items-center gap-2"><Phone className="w-4 h-4" /> {seller.user.phone}</p>}
                            {seller.cuit && <p className="text-slate-500 text-sm">CUIT: {seller.cuit}</p>}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => toggleStatus("isVerified")} disabled={actionLoading} className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${seller.isVerified ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-slate-50 text-slate-400 border-slate-100"}`}>
                            {seller.isVerified ? "Verificado" : "Verificar"}
                        </button>
                        <button onClick={() => toggleStatus("isActive")} disabled={actionLoading} className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${seller.isActive ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-500 border-red-100"}`}>
                            {seller.isActive ? "Activo" : "Suspendido"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
                    <Package className="w-5 h-5 text-slate-300 mx-auto mb-1" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Listings</p>
                    <p className="text-2xl font-bold text-gray-900">{seller._count.listings}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
                    <ShoppingCart className="w-5 h-5 text-slate-300 mx-auto mb-1" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ventas</p>
                    <p className="text-2xl font-bold text-gray-900">{seller.totalSales}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
                    <Star className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rating</p>
                    <p className="text-2xl font-bold text-gray-900">{seller.rating?.toFixed(1) || "—"}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
                    <Shield className="w-5 h-5 text-red-400 mx-auto mb-1" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Comisión</p>
                    <p className="text-2xl font-bold text-gray-900">{seller.commissionRate}%</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Bio & Commission Edit */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 h-fit">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-gray-900">Perfil</h2>
                        <button onClick={() => setEditMode(!editMode)} className="p-2 hover:bg-slate-100 rounded-lg transition">
                            <Edit className="w-4 h-4 text-slate-500" />
                        </button>
                    </div>
                    {editMode ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                                <textarea value={editData.bio} onChange={(e) => setEditData({ ...editData, bio: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none h-24 text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tasa de Comisión (%)</label>
                                <input type="number" value={editData.commissionRate} onChange={(e) => setEditData({ ...editData, commissionRate: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" min="0" max="100" step="0.5" />
                            </div>
                            <button onClick={handleSave} disabled={saving} className="w-full py-2.5 bg-[#e60012] text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-[#cc000f] disabled:opacity-50 transition">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Guardar</>}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Bio</p>
                                <p className="text-sm text-slate-600">{seller.bio || "Sin bio"}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Comisión</p>
                                <p className="text-sm font-bold text-gray-900">{seller.commissionRate}%</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Registrado</p>
                                <p className="text-sm text-slate-600">{new Date(seller.createdAt).toLocaleDateString("es-AR")}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Listings */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100">
                        <h2 className="font-bold text-gray-900 flex items-center gap-2"><Package className="w-5 h-5 text-[#e60012]" /> Listings del Vendedor</h2>
                    </div>
                    {seller.listings && seller.listings.length > 0 ? (
                        <div className="divide-y divide-slate-50">
                            {seller.listings.map((listing) => (
                                <div key={listing.id} className="flex items-center gap-3 p-4 hover:bg-slate-50 transition">
                                    <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                                        {listing.images[0] ? (
                                            <img src={listing.images[0].url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-slate-300" /></div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-900 text-sm truncate">{listing.title}</p>
                                        <p className="text-sm font-bold text-[#e60012]">{formatPrice(listing.price)}</p>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${listing.isActive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                                        {listing.isActive ? "Activa" : "Pausada"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-slate-400">
                            <Package className="w-12 h-12 mx-auto mb-2 text-slate-200" />
                            <p>Este vendedor no tiene listings</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
