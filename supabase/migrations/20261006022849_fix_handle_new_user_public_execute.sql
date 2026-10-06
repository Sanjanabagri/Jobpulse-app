-- Revoke PUBLIC execute on handle_new_user (only trigger caller / service_role needs it)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;