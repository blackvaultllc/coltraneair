import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { BRAND } from "@/lib/brand";
import { Plane, LogOut } from "lucide-react";

export const Route = createFileRoute("/_authenticated/portal")({
  head: () => ({ meta: [{ title: `Customer Portal — ${BRAND}` }, { name: "robots", content: "noindex" }] }),
  component: PortalPage,
});

function PortalPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  useEffect(() => {}, []);
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background">
      <div className="max-w-lg w-full text-center bg-surface/50 border border-gold/20 rounded-xl p-12">
        <div className="size-16 mx-auto rounded-full gradient-gold flex items-center justify-center mb-6">
          <Plane className="size-8 text-gold-foreground" />
        </div>
        <h1 className="font-display text-4xl text-champagne mb-3">Customer Portal</h1>
        <p className="text-muted-foreground mb-2">Welcome, {profile?.full_name ?? profile?.email}.</p>
        <p className="text-gold">Coming soon.</p>
        <p className="text-sm text-muted-foreground mt-6">
          Your charter dashboard, booking history, and concierge access are being prepared.
        </p>
        <button onClick={signOut} className="mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gold">
          <LogOut className="size-4" /> Sign out
        </button>
      </div>
    </div>
  );
}
