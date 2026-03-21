"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import NeoCard from "@/components/ui/NeoCard";
import NeoButton from "@/components/ui/NeoButton";
import NeoInput from "@/components/ui/NeoInput";
import { ArrowLeft, Mail, Phone, Building2, Tag, Clock, DollarSign, FileText, PhoneCall, CheckSquare, Send, CalendarDays, History } from "lucide-react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { fetchWithToken } from '@/lib/api';

const TYPE_ICONS: Record<string, any> = {
  NOTE: FileText,
  CALL: PhoneCall,
  TASK: CheckSquare,
};

const TYPE_COLORS: Record<string, string> = {
  NOTE: "text-on-warning-container bg-warning-container",
  CALL: "text-on-primary-container bg-primary-container",
  TASK: "text-on-success-container bg-success-container",
};

const STATUS_COLORS: Record<string, string> = {
  TO_ENGAGE: "bg-surface-container-highest text-on-surface-variant",
  NO_ANSWER: "bg-warning-container text-on-warning-container",
  CALL_LATER: "bg-primary-container text-on-primary-container",
  MEETING_BOOKED: "bg-success-container text-on-success-container",
  QUALIFIED: "bg-success-container text-on-success-container",
  LOST: "bg-error-container text-on-error-container",
  PROPOSAL_SENT: "bg-primary-container text-on-primary-container",
  NEGOTIATING: "bg-warning-container text-on-warning-container",
};

