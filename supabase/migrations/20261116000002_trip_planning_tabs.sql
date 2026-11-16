
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
