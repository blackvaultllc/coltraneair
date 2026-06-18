import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { MODULES } from "@/lib/training-curriculum";
import { GraduationCap, Trophy, Users2, TrendingUp } from "lucide-react";

type Row = {
  user_id: string;
  full_name: string | null;
  email: string;
  department: string | null;
  completed: number;
  avgScore: number | null;
  lastActivity: string | null;
};

export const Route = createFileRoute("/_authenticated/admin/academy-dashboard")({
  head: () => ({ meta: [{ title: "Academy Dashboard" }, { name: "robots", content: "noindex" }] }),
  component: AcademyDashboard,
});

function AcademyDashboard() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const totalModules = MODULES.length;

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      setLoading(true);
      const [{ data: profiles }, { data: progress }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, department"),
        supabase.from("training_progress").select("user_id, status, score, updated_at"),
      ]);

      const byUser = new Map<string, { completed: number; scores: number[]; last: string | null }>();
      (progress ?? []).forEach((p) => {
        const entry = byUser.get(p.user_id) ?? { completed: 0, scores: [], last: null };
        if (p.status === "completed") entry.completed += 1;
        if (typeof p.score === "number") entry.scores.push(p.score);
        if (p.updated_at && (!entry.last || p.updated_at > entry.last)) entry.last = p.updated_at;
        byUser.set(p.user_id, entry);
      });

      const built: Row[] = (profiles ?? []).map((p) => {
        const e = byUser.get(p.id);
        const avg = e && e.scores.length ? e.scores.reduce((a, b) => a + b, 0) / e.scores.length : null;
        return {
          user_id: p.id,
          full_name: p.full_name,
          email: p.email,
          department: p.department,
          completed: e?.completed ?? 0,
          avgScore: avg,
          lastActivity: e?.last ?? null,
        };
      });

      built.sort((a, b) => b.completed - a.completed || (b.avgScore ?? 0) - (a.avgScore ?? 0));
      setRows(built);
      setLoading(false);
    })();
  }, [isAdmin]);

  const stats = useMemo(() => {
    const active = rows.filter((r) => r.completed > 0 || r.avgScore !== null);
    const scores = rows.map((r) => r.avgScore).filter((s): s is number => s !== null);
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const fullyCertified = rows.filter((r) => r.completed === totalModules).length;
    return { totalUsers: rows.length, activeUsers: active.length, avg, fullyCertified };
  }, [rows, totalModules]);

  if (authLoading) {
    return <AdminShell title="Academy Dashboard"><p className="text-muted-foreground">Loading…</p></AdminShell>;
  }
  if (!isAdmin) {
    return (
      <AdminShell title="Academy Dashboard">
        <p className="text-muted-foreground">Admin access required.</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Academy Dashboard">
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard icon={Users2} label="Members" value={stats.totalUsers.toString()} sub={`${stats.activeUsers} active`} />
          <StatCard icon={GraduationCap} label="Modules" value={totalModules.toString()} sub="curriculum total" />
          <StatCard icon={TrendingUp} label="Average Quiz Score" value={`${Math.round(stats.avg)}%`} sub="across all submissions" />
          <StatCard icon={Trophy} label="Fully Certified" value={stats.fullyCertified.toString()} sub="completed every module" />
        </div>

        <div className="border border-gold/15 rounded-lg overflow-hidden bg-card">
          <div className="px-5 py-3 border-b border-gold/15 flex items-center justify-between">
            <h2 className="font-display text-lg text-champagne">Member Progress</h2>
            <span className="text-xs text-muted-foreground">{rows.length} record{rows.length === 1 ? "" : "s"}</span>
          </div>
          {loading ? (
            <p className="p-6 text-sm text-muted-foreground">Loading roster…</p>
          ) : rows.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No members yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-sidebar/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium">Member</th>
                    <th className="text-left px-5 py-3 font-medium">Department</th>
                    <th className="text-left px-5 py-3 font-medium">Modules</th>
                    <th className="text-left px-5 py-3 font-medium">Completion</th>
                    <th className="text-left px-5 py-3 font-medium">Avg Quiz Score</th>
                    <th className="text-left px-5 py-3 font-medium">Last Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const pct = Math.round((r.completed / totalModules) * 100);
                    return (
                      <tr key={r.user_id} className="border-t border-gold/10 hover:bg-sidebar/30">
                        <td className="px-5 py-3">
                          <div className="text-champagne">{r.full_name ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">{r.email}</div>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">{r.department ?? "—"}</td>
                        <td className="px-5 py-3 text-muted-foreground">{r.completed} / {totalModules}</td>
                        <td className="px-5 py-3 w-48">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                              <div className="h-full bg-gold" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground w-9 text-right">{pct}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          {r.avgScore === null ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <span className={r.avgScore >= 70 ? "text-gold" : "text-destructive"}>
                              {Math.round(r.avgScore)}%
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-xs text-muted-foreground">
                          {r.lastActivity ? new Date(r.lastActivity).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}

function StatCard({ icon: Icon, label, value, sub }: { icon: typeof Users2; label: string; value: string; sub: string }) {
  return (
    <div className="border border-gold/15 rounded-lg p-5 bg-card">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className="size-4 text-gold/70" />
      </div>
      <div className="mt-3 font-display text-3xl text-champagne">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}
