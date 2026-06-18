import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Plane, Star, Shield, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import heroJet from "@/assets/hero-jet.jpg";
import { BRAND, BRAND_TAGLINE, LAUNCH_DATE } from "@/lib/brand";
import { CookieBanner } from "@/components/cookie-banner";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${BRAND} — Private Jet Charter | Coming Soon` },
      { name: "description", content: `${BRAND}. Luxury private jet charter from Alabama. ${BRAND_TAGLINE} Join the waitlist.` },
      { property: "og:title", content: `${BRAND} — Coming Soon` },
      { property: "og:description", content: `Luxury private aviation, coming soon to the skies above Alabama.` },
    ],
  }),
  component: Landing,
});

function useCountdown(target: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  return { days, hours, minutes, seconds };
}

function Landing() {
  const c = useCountdown(LAUNCH_DATE);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast.error("Enter a valid email address.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("waitlist").insert({ email: email.trim().toLowerCase() });
    setBusy(false);
    if (error) {
      if (error.code === "23505") toast.success("You're already on the list.");
      else toast.error("Could not add to waitlist. Please try again.");
      return;
    }
    setEmail("");
    toast.success("You're on the list. Welcome aboard.");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster />
      {/* Hero */}
      <section className="relative min-h-screen flex flex-col">
        <img
          src={heroJet}
          alt="Private jet on tarmac at golden hour"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        {/* Red carpet element */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] max-w-3xl h-2 bg-gradient-to-r from-transparent via-destructive to-transparent opacity-80" />

        <header className="relative z-10 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 sm:px-6 md:px-12 py-5 sm:py-6">
          <div className="font-display text-lg sm:text-xl md:text-2xl text-champagne tracking-wide truncate">
            {BRAND}
          </div>
          <a href="/auth" className="text-xs sm:text-sm text-champagne/80 hover:text-gold transition-colors whitespace-nowrap shrink-0">
            <span className="hidden sm:inline">Employee Sign In →</span>
            <span className="sm:hidden">Sign In →</span>
          </a>
        </header>

        <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-10">
          <div className="max-w-4xl text-center w-full">
            <p className="text-gold text-[10px] sm:text-xs md:text-sm tracking-[0.3em] sm:tracking-[0.4em] uppercase mb-4 sm:mb-6">Alabama · Coming Soon</p>
            <h1 className="font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl leading-[1.05] text-champagne">
              Where The Sky <br/>
              <span className="text-gradient-gold italic">Luxury in Perfect Harmony</span>
            </h1>
            <p className="mt-5 sm:mt-6 text-base sm:text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto px-2">
              {BRAND_TAGLINE} Coming soon to the skies above Alabama.
            </p>

            {/* Countdown */}
            <div className="mt-8 sm:mt-10 grid grid-cols-4 gap-2 sm:gap-4 md:gap-6 max-w-md sm:max-w-xl mx-auto">
              {[
                ["Days", c.days], ["Hours", c.hours], ["Minutes", c.minutes], ["Seconds", c.seconds],
              ].map(([label, v]) => (
                <div key={label} className="bg-surface/70 backdrop-blur-md border border-gold/30 rounded-lg px-2 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 min-w-0">
                  <div className="font-display text-2xl sm:text-3xl md:text-5xl text-gold tabular-nums">
                    {String(v).padStart(2, "0")}
                  </div>
                  <div className="text-[9px] sm:text-[10px] md:text-xs tracking-widest text-muted-foreground uppercase mt-1">
                    {label}
                  </div>
                </div>
              ))}
            </div>


            {/* Waitlist */}
            <form onSubmit={submit} className="mt-10 flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={255}
                placeholder="your.email@domain.com"
                className="flex-1 bg-surface/80 border border-gold/30 rounded-md px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold transition-colors"
              />
              <button
                type="submit"
                disabled={busy}
                className="gradient-gold text-gold-foreground font-medium px-6 py-3 rounded-md hover:opacity-90 transition-all glow-gold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {busy ? "Adding…" : "Request Early Access"} <ArrowRight className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-24 md:py-32 bg-background">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6 md:gap-10">
          {[
            { Icon: Plane, title: "On-Demand Charters", body: "Fly anywhere, anytime. Your schedule, your route." },
            { Icon: Star, title: "White Glove Service", body: "Red carpet arrival. Concierge from gate to destination." },
            { Icon: Shield, title: "Fully Certified", body: "FAA-compliant. Licensed pilots. Zero compromise on safety." },
          ].map(({ Icon, title, body }) => (
            <div key={title} className="border border-gold/20 bg-surface/40 rounded-lg p-8 hover:border-gold/60 transition-colors">
              <div className="size-12 rounded-full gradient-gold flex items-center justify-center mb-6">
                <Icon className="size-6 text-gold-foreground" />
              </div>
              <h3 className="font-display text-2xl text-champagne mb-2">{title}</h3>
              <p className="text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-gold/15 px-6 py-10 bg-background">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div>
              <div className="font-display text-lg text-champagne mb-2">{BRAND}</div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Organized under the laws of the State of Alabama. Private aviation services launching upon FAA Part 135 certification.
              </p>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-gold/80 mb-2">Legal</div>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li><Link to="/terms" className="hover:text-gold">Website Terms of Use</Link></li>
                <li><Link to="/privacy" className="hover:text-gold">Privacy Policy (GDPR / CCPA)</Link></li>
                <li><Link to="/disclaimer" className="hover:text-gold">Disclaimer & Regulatory Notices</Link></li>
              </ul>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-gold/80 mb-2">Regulatory Notice</div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                This site does not constitute a binding contract or offer of air transportation. {BRAND} is in the process of obtaining its Air Carrier Certificate under 14 C.F.R. Part 135. No flights for compensation or hire will be operated until that certificate is issued by the FAA. DOT economic authority and FAA operational authority will apply once active.
              </p>
            </div>
          </div>
          <div className="border-t border-gold/10 pt-4 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} {BRAND}. All rights reserved. · Powered by Black Vault Digital
          </div>
        </div>
      </footer>
      <CookieBanner />
    </div>
  );
}
