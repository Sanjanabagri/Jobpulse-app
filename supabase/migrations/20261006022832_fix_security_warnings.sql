-- Fix mutable search_path on update_updated_at
ALTER FUNCTION public.update_updated_at() SET search_path = public, pg_temp;

-- Revoke EXECUTE from anon on handle_new_user (it's a trigger, not meant to be called via API)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;