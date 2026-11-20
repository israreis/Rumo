-- Exclusão da própria conta (Perfil > Excluir conta).
-- O app apaga antes os arquivos do usuário no bucket "media" pela API de Storage
-- (o Supabase não permite apagar storage.objects direto pelo SQL).
CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  -- Viagens do usuário: apaga tudo delas por cascata (roteiro, gastos, convites, membros…)
  DELETE FROM public.trips WHERE owner_id = uid;
  -- Sai das viagens que outras pessoas compartilharam com ele
  DELETE FROM public.trip_members WHERE user_id = uid;
  UPDATE public.trip_invites SET accepted_by = NULL WHERE accepted_by = uid;
  -- Conta: perfil e carimbos manuais caem por cascata
  DELETE FROM auth.users WHERE id = uid;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_my_account() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;
