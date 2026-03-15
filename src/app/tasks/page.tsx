"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import NeoCard from "@/components/ui/NeoCard";
import NeoButton from "@/components/ui/NeoButton";
import NeoInput from "@/components/ui/NeoInput";
import NeoModal from "@/components/ui/NeoModal";
import { CheckCircle2, Circle, Plus, Calendar, Flag, Trash2 } from "lucide-react";
import { format, isToday, isPast, isFuture } from "date-fns";
import { toast } from "sonner";

const FILTERS = [
  { id: "all", label: "All Tasks" },
  { id: "today", label: "Today" },
  { id: "upcoming", label: "Upcoming" },
  { id: "overdue", label: "Overdue" },
  { id: "completed", label: "Completed" },
];

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: "text-danger",
  MEDIUM: "text-warning",
  LOW: "text-success",
};

export default function TasksPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ content: "", dueDate: "", priority: "MEDIUM" });

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks", filter],
    queryFn: async () => {
      const res = await fetch(`/api/tasks?filter=${filter}`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (task: any) => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...task, userId: "system" }),
      });
      if (!res.ok) throw new Error("Failed to create task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setModalOpen(false);
      setNewTask({ content: "", dueDate: "", priority: "MEDIUM" });
      toast.success("Task created");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: status === "PENDING" ? "COMPLETED" : "PENDING" }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task deleted");
    },
  });

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
          <h1 className="text-3xl font-bold text-foreground drop-shadow-sm">Tasks</h1>
          <p className="text-muted font-medium mt-1">Stay on top of your to-dos and follow-ups.</p>
        </div>
        <NeoButton onClick={() => setModalOpen(true)} className="flex items-center gap-2">
          <Plus size={18} /> New Task
        </NeoButton>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-surface shadow-neumorph-concave rounded-xl p-1 w-fit">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              filter === f.id
                ? "bg-primary text-white shadow-neumorph-flat-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {tasks?.length === 0 ? (
          <NeoCard className="p-8 text-center text-muted font-medium">
            No tasks found for this filter.
          </NeoCard>
        ) : (
          tasks?.map((task: any) => (
            <NeoCard
              key={task.id}
              className={`flex items-center gap-4 p-4 group hover:-translate-y-0.5 transition-all duration-200 ${
                task.status === "COMPLETED" ? "opacity-60" : ""
              }`}
            >
              <button
                onClick={() => toggleMutation.mutate({ id: task.id, status: task.status })}
                className="shrink-0 transition-colors"
              >
                {task.status === "COMPLETED" ? (
                  <CheckCircle2 size={22} className="text-success" />
                ) : (
                  <Circle size={22} className="text-muted hover:text-primary" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-foreground ${task.status === "COMPLETED" ? "line-through" : ""}`}>
                  {task.content}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  {task.dueDate && (
                    <span className={`text-xs font-medium flex items-center gap-1 ${
                      isPast(new Date(task.dueDate)) && task.status === "PENDING"
                        ? "text-danger"
                        : isToday(new Date(task.dueDate))
                        ? "text-primary"
                        : "text-muted"
                    }`}>
                      <Calendar size={12} />
                      {format(new Date(task.dueDate), "MMM d, yyyy")}
                    </span>
                  )}
                  <span className={`text-xs font-bold flex items-center gap-1 ${PRIORITY_COLORS[task.priority]}`}>
                    <Flag size={12} />
                    {task.priority}
                  </span>
                </div>
              </div>

              <button
                onClick={() => deleteMutation.mutate(task.id)}
                className="opacity-0 group-hover:opacity-100 text-muted hover:text-danger transition-all p-2"
              >
                <Trash2 size={16} />
              </button>
            </NeoCard>
          ))
        )}
      </div>

      {/* Create Task Modal */}
      <NeoModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Task">
        <div className="flex flex-col gap-5">
          <NeoInput
            placeholder="What needs to be done?"
            value={newTask.content}
            onChange={(e) => setNewTask({ ...newTask, content: e.target.value })}
          />
          <NeoInput
            type="date"
            value={newTask.dueDate}
            onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
          />
          <select
            value={newTask.priority}
            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
            className="px-4 py-3 rounded-xl bg-surface shadow-neumorph-concave text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="LOW">Low Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="HIGH">High Priority</option>
          </select>
          <NeoButton onClick={() => createMutation.mutate(newTask)} className="w-full">
            Create Task
          </NeoButton>
        </div>
      </NeoModal>
    </div>
  );
}
