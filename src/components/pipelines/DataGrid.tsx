"use client";

import { useState, useRef, useEffect, ReactNode, useMemo } from "react";
import NeoInput from "@/components/ui/NeoInput";
import NeoButton from "@/components/ui/NeoButton";
import { Check, X, Loader2, ArrowUpDown, ArrowUp, ArrowDown, Filter, Settings2, Trash2 } from "lucide-react";

export interface ColumnDef<T> {
  id: string;
  header: string;
  accessorKey?: keyof T | string;
  cell?: (props: { row: T; value: any; onUpdate: (key: keyof T, val: any) => void }) => ReactNode;
  editable?: boolean;
  type?: "text" | "select" | "number" | "date";
  options?: { label: string; value: string }[];
  width?: string;
}

interface MassAction {
  label: string;
  icon?: ReactNode;
  onClick: (selectedIds: string[]) => void;
  variant?: "filled" | "tonal" | "outlined" | "text" | "danger" | "primary" | "secondary" | "ghost";
}

interface DataGridProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  onEdit?: (id: string, key: keyof T, value: any) => Promise<void>;
  rowKey: keyof T;
  massActions?: MassAction[];
}

export default function DataGrid<T extends Record<string, any>>({
  data,
  columns,
  onEdit,
  rowKey,
  massActions,
}: DataGridProps<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(columns.map(c => c.id)));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(processedData.map((row) => String(row[rowKey]))));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) newSelected.add(id);
    else newSelected.delete(id);
    setSelectedIds(newSelected);
  };

  const handleSort = (columnId: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === columnId && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key: columnId, direction });
  };

  const processedData = useMemo(() => {
    let result = [...data];

    const activeFilterKeys = Object.keys(filters).filter(k => filters[k].trim() !== "");
    if (activeFilterKeys.length > 0) {
      result = result.filter(row => {
        return activeFilterKeys.every(key => {
          const col = columns.find(c => c.id === key);
          let cellValue = col?.accessorKey ? row[col.accessorKey as keyof T] : null;

          if (!cellValue && typeof row[key.split('.')[0] as keyof T] === 'object') {
            const parts = key.split('.');
            let val: any = row;
            for (const p of parts) { if (val) val = val[p]; }
            cellValue = val;
          }

          if (cellValue === null || cellValue === undefined) return false;
          const searchStr = filters[key].toLowerCase();
          const valStr = String(cellValue).toLowerCase();

          if (searchStr.startsWith(">")) {
            const num = parseFloat(searchStr.slice(1));
            return !isNaN(num) && parseFloat(valStr) > num;
          }
          if (searchStr.startsWith("<")) {
            const num = parseFloat(searchStr.slice(1));
            return !isNaN(num) && parseFloat(valStr) < num;
          }
          if (searchStr.startsWith("=")) {
            return valStr === searchStr.slice(1).trim();
          }
          return valStr.includes(searchStr);
        });
      });
    }

    if (sortConfig !== null) {
      result.sort((a, b) => {
        const col = columns.find(c => c.id === sortConfig.key);
        const aVal = col?.accessorKey ? a[col.accessorKey as keyof T] : null;
        const bVal = col?.accessorKey ? b[col.accessorKey as keyof T] : null;

        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          const comparison = aVal.localeCompare(bVal);
          return sortConfig.direction === "asc" ? comparison : -comparison;
        }

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, columns, sortConfig, filters]);

  const activeColumns = columns.filter(c => visibleColumns.has(c.id));
  const allSelected = processedData.length > 0 && selectedIds.size === processedData.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < processedData.length;

  return (
    <div className="w-full relative pb-16 space-y-3">
      {/* Toolbar - Floating Pill */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-surface-container px-6 py-3 rounded-full md-elevation-1 border-none mb-6">
        <div className="flex items-center gap-2">
          <NeoButton
            variant={showFilters ? "tonal" : "outlined"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter size={16} /> Filters {Object.values(filters).filter(v => v).length > 0 && `(${Object.values(filters).filter(v => v).length})`}
          </NeoButton>

          {Object.values(filters).filter(v => v).length > 0 && (
            <NeoButton variant="text" size="sm" onClick={() => setFilters({})} className="flex items-center gap-1">
              <Trash2 size={14} /> Clear
            </NeoButton>
          )}
        </div>

        <div className="relative">
          <NeoButton
            variant="outlined"
            size="sm"
            onClick={() => setShowColumnSettings(!showColumnSettings)}
            className="flex items-center gap-2"
          >
            <Settings2 size={16} /> Columns
          </NeoButton>

          {showColumnSettings && (
            <div className="absolute right-0 top-full mt-2 w-60 bg-surface-container rounded-xl shadow-[var(--shadow-elevation-3)] border border-outline-variant p-4 z-50 animate-scale-in">
              <h4 className="md-title-small text-on-surface mb-3">Visible Columns</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {columns.map(col => (
                  <label key={col.id} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={visibleColumns.has(col.id)}
                      onChange={(e) => {
                        const next = new Set(visibleColumns);
                        if (e.target.checked) next.add(col.id);
                        else next.delete(col.id);
                        if (next.size > 0) setVisibleColumns(next);
                      }}
                      className="w-4 h-4 rounded border-outline bg-surface accent-primary cursor-pointer"
                    />
                    <span className="md-body-medium text-on-surface group-hover:text-primary transition-colors">{col.header}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* M3 Compact Data Table */}
      <div className="w-full overflow-x-auto bg-surface pb-6 rounded-2xl">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-container-low sticky top-0 z-10">
            <tr>
              {massActions && (
                <th className="px-3 py-2 w-12 text-center border-b border-outline-variant">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = someSelected;
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-[18px] h-[18px] rounded border-outline bg-surface accent-primary cursor-pointer"
                    />
                  </div>
                </th>
              )}
              {activeColumns.map((col) => (
                <th
                  key={col.id}
                  className="px-4 py-3 border-none group cursor-pointer hover:bg-on-surface/5 transition-colors select-none"
                  style={{ width: col.width }}
                  onClick={() => handleSort(col.id)}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="md-title-small text-on-surface-variant font-medium">
                      {col.header}
                    </span>
                    <span className="text-on-surface-variant">
                      {sortConfig?.key === col.id ? (
                        sortConfig.direction === "asc" ? <ArrowUp size={14} className="text-primary" /> : <ArrowDown size={14} className="text-primary" />
                      ) : (
                        <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-60 transition-opacity" />
                      )}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
            {/* Filter Row */}
            {showFilters && (
              <tr className="bg-surface-container">
                {massActions && <th className="border-b border-outline-variant px-3 py-1.5"></th>}
                {activeColumns.map(col => (
                  <th key={`filter-${col.id}`} className="border-b border-outline-variant px-2 py-1.5">
                    <input
                      type="text"
                      placeholder={`Filter...`}
                      value={filters[col.id] || ""}
                      onChange={(e) => setFilters(prev => ({ ...prev, [col.id]: e.target.value }))}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-surface border border-outline rounded-lg px-2.5 py-1 text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                    />
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {processedData.length === 0 ? (
              <tr>
                <td colSpan={activeColumns.length + (massActions ? 1 : 0)} className="p-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-14 h-14 rounded-2xl bg-surface-container-highest flex items-center justify-center text-2xl mb-1">📭</div>
                    <span className="md-body-medium text-on-surface-variant">No records found matching your criteria</span>
                  </div>
                </td>
              </tr>
            ) : (
              processedData.map((row) => {
                const id = String(row[rowKey]);
                const isSelected = selectedIds.has(id);
                return (
                  <tr
                    key={id}
                    className={`group border-none transition-colors duration-150 ${
                      isSelected ? "bg-primary/8" : "hover:bg-surface-container-low"
                    }`}
                  >
                    {massActions && (
                      <td className="px-3 py-1.5">
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleSelectRow(id, e.target.checked)}
                            className="w-[18px] h-[18px] rounded border-outline bg-surface accent-primary cursor-pointer"
                          />
                        </div>
                      </td>
                    )}
                    {activeColumns.map((col) => (
                      <td key={col.id} className="px-3 py-1.5 align-middle">
                        <EditableCell
                          row={row}
                          column={col}
                          rowKey={rowKey}
                          onEdit={onEdit}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Floating Action Bar */}
      {selectedIds.size > 0 && massActions && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up-fade flex items-center gap-3 px-5 py-2.5 rounded-full bg-surface-container-high shadow-[var(--shadow-elevation-3)] border border-outline-variant">
          <div className="flex items-center gap-2 pr-3 border-r border-outline-variant">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-on-primary text-[10px] font-bold">
              {selectedIds.size}
            </span>
            <span className="md-label-large text-on-surface">Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            {massActions.map((action, i) => (
              <button
                key={i}
                onClick={() => {
                  action.onClick(Array.from(selectedIds));
                  setSelectedIds(new Set());
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full md-label-large transition-colors ${
                  action.variant === 'danger'
                    ? 'text-error hover:bg-error-container hover:text-on-error-container'
                    : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
                }`}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
            <button
              onClick={() => setSelectedIds(new Set())}
              className="ml-1 p-2 rounded-full hover:bg-surface-container-highest text-on-surface-variant transition-colors"
              title="Clear selection"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function EditableCell<T extends Record<string, any>>({
  row,
  column,
  rowKey,
  onEdit,
}: {
  row: T;
  column: ColumnDef<T>;
  rowKey: keyof T;
  onEdit?: (id: string, key: keyof T, value: any) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const rawValue = column.accessorKey ? row[column.accessorKey as keyof T] : null;
  const [value, setValue] = useState(rawValue || "");
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  useEffect(() => {
    if (!isEditing && column.accessorKey) {
      setValue(row[column.accessorKey as keyof T] || "");
    }
  }, [row, column.accessorKey, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (value !== rawValue && column.accessorKey && onEdit) {
      setIsSaving(true);
      try {
        await onEdit(String(row[rowKey]), column.accessorKey as keyof T, value);
      } catch (err) {
        setValue(rawValue as any);
      } finally {
        setIsSaving(false);
        setIsEditing(false);
      }
    } else {
      setIsEditing(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    else if (e.key === "Escape") {
      setValue((rawValue as any) ?? "");
      setIsEditing(false);
    }
  };

  if (column.cell && !isEditing) {
    return (
      <div
        className={`${column.editable && onEdit && !isSaving ? "cursor-text hover:bg-on-surface/5 px-1.5 py-0.5 -mx-1.5 rounded-lg transition-colors" : ""}`}
        onClick={() => {
          if (column.editable && onEdit && !isSaving) setIsEditing(true);
        }}
      >
        {isSaving ? (
          <div className="flex items-center gap-1.5 text-primary md-label-medium">
            <Loader2 size={14} className="animate-spin" /> Saving...
          </div>
        ) : (
          column.cell({
            row,
            value: rawValue,
            onUpdate: async (key, val) => {
              if (!onEdit) return;
              setIsSaving(true);
              try {
                await onEdit(String(row[rowKey]), key, val);
              } finally {
                setIsSaving(false);
              }
            }
          })
        )}
      </div>
    );
  }

  if (!column.editable || !column.accessorKey || !onEdit) {
    return (
      <span className="md-body-medium text-on-surface">
        {rawValue?.toString() || "—"}
      </span>
    );
  }

  if (isEditing) {
    if (column.type === "select" && column.options) {
      return (
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={(value as string) || ""}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={onKeyDown}
          className="w-full px-2.5 py-1 rounded-lg bg-surface border border-primary text-on-surface md-body-medium focus:outline-none focus:ring-2 focus:ring-primary/20 animate-fade-in"
        >
          <option value="" disabled>Select...</option>
          {column.options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-surface">
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type={column.type || "text"}
        value={(value as string) || ""}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={onKeyDown}
        className="w-full px-2.5 py-1 rounded-lg bg-surface border border-primary text-on-surface md-body-medium focus:outline-none focus:ring-2 focus:ring-primary/20 animate-fade-in"
      />
    );
  }

  return (
    <div
      className="cursor-text hover:bg-on-surface/5 px-1.5 py-0.5 -mx-1.5 rounded-lg transition-colors flex items-center min-h-[28px] group/cell"
      onClick={() => { if (!isSaving) setIsEditing(true); }}
    >
      {isSaving ? (
        <div className="flex items-center gap-1.5 text-primary md-label-medium">
          <Loader2 size={14} className="animate-spin" /> Saving...
        </div>
      ) : (
        <span className="md-body-medium text-on-surface group-hover/cell:text-primary transition-colors">
          {rawValue?.toString() || (
            <span className="text-on-surface-variant/50 italic font-normal">Empty</span>
          )}
        </span>
      )}
    </div>
  );
}
