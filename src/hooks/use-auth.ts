import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type Role =
  | "admin" | "president" | "vp_operations" | "vp_finance"
  | "vp_flight_ops" | "vp_training" | "manager" | "employee" | "customer";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  title: string | null;
  department: string | null;
  terms_accepted: boolean;
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (!s?.user) {
        setProfile(null);
        setRoles([]);
      } else {
        // defer
        setTimeout(() => loadProfile(s.user.id), 0);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) loadProfile(data.session.user.id);
      else setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function loadProfile(uid: string) {
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid),
    ]);
    setProfile(p as Profile | null);
    setRoles(((r ?? []) as { role: Role }[]).map((x) => x.role));
    setLoading(false);
  }

  const isAdmin = roles.includes("admin");
  const isEmployee = roles.some((r) => r !== "customer");

  return { user, session, profile, roles, loading, isAdmin, isEmployee, reload: () => user && loadProfile(user.id) };
}
