import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { BRAND_SHORT } from "@/lib/brand";
import { MODULES } from "@/lib/training-curriculum";
import { Plane, GraduationCap, Users2, Wallet, ScrollText, ShieldAlert, Activity as ActivityIcon, MessagesSquare, NotebookPen, Trophy } from "lucide-react";
import { TermsGate } from "@/components/terms-gate";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: `Dashboard — ${BRAND_SHORT}` }, { name: "robots", content: "noindex" }] }),
  component: AdminHome,
});

type Person = { id: string; email: string; full_name: string | null; title: string | null; department: string | null };
type Dept = { id: string; name: string; slug: string; status: string };
type ActivityItem = { kind: "message" | "training"; who: string; what: string; when: string };

function AdminHome() {
  const { profile, isAdmin } = useAuth();
  const [people, setPeople] = useState<Person[]>([]);
  const [depts, setDepts] = useState<Dept[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [training, setTraining] = useState({ avg: 0, completed: 0, totalSubmissions: 0, lowScores: 0 });
  const [waitlist, setWaitlist] = useState(0);

  useEffect(() => {
    (async () => {
      const [peopleRes, deptRes, msgRes, trainRes, waitRes] = await Promise.all([
        supabase.from("profiles").select("id,email,full_name,title,department").order("full_name"),
        supabase.from("departments").select("*").order("name"),
        supabase.from("comms").select("id,user_id,message,created_at").order("created_at", { ascending: false }).limit(8),
        supabase.from("training_progress").select("user_id,module_id,status,score,updated_at").order("updated_at", { ascending: false }),
        isAdmin ? supabase.from("waitlist").select("id", { count: "exact", head: true }) : Promise.resolve({ count: 0 }),
      ]);

      const peopleRows = (peopleRes.data ?? []) as Person[];
      setPeople(peopleRows);
      setDepts((deptRes.data ?? []) as Dept[]);
      setWaitlist(waitRes.count ?? 0);

      const counts: Record<string, number> = {};
      (deptRes.data ?? []).forEach((d) => {
        counts[d.id] = peopleRows.filter((p) =>
          (p.department ?? "").toLowerCase().includes(d.name.toLowerCase()) ||
          (p.department ?? "").toLowerCase() === d.slug.toLowerCase(),
        ).length;
      });
      setMemberCounts(counts);

      const trainRows = (trainRes.data ?? []) as { user_id: string; status: string; score: number | null; module_id: string; updated_at: string }[];
      const scores = trainRows.map((r) => r.score).filter((s): s is number => s !== null);
      setTraining({
        avg: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
        completed: trainRows.filter((r) => r.status === "complete").length,
        totalSubmissions: scores.length,
        lowScores: scores.filter((s) => s < 70).length,
      });

      const nameOf = (uid: string) => {
        const p = peopleRows.find((x) => x.id === uid);
        return p?.full_name ?? p?.email ?? "Team member";
      };
      const fromMessages: ActivityItem[] = (msgRes.data ?? []).map((m) => ({
        kind: "message",
        who: nameOf(m.user_id),
        what: m.message.length > 80 ? m.message.slice(0, 80) + "…" : m.message,
        when: m.created_at,
      }));
      const fromTraining: ActivityItem[] = trainRows.slice(0, 8).map((t) => ({
        kind: "training",
        who: nameOf(t.user_id),
        what: `${t.status === "complete" ? "Completed" : "Worked on"} ${MODULES.find((m) => m.id === t.module_id)?.title ?? t.module_id}${t.score !== null ? ` · ${t.score}%` : ""}`,
        when: t.updated_at,
      }));
      const feed = [...fromMessages, ...fromTraining].sort((a, b) => (a.when < b.when ? 1 : -1)).slice(0, 12);
      setActivity(feed);
    })();
  }, [isAdmin]);

  const activeDepts = depts.filter((d) => d.status === "active");

  return (
    <AdminShell title="Command Dashboard">
      <TermsGate>
        <p className="text-muted-foreground mb-8">
          Welcome back, <span className="text-champagne">{profile?.full_name ?? profile?.email}</span>
          {isAdmin && <span className="ml-2 text-[10px] uppercase tracking-wider text-gold/80">· Admin governance view</span>}
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPI label="Active Departments" value={`${activeDepts.length}/${depts.length}`} Icon={ShieldAlert} />
          <KPI label="Personnel" value={people.length.toString()} Icon={Users2} />
          <KPI label="Training Avg" value={training.avg ? `${training.avg}%` : "—"} sub={`${training.totalSubmissions} submissions · ${training.lowScores} below 70%`} Icon={Trophy} />
          <KPI label="Waitlist" value={isAdmin ? waitlist.toString() : "—"} Icon={Plane} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-10">
          <section className="lg:col-span-2 border border-gold/15 rounded-lg bg-card">
            <header className="px-5 py-3 border-b border-gold/15 flex items-center justify-between">
              <h2 className="font-display text-lg text-champagne flex items-center gap-2"><ShieldAlert className="size-4 text-gold" /> Active Departments</h2>
              <span className="text-xs text-muted-foreground">{activeDepts.length} active</span>
            </header>
            {depts.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">No departments configured yet.</p>
            ) : (
              <ul className="divide-y divide-gold/10">
                {depts.map((d) => (
                  <li key={d.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <div className="text-champagne text-sm">{d.name}</div>
                      <div className="text-[11px] text-muted-foreground">{memberCounts[d.id] ?? 0} member{(memberCounts[d.id] ?? 0) === 1 ? "" : "s"}</div>
                    </div>
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${
                      d.status === "active" ? "border-success/40 bg-success/10 text-success"
                      : d.status === "inactive" ? "border-muted text-muted-foreground"
                      : "border-gold/30 bg-gold/5 text-gold"
                    }`}>{d.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="border border-gold/15 rounded-lg bg-card">
            <header className="px-5 py-3 border-b border-gold/15 flex items-center gap-2">
              <ActivityIcon className="size-4 text-gold" />
              <h2 className="font-display text-lg text-champagne">Recent Activity</h2>
            </header>
            {activity.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">Nothing yet.</p>
            ) : (
              <ul className="divide-y divide-gold/10 max-h-[420px] overflow-y-auto">
                {activity.map((a, i) => {
                  const Icon = a.kind === "message" ? MessagesSquare : GraduationCap;
                  return (
                    <li key={i} className="px-5 py-3 flex items-start gap-3 text-sm">
                      <Icon className="size-4 text-gold/70 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-champagne text-xs">{a.who}</div>
                        <div className="text-foreground/80 text-xs truncate">{a.what}</div>
                        <div className="text-[10px] text-muted-foreground">{new Date(a.when).toLocaleString()}</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {isAdmin && (
          <section className="border border-gold/15 rounded-lg bg-card mb-10 overflow-hidden">
            <header className="px-5 py-3 border-b border-gold/15 flex items-center justify-between">
              <h2 className="font-display text-lg text-champagne flex items-center gap-2"><Users2 className="size-4 text-gold" /> Personnel Directory</h2>
              <Link to="/admin/users" className="text-xs text-gold hover:underline">Manage roles →</Link>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-sidebar/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left px-5 py-2 font-medium">Name</th>
                    <th className="text-left px-5 py-2 font-medium">Email</th>
                    <th className="text-left px-5 py-2 font-medium">Title</th>
                    <th className="text-left px-5 py-2 font-medium">Department</th>
                  </tr>
                </thead>
                <tbody>
                  {people.length === 0 && <tr><td colSpan={4} className="px-5 py-4 text-muted-foreground">No personnel yet.</td></tr>}
                  {people.map((p) => (
                    <tr key={p.id} className="border-t border-gold/10 hover:bg-sidebar/30">
                      <td className="px-5 py-2 text-champagne">{p.full_name ?? "—"}</td>
                      <td className="px-5 py-2 text-muted-foreground">{p.email}</td>
                      <td className="px-5 py-2 text-muted-foreground">{p.title ?? "—"}</td>
                      <td className="px-5 py-2 text-muted-foreground">{p.department ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <h2 className="font-display text-2xl text-champagne mb-4">Departments</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { to: "/admin/flight-ops", name: "Flight Operations", icon: Plane },
            { to: "/admin/training", name: "Training Academy", icon: GraduationCap, primary: true },
            { to: "/admin/finance", name: "Finance", icon: Wallet },
            { to: "/admin/customer-relations", name: "Customer Relations", icon: Users2 },
            { to: "/admin/compliance", name: "Compliance & Legal", icon: ScrollText },
          ].map((d) => (
            <Link key={d.to} to={d.to as "/admin"}
              className={`block p-6 rounded-lg border transition-all hover:scale-[1.01] ${
                d.primary ? "border-gold/60 bg-gold/5" : "border-gold/15 bg-surface/40 hover:border-gold/40"
              }`}>
              <d.icon className="size-6 text-gold mb-3" />
              <div className="font-display text-xl text-champagne">{d.name}</div>
              {d.primary && <div className="text-xs text-gold mt-1">Primary Module</div>}
            </Link>
          ))}
        </div>
      </TermsGate>
    </AdminShell>
  );
}

function KPI({ label, value, sub, Icon }: { label: string; value: string; sub?: string; Icon: typeof Plane }) {
  return (
    <div className="bg-surface/50 border border-gold/20 rounded-lg p-5">
      <Icon className="size-5 text-gold mb-3" />
      <div className="font-display text-3xl text-champagne">{value}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{label}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}
