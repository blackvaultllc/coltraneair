import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin-shell";
import { DeptFeed } from "@/components/dept-feed";
import { DeptGuard } from "@/components/dept-guard";
import { Plane } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/flight-ops")({
  head: () => ({ meta: [{ title: "Flight Operations" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <AdminShell title="Flight Operations">
      <DeptGuard deptSlug="flight-ops">
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-surface/50 border border-gold/15 rounded-lg p-6">
            <Plane className="size-6 text-gold mb-3" />
            <h3 className="font-display text-2xl text-champagne mb-3">Pilot Scheduling</h3>
            <p className="text-muted-foreground text-sm mb-4">Crew assignments and roster (scaffold).</p>
            <div className="space-y-2 text-sm">
              {["Capt. R. Hayes — N812AW · Birmingham → Atlanta · 14:00", "F.O. M. Chen — N812AW · Birmingham → Atlanta · 14:00", "Capt. L. Brooks — N501AW · Standby · Huntsville"].map((r) => (
                <div key={r} className="border-l-2 border-gold/40 pl-3 py-1 text-foreground/90">{r}</div>
              ))}
            </div>
          </div>
          <div className="bg-surface/50 border border-gold/15 rounded-lg p-6">
            <h3 className="font-display text-2xl text-champagne mb-3">Aircraft Status</h3>
            <div className="space-y-2 text-sm">
              {[
                { tail: "N812AW", model: "Citation CJ4", state: "In Service", color: "text-success" },
                { tail: "N501AW", model: "Phenom 300", state: "Standby", color: "text-champagne" },
                { tail: "N999AW", model: "Gulfstream G280", state: "Maintenance", color: "text-destructive" },
              ].map((a) => (
                <div key={a.tail} className="flex justify-between border-b border-gold/10 py-2">
                  <span><span className="text-gold">{a.tail}</span> · {a.model}</span>
                  <span className={a.color}>{a.state}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2">
            <DeptFeed deptSlug="flight-ops" deptName="Flight Operations" />
          </div>
        </div>
      </DeptGuard>
    </AdminShell>
  ),
});
