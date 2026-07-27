"use client";

// Vitrinas del Home — feat/home-categorias-independientes (2026-07-26).
//
// Antes este panel te obligaba a ELEGIR entre las Category del sistema (las
// mismas que clasifican productos y arman los paquetes B2B): si una categoría
// no existía ahí, no se podía mostrar en el home, y las que ya estaban usadas
// desaparecían del selector. Decisión founder: la vitrina del home es LIBRE.
//
// Ahora cada vitrina tiene nombre e imagen propios y vos elegís su DESTINO:
//   · Categoría → filtra los productos/comercios de una categoría real
//   · Búsqueda  → ejecuta una búsqueda con el término que escribas
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
  Pencil,
  Search,
  FolderTree,
} from "lucide-react";
import { getCategoryIcon } from "@/lib/icons";
import { toast } from "@/store/toast";
import ImageUpload from "@/components/ui/ImageUpload";
import { confirm as confirmModal } from "@/store/confirm";
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
  categoryId: string | null;
  linkType: "CATEGORY" | "SEARCH";
  linkValue: string | null;
  order: number;
  image: string | null;
  icon: string | null;
  label: string | null;
  isActive: boolean;
  category: CategoryBase | null;
}

/** Texto humano del destino, para que el operador sepa qué pasa al tocarla. */
function destinoLabel(slot: HomeSlot): { icon: "cat" | "search"; text: string } {
  if (slot.linkType === "SEARCH" || !slot.category) {
    return { icon: "search", text: `Busca "${slot.linkValue || slot.label || ""}"` };
  }
  return { icon: "cat", text: `Lleva a ${slot.category.name}` };
}

// ─── Item ordenable ─────────────────────────────────────────────────────────

