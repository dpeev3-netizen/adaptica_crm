"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState } from "react";
import NeoInput from "@/components/ui/NeoInput";
import NeoButton from "@/components/ui/NeoButton";
import { History, MessageSquare, PhoneCall, ListTodo } from "lucide-react";

interface ActivityFeedProps {
  entityId: string;
  entityType: "CONTACT" | "DEAL";
}

export default function ActivityFeed({ entityId, entityType }: ActivityFeedProps) {
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState("");

  const { data: timeline, isLoading } = useQuery({
    queryKey: ["activities", entityId],
    queryFn: async () => {
      const res = await fetch(`/api/activities/${entityId}`);
      if (!res.ok) throw new Error("Failed to fetch timeline");
      return res.json();
    },
    enabled: !!entityId,
  });

  const generateMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/activities/${entityId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType,
          type: "NOTE",
          content,
        }),
      });
      if (!res.ok) throw new Error("Failed to post note");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities", entityId] });
      setNewNote("");
    },
  });

  const handlePostNote = () => {
    if (newNote.trim()) {
      generateMutation.mutate(newNote);
    }
  };

  const getIcon = (type: string, isAudit: boolean) => {
    if (isAudit) return <History size={16} />;
    switch (type) {
      case "CALL": return <PhoneCall size={16} />;
      case "TASK": return <ListTodo size={16} />;
      default: return <MessageSquare size={16} />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Timeline List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin w-6 h-6 rounded-full border-2 border-primary border-t-transparent shadow-neumorph-pressed"></div>
          </div>
        ) : timeline?.length === 0 ? (
          <p className="text-center text-muted text-sm font-medium py-8">No activity recorded yet.</p>
        ) : (
          timeline?.map((item: any) => (
            <div key={`${item.id}-${item.isAudit}`} className="relative pl-6">
              {/* Timeline dot/line */}
              <div className="absolute left-0 top-1 h-full w-px bg-background/50">
                <div className={`absolute -left-[9px] w-5 h-5 rounded-full flex items-center justify-center shadow-neumorph-flat-sm ${
                  item.isAudit ? "bg-surface text-muted" : "bg-primary text-white"
                }`}>
                  {getIcon(item.type, item.isAudit)}
                </div>
              </div>

              <div className="bg-surface rounded-xl p-4 shadow-neumorph-pressed ml-2">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-foreground text-sm">
                    {item.user} {item.isAudit ? "made an update" : "left a note"}
                  </span>
                  <span className="text-xs text-muted font-medium whitespace-nowrap ml-4">
                    {format(new Date(item.timestamp), "MMM d, h:mm a")}
                  </span>
                </div>
                <p className={`text-sm ${item.isAudit ? "text-muted italic" : "text-foreground font-medium"}`}>
                  {item.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-surface border-t-2 border-background shadow-neumorph-flat sticky bottom-0 z-10">
        <div className="flex items-end gap-3">
          <div className="flex-1">
             <NeoInput
               placeholder="Write a note..."
               value={newNote}
               onChange={(e) => setNewNote(e.target.value)}
               onKeyDown={(e) => {
                 if (e.key === "Enter" && !e.shiftKey) {
                   e.preventDefault();
                   handlePostNote();
                 }
               }}
             />
          </div>
          <NeoButton 
            onClick={handlePostNote}
            disabled={!newNote.trim() || generateMutation.isPending}
            className="mb-1"
          >
            Post
          </NeoButton>
        </div>
      </div>
    </div>
  );
}
