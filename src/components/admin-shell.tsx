import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import {
  LayoutDashboard, ShieldAlert, Plane, GraduationCap, Wallet, Users2,
  ScrollText, UserCog, MessagesSquare, Settings, LogOut, NotebookPen, FolderArchive, BookOpen, Trophy,
  Menu, X,
} from "lucide-react";
import { BRAND_SHORT } from "@/lib/brand";
import { useEffect, useState, type ReactNode } from "react";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  adminOnly?: boolean;
};
const NAV: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/governance", label: "Governance Control", icon: ShieldAlert, adminOnly: true },
  { to: "/admin/training", label: "Aviation Sandbox", icon: GraduationCap },
  { to: "/admin/academy-dashboard", label: "Academy Dashboard", icon: Trophy, adminOnly: true },
  { to: "/admin/bookkeeping", label: "Bookkeeping", icon: BookOpen },
  { to: "/admin/messages", label: "Communications Hub", icon: MessagesSquare },
  { to: "/admin/documents", label: "Document Cabinet", icon: FolderArchive },
  { to: "/admin/notes", label: "Notes Vault", icon: NotebookPen },
  { to: "/admin/flight-ops", label: "Flight Ops", icon: Plane },
  { to: "/admin/finance", label: "Finance Dept", icon: Wallet },
  { to: "/admin/customer-relations", label: "Customer Relations", icon: Users2 },
  { to: "/admin/compliance", label: "Compliance & Legal", icon: ScrollText },
  { to: "/admin/users", label: "User Management", icon: UserCog, adminOnly: true },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({ children, title }: { children: ReactNode; title: string }) {
  const { profile, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the drawer whenever the route changes
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;

  const items = NAV.filter((n) => !n.adminOnly || isAdmin);

  const NavList = (
    <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
      {items.map((n) => {
        const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
        const Icon = n.icon;
        return (
          <Link
            key={n.to} to={n.to as "/admin"}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
              active ? "bg-gold/10 text-gold border border-gold/30" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-champagne"
            }`}
          >
            <Icon className="size-4 shrink-0" /> <span className="truncate">{n.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const Footer = (
    <div className="p-4 border-t border-gold/15">
      <div className="text-xs text-muted-foreground truncate">{profile?.full_name ?? profile?.email}</div>
      <div className="text-[10px] text-gold/70 uppercase tracking-wider truncate">{profile?.title ?? (isAdmin ? "Admin" : "Member")}</div>
      <button onClick={signOut} className="mt-3 w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-destructive py-2 border border-border rounded-md">
        <LogOut className="size-3" /> Sign Out
      </button>
    </div>
  );

  const Brand = (
    <div className="p-6 border-b border-gold/15 flex items-center justify-between">
      <Link to="/" className="font-display text-xl text-gradient-gold truncate">{BRAND_SHORT}</Link>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background">
      <Toaster />

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 border-r border-gold/15 bg-sidebar flex-col">
        {Brand}
        <p className="px-6 -mt-2 pb-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Admin Console</p>
        {NavList}
        {Footer}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] border-r border-gold/15 bg-sidebar flex flex-col animate-in slide-in-from-left duration-200">
            <div className="p-6 border-b border-gold/15 flex items-center justify-between gap-3">
              <Link to="/" className="font-display text-xl text-gradient-gold truncate">{BRAND_SHORT}</Link>
              <button onClick={() => setMobileOpen(false)} className="text-muted-foreground hover:text-champagne" aria-label="Close">
                <X className="size-5" />
              </button>
            </div>
            <p className="px-6 -mt-2 pb-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Admin Console</p>
            {NavList}
            {Footer}
          </aside>
        </div>
      )}

      <main className="flex-1 min-w-0 overflow-y-auto">
        <header className="border-b border-gold/15 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 sticky top-0 bg-background/80 backdrop-blur-md z-10 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-md text-muted-foreground hover:text-champagne hover:bg-sidebar-accent"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
          <h1 className="font-display text-xl sm:text-2xl lg:text-3xl text-champagne truncate">{title}</h1>
        </header>
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
