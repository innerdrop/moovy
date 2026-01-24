"use client";

import { useState, useEffect } from "react";
import {
    Search, User, Gift, Plus, X, Loader2, Check, Trash2, Edit,
    Home, Eye, Phone, Mail, Calendar, Key
} from "lucide-react";
import Link from "next/link";

interface UserData {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    pointsBalance: number;
    createdAt: string;
}

export default function ClientsPage() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

    // Create form state
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
    });

    // Edit modal state
    const [editUser, setEditUser] = useState<UserData | null>(null);
    const [editData, setEditData] = useState({ name: "", email: "", phone: "", pointsBalance: 0 });
    const [showEditConfirm, setShowEditConfirm] = useState(false);

    // Delete modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // View modal state
    const [viewUser, setViewUser] = useState<UserData | null>(null);

    // Password reset state
    const [resetUser, setResetUser] = useState<UserData | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [resetError, setResetError] = useState("");
    const [resetting, setResetting] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/admin/users");
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.role === "CLIENT" && (
            user.name?.toLowerCase().includes(search.toLowerCase()) ||
            user.email.toLowerCase().includes(search.toLowerCase())
        )
    );

    // Create user
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!formData.name || !formData.email || !formData.password) {
            setError("Nombre, email y contraseña son obligatorios");
            return;
        }

        if (formData.password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, role: "CLIENT" }),
            });

            if (res.ok) {
                await fetchUsers();
                setShowCreateForm(false);
                setFormData({ name: "", email: "", phone: "", password: "" });
            } else {
                const data = await res.json();
                setError(data.error || "Error al crear cliente");
            }
        } catch (error) {
            setError("Error de conexión");
        } finally {
            setSaving(false);
        }
    };

    // Edit user
    const openEditModal = (user: UserData) => {
        setEditUser(user);
        setEditData({
            name: user.name || "",
            email: user.email,
            phone: user.phone || "",
            pointsBalance: user.pointsBalance
        });
    };

    const handleEdit = async () => {
        if (!editUser) return;

        setSaving(true);
        try {
            const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: editUser.id, ...editData }),
            });

            if (res.ok) {
                await fetchUsers();
                setEditUser(null);
                setShowEditConfirm(false);
            } else {
                const data = await res.json();
                setError(data.error || "Error al actualizar");
            }
        } catch (error) {
            setError("Error de conexión");
        } finally {
            setSaving(false);
        }
    };

    // Delete users
    const handleDelete = async () => {
        setDeleting(true);
        try {
            const res = await fetch("/api/admin/users", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userIds: selectedUsers }),
            });

            if (res.ok) {
                await fetchUsers();
                setSelectedUsers([]);
                setShowDeleteModal(false);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setDeleting(false);
        }
    };

    const toggleSelectUser = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedUsers.length === filteredUsers.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(filteredUsers.map(u => u.id));
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
                    <p className="text-gray-500">{filteredUsers.length} clientes registrados</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/ops" className="btn-secondary flex items-center gap-2">
                        <Home className="w-4 h-4" />
                        Inicio
                    </Link>
                    {selectedUsers.length > 0 && (
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Eliminar ({selectedUsers.length})
                        </button>
                    )}
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Agregar Cliente
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input pl-10 w-full"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Select All */}
                <div className="px-4 py-3 bg-gray-50 border-b flex items-center gap-3">
                    <input
                        type="checkbox"
                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-[#e60012] focus:ring-[#e60012]"
                    />
                    <span className="text-sm text-gray-600">
                        {selectedUsers.length > 0
                            ? `${selectedUsers.length} seleccionado(s)`
                            : "Seleccionar todos"
                        }
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
                            <tr>
                                <th className="px-4 py-4 w-10"></th>
                                <th className="px-4 py-4">Usuario</th>
                                <th className="px-4 py-4">Teléfono</th>
                                <th className="px-4 py-4">Puntos</th>
                                <th className="px-4 py-4">Registro</th>
                                <th className="px-4 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#e60012]" />
                                        Cargando clientes...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        <User className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                        No se encontraron clientes.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className={`hover:bg-gray-50 transition ${selectedUsers.includes(user.id) ? 'bg-red-50' : ''}`}>
                                        <td className="px-4 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedUsers.includes(user.id)}
                                                onChange={() => toggleSelectUser(user.id)}
                                                className="w-4 h-4 rounded border-gray-300 text-[#e60012] focus:ring-[#e60012]"
                                            />
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-[#e60012]/10 flex items-center justify-center text-[#e60012] font-bold">
                                                    {(user.name || user.email).charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{user.name || "Sin nombre"}</p>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-600">
                                            {user.phone || "-"}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                                                <Gift className="w-4 h-4 text-[#e60012]" />
                                                {user.pointsBalance}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-500">
                                            {new Date(user.createdAt).toLocaleDateString("es-AR")}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => setViewUser(user)}
                                                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                                                    title="Ver detalles"
                                                >
                                                    <Eye className="w-4 h-4 text-gray-500" />
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(user)}
                                                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                                                    title="Editar"
                                                >
                                                    <Edit className="w-4 h-4 text-blue-500" />
                                                </button>
                                                <button
                                                    onClick={() => setResetUser(user)}
                                                    className="p-2 hover:bg-orange-100 rounded-lg transition"
                                                    title="Restablecer contraseña"
                                                >
                                                    <Key className="w-4 h-4 text-orange-500" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Modal */}
            {showCreateForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg text-gray-900">Agregar Nuevo Cliente</h3>
                            <button onClick={() => setShowCreateForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">{error}</div>}

                        <form onSubmit={handleCreate} className="space-y-4">
                            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input w-full" placeholder="Nombre completo *" required />
                            <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input w-full" placeholder="Email *" required />
                            <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="input w-full" placeholder="Teléfono" />
                            <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="input w-full" placeholder="Contraseña * (mín 6 caracteres)" required minLength={6} />

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowCreateForm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
                                <button type="submit" disabled={saving} className="flex-1 py-2 bg-[#e60012] text-white rounded-lg hover:bg-[#c5000f] disabled:opacity-50 flex items-center justify-center gap-2">
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                    Crear
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Modal */}
            {viewUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg text-gray-900">Información del Cliente</h3>
                            <button onClick={() => setViewUser(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="text-center mb-6">
                            <div className="w-20 h-20 rounded-full bg-[#e60012]/10 flex items-center justify-center text-[#e60012] text-2xl font-bold mx-auto mb-3">
                                {(viewUser.name || viewUser.email).charAt(0).toUpperCase()}
                            </div>
                            <h4 className="font-bold text-xl text-gray-900">{viewUser.name || "Sin nombre"}</h4>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <Mail className="w-5 h-5 text-gray-400" />
                                <span className="text-gray-700">{viewUser.email}</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <Phone className="w-5 h-5 text-gray-400" />
                                <span className="text-gray-700">{viewUser.phone || "No registrado"}</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <Gift className="w-5 h-5 text-[#e60012]" />
                                <span className="text-gray-700">{viewUser.pointsBalance} puntos</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <Calendar className="w-5 h-5 text-gray-400" />
                                <span className="text-gray-700">Registrado: {new Date(viewUser.createdAt).toLocaleDateString("es-AR")}</span>
                            </div>
                        </div>

                        <button onClick={() => { setViewUser(null); openEditModal(viewUser); }} className="w-full mt-4 py-2 bg-[#e60012] text-white rounded-lg hover:bg-[#c5000f] flex items-center justify-center gap-2">
                            <Edit className="w-5 h-5" />
                            Editar Cliente
                        </button>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editUser && !showEditConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg text-gray-900">Editar Cliente</h3>
                            <button onClick={() => setEditUser(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-600 mb-1 block">Nombre</label>
                                <input type="text" value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className="input w-full" />
                            </div>
                            <div>
                                <label className="text-sm text-gray-600 mb-1 block">Email</label>
                                <input type="email" value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} className="input w-full" />
                            </div>
                            <div>
                                <label className="text-sm text-gray-600 mb-1 block">Teléfono</label>
                                <input type="tel" value={editData.phone} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} className="input w-full" />
                            </div>
                            <div>
                                <label className="text-sm text-gray-600 mb-1 block">Puntos</label>
                                <input type="number" value={editData.pointsBalance} onChange={(e) => setEditData({ ...editData, pointsBalance: parseInt(e.target.value) || 0 })} className="input w-full" />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button onClick={() => setEditUser(null)} className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
                            <button onClick={() => setShowEditConfirm(true)} className="flex-1 py-2 bg-[#e60012] text-white rounded-lg hover:bg-[#c5000f]">Guardar Cambios</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Confirmation Modal */}
            {showEditConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="font-bold text-lg mb-4">Confirmar Cambios</h3>
                        <p className="text-gray-600 mb-6">¿Estás seguro de guardar los cambios para "{editUser?.name}"?</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowEditConfirm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
                            <button onClick={handleEdit} disabled={saving} className="flex-1 py-2 bg-[#e60012] text-white rounded-lg hover:bg-[#c5000f] disabled:opacity-50 flex items-center justify-center gap-2">
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="font-bold text-lg mb-4 text-red-600">Eliminar Clientes</h3>
                        <p className="text-gray-600 mb-6">¿Estás seguro de eliminar {selectedUsers.length} cliente(s)? Esta acción no se puede deshacer.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
                            <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2">
                                {deleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Password Reset Modal */}
            {resetUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                                <Key className="w-5 h-5 text-[#e60012]" />
                                Restablecer Contraseña
                            </h3>
                            <button onClick={() => { setResetUser(null); setNewPassword(""); setConfirmPassword(""); setResetError(""); }} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-gray-600 mb-4">Establecer nueva contraseña para <strong>{resetUser.name}</strong></p>

                        {resetError && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">{resetError}</div>}

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-600 mb-1 block">Nueva contraseña</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="input w-full"
                                    placeholder="Mínimo 6 caracteres"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-600 mb-1 block">Confirmar contraseña</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="input w-full"
                                    placeholder="Repetir contraseña"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={() => { setResetUser(null); setNewPassword(""); setConfirmPassword(""); setResetError(""); }}
                                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={async () => {
                                    setResetError("");
                                    if (newPassword.length < 6) {
                                        setResetError("La contraseña debe tener al menos 6 caracteres");
                                        return;
                                    }
                                    if (newPassword !== confirmPassword) {
                                        setResetError("Las contraseñas no coinciden");
                                        return;
                                    }
                                    setResetting(true);
                                    try {
                                        const res = await fetch("/api/admin/users", {
                                            method: "PATCH",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ id: resetUser.id, action: "reset_password", newPassword })
                                        });
                                        if (res.ok) {
                                            setResetUser(null);
                                            setNewPassword("");
                                            setConfirmPassword("");
                                        } else {
                                            const data = await res.json();
                                            setResetError(data.error || "Error al restablecer");
                                        }
                                    } catch (err) {
                                        setResetError("Error de conexión");
                                    } finally {
                                        setResetting(false);
                                    }
                                }}
                                disabled={resetting}
                                className="flex-1 py-2 bg-[#e60012] text-white rounded-lg hover:bg-[#c5000f] disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {resetting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Key className="w-5 h-5" />}
                                Restablecer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
