
-- Fix profiles update to prevent users from changing their own department
DROP POLICY IF EXISTS "profiles self update" ON public.profiles;
CREATE POLICY "profiles self update" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((auth.uid() = id) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR (
      auth.uid() = id
      AND department IS NOT DISTINCT FROM (SELECT p.department FROM public.profiles p WHERE p.id = auth.uid())
      AND title IS NOT DISTINCT FROM (SELECT p.title FROM public.profiles p WHERE p.id = auth.uid())
    )
  );

-- Harden dept_messages INSERT: sender_dept must match actual profile, is_system must be false (unless admin)
DROP POLICY IF EXISTS "dept_messages insert" ON public.dept_messages;
CREATE POLICY "dept_messages insert" ON public.dept_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR (
        is_system = false
        AND sender_dept IS NOT DISTINCT FROM (SELECT p.department FROM public.profiles p WHERE p.id = auth.uid())
      )
    )
  );

-- Restrict documents reads to owner or admin
DROP POLICY IF EXISTS "docs all read" ON public.documents;
CREATE POLICY "docs self read" ON public.documents
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Restrict storage reads on documents bucket to owner or admin
DROP POLICY IF EXISTS "docs storage read" ON storage.objects;
CREATE POLICY "docs storage read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND (owner = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)));

-- Add missing DELETE policy on training_progress
CREATE POLICY "training self delete" ON public.training_progress
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Remove hardcoded admin email from trigger; keep existing admin assignment intact
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, terms_accepted)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    false
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer'::public.app_role);
  RETURN NEW;
END;
$function$;

-- Lock down SECURITY DEFINER trigger functions so they cannot be invoked directly
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at() FROM PUBLIC, anon, authenticated;
