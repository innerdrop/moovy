"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Search,
    Users,
    Building2,
    Truck,
    ShoppingBag,
    Eye,
    Loader2,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
} from "lucide-react";

interface UserRole {
    role: string;
    isActive: boolean;
}

interface MerchantData {
    id: string;
    name: string;
    approvalStatus: string;
}

interface DriverData {
    id: string;
    approvalStatus: string;
    isActive: boolean;
    isOnline: boolean;
    vehicleType: string | null;
}

interface SellerData {
    id: string;
    displayName: string | null;
    isActive: boolean;
    isVerified: boolean;
}

interface UnifiedUser {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    image: string | null;
    pointsBalance: number;
    createdAt: string;
    deletedAt: string | null;
    roles: UserRole[];
    merchant: MerchantData | null;
    driver: DriverData | null;
    seller: SellerData | null;
}

interface ApiResponse {
    users: UnifiedUser[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

type TabType = "todos" | "pendientes" | "comercios" | "repartidores" | "vendedores" | "clientes";

const ITEMS_PER_PAGE = 20;

// Helper function to determine user status
function getUserStatus(user: UnifiedUser): { label: string; color: string } {
    if (user.deletedAt) return { label: "Eliminado", color: "red" };

    if (user.driver?.approvalStatus === "PENDING" || user.merchant?.approvalStatus === "PENDING") {
        return { label: "Pendiente", color: "yellow" };
    }

    if (user.driver?.approvalStatus === "REJECTED" || user.merchant?.approvalStatus === "REJECTED") {
        return { label: "Rechazado", color: "red" };
    }

    if (user.roles?.some((r) => r.isActive)) {
        return { label: "Activo", color: "green" };
    }

    return { label: "Inactivo", color: "gray" };
}

// Get role color badge
function getRoleBadgeColor(role: string): string {
    switch (role) {
        case "ADMIN":
            return "bg-red-100 text-red-800";
        case "COMERCIO":
            return "bg-blue-100 text-blue-800";
        case "DRIVER":
            return "bg-amber-100 text-amber-800";
        case "SELLER":
            return "bg-purple-100 text-purple-800";
        case "USER":
            return "bg-gray-100 text-gray-800";
        default:
            return "bg-gray-100 text-gray-800";
    }
}

// Get role icon
function getRoleIcon(role: string) {
    switch (role) {
        case "COMERCIO":
            return <Building2 className="w-3 h-3" />;
        case "DRIVER":
            return <Truck className="w-3 h-3" />;
        case "SELLER":
            return <ShoppingBag className="w-3 h-3" />;
        default:
            return <Users className="w-3 h-3" />;
    }
}

// Skeleton loader component
function UserSkeleton() {
    return (
        <tr className="border-b hover:bg-gray-50">
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                    <div className="flex-1 space-y-1">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-32" />
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
            </td>
            <td className="px-6 py-4">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
            </td>
            <td className="px-6 py-4 hidden lg:table-cell">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
            </td>
            <td className="px-6 py-4">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-12" />
            </td>
        </tr>
    );
}

// Empty state component
function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-600 font-medium">No se encontraron usuarios</p>
            <p className="text-gray-500 text-sm mt-1">Intenta ajustar tus filtros o búsqueda</p>
        </div>
    );
}

