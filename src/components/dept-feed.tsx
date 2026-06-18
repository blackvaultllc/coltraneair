import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Send } from "lucide-react";

type Msg = {
  id: string; sender_id: string; sender_dept: string; target_dept: string;
  message: string; signature: string; is_system: boolean; created_at: string;
};

export function DeptFeed({ deptSlug, deptName }: { deptSlug: string; deptName: string }) {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [target, setTarget] = useState(deptSlug);
  const [text, setText] = useState("");
  const [depts, setDepts] = useState<{ slug: string; name: string }[]>([]);

  async function load() {
    const [{ data: msgs }, { data: d }] = await Promise.all([
      supabase.from("dept_messages").select("*").eq("target_dept", deptSlug).order("created_at", { ascending: false }).limit(50),
      supabase.from("departments").select("slug,name").order("name"),
    ]);
    setMessages((msgs ?? []) as Msg[]);
    setDepts((d ?? []) as { slug: string; name: string }[]);
  }

  useEffect(() => { load(); }, [deptSlug]);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!text.trim() || !profile) return;
    const signature = `${profile.full_name ?? profile.email} · ${profile.title ?? "Member"} · ${profile.department ?? "Unassigned"}`;
    const { error } = await supabase.from("dept_messages").insert({
      sender_id: profile.id,
      sender_dept: profile.department ?? "unassigned",
      target_dept: target,
      message: text.trim().slice(0, 2000),
      signature,
    });
    if (error) { toast.error(error.message); return; }
    setText("");
    toast.success("Message sent.");
    load();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={send} className="bg-surface/50 border border-gold/20 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Send to</span>
          <select value={target} onChange={(e) => setTarget(e.target.value)}
            className="bg-background border border-gold/20 rounded-md px-3 py-1.5 text-sm">
            {depts.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}
          </select>
        </div>
        <textarea
          value={text} onChange={(e) => setText(e.target.value)}
          maxLength={2000} rows={3}
          placeholder={`Write to ${deptName}…`}
          className="w-full bg-background border border-gold/20 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gold resize-none"
        />
        <div className="flex justify-end">
          <button type="submit" className="gradient-gold text-gold-foreground px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:opacity-90">
            <Send className="size-3.5" /> Send
          </button>
        </div>
      </form>

      <div className="space-y-2">
        <h3 className="font-display text-xl text-champagne">Incoming Feed</h3>
        {messages.length === 0 && <p className="text-sm text-muted-foreground">No messages yet.</p>}
        {messages.map((m) => (
          <div key={m.id} className={`border rounded-lg p-4 ${m.is_system ? "border-destructive/40 bg-destructive/5" : "border-gold/15 bg-surface/30"}`}>
            <p className="text-sm whitespace-pre-wrap">{m.message}</p>
            <div className="mt-2 text-[11px] text-muted-foreground flex justify-between">
              <span>— {m.signature}</span>
              <span>{new Date(m.created_at).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
