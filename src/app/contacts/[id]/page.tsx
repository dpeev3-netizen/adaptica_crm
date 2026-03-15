"use client";

import { useQuery } from "@tanstack/react-query";
import { use } from "react";
import NeoCard from "@/components/ui/NeoCard";
import NeoButton from "@/components/ui/NeoButton";
import { ArrowLeft, Mail, Phone, Building2, Tag, Clock, DollarSign, FileText, PhoneCall, CheckSquare } from "lucide-react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";

const TYPE_ICONS: Record<string, any> = {
  NOTE: FileText,
  CALL: PhoneCall,
  TASK: CheckSquare,
};

const TYPE_COLORS: Record<string, string> = {
  NOTE: "text-warning bg-warning/15",
  CALL: "text-primary bg-primary/15",
  TASK: "text-success bg-success/15",
};

const STATUS_COLORS: Record<string, string> = {
  TO_ENGAGE: "bg-muted/20 text-muted",
  NO_ANSWER: "bg-warning/20 text-warning",
  CALL_LATER: "bg-primary/20 text-primary",
  MEETING_BOOKED: "bg-success/20 text-success",
  QUALIFIED: "bg-success/20 text-success",
  LOST: "bg-danger/20 text-danger",
  PROPOSAL_SENT: "bg-primary/20 text-primary",
  NEGOTIATING: "bg-warning/20 text-warning",
};

export default function ContactProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data, isLoading } = useQuery({
    queryKey: ["contact-profile", id],
    queryFn: async () => {
      const res = await fetch(`/api/contacts/${id}/timeline`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 rounded-full border-4 border-primary border-t-transparent shadow-neumorph-pressed"></div>
      </div>
    );
  }

  const { contact, activities } = data || {};

  if (!contact) {
    return (
      <div className="text-center py-12">
        <p className="text-muted font-medium">Contact not found.</p>
        <Link href="/leads/cold" className="text-primary font-bold mt-2 inline-block">← Back to leads</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-in-out pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/leads/cold">
          <NeoButton variant="secondary" size="sm" className="flex items-center gap-2">
            <ArrowLeft size={16} /> Back
          </NeoButton>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <NeoCard className="p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center font-black text-primary text-2xl shadow-neumorph-pressed">
              {contact.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{contact.name}</h1>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_COLORS[contact.status] || "bg-muted/20 text-muted"}`}>
                {contact.status?.replace(/_/g, " ")}
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {contact.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail size={16} className="text-muted shrink-0" />
                <span className="font-medium text-foreground">{contact.email}</span>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone size={16} className="text-muted shrink-0" />
                <span className="font-medium text-foreground">{contact.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Building2 size={16} className="text-muted shrink-0" />
              <span className="font-medium text-foreground">{contact.company?.name || "—"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock size={16} className="text-muted shrink-0" />
              <span className="font-medium text-muted">
                {contact.type === "COLD" ? "❄️ Cold Lead" : "🔥 Warm Lead"}
              </span>
            </div>
          </div>

          {/* Tags */}
          {contact.tags?.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-2">
                <Tag size={14} className="text-muted" />
                <span className="text-xs font-bold text-muted uppercase tracking-wider">Tags</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {contact.tags.map((tag: any) => (
                  <span
                    key={tag.id}
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: tag.color + "20", color: tag.color }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </NeoCard>

        {/* Timeline & Deals */}
        <div className="lg:col-span-2 space-y-6">
          {/* Deals */}
          <NeoCard className="p-6">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <DollarSign size={20} className="text-success" /> Associated Deals
            </h2>
            {contact.deals?.length === 0 ? (
              <p className="text-muted text-sm">No deals associated with this contact.</p>
            ) : (
              <div className="space-y-3">
                {contact.deals?.map((deal: any) => (
                  <div key={deal.id} className="flex items-center justify-between p-3 rounded-xl shadow-neumorph-pressed">
                    <div>
                      <p className="font-bold text-foreground text-sm">{deal.title}</p>
                      <p className="text-xs text-muted">{deal.company?.name} • {deal.stage?.replace(/_/g, " ")}</p>
                    </div>
                    <span className="text-sm font-bold text-success">${Number(deal.value).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </NeoCard>

          {/* Activity Timeline */}
          <NeoCard className="p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Activity Timeline</h2>
            {activities?.length === 0 ? (
              <p className="text-muted text-sm">No activities recorded yet.</p>
            ) : (
              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-muted/20" />
                <div className="space-y-4">
                  {activities?.map((a: any) => {
                    const Icon = TYPE_ICONS[a.type] || FileText;
                    const colorClass = TYPE_COLORS[a.type] || "text-muted bg-muted/15";

                    return (
                      <div key={a.id} className="flex gap-4 relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 ${colorClass}`}>
                          <Icon size={16} />
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="text-sm font-semibold text-foreground">{a.content}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted font-medium">
                              {a.user?.name} • {formatDistanceToNow(new Date(a.timestamp), { addSuffix: true })}
                            </span>
                            {a.status === "COMPLETED" && (
                              <span className="text-xs font-bold text-success">✓ Done</span>
                            )}
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
