-- Guardar só os 4 últimos dígitos do passaporte: o aviso de vencimento só precisa da
-- validade, e 4 dígitos bastam para reconhecer o documento. Converte o que já existe e
-- apaga a coluna com o número completo.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS passport_last4 text;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'passport_number') THEN
    UPDATE public.profiles
      SET passport_last4 = upper(right(regexp_replace(passport_number, '[^A-Za-z0-9]', '', 'g'), 4))
      WHERE passport_number IS NOT NULL AND passport_last4 IS NULL;
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_passport_number_len;
    ALTER TABLE public.profiles DROP COLUMN passport_number;
  END IF;
END $$;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_passport_last4_fmt;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_passport_last4_fmt CHECK (passport_last4 IS NULL OR passport_last4 ~ '^[A-Z0-9]{4}$');
