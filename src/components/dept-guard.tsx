import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle } from "lucide-react";

export function DeptGuard({ deptSlug, children }: { deptSlug: string; children: ReactNode }) {
  const { isAdmin } = useAuth();
  const [status, setStatus] = useState<"active" | "inactive" | "loading">("loading");
  useEffect(() => {
    supabase.from("departments").select("status").eq("slug", deptSlug).maybeSingle()
      .then(({ data }) => setStatus((data?.status as "active" | "inactive") ?? "active"));
  }, [deptSlug]);
  if (status === "loading") return <p className="text-muted-foreground">Loading…</p>;
  if (status === "inactive" && !isAdmin) {
    return (
      <div className="max-w-xl mx-auto text-center bg-destructive/10 border border-destructive/40 rounded-xl p-12 mt-12">
        <AlertTriangle className="size-12 mx-auto text-destructive mb-4" />
        <h2 className="font-display text-2xl text-champagne mb-2">Department Suspended</h2>
        <p className="text-muted-foreground">This department has been suspended by executive order. Contact the Head Administrator.</p>
      </div>
    );
  }
  return <>{children}</>;
}
