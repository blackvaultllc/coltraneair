import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShieldAlert, AlertTriangle } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Dept = { id: string; name: string; slug: string; status: "active" | "inactive" };

export const Route = createFileRoute("/_authenticated/admin/governance")({
  head: () => ({ meta: [{ title: "Governance Control" }, { name: "robots", content: "noindex" }] }),
  component: Governance,
});

function Governance() {
  const { isAdmin, profile } = useAuth();
  const [depts, setDepts] = useState<Dept[]>([]);
  const [pending, setPending] = useState<Dept | null>(null);

  async function load() {
    const { data } = await supabase.from("departments").select("*").order("name");
    setDepts((data ?? []) as Dept[]);
  }
  useEffect(() => { load(); }, []);

  async function confirmToggle() {
    if (!pending || !profile) return;
    const next = pending.status === "active" ? "inactive" : "active";
    const { error } = await supabase.from("departments").update({ status: next }).eq("id", pending.id);
    if (error) { toast.error(error.message); setPending(null); return; }
    if (next === "inactive") {
      await supabase.from("dept_messages").insert({
        sender_id: profile.id,
        sender_dept: "executive",
        target_dept: pending.slug,
        message: "This department has been suspended by executive order. Contact the Head Administrator.",
        signature: `${profile.full_name ?? profile.email} · Head Administrator · Executive`,
        is_system: true,
      });
    }
    toast.success(`${pending.name} ${next === "active" ? "reactivated" : "suspended"}.`);
    setPending(null);
    load();
  }

  if (!isAdmin) return (
    <AdminShell title="Governance Control">
      <div className="bg-destructive/10 border border-destructive/40 rounded-xl p-8 text-center">
        <AlertTriangle className="size-10 mx-auto text-destructive mb-3" />
        <p className="text-champagne">Access restricted to the Head Administrator.</p>
      </div>
    </AdminShell>
  );

  return (
    <AdminShell title="Governance Control">
      <p className="text-muted-foreground mb-6 max-w-2xl">
        Kill-switch authority over every department. Suspending a department locks all non-admin members out and broadcasts a system message to that department's feed.
      </p>
      <div className="space-y-3">
        {depts.map((d) => (
          <div key={d.id} className="flex items-center justify-between bg-surface/50 border border-gold/15 rounded-lg p-5">
            <div className="flex items-center gap-4">
              <ShieldAlert className={`size-5 ${d.status === "active" ? "text-success" : "text-destructive"}`} />
              <div>
                <div className="font-display text-xl text-champagne">{d.name}</div>
                <div className={`text-xs uppercase tracking-wider ${d.status === "active" ? "text-success" : "text-destructive"}`}>
                  {d.status}
                </div>
              </div>
            </div>
            <button
              onClick={() => setPending(d)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                d.status === "active"
                  ? "bg-destructive/15 text-destructive border border-destructive/40 hover:bg-destructive/25"
                  : "gradient-gold text-gold-foreground"
              }`}
            >
              {d.status === "active" ? "Suspend" : "Reactivate"}
            </button>
          </div>
        ))}
      </div>

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending?.status === "active" ? "Suspend" : "Reactivate"} {pending?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.status === "active"
                ? `This will restrict all ${pending.name} members immediately and broadcast a system suspension notice.`
                : `${pending?.name} will be fully reactivated and members regain access.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggle}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}