function SortableSlotItem({
  slot,
  onToggle,
  onRemove,
  onEdit,
}: {
  slot: HomeSlot;
  onToggle: (slot: HomeSlot) => void;
  onRemove: (slot: HomeSlot) => void;
  onEdit: (slot: HomeSlot) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: slot.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    position: isDragging ? ("relative" as const) : ("static" as const),
  };

  const displayName = slot.label || slot.category?.name || "Sin nombre";
  const displayImage = slot.image || slot.category?.image || null;
  const displayIcon = slot.icon || slot.category?.icon || null;
  const destino = destinoLabel(slot);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex items-center gap-3 ${
        isDragging ? "shadow-2xl scale-[1.02] ring-2 ring-moovy z-50" : "hover:shadow-md"
      } ${!slot.isActive ? "opacity-50" : ""}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="text-slate-300 cursor-grab active:cursor-grabbing hover:text-moovy p-1.5 -m-1 rounded-lg hover:bg-slate-50 transition-colors"
        style={{ touchAction: "none" }}
      >
        <GripVertical className="w-4 h-4" />
      </div>

      <div className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden bg-slate-100 flex items-center justify-center">
        {displayImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displayImage} alt={displayName} className="w-full h-full object-cover" />
        ) : displayIcon ? (
          <div className="w-5 h-5 text-moovy">{getCategoryIcon(displayIcon)}</div>
        ) : (
          <Tag className="w-5 h-5 text-slate-300" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
        <p className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
          {destino.icon === "search" ? (
            <Search className="w-3 h-3 flex-shrink-0" />
          ) : (
            <FolderTree className="w-3 h-3 flex-shrink-0" />
          )}
          {destino.text}
        </p>
      </div>

      <button
        onClick={() => onEdit(slot)}
        className="p-1.5 text-slate-400 hover:text-moovy hover:bg-slate-50 rounded-lg transition-colors"
        title="Editar vitrina"
      >
        <Pencil className="w-4 h-4" />
      </button>
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

// ─── Panel principal ────────────────────────────────────────────────────────

type EditorState = {
  id: string | null; // null = vitrina nueva
  label: string;
  image: string;
  linkType: "CATEGORY" | "SEARCH";
  categoryId: string;
  linkValue: string;
};

const EMPTY_EDITOR: EditorState = {
  id: null,
  label: "",
  image: "",
  linkType: "CATEGORY",
  categoryId: "",
  linkValue: "",
};

export default function HomeCategorySlotsManager() {
  const [slots, setSlots] = useState<HomeSlot[]>([]);
  const [allCategories, setAllCategories] = useState<CategoryBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [slotsRes, catsRes] = await Promise.all([
        fetch("/api/admin/home-categories"),
        fetch("/api/admin/categories"),
      ]);

      if (slotsRes.ok) setSlots(await slotsRes.json());

      if (catsRes.ok) {
        const catsData = await catsRes.json();
        // TODAS las categorías activas: ya no se descartan las que "ya están
        // usadas" — dos vitrinas pueden apuntar a la misma categoría.
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

  function openNew() {
    setEditor({ ...EMPTY_EDITOR });
  }

  function openEdit(slot: HomeSlot) {
    setEditor({
      id: slot.id,
      label: slot.label || slot.category?.name || "",
      image: slot.image || "",
      linkType: slot.linkType === "SEARCH" || !slot.category ? "SEARCH" : "CATEGORY",
      categoryId: slot.categoryId || "",
      linkValue: slot.linkValue || "",
    });
  }

  async function saveEditor() {
    if (!editor) return;
    const label = editor.label.trim();
    if (label.length < 2) {
      toast.error("Ponele un nombre a la vitrina");
      return;
    }
    if (editor.linkType === "CATEGORY" && !editor.categoryId) {
      toast.error("Elegí a qué categoría lleva");
      return;
    }
    if (editor.linkType === "SEARCH" && editor.linkValue.trim().length < 2) {
      toast.error("Escribí qué se busca al tocarla");
      return;
    }

    setSaving(true);
    const payload = {
      label,
      image: editor.image || null,
      linkType: editor.linkType,
      categoryId: editor.linkType === "CATEGORY" ? editor.categoryId : null,
      linkValue: editor.linkType === "SEARCH" ? editor.linkValue.trim() : null,
    };

    try {
      const res = await fetch("/api/admin/home-categories", {
        method: editor.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editor.id ? { id: editor.id, ...payload } : payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al guardar");
        return;
      }
      setSlots((prev) =>
        editor.id ? prev.map((s) => (s.id === editor.id ? data : s)) : [...prev, data]
      );
      setEditor(null);
      toast.success(editor.id ? "Vitrina actualizada" : "Vitrina agregada al home");
    } catch {
      toast.error("Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  async function removeSlot(slot: HomeSlot) {
    const ok = await confirmModal({
      title: "¿Quitar del home?",
      message: `"${slot.label || slot.category?.name}" deja de mostrarse en la página de inicio. La categoría del sistema NO se toca.`,
      confirmLabel: "Quitar",
      variant: "danger",
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/admin/home-categories?id=${slot.id}`, { method: "DELETE" });
      if (res.ok) {
        setSlots((prev) => prev.filter((s) => s.id !== slot.id));
        toast.success("Vitrina quitada del home");
      }
    } catch {
      toast.error("Error de conexión");
    }
  }

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

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = slots.findIndex((s) => s.id === active.id);
      const newIndex = slots.findIndex((s) => s.id === over.id);
      const newSlots = arrayMove(slots, oldIndex, newIndex);
      setSlots(newSlots);

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Home className="w-5 h-5 text-moovy" />
          <h2 className="text-lg font-bold text-gray-900">Vitrinas del Home</h2>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 text-sm font-bold text-moovy hover:text-moovy/80 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Agregar
        </button>
      </div>

      <p className="text-xs text-slate-400">
        Los accesos que ve el cliente en la página de inicio. Cada uno tiene su nombre e
        imagen, y vos elegís a dónde lleva: a una categoría o a una búsqueda. No tiene
        nada que ver con los paquetes B2B ni con la clasificación de productos.
      </p>

      {slots.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Home className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-500">El home no tiene vitrinas</p>
          <p className="text-xs text-slate-400 mt-1">
            Agregá la primera para que aparezca en la página de inicio
          </p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={slots.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {slots.map((slot) => (
                <SortableSlotItem
                  key={slot.id}
                  slot={slot}
                  onToggle={toggleSlot}
                  onRemove={removeSlot}
                  onEdit={openEdit}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Editor de vitrina */}
      {editor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-gray-900 text-lg mb-4">
              {editor.id ? "Editar vitrina" : "Nueva vitrina del home"}
            </h3>

            <label className="block text-xs font-bold text-slate-500 mb-1.5">
              NOMBRE QUE VE EL CLIENTE
            </label>
            <input
              autoFocus
              value={editor.label}
              onChange={(e) => setEditor({ ...editor, label: e.target.value })}
              maxLength={40}
              placeholder="Ej: Farmacia, Bebidas, Regalos…"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm mb-4 focus:ring-2 focus:ring-moovy focus:border-transparent"
            />

            <label className="block text-xs font-bold text-slate-500 mb-1.5">IMAGEN</label>
            <div className="mb-4">
              <ImageUpload
                value={editor.image}
                onChange={(url) => setEditor({ ...editor, image: url })}
                cropAspect={1}
                cropOutputSize={400}
                compact
              />
            </div>

            <label className="block text-xs font-bold text-slate-500 mb-1.5">
              ¿QUÉ PASA AL TOCARLA?
            </label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                onClick={() => setEditor({ ...editor, linkType: "CATEGORY" })}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition ${
                  editor.linkType === "CATEGORY"
                    ? "bg-gray-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <FolderTree className="w-4 h-4" /> Categoría
              </button>
              <button
                type="button"
                onClick={() => setEditor({ ...editor, linkType: "SEARCH" })}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition ${
                  editor.linkType === "SEARCH"
                    ? "bg-gray-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Search className="w-4 h-4" /> Búsqueda
              </button>
            </div>

            {editor.linkType === "CATEGORY" ? (
              <>
                <select
                  value={editor.categoryId}
                  onChange={(e) => setEditor({ ...editor, categoryId: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-moovy"
                >
                  <option value="">Elegí una categoría…</option>
                  {allCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Muestra los productos de esa categoría.
                </p>
              </>
            ) : (
              <>
                <input
                  value={editor.linkValue}
                  onChange={(e) => setEditor({ ...editor, linkValue: e.target.value })}
                  maxLength={60}
                  placeholder="Ej: gaseosas"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-moovy"
                />
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Busca ese texto entre comercios y productos, como si el cliente lo
                  escribiera en el buscador.
                </p>
              </>
            )}

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setEditor(null)}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition text-sm font-medium"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                onClick={saveEditor}
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-moovy text-white rounded-xl hover:opacity-90 transition text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editor.id ? "Guardar" : "Agregar al home"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
