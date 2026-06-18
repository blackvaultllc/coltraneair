import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertTriangle, KeyRound, Plus, X } from "lucide-react";

type Row = { id: string; email: string; full_name: string | null; title: string | null; department: string | null; created_at: string };

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({ meta: [{ title: "User Management" }, { name: "robots", content: "noindex" }] }),
  component: Users,
});

const ROLES = ["admin", "president", "employee", "customer"] as const;
type Role = typeof ROLES[number];

function Users() {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [rolesMap, setRolesMap] = useState<Record<string, Role[]>>({});
  const [progressMap, setProgressMap] = useState<Record<string, { completed: number; avgScore: number }>>({});

  async function load() {
    const [{ data: profiles }, { data: roles }, { data: prog }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id,role"),
      supabase.from("training_progress").select("user_id,status,score"),
    ]);
    setRows((profiles ?? []) as Row[]);
    const rmap: Record<string, Role[]> = {};
    ((roles ?? []) as { user_id: string; role: Role }[]).forEach((r) => { (rmap[r.user_id] ??= []).push(r.role); });
    setRolesMap(rmap);

    const pmap: Record<string, { completed: number; avgScore: number }> = {};
    const grouped: Record<string, { complete: number; scores: number[] }> = {};
    ((prog ?? []) as { user_id: string; status: string; score: number | null }[]).forEach((p) => {
      const g = grouped[p.user_id] ??= { complete: 0, scores: [] };
      if (p.status === "complete") g.complete++;
      if (typeof p.score === "number") g.scores.push(p.score);
    });
    for (const [uid, g] of Object.entries(grouped)) {
      pmap[uid] = { completed: g.complete, avgScore: g.scores.length ? Math.round(g.scores.reduce((a,b)=>a+b,0)/g.scores.length) : 0 };
    }
    setProgressMap(pmap);
  }

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  async function toggleRole(userId: string, role: Role, has: boolean) {
    if (has) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) return toast.error(error.message);
    }
    load();
  }

  async function resetPassword(email: string) {
    const redirectTo = `${window.location.origin}/auth`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) return toast.error(error.message);
    toast.success(`Reset email sent to ${email}.`);
  }

  if (!isAdmin) return (
    <AdminShell title="User Management">
      <div className="bg-destructive/10 border border-destructive/40 rounded-xl p-8 text-center">
        <AlertTriangle className="size-10 mx-auto text-destructive mb-3" />
        <p className="text-champagne">Admin only.</p>
      </div>
    </AdminShell>
  );

  return (
    <AdminShell title="User Management">
      <p className="text-sm text-muted-foreground mb-4">
        Assign roles, send password resets, and review training progress. Roles can be combined (e.g. President + Admin).
      </p>
      <div className="bg-surface/50 border border-gold/15 rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-background/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left p-3">Member</th>
              <th className="text-left p-3">Department</th>
              <th className="text-left p-3">Roles</th>
              <th className="text-left p-3">Training</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const userRoles = rolesMap[r.id] ?? [];
              const prog = progressMap[r.id];
              return (
                <tr key={r.id} className="border-t border-gold/10 align-top">
                  <td className="p-3">
                    <div className="text-champagne">{r.full_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{r.email}</div>
                    {r.title && <div className="text-[10px] text-gold/70 uppercase tracking-wider mt-1">{r.title}</div>}
                  </td>
                  <td className="p-3 text-muted-foreground">{r.department ?? "—"}</td>
                  <td className="p-3">
                    <div className="flex gap-1.5 flex-wrap">
                      {ROLES.map((role) => {
                        const has = userRoles.includes(role);
                        return (
                          <button key={role} onClick={() => toggleRole(r.id, role, has)}
                            className={`text-[10px] uppercase tracking-wider rounded px-2 py-1 border flex items-center gap-1 ${
                              has ? "bg-gold/15 text-gold border-gold/40" : "border-border text-muted-foreground hover:border-gold/30"
                            }`}>
                            {has ? <X className="size-2.5" /> : <Plus className="size-2.5" />} {role}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  <td className="p-3">
                    {prog ? (
                      <div className="text-xs">
                        <div className="text-champagne">{prog.completed} modules complete</div>
                        <div className="text-muted-foreground">Avg quiz: {prog.avgScore || "—"}%</div>
                      </div>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => resetPassword(r.email)}
                      className="text-xs flex items-center gap-1.5 px-3 py-1.5 border border-gold/30 rounded hover:bg-gold/10 text-gold">
                      <KeyRound className="size-3" /> Send Reset
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
