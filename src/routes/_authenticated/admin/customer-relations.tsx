import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin-shell";
import { DeptFeed } from "@/components/dept-feed";
import { DeptGuard } from "@/components/dept-guard";
import { Users2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/customer-relations")({
  head: () => ({ meta: [{ title: "Customer Relations" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <AdminShell title="Customer Relations">
      <DeptGuard deptSlug="customer-relations">
        <div className="bg-surface/50 border border-gold/15 rounded-lg p-6 mb-6">
          <Users2 className="size-6 text-gold mb-3" />
          <h3 className="font-display text-2xl text-champagne mb-2">Customer Accounts</h3>
          <p className="text-muted-foreground text-sm">Scaffolded. Account management and concierge logs coming in v2.</p>
        </div>
        <DeptFeed deptSlug="customer-relations" deptName="Customer Relations" />
      </DeptGuard>
    </AdminShell>
  ),
});