export default function UsuariosPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const tabFromUrl = searchParams.get("tab") as TabType | null;

    const [activeTab, setActiveTab] = useState<TabType>(
        tabFromUrl && ["todos", "pendientes", "comercios", "repartidores", "vendedores", "clientes"].includes(tabFromUrl)
            ? tabFromUrl
            : "todos"
    );
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);
    const [users, setUsers] = useState<UnifiedUser[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);
    const [tabCounts, setTabCounts] = useState<Record<TabType, number>>({
        todos: 0,
        pendientes: 0,
        comercios: 0,
        repartidores: 0,
        vendedores: 0,
        clientes: 0,
    });

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    // Map tab to API params
    const getFilterParams = useCallback((): { role?: string; status?: string } => {
        switch (activeTab) {
            case "pendientes":
                return { status: "pending" };
            case "comercios":
                return { role: "COMERCIO" };
            case "repartidores":
                return { role: "DRIVER" };
            case "vendedores":
                return { role: "SELLER" };
            case "clientes":
                return { role: "USER" };
            default:
                return {};
        }
    }, [activeTab]);

    // Fetch users
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            const filterParams = getFilterParams();

            if (debouncedSearch) params.set("search", debouncedSearch);
            if (filterParams.role) params.set("role", filterParams.role);
            if (filterParams.status) params.set("status", filterParams.status);
            params.set("page", String(page));
            params.set("limit", String(ITEMS_PER_PAGE));

            const res = await fetch(`/api/admin/users-unified?${params}`);
            if (!res.ok) throw new Error("Error fetching users");

            const data: ApiResponse = await res.json();
            setUsers(data.users);
            setTotal(data.total);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error("Error fetching users:", error);
            setUsers([]);
            setTotal(0);
            setTotalPages(0);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, page, getFilterParams]);

    // Fetch tab counts
    const fetchTabCounts = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/users-unified/counts");
            if (res.ok) {
                const data = await res.json();
                setTabCounts(data);
            }
        } catch (error) {
            console.error("Error fetching tab counts:", error);
        }
    }, []);

    // Fetch users when dependencies change
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Fetch tab counts on mount
    useEffect(() => {
        fetchTabCounts();
    }, [fetchTabCounts]);

    // Handle tab change
    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        setPage(1);
    };

    // Get status badge color
    const getStatusColor = (color: string) => {
        switch (color) {
            case "green":
                return "bg-green-100 text-green-800";
            case "yellow":
                return "bg-yellow-100 text-yellow-800";
            case "red":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const tabs: Array<{ id: TabType; label: string; icon?: React.ReactNode }> = [
        { id: "todos", label: `Todos (${tabCounts.todos})` },
        { id: "pendientes", label: `Pendientes (${tabCounts.pendientes})` },
        { id: "comercios", label: `Comercios (${tabCounts.comercios})`, icon: <Building2 className="w-4 h-4" /> },
        { id: "repartidores", label: `Repartidores (${tabCounts.repartidores})`, icon: <Truck className="w-4 h-4" /> },
        { id: "vendedores", label: `Vendedores (${tabCounts.vendedores})`, icon: <ShoppingBag className="w-4 h-4" /> },
        { id: "clientes", label: `Clientes (${tabCounts.clientes})` },
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-8">
                <h1 className="text-3xl font-bold text-gray-900">Usuarios</h1>
                <p className="text-gray-600 text-sm mt-1">
                    Total: <span className="font-semibold">{total}</span> usuarios registrados
                </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 px-6 overflow-x-auto">
                <div className="flex gap-2 min-w-min py-4">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                                activeTab === tab.id
                                    ? "border-red-600 text-red-600"
                                    : "border-transparent text-gray-600 hover:text-gray-900"
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email o teléfono..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Table */}
                {users.length > 0 ? (
                    <>
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left font-semibold text-gray-900">Usuario</th>
                                        <th className="px-6 py-3 text-left font-semibold text-gray-900">Roles</th>
                                        <th className="px-6 py-3 text-left font-semibold text-gray-900">Estado</th>
                                        <th className="px-6 py-3 text-left font-semibold text-gray-900 hidden lg:table-cell">
                                            Registro
                                        </th>
                                        <th className="px-6 py-3 text-center font-semibold text-gray-900">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading
                                        ? Array.from({ length: 5 }).map((_, i) => <UserSkeleton key={i} />)
                                        : users.map((user) => {
                                              const status = getUserStatus(user);
                                              return (
                                                  <tr key={user.id} className="border-b hover:bg-gray-50 transition-colors">
                                                      {/* User Column */}
                                                      <td className="px-6 py-4">
                                                          <div className="flex items-center gap-3">
                                                              {user.image ? (
                                                                  <img
                                                                      src={user.image}
                                                                      alt={user.name || user.email}
                                                                      className="w-10 h-10 rounded-full object-cover"
                                                                  />
                                                              ) : (
                                                                  <div className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
                                                                      {(user.name || user.email)[0].toUpperCase()}
                                                                  </div>
                                                              )}
                                                              <div className="flex-1 min-w-0">
                                                                  <p className="font-medium text-gray-900 truncate">
                                                                      {user.name || "Sin nombre"}
                                                                  </p>
                                                                  <p className="text-gray-500 text-xs truncate">{user.email}</p>
                                                              </div>
                                                          </div>
                                                      </td>

                                                      {/* Roles Column */}
                                                      <td className="px-6 py-4">
                                                          <div className="flex flex-wrap gap-1">
                                                              {user.roles && user.roles.length > 0 ? (
                                                                  user.roles.map((r) => (
                                                                      <span
                                                                          key={r.role}
                                                                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                                                                              r.role
                                                                          )}`}
                                                                      >
                                                                          {getRoleIcon(r.role)}
                                                                          {r.role}
                                                                      </span>
                                                                  ))
                                                              ) : (
                                                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                                      <Users className="w-3 h-3" />
                                                                      USER
                                                                  </span>
                                                              )}
                                                          </div>
                                                      </td>

                                                      {/* Status Column */}
                                                      <td className="px-6 py-4">
                                                          <span
                                                              className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                                                                  status.color
                                                              )}`}
                                                          >
                                                              {status.label}
                                                          </span>
                                                      </td>

                                                      {/* Registro Column (hidden on mobile) */}
                                                      <td className="px-6 py-4 text-gray-600 hidden lg:table-cell text-xs">
                                                          {new Date(user.createdAt).toLocaleDateString("es-AR")}
                                                      </td>

                                                      {/* Actions Column */}
                                                      <td className="px-6 py-4 text-center">
                                                          <button
                                                              onClick={() => router.push(`/ops/usuarios/${user.id}`)}
                                                              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                          >
                                                              <Eye className="w-4 h-4" />
                                                              <span className="hidden sm:inline">Ver</span>
                                                          </button>
                                                      </td>
                                                  </tr>
                                              );
                                          })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-6">
                                <p className="text-sm text-gray-600">
                                    Página <span className="font-semibold">{page}</span> de{" "}
                                    <span className="font-semibold">{totalPages}</span>
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage(Math.max(1, page - 1))}
                                        disabled={page === 1}
                                        className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        Anterior
                                    </button>
                                    <button
                                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                                        disabled={page === totalPages}
                                        className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Siguiente
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : loading ? null : (
                    <EmptyState />
                )}
            </div>
        </div>
    );
}
