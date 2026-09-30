-- These read-only RLS helpers only inspect profiles, which authenticated users
-- can read under the profiles RLS policy. Run them as the caller so execution
-- does not bypass RLS or trigger the SECURITY DEFINER advisor warning.
ALTER FUNCTION public.is_admin(uuid) SECURITY INVOKER;
ALTER FUNCTION public.is_staff(uuid) SECURITY INVOKER;
