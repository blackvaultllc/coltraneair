
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM (
  'admin','president','vp_operations','vp_finance','vp_flight_ops','vp_training','manager','employee','customer'
);
CREATE TYPE public.dept_status AS ENUM ('active','inactive');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  title TEXT,
  department TEXT,
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ USER_ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer role check (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- ============ DEPARTMENTS ============
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  status public.dept_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.departments TO authenticated;
GRANT UPDATE ON public.departments TO authenticated;
GRANT ALL ON public.departments TO service_role;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

INSERT INTO public.departments(name, slug) VALUES
  ('Flight Operations','flight-ops'),
  ('Training Academy','training'),
  ('Finance','finance'),
  ('Customer Relations','customer-relations'),
  ('Compliance & Legal','compliance');

-- ============ DEPT MESSAGES ============
CREATE TABLE public.dept_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_dept TEXT NOT NULL,
  target_dept TEXT NOT NULL,
  message TEXT NOT NULL,
  signature TEXT NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.dept_messages TO authenticated;
GRANT ALL ON public.dept_messages TO service_role;
ALTER TABLE public.dept_messages ENABLE ROW LEVEL SECURITY;

-- ============ WAITLIST ============
CREATE TABLE public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.waitlist TO anon, authenticated;
GRANT SELECT ON public.waitlist TO authenticated;
GRANT ALL ON public.waitlist TO service_role;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- ============ TRAINING PROGRESS ============
CREATE TABLE public.training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started',
  score INT,
  hours_logged JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_progress TO authenticated;
GRANT ALL ON public.training_progress TO service_role;
ALTER TABLE public.training_progress ENABLE ROW LEVEL SECURITY;

-- ============ POLICIES ============
-- profiles
CREATE POLICY "profiles self read" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles self insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- user_roles
CREATE POLICY "user_roles self read" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- departments
CREATE POLICY "departments read all" ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "departments admin update" ON public.departments FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- dept_messages
CREATE POLICY "dept_messages read" ON public.dept_messages FOR SELECT TO authenticated
  USING (
    sender_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR target_dept = (SELECT department FROM public.profiles WHERE id = auth.uid())
  );
CREATE POLICY "dept_messages insert" ON public.dept_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- waitlist
CREATE POLICY "waitlist anon insert" ON public.waitlist FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "waitlist admin read" ON public.waitlist FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- training_progress
CREATE POLICY "training self read" ON public.training_progress FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "training self write" ON public.training_progress FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "training self update" ON public.training_progress FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- ============ NEW USER TRIGGER ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_seed_admin BOOLEAN := NEW.email = 'blackhatterxvi@gmail.com';
BEGIN
  INSERT INTO public.profiles (id, email, full_name, title, department, terms_accepted)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    CASE WHEN is_seed_admin THEN 'Head Administrator' ELSE NULL END,
    CASE WHEN is_seed_admin THEN 'Executive' ELSE NULL END,
    false
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN is_seed_admin THEN 'admin'::public.app_role ELSE 'customer'::public.app_role END);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER training_updated BEFORE UPDATE ON public.training_progress FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
