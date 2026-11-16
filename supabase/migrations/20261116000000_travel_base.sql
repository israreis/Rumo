
CREATE TYPE public.trip_role AS ENUM ('owner','editor','viewer');
CREATE TYPE public.trip_status AS ENUM ('planning','confirmed','ongoing','completed');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  default_currency text NOT NULL DEFAULT 'BRL',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

CREATE TABLE public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  start_date date,
  end_date date,
  travelers_count int NOT NULL DEFAULT 1,
  currency text NOT NULL DEFAULT 'BRL',
  budget numeric(14,2),
  cover_url text,
  status_override public.trip_status,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trips TO authenticated;
GRANT ALL ON public.trips TO service_role;

CREATE TABLE public.trip_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role public.trip_role NOT NULL DEFAULT 'viewer',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trip_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_members TO authenticated;
GRANT ALL ON public.trip_members TO service_role;

CREATE TABLE public.trip_destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  city text NOT NULL,
  country text,
  arrival_date date,
  departure_date date,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_destinations TO authenticated;
GRANT ALL ON public.trip_destinations TO service_role;

CREATE TABLE public.trip_travelers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_travelers TO authenticated;
GRANT ALL ON public.trip_travelers TO service_role;

CREATE INDEX ON public.trip_members(user_id);
CREATE INDEX ON public.trip_destinations(trip_id);
CREATE INDEX ON public.trip_travelers(trip_id);

CREATE OR REPLACE FUNCTION public.trip_role_of(_trip uuid, _user uuid)
RETURNS public.trip_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.trip_members WHERE trip_id = _trip AND user_id = _user
$$;
CREATE OR REPLACE FUNCTION public.can_view_trip(_trip uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.trip_members WHERE trip_id = _trip AND user_id = _user)
      OR EXISTS (SELECT 1 FROM public.trips WHERE id = _trip AND owner_id = _user)
$$;
CREATE OR REPLACE FUNCTION public.can_edit_trip(_trip uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.trip_members WHERE trip_id = _trip AND user_id = _user AND role IN ('owner','editor'))
      OR EXISTS (SELECT 1 FROM public.trips WHERE id = _trip AND owner_id = _user)
$$;

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trips select" ON public.trips FOR SELECT TO authenticated USING (owner_id = auth.uid() OR public.can_view_trip(id, auth.uid()));
CREATE POLICY "trips insert" ON public.trips FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "trips update" ON public.trips FOR UPDATE TO authenticated USING (public.can_edit_trip(id, auth.uid())) WITH CHECK (public.can_edit_trip(id, auth.uid()));
CREATE POLICY "trips delete" ON public.trips FOR DELETE TO authenticated USING (owner_id = auth.uid());

ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members select" ON public.trip_members FOR SELECT TO authenticated USING (public.can_view_trip(trip_id, auth.uid()));
CREATE POLICY "members manage" ON public.trip_members FOR ALL TO authenticated
  USING (public.trip_role_of(trip_id, auth.uid()) = 'owner')
  WITH CHECK (public.trip_role_of(trip_id, auth.uid()) = 'owner');

ALTER TABLE public.trip_destinations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dest select" ON public.trip_destinations FOR SELECT TO authenticated USING (public.can_view_trip(trip_id, auth.uid()));
CREATE POLICY "dest insert" ON public.trip_destinations FOR INSERT TO authenticated WITH CHECK (public.can_edit_trip(trip_id, auth.uid()));
CREATE POLICY "dest update" ON public.trip_destinations FOR UPDATE TO authenticated USING (public.can_edit_trip(trip_id, auth.uid()));
CREATE POLICY "dest delete" ON public.trip_destinations FOR DELETE TO authenticated USING (public.can_edit_trip(trip_id, auth.uid()));

ALTER TABLE public.trip_travelers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trav select" ON public.trip_travelers FOR SELECT TO authenticated USING (public.can_view_trip(trip_id, auth.uid()));
CREATE POLICY "trav insert" ON public.trip_travelers FOR INSERT TO authenticated WITH CHECK (public.can_edit_trip(trip_id, auth.uid()));
CREATE POLICY "trav update" ON public.trip_travelers FOR UPDATE TO authenticated USING (public.can_edit_trip(trip_id, auth.uid()));
CREATE POLICY "trav delete" ON public.trip_travelers FOR DELETE TO authenticated USING (public.can_edit_trip(trip_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER trips_touch BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.add_trip_owner() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.trip_members(trip_id, user_id, role) VALUES (NEW.id, NEW.owner_id, 'owner') ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER trips_add_owner AFTER INSERT ON public.trips FOR EACH ROW EXECUTE FUNCTION public.add_trip_owner();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t uuid; d date := current_date + 30; nm text;
BEGIN
  nm := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1));
  INSERT INTO public.profiles(id, full_name, avatar_url) VALUES (NEW.id, nm, NEW.raw_user_meta_data->>'avatar_url') ON CONFLICT DO NOTHING;
  INSERT INTO public.trips(owner_id, name, start_date, end_date, travelers_count, currency, budget, cover_url)
    VALUES (NEW.id, 'Lisboa e Porto', d, d + 10, 2, 'BRL', 18000, '/images/lisboa.jpg') RETURNING id INTO t;
  INSERT INTO public.trip_destinations(trip_id, city, country, arrival_date, departure_date, position) VALUES
    (t, 'Lisboa', 'Portugal', d, d + 6, 0),
    (t, 'Porto', 'Portugal', d + 6, d + 10, 1);
  INSERT INTO public.trip_travelers(trip_id, name, email, position) VALUES
    (t, nm, NEW.email, 0), (t, 'Acompanhante', NULL, 1);
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "media read" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "media insert own" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "media update own" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "media delete own" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);
