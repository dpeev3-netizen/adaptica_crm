"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/store/useAuth";
import {
  Send,
  Hash,
  Paperclip,
  ImagePlus,
  SmilePlus,
  MessageSquare,
  X,
  FileText,
  Download,
  Reply,
  Users,
  ChevronDown,
  CornerDownRight,
} from "lucide-react";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { Toaster, toast } from "sonner";
import "./chat.css";
import { fetchWithToken } from '@/lib/api';

const EMOJI_LIST = ["👍", "❤️", "😂", "🎉", "🔥", "👀", "💯", "🙌", "😍", "🤔", "👏", "✅"];

// ─── Types ───────────────────────────────────────────────────
interface ChatUser {
  id: string;
  name: string;
  avatar?: string | null;
  username?: string;
}

interface Reaction {
  id: string;
  emoji: string;
  userId: string;
  user: ChatUser;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  sender: ChatUser;
  timestamp: string;
  parentId?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
  reactions: Reaction[];
  _count: { replies: number };
  parent?: {
    id: string;
    content: string;
    sender: { name: string };
    fileUrl?: string | null;
    fileName?: string | null;
  } | null;
}

interface ChannelMember {
  id: string;
  userId: string;
  user: ChatUser;
  lastRead: string;
}

interface Channel {
  id: string;
  name: string;
  description?: string | null;
  members: ChannelMember[];
  messages: { content: string; timestamp: string; senderId: string }[];
  _count: { messages: number };
}

// ─── Helpers ─────────────────────────────────────────────────
function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function isImageType(type: string | null | undefined) {
  return type?.startsWith("image/");
}

function formatMessageTime(date: Date) {
  return format(date, "h:mm a");
}

function formatDateDivider(date: Date) {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, MMMM d");
}

function shouldShowDateDivider(current: string, previous?: string) {
  if (!previous) return true;
  const a = new Date(current).toDateString();
  const b = new Date(previous).toDateString();
  return a !== b;
}

function shouldGroupMessages(current: Message, previous?: Message) {
  if (!previous) return false;
  if (current.senderId !== previous.senderId) return false;
  const diff = new Date(current.timestamp).getTime() - new Date(previous.timestamp).getTime();
  return diff < 5 * 60 * 1000; // 5 minutes
}

const handleDownload = async (e: React.MouseEvent, url: string, filename: string) => {
  e.preventDefault();
  e.stopPropagation();
  // Using a dedicated backend API route ensures the browser is forced to download
  // the file with the correct 'Content-Disposition: attachment' headers.
  window.location.href = `/api/chat/download?url=${encodeURIComponent(url)}&name=${encodeURIComponent(filename)}`;
};

