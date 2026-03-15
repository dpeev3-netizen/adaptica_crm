"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import DataGrid, { ColumnDef } from "@/components/pipelines/DataGrid";
import KanbanBoard from "@/components/pipelines/KanbanBoard";
import NeoSlideOver from "@/components/ui/NeoSlideOver";
import ActivityFeed from "@/components/activity/ActivityFeed";
import NeoButton from "@/components/ui/NeoButton";
import { History } from "lucide-react";

export default function DealsPage() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<"grid" | "board">("board");
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [selectedDealName, setSelectedDealName] = useState<string>("");

  const { data: pipelines, isLoading: isLoadingPipelines } = useQuery({
    queryKey: ["pipelines"],
    queryFn: async () => {
      const res = await fetch("/api/pipelines");
      if (!res.ok) throw new Error("Failed to fetch pipelines");
      return res.json();
    },
  });

  const { data: deals, isLoading: isLoadingDeals } = useQuery({
    queryKey: ["deals"],
    queryFn: async () => {
      const res = await fetch("/api/deals");
      if (!res.ok) throw new Error("Failed to fetch deals");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, key, value }: { id: string; key: string; value: any }) => {
      const res = await fetch(`/api/deals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
  });

  const handleEdit = async (id: string, key: any, value: any) => {
    await updateMutation.mutateAsync({ id, key, value });
  };

  const handleMove = async (itemId: string, newStageId: string) => {
    await updateMutation.mutateAsync({ id: itemId, key: "stageId", value: newStageId });
  };

  const defaultPipeline = pipelines?.[0]; // Default to the first pipeline
  const stages = defaultPipeline?.stages || [];

  const columns: ColumnDef<any>[] = [
    { id: "company", header: "Company", accessorKey: "company", cell: ({ row }) => row.company?.name || "—" },
    { id: "contact", header: "Contact", accessorKey: "contact", cell: ({ row }) => row.contact?.name || "—" },
    { id: "value", header: "Value ($)", accessorKey: "value", editable: true, type: "number" as const },
    {
      id: "stageId",
      header: "Stage",
      accessorKey: "stageId",
      editable: true,
      type: "select" as const,
      options: stages.map((s: any) => ({ label: s.name, value: s.id })),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <NeoButton 
          variant="secondary" 
          size="sm" 
          onClick={() => {
            setSelectedDealId(row.id);
            setSelectedDealName(row.company?.name || "Deal");
            setSlideOverOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <History size={16} /> Activity
        </NeoButton>
      )
    }
  ];

  const boardColumns = stages.map((s: any) => ({
    id: s.id,
    title: s.name,
    accessorValue: s.id,
  }));

  if (isLoadingDeals || isLoadingPipelines) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 rounded-full border-4 border-primary border-t-transparent shadow-neumorph-pressed"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500 ease-in-out">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground drop-shadow-sm">{defaultPipeline?.name || "Deals Pipeline"}</h1>
          <p className="text-muted font-medium mt-1">Track revenue and customer lifecycle stages dynamically.</p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          {pipelines?.length > 1 && (
            <select className="px-3 py-1.5 border rounded-lgtext-sm bg-white shadow-sm font-medium">
              {pipelines.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}

          <div className="flex bg-surface shadow-neumorph-concave rounded-xl p-1">
            <button
              onClick={() => setViewMode("board")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                viewMode === "board"
                  ? "bg-primary text-white shadow-neumorph-flat-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Board
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                viewMode === "grid"
                  ? "bg-primary text-white shadow-neumorph-flat-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Grid
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {stages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 py-12 border-2 border-dashed rounded-xl">
            <p>No pipelines or stages found.</p>
            <a href="/settings/pipelines" className="text-blue-600 mt-2 font-medium hover:underline">Go to Settings to create one.</a>
          </div>
        ) : viewMode === "grid" ? (
          <DataGrid
            data={deals || []}
            columns={columns}
            rowKey="id"
            onEdit={handleEdit}
          />
        ) : (
          <KanbanBoard
            data={deals || []}
            columns={boardColumns}
            groupByKey="stageId"
            itemIdKey="id"
            onMove={handleMove}
            renderCard={(d) => {
              const deal = d as any;
              return (
              <div 
                className="flex flex-col gap-2 cursor-grab active:cursor-grabbing"
                onClick={() => {
                  setSelectedDealId(deal.id);
                  setSelectedDealName(deal.company?.name || "Deal");
                  setSlideOverOpen(true);
                }}
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">{deal.company?.name || deal.title || "Deal"}</h4>
                  <span className="text-xs font-bold px-2 py-1 rounded bg-success/20 text-success whitespace-nowrap">
                    ${Number(deal.value).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-sm text-muted font-medium flex items-center gap-1">
                    {deal.contact ? (
                      <>
                        <span className="w-5 h-5 rounded-full bg-surface shadow-neumorph-concave flex items-center justify-center text-[10px]">
                          {deal.contact?.name?.charAt(0)}
                        </span>
                        {deal.contact?.name}
                      </>
                    ) : (
                      <span className="text-gray-400">No Contact</span>
                    )}
                  </p>
                  <button className="text-muted hover:text-primary transition-colors opacity-0 group-hover:opacity-100 p-1">
                    <History size={14} />
                  </button>
                </div>
              </div>
            )}}
          />
        )}
      </div>

      <NeoSlideOver
        isOpen={slideOverOpen}
        onClose={() => setSlideOverOpen(false)}
        title="Activity Log"
        subtitle={`Viewing history for ${selectedDealName}`}
      >
        {selectedDealId && (
          <ActivityFeed entityId={selectedDealId} entityType="DEAL" />
        )}
      </NeoSlideOver>
    </div>
  );
}
