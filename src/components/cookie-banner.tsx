import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";

const KEY = "a5w_cookie_consent_v1";

export function CookieBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(KEY)) setShow(true);
  }, []);
  if (!show) return null;
  function decide(value: "accept" | "reject") {
    try { localStorage.setItem(KEY, value); } catch { /* ignore */ }
    setShow(false);
  }
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-3xl bg-surface/95 backdrop-blur-md border border-gold/30 rounded-lg p-5 shadow-2xl">
      <div className="flex items-start gap-4">
        <Cookie className="size-5 text-gold shrink-0 mt-0.5" />
        <div className="flex-1 text-sm text-foreground/90">
          <p className="font-display text-champagne text-base mb-1">Your privacy matters</p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            We use essential cookies to operate this site. With your consent we also use analytics cookies to understand usage.
            Under GDPR & CCPA you may reject non-essential cookies. See our{" "}
            <a href="/privacy" className="text-gold hover:underline">Privacy Policy</a>.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => decide("reject")} className="text-xs px-3 py-2 rounded-md border border-border text-muted-foreground hover:text-champagne hover:border-gold/40">
            Reject
          </button>
          <button onClick={() => decide("accept")} className="text-xs px-4 py-2 rounded-md gradient-gold text-gold-foreground font-medium">
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
