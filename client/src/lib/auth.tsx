import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useLocation } from "wouter";

export type AdminRole = "admin" | "cluster_leader" | "screener";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;           // comma-separated: "admin", "admin,screener", etc.
  createdAt: string;
}

// Parse the comma-separated role string into an array
export function parseRoles(role: string | undefined | null): string[] {
  if (!role) return [];
  return role.split(",").map(r => r.trim()).filter(Boolean);
}

// Check whether a user has at least one of the given roles
export function hasRole(user: { role: string } | null | undefined, ...roles: string[]): boolean {
  if (!user?.role) return false;
  const userRoles = parseRoles(user.role);
  return roles.some(r => userRoles.includes(r));
}

// Display label for the primary (first) role — or all roles joined
export function roleLabel(role: string | undefined | null): string {
  const labels: Record<string, string> = {
    admin: "Leadership",
    cluster_leader: "Cluster Leader",
    screener: "Screener",
  };
  return parseRoles(role).map(r => labels[r] || r).join(" · ");
}

interface AuthContextValue {
  user: AdminUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => setUser(data?.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(username: string, password: string) {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Login failed");
    }
    const data = await res.json();
    setUser(data.user);
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST", credentials: "include" });
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}

export function RequireAdminAuth({ children, roles }: { children: ReactNode; roles?: string[] }) {
  const { user, loading } = useAdminAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-white/50 text-sm">Loading...</div>
    </div>
  );

  if (!user) return null;

  if (roles && !hasRole(user, ...roles)) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-center">
        <p className="text-red-400 font-semibold">Access Denied</p>
        <p className="text-white/50 text-sm mt-1">You don't have permission to view this page.</p>
      </div>
    </div>
  );

  return <>{children}</>;
}
