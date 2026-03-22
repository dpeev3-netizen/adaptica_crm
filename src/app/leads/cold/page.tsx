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
import CsvUploader from "@/components/CsvUploader";
import LeadFormModal from "@/components/leads/LeadFormModal";
import { History, Upload, Eye, Plus, Columns } from "lucide-react";
import Link from "next/link";
import { fetchWithToken } from '@/lib/api';
import ErrorBoundary from "@/components/ErrorBoundary";

const STAGES = [
  { label: "Cold Lead", value: "COLD_LEAD" },
  { label: "Didn't Pick Up", value: "DIDNT_PICK_UP" },
  { label: "Booked", value: "BOOKED" },
  { label: "Call Later", value: "CALL_LATER" },
  { label: "Lost", value: "LOST" },
];

export default function ColdLeadsPage() {
  const queryClient = useQueryClient();
  const [activeStage, setActiveStage] = useState("COLD_LEAD");
  const [modalOpen, setModalOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [leadFormOpen, setLeadFormOpen] = useState(false);
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedContactName, setSelectedContactName] = useState<string>("");
  const [followUpDate, setFollowUpDate] = useState("");

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

  // Filter contacts: type === COLD, AND status matches the active stage
  const contacts = useMemo(() => {
    const coldContacts = allContacts?.filter((c: any) => c.type === "COLD") || [];
    const knownStatuses = STAGES.map(s => s.value);

    return coldContacts.filter((c: any) => {
      const status = c.status || "COLD_LEAD";
      if (activeStage === "COLD_LEAD") {
        return status === "COLD_LEAD" || !knownStatuses.includes(status);
      }
      return status === activeStage;
    });
  }, [allContacts, activeStage]);

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
      if (key === "status" && value === "CALL_LATER") {
        setSelectedContactId(id);
        setModalOpen(true);
      }
      await updateMutation.mutateAsync({ id, key, value });
      if (key === "status") {
        setActiveStage(value);
      }
    } else {
      const fieldDef = customFields?.find((f: any) => f.id === key);
      if (fieldDef) {
        await customFieldMutation.mutateAsync({ entityId: id, fieldId: key, value, type: fieldDef.type });
      }
    }
  };

  const saveFollowUpDate = async () => {
    if (selectedContactId && followUpDate) {
      await updateMutation.mutateAsync({
        id: selectedContactId,
        key: "followUpDate",
        value: followUpDate,
      });
      setModalOpen(false);
      setFollowUpDate("");
      setSelectedContactId(null);
    }
  };

  const stageCounts = useMemo(() => {
    const coldContacts = allContacts?.filter((c: any) => c.type === "COLD") || [];
    const knownStatuses = STAGES.map(s => s.value);
    const counts: Record<string, number> = {};
    STAGES.forEach(s => { counts[s.value] = 0; });
    coldContacts.forEach((c: any) => {
      const status = c.status || "COLD_LEAD";
      if (knownStatuses.includes(status)) {
        counts[status]++;
      } else {
        counts["COLD_LEAD"]++;
      }
    });
    return counts;
  }, [allContacts]);

  const columns: ColumnDef<any>[] = [
    { id: "name", header: "Name", accessorKey: "name", editable: true },
    { id: "company", header: "Company", accessorKey: "company", cell: ({ row }) => <span className="text-on-surface-variant">{row.company?.name || "—"}</span> },
    { id: "email", header: "Email", accessorKey: "email", editable: true },
    { id: "phone", header: "Phone", accessorKey: "phone", editable: true },
    {
      id: "status",
      header: "Stage",
      accessorKey: "status",
      editable: true,
      type: "select",
      options: STAGES.map(s => ({ label: s.label, value: s.value })),
    },
    {
      id: "followUpDate",
      header: "Follow Up",
      accessorKey: "followUpDate",
      cell: ({ row }) => (
        <span className="text-on-surface-variant md-body-medium">
          {row.followUpDate ? format(new Date(row.followUpDate), "MMM d, yyyy") : "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Link href={`/contacts/${row.id}`}>
            <NeoButton variant="text" size="sm" className="flex items-center gap-1 px-3">
              <Eye size={14} /> Profile
            </NeoButton>
          </Link>
          <NeoButton
            variant="text"
            size="sm"
            onClick={() => {
              setSelectedContactId(row.id);
              setSelectedContactName(row.name);
              setSlideOverOpen(true);
            }}
            className="flex items-center gap-1 px-3"
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
    <div className="space-y-5 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex max-md:flex-col items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="md-headline-medium text-on-surface font-medium">Cold Leads</h1>
          <p className="md-body-large text-on-surface-variant mt-0.5">Manage your cold outreach pipeline by stage.</p>
        </div>

        <div className="flex items-center gap-2">
          <NeoButton variant="outlined" onClick={() => setCsvModalOpen(true)} className="flex items-center gap-2">
            <Upload size={16} /> Import CSV
          </NeoButton>
          <NeoButton variant="outlined" onClick={() => setAddFieldModalOpen(true)} className="flex items-center gap-2">
            <Columns size={16} /> Add Field
          </NeoButton>
          <NeoButton variant="fab" onClick={() => setLeadFormOpen(true)} className="flex items-center gap-2">
            <Plus size={18} /> Add Lead
          </NeoButton>
        </div>
      </div>

      {/* M3 Segmented Button — Stage Tabs */}
      <div className="flex border border-outline rounded-full w-max overflow-hidden">
        {STAGES.map((stage, i) => (
          <button
            key={stage.value}
            onClick={() => setActiveStage(stage.value)}
            className={`px-5 py-2 md-label-large transition-all duration-200 flex items-center gap-2 ${
              i > 0 ? "border-l border-outline" : ""
            } ${
              activeStage === stage.value
                ? "bg-primary-container text-on-primary-container font-bold"
                : "text-on-surface hover:bg-surface-container-high"
            }`}
          >
            {stage.label}
            <span className={`md-label-small px-2 py-0.5 rounded-full ${
              activeStage === stage.value
                ? "bg-primary/20 text-on-primary-container"
                : "bg-surface-container-highest text-on-surface-variant"
            }`}>
              {stageCounts[stage.value] || 0}
            </span>
          </button>
        ))}
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
              variant: "danger",
              onClick: (ids) => {
                if (confirm(`Are you sure you want to delete ${ids.length} leads?`)) {
                  bulkMutation.mutate({ action: "delete", ids });
                }
              }
            },
            {
              label: "Next Stage",
              variant: "tonal",
              onClick: (ids) => {
                const currentIndex = STAGES.findIndex(s => s.value === activeStage);
                const nextStage = STAGES[Math.min(currentIndex + 1, STAGES.length - 1)];
                if (nextStage.value !== activeStage) {
                  bulkMutation.mutate({ action: "update", ids, data: { status: nextStage.value } });
                }
              }
            },
            {
              label: "Mark Lost",
              variant: "text",
              onClick: (ids) => bulkMutation.mutate({ action: "update", ids, data: { status: "LOST" } })
            }
          ]}
        />
      </ErrorBoundary>

      <LeadFormModal
        isOpen={leadFormOpen}
        onClose={() => setLeadFormOpen(false)}
        defaultType="COLD"
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
            <label className="md-label-large text-on-surface-variant mb-1 block">Field Name</label>
            <NeoInput required value={newFieldName} onChange={(e) => setNewFieldName(e.target.value)} placeholder="E.g. Lead Source" />
          </div>
          <div>
            <label className="md-label-large text-on-surface-variant mb-1 block">Field Type</label>
            <select value={newFieldType} onChange={(e) => setNewFieldType(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-transparent border border-outline text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm">
              <option value="TEXT" className="bg-surface">Text</option>
              <option value="NUMBER" className="bg-surface">Number</option>
              <option value="DATE" className="bg-surface">Date</option>
              <option value="BOOLEAN" className="bg-surface">Checkbox (Boolean)</option>
            </select>
          </div>
          <NeoButton type="submit" disabled={addFieldMutation.isPending} className="mt-2">
            {addFieldMutation.isPending ? "Adding..." : "Add Column"}
          </NeoButton>
        </form>
      </NeoModal>

      <NeoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Set Follow Up Date"
      >
        <div className="flex flex-col gap-4">
          <p className="md-body-medium text-on-surface-variant">
            You changed the stage to <strong className="text-primary">Call Later</strong>.
            When should you call this lead back?
          </p>
          <NeoInput
            type="date"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
          />
          <NeoButton onClick={saveFollowUpDate} className="w-full">
            Save Date
          </NeoButton>
        </div>
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

      <NeoModal isOpen={csvModalOpen} onClose={() => setCsvModalOpen(false)} title="Import Leads" size="full">
        <CsvUploader />
      </NeoModal>
    </div>
  );
}
