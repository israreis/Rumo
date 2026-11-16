-- Etapa 5: compartilhamento (convites por e-mail, papéis) e link público somente leitura.

-- Members may leave a trip they were invited to (owners cannot).
CREATE POLICY "members leave" ON public.trip_members FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND role <> 'owner');

CREATE OR REPLACE FUNCTION public.is_trip_owner(_trip uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.trips WHERE id = _trip AND owner_id = _user)
      OR public.trip_role_of(_trip, _user) = 'owner'
$$;

-- Invitations ---------------------------------------------------------------
CREATE TABLE public.trip_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  email text NOT NULL CHECK (email = lower(email)),
  role public.trip_role NOT NULL DEFAULT 'viewer' CHECK (role <> 'owner'),
  token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  invited_by uuid NOT NULL DEFAULT auth.uid(),
  accepted_at timestamptz,
  accepted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trip_id, email)
);
CREATE INDEX ON public.trip_invites(trip_id);
CREATE INDEX ON public.trip_invites(email);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_invites TO authenticated;
GRANT ALL ON public.trip_invites TO service_role;
ALTER TABLE public.trip_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invites owner select" ON public.trip_invites FOR SELECT TO authenticated USING (public.is_trip_owner(trip_id, auth.uid()));
CREATE POLICY "invites owner insert" ON public.trip_invites FOR INSERT TO authenticated WITH CHECK (public.is_trip_owner(trip_id, auth.uid()));
CREATE POLICY "invites owner update" ON public.trip_invites FOR UPDATE TO authenticated USING (public.is_trip_owner(trip_id, auth.uid()));
CREATE POLICY "invites owner delete" ON public.trip_invites FOR DELETE TO authenticated USING (public.is_trip_owner(trip_id, auth.uid()));

-- Accept one invite from its link. The signed-in e-mail must match the invited one.
CREATE OR REPLACE FUNCTION public.accept_trip_invite(_token uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  inv public.trip_invites;
  me text := lower(coalesce(auth.jwt() ->> 'email', ''));
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT * INTO inv FROM public.trip_invites WHERE token = _token;
  IF NOT FOUND THEN RAISE EXCEPTION 'invite_not_found'; END IF;
  IF inv.email <> me THEN RAISE EXCEPTION 'invite_email_mismatch'; END IF;
  INSERT INTO public.trip_members(trip_id, user_id, role) VALUES (inv.trip_id, auth.uid(), inv.role)
    ON CONFLICT (trip_id, user_id) DO UPDATE SET role = EXCLUDED.role
    WHERE public.trip_members.role <> 'owner';
  UPDATE public.trip_invites SET accepted_at = coalesce(accepted_at, now()), accepted_by = auth.uid() WHERE id = inv.id;
  RETURN inv.trip_id;
END $$;

-- Accept every pending invite sent to the signed-in e-mail (called when the app opens).
CREATE OR REPLACE FUNCTION public.accept_pending_invites()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  inv public.trip_invites;
  me text := lower(coalesce(auth.jwt() ->> 'email', ''));
  n integer := 0;
BEGIN
  IF auth.uid() IS NULL OR me = '' THEN RETURN 0; END IF;
  FOR inv IN SELECT * FROM public.trip_invites WHERE email = me AND accepted_at IS NULL LOOP
    INSERT INTO public.trip_members(trip_id, user_id, role) VALUES (inv.trip_id, auth.uid(), inv.role)
      ON CONFLICT (trip_id, user_id) DO UPDATE SET role = EXCLUDED.role
      WHERE public.trip_members.role <> 'owner';
    UPDATE public.trip_invites SET accepted_at = now(), accepted_by = auth.uid() WHERE id = inv.id;
    n := n + 1;
  END LOOP;
  RETURN n;
END $$;

-- Members of a trip with name and e-mail (profiles are private, so this goes through a definer).
CREATE OR REPLACE FUNCTION public.get_trip_members(_trip uuid)
RETURNS TABLE (user_id uuid, role public.trip_role, full_name text, email text, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.user_id, m.role, p.full_name, u.email::text, p.avatar_url
  FROM public.trip_members m
  LEFT JOIN public.profiles p ON p.id = m.user_id
  LEFT JOIN auth.users u ON u.id = m.user_id
  WHERE m.trip_id = _trip AND public.can_view_trip(_trip, auth.uid())
  ORDER BY (m.role = 'owner') DESC, m.created_at
$$;

REVOKE EXECUTE ON FUNCTION public.accept_trip_invite(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.accept_pending_invites() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_trip_members(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_trip_invite(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_pending_invites() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_trip_members(uuid) TO authenticated;

-- Public read-only itinerary link --------------------------------------------
ALTER TABLE public.trips ADD COLUMN public_token uuid UNIQUE;

-- Only what the family needs to follow the trip: no prices, booking codes, documents or notes.
CREATE OR REPLACE FUNCTION public.get_public_trip(_token uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'trip', jsonb_build_object('id', t.id, 'name', t.name, 'start_date', t.start_date, 'end_date', t.end_date, 'cover_url', t.cover_url),
    'destinations', coalesce((
      SELECT jsonb_agg(jsonb_build_object('city', d.city, 'country', d.country, 'arrival_date', d.arrival_date,
        'departure_date', d.departure_date, 'timezone', d.timezone) ORDER BY d.position)
      FROM public.trip_destinations d WHERE d.trip_id = t.id), '[]'::jsonb),
    'transports', coalesce((
      SELECT jsonb_agg(jsonb_build_object('id', x.id, 'type', x.type, 'origin', x.origin, 'destination', x.destination,
        'departure_at', x.departure_at, 'departure_tz', x.departure_tz, 'arrival_at', x.arrival_at, 'arrival_tz', x.arrival_tz,
        'company', x.company, 'code', x.code) ORDER BY x.departure_at)
      FROM public.transports x WHERE x.trip_id = t.id), '[]'::jsonb),
    'lodgings', coalesce((
      SELECT jsonb_agg(jsonb_build_object('id', l.id, 'name', l.name, 'type', l.type, 'address', l.address,
        'check_in_date', l.check_in_date, 'check_in_time', l.check_in_time, 'check_out_date', l.check_out_date,
        'check_out_time', l.check_out_time) ORDER BY l.check_in_date)
      FROM public.lodgings l WHERE l.trip_id = t.id), '[]'::jsonb),
    'activities', coalesce((
      SELECT jsonb_agg(jsonb_build_object('id', a.id, 'name', a.name, 'category', a.category, 'date', a.date,
        'time', a.time, 'location', a.location, 'position', a.position) ORDER BY a.date, a.position)
      FROM public.activities a WHERE a.trip_id = t.id AND a.date IS NOT NULL), '[]'::jsonb),
    'events', coalesce((
      SELECT jsonb_agg(jsonb_build_object('id', e.id, 'day', e.day, 'start_time', e.start_time, 'end_time', e.end_time,
        'title', e.title, 'location', e.location, 'category', e.category, 'position', e.position) ORDER BY e.day, e.position)
      FROM public.itinerary_events e WHERE e.trip_id = t.id), '[]'::jsonb)
  )
  FROM public.trips t
  WHERE _token IS NOT NULL AND t.public_token = _token
$$;
GRANT EXECUTE ON FUNCTION public.get_public_trip(uuid) TO anon, authenticated;
