import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { AdminShell } from "@/components/admin-shell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pin, AlertTriangle, Archive, Trash2, Send, User, ShieldCheck } from "lucide-react";
import { COMPLIANCE_BANNER, checkContent, logAudit } from "@/lib/content-policy";

export const Route = createFileRoute("/_authenticated/admin/messages")({
  head: () => ({ meta: [{ title: "Communications Hub" }, { name: "robots", content: "noindex" }] }),
  component: Comms,
});

type Msg = {
  id: string;
  user_id: string;
  recipient_id: string | null;
  message: string;
  priority: "urgent" | "normal" | "archive";
  created_at: string;
  updated_at: string;
};
type Author = { id: string; full_name: string | null; email: string };
type Channel = "board" | "personal" | "direct";

const TABS: { value: Msg["priority"]; label: string; Icon: typeof Pin }[] = [
  { value: "urgent", label: "Urgent", Icon: AlertTriangle },
  { value: "normal", label: "Normal", Icon: Pin },
  { value: "archive", label: "Archive", Icon: Archive },
];

const CHANNELS: { value: Channel; label: string; Icon: typeof Pin }[] = [
  { value: "board", label: "Bulletin Board", Icon: Pin },
  { value: "personal", label: "Personal (only me)", Icon: User },
  { value: "direct", label: "Direct Message", Icon: Send },
];

