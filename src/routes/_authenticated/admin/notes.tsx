import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useRef } from "react";
import { AdminShell } from "@/components/admin-shell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Search, Tag, ShieldCheck } from "lucide-react";
import { COMPLIANCE_BANNER, checkContent, logAudit } from "@/lib/content-policy";

export const Route = createFileRoute("/_authenticated/admin/notes")({
  head: () => ({ meta: [{ title: "Notes Vault" }, { name: "robots", content: "noindex" }] }),
  component: Notes,
});

type Note = { id: string; title: string; content: string; tags: string[]; updated_at: string };

function Notes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dirty, setDirty] = useState<Record<string, Partial<Note>>>({});

  async function load() {
    if (!user) return;
    const { data } = await supabase.from("notes").select("*").order("updated_at", { ascending: false });
    const rows = (data ?? []) as Note[];
    setNotes(rows);
    if (!activeId && rows[0]) setActiveId(rows[0].id);
  }
  useEffect(() => { load(); }, [user?.id]);

  async function create() {
    if (!user) return;
    const { data, error } = await supabase.from("notes").insert({ user_id: user.id, title: "Untitled note", content: "" }).select().single();
    if (error) return toast.error(error.message);
    setActiveId(data.id);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this note?")) return;
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    if (activeId === id) setActiveId(null);
    load();
  }

  function edit(id: string, patch: Partial<Note>) {
    // Compliance check on title/content edits before letting them queue to DB.
    const merged = { ...(notes.find((n) => n.id === id) ?? {}), ...patch };
    const probe = `${merged.title ?? ""}\n${merged.content ?? ""}`;
    const verdict = checkContent(probe);
    if (!verdict.ok) {
      toast.error(verdict.reason);
      if (user) logAudit(supabase, user.id, "notes.blocked", "notes", { reason: verdict.reason, id });
      return;
    }
    setNotes((ns) => ns.map((n) => (n.id === id ? { ...n, ...patch } : n)));
    setDirty((d) => ({ ...d, [id]: { ...(d[id] ?? {}), ...patch } }));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => flush(), 800);
  }

  async function flush() {
    const current = dirty;
    setDirty({});
    const ids = Object.keys(current);
    for (const id of ids) {
      const patch = current[id];
      if (!patch) continue;
      await supabase.from("notes").update(patch).eq("id", id);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.tags.some((t) => t.toLowerCase().includes(q)));
  }, [notes, query]);

  const active = notes.find((n) => n.id === activeId) ?? null;

  return (
    <AdminShell title="Notes Vault">
      <div className="mb-4 flex items-start gap-3 text-xs border border-gold/20 bg-gold/5 rounded-md p-3">
        <ShieldCheck className="size-4 text-gold mt-0.5 shrink-0" />
        <p className="text-foreground/80">{COMPLIANCE_BANNER}</p>
      </div>
      <div className="grid lg:grid-cols-[280px_1fr] gap-6 min-h-[70vh]">
        <aside className="bg-surface/50 border border-gold/15 rounded-lg flex flex-col">
          <div className="p-3 border-b border-gold/10 space-y-2">
            <button onClick={create} className="w-full gradient-gold text-gold-foreground font-medium px-3 py-2 rounded text-sm flex items-center justify-center gap-2">
              <Plus className="size-4" /> New Note
            </button>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 size-3.5 text-muted-foreground" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…"
                className="w-full bg-background border border-gold/20 rounded pl-7 pr-2 py-1.5 text-xs" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filtered.length === 0 && <p className="text-xs text-muted-foreground p-3 text-center">No notes.</p>}
            {filtered.map((n) => (
              <button key={n.id} onClick={() => setActiveId(n.id)}
                className={`w-full text-left p-2 rounded border ${activeId === n.id ? "border-gold/40 bg-gold/5" : "border-transparent hover:bg-gold/5"}`}>
                <div className="text-sm text-champagne truncate">{n.title || "Untitled"}</div>
                <div className="text-[10px] text-muted-foreground truncate">{new Date(n.updated_at).toLocaleDateString()} · {n.content.slice(0, 40)}</div>
              </button>
            ))}
          </div>
        </aside>

        <section className="bg-surface/50 border border-gold/15 rounded-lg flex flex-col">
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Select or create a note to start writing.</div>
          ) : (
            <>
              <div className="p-4 border-b border-gold/10 flex items-center gap-3">
                <input value={active.title} onChange={(e) => edit(active.id, { title: e.target.value })} maxLength={200}
                  className="flex-1 bg-transparent font-display text-2xl text-champagne focus:outline-none" />
                <button onClick={() => remove(active.id)} className="text-muted-foreground hover:text-destructive p-2">
                  <Trash2 className="size-4" />
                </button>
              </div>
              <div className="px-4 py-2 border-b border-gold/10 flex items-center gap-2 text-xs">
                <Tag className="size-3 text-gold" />
                <input value={active.tags.join(", ")} onChange={(e) => edit(active.id, { tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
                  placeholder="comma, separated, tags"
                  className="flex-1 bg-transparent text-muted-foreground focus:text-champagne focus:outline-none" />
                <span className="text-[10px] text-muted-foreground">{dirty[active.id] ? "Saving…" : "Saved"}</span>
              </div>
              <textarea value={active.content} onChange={(e) => edit(active.id, { content: e.target.value })}
                placeholder="Begin writing…"
                className="flex-1 bg-transparent p-5 text-sm leading-relaxed text-foreground/90 focus:outline-none resize-none" />
            </>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
