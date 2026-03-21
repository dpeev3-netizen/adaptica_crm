"use client";

import { useAuth } from "@/store/useAuth";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://adaptica-crm.onrender.com/api";
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: username, password }),
      });

      if (!res.ok) {
        setError("Invalid username or password");
        setLoading(false);
      } else {
        const data = await res.json();
        login(data.token, data.user);
        router.push("/");
      }
    } catch {
      setError("Network error");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-10 rounded-3xl shadow-neumorph-flat bg-surface">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-foreground tracking-tight">
            Adaptica<span className="text-primary">CRM</span>
          </h1>
          <p className="text-muted font-medium mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-danger/10 text-danger text-sm font-medium text-center">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-surface shadow-neumorph-concave text-foreground font-medium placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
              placeholder="Enter your username"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-surface shadow-neumorph-concave text-foreground font-medium placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-white font-bold text-base shadow-neumorph-flat-sm hover:bg-primary-dark active:shadow-neumorph-pressed transition-all duration-200 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
