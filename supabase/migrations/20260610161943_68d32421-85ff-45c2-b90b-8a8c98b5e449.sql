
-- Tighten comms broadcast reads to staff (non-customer roles) only
DROP POLICY IF EXISTS "comms read scoped" ON public.comms;
CREATE POLICY "comms read scoped" ON public.comms
FOR SELECT
USING (
  user_id = auth.uid()
  OR recipient_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::public.app_role)
  OR (
    recipient_id IS NULL
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role <> 'customer'::public.app_role
    )
  )
);

-- Add explicit owner/admin UPDATE policy on documents
CREATE POLICY "docs self update" ON public.documents
FOR UPDATE
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::public.app_role));
