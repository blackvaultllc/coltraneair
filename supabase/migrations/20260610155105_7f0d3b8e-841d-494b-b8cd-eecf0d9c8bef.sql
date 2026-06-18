
ALTER TABLE public.comms ADD COLUMN IF NOT EXISTS recipient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS comms_recipient_id_idx ON public.comms(recipient_id);

DROP POLICY IF EXISTS "comms all read" ON public.comms;
CREATE POLICY "comms read scoped" ON public.comms
  FOR SELECT TO authenticated
  USING (
    recipient_id IS NULL
    OR recipient_id = auth.uid()
    OR user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource text NOT NULL,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit self insert" ON public.audit_log;
CREATE POLICY "audit self insert" ON public.audit_log
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "audit admin read" ON public.audit_log;
CREATE POLICY "audit admin read" ON public.audit_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