function Comms() {
  const { user, isAdmin } = useAuth();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [authors, setAuthors] = useState<Record<string, Author>>({});
  const [people, setPeople] = useState<Author[]>([]);
  const [filter, setFilter] = useState<Msg["priority"]>("normal");
  const [channelView, setChannelView] = useState<Channel>("board");
  const [text, setText] = useState("");
  const [priority, setPriority] = useState<Msg["priority"]>("normal");
  const [channel, setChannel] = useState<Channel>("board");
  const [directTo, setDirectTo] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function load() {
    // Cast: types.ts hasn't regenerated for the new recipient_id column yet.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from("comms") as any).select("*").order("created_at", { ascending: false }).limit(300);
    const rows = (data ?? []) as Msg[];
    setMsgs(rows);
    const ids = [...new Set(rows.flatMap((r) => [r.user_id, r.recipient_id].filter(Boolean) as string[]))];
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id,full_name,email").in("id", ids);
      const map: Record<string, Author> = {};
      ((profs ?? []) as Author[]).forEach((p) => (map[p.id] = p));
      setAuthors(map);
    }
    const { data: allPeople } = await supabase.from("profiles").select("id,full_name,email").order("full_name");
    setPeople((allPeople ?? []) as Author[]);
  }
  useEffect(() => { load(); }, [user?.id]);

  function inView(m: Msg, view: Channel) {
    if (view === "board") return m.recipient_id === null;
    if (view === "personal") return m.recipient_id === user?.id && m.user_id === user?.id;
    return m.recipient_id !== null && !(m.recipient_id === user?.id && m.user_id === user?.id) &&
      (m.recipient_id === user?.id || m.user_id === user?.id);
  }

  async function post(e: FormEvent) {
    e.preventDefault();
    if (!user || !text.trim()) return;
    const verdict = checkContent(text);
    if (!verdict.ok) {
      toast.error(verdict.reason);
      await logAudit(supabase, user.id, "comms.blocked", "comms", { reason: verdict.reason, length: text.length });
      return;
    }
    setBusy(true);
    const recipient_id =
      channel === "personal" ? user.id
      : channel === "direct" ? (directTo || null)
      : null;
    if (channel === "direct" && !recipient_id) {
      setBusy(false);
      return toast.error("Pick a recipient for the direct message.");
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("comms") as any).insert({ user_id: user.id, message: text.trim(), priority, recipient_id });
    setBusy(false);
    if (error) return toast.error(error.message);
    await logAudit(supabase, user.id, "comms.post", "comms", { channel, priority });
    setText("");
    toast.success(channel === "personal" ? "Saved to your personal channel." : channel === "direct" ? "Sent." : "Posted to the board.");
    load();
  }

  async function remove(id: string) {
    if (!user) return;
    if (!confirm("Delete this message?")) return;
    const { error } = await supabase.from("comms").delete().eq("id", id);
    if (error) return toast.error(error.message);
    await logAudit(supabase, user.id, "comms.delete", "comms", { id });
    load();
  }

  async function changePriority(id: string, next: Msg["priority"]) {
    const { error } = await supabase.from("comms").update({ priority: next }).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  }

  const filtered = msgs.filter((m) => m.priority === filter && inView(m, channelView));

  return (
    <AdminShell title="Communications Hub">
      <div className="mb-5 flex items-start gap-3 text-xs border border-gold/20 bg-gold/5 rounded-md p-3">
        <ShieldCheck className="size-4 text-gold mt-0.5 shrink-0" />
        <p className="text-foreground/80">{COMPLIANCE_BANNER}</p>
      </div>

      <form onSubmit={post} className="bg-surface/50 border border-gold/15 rounded-lg p-5 mb-6">
        <h3 className="font-display text-xl text-champagne mb-3">Compose</h3>

        <div className="flex flex-wrap gap-1 mb-3">
          {CHANNELS.map(({ value, label, Icon }) => (
            <button type="button" key={value} onClick={() => setChannel(value)}
              className={`text-xs px-3 py-1.5 rounded border flex items-center gap-1.5 ${channel === value ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground"}`}>
              <Icon className="size-3.5" /> {label}
            </button>
          ))}
        </div>

        {channel === "direct" && (
          <select value={directTo} onChange={(e) => setDirectTo(e.target.value)}
            className="w-full bg-background border border-gold/20 rounded px-3 py-2 text-sm mb-3 focus:outline-none focus:border-gold">
            <option value="">Choose recipient…</option>
            {people.filter((p) => p.id !== user?.id).map((p) => (
              <option key={p.id} value={p.id}>{p.full_name ?? p.email}</option>
            ))}
          </select>
        )}

        <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={2000}
          placeholder={channel === "personal" ? "Note to yourself…" : channel === "direct" ? "Write a private message…" : "Share an update with the team…"}
          className="w-full bg-background border border-gold/20 rounded px-3 py-2 text-sm h-24 mb-3 focus:outline-none focus:border-gold" />

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1">
            {TABS.map(({ value, label }) => (
              <button type="button" key={value} onClick={() => setPriority(value)}
                className={`text-xs px-3 py-1.5 rounded border ${priority === value ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground"}`}>
                {label}
              </button>
            ))}
          </div>
          <button type="submit" disabled={busy || !text.trim()}
            className="ml-auto gradient-gold text-gold-foreground font-medium px-5 py-2 rounded flex items-center gap-2 disabled:opacity-50">
            <Send className="size-4" /> {busy ? "Sending…" : "Send"}
          </button>
        </div>
      </form>

      <div className="flex flex-wrap gap-1 mb-3">
        {CHANNELS.map(({ value, label, Icon }) => {
          const active = channelView === value;
          return (
            <button key={value} onClick={() => setChannelView(value)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs border ${active ? "border-gold/40 bg-gold/5 text-gold" : "border-border text-muted-foreground hover:text-champagne"}`}>
              <Icon className="size-3.5" /> {label}
            </button>
          );
        })}
      </div>

      <div className="flex gap-1 mb-4">
        {TABS.map(({ value, label, Icon }) => {
          const count = msgs.filter((m) => m.priority === value && inView(m, channelView)).length;
          const active = filter === value;
          return (
            <button key={value} onClick={() => setFilter(value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-t border-b-2 text-sm ${active ? "border-gold text-gold bg-gold/5" : "border-transparent text-muted-foreground hover:text-champagne"}`}>
              <Icon className="size-4" /> {label} <span className="text-xs opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && <div className="bg-surface/30 border border-gold/10 rounded-lg p-8 text-center text-muted-foreground text-sm">No messages here.</div>}
        {filtered.map((m) => {
          const author = authors[m.user_id];
          const recipient = m.recipient_id ? authors[m.recipient_id] : null;
          const mine = m.user_id === user?.id;
          const isPersonal = m.recipient_id === user?.id && m.user_id === user?.id;
          const tone = m.priority === "urgent" ? "border-destructive/40 bg-destructive/5"
            : m.priority === "archive" ? "border-muted bg-muted/20 opacity-70"
            : isPersonal ? "border-gold/30 bg-gold/[0.04]"
            : m.recipient_id ? "border-blue-400/30 bg-blue-400/5"
            : "border-gold/15 bg-surface/50";
          return (
            <article key={m.id} className={`border rounded-lg p-5 ${tone}`}>
              <header className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                <div className="text-xs min-w-0">
                  <span className="text-champagne font-medium">{author?.full_name ?? author?.email ?? "Team member"}</span>
                  {recipient && (
                    <span className="text-muted-foreground"> → <span className="text-champagne/80">{isPersonal ? "themself" : (recipient.full_name ?? recipient.email)}</span></span>
                  )}
                  <span className="text-muted-foreground ml-2">{new Date(m.created_at).toLocaleString()}</span>
                  {isPersonal && <span className="ml-2 text-[10px] uppercase tracking-wider text-gold/80">Personal</span>}
                  {m.recipient_id && !isPersonal && <span className="ml-2 text-[10px] uppercase tracking-wider text-blue-300/80">Direct</span>}
                </div>
                <div className="flex items-center gap-1">
                  {(mine || isAdmin) && (
                    <>
                      <select value={m.priority} onChange={(e) => changePriority(m.id, e.target.value as Msg["priority"])}
                        className="text-[10px] bg-background border border-gold/20 rounded px-2 py-1">
                        {TABS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                      <button onClick={() => remove(m.id)} className="text-muted-foreground hover:text-destructive p-1">
                        <Trash2 className="size-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </header>
              <p className="text-sm whitespace-pre-wrap text-foreground/90">{m.message}</p>
            </article>
          );
        })}
      </div>
    </AdminShell>
  );
}
