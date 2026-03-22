"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DataGrid, { ColumnDef } from "@/components/pipelines/DataGrid";
import NeoModal from "@/components/ui/NeoModal";
import NeoButton from "@/components/ui/NeoButton";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import NeoInput from "@/components/ui/NeoInput";
import NeoSlideOver from "@/components/ui/NeoSlideOver";
import ActivityFeed from "@/components/activity/ActivityFeed";
import LeadFormModal from "@/components/leads/LeadFormModal";
import { History, Eye, Plus, Columns } from "lucide-react";
import Link from "next/link";
import { fetchWithToken } from '@/lib/api';
import ErrorBoundary from "@/components/ErrorBoundary";

export default function WarmLeadsPage() {
  const queryClient = useQueryClient();
  const [leadFormOpen, setLeadFormOpen] = useState(false);
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedContactName, setSelectedContactName] = useState<string>("");

  const [addFieldModalOpen, setAddFieldModalOpen] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState("TEXT");

  const { data: customFields } = useQuery({
    queryKey: ["custom-fields", "CONTACT"],
    queryFn: async () => {
      const res = await fetchWithToken('/custom-fields?entityType=CONTACT');
      if (!res.ok) throw new Error("Failed to fetch custom fields");
      return res.json();
    },
  });

  const { data: allContacts, isLoading } = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const res = await fetchWithToken('/contacts');
      if (!res.ok) throw new Error("Failed to fetch contacts");
      return res.json();
    },
  });

  const contacts = useMemo(() => {
    return allContacts?.filter((c: any) => c.type === "WARM") || [];
  }, [allContacts]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, key, value }: { id: string; key: string; value: any }) => {
      const res = await fetchWithToken(`/contacts/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ [key]: value }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const customFieldMutation = useMutation({
    mutationFn: async ({ entityId, fieldId, value, type }: any) => {
      const res = await fetchWithToken("/custom-field-values", {
        method: "POST",
        body: JSON.stringify({ entityId, fieldId, value, type }),
      });
      if (!res.ok) throw new Error("Failed to save custom field");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const bulkMutation = useMutation({
    mutationFn: async ({ action, ids, data }: { action: "delete" | "update"; ids: string[]; data?: any }) => {
      const res = await fetchWithToken("/contacts/bulk", {
        method: "POST",
        body: JSON.stringify({ action, ids, data }),
      });
      if (!res.ok) throw new Error("Bulk operation failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const addFieldMutation = useMutation({
    mutationFn: async ({ name, type }: { name: string, type: string }) => {
      const res = await fetchWithToken("/custom-fields", {
        method: "POST",
        body: JSON.stringify({ entityType: "CONTACT", name, type }),
      });
      if (!res.ok) throw new Error("Failed to create custom field");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-fields", "CONTACT"] });
      setAddFieldModalOpen(false);
      setNewFieldName("");
      setNewFieldType("TEXT");
    },
  });

  const handleEdit = async (id: string, key: any, value: any) => {
    const standardFields = ["name", "email", "phone", "status", "followUpDate"];

    if (standardFields.includes(key)) {
      await updateMutation.mutateAsync({ id, key, value });
    } else {
      const fieldDef = customFields?.find((f: any) => f.id === key);
      if (fieldDef) {
        await customFieldMutation.mutateAsync({ entityId: id, fieldId: key, value, type: fieldDef.type });
      }
    }
  };

  const columns: ColumnDef<any>[] = [
    { id: "name", header: "Name", accessorKey: "name", editable: true },
    { id: "company", header: "Company", accessorKey: "company", cell: ({ row }) => row.company?.name || "—" },
    { id: "email", header: "Email", accessorKey: "email", editable: true },
    { id: "phone", header: "Phone", accessorKey: "phone", editable: true },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      editable: true,
      type: "select",
      options: [
        { label: "Steady", value: "STEADY" },
        { label: "Next Chapter", value: "NEXT_CHAPTER" },
      ],
    },
    {
      id: "followUpDate",
      header: "Follow Up",
      accessorKey: "followUpDate",
      editable: true,
      type: "date" as any,
      cell: ({ row }) => (
        <span className="text-muted">
          {row.followUpDate ? format(new Date(row.followUpDate), "MMM d, yyyy") : "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Link href={`/contacts/${row.id}`}>
            <NeoButton variant="secondary" size="sm" className="flex items-center gap-1">
              <Eye size={14} /> Profile
            </NeoButton>
          </Link>
          <NeoButton 
            variant="secondary" 
            size="sm" 
            onClick={() => {
              setSelectedContactId(row.id);
              setSelectedContactName(row.name);
              setSlideOverOpen(true);
            }}
            className="flex items-center gap-1"
          >
            <History size={14} /> Log
          </NeoButton>
        </div>
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



  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex max-md:flex-col items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white drop-shadow-md">Warm Leads</h1>
          <p className="text-muted font-medium mt-1">Manage your warm contacts and qualified opportunities.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <NeoButton variant="secondary" onClick={() => setAddFieldModalOpen(true)} className="flex items-center gap-2">
            <Columns size={18} /> Add Field
          </NeoButton>
          <NeoButton onClick={() => setLeadFormOpen(true)} className="flex items-center gap-2">
            <Plus size={18} /> Add Lead
          </NeoButton>
        </div>
      </div>

      <ErrorBoundary>
        <DataGrid
          data={contacts}
          columns={columns}
          rowKey="id"
          onEdit={handleEdit}
          isLoading={isLoading}
          massActions={[
            {
              label: "Delete",
              variant: "ghost",
              onClick: (ids) => {
                if (confirm(`Are you sure you want to delete ${ids.length} leads?`)) {
                  bulkMutation.mutate({ action: "delete", ids });
                }
              }
            },
            {
              label: "Mark Lost",
              variant: "secondary",
              onClick: (ids) => bulkMutation.mutate({ action: "update", ids, data: { status: "LOST" } })
            }
          ]}
        />
      </ErrorBoundary>

      <LeadFormModal 
        isOpen={leadFormOpen} 
        onClose={() => setLeadFormOpen(false)} 
        defaultType="WARM"
      />

      <NeoModal isOpen={addFieldModalOpen} onClose={() => setAddFieldModalOpen(false)} title="Add Custom Field">
        <form 
          onSubmit={(e) => { 
            e.preventDefault(); 
            addFieldMutation.mutate({ name: newFieldName, type: newFieldType }); 
          }} 
          className="flex flex-col gap-4"
        >
          <div>
            <label className="text-sm font-bold text-muted mb-1 block">Field Name</label>
            <NeoInput required value={newFieldName} onChange={(e) => setNewFieldName(e.target.value)} placeholder="E.g. Lead Source" />
          </div>
          <div>
            <label className="text-sm font-bold text-muted mb-1 block">Field Type</label>
            <select value={newFieldType} onChange={(e) => setNewFieldType(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-[#0B0C10]/50 border border-white/10 text-white focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all font-medium">
              <option value="TEXT" className="bg-[#12141C]">Text</option>
              <option value="NUMBER" className="bg-[#12141C]">Number</option>
              <option value="DATE" className="bg-[#12141C]">Date</option>
              <option value="BOOLEAN" className="bg-[#12141C]">Checkbox (Boolean)</option>
            </select>
          </div>
          <NeoButton type="submit" disabled={addFieldMutation.isPending} className="mt-4">
            {addFieldMutation.isPending ? "Adding..." : "Add Column"}
          </NeoButton>
        </form>
      </NeoModal>

      <NeoSlideOver
        isOpen={slideOverOpen}
        onClose={() => setSlideOverOpen(false)}
        title="Activity Log"
        subtitle={`Viewing history for ${selectedContactName}`}
      >
        {selectedContactId && (
          <ActivityFeed entityId={selectedContactId} entityType="CONTACT" />
        )}
      </NeoSlideOver>
    </div>
  );
}
