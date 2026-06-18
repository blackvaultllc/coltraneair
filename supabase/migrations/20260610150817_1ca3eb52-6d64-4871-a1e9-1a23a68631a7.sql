
CREATE POLICY "docs storage read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documents');
CREATE POLICY "docs storage upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND owner = auth.uid());
CREATE POLICY "docs storage delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND (owner = auth.uid() OR public.has_role(auth.uid(),'admin')));
