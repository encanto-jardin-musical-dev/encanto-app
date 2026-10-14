-- attendance.check_in/check_out are `time without time zone` columns holding
-- the UTC time of day (clock_in_children/clock_out_children insert now() under
-- a UTC session), so the first version of this function, which declared
-- timestamptz result columns, failed at runtime. Return the school-local
-- (America/Bogota) time of day instead. The return type changes, so the
-- function has to be dropped first.
DROP FUNCTION IF EXISTS public.get_attendance_report(uuid, date, date);

CREATE FUNCTION public.get_attendance_report(
  p_child_id uuid,
  p_from date,
  p_to date
)
RETURNS TABLE (
  attendance_id uuid,
  attendance_date date,
  check_in time,
  check_out time
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
  select r.id, r.attendance_date, r.check_in, r.check_out
  from (
    select
      a.id,
      a.attendance_date,
      (((timestamp '2000-01-01' + a.check_in) at time zone 'UTC') at time zone 'America/Bogota')::time as check_in,
      (((timestamp '2000-01-01' + a.check_out) at time zone 'UTC') at time zone 'America/Bogota')::time as check_out
    from public.attendance a
    where a.child_id = p_child_id
      and a.attendance_date between p_from and p_to
      and a.check_in is not null
  ) r
  order by r.attendance_date desc, r.check_in asc;
end;
$$;

REVOKE ALL ON FUNCTION public.get_attendance_report(uuid, date, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_attendance_report(uuid, date, date) TO authenticated;

COMMENT ON FUNCTION public.get_attendance_report(uuid, date, date) IS 'Returns one row per attendance record of a child within an inclusive date range (max 90 days), most recent day first then check-in ascending. Times are school-local (America/Bogota) time of day. Staff only; attendance RLS applies.';
