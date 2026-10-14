-- Per-child attendance report for staff. SECURITY INVOKER so the existing
-- attendance RLS decides visibility (admins see all rows; teachers only rows of
-- children in their assigned groups).
CREATE OR REPLACE FUNCTION public.get_attendance_report(
  p_child_id uuid,
  p_from date,
  p_to date
)
RETURNS TABLE (
  attendance_id uuid,
  attendance_date date,
  check_in timestamptz,
  check_out timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'Only teachers or admins can read attendance reports';
  end if;

  if p_to < p_from then
    raise exception 'Invalid range: end date is before start date';
  end if;

  if p_to - p_from > 89 then
    raise exception 'Invalid range: maximum is 90 days';
  end if;

  return query
  select a.id, a.attendance_date, a.check_in, a.check_out
  from public.attendance a
  where a.child_id = p_child_id
    and a.attendance_date between p_from and p_to
    and a.check_in is not null
  order by a.attendance_date desc, a.check_in asc;
end;
$$;

REVOKE ALL ON FUNCTION public.get_attendance_report(uuid, date, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_attendance_report(uuid, date, date) TO authenticated;

COMMENT ON FUNCTION public.get_attendance_report(uuid, date, date) IS 'Returns one row per attendance record of a child within an inclusive date range (max 90 days), most recent day first then check-in ascending. Staff only; attendance RLS applies.';
