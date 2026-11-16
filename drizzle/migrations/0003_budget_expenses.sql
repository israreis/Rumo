
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
