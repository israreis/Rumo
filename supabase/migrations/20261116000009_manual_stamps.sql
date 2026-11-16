-- Carimbos cadastrados à mão, de viagens anteriores ao uso do app ("Meu passaporte").
-- Um carimbo por país e data de entrada; só o próprio usuário lê e altera.
CREATE TABLE IF NOT EXISTS public.manual_stamps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  country text NOT NULL CHECK (char_length(btrim(country)) BETWEEN 2 AND 60),
  entry_city text CHECK (entry_city IS NULL OR char_length(btrim(entry_city)) BETWEEN 1 AND 60),
  stamped_on date NOT NULL,
  note text CHECK (note IS NULL OR char_length(note) <= 80),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS manual_stamps_user_idx ON public.manual_stamps(user_id, stamped_on);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.manual_stamps TO authenticated;
GRANT ALL ON public.manual_stamps TO service_role;
ALTER TABLE public.manual_stamps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own manual stamps select" ON public.manual_stamps;
DROP POLICY IF EXISTS "own manual stamps insert" ON public.manual_stamps;
DROP POLICY IF EXISTS "own manual stamps update" ON public.manual_stamps;
DROP POLICY IF EXISTS "own manual stamps delete" ON public.manual_stamps;
CREATE POLICY "own manual stamps select" ON public.manual_stamps FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own manual stamps insert" ON public.manual_stamps FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own manual stamps update" ON public.manual_stamps FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own manual stamps delete" ON public.manual_stamps FOR DELETE TO authenticated USING (user_id = auth.uid());
