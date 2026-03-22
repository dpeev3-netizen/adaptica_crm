"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState } from "react";
import NeoInput from "@/components/ui/NeoInput";
import NeoButton from "@/components/ui/NeoButton";
import RichTextEditor from "@/components/activity/RichTextEditor";
import { History, MessageSquare, PhoneCall, ListTodo, CornerDownRight } from "lucide-react";
import { fetchWithToken } from '@/lib/api';

interface ActivityFeedProps {
  entityId: string;
  entityType: "CONTACT" | "DEAL";
}

export default function ActivityFeed({ entityId, entityType }: ActivityFeedProps) {
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const { data: timeline, isLoading } = useQuery({
    queryKey: ["activities", entityId],
    queryFn: async () => {
      const res = await fetchWithToken(`/activities?entityId=${entityId}&entityType=${entityType}`);
      if (!res.ok) throw new Error("Failed to fetch timeline");
      return res.json();
    },
    enabled: !!entityId,
  });

  const generateMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string, parentId?: string }) => {
      const res = await fetchWithToken(`/activities`, {
        method: "POST",
        body: JSON.stringify({
          entityId,
          entityType,
          type: "NOTE",
          content,
          parentId
        }),
      });
      if (!res.ok) throw new Error("Failed to post note");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities", entityId] });
      setNewNote("");
      setReplyContent("");
      setReplyingTo(null);
    },
  });

  const handlePostNote = () => {
    // Strip empty HTML tags
    const cleanNote = newNote.replace(/<p><\/p>/g, "").trim();
    if (cleanNote) {
      generateMutation.mutate({ content: cleanNote });
    }
  };

  const handlePostReply = (parentId: string) => {
    const cleanNote = replyContent.replace(/<p><\/p>/g, "").trim();
    if (cleanNote) {
      generateMutation.mutate({ content: cleanNote, parentId });
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
                <div className={`text-sm ${item.isAudit ? "text-muted italic" : "text-foreground font-medium"} prose prose-sm max-w-none`} dangerouslySetInnerHTML={{ __html: item.content }} />
                
                {!item.isAudit && (
                  <div className="mt-3 border-t border-background/50 pt-2 flex items-center gap-4">
                    <button 
                      onClick={() => setReplyingTo(replyingTo === item.id ? null : item.id)}
                      className="text-xs font-bold text-muted hover:text-primary transition-colors flex items-center gap-1"
                    >
                      <CornerDownRight size={14} /> Reply
                    </button>
                  </div>
                )}
                
                {/* Render Replies */}
                {item.replies && item.replies.length > 0 && (
                  <div className="mt-4 space-y-3 pl-4 border-l-2 border-background/50">
                    {item.replies.map((reply: any) => (
                      <div key={reply.id} className="bg-background/30 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-foreground text-xs">{reply.user}</span>
                          <span className="text-[10px] text-muted font-bold whitespace-nowrap">
                            {format(new Date(reply.timestamp), "MMM d, h:mm a")}
                          </span>
                        </div>
                        <div className="text-xs text-foreground font-medium prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: reply.content }} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Input block */}
                {replyingTo === item.id && (
                  <div className="mt-3 pl-4 border-l-2 border-primary/20 space-y-2 animate-in fade-in slide-in-from-top-2">
                    <RichTextEditor 
                      content={replyContent} 
                      onChange={setReplyContent} 
                      onSubmit={() => handlePostReply(item.id)}
                      placeholder={`Reply to ${item.user}...`}
                    />
                    <div className="flex justify-end gap-2">
                      <NeoButton variant="secondary" size="sm" onClick={() => setReplyingTo(null)}>Cancel</NeoButton>
                      <NeoButton size="sm" onClick={() => handlePostReply(item.id)} disabled={!replyContent.trim() || generateMutation.isPending}>Reply</NeoButton>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-surface border-t-2 border-background shadow-neumorph-flat sticky bottom-0 z-10">
        <div className="flex items-end gap-3">
          <div className="flex-1">
              <RichTextEditor 
                content={newNote} 
                onChange={setNewNote} 
                onSubmit={handlePostNote}
                placeholder="Write a note... Press Enter to post"
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
