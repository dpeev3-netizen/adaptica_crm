"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DataGrid, { ColumnDef } from "@/components/pipelines/DataGrid";
import { format } from "date-fns";
import NeoButton from "@/components/ui/NeoButton";
import NeoModal from "@/components/ui/NeoModal";
import { useState } from "react";
import NeoSlideOver from "@/components/ui/NeoSlideOver";
import ActivityFeed from "@/components/activity/ActivityFeed";
import CsvUploader from "@/components/CsvUploader";
import { History, Upload, Eye } from "lucide-react";
import Link from "next/link";

export default function WarmLeadsPage() {
  const queryClient = useQueryClient();
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedContactName, setSelectedContactName] = useState<string>("");

  const { data: contacts, isLoading } = useQuery({
    queryKey: ["contacts-warm"],
    queryFn: async () => {
      const res = await fetch("/api/contacts");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      return json.filter((c: any) => c.type === "WARM");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, key, value }: { id: string; key: string; value: any }) => {
      const res = await fetch(`/api/contacts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts-warm"] });
    },
  });

  const handleEdit = async (id: string, key: any, value: any) => {
    await updateMutation.mutateAsync({ id, key, value });
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
        { label: "Meeting Booked", value: "MEETING_BOOKED" },
        { label: "Qualified", value: "QUALIFIED" },
        { label: "Proposal Sent", value: "PROPOSAL_SENT" },
        { label: "Negotiating", value: "NEGOTIATING" },
        { label: "Lost", value: "LOST" },
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
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 rounded-full border-4 border-primary border-t-transparent shadow-neumorph-pressed"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-in-out">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground drop-shadow-sm">Warm Leads</h1>
          <p className="text-muted font-medium mt-1">Manage highly engaged contacts progressing to deals.</p>
        </div>
        <NeoButton onClick={() => setCsvModalOpen(true)} className="flex items-center gap-2">
          <Upload size={18} /> Import CSV
        </NeoButton>
      </div>

      <DataGrid
        data={contacts || []}
        columns={columns}
        rowKey="id"
        onEdit={handleEdit}
      />

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

      <NeoModal isOpen={csvModalOpen} onClose={() => setCsvModalOpen(false)} title="Import Warm Leads">
        <CsvUploader />
      </NeoModal>
    </div>
  );
}
