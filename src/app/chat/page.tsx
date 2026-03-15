"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import NeoCard from "@/components/ui/NeoCard";
import NeoButton from "@/components/ui/NeoButton";
import { Send, MessageCircle, Plus, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import NeoModal from "@/components/ui/NeoModal";

// For now we'll use a hardcoded userId - in production this comes from session
const CURRENT_USER_ID = "current-user";

export default function ChatPage() {
  const queryClient = useQueryClient();
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [newChatModal, setNewChatModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch all users for new chat
  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  // Fetch conversations
  const { data: conversations } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await fetch(`/api/chat?userId=${CURRENT_USER_ID}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // Fetch messages for selected conversation
  const { data: messages } = useQuery({
    queryKey: ["messages", selectedConv],
    queryFn: async () => {
      if (!selectedConv) return [];
      const res = await fetch(`/api/chat/${selectedConv}?userId=${CURRENT_USER_ID}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!selectedConv,
    refetchInterval: 3000,
  });

  // Send message
  const sendMutation = useMutation({
    mutationFn: async ({ conversationId, content, receiverId }: any) => {
      const res = await fetch(`/api/chat/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId: CURRENT_USER_ID, receiverId, content }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", selectedConv] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setMessage("");
    },
  });

  // Start new conversation
  const newConvMutation = useMutation({
    mutationFn: async (otherUserId: string) => {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userAId: CURRENT_USER_ID, userBId: otherUserId }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setSelectedConv(data.id);
      setNewChatModal(false);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectedConvData = conversations?.find((c: any) => c.id === selectedConv);
  const otherUser = selectedConvData
    ? selectedConvData.userAId === CURRENT_USER_ID
      ? selectedConvData.userB
      : selectedConvData.userA
    : null;

  const handleSend = () => {
    if (!message.trim() || !selectedConv || !otherUser) return;
    sendMutation.mutate({
      conversationId: selectedConv,
      content: message,
      receiverId: otherUser.id,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-in-out h-[calc(100vh-10rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground drop-shadow-sm">Chat Hub</h1>
          <p className="text-muted font-medium mt-1">Message your team members.</p>
        </div>
        <NeoButton onClick={() => setNewChatModal(true)} className="flex items-center gap-2">
          <Plus size={18} /> New Chat
        </NeoButton>
      </div>

      <div className="flex gap-6 h-[calc(100%-5rem)]">
        {/* Conversations List */}
        <NeoCard className="w-80 shrink-0 flex flex-col overflow-hidden p-0">
          <div className="p-4 border-b border-background/50">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                placeholder="Search conversations..."
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface shadow-neumorph-concave text-sm font-medium text-foreground placeholder:text-muted focus:outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {!conversations?.length ? (
              <div className="p-6 text-center text-muted text-sm">
                <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
                No conversations yet
              </div>
            ) : (
              conversations.map((conv: any) => {
                const other = conv.userAId === CURRENT_USER_ID ? conv.userB : conv.userA;
                const lastMsg = conv.messages?.[0];
                const isSelected = selectedConv === conv.id;

                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConv(conv.id)}
                    className={`w-full p-4 flex items-center gap-3 text-left transition-all border-b border-background/30 ${
                      isSelected ? "bg-primary/5 shadow-neumorph-pressed" : "hover:bg-background/30"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 font-bold text-primary text-sm">
                      {other?.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground text-sm truncate">{other?.name}</span>
                        {conv.unreadCount > 0 && (
                          <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      {lastMsg && (
                        <p className="text-xs text-muted truncate mt-0.5">{lastMsg.content}</p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </NeoCard>

        {/* Messages Area */}
        <NeoCard className="flex-1 flex flex-col overflow-hidden p-0">
          {!selectedConv ? (
            <div className="flex-1 flex items-center justify-center text-muted">
              <div className="text-center">
                <MessageCircle size={48} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">Select a conversation to start chatting</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-4 border-b border-background/50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm">
                  {otherUser?.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <span className="font-bold text-foreground">{otherUser?.name || "User"}</span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages?.map((msg: any) => {
                  const isSent = msg.senderId === CURRENT_USER_ID;
                  return (
                    <div key={msg.id} className={`flex ${isSent ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm font-medium ${
                          isSent
                            ? "bg-primary text-white rounded-br-md"
                            : "shadow-neumorph-pressed text-foreground rounded-bl-md"
                        }`}
                      >
                        <p>{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isSent ? "text-white/70" : "text-muted"}`}>
                          {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-background/50">
                <div className="flex gap-3">
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-3 rounded-xl bg-surface shadow-neumorph-concave text-foreground font-medium placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!message.trim()}
                    className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center shadow-neumorph-flat-sm hover:bg-primary-dark active:shadow-neumorph-pressed transition-all disabled:opacity-50"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </NeoCard>
      </div>

      {/* New Chat Modal */}
      <NeoModal isOpen={newChatModal} onClose={() => setNewChatModal(false)} title="Start New Chat">
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {users?.filter((u: any) => u.id !== CURRENT_USER_ID).map((user: any) => (
            <button
              key={user.id}
              onClick={() => newConvMutation.mutate(user.id)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:shadow-neumorph-pressed transition-all text-left"
            >
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm">
                {user.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">{user.name}</p>
                <p className="text-xs text-muted">{user.email}</p>
              </div>
            </button>
          ))}
          {(!users || users.length <= 1) && (
            <p className="text-muted text-sm text-center py-4">No other team members found.</p>
          )}
        </div>
      </NeoModal>
    </div>
  );
}
