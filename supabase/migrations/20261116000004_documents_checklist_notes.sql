CREATE TABLE public.traveler_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  traveler_id uuid REFERENCES public.trip_travelers(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'passport',
  number text, issuer text, phone text,
  expires_at date, notes text, attachment_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'personal',
  name text NOT NULL, phone text, notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  list text NOT NULL DEFAULT 'pre',
  title text NOT NULL,
  due_date date,
  assignee uuid REFERENCES public.trip_travelers(id) ON DELETE SET NULL,
  done boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.trip_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  day date,
  title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['traveler_documents','emergency_contacts','checklist_items','trip_notes'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "%s select" ON public.%I FOR SELECT TO authenticated USING (public.can_view_trip(trip_id, auth.uid()))', t, t);
    EXECUTE format('CREATE POLICY "%s insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.can_edit_trip(trip_id, auth.uid()))', t, t);
    EXECUTE format('CREATE POLICY "%s update" ON public.%I FOR UPDATE TO authenticated USING (public.can_edit_trip(trip_id, auth.uid()))', t, t);
    EXECUTE format('CREATE POLICY "%s delete" ON public.%I FOR DELETE TO authenticated USING (public.can_edit_trip(trip_id, auth.uid()))', t, t);
    EXECUTE format('CREATE INDEX ON public.%I (trip_id)', t);
  END LOOP;
END $$;