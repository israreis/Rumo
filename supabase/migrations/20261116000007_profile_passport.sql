-- Passaporte real do usuário (número e validade), usado na página "Meu passaporte".
-- Fica no perfil, que só o próprio dono lê e altera (políticas "own profile ...").
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS passport_number text,
  ADD COLUMN IF NOT EXISTS passport_expiry date;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_passport_number_len;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_passport_number_len CHECK (passport_number IS NULL OR char_length(passport_number) BETWEEN 5 AND 20);