export default function ContactClient({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const [noteContent, setNoteContent] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["contact-profile", id],
    queryFn: async () => {
      const res = await fetchWithToken(`/contacts/${id}/timeline`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const noteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: "CONTACT",
          entityId: id,
          type: "NOTE",
          content: noteContent,
        }),
      });
      if (!res.ok) throw new Error("Failed to post note");
      return res.json();
    },
    onSuccess: () => {
      setNoteContent("");
      queryClient.invalidateQueries({ queryKey: ["contact-profile", id] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="animate-spin w-10 h-10 rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="md-body-medium text-on-surface-variant animate-pulse">Loading Profile...</p>
      </div>
    );
  }

  const { contact, activities } = data || {};

  if (!contact) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <div className="w-24 h-24 bg-surface-container-highest rounded-full flex items-center justify-center mx-auto mb-6">
          <FileText className="text-on-surface-variant w-10 h-10" />
        </div>
        <p className="md-headline-small text-on-surface">Contact not found</p>
        <p className="md-body-medium text-on-surface-variant mt-2">The contact you are looking for does not exist or was deleted.</p>
        <Link href="/leads" className="text-primary font-medium mt-6 inline-block hover:underline underline-offset-4">← Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="relative h-40 rounded-2xl overflow-hidden bg-primary-container mb-[-3rem]">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-transparent"></div>
        <div className="absolute top-5 left-5 z-10">
          <Link href="/leads">
            <NeoButton variant="tonal" size="sm" className="flex items-center gap-2">
              <ArrowLeft size={16} /> Back
            </NeoButton>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-4 sm:px-6 relative z-10">
        {/* Left Sidebar: Profile Details */}
        <div className="lg:col-span-4 space-y-5">
          <NeoCard variant="elevated" className="p-6 space-y-5 rounded-2xl relative overflow-hidden">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center font-medium text-on-primary text-3xl mb-4">
                {contact.name?.charAt(0)?.toUpperCase()}
              </div>
              <h1 className="md-headline-small text-on-surface font-medium">{contact.name}</h1>
              <span className={`mt-3 md-label-medium uppercase tracking-wider px-4 py-1.5 rounded-full ${STATUS_COLORS[contact.status] || "bg-surface-container-highest text-on-surface-variant"}`}>
                {contact.status?.replace(/_/g, " ")}
              </span>
            </div>

            <hr className="border-outline-variant" />

            <div className="space-y-3">
              {contact.email && (
                <div className="flex items-center gap-3 text-sm group cursor-pointer hover:bg-on-surface/5 p-2.5 -mx-2 rounded-xl transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-surface-container-highest flex items-center justify-center text-on-surface-variant group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
                    <Mail size={16} />
                  </div>
                  <span className="text-on-surface font-medium">{contact.email}</span>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-3 text-sm group cursor-pointer hover:bg-on-surface/5 p-2.5 -mx-2 rounded-xl transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-surface-container-highest flex items-center justify-center text-on-surface-variant group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
                    <Phone size={16} />
                  </div>
                  <span className="text-on-surface font-medium">{contact.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <div className="w-9 h-9 rounded-xl bg-surface-container-highest flex items-center justify-center text-on-surface-variant">
                  <Building2 size={16} />
                </div>
                <span className="text-on-surface">{contact.company?.name || <span className="text-on-surface-variant italic">No Company</span>}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-9 h-9 rounded-xl bg-surface-container-highest flex items-center justify-center text-on-surface-variant">
                  <CalendarDays size={16} />
                </div>
                <span className="text-on-surface-variant">
                  {contact.followUpDate ? `Follow up on ${format(new Date(contact.followUpDate), "MMM d, yyyy")}` : "No follow up set"}
                </span>
              </div>
            </div>

            {/* Tags */}
            {contact.tags?.length > 0 && (
              <div className="pt-2">
                <div className="flex items-center gap-2 mb-3">
                  <Tag size={16} className="text-on-surface-variant" />
                  <span className="md-label-large text-on-surface">Tags</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {contact.tags.map((tag: any) => (
                    <span
                      key={tag.id}
                      className="md-label-medium px-3 py-1 rounded-full border"
                      style={{ backgroundColor: tag.color + "20", color: tag.color, borderColor: tag.color + "40" }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </NeoCard>

          {/* Associated Deals */}
          <NeoCard variant="outlined" className="p-5">
            <h2 className="md-title-medium text-on-surface mb-4 flex items-center gap-2">
              <DollarSign size={18} className="text-success" /> Deals
            </h2>
            {contact.deals?.length === 0 ? (
              <div className="rounded-xl p-4 text-center border border-dashed border-outline-variant bg-surface-container">
                <p className="md-body-medium text-on-surface-variant">No deals associated yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {contact.deals?.map((deal: any) => (
                  <div key={deal.id} className="flex flex-col p-3.5 rounded-xl border border-outline-variant hover:bg-on-surface/5 transition-colors cursor-pointer">
                    <p className="md-title-small text-on-surface line-clamp-1 mb-1">{deal.title}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="md-label-small text-on-surface-variant bg-surface-container-highest px-2 py-0.5 rounded-md">{deal.stage?.replace(/_/g, " ")}</span>
                      <span className="md-title-small text-success font-medium">${Number(deal.value).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </NeoCard>
        </div>

        {/* Right Content: Activity & Interaction */}
        <div className="lg:col-span-8 space-y-5">
          {/* Quick Note Input */}
          <NeoCard variant="outlined" className="p-2 pl-5 flex items-center gap-3 rounded-full">
            <input
              type="text"
              placeholder="Log a quick note about this contact..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && noteContent && noteMutation.mutate()}
              className="flex-1 bg-transparent border-none text-on-surface font-normal focus:outline-none placeholder:text-on-surface-variant/50"
            />
            <NeoButton
              size="md"
              variant="fab"
              disabled={!noteContent || noteMutation.isPending}
              onClick={() => noteMutation.mutate()}
              className="rounded-full w-11 h-11 p-0 flex items-center justify-center shrink-0 mr-0.5 disabled:opacity-50"
            >
              {noteMutation.isPending ? <div className="animate-spin w-5 h-5 border-2 border-on-primary-container/40 border-t-on-primary-container rounded-full" /> : <Send size={18} />}
            </NeoButton>
          </NeoCard>

          {/* Activity Timeline */}
          <NeoCard variant="elevated" className="p-8 rounded-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="md-title-large text-on-surface flex items-center gap-3">
                <Clock className="text-primary w-5 h-5" />
                Activity History
              </h2>
              <span className="md-label-medium text-on-surface-variant bg-surface-container-highest px-3 py-1.5 rounded-full">
                {activities?.length || 0} Records
              </span>
            </div>

            {activities?.length === 0 ? (
              <div className="text-center py-14 border border-dashed border-outline-variant rounded-2xl bg-surface-container">
                <div className="w-16 h-16 bg-surface-container-highest rounded-full flex items-center justify-center mx-auto mb-4">
                  <History className="text-on-surface-variant w-6 h-6" />
                </div>
                <p className="md-title-small text-on-surface">No activity yet</p>
                <p className="md-body-medium text-on-surface-variant mt-1">Activities logged will appear here in a unified timeline.</p>
              </div>
            ) : (
              <div className="relative pl-6">
                <div className="absolute left-11 top-6 bottom-6 w-[2px] bg-outline-variant rounded-full" />
                <div className="space-y-6">
                  {activities?.map((a: any, i: number) => {
                    const Icon = TYPE_ICONS[a.type] || FileText;
                    const colorClass = TYPE_COLORS[a.type] || "text-on-surface-variant bg-surface-container-highest";
                    const animationDelay = `${i * 80}ms`;

                    return (
                      <div
                        key={a.id}
                        className="flex gap-5 relative group animate-slide-up-fade"
                        style={{ animationDelay, opacity: 0, animationFillMode: "forwards" }}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 z-10 ${colorClass} transition-transform group-hover:scale-105 duration-200`}>
                          <Icon size={18} />
                        </div>
                        <div className="flex-1 pb-1">
                          <div className="bg-surface-container border border-outline-variant p-4 rounded-xl rounded-tl-sm group-hover:bg-surface-container-high transition-colors">
                            <p className="md-body-medium text-on-surface leading-relaxed mb-2">{a.content}</p>
                            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-outline-variant">
                              <span className="md-label-small text-on-surface-variant bg-surface-container-highest px-2 py-0.5 rounded-md">
                                {a.user?.name}
                              </span>
                              <span className="md-label-small text-on-surface-variant/70 flex items-center gap-1">
                                <Clock size={12} />
                                {formatDistanceToNow(new Date(a.timestamp), { addSuffix: true })}
                              </span>
                              {a.status === "COMPLETED" && (
                                <span className="md-label-small text-on-success-container bg-success-container px-2.5 py-0.5 rounded-full ml-auto">✓ Completed</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </NeoCard>
        </div>
      </div>
    </div>
  );
}
