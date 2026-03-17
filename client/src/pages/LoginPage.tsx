import { useState } from "react";
import type { User } from "../lib/types";
import { api } from "../lib/api";
import { Avatar } from "../components/Avatar";
import { PlatformBadge } from "../components/Badge";

interface LoginPageProps {
  users: User[];
  onLogin: (user: User) => void;
  onRefresh: () => void;
}

export function LoginPage({ users, onLogin, onRefresh }: LoginPageProps) {
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [platform, setPlatform] = useState<"microsoft" | "google" | "other">("microsoft");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const user = await api.createUser({ name, email, platform });
      onRefresh();
      onLogin(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fejl");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 shadow-lg">
            <span className="text-2xl text-white font-bold">C</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">ColabTool</h1>
          <p className="text-muted-foreground mt-1">Cross-platform projektplanlægning</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-6">
          {!showNew ? (
            <>
              <h2 className="font-semibold mb-4">Vælg din profil</h2>
              <div className="space-y-2 mb-4">
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => onLogin(u)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-secondary hover:border-primary/40 transition-all text-left"
                  >
                    <Avatar name={u.name} color={u.avatar_color} platform={u.platform} showPlatform />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{u.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                    </div>
                    <PlatformBadge platform={u.platform} />
                  </button>
                ))}
              </div>
              <button onClick={() => setShowNew(true)} className="w-full py-2 text-sm text-primary hover:underline">
                + Opret ny bruger
              </button>
            </>
          ) : (
            <>
              <h2 className="font-semibold mb-4">Ny bruger</h2>
              <form onSubmit={handleCreate} className="space-y-3">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Navn *" required className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email *" type="email" required className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40" />
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Platform</label>
                  <select value={platform} onChange={(e) => setPlatform(e.target.value as "microsoft" | "google" | "other")} className="w-full text-sm border rounded-lg px-3 py-2">
                    <option value="microsoft">Microsoft (Teams, Todo m.m.)</option>
                    <option value="google">Google (Workspace m.m.)</option>
                    <option value="other">Andet</option>
                  </select>
                </div>
                {error && <p className="text-xs text-destructive">{error}</p>}
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowNew(false)} className="flex-1 py-2 text-sm rounded-lg border hover:bg-secondary">Tilbage</button>
                  <button type="submit" disabled={loading} className="flex-1 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                    {loading ? "Opretter..." : "Opret & log ind"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
