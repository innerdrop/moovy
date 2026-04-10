"use client";

// Gestión de categorías del Home — independiente de la clasificación de productos y paquetes B2B
import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  GripVertical,
  Home,
  Loader2,
  Eye,
  EyeOff,
  Tag,
  ChevronDown,
} from "lucide-react";
import { getCategoryIcon } from "@/lib/icons";
import { toast } from "@/store/toast";
import ImageUpload from "@/components/ui/ImageUpload";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface CategoryBase {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  icon: string | null;
  scope: string;
  isActive: boolean;
}

interface HomeSlot {
  id: string;
  categoryId: string;
  order: number;
  image: string | null;
  icon: string | null;
  label: string | null;
  isActive: boolean;
  category: CategoryBase;
}

// ─── Sortable Slot Item ─────────────────────────────────────────────────────

function SortableSlotItem({
  slot,
  onToggle,
  onRemove,
}: {
  slot: HomeSlot;
  onToggle: (slot: HomeSlot) => void;
  onRemove: (slot: HomeSlot) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: slot.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    position: isDragging ? ("relative" as const) : ("static" as const),
  };

  const displayName = slot.label || slot.category.name;
  const displayImage = slot.image || slot.category.image;
  const displayIcon = slot.icon || slot.category.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex items-center gap-3 ${
        isDragging ? "shadow-2xl scale-[1.02] ring-2 ring-moovy z-50" : "hover:shadow-md"
      } ${!slot.isActive ? "opacity-50" : ""}`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="text-slate-300 cursor-grab active:cursor-grabbing hover:text-moovy p-1.5 -m-1 rounded-lg hover:bg-slate-50 transition-colors"
        style={{ touchAction: "none" }}
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Image/Icon */}
      <div className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden bg-slate-100 flex items-center justify-center">
        {displayImage ? (
          <img src={displayImage} alt={displayName} className="w-full h-full object-cover" />
        ) : displayIcon ? (
          <div className="w-5 h-5 text-moovy">{getCategoryIcon(displayIcon)}</div>
        ) : (
          <Tag className="w-5 h-5 text-slate-300" />
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
        <p className="text-[10px] text-slate-400">
          {slot.label ? `(Categoría: ${slot.category.name})` : slot.category.scope}
        </p>
      </div>

      {/* Actions */}
      <button
        onClick={() => onToggle(slot)}
        className={`p-1.5 rounded-lg transition-colors ${
          slot.isActive
            ? "text-green-600 bg-green-50 hover:bg-green-100"
            : "text-slate-400 bg-slate-50 hover:bg-slate-100"
        }`}
        title={slot.isActive ? "Ocultar del home" : "Mostrar en home"}
      >
        {slot.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      </button>
      <button
        onClick={() => onRemove(slot)}
        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        title="Quitar del home"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function HomeCategorySlotsManager() {
  const [slots, setSlots] = useState<HomeSlot[]>([]);
  const [allCategories, setAllCategories] = useState<CategoryBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPicker, setShowAddPicker] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Load slots and all categories
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [slotsRes, catsRes] = await Promise.all([
        fetch("/api/admin/home-categories"),
        fetch("/api/admin/categories"),
      ]);

      if (slotsRes.ok) {
        const slotsData = await slotsRes.json();
        setSlots(slotsData);
      }

      if (catsRes.ok) {
        const catsData = await catsRes.json();
        // Flatten: only root categories that are active
        setAllCategories(
          catsData
            .filter((c: any) => c.isActive)
            .map((c: any) => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
              image: c.image,
              icon: c.icon,
              scope: c.scope,
              isActive: c.isActive,
            }))
        );
      }
    } catch (error) {
      console.error("Error loading home category data:", error);
    } finally {
      setLoading(false);
    }
  }

  // Categories not yet in a slot
  const availableCategories = allCategories.filter(
    (cat) => !slots.some((s) => s.categoryId === cat.id)
  );

  // Add category to home
  async function addSlot(categoryId: string) {
    try {
      const res = await fetch("/api/admin/home-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId }),
      });

      if (res.ok) {
        const newSlot = await res.json();
        setSlots((prev) => [...prev, newSlot]);
        setShowAddPicker(false);
        toast.success("Categoría agregada al home");
      } else {
        const data = await res.json();
        toast.error(data.error || "Error al agregar");
      }
    } catch {
      toast.error("Error de conexión");
    }
  }

  // Remove slot
  async function removeSlot(slot: HomeSlot) {
    try {
      const res = await fetch(`/api/admin/home-categories?id=${slot.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSlots((prev) => prev.filter((s) => s.id !== slot.id));
        toast.success("Categoría quitada del home");
      }
    } catch {
      toast.error("Error de conexión");
    }
  }

  // Toggle visibility
  async function toggleSlot(slot: HomeSlot) {
    try {
      const res = await fetch("/api/admin/home-categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: slot.id, isActive: !slot.isActive }),
      });

      if (res.ok) {
        setSlots((prev) =>
          prev.map((s) => (s.id === slot.id ? { ...s, isActive: !s.isActive } : s))
        );
      }
    } catch {
      toast.error("Error de conexión");
    }
  }

  // Reorder
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = slots.findIndex((s) => s.id === active.id);
      const newIndex = slots.findIndex((s) => s.id === over.id);
      const newSlots = arrayMove(slots, oldIndex, newIndex);
      setSlots(newSlots);

      // Save new order
      try {
        await fetch("/api/admin/home-categories", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slotIds: newSlots.map((s) => s.id) }),
        });
      } catch {
        toast.error("Error al reordenar");
      }
    },
    [slots]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-moovy" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Home className="w-5 h-5 text-moovy" />
          <h2 className="text-lg font-bold text-gray-900">Categorías del Home</h2>
        </div>
        <button
          onClick={() => setShowAddPicker(!showAddPicker)}
          disabled={availableCategories.length === 0}
          className="flex items-center gap-1.5 text-sm font-bold text-moovy hover:text-moovy/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-4 h-4" />
          Agregar
        </button>
      </div>

      <p className="text-xs text-slate-400">
        Elegí qué categorías se muestran en la página de inicio y en qué orden. Esto es
        independiente de los paquetes B2B y de la clasificación de productos.
      </p>

      {/* Add picker dropdown */}
      {showAddPicker && availableCategories.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-3 space-y-1 max-h-60 overflow-y-auto">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
            Categorías disponibles
          </p>
          {availableCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => addSlot(cat.id)}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0">
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                ) : cat.icon ? (
                  <div className="w-4 h-4 text-slate-500">{getCategoryIcon(cat.icon)}</div>
                ) : (
                  <Tag className="w-4 h-4 text-slate-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{cat.name}</p>
                <p className="text-[10px] text-slate-400">{cat.scope}</p>
              </div>
              <Plus className="w-4 h-4 text-moovy flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Slots list */}
      {slots.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Home className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-500">No hay categorías en el home</p>
          <p className="text-xs text-slate-400 mt-1">
            Agregá categorías para que aparezcan en la página de inicio
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={slots.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-2">
              {slots.map((slot) => (
                <SortableSlotItem
                  key={slot.id}
                  slot={slot}
                  onToggle={toggleSlot}
                  onRemove={removeSlot}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}