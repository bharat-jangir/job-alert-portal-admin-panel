'use client';

import { ReactNode, useId, useRef } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

/**
 * Drop where the pointer is, not where the dragged card's centre is: blocks are tall (a table can be
 * 500px) and you grab them by a handle in the corner, so the card's centre is far from the cursor.
 * Falls back to the nearest row when the pointer is in a gap between rows (or when using the keyboard).
 */
const collision: CollisionDetection = (args) => {
  if (args.pointerCoordinates) {
    const hit = pointerWithin(args);
    if (hit.length) return hit;
  }
  return closestCenter(args);
};

/** What a row gets to render: the drag handle plus helpers that keep the row ids in sync. */
export interface ItemCtx {
  id: string;
  index: number;
  count: number;
  isDragging: boolean;
  handle: ReactNode;
  remove: () => void;
  move: (dir: -1 | 1) => void;
}

function Row<T>({
  id, item, index, count, remove, move, children,
}: {
  id: string; item: T; index: number; count: number; remove: () => void; move: (d: -1 | 1) => void;
  children: (item: T, ctx: ItemCtx) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  const handle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label="Drag to reorder (or focus and press Space, then use the arrow keys)"
      title="Drag to reorder"
      data-drag-handle
      className="flex h-8 w-6 cursor-grab touch-none items-center justify-center rounded text-gray-400 hover:bg-gray-200 hover:text-gray-700 active:cursor-grabbing focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
    >
      <GripVertical className="h-4 w-4" />
    </button>
  );
  return (
    <div
      ref={setNodeRef}
      data-sortable-id={id}
      style={{ transform: CSS.Transform.toString(transform), transition, position: 'relative', zIndex: isDragging ? 30 : undefined }}
      className={isDragging ? 'rounded-lg opacity-80 shadow-xl ring-2 ring-blue-400' : undefined}
    >
      {children(item, { id, index, count, isDragging, handle, remove, move })}
    </div>
  );
}

/**
 * A vertical list whose rows can be reordered by dragging a handle (mouse, touch or keyboard).
 * Items have no ids of their own, so stable ids are kept alongside (and in step with) the array.
 * Use ctx.remove / ctx.move instead of editing the array yourself so the ids stay aligned; adding
 * to the end or replacing the whole array through onChange is fine.
 */
export function SortableList<T>({
  items, onChange, children,
}: {
  items: T[];
  onChange: (next: T[]) => void;
  children: (item: T, ctx: ItemCtx) => ReactNode;
}) {
  const contextId = useId(); // deterministic across server/client render: avoids dnd-kit hydration warnings
  const idsRef = useRef<string[]>([]);
  const counter = useRef(0);
  if (idsRef.current.length < items.length) {
    while (idsRef.current.length < items.length) idsRef.current.push(`row-${++counter.current}`);
  } else if (idsRef.current.length > items.length) {
    idsRef.current.length = items.length;
  }
  const ids = idsRef.current;

  // 6px of movement before a drag starts, so a plain click on the handle (or text selection) is not a drag
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const reorder = (from: number, to: number) => {
    if (from < 0 || to < 0 || from === to || to >= items.length) return;
    idsRef.current = arrayMove(ids, from, to);
    onChange(arrayMove(items, from, to));
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    reorder(ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
  };

  return (
    <DndContext id={contextId} sensors={sensors} collisionDetection={collision} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {items.map((item, i) => (
          <Row
            key={ids[i]}
            id={ids[i]}
            item={item}
            index={i}
            count={items.length}
            remove={() => { ids.splice(i, 1); onChange(items.filter((_, k) => k !== i)); }}
            move={(dir) => reorder(i, i + dir)}
          >
            {children}
          </Row>
        ))}
      </SortableContext>
    </DndContext>
  );
}
