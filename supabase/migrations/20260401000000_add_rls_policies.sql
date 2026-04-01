-- Allow public (anonymous and authenticated) read access to trails.
-- service_role bypasses RLS automatically — no policy needed for it.
CREATE POLICY "trails_public_select"
  ON public.trails
  FOR SELECT
  TO anon, authenticated
  USING (true);
