import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { BRAND, BRAND_TAGLINE } from "@/lib/brand";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: `Sign In — ${BRAND}` },
      { name: "description", content: "Secure access for employees and administrators." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) routeByRole(data.session.user.id);
    });
  }, []);

  async function routeByRole(uid: string) {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    const roles = (data ?? []).map((r: { role: string }) => r.role);
    if (roles.includes("admin") || roles.some((r) => r !== "customer")) navigate({ to: "/admin" });
    else navigate({ to: "/portal" });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
        if (data.user) await routeByRole(data.user.id);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("Account created.");
        if (data.user && data.session) await routeByRole(data.user.id);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed.";
      toast.error(msg.includes("Invalid") ? "Access denied. Contact your administrator." : msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background">
      <Toaster />
      {/* Left brand panel */}
      <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-background via-surface to-background border-r border-gold/20 relative overflow-hidden">
        <div className="absolute -top-32 -right-32 size-96 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 size-96 rounded-full bg-gold/5 blur-3xl" />
        <div className="relative z-10">
          <a href="/" className="font-display text-2xl text-champagne tracking-wide">{BRAND}</a>
        </div>
        <div className="relative z-10">
          <h2 className="font-display text-5xl text-gradient-gold leading-tight">Where The Sky Has No Limits</h2>
          <p className="mt-4 text-muted-foreground max-w-md">{BRAND_TAGLINE} Authorized access for crew, operations, and administration.</p>
        </div>
        <div className="relative z-10 text-xs text-muted-foreground/70">© {new Date().getFullYear()} {BRAND}</div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md bg-surface/60 border border-gold/20 rounded-xl p-8 backdrop-blur-md">
          <div className="md:hidden font-display text-xl text-champagne mb-6 text-center">{BRAND}</div>
          <h1 className="font-display text-3xl text-champagne mb-1">{mode === "signin" ? "Sign In" : "Create Account"}</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {mode === "signin" ? "Welcome back. Enter your credentials." : "Register your access. Customers default to portal."}
          </p>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Full Name</label>
                <input
                  type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                  required maxLength={100}
                  className="mt-1 w-full bg-background border border-gold/20 rounded-md px-3 py-2 focus:outline-none focus:border-gold"
                />
              </div>
            )}
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required maxLength={255}
                className="mt-1 w-full bg-background border border-gold/20 rounded-md px-3 py-2 focus:outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Password</label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                required minLength={6} maxLength={72}
                className="mt-1 w-full bg-background border border-gold/20 rounded-md px-3 py-2 focus:outline-none focus:border-gold"
              />
            </div>
            <button
              type="submit" disabled={busy}
              className="w-full gradient-gold text-gold-foreground font-medium py-3 rounded-md hover:opacity-90 transition-all glow-gold disabled:opacity-50"
            >
              {busy ? "…" : mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-gold/15" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">or continue with</span>
            <div className="flex-1 h-px bg-gold/15" />
          </div>

          <div className="space-y-2">
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
                if (res.error) { toast.error("Google sign-in failed."); setBusy(false); return; }
                if (res.redirected) return;
              }}
              className="w-full flex items-center justify-center gap-3 bg-background border border-gold/25 hover:border-gold/60 rounded-md py-2.5 text-sm text-champagne transition-colors disabled:opacity-50"
            >
              <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4-5.5 4-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3 14.7 2 12 2 6.9 2 2.8 6.1 2.8 11.2S6.9 20.5 12 20.5c6.9 0 9.6-4.8 9.6-7.3 0-.5-.1-.9-.1-1.3H12z"/>
              </svg>
              Continue with Google
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                const res = await lovable.auth.signInWithOAuth("apple", { redirect_uri: window.location.origin + "/auth" });
                if (res.error) { toast.error("Apple sign-in failed."); setBusy(false); return; }
                if (res.redirected) return;
              }}
              className="w-full flex items-center justify-center gap-3 bg-foreground text-background hover:opacity-90 rounded-md py-2.5 text-sm font-medium transition-opacity disabled:opacity-50"
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.9-1.5-.1-2.9.9-3.6.9-.8 0-1.9-.9-3.1-.8-1.6 0-3.1.9-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.6.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.1.7 1.3 0 2.1-1.2 2.9-2.4.9-1.4 1.3-2.7 1.3-2.8-.1 0-2.6-1-2.6-3.8zM14.1 5.6c.6-.8 1.1-1.9 1-3-.9 0-2.1.6-2.7 1.4-.6.7-1.2 1.8-1 2.9 1 .1 2.1-.5 2.7-1.3z"/>
              </svg>
              Continue with Apple
            </button>
          </div>

          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-4 w-full text-sm text-muted-foreground hover:text-gold"
          >
            {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
          </button>


          <p className="mt-6 text-xs text-muted-foreground text-center">
            Employee access only. Customer portal coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
