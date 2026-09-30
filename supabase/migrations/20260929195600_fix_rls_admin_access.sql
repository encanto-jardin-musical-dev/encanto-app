-- RLS helper functions must be executable by authenticated callers, but not anon.
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;

-- Do not expose group, child, or attendance rows to anonymous callers.
REVOKE SELECT ON TABLE public.groups, public.children, public.attendance FROM PUBLIC, anon;

-- A guardian may see groups associated with their own children. Staff access is
-- explicitly bounded by admin role or teacher assignment.
DROP POLICY IF EXISTS "Enable read access for all users" ON public.groups;
CREATE POLICY "authorized_select_groups"
  ON public.groups
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin((SELECT auth.uid()))
    OR (
      public.is_staff((SELECT auth.uid()))
      AND EXISTS (
        SELECT 1
        FROM public.group_teachers AS gt
        WHERE gt.group_id = groups.id
          AND gt.teacher_id = (SELECT auth.uid())
      )
    )
    OR (
      NOT public.is_staff((SELECT auth.uid()))
      AND EXISTS (
        SELECT 1
        FROM public.child_groups AS cg
        JOIN public.child_guardians AS cgd ON cgd.child_id = cg.child_id
        WHERE cg.group_id = groups.id
          AND cgd.guardian_id = (SELECT auth.uid())
      )
    )
  );

-- Child-group relationships are visible to admins, teachers assigned to that
-- group, and guardians linked to the child.
DROP POLICY IF EXISTS "authenticated_select_child_groups" ON public.child_groups;
CREATE POLICY "authorized_select_child_groups"
  ON public.child_groups
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin((SELECT auth.uid()))
    OR (
      public.is_staff((SELECT auth.uid()))
      AND EXISTS (
        SELECT 1
        FROM public.group_teachers AS gt
        WHERE gt.group_id = child_groups.group_id
          AND gt.teacher_id = (SELECT auth.uid())
      )
    )
    OR (
      NOT public.is_staff((SELECT auth.uid()))
      AND EXISTS (
        SELECT 1
        FROM public.child_guardians AS cgd
        WHERE cgd.child_id = child_groups.child_id
          AND cgd.guardian_id = (SELECT auth.uid())
      )
    )
  );

-- Admins can read all children; teachers can read children in assigned groups;
-- parents retain access only to their own linked children.
DROP POLICY IF EXISTS "select_children" ON public.children;
CREATE POLICY "authorized_select_children"
  ON public.children
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin((SELECT auth.uid()))
    OR (
      public.is_staff((SELECT auth.uid()))
      AND EXISTS (
        SELECT 1
        FROM public.child_groups AS cg
        JOIN public.group_teachers AS gt ON gt.group_id = cg.group_id
        WHERE cg.child_id = children.id
          AND gt.teacher_id = (SELECT auth.uid())
      )
    )
    OR (
      NOT public.is_staff((SELECT auth.uid()))
      AND EXISTS (
        SELECT 1
        FROM public.child_guardians AS cgd
        WHERE cgd.child_id = children.id
          AND cgd.guardian_id = (SELECT auth.uid())
      )
    )
  );

-- Attendance rows are child-scoped. A teacher is authorized when the child is
-- linked to at least one group assigned to that teacher; admins have school-wide
-- access. Invoker-rights RPCs are subject to these same policies.
DROP POLICY IF EXISTS "staff_select_attendance" ON public.attendance;
CREATE POLICY "assigned_staff_select_attendance"
  ON public.attendance
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin((SELECT auth.uid()))
    OR (
      public.is_staff((SELECT auth.uid()))
      AND EXISTS (
        SELECT 1
        FROM public.child_groups AS cg
        JOIN public.group_teachers AS gt ON gt.group_id = cg.group_id
        WHERE cg.child_id = attendance.child_id
          AND gt.teacher_id = (SELECT auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "staff_insert_attendance" ON public.attendance;
CREATE POLICY "assigned_staff_insert_attendance"
  ON public.attendance
  FOR INSERT
  TO authenticated
  WITH CHECK (
    recorded_by = (SELECT auth.uid())
    AND (
      public.is_admin((SELECT auth.uid()))
      OR (
        public.is_staff((SELECT auth.uid()))
        AND EXISTS (
          SELECT 1
          FROM public.child_groups AS cg
          JOIN public.group_teachers AS gt ON gt.group_id = cg.group_id
          WHERE cg.child_id = attendance.child_id
            AND gt.teacher_id = (SELECT auth.uid())
        )
      )
    )
  );

DROP POLICY IF EXISTS "staff_update_attendance" ON public.attendance;
CREATE POLICY "assigned_staff_update_attendance"
  ON public.attendance
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin((SELECT auth.uid()))
    OR (
      public.is_staff((SELECT auth.uid()))
      AND EXISTS (
        SELECT 1
        FROM public.child_groups AS cg
        JOIN public.group_teachers AS gt ON gt.group_id = cg.group_id
        WHERE cg.child_id = attendance.child_id
          AND gt.teacher_id = (SELECT auth.uid())
      )
    )
  )
  WITH CHECK (
    recorded_by = (SELECT auth.uid())
    AND (
      public.is_admin((SELECT auth.uid()))
      OR (
        public.is_staff((SELECT auth.uid()))
        AND EXISTS (
          SELECT 1
          FROM public.child_groups AS cg
          JOIN public.group_teachers AS gt ON gt.group_id = cg.group_id
          WHERE cg.child_id = attendance.child_id
            AND gt.teacher_id = (SELECT auth.uid())
        )
      )
    )
  );
