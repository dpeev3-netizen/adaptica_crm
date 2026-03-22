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
import { fetchWithToken } from '@/lib/api';
import ErrorBoundary from "@/components/ErrorBoundary";

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
  const [newTask, setNewTask] = useState<{ content: string; dueDate: string; priority: string; assigneeIds: string[] }>({ 
    content: "", dueDate: "", priority: "MEDIUM", assigneeIds: [] 
  });

  // Fetch users for assignment drop-down
  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetchWithToken("/users");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks", filter],
    queryFn: async () => {
      const res = await fetchWithToken(`/tasks?filter=${filter}`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (task: any) => {
      const res = await fetchWithToken("/tasks", {
        method: "POST",
        body: JSON.stringify({ ...task, userId: "system" }),
      });
      if (!res.ok) throw new Error("Failed to create task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setModalOpen(false);
      setNewTask({ content: "", dueDate: "", priority: "MEDIUM", assigneeIds: [] });
      toast.success("Task created");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create task");
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetchWithToken(`/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: status === "PENDING" ? "COMPLETED" : "PENDING" }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Task updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetchWithToken(`/tasks/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
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
          <h1 className="md-headline-medium text-on-surface">Tasks</h1>
          <p className="md-body-large text-on-surface-variant mt-1">Stay on top of your to-dos and follow-ups.</p>
        </div>
        <NeoButton onClick={() => setModalOpen(true)} className="flex items-center gap-2">
          <Plus size={18} /> New Task
        </NeoButton>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-surface-container border border-outline-variant rounded-xl p-1.5 w-max">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-5 py-2 rounded-lg md-label-large transition-all duration-300 ${
              filter === f.id
                ? "bg-primary-container text-on-primary-container font-bold"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Task List */}
      <ErrorBoundary>
        <div className="space-y-3">
          {tasks?.length === 0 ? (
            <NeoCard variant="outlined" className="p-8 text-center text-on-surface-variant font-medium bg-surface-container">
              No tasks found for this filter.
            </NeoCard>
          ) : (
            tasks?.map((task: any) => (
              <NeoCard
                variant="outlined"
                key={task.id}
                className={`flex items-center gap-4 p-4 group hover:-translate-y-1 hover:shadow-md transition-all duration-300 ${
                  task.status === "COMPLETED" ? "opacity-60 bg-surface-container-highest" : "bg-surface"
                }`}
              >
                <button
                  onClick={() => toggleMutation.mutate({ id: task.id, status: task.status })}
                  className="shrink-0 transition-colors"
                >
                  {task.status === "COMPLETED" ? (
                    <CheckCircle2 size={24} className="text-success" />
                  ) : (
                    <Circle size={24} className="text-on-surface-variant hover:text-primary" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <p className={`md-title-medium ${task.status === "COMPLETED" ? "line-through text-on-surface-variant" : "text-on-surface"}`}>
                    {task.content || "Empty Task"}
                  </p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="md-label-small flex items-center gap-1 text-on-surface-variant">
                      Added: {format(new Date(task.timestamp || task.createdAt || Date.now()), "MMM d, yyyy h:mm a")}
                    </span>
                    {task.dueDate && (
                      <span className={`md-label-small flex items-center gap-1 ${
                        isPast(new Date(task.dueDate)) && task.status === "PENDING"
                          ? "text-error"
                          : isToday(new Date(task.dueDate))
                          ? "text-primary"
                          : "text-on-surface-variant"
                      }`}>
                        <Calendar size={12} />
                        Due {format(new Date(task.dueDate), "MMM d, yyyy h:mm a")}
                      </span>
                    )}
                    <span className={`md-label-small flex items-center gap-1 ${PRIORITY_COLORS[task.priority]}`}>
                      <Flag size={12} />
                      {task.priority || "MEDIUM"}
                    </span>
                    
                    {task.assignees && task.assignees.length > 0 && (
                       <div className="flex -space-x-1 mt-1">
                          {task.assignees.map((u: any) => (
                             <div key={u.id} className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[9px] font-bold text-on-primary border border-surface shadow-sm" title={u.name}>
                               {u.name ? u.name.substring(0,2).toUpperCase() : "?"}
                             </div>
                          ))}
                       </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => deleteMutation.mutate(task.id)}
                  className="opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-error transition-all p-2"
                >
                  <Trash2 size={16} />
                </button>
              </NeoCard>
            ))
          )}
        </div>
      </ErrorBoundary>

      {/* Create Task Modal */}
      <NeoModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Task">
        <div className="flex flex-col gap-5">
          <NeoInput
            placeholder="What needs to be done?"
            value={newTask.content}
            onChange={(e) => setNewTask({ ...newTask, content: e.target.value })}
          />
          <div className="flex flex-col gap-2">
            <label className="md-label-medium font-bold text-on-surface-variant">Assign To</label>
            <div className="flex flex-wrap gap-2">
              {users?.map((u: any) => (
                <button
                  key={u.id}
                  onClick={() => {
                    const ids = newTask.assigneeIds.includes(u.id) 
                      ? newTask.assigneeIds.filter(id => id !== u.id) 
                      : [...newTask.assigneeIds, u.id];
                    setNewTask({ ...newTask, assigneeIds: ids });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all border ${
                    newTask.assigneeIds.includes(u.id) 
                      ? "bg-primary text-on-primary font-bold border-primary shadow-sm" 
                      : "bg-surface border-outline-variant text-on-surface hover:bg-surface-container"
                  }`}
                  type="button"
                >
                  {u.name}
                </button>
              ))}
            </div>
          </div>
          <NeoInput
            type="datetime-local"
            value={newTask.dueDate}
            onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
          />
          <select
            value={newTask.priority}
            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-surface border border-outline-variant text-on-surface md-body-medium focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
          >
            <option value="LOW" className="bg-surface">Low Priority</option>
            <option value="MEDIUM" className="bg-surface">Medium Priority</option>
            <option value="HIGH" className="bg-surface">High Priority</option>
          </select>
          <NeoButton onClick={() => createMutation.mutate(newTask)} className="w-full">
            Create Task
          </NeoButton>
        </div>
      </NeoModal>
    </div>
  );
}
