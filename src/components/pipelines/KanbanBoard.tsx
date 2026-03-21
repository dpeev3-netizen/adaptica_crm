"use client";

import { useState, useMemo } from "react";
import NeoCard from "@/components/ui/NeoCard";
import NeoInput from "@/components/ui/NeoInput";
import NeoButton from "@/components/ui/NeoButton";
import { Filter, Search, MoreHorizontal, CheckSquare, Phone, Mail } from "lucide-react";

interface KanbanBoardProps<T> {
  data: T[];
  columns: { id: string; title: string; accessorValue: string; wipLimit?: number | null; slaDays?: number | null }[];
  groupByKey: keyof T;
  renderCard: (item: T) => React.ReactNode;
  onMove?: (itemId: string, newColumnId: string) => Promise<void>;
  itemIdKey: keyof T;
  valueKey?: keyof T; // e.g. "value" for Deals to aggregate
  searchKeys?: (keyof T | string)[]; // array of keys to search within
}

export default function KanbanBoard<T extends Record<string, any>>({
  data,
  columns,
  groupByKey,
  renderCard,
  onMove,
  itemIdKey,
  valueKey,
  searchKeys,
}: KanbanBoardProps<T>) {
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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
      const item = data.find((i) => String(i[itemIdKey]) === String(draggedItemId));
      if (item && item[groupByKey] !== newColumnId) {
        await onMove(draggedItemId, newColumnId);
      }
    }
    setDraggedItemId(null);
  };

  const processedData = useMemo(() => {
    if (!searchQuery || !searchKeys || searchKeys.length === 0) return data;
    const lowerQuery = searchQuery.toLowerCase();
    
    return data.filter(item => {
       return searchKeys.some(key => {
          // crude nested lookup support e.g. "company.name"
          let val: any = item;
          if (typeof key === 'string' && key.includes('.')) {
             for(const p of key.split('.')) {
               if (val) val = val[p];
             }
          } else {
             val = item[key as keyof T];
          }
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(lowerQuery);
       });
    });
  }, [data, searchQuery, searchKeys]);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Kanban Toolbar - Floating Pill */}
      {searchKeys && searchKeys.length > 0 && (
        <div className="flex items-center justify-between gap-4 bg-surface-container px-6 py-3 rounded-full border-none md-elevation-1 mb-2 shrink-0 max-w-2xl">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-on-surface-variant">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Search board..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2 bg-transparent text-sm font-medium text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none transition-all"
            />
          </div>
          <div className="text-xs font-bold text-on-surface-variant bg-surface px-4 py-1.5 rounded-full border-none">
            {processedData.length} records
          </div>
        </div>
      )}

      {/* Board Scroll Area */}
      <div className="flex gap-6 overflow-x-auto pb-4 h-full min-h-[500px]">
        {columns.map((col) => {
          const columnItems = processedData.filter((item) => item[groupByKey] === col.accessorValue);
          
          let totalValue = 0;
          if (valueKey) {
            totalValue = columnItems.reduce((sum, item) => sum + (Number(item[valueKey]) || 0), 0);
          }

          return (
            <div
              key={col.id}
              className="flex-shrink-0 w-[340px] flex flex-col gap-4 bg-surface-container-lowest rounded-3xl p-4 transition-all duration-300 border-none"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.accessorValue)}
              style={{
                 boxShadow: draggedItemId ? "inset 0 0 32px var(--color-primary-container)" : undefined,
                 backgroundColor: draggedItemId ? "var(--color-surface-container-high)" : undefined
              }}
            >
              {/* Column Header */}
              <div className="flex flex-col gap-2 mb-2 px-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-on-surface uppercase tracking-widest text-[11px] flex items-center gap-2">
                    {col.title}
                    {col.wipLimit && columnItems.length >= col.wipLimit && (
                      <span className="text-[10px] bg-error-container text-on-error-container font-bold px-2 py-0.5 rounded-lg uppercase">Limit</span>
                    )}
                  </h3>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                    col.wipLimit && columnItems.length > col.wipLimit 
                      ? "text-on-primary-container bg-primary-container border-primary" 
                      : "text-on-surface-variant bg-surface-container-highest border-outline-variant"
                  }`}>
                    {col.wipLimit ? `${columnItems.length} / ${col.wipLimit}` : columnItems.length}
                  </span>
                </div>
                {/* Column Aggregation (e.g. Total Deal Value) */}
                {valueKey && (
                  <div className="text-xs font-black text-primary tracking-wide">
                    {totalValue > 0 ? `$${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—"}
                  </div>
                )}
              </div>

              {/* Column Items */}
              <div className="flex flex-col gap-4 flex-1 overflow-y-auto pr-1 pb-1">
                {columnItems.map((item) => (
                  <div
                    key={item[itemIdKey as string]}
                    draggable={!!onMove}
                    onDragStart={(e) => handleDragStart(e, item[itemIdKey as string])}
                    className={onMove ? "cursor-grab active:cursor-grabbing" : ""}
                  >
                    <NeoCard variant="elevated" className="p-5 hover:-translate-y-1 transition-all duration-300 group rounded-2xl relative overflow-hidden bg-surface">
                      {/* Decorative gradient strip */}
                      <div className="absolute top-0 left-0 w-1 h-full bg-primary-container group-hover:bg-primary transition-colors"></div>
                      {renderCard(item)}
                    </NeoCard>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
