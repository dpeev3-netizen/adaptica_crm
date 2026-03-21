"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/store/useAuth";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const useSocket = () => useContext(SocketContext);

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function SocketProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();
  const user = useAuth((s) => s.user);

  useEffect(() => {
    if (!user?.id) return;

    // Connect to Socket.IO server
    const socket = io(API_URL, {
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      // Join user-specific room and workspace room
      socket.emit("join", user.id);
      if (user.workspaceId) {
        socket.emit("join_workspace", user.workspaceId);
      }
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    // Listen for incoming chat messages — invalidate chat queries
    socket.on("new_message", (message: any) => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
      queryClient.invalidateQueries({ queryKey: ["chat-channels"] });
    });

    // Listen for incoming notifications — invalidate notifications query
    socket.on("new_notification", (notification: any) => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [user?.id, user?.workspaceId, queryClient]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
