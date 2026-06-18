import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin-shell";
import { DeptFeed } from "@/components/dept-feed";
import { DeptGuard } from "@/components/dept-guard";
import { Wallet } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/finance")({
  head: () => ({ meta: [{ title: "Finance" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <AdminShell title="Finance">
      <DeptGuard deptSlug="finance">
        <div className="bg-surface/50 border border-gold/15 rounded-lg p-6 mb-6">
          <Wallet className="size-6 text-gold mb-3" />
          <h3 className="font-display text-2xl text-champagne mb-2">Billing & Invoicing</h3>
          <p className="text-muted-foreground text-sm">Scaffolded. Charter invoicing, expense tracking, and payroll dashboards coming in v2.</p>
        </div>
        <DeptFeed deptSlug="finance" deptName="Finance" />
      </DeptGuard>
    </AdminShell>
  ),
});
