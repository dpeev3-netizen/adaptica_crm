"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import NeoInput from "@/components/ui/NeoInput";

export interface ColumnDef<T> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  cell?: (props: { row: T; value: any; onUpdate: (key: keyof T, val: any) => void }) => ReactNode;
  editable?: boolean;
  type?: "text" | "select" | "number";
  options?: { label: string; value: string }[];
  width?: string;
}

interface DataGridProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  onEdit: (id: string, key: keyof T, value: any) => Promise<void>;
  rowKey: keyof T;
}

export default function DataGrid<T extends Record<string, any>>({
  data,
  columns,
  onEdit,
  rowKey,
}: DataGridProps<T>) {
  return (
    <div className="w-full overflow-x-auto rounded-2xl shadow-neumorph-flat bg-surface">
      <table className="w-full text-left border-collapse">
        <thead className="bg-surface sticky top-0 z-10">
          <tr>
            {columns.map((col) => (
              <th
                key={col.id}
                className="p-4 font-bold text-sm text-muted uppercase tracking-wider border-b-2 border-background"
                style={{ width: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="p-8 text-center text-muted font-medium">
                No data available
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={row[rowKey as string]}
                className="group border-b border-background/50 last:border-0 hover:bg-background/20 transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.id} className="p-4 align-middle">
                    <EditableCell
                      row={row}
                      column={col}
                      rowKey={rowKey}
                      onEdit={onEdit}
                    />
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
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
  onEdit: (id: string, key: keyof T, value: any) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(
    column.accessorKey ? row[column.accessorKey] : ""
  );
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  const rawValue = column.accessorKey ? row[column.accessorKey] : null;

  useEffect(() => {
    // Keep internal state in sync if external data changes
    if (!isEditing && column.accessorKey) {
      setValue(row[column.accessorKey]);
    }
  }, [row, column.accessorKey, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (value !== rawValue && column.accessorKey) {
      await onEdit(row[rowKey as string], column.accessorKey, value);
    }
    setIsEditing(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setValue((rawValue as any) ?? "");
      setIsEditing(false);
    }
  };

  if (column.cell && !isEditing) {
    // Custom cell renderer but wraps interaction if editable
    return (
      <div 
        className={`${column.editable ? "cursor-text hover:bg-black/5 p-1 -m-1 rounded-md transition-colors" : ""}`}
        onClick={() => {
          if (column.editable) setIsEditing(true);
        }}
      >
        {column.cell({
          row,
          value: rawValue,
          onUpdate: async (key, val) => {
            const id = row[rowKey as string];
            await onEdit(id, key, val);
          }
        })}
      </div>
    );
  }

  if (!column.editable || !column.accessorKey) {
    return (
      <span className="text-foreground font-medium">
        {rawValue?.toString() || "—"}
      </span>
    );
  }

  if (isEditing) {
    if (column.type === "select" && column.options) {
      return (
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={value as string}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={onKeyDown}
          className="w-full px-3 py-1.5 rounded-lg bg-surface shadow-neumorph-concave focus:outline-none focus:ring-1 focus:ring-primary/50 text-foreground font-medium"
        >
          {column.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
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
        value={value as string}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={onKeyDown}
        className="w-full px-3 py-1.5 rounded-lg bg-surface shadow-neumorph-concave focus:outline-none focus:ring-1 focus:ring-primary/50 text-foreground font-medium"
      />
    );
  }

  return (
    <div
      className="cursor-text hover:bg-black/5 p-1 -m-1 rounded-md transition-colors min-h-[28px] flex items-center"
      onClick={() => setIsEditing(true)}
    >
      <span className="text-foreground font-medium line-clamp-1">
        {rawValue?.toString() || (
          <span className="text-muted italic opacity-50">Empty</span>
        )}
      </span>
    </div>
  );
}
