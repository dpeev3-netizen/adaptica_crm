"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import DataGrid, { ColumnDef } from "@/components/pipelines/DataGrid";
import KanbanBoard from "@/components/pipelines/KanbanBoard";
import NeoSlideOver from "@/components/ui/NeoSlideOver";
import ActivityFeed from "@/components/activity/ActivityFeed";
import NeoButton from "@/components/ui/NeoButton";
import NeoModal from "@/components/ui/NeoModal";
import NeoInput from "@/components/ui/NeoInput";
import DealFormModal from "@/components/deals/DealFormModal";
import { History, Columns, Plus } from "lucide-react";
import { fetchWithToken } from '@/lib/api';

export default function DealsPage() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<"grid" | "board">("board");
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [selectedDealName, setSelectedDealName] = useState<string>("");
  const [addFieldModalOpen, setAddFieldModalOpen] = useState(false);
  const [dealFormOpen, setDealFormOpen] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState("TEXT");

  const { data: customFields } = useQuery({
    queryKey: ["custom-fields", "DEAL"],
    queryFn: async () => {
      const res = await fetchWithToken('/custom-fields?entityType=DEAL');
      if (!res.ok) throw new Error("Failed to fetch custom fields");
      return res.json();
    },
  });

  const { data: pipelines, isLoading: isLoadingPipelines } = useQuery({
    queryKey: ["pipelines"],
    queryFn: async () => {
      const res = await fetchWithToken('/pipelines');
      if (!res.ok) throw new Error("Failed to fetch pipelines");
      return res.json();
    },
  });

  const { data: deals, isLoading: isLoadingDeals } = useQuery({
    queryKey: ["deals"],
    queryFn: async () => {
      const res = await fetchWithToken('/deals');
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
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update");
      }
      return data;
    },
    onError: (error: Error) => {
      alert(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["pipelines"] });
    },
  });

  const customFieldMutation = useMutation({
    mutationFn: async ({ entityId, fieldId, value, type }: any) => {
      const res = await fetch("/api/custom-field-values", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityId, fieldId, value, type }),
      });
      if (!res.ok) throw new Error("Failed to save custom field");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const addFieldMutation = useMutation({
    mutationFn: async ({ name, type }: { name: string, type: string }) => {
      const res = await fetch("/api/custom-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType: "DEAL", name, type }),
      });
      if (!res.ok) throw new Error("Failed to create custom field");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-fields", "DEAL"] });
      setAddFieldModalOpen(false);
      setNewFieldName("");
      setNewFieldType("TEXT");
    },
  });

  const handleEdit = async (id: string, key: any, value: any) => {
    if (key === "annualRevenue") {
      const deal = deals?.find((d: any) => d.id === id);
      if (deal?.companyId) {
        await fetch(`/api/companies/${deal.companyId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ annualRevenue: value ? parseFloat(value) : null }),
        });
        queryClient.invalidateQueries({ queryKey: ["deals"] });
      }
      return;
    }

    const standardFields = ["value", "stageId"];
    if (standardFields.includes(key)) {
      await updateMutation.mutateAsync({ id, key, value });
    } else {
      const fieldDef = customFields?.find((f: any) => f.id === key);
      if (fieldDef) {
        await customFieldMutation.mutateAsync({ entityId: id, fieldId: key, value, type: fieldDef.type });
      }
    }
  };

  const handleMove = async (itemId: string, newStageId: string) => {
    await updateMutation.mutateAsync({ id: itemId, key: "stageId", value: newStageId });
  };

  const defaultPipeline = pipelines?.[0]; // Default to the first pipeline
  const stages = defaultPipeline?.stages || [];

  const columns: ColumnDef<any>[] = [
    { id: "company", header: "Company", accessorKey: "company", cell: ({ row }) => row.company?.name || "—" },
    { id: "product", header: "Product / Service", accessorKey: "product", cell: ({ row }) => row.product || "—" },
    { id: "annualRevenue", header: "Annual Revenue (€)", accessorKey: "annualRevenue", editable: true, type: "number", cell: ({ row }) => row.company?.annualRevenue || "—" },
    { id: "contact", header: "Contact", accessorKey: "contact", cell: ({ row }) => row.contact?.name || "—" },
    { id: "value", header: "Deal Value (€)", accessorKey: "value", editable: true, type: "number" as const },
    {
      id: "stageId",
      header: "Stage",
      accessorKey: "stageId",
      editable: true,
      type: "select" as const,
      options: stages.map((s: any) => ({ label: s.name, value: s.id })),
      cell: ({ row }) => stages.find((s: any) => s.id === row.stageId)?.name || "—",
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
    },
    ...(customFields || []).map((field: any) => ({
      id: field.id,
      header: field.name,
      accessorKey: field.id,
      editable: true,
      type: field.type === "NUMBER" ? "number" : field.type === "DATE" ? "date" : field.type === "DROPDOWN" ? "select" : "text",
      options: field.options ? JSON.parse(field.options) : undefined,
    })) as ColumnDef<any>[],
  ];

  const boardColumns = stages.map((s: any) => ({
    id: s.id,
    title: s.name,
    accessorValue: s.id,
    wipLimit: s.wipLimit,
    slaDays: s.slaDays,
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
          <h1 className="md-headline-medium text-on-surface">{defaultPipeline?.name || "Deals Pipeline"}</h1>
          <p className="md-body-large text-on-surface-variant mt-1">Track revenue and customer lifecycle stages dynamically.</p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            {pipelines?.length > 1 && (
              <select className="px-3 py-1.5 border border-outline-variant rounded-lg md-label-large bg-surface-container-highest text-on-surface focus:outline-none focus:border-primary">
                {pipelines.map((p: any) => (
                  <option key={p.id} value={p.id} className="bg-surface">{p.name}</option>
                ))}
              </select>
            )}
            <NeoButton variant="secondary" onClick={() => setAddFieldModalOpen(true)} className="flex items-center gap-2 h-9 px-3">
              <Columns size={16} /> Add Field
            </NeoButton>
            <NeoButton onClick={() => setDealFormOpen(true)} className="flex items-center gap-2 h-9 px-3">
              <Plus size={16} /> Add Deal
            </NeoButton>
          </div>

          <div className="flex bg-surface-container border border-outline-variant rounded-xl p-1.5 w-max">
            <button
              onClick={() => setViewMode("board")}
              className={`px-4 py-1.5 rounded-lg md-label-large transition-all duration-300 ${
                viewMode === "board"
                  ? "bg-primary-container text-on-primary-container font-bold"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
              }`}
            >
              Board
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`px-4 py-1.5 rounded-lg md-label-large transition-all duration-300 ${
                viewMode === "grid"
                  ? "bg-primary-container text-on-primary-container font-bold"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
              }`}
            >
              Grid
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {stages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-on-surface-variant py-12 border-2 border-dashed border-outline-variant rounded-xl bg-surface-container">
            <p className="md-body-large">No pipelines or stages found.</p>
            <a href="/automation-hub/pipelines" className="text-primary font-medium hover:underline mt-2">Go to Automation Hub to create one.</a>
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
            valueKey="value"
            searchKeys={["company.name", "title", "contact.name"]}
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
                  <h4 className="md-title-small text-on-surface line-clamp-1 group-hover:text-primary transition-colors">{deal.company?.name || deal.title || "Deal"}</h4>
                  <span className="md-label-small px-2 py-1 rounded bg-success-container text-on-success-container whitespace-nowrap">
                    €{Number(deal.value).toLocaleString()}
                  </span>
                </div>
                {deal.product && (
                  <p className="md-label-small text-on-surface-variant/80 -mt-0.5 line-clamp-1">{deal.product}</p>
                )}
                <div className="flex justify-between items-center mt-2">
                  <p className="md-label-medium text-on-surface-variant flex items-center gap-1.5">
                    {deal.contact ? (
                      <>
                        <span className="w-5 h-5 rounded-full bg-surface-container-highest flex items-center justify-center text-[10px] text-on-surface-variant">
                          {deal.contact?.name?.charAt(0)}
                        </span>
                        {deal.contact?.name}
                      </>
                    ) : (
                      <span className="text-on-surface-variant/70 italic">No Contact</span>
                    )}
                  </p>
                  <button className="text-on-surface-variant hover:text-primary transition-colors opacity-0 group-hover:opacity-100 p-1">
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

      <NeoModal isOpen={addFieldModalOpen} onClose={() => setAddFieldModalOpen(false)} title="Add Custom Field">
        <form 
          onSubmit={(e) => { 
            e.preventDefault(); 
            addFieldMutation.mutate({ name: newFieldName, type: newFieldType }); 
          }} 
          className="flex flex-col gap-4"
        >
          <div>
            <label className="md-label-medium text-on-surface-variant mb-1 block">Field Name</label>
            <NeoInput required value={newFieldName} onChange={(e) => setNewFieldName(e.target.value)} placeholder="E.g. Expected Close Date" />
          </div>
          <div>
            <label className="md-label-medium text-on-surface-variant mb-1 block">Field Type</label>
            <select value={newFieldType} onChange={(e) => setNewFieldType(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-surface border border-outline-variant text-on-surface md-body-medium focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all">
              <option value="TEXT" className="bg-surface">Text</option>
              <option value="NUMBER" className="bg-surface">Number</option>
              <option value="DATE" className="bg-surface">Date</option>
              <option value="BOOLEAN" className="bg-surface">Checkbox (Boolean)</option>
            </select>
          </div>
          <NeoButton type="submit" disabled={addFieldMutation.isPending} className="mt-4">
            {addFieldMutation.isPending ? "Adding..." : "Add Column"}
          </NeoButton>
        </form>
      </NeoModal>

      <DealFormModal isOpen={dealFormOpen} onClose={() => setDealFormOpen(false)} />
    </div>
  );
}
