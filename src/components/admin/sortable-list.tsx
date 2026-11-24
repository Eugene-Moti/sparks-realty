"use client";

import { closestCenter, DndContext, type DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DotsSixVerticalIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { cn } from "@/helpers/classname-helper";
import type { ActionResult } from "@/lib/admin/auth";

/**
 * Vertical drag-to-reorder list (mouse, touch and keyboard: focus the handle,
 * Space to lift, arrows to move, Space to drop). Saves via `onReorder`.
 */
export function SortableList<T extends { id: string }>({
  items,
  setItems,
  onReorder,
  renderItem,
  label,
}: {
  items: T[];
  setItems: (items: T[]) => void;
  onReorder: (ids: string[]) => Promise<ActionResult>;
  renderItem: (item: T, index: number) => ReactNode;
  label: string;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const before = items;
    const next = arrayMove(items, items.findIndex((i) => i.id === active.id), items.findIndex((i) => i.id === over.id));
    setItems(next);
    const result = await onReorder(next.map((i) => i.id));
    if (!result.ok) {
      toast.error(result.error);
      setItems(before);
    } else toast.success("Order saved.");
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <ul aria-label={label} className="flex flex-col gap-2.5">
          {items.map((item, i) => (
            <SortableRow key={item.id} id={item.id} position={i + 1}>
              {renderItem(item, i)}
            </SortableRow>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({ id, position, children }: { id: string; position: number; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-hairline bg-surface p-3 shadow-soft",
        isDragging && "relative z-10 shadow-lift ring-2 ring-gold-600",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Drag to reorder (position ${position})`}
        className="grid size-9 shrink-0 cursor-grab place-items-center rounded-xl text-muted hover:bg-foreground/6 active:cursor-grabbing"
      >
        <DotsSixVerticalIcon weight="bold" className="size-5" />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </li>
  );
}