// ─── Avatar Component ────────────────────────────────────────
function UserAvatar({ user, size = "md" }: { user: ChatUser; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = { sm: "w-6 h-6 text-[10px]", md: "w-9 h-9 text-xs", lg: "w-10 h-10 text-sm" };
  const colors = [
    "bg-[#E91E63] text-white",
    "bg-[#2196F3] text-white",
    "bg-[#4CAF50] text-white",
    "bg-[#FF9800] text-white",
    "bg-[#9C27B0] text-white",
    "bg-[#00BCD4] text-white",
  ];
  const colorIdx = user.name.charCodeAt(0) % colors.length;

  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        className={`${sizeClasses[size]} rounded-lg object-cover`}
      />
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${colors[colorIdx]} rounded-lg flex items-center justify-center font-bold shrink-0`}>
      {getInitials(user.name)}
    </div>
  );
}

// ─── Message Component ──────────────────────────────────────
function ChatMessageItem({
  msg,
  isGrouped,
  currentUserId,
  onReply,
  onReact,
  onImageClick,
  onQuoteClick,
}: {
  msg: Message;
  isGrouped: boolean;
  currentUserId: string;
  onReply: (msg: Message) => void;
  onReact: (messageId: string, emoji: string) => void;
  onImageClick: (url: string) => void;
  onQuoteClick?: (parentId: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiRef = useRef<HTMLDivElement>(null);

  // Group reactions by emoji
  const reactionGroups = msg.reactions.reduce<Record<string, { count: number; users: string[]; hasCurrentUser: boolean }>>(
    (acc, r) => {
      if (!acc[r.emoji]) acc[r.emoji] = { count: 0, users: [], hasCurrentUser: false };
      acc[r.emoji].count++;
      acc[r.emoji].users.push(r.user.name);
      if (r.userId === currentUserId) acc[r.emoji].hasCurrentUser = true;
      return acc;
    },
    {}
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  return (
    <div
      className={`slack-message ${isGrouped ? "grouped" : ""}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowEmojiPicker(false);
      }}
    >
      {/* Action toolbar */}
      {showActions && (
        <div className="message-actions">
          <button
            className="action-btn"
            title="React"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <SmilePlus size={16} />
          </button>
          <button className="action-btn" title="Reply in thread" onClick={() => onReply(msg)}>
            <MessageSquare size={16} />
          </button>
        </div>
      )}

      {/* Emoji picker popup */}
      {showEmojiPicker && (
        <div className="emoji-picker" ref={emojiRef}>
          {EMOJI_LIST.map((emoji) => (
            <button
              key={emoji}
              className="emoji-btn"
              onClick={() => {
                onReact(msg.id, emoji);
                setShowEmojiPicker(false);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {!isGrouped ? (
        <div className="message-full">
          <UserAvatar user={msg.sender} />
          <div className="message-body">
            <div className="message-meta">
              <span className="sender-name">{msg.sender.name}</span>
              <span className="message-time">
                {formatMessageTime(new Date(msg.timestamp))}
              </span>
            </div>
            {msg.parent && (
              <div 
                className="inline-quote" 
                onClick={() => onQuoteClick && onQuoteClick(msg.parent!.id)}
              >
                <div className="quote-indicator" />
                <div className="quote-content">
                  <span className="quote-sender">{msg.parent.sender.name}</span>
                  <p>{msg.parent.content || (msg.parent.fileName ? `📎 ${msg.parent.fileName}` : "Attachment")}</p>
                </div>
              </div>
            )}
            <div className="message-content">{msg.content}</div>
            {msg.fileUrl && <FileAttachment msg={msg} onImageClick={onImageClick} />}
            {Object.keys(reactionGroups).length > 0 && (
              <div className="reactions-bar">
                {Object.entries(reactionGroups).map(([emoji, data]) => (
                  <button
                    key={emoji}
                    className={`reaction-pill ${data.hasCurrentUser ? "active" : ""}`}
                    onClick={() => onReact(msg.id, emoji)}
                    title={data.users.join(", ")}
                  >
                    <span>{emoji}</span>
                    <span className="reaction-count">{data.count}</span>
                  </button>
                ))}
                <button
                  className="reaction-pill add-reaction"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <SmilePlus size={14} />
                </button>
              </div>
            )}
            {msg._count.replies > 0 && (
              <button className="thread-indicator" onClick={() => onReply(msg)}>
                <MessageSquare size={14} />
                <span>{msg._count.replies} {msg._count.replies === 1 ? "reply" : "replies"}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="message-grouped">
          <span className="grouped-time">{formatMessageTime(new Date(msg.timestamp))}</span>
          <div className="message-body">
            {msg.parent && (
              <div 
                className="inline-quote" 
                onClick={() => onQuoteClick && onQuoteClick(msg.parent!.id)}
              >
                <div className="quote-indicator" />
                <div className="quote-content">
                  <span className="quote-sender">{msg.parent.sender.name}</span>
                  <p>{msg.parent.content || (msg.parent.fileName ? `📎 ${msg.parent.fileName}` : "Attachment")}</p>
                </div>
              </div>
            )}
            <div className="message-content">{msg.content}</div>
            {msg.fileUrl && <FileAttachment msg={msg} onImageClick={onImageClick} />}
            {Object.keys(reactionGroups).length > 0 && (
              <div className="reactions-bar">
                {Object.entries(reactionGroups).map(([emoji, data]) => (
                  <button
                    key={emoji}
                    className={`reaction-pill ${data.hasCurrentUser ? "active" : ""}`}
                    onClick={() => onReact(msg.id, emoji)}
                    title={data.users.join(", ")}
                  >
                    <span>{emoji}</span>
                    <span className="reaction-count">{data.count}</span>
                  </button>
                ))}
                <button
                  className="reaction-pill add-reaction"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <SmilePlus size={14} />
                </button>
              </div>
            )}
            {msg._count.replies > 0 && (
              <button className="thread-indicator" onClick={() => onReply(msg)}>
                <MessageSquare size={14} />
                <span>{msg._count.replies} {msg._count.replies === 1 ? "reply" : "replies"}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── File Attachment Component ───────────────────────────────
function FileAttachment({ msg, onImageClick }: { msg: Message; onImageClick: (url: string) => void }) {
  if (isImageType(msg.fileType)) {
    return (
      <div className="attachment-image">
        <div className="attachment-image-preview" onClick={() => onImageClick(msg.fileUrl!)}>
          <img src={msg.fileUrl!} alt={msg.fileName || "Image"} />
          <div className="image-hover-actions" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={(e) => handleDownload(e, msg.fileUrl!, msg.fileName || "download")} 
              className="image-action-btn" 
              title="Download direct"
            >
              <Download size={16} />
            </button>
          </div>
        </div>
        <div className="attachment-image-info">
          <span>{msg.fileName}</span>
          {msg.fileSize && <span>{formatFileSize(msg.fileSize)}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="attachment-file">
      <div className="file-icon">
        <FileText size={24} />
      </div>
      <div className="file-info">
        <span className="file-name">{msg.fileName}</span>
        {msg.fileSize && <span className="file-size">{formatFileSize(msg.fileSize)}</span>}
      </div>
      <button 
        onClick={(e) => handleDownload(e, msg.fileUrl!, msg.fileName || "download")}
        className="file-download" 
        title="Download"
      >
        <Download size={16} />
      </button>
    </div>
  );
}

// ThreadPanel removed (replaced by inline replies)

// ─── Main Chat Page ──────────────────────────────────────────
export default function ChatPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const currentUserId = user?.id || "";

  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [replyMessage, setReplyMessage] = useState<Message | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [filePreview, setFilePreview] = useState<{
    file: File;
    preview: string;
    isImage: boolean;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const previousLatestMessageIds = useRef<Record<string, string>>({});

  // ─── Fetch channels (server auto-seeds on first access) ──
  const { data: channels, isLoading: channelsLoading } = useQuery<Channel[]>({
    queryKey: ["channels"],
    queryFn: async () => {
      const res = await fetchWithToken('/chat/channels');
      if (!res.ok) throw new Error("Failed to fetch channels");
      return res.json();
    },
    refetchInterval: 5000,
  });

  // ─── Fetch all users for DMs ───────────────────────────────
  const { data: users, isLoading: usersLoading } = useQuery<ChatUser[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetchWithToken('/users');
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const groupChannels = channels?.filter((c) => !c.name.startsWith("dm_")) || [];
  const dmChannels = channels?.filter((c) => c.name.startsWith("dm_")) || [];

  // Auto-select first channel
  useEffect(() => {
    if (groupChannels.length > 0 && !selectedChannel && !channelsLoading) {
      setSelectedChannel(groupChannels[0].id);
    }
  }, [groupChannels, selectedChannel, channelsLoading]);

  // ─── Fetch messages ───────────────────────────────────────
  const { data: messages } = useQuery<Message[]>({
    queryKey: ["messages", selectedChannel],
    queryFn: async () => {
      const res = await fetchWithToken(`/chat/channels/${selectedChannel}/messages`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: !!selectedChannel,
    refetchInterval: 3000,
  });

  // ─── Send message mutation ────────────────────────────────
  const sendMutation = useMutation({
    mutationFn: async (payload: {
      content: string;
      parentId?: string;
      fileUrl?: string;
      fileName?: string;
      fileType?: string;
      fileSize?: number;
    }) => {
      const res = await fetch(`/api/chat/channels/${selectedChannel}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to send");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", selectedChannel] });
      queryClient.invalidateQueries({ queryKey: ["channels"] });
      setMessage("");
      setFilePreview(null);
      setReplyMessage(null);
    },
  });

  // ─── Upload file mutation ─────────────────────────────────
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetchWithToken('/chat/upload', { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
  });

  // ─── React to message ─────────────────────────────────────
  const reactMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      const res = await fetch(`/api/chat/channels/${selectedChannel}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, emoji }),
      });
      if (!res.ok) throw new Error("Failed to react");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", selectedChannel] });
      if (replyMessage) {
        queryClient.invalidateQueries({ queryKey: ["messages", selectedChannel] });
      }
    },
  });

  // ─── Mark as read mutation ────────────────────────────────
  const markAsReadMutation = useMutation({
    mutationFn: async (channelId: string) => {
      await fetchWithToken(`/chat/channels/${channelId}/read`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] });
    },
  });

  // ─── Scroll to bottom ─────────────────────────────────────
  useEffect(() => {
    if (messages && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      
      // Mark as read if we are looking at this channel
      if (selectedChannel) {
        markAsReadMutation.mutate(selectedChannel);
      }
    }
  }, [messages, selectedChannel]);

  // ─── Toast Notifications for Unread ───────────────────────
  useEffect(() => {
    if (!channels) return;
    
    channels.forEach(ch => {
      if (ch.messages.length > 0) {
        const latestMsg = ch.messages[0];
        const prevId = previousLatestMessageIds.current[ch.id];
        
        // If there is a new message, and it's not from us, and we are not currently viewing this channel
        if (latestMsg.senderId !== currentUserId && ch.id !== selectedChannel) {
          // Identify if it's truly new or just an initial fetch
          if (prevId && prevId !== latestMsg.timestamp) {
            toast.message(`New message in ${ch.name.startsWith("dm_") ? "Direct Messages" : "#" + ch.name}`, {
              description: latestMsg.content || "Sent an attachment"
            });
          }
        }
        previousLatestMessageIds.current[ch.id] = latestMsg.timestamp;
      }
    });
  }, [channels, currentUserId, selectedChannel]);

  // ─── Handlers ─────────────────────────────────────────────
  const handleSend = async () => {
    if (!message.trim() && !filePreview) return;

    let fileData: any = {};
    if (filePreview) {
      const result = await uploadMutation.mutateAsync(filePreview.file);
      fileData = result;
    }

    sendMutation.mutate({
      content: message,
      parentId: replyMessage?.id,
      ...fileData,
    });
  };

  const scrollToMessage = useCallback((messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("highlight-pulse");
      setTimeout(() => el.classList.remove("highlight-pulse"), 2000);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, imageOnly?: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const preview = isImage ? URL.createObjectURL(file) : "";

    setFilePreview({ file, preview, isImage });
    e.target.value = "";
  };

  const handleReact = useCallback(
    (messageId: string, emoji: string) => {
      reactMutation.mutate({ messageId, emoji });
    },
    [reactMutation]
  );

  const handleUserClick = async (targetUserId: string) => {
    const sortedIds = [currentUserId, targetUserId].sort();
    const dmName = `dm_${sortedIds[0]}_${sortedIds[1]}`;
    const existing = dmChannels.find((c) => c.name === dmName);
    
    if (existing) {
      setSelectedChannel(existing.id);
      setReplyMessage(null);
      return;
    }

    try {
      const res = await fetch("/api/chat/dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });
      if (res.ok) {
        const { channelId } = await res.json();
        await queryClient.invalidateQueries({ queryKey: ["channels"] });
        setSelectedChannel(channelId);
        setReplyMessage(null);
      }
    } catch (err) {
      console.error("Failed to open DM", err);
    }
  };

  const selectedChannelData = channels?.find((c) => c.id === selectedChannel);
  const isSelectedDm = selectedChannelData?.name.startsWith("dm_");
  const otherUser = isSelectedDm
    ? selectedChannelData?.members.find((m) => m.userId !== currentUserId)?.user ||
      selectedChannelData?.members[0]?.user
    : null;

  const hasUnread = (channel: Channel) => {
    if (channel.id === selectedChannel) return false;
    if (channel.messages.length === 0) return false;
    
    const member = channel.members.find(m => m.userId === currentUserId);
    if (!member) return false;

    // Compare latest message timestamp with user's lastRead timestamp
    return new Date(channel.messages[0].timestamp) > new Date(member.lastRead);
  };

  return (
    <div className="slack-chat-container">
      <Toaster position="top-right" theme="system" richColors />
      
      {/* ─── Lightbox Modal ─────────────────────────────────────── */}
      {lightboxImage && (
        <div className="lightbox-overlay" onClick={() => setLightboxImage(null)}>
          <button className="lightbox-close" onClick={() => setLightboxImage(null)}>
            <X size={24} />
          </button>
          <img src={lightboxImage} alt="Fullscreen" className="lightbox-image" />
        </div>
      )}

      {/* ─── Channel Sidebar ─────────────────────────────────── */}
      <div className="channel-sidebar">
        <div className="sidebar-header">
          <h2>AdapticaCRM</h2>
          <ChevronDown size={16} />
        </div>

        <div className="channel-list">
          <div className="channel-section-label">
            <ChevronDown size={12} />
            <span>Channels</span>
          </div>
          {channelsLoading ? (
            <div className="channel-loading">Loading...</div>
          ) : (
            groupChannels.map((ch) => {
              const unread = hasUnread(ch);
              return (
                <button
                  key={ch.id}
                  onClick={() => {
                    setSelectedChannel(ch.id);
                    setReplyMessage(null);
                  }}
                  className={`channel-item ${selectedChannel === ch.id ? "active" : ""} ${unread ? "unread" : ""}`}
                >
                  <Hash size={16} />
                  <span className="flex-1 text-left">{ch.name}</span>
                  {unread && <div className="unread-dot" />}
                </button>
              );
            })
          )}
        </div>

        {/* Direct Messages list */}
        <div className="member-list">
          <div className="channel-section-label">
            <Users size={12} />
            <span>Direct Messages</span>
          </div>
          {usersLoading ? (
            <div className="channel-loading">Loading...</div>
          ) : (
            users?.map((u) => {
              const sortedIds = [currentUserId, u.id].sort();
              const dmName = `dm_${sortedIds[0]}_${sortedIds[1]}`;
              const isActive = selectedChannelData?.name === dmName;
              const dmChannel = dmChannels.find(c => c.name === dmName);
              const unread = dmChannel ? hasUnread(dmChannel) : false;

              return (
                <button
                  key={u.id}
                  onClick={() => handleUserClick(u.id)}
                  className={`channel-item ${isActive ? "active" : ""} ${unread ? "unread" : ""}`}
                  style={{ opacity: 1 }}
                >
                  <div className="member-avatar-wrap">
                    <UserAvatar user={u} size="sm" />
                    <div className="online-dot" />
                  </div>
                  <span className="member-name ml-1 flex-1 text-left">
                    {u.name}
                    {u.id === currentUserId && <span className="you-tag"> (you)</span>}
                  </span>
                  {unread && <div className="unread-dot" />}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ─── Main Message Area ───────────────────────────────── */}
      <div className="message-area">
        {!selectedChannel ? (
          <div className="empty-state">
            <Hash size={48} strokeWidth={1} />
            <p>Select a channel to start chatting</p>
          </div>
        ) : (
          <>
            {/* Channel header */}
            <div className="channel-header">
              <div className="channel-header-left">
                {isSelectedDm && otherUser ? (
                  <>
                    <UserAvatar user={otherUser} size="sm" />
                    <h2>{otherUser.name}</h2>
                  </>
                ) : (
                  <>
                    <Hash size={20} />
                    <h2>{selectedChannelData?.name}</h2>
                  </>
                )}
              </div>
              {!isSelectedDm && selectedChannelData?.description && (
                <span className="channel-description">{selectedChannelData.description}</span>
              )}
              <div className="channel-header-right">
                <div className="member-avatars">
                  {selectedChannelData?.members.slice(0, 3).map((m) => (
                    <UserAvatar key={m.id} user={m.user} size="sm" />
                  ))}
                  {selectedChannelData && selectedChannelData.members.length > 3 && (
                    <div className="member-count">+{selectedChannelData.members.length - 3}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Messages feed */}
            <div className="messages-feed">
              <div className="channel-intro">
                <div className="channel-intro-icon">
                  {isSelectedDm && otherUser ? <UserAvatar user={otherUser} size="lg" /> : <Hash size={28} />}
                </div>
                <h2>
                  {isSelectedDm && otherUser ? `Direct Message with ${otherUser.name}` : `Welcome to #${selectedChannelData?.name}`}
                </h2>
                <p>
                  {isSelectedDm
                    ? `This is the start of your direct message history with ${otherUser?.name}.`
                    : `This is the start of the #${selectedChannelData?.name} channel.`}
                </p>
              </div>

              {messages?.map((msg, i) => {
                const prev = messages[i - 1];
                const showDate = shouldShowDateDivider(msg.timestamp, prev?.timestamp);
                const isGrouped = !showDate && shouldGroupMessages(msg, prev);

                return (
                  <div key={msg.id} id={`msg-${msg.id}`}>
                    {showDate && (
                      <div className="date-divider">
                        <span>{formatDateDivider(new Date(msg.timestamp))}</span>
                      </div>
                    )}
                    <ChatMessageItem
                      msg={msg}
                      isGrouped={isGrouped}
                      currentUserId={currentUserId}
                      onReply={setReplyMessage}
                      onReact={handleReact}
                      onImageClick={setLightboxImage}
                      onQuoteClick={scrollToMessage}
                    />
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* File preview strip */}
            {filePreview && (
              <div className="file-preview-strip">
                {filePreview.isImage ? (
                  <img src={filePreview.preview} alt="preview" className="file-preview-thumb" />
                ) : (
                  <div className="file-preview-icon">
                    <FileText size={20} />
                  </div>
                )}
                <div className="file-preview-info">
                  <span className="file-preview-name">{filePreview.file.name}</span>
                  <span className="file-preview-size">{formatFileSize(filePreview.file.size)}</span>
                </div>
                <button
                  className="file-preview-remove"
                  onClick={() => {
                    if (filePreview.preview) URL.revokeObjectURL(filePreview.preview);
                    setFilePreview(null);
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Reply Banner */}
            {replyMessage && (
              <div className="reply-banner">
                <div className="reply-banner-content">
                  <Reply size={16} />
                  <span>Replying to <strong>{replyMessage.sender.name}</strong></span>
                  <p className="reply-banner-text">{replyMessage.content || "Attachment"}</p>
                </div>
                <button onClick={() => setReplyMessage(null)} className="reply-banner-close">
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Input bar */}
            <div className="input-bar">
              <div className="input-container">
                <div className="input-actions-left">
                  <button
                    className="input-action-btn"
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach a file"
                  >
                    <Paperclip size={18} />
                  </button>
                  <button
                    className="input-action-btn"
                    onClick={() => imageInputRef.current?.click()}
                    title="Upload an image"
                  >
                    <ImagePlus size={18} />
                  </button>
                </div>
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={`Message #${selectedChannelData?.name || "channel"}`}
                  className="message-input"
                />
                <button
                  onClick={handleSend}
                  disabled={!message.trim() && !filePreview}
                  className="send-btn"
                >
                  <Send size={18} />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => handleFileSelect(e)}
              />
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e, true)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
