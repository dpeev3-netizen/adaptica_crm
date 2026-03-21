"use client";

import { useState } from "react";
import NeoModal from "@/components/ui/NeoModal";
import NeoInput from "@/components/ui/NeoInput";
import NeoButton from "@/components/ui/NeoButton";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface LeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: "COLD" | "WARM";
}

export default function LeadFormModal({ isOpen, onClose, defaultType = "COLD" }: LeadFormModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    companyName: "",
    type: defaultType,
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create lead");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      onClose();
      setFormData({ name: "", email: "", phone: "", companyName: "", type: defaultType });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <NeoModal isOpen={isOpen} onClose={onClose} title="Add New Lead">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-sm font-bold text-muted mb-1 block">Name *</label>
          <NeoInput
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="John Doe"
          />
        </div>
        
        <div>
          <label className="text-sm font-bold text-muted mb-1 block">Email</label>
          <NeoInput
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="john@example.com"
          />
        </div>
        
        <div>
          <label className="text-sm font-bold text-muted mb-1 block">Phone</label>
          <NeoInput
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+1 234 567 890"
          />
        </div>
        
        <div>
          <label className="text-sm font-bold text-muted mb-1 block">Company Name</label>
          <NeoInput
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            placeholder="Acme Corp"
          />
        </div>
        
        <div>
          <label className="text-sm font-bold text-slate-500 mb-1 block uppercase tracking-wider text-[10px]">Lead Type</label>
          <select 
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/5 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 text-white font-bold transition-all appearance-none shadow-inner"
          >
            <option value="COLD" className="bg-[#0F172A]">Cold Lead</option>
            <option value="WARM" className="bg-[#0F172A]">Warm Lead</option>
          </select>
        </div>

        {mutation.isError && (
          <p className="text-danger text-sm font-bold animate-shake bg-danger/10 p-3 rounded-xl border border-danger/20">{mutation.error.message}</p>
        )}

        <div className="pt-4 flex gap-4">
          <NeoButton type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </NeoButton>
          <NeoButton type="submit" disabled={mutation.isPending} className="flex-1">
            {mutation.isPending ? "Saving..." : "Create Lead"}
          </NeoButton>
        </div>
      </form>
    </NeoModal>
  );
}
