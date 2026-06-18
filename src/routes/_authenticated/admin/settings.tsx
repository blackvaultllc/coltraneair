import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { AdminShell } from "@/components/admin-shell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({ meta: [{ title: "Settings" }, { name: "robots", content: "noindex" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { profile, reload } = useAuth();
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [dept, setDept] = useState("");
  const [depts, setDepts] = useState<{ slug: string; name: string }[]>([]);

  useEffect(() => {
    supabase.from("departments").select("slug,name").order("name")
      .then(({ data }) => setDepts((data ?? []) as { slug: string; name: string }[]));
  }, []);
  useEffect(() => {
    if (profile) {
      setName(profile.full_name ?? "");
      setTitle(profile.title ?? "");
      setDept(profile.department ?? "");
    }
  }, [profile]);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    const { error } = await supabase.from("profiles").update({
      full_name: name.slice(0, 100), title: title.slice(0, 100), department: dept || null,
    }).eq("id", profile.id);
    if (error) return toast.error(error.message);
    toast.success("Profile updated.");
    reload();
  }

  return (
    <AdminShell title="Settings">
      <form onSubmit={save} className="max-w-xl space-y-4 bg-surface/50 border border-gold/15 rounded-lg p-6">
        <h3 className="font-display text-xl text-champagne">Your Profile</h3>
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Full Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100}
            className="mt-1 w-full bg-background border border-gold/20 rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100}
            className="mt-1 w-full bg-background border border-gold/20 rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Department</label>
          <select value={dept} onChange={(e) => setDept(e.target.value)}
            className="mt-1 w-full bg-background border border-gold/20 rounded-md px-3 py-2">
            <option value="">— Unassigned —</option>
            <option value="Executive">Executive</option>
            {depts.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}
          </select>
          <p className="text-[11px] text-muted-foreground mt-1">Your department determines which message feeds you can read.</p>
        </div>
        <button className="gradient-gold text-gold-foreground font-medium px-5 py-2.5 rounded-md hover:opacity-90">
          Save Changes
        </button>
      </form>
    </AdminShell>
  );
}
