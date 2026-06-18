import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { ScrollText } from "lucide-react";

const TERMS_TEXT = `TERMS OF OPERATION

By accessing this platform you agree to the following:

1. EMPLOYEE CONDUCT — All personnel will uphold the standards of professionalism, safety, and discretion required of the private aviation industry.

2. DATA HANDLING — Customer and operational data is confidential. Unauthorized disclosure is grounds for immediate termination and may carry civil/criminal liability.

3. CHARTER LIABILITY — All charters operate under FAA Part 91/135 regulations. Crew acknowledge their personal responsibility for safe operation and compliance.

4. FAA COMPLIANCE — All flight operations, training, and maintenance shall meet or exceed FAA standards. Falsification of records is a federal offense.

5. EXECUTIVE GOVERNANCE — Department access may be suspended at the discretion of the Head Administrator. Suspended personnel will retain account access for compliance review only.

6. ACKNOWLEDGEMENT — Continued use of this platform constitutes ongoing acceptance of these terms as amended.
`;

export function TermsGate({ children }: { children: ReactNode }) {
  const { profile, reload } = useAuth();
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {}, []);

  if (!profile) return <p className="text-muted-foreground">Loading profile…</p>;
  if (profile.terms_accepted) return <>{children}</>;

  async function accept() {
    setAccepting(true);
    const { error } = await supabase.from("profiles").update({ terms_accepted: true }).eq("id", profile!.id);
    setAccepting(false);
    if (error) return toast.error(error.message);
    toast.success("Terms acknowledged.");
    reload();
  }

  return (
    <div className="max-w-3xl mx-auto bg-surface/50 border border-gold/30 rounded-xl p-8">
      <ScrollText className="size-8 text-gold mb-4" />
      <h2 className="font-display text-3xl text-champagne mb-2">Terms of Operation</h2>
      <p className="text-sm text-muted-foreground mb-6">You must acknowledge the Terms of Operation before accessing the dashboard.</p>
      <pre className="max-h-80 overflow-y-auto bg-background/60 border border-gold/15 rounded-lg p-4 text-xs whitespace-pre-wrap font-body text-muted-foreground">
        {TERMS_TEXT}
      </pre>
      <button onClick={accept} disabled={accepting}
        className="mt-6 gradient-gold text-gold-foreground font-medium px-6 py-3 rounded-md hover:opacity-90 disabled:opacity-50">
        {accepting ? "Recording…" : "I Acknowledge & Accept"}
      </button>
    </div>
  );
}
