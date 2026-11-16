-- Rumo — schema completo do banco (gerado por scripts/build-setup-sql.mjs; não edite à mão).
-- Cole tudo no SQL Editor de um projeto Supabase NOVO e clique em Run.

-- ============================================================
-- 20261116000000_travel_base.sql
-- ============================================================
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

-- ============================================================
-- 20261116000001_media_read_own.sql
-- ============================================================
DROP POLICY IF EXISTS "media read" ON storage.objects;
CREATE POLICY "media read own" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- 20261116000002_trip_planning_tabs.sql
-- ============================================================
ALTER TABLE public.trip_destinations ADD COLUMN timezone text;

CREATE TABLE public.transports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'flight',
  origin text, destination text,
  departure_at timestamptz, departure_tz text,
  arrival_at timestamptz, arrival_tz text,
  company text, code text, locator text, seat text, baggage text, class text,
  price numeric(14,2), currency text NOT NULL DEFAULT 'BRL',
  payment_status text NOT NULL DEFAULT 'pending',
  booking_url text, attachment_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.lodgings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  name text NOT NULL, type text NOT NULL DEFAULT 'hotel', address text,
  lat double precision, lng double precision,
  check_in_date date, check_in_time time, check_out_date date, check_out_time time,
  nightly_rate numeric(14,2), total numeric(14,2), currency text NOT NULL DEFAULT 'BRL',
  tourist_tax numeric(14,2), cleaning_fee numeric(14,2),
  cancellation_policy text, free_cancel_until date,
  booking_code text, contact text, attachment_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  name text NOT NULL, category text NOT NULL DEFAULT 'attraction',
  date date, time time, location text, lat double precision, lng double precision,
  unit_price numeric(14,2), quantity int NOT NULL DEFAULT 1, currency text NOT NULL DEFAULT 'BRL',
  purchased boolean NOT NULL DEFAULT false, purchase_url text, attachment_url text,
  priority text NOT NULL DEFAULT 'must',
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.itinerary_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  day date NOT NULL, start_time time, end_time time,
  title text NOT NULL, location text, lat double precision, lng double precision,
  category text NOT NULL DEFAULT 'free', cost numeric(14,2), notes text,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['transports','lodgings','activities','itinerary_events'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE INDEX ON public.%I(trip_id)', t);
    EXECUTE format('CREATE POLICY "%s select" ON public.%I FOR SELECT TO authenticated USING (public.can_view_trip(trip_id, auth.uid()))', t, t);
    EXECUTE format('CREATE POLICY "%s insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.can_edit_trip(trip_id, auth.uid()))', t, t);
    EXECUTE format('CREATE POLICY "%s update" ON public.%I FOR UPDATE TO authenticated USING (public.can_edit_trip(trip_id, auth.uid()))', t, t);
    EXECUTE format('CREATE POLICY "%s delete" ON public.%I FOR DELETE TO authenticated USING (public.can_edit_trip(trip_id, auth.uid()))', t, t);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.seed_sample_plan(t uuid, d date) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.trip_destinations SET timezone = 'Europe/Lisbon' WHERE trip_id = t;
  INSERT INTO public.transports(trip_id,type,origin,destination,departure_at,departure_tz,arrival_at,arrival_tz,company,code,locator,seat,baggage,class,price,currency,payment_status) VALUES
   (t,'flight','São Paulo (GRU)','Lisboa (LIS)',((d-1)+time '22:30') AT TIME ZONE 'America/Sao_Paulo','America/Sao_Paulo',(d+time '12:05') AT TIME ZONE 'Europe/Lisbon','Europe/Lisbon','TAP Air Portugal','TP 88','XK7P2Q','23A, 23B','1 mala 23kg','Econômica',4200,'BRL','paid'),
   (t,'train','Lisboa Santa Apolónia','Porto Campanhã',((d+6)+time '10:09') AT TIME ZONE 'Europe/Lisbon','Europe/Lisbon',((d+6)+time '12:58') AT TIME ZONE 'Europe/Lisbon','Europe/Lisbon','CP Alfa Pendular','AP 131','CP99812','Carro 4, 51-52','Livre','Turística',62,'EUR','paid'),
   (t,'flight','Porto (OPO)','São Paulo (GRU)',((d+10)+time '11:40') AT TIME ZONE 'Europe/Lisbon','Europe/Lisbon',((d+10)+time '18:55') AT TIME ZONE 'America/Sao_Paulo','America/Sao_Paulo','TAP Air Portugal','TP 103','XK7P2Q','18C, 18D','1 mala 23kg','Econômica',NULL,'BRL','paid');
  INSERT INTO public.lodgings(trip_id,name,type,address,lat,lng,check_in_date,check_in_time,check_out_date,check_out_time,nightly_rate,total,currency,tourist_tax,cancellation_policy,free_cancel_until,booking_code,contact) VALUES
   (t,'Memmo Alfama Hotel','hotel','Travessa das Merceeiras 27, Lisboa',38.7110,-9.1307,d,'15:00',d+6,'11:00',180,1080,'EUR',24,'Cancelamento gratuito até 7 dias antes',d-7,'BK-55120','+351 210 495 660'),
   (t,'Apartamento Ribeira','apartment','Rua de São João 40, Porto',41.1410,-8.6130,d+6,'16:00',d+10,'10:00',120,480,'EUR',16,'Não reembolsável após a data-limite',d-14,'AB-HX92K','Anfitrião: Rui');
  INSERT INTO public.activities(trip_id,name,category,date,time,location,lat,lng,unit_price,quantity,currency,purchased,priority,position) VALUES
   (t,'Torre de Belém','attraction',d+1,'10:00','Av. Brasília, Lisboa',38.6916,-9.2160,10,2,'EUR',true,'must',0),
   (t,'Pastéis de Belém','restaurant',d+1,'12:30','Rua de Belém 84, Lisboa',38.6975,-9.2032,8,2,'EUR',false,'must',1),
   (t,'Oceanário de Lisboa','museum',d+3,'14:00','Esplanada D. Carlos I, Lisboa',38.7635,-9.0937,26,2,'EUR',true,'must',0),
   (t,'Livraria Lello','attraction',d+7,'09:30','Rua das Carmelitas 144, Porto',41.1469,-8.6149,10,2,'EUR',true,'must',0),
   (t,'Show de fado em Alfama','show',NULL,NULL,'Alfama, Lisboa',38.7118,-9.1300,45,2,'EUR',false,'must',0),
   (t,'Cruzeiro das 6 pontes','tour',NULL,NULL,'Cais da Ribeira, Porto',41.1403,-8.6130,18,2,'EUR',false,'optional',1);
  INSERT INTO public.itinerary_events(trip_id,day,start_time,end_time,title,location,lat,lng,category,cost,notes,position) VALUES
   (t,d+1,'15:00','17:00','Passeio pela Baixa e Chiado','Praça do Comércio, Lisboa',38.7075,-9.1364,'free',NULL,'Subir o Elevador de Santa Justa',2),
   (t,d+2,'20:00','22:00','Jantar no Time Out Market','Mercado da Ribeira, Lisboa',38.7069,-9.1458,'meal',90,NULL,0),
   (t,d+8,'13:00','15:00','Almoço com francesinha','Café Santiago, Porto',41.1465,-8.6060,'meal',40,NULL,0);
END $$;

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
  PERFORM public.seed_sample_plan(t, d);
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.seed_sample_plan(uuid, date) FROM PUBLIC, anon, authenticated;

-- ============================================================
-- 20261116000003_budget_expenses.sql
-- ============================================================
ALTER TABLE public.trips ADD COLUMN iof_pct numeric(6,3) NOT NULL DEFAULT 0, ADD COLUMN card_spread_pct numeric(6,3) NOT NULL DEFAULT 0;
ALTER TABLE public.trip_destinations ADD COLUMN currency text;

ALTER TABLE public.transports ADD COLUMN fx_rate numeric(18,8), ADD COLUMN converted_amount numeric(14,2), ADD COLUMN due_date date, ADD COLUMN installments int NOT NULL DEFAULT 1, ADD COLUMN first_installment_month date;
ALTER TABLE public.lodgings ADD COLUMN fx_rate numeric(18,8), ADD COLUMN converted_amount numeric(14,2), ADD COLUMN due_date date, ADD COLUMN installments int NOT NULL DEFAULT 1, ADD COLUMN first_installment_month date, ADD COLUMN payment_status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.activities ADD COLUMN fx_rate numeric(18,8), ADD COLUMN converted_amount numeric(14,2), ADD COLUMN due_date date, ADD COLUMN installments int NOT NULL DEFAULT 1, ADD COLUMN first_installment_month date;
ALTER TABLE public.itinerary_events ADD COLUMN fx_rate numeric(18,8), ADD COLUMN converted_amount numeric(14,2);

CREATE TABLE public.budget_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'other',
  description text NOT NULL,
  kind text NOT NULL DEFAULT 'fixed',
  amount numeric(14,2) NOT NULL DEFAULT 0,
  days int, people int,
  currency text NOT NULL DEFAULT 'BRL',
  fx_rate numeric(18,8), converted_amount numeric(14,2),
  paid boolean NOT NULL DEFAULT false,
  due_date date, installments int NOT NULL DEFAULT 1, first_installment_month date,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  amount numeric(14,2) NOT NULL,
  currency text NOT NULL DEFAULT 'BRL',
  fx_rate numeric(18,8) NOT NULL DEFAULT 1,
  fees_pct numeric(6,3) NOT NULL DEFAULT 0,
  converted_amount numeric(14,2) NOT NULL,
  category text NOT NULL DEFAULT 'other',
  payment_method text NOT NULL DEFAULT 'credit',
  date date NOT NULL DEFAULT current_date,
  description text,
  receipt_url text,
  paid_by uuid REFERENCES public.trip_travelers(id) ON DELETE SET NULL,
  split_mode text NOT NULL DEFAULT 'equal',
  splits jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['budget_items','expenses'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE INDEX ON public.%I(trip_id)', t);
    EXECUTE format('CREATE POLICY "%s select" ON public.%I FOR SELECT TO authenticated USING (public.can_view_trip(trip_id, auth.uid()))', t, t);
    EXECUTE format('CREATE POLICY "%s insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.can_edit_trip(trip_id, auth.uid()))', t, t);
    EXECUTE format('CREATE POLICY "%s update" ON public.%I FOR UPDATE TO authenticated USING (public.can_edit_trip(trip_id, auth.uid()))', t, t);
    EXECUTE format('CREATE POLICY "%s delete" ON public.%I FOR DELETE TO authenticated USING (public.can_edit_trip(trip_id, auth.uid()))', t, t);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.seed_sample_budget(t uuid, d date) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.trip_destinations SET currency = 'EUR' WHERE trip_id = t;
  UPDATE public.trips SET iof_pct = 3.5, card_spread_pct = 4 WHERE id = t;
  UPDATE public.transports SET installments = 5, first_installment_month = date_trunc('month', d - 60)::date WHERE trip_id = t AND type = 'flight' AND price IS NOT NULL;
  INSERT INTO public.budget_items(trip_id, category, description, kind, amount, days, people, currency) VALUES
    (t, 'food', 'Alimentação diária', 'daily', 35, 10, 2, 'EUR'),
    (t, 'insurance', 'Seguro viagem', 'fixed', 320, NULL, NULL, 'BRL'),
    (t, 'internet', 'eSIM Europa', 'fixed', 25, NULL, NULL, 'EUR'),
    (t, 'emergency', 'Reserva de emergência', 'fixed', 1500, NULL, NULL, 'BRL');
  UPDATE public.budget_items SET paid = true WHERE trip_id = t AND category = 'insurance';
END $$;
REVOKE EXECUTE ON FUNCTION public.seed_sample_budget(uuid, date) FROM PUBLIC, anon, authenticated;

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
  PERFORM public.seed_sample_plan(t, d);
  PERFORM public.seed_sample_budget(t, d);
  RETURN NEW;
END $$;

-- ============================================================
-- 20261116000004_documents_checklist_notes.sql
-- ============================================================
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

-- ============================================================
-- 20261116000005_storage_bucket.sql
-- ============================================================
-- Private bucket for covers, receipts, tickets and documents. Files live under {userId}/...
-- and are shared through long-lived signed URLs (see uploadImage in src/lib/trips-api.ts).
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 20261116000006_sharing.sql
-- ============================================================
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
