import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { DeptFeed } from "@/components/dept-feed";
import { DeptGuard } from "@/components/dept-guard";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { ScrollText, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/compliance")({
  head: () => ({ meta: [{ title: "Compliance & Legal" }, { name: "robots", content: "noindex" }] }),
  component: Compliance,
});

function Compliance() {
  const { isAdmin } = useAuth();
  const [people, setPeople] = useState<{ email: string; full_name: string | null; terms_accepted: boolean }[]>([]);
  useEffect(() => {
    if (!isAdmin) return;
    supabase.from("profiles").select("email,full_name,terms_accepted").order("email")
      .then(({ data }) => setPeople(data ?? []));
  }, [isAdmin]);

  return (
    <AdminShell title="Compliance & Legal">
      <DeptGuard deptSlug="compliance">
        <div className="bg-surface/50 border border-gold/15 rounded-lg p-6 mb-6">
          <ScrollText className="size-6 text-gold mb-3" />
          <h3 className="font-display text-2xl text-champagne mb-3">Terms of Operation</h3>
          <pre className="bg-background/60 border border-gold/15 rounded-lg p-4 text-xs whitespace-pre-wrap font-body text-muted-foreground max-h-72 overflow-y-auto">
{`1. EMPLOYEE CONDUCT — Professionalism, safety, discretion.
2. DATA HANDLING — Confidentiality. Unauthorized disclosure → termination + liability.
3. CHARTER LIABILITY — Operations under FAA Part 91/135.
4. FAA COMPLIANCE — Records falsification is a federal offense.
5. EXECUTIVE GOVERNANCE — Department access at the discretion of the Head Administrator.
6. ONGOING ACCEPTANCE — Continued use constitutes acceptance as amended.`}
          </pre>
        </div>

        {isAdmin && (
          <div className="bg-surface/50 border border-gold/15 rounded-lg p-6 mb-6">
            <h3 className="font-display text-2xl text-champagne mb-3">Acknowledgement Status</h3>
            <div className="space-y-1.5">
              {people.map((p) => (
                <div key={p.email} className="flex items-center justify-between text-sm border-b border-gold/10 py-2">
                  <span>{p.full_name ?? p.email}</span>
                  {p.terms_accepted
                    ? <span className="flex items-center gap-1 text-success text-xs"><CheckCircle2 className="size-3.5" /> Accepted</span>
                    : <span className="flex items-center gap-1 text-destructive text-xs"><XCircle className="size-3.5" /> Pending</span>}
                </div>
              ))}
              {people.length === 0 && <p className="text-sm text-muted-foreground">No personnel yet.</p>}
            </div>
          </div>
        )}

        <DeptFeed deptSlug="compliance" deptName="Compliance & Legal" />
      </DeptGuard>
    </AdminShell>
  );
}
