ALTER TABLE public.ledger
  ADD COLUMN IF NOT EXISTS vendor text,
  ADD COLUMN IF NOT EXISTS vendor_group text,
  ADD COLUMN IF NOT EXISTS receipt_path text,
  ADD COLUMN IF NOT EXISTS subtotal numeric(12,2),
  ADD COLUMN IF NOT EXISTS tax_rate numeric(6,4),
  ADD COLUMN IF NOT EXISTS tax_amount numeric(12,2),
  ADD COLUMN IF NOT EXISTS is_service boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reimbursable boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payee text,
  ADD COLUMN IF NOT EXISTS irs_category text;

-- Auto-derive vendor_group from vendor prefix (first token, lowercased, alnum-only)
CREATE OR REPLACE FUNCTION public.tg_ledger_vendor_group()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  first_token text;
BEGIN
  IF NEW.vendor IS NOT NULL AND length(trim(NEW.vendor)) > 0 THEN
    first_token := lower(regexp_replace(split_part(trim(NEW.vendor), ' ', 1), '[^a-z0-9]', '', 'gi'));
    NEW.vendor_group := NULLIF(first_token, '');
  ELSE
    NEW.vendor_group := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ledger_vendor_group_trg ON public.ledger;
CREATE TRIGGER ledger_vendor_group_trg
  BEFORE INSERT OR UPDATE OF vendor ON public.ledger
  FOR EACH ROW EXECUTE FUNCTION public.tg_ledger_vendor_group();

-- Backfill any existing rows
UPDATE public.ledger SET vendor = vendor WHERE vendor IS NOT NULL;

-- Storage RLS for receipts bucket (bucket created separately)
CREATE POLICY "receipts owner read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'receipts' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'::public.app_role)));

CREATE POLICY "receipts owner write" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "receipts owner delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'receipts' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'::public.app_role)));