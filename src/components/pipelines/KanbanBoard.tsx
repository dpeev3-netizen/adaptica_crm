"use client";

import { useState } from "react";
import NeoCard from "@/components/ui/NeoCard";

interface KanbanBoardProps<T> {
  data: T[];
  columns: { id: string; title: string; accessorValue: string }[];
  groupByKey: keyof T;
  renderCard: (item: T) => React.ReactNode;
  onMove?: (itemId: string, newColumnId: string) => Promise<void>;
  itemIdKey: keyof T;
}

export default function KanbanBoard<T extends Record<string, any>>({
  data,
  columns,
  groupByKey,
  renderCard,
  onMove,
  itemIdKey,
}: KanbanBoardProps<T>) {
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItemId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, newColumnId: string) => {
    e.preventDefault();
    if (draggedItemId && onMove) {
      // Find item
      const item = data.find((i) => i[itemIdKey] === draggedItemId);
      if (item && item[groupByKey] !== newColumnId) {
        await onMove(draggedItemId, newColumnId);
      }
    }
    setDraggedItemId(null);
  };

  return (
    <div className="flex gap-6 overflow-x-auto pb-4 h-full min-h-[500px]">
      {columns.map((col) => {
        const columnItems = data.filter((item) => item[groupByKey] === col.accessorValue);

        return (
          <div
            key={col.id}
            className="flex-shrink-0 w-80 flex flex-col gap-4 bg-background/50 rounded-2xl p-4 border-2 border-dashed border-transparent transition-colors duration-200"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.accessorValue)}
            style={{
               borderColor: draggedItemId ? "rgba(160, 174, 192, 0.3)" : "transparent"
            }}
          >
            <div className="flex items-center justify-between mb-2 px-2">
              <h3 className="font-bold text-foreground opacity-80 uppercase tracking-wider text-sm">
                {col.title}
              </h3>
              <span className="text-xs font-bold text-muted bg-surface shadow-neumorph-concave px-2 py-1 rounded-md">
                {columnItems.length}
              </span>
            </div>

            <div className="flex flex-col gap-4 flex-1">
              {columnItems.map((item) => (
                <div
                  key={item[itemIdKey as string]}
                  draggable={!!onMove}
                  onDragStart={(e) => handleDragStart(e, item[itemIdKey as string])}
                  className={onMove ? "cursor-grab active:cursor-grabbing" : ""}
                >
                  <NeoCard className="p-4 hover:shadow-neumorph-pressed transition-all duration-200 group">
                    {renderCard(item)}
                  </NeoCard>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
