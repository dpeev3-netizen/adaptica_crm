"use client";

import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import NeoModal from "@/components/ui/NeoModal";
import NeoInput from "@/components/ui/NeoInput";
import NeoButton from "@/components/ui/NeoButton";
import { fetchWithToken } from '@/lib/api';

interface DealFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DealFormModal({ isOpen, onClose }: DealFormModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    companyName: "",
    product: "",
    value: "",
    pipelineId: "",
    stageId: "",
  });

  const { data: pipelines } = useQuery({
    queryKey: ["pipelines"],
    queryFn: async () => {
      const res = await fetchWithToken('/pipelines');
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isOpen,
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload: any = {
        title: data.companyName,
        product: data.product || undefined,
      };
      
      if (data.value) payload.value = parseFloat(data.value);
      if (data.pipelineId) payload.pipelineId = data.pipelineId;
      if (data.stageId) payload.stageId = data.stageId;

      const res = await fetchWithToken('/deals', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create deal");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["pipelines"] });
      onClose();
      setFormData({
        companyName: "",
        product: "",
        value: "",
        pipelineId: "",
        stageId: "",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const selectedPipeline = pipelines?.find((p: any) => p.id === formData.pipelineId) || pipelines?.[0];
  const stages = selectedPipeline?.stages || [];

  return (
    <NeoModal isOpen={isOpen} onClose={onClose} title="Add New Deal">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-sm font-bold text-muted mb-1 block">Company Name *</label>
          <NeoInput
            required
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            placeholder="E.g. Demos Real Estate"
          />
        </div>

        <div>
          <label className="text-sm font-bold text-muted mb-1 block">Product / Service</label>
          <NeoInput
            value={formData.product}
            onChange={(e) => setFormData({ ...formData, product: e.target.value })}
            placeholder="E.g. Website with ChatBot Development"
          />
        </div>

        <div>
          <label className="text-sm font-bold text-muted mb-1 block">Deal Value (€)</label>
          <NeoInput
            type="number"
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            placeholder="0.00"
            min="0"
            step="0.01"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-bold text-muted mb-1 block">Pipeline</label>
            <select
              value={formData.pipelineId}
              onChange={(e) => setFormData({ ...formData, pipelineId: e.target.value, stageId: "" })}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container border border-outline-variant text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-medium"
            >
              <option value="" className="bg-surface">Default Pipeline</option>
              {pipelines?.map((p: any) => (
                <option key={p.id} value={p.id} className="bg-surface">{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-bold text-muted mb-1 block">Stage</label>
            <select
              value={formData.stageId}
              onChange={(e) => setFormData({ ...formData, stageId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container border border-outline-variant text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-medium"
            >
              <option value="" className="bg-surface">Default Stage</option>
              {stages?.map((s: any) => (
                <option key={s.id} value={s.id} className="bg-surface">{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {mutation.isError && (
          <p className="text-red-500 text-sm font-medium">{mutation.error.message}</p>
        )}

        <div className="flex justify-end gap-3 mt-4">
          <NeoButton type="button" variant="secondary" onClick={onClose}>
            Cancel
          </NeoButton>
          <NeoButton type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Creating..." : "Create Deal"}
          </NeoButton>
        </div>
      </form>
    </NeoModal>
  );
}
