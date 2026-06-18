import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { DeptGuard } from "@/components/dept-guard";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MODULES, type Quiz } from "@/lib/training-curriculum";
import { CheckCircle2, Circle, ChevronDown, GraduationCap, Trophy, Clock } from "lucide-react";

type Progress = {
  module_id: string;
  status: string;
  score: number | null;
  hours_logged: Record<string, number> | null;
};

export const Route = createFileRoute("/_authenticated/admin/training")({
  head: () => ({ meta: [{ title: "Training Academy" }, { name: "robots", content: "noindex" }] }),
  component: Training,
});

const HOUR_BUCKETS = [
  { key: "total", label: "Total", target: 40 },
  { key: "instructor", label: "With Instructor", target: 20 },
  { key: "solo", label: "Solo", target: 10 },
  { key: "xc_solo", label: "Cross-Country Solo", target: 3 },
  { key: "night", label: "Night", target: 3 },
  { key: "instrument", label: "Instrument", target: 3 },
];

function Training() {
  const { user, isAdmin } = useAuth();
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [open, setOpen] = useState<string | null>(null);

  async function load() {
    if (!user) return;
    const { data } = await supabase.from("training_progress").select("*").eq("user_id", user.id);
    const map: Record<string, Progress> = {};
    ((data ?? []) as Progress[]).forEach((p) => (map[p.module_id] = p));
    setProgress(map);
  }
  useEffect(() => { load(); }, [user?.id]);

  async function upsert(module_id: string, patch: Partial<Progress>) {
    if (!user) return;
    const existing = progress[module_id];
    const next = {
      user_id: user.id,
      module_id,
      status: patch.status ?? existing?.status ?? "in_progress",
      score: patch.score ?? existing?.score ?? null,
      hours_logged: patch.hours_logged ?? existing?.hours_logged ?? null,
    };
    const { error } = await supabase.from("training_progress").upsert(next, { onConflict: "user_id,module_id" });
    if (error) return toast.error(error.message);
    load();
  }

  const completed = Object.values(progress).filter((p) => p.status === "complete").length;
  const avgScore = useMemo(() => {
    const scores = Object.values(progress).map((p) => p.score).filter((s): s is number => s !== null);
    return scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  }, [progress]);
  const totalHours = (progress.m3?.hours_logged?.total ?? 0);

  return (
    <AdminShell title="Training Academy">
      <DeptGuard deptSlug="training">
        <div className="mb-6 grid sm:grid-cols-3 gap-4">
          <StatCard icon={GraduationCap} label="Modules Complete" value={`${completed}/${MODULES.length}`} />
          <StatCard icon={Trophy} label="Quiz Average" value={avgScore ? `${avgScore}%` : "—"} />
          <StatCard icon={Clock} label="Hours Logged" value={`${totalHours}/40`} />
        </div>

        <div className="space-y-3">
          {MODULES.map((m) => {
            const p = progress[m.id];
            const status = p?.status ?? "not_started";
            const isOpen = open === m.id;
            return (
              <div key={m.id} className="bg-surface/50 border border-gold/15 rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpen(isOpen ? null : m.id)}
                  className="w-full flex items-center justify-between p-5 hover:bg-gold/5"
                >
                  <div className="flex items-center gap-4 text-left">
                    {status === "complete" ? <CheckCircle2 className="size-5 text-success" /> : <Circle className="size-5 text-muted-foreground" />}
                    <div>
                      <div className="font-display text-xl text-champagne">{m.title}</div>
                      <div className="text-xs text-muted-foreground">{m.summary}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={status} />
                    <ChevronDown className={`size-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-gold/15 p-6 space-y-5">
                    <pre className="text-sm whitespace-pre-wrap font-body text-foreground/90">{m.body}</pre>

                    {("tracker" in m && m.tracker) && (
                      <HoursTracker progress={p} onSave={(hours) => upsert(m.id, { status: "in_progress", hours_logged: hours })} />
                    )}

                    {("maneuvers" in m && m.maneuvers) && (
                      <ManeuverChecklist
                        maneuvers={m.maneuvers as unknown as string[]}
                        progress={p}
                        onUpdate={(score) => upsert(m.id, { score, status: score === 100 ? "complete" : "in_progress" })}
                      />
                    )}

                    {m.quizzes.length > 0 && (
                      <QuizBlock
                        quizzes={m.quizzes as unknown as Quiz[]}
                        onDone={(score) => upsert(m.id, { score, status: score >= 70 ? "complete" : "in_progress" })}
                      />
                    )}

                    {m.quizzes.length === 0 && !("tracker" in m) && !("maneuvers" in m) && (
                      <button
                        onClick={() => upsert(m.id, { status: "complete" })}
                        className="gradient-gold text-gold-foreground font-medium px-5 py-2 rounded-md hover:opacity-90"
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {isAdmin && <AdminProgressView />}
      </DeptGuard>
    </AdminShell>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof GraduationCap; label: string; value: string }) {
  return (
    <div className="bg-surface/50 border border-gold/20 rounded-lg p-5">
      <Icon className="size-5 text-gold mb-2" />
      <div className="font-display text-3xl text-champagne">{value}</div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    not_started: "bg-muted text-muted-foreground border-border",
    in_progress: "bg-gold/10 text-gold border-gold/30",
    complete: "bg-success/15 text-success border-success/40",
  };
  const label = { not_started: "Not Started", in_progress: "In Progress", complete: "Complete" }[status] ?? status;
  return <span className={`text-[10px] uppercase tracking-wider border rounded px-2 py-0.5 ${map[status]}`}>{label}</span>;
}

function HoursTracker({ progress, onSave }: { progress: Progress | undefined; onSave: (hours: Record<string, number>) => void }) {
  const [hours, setHours] = useState<Record<string, number>>(progress?.hours_logged ?? {});
  useEffect(() => { setHours(progress?.hours_logged ?? {}); }, [progress?.module_id]);
  return (
    <div className="space-y-3">
      <h4 className="font-display text-lg text-champagne">Log Your Hours</h4>
      <div className="grid sm:grid-cols-2 gap-3">
        {HOUR_BUCKETS.map((b) => {
          const v = hours[b.key] ?? 0;
          const pct = Math.min(100, (v / b.target) * 100);
          return (
            <div key={b.key} className="bg-background/40 border border-gold/10 rounded p-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-foreground/90">{b.label}</span>
                <span className="text-muted-foreground">{v}/{b.target} hrs</span>
              </div>
              <input
                type="number" min={0} step="0.1" value={v}
                onChange={(e) => setHours({ ...hours, [b.key]: parseFloat(e.target.value) || 0 })}
                className="w-full bg-background border border-gold/20 rounded px-2 py-1 text-sm"
              />
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full gradient-gold" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <button onClick={() => onSave(hours)} className="gradient-gold text-gold-foreground font-medium px-5 py-2 rounded-md hover:opacity-90">
        Save Progress
      </button>
    </div>
  );
}

function ManeuverChecklist({ maneuvers, progress, onUpdate }: { maneuvers: string[]; progress: Progress | undefined; onUpdate: (score: number) => void }) {
  const initialDone = useMemo(() => {
    const s = progress?.score ?? 0;
    const n = Math.round((s / 100) * maneuvers.length);
    return new Set(maneuvers.slice(0, n));
  }, [progress?.module_id]);
  const [done, setDone] = useState<Set<string>>(initialDone);

  function toggle(m: string) {
    const next = new Set(done);
    next.has(m) ? next.delete(m) : next.add(m);
    setDone(next);
    onUpdate(Math.round((next.size / maneuvers.length) * 100));
  }

  return (
    <div>
      <h4 className="font-display text-lg text-champagne mb-2">Maneuver Checklist</h4>
      <div className="grid sm:grid-cols-2 gap-1.5">
        {maneuvers.map((m) => (
          <label key={m} className="flex items-center gap-2 text-sm border border-gold/10 rounded px-3 py-1.5 hover:bg-gold/5 cursor-pointer">
            <input type="checkbox" checked={done.has(m)} onChange={() => toggle(m)} className="accent-[color:var(--gold)]" />
            <span className={done.has(m) ? "text-champagne line-through" : ""}>{m}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function QuizBlock({ quizzes, onDone }: { quizzes: Quiz[]; onDone: (score: number) => void }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const score = useMemo(() => {
    if (!submitted) return 0;
    const correct = quizzes.filter((q, i) => answers[i] === q.correct).length;
    return Math.round((correct / quizzes.length) * 100);
  }, [submitted, answers, quizzes]);

  function submit() {
    setSubmitted(true);
    const correct = quizzes.filter((q, i) => answers[i] === q.correct).length;
    const s = Math.round((correct / quizzes.length) * 100);
    onDone(s);
  }

  return (
    <div className="space-y-4">
      <h4 className="font-display text-lg text-champagne">Knowledge Quiz</h4>
      {quizzes.map((q, i) => (
        <div key={i} className="bg-background/40 border border-gold/10 rounded p-4">
          <p className="text-sm mb-3"><span className="text-gold">Q{i + 1}.</span> {q.question}</p>
          {q.image && (
            <figure className="mb-3">
              <img src={q.image} alt={q.imageCaption ?? "Question illustration"} className="rounded border border-gold/20 max-w-full h-auto" />
              {q.imageCaption && <figcaption className="text-[11px] text-muted-foreground mt-1">{q.imageCaption}</figcaption>}
            </figure>
          )}
          <div className="space-y-1.5">
            {q.options.map((opt, j) => {
              const chosen = answers[i] === j;
              const isCorrect = q.correct === j;
              const cls = submitted
                ? isCorrect ? "border-success/60 bg-success/10" : chosen ? "border-destructive/60 bg-destructive/10" : "border-gold/10"
                : chosen ? "border-gold bg-gold/10" : "border-gold/10 hover:border-gold/30";
              const optImg = q.optionImages?.[j];
              return (
                <label key={j} className={`flex items-center gap-3 text-sm border rounded px-3 py-2 cursor-pointer ${cls}`}>
                  <input type="radio" name={`q${i}`} disabled={submitted} checked={chosen}
                    onChange={() => setAnswers({ ...answers, [i]: j })} className="accent-[color:var(--gold)]" />
                  {optImg && <img src={optImg} alt={opt} className="w-20 h-12 object-cover rounded border border-gold/15 shrink-0" />}
                  <span className="flex-1">{opt}</span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
      {!submitted ? (
        <button onClick={submit} disabled={Object.keys(answers).length < quizzes.length}
          className="gradient-gold text-gold-foreground font-medium px-5 py-2 rounded-md disabled:opacity-50">
          Submit Quiz
        </button>
      ) : (
        <div className={`p-4 border rounded-lg ${score >= 70 ? "border-success/40 bg-success/10" : "border-destructive/40 bg-destructive/10"}`}>
          <p className="font-display text-2xl text-champagne">Score: {score}%</p>
          <p className="text-sm text-muted-foreground mt-1">
            {score >= 70 ? "Passed — module marked complete." : `Need 70% to pass. Review and retake. Weak areas: ${quizzes.filter((q, i) => answers[i] !== q.correct).length} question(s) missed.`}
          </p>
        </div>
      )}
    </div>
  );
}

function AdminProgressView() {
  const [rows, setRows] = useState<{ email: string; module_id: string; status: string; score: number | null }[]>([]);
  useEffect(() => {
    (async () => {
      const { data: prog } = await supabase.from("training_progress").select("user_id,module_id,status,score");
      const { data: profs } = await supabase.from("profiles").select("id,email");
      const emailMap = Object.fromEntries(((profs ?? []) as { id: string; email: string }[]).map((p) => [p.id, p.email]));
      setRows(((prog ?? []) as { user_id: string; module_id: string; status: string; score: number | null }[])
        .map((r) => ({ email: emailMap[r.user_id] ?? r.user_id, module_id: r.module_id, status: r.status, score: r.score })));
    })();
  }, []);
  return (
    <div className="mt-10">
      <h2 className="font-display text-2xl text-champagne mb-3">All Trainee Progress (Admin)</h2>
      <div className="bg-surface/50 border border-gold/15 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-background/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="text-left p-3">Trainee</th><th className="text-left p-3">Module</th><th className="text-left p-3">Status</th><th className="text-left p-3">Score</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No progress recorded.</td></tr>}
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-gold/10">
                <td className="p-3">{r.email}</td>
                <td className="p-3">{MODULES.find((m) => m.id === r.module_id)?.title ?? r.module_id}</td>
                <td className="p-3"><StatusBadge status={r.status} /></td>
                <td className="p-3">{r.score ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
