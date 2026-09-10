

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."attendance_status" AS ENUM (
    'present',
    'absent',
    'late'
);


ALTER TYPE "public"."attendance_status" OWNER TO "postgres";


CREATE TYPE "public"."document_type" AS ENUM (
    'cc',
    'rc',
    'ti',
    'passport',
    'international_id',
    'other'
);


ALTER TYPE "public"."document_type" OWNER TO "postgres";


CREATE TYPE "public"."gender_type" AS ENUM (
    'male',
    'female'
);


ALTER TYPE "public"."gender_type" OWNER TO "postgres";


CREATE TYPE "public"."guardian_relationship" AS ENUM (
    'father',
    'mother',
    'other'
);


ALTER TYPE "public"."guardian_relationship" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'admin',
    'teacher',
    'parent'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."clock_in_children"("child_ids" "uuid"[]) RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
declare
  att_date date := (now() at time zone 'America/Bogota')::date;
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'Only teachers or admins can record attendance';
  end if;

  insert into public.attendance (child_id, attendance_date, status, check_in, recorded_by)
  select cid, att_date, 'present'::attendance_status, now(), auth.uid()
  from unnest(child_ids) as cid;
end;
$$;


ALTER FUNCTION "public"."clock_in_children"("child_ids" "uuid"[]) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."clock_in_children"("child_ids" "uuid"[]) IS 'Records a new check-in row for each child. Supports multiple check-in/check-out cycles per child per day.';



CREATE OR REPLACE FUNCTION "public"."clock_out_children"("child_ids" "uuid"[]) RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'Only teachers or admins can record attendance';
  end if;

  update public.attendance a
  set check_out = now(),
      recorded_by = auth.uid()
  from (
    select distinct on (child_id) id
    from public.attendance
    where attendance_date = (now() at time zone 'America/Bogota')::date
      and child_id = any(child_ids)
      and check_in is not null
      and check_out is null
    order by child_id, check_in desc
  ) latest
  where a.id = latest.id;
end;
$$;


ALTER FUNCTION "public"."clock_out_children"("child_ids" "uuid"[]) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."clock_out_children"("child_ids" "uuid"[]) IS 'Closes the most recent open check-in row for each child. Supports multiple check-in/check-out cycles per child per day.';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "role" "public"."user_role" NOT NULL,
    "first_name" character varying(100) NOT NULL,
    "last_name" character varying(100) NOT NULL,
    "phone" character varying(20),
    "document_type" "public"."document_type" NOT NULL,
    "document_number" character varying(100) NOT NULL,
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."profiles" IS 'Users profile details';



COMMENT ON COLUMN "public"."profiles"."id" IS 'user uuid';



COMMENT ON COLUMN "public"."profiles"."role" IS 'User role: ''admin'', ''teacher'' or ''parent''';



COMMENT ON COLUMN "public"."profiles"."document_type" IS 'Document id type';



CREATE OR REPLACE FUNCTION "public"."get_profiles_by_guardian"("p_child_id" "uuid" DEFAULT NULL::"uuid") RETURNS SETOF "public"."profiles"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  return query
  select p.*
  from public.profiles p
  where p.role = 'admin'
  union
  select p.*
  from public.profiles p
  where p.role = 'teacher'
    and p.id in (
      select gt.teacher_id
      from public.group_teachers gt
      where gt.group_id in (
        select cg.group_id
        from public.child_groups cg
        where cg.child_id in (
          select cgd.child_id
          from public.child_guardians cgd
          where cgd.guardian_id = (select auth.uid())
            and (p_child_id is null or cgd.child_id = p_child_id)
        )
      )
    );
end;
$$;


ALTER FUNCTION "public"."get_profiles_by_guardian"("p_child_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user_registration"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$BEGIN
    -- Insert a new profile for the user
    INSERT INTO public.profiles (
        id,
        role,
        first_name,
        last_name,
        document_type,
        document_number,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'role', 'parent')::public.user_role, -- Default to 'parent' if no role specified
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'document_type', 'cc')::public.document_type,
        COALESCE(NEW.raw_user_meta_data->>'document_number', NEW.email), -- Fallback to email if no document number
        NOW(),
        NOW()
    );
    RETURN NEW;
END;$$;


ALTER FUNCTION "public"."handle_new_user_registration"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"("user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
  select exists (
    select 1 from public.profiles p
    where p.id = user_id and p.role = 'admin'::user_role
  );
$$;


ALTER FUNCTION "public"."is_admin"("user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_admin"("user_id" "uuid") IS 'Returns true when the given auth user has role = admin. SECURITY DEFINER so RLS policies can call it without self-referential permission checks.';



CREATE OR REPLACE FUNCTION "public"."is_staff"("user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
  select exists (
    select 1 from public.profiles p
    where p.id = user_id and p.role in ('teacher'::user_role, 'admin'::user_role)
  );
$$;


ALTER FUNCTION "public"."is_staff"("user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_staff"("user_id" "uuid") IS 'Returns true when the given auth user has role = teacher or admin. SECURITY DEFINER so RLS policies can call it without self-referential permission checks.';



CREATE OR REPLACE FUNCTION "public"."trigger_set_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_set_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."attendance" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "child_id" "uuid",
    "attendance_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "check_in" time without time zone,
    "check_out" time without time zone,
    "status" "public"."attendance_status" DEFAULT 'absent'::"public"."attendance_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "recorded_by" "uuid" DEFAULT "auth"."uid"()
);


ALTER TABLE "public"."attendance" OWNER TO "postgres";


COMMENT ON COLUMN "public"."attendance"."recorded_by" IS 'Auth user who performed the clock-in/clock-out that last touched this row.';



CREATE TABLE IF NOT EXISTS "public"."child_groups" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "child_id" "uuid",
    "group_id" "uuid",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."child_groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."child_guardians" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "child_id" "uuid",
    "guardian_id" "uuid",
    "relationship" "public"."guardian_relationship" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."child_guardians" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."children" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "first_name" character varying(100) NOT NULL,
    "last_name" character varying(100) NOT NULL,
    "document_type" "public"."document_type" NOT NULL,
    "document_number" character varying(100) NOT NULL,
    "birth_date" "date" NOT NULL,
    "gender" "public"."gender_type" NOT NULL,
    "address" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."children" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_reports" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "child_id" "uuid",
    "teacher_id" "uuid",
    "report_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "attachments" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "group_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text"
);


ALTER TABLE "public"."daily_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "sender_id" "uuid",
    "receiver_id" "uuid",
    "content" "text" NOT NULL,
    "attachments" "jsonb" DEFAULT '[]'::"jsonb",
    "is_read" boolean DEFAULT false,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "group_id" "uuid"
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."detailed_messages" WITH ("security_invoker"='on') AS
 SELECT "m"."id" AS "message_id",
    "m"."sender_id",
    "m"."receiver_id",
    "m"."content" AS "message_content",
    "m"."attachments" AS "message_attachments",
    "m"."is_read",
    "m"."read_at",
    "m"."created_at" AS "message_created_at",
    "m"."group_id",
    "s_profile"."first_name" AS "sender_first_name",
    "s_profile"."last_name" AS "sender_last_name",
    "s_profile"."role" AS "sender_role",
    "r_profile"."first_name" AS "receiver_first_name",
    "r_profile"."last_name" AS "receiver_last_name",
    "r_profile"."role" AS "receiver_role"
   FROM (("public"."messages" "m"
     LEFT JOIN "public"."profiles" "s_profile" ON (("m"."sender_id" = "s_profile"."id")))
     LEFT JOIN "public"."profiles" "r_profile" ON (("m"."receiver_id" = "r_profile"."id")));


ALTER TABLE "public"."detailed_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."device_push_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "token" "text" NOT NULL,
    "user_agent" "text",
    "last_seen_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."device_push_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_teachers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."group_teachers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."groups" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "image_url" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "group_id" "uuid",
    "teacher_id" "uuid",
    "title" character varying(100) NOT NULL,
    "description" "text",
    "attachments" "jsonb" DEFAULT '[]'::"jsonb",
    "due_date" "date",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."tasks" OWNER TO "postgres";


ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."child_groups"
    ADD CONSTRAINT "child_groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."child_guardians"
    ADD CONSTRAINT "child_guardians_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."children"
    ADD CONSTRAINT "children_document_type_document_number_key" UNIQUE ("document_type", "document_number");



ALTER TABLE ONLY "public"."children"
    ADD CONSTRAINT "children_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_reports"
    ADD CONSTRAINT "daily_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."device_push_tokens"
    ADD CONSTRAINT "device_push_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."device_push_tokens"
    ADD CONSTRAINT "device_push_tokens_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."group_teachers"
    ADD CONSTRAINT "group_teachers_group_id_teacher_id_key" UNIQUE ("group_id", "teacher_id");



ALTER TABLE ONLY "public"."group_teachers"
    ADD CONSTRAINT "group_teachers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_document_type_document_number_key" UNIQUE ("document_type", "document_number");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."child_groups"
    ADD CONSTRAINT "unique_child_group" UNIQUE ("child_id", "group_id");



CREATE INDEX "device_push_tokens_user_id_idx" ON "public"."device_push_tokens" USING "btree" ("user_id");



CREATE INDEX "group_teachers_group_id_idx" ON "public"."group_teachers" USING "btree" ("group_id");



CREATE INDEX "group_teachers_teacher_id_idx" ON "public"."group_teachers" USING "btree" ("teacher_id");



CREATE INDEX "idx_attendance_child_date" ON "public"."attendance" USING "btree" ("child_id", "attendance_date");



CREATE INDEX "idx_attendance_recorded_by" ON "public"."attendance" USING "btree" ("recorded_by");



CREATE INDEX "idx_child_groups_child_id" ON "public"."child_groups" USING "btree" ("child_id");



CREATE INDEX "idx_child_groups_group_id" ON "public"."child_groups" USING "btree" ("group_id");



CREATE INDEX "idx_child_guardians_child_id" ON "public"."child_guardians" USING "btree" ("child_id");



CREATE INDEX "idx_child_guardians_guardian_id" ON "public"."child_guardians" USING "btree" ("guardian_id");



CREATE INDEX "idx_daily_reports_child_date" ON "public"."daily_reports" USING "btree" ("child_id", "report_date");



CREATE INDEX "idx_daily_reports_group_id" ON "public"."daily_reports" USING "btree" ("group_id");



CREATE INDEX "idx_daily_reports_teacher_id" ON "public"."daily_reports" USING "btree" ("teacher_id");



CREATE INDEX "idx_messages_group_id" ON "public"."messages" USING "btree" ("group_id");



CREATE INDEX "idx_messages_receiver_id" ON "public"."messages" USING "btree" ("receiver_id");



CREATE INDEX "idx_messages_sender_receiver" ON "public"."messages" USING "btree" ("sender_id", "receiver_id");



CREATE INDEX "idx_profiles_role" ON "public"."profiles" USING "btree" ("role");



CREATE INDEX "idx_tasks_group_due" ON "public"."tasks" USING "btree" ("group_id", "due_date");



CREATE INDEX "idx_tasks_teacher_id" ON "public"."tasks" USING "btree" ("teacher_id");



-- Webhook URL/secret redacted for local/CI rebuilds (this migration file is
-- version-controlled). Production carries the real trigger with the real
-- secret already; this placeholder only affects `supabase start` locally/CI,
-- where the push edge function isn't exercised by tests anyway.
CREATE OR REPLACE TRIGGER "new_message" AFTER INSERT ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('http://localhost:54321/functions/v1/push', 'POST', '{"Content-type":"application/json","x-push-webhook-secret":"local-dev-placeholder-secret"}', '{}', '1000');



CREATE OR REPLACE TRIGGER "new_report" AFTER INSERT ON "public"."daily_reports" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('http://localhost:54321/functions/v1/push', 'POST', '{"Content-type":"application/json","x-push-webhook-secret":"local-dev-placeholder-secret"}', '{}', '1000');



CREATE OR REPLACE TRIGGER "set_timestamp" BEFORE UPDATE ON "public"."children" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamp"();



CREATE OR REPLACE TRIGGER "set_timestamp" BEFORE UPDATE ON "public"."groups" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamp"();



CREATE OR REPLACE TRIGGER "set_timestamp" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamp"();



CREATE OR REPLACE TRIGGER "set_timestamp" BEFORE UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamp"();



ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."child_groups"
    ADD CONSTRAINT "child_groups_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."child_groups"
    ADD CONSTRAINT "child_groups_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."child_guardians"
    ADD CONSTRAINT "child_guardians_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."child_guardians"
    ADD CONSTRAINT "child_guardians_guardian_id_fkey" FOREIGN KEY ("guardian_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_reports"
    ADD CONSTRAINT "daily_reports_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_reports"
    ADD CONSTRAINT "daily_reports_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_reports"
    ADD CONSTRAINT "daily_reports_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."device_push_tokens"
    ADD CONSTRAINT "device_push_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_teachers"
    ADD CONSTRAINT "group_teachers_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_teachers"
    ADD CONSTRAINT "group_teachers_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."profiles"("id");



CREATE POLICY "Allow authenticated users to insert messages" ON "public"."messages" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated users to update message read status" ON "public"."messages" FOR UPDATE TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "sender_id") OR (( SELECT "auth"."uid"() AS "uid") = "receiver_id"))) WITH CHECK (true);



CREATE POLICY "Allow users to select their messages" ON "public"."messages" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "sender_id") OR (( SELECT "auth"."uid"() AS "uid") = "receiver_id")));



CREATE POLICY "Enable read access for all users" ON "public"."groups" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can delete own tokens" ON "public"."device_push_tokens" FOR DELETE USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can insert own tokens" ON "public"."device_push_tokens" FOR INSERT WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can select own tokens" ON "public"."device_push_tokens" FOR SELECT USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update own tokens" ON "public"."device_push_tokens" FOR UPDATE USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "admin_delete_child_groups" ON "public"."child_groups" FOR DELETE TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "admin_delete_child_guardians" ON "public"."child_guardians" FOR DELETE TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "admin_delete_children" ON "public"."children" FOR DELETE TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "admin_delete_group_teachers" ON "public"."group_teachers" FOR DELETE TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "admin_delete_groups" ON "public"."groups" FOR DELETE TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "admin_delete_profiles_staff_or_parent" ON "public"."profiles" FOR DELETE TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AND ("role" = ANY (ARRAY['teacher'::"public"."user_role", 'parent'::"public"."user_role"]))));



CREATE POLICY "admin_insert_child_groups" ON "public"."child_groups" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "admin_insert_child_guardians" ON "public"."child_guardians" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "admin_insert_children" ON "public"."children" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "admin_insert_group_teachers" ON "public"."group_teachers" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "admin_insert_groups" ON "public"."groups" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "admin_insert_profiles_staff_or_parent" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AND ("role" = ANY (ARRAY['teacher'::"public"."user_role", 'parent'::"public"."user_role"]))));



CREATE POLICY "admin_update_child_groups" ON "public"."child_groups" FOR UPDATE TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "admin_update_child_guardians" ON "public"."child_guardians" FOR UPDATE TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "admin_update_children" ON "public"."children" FOR UPDATE TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "admin_update_group_teachers" ON "public"."group_teachers" FOR UPDATE TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "admin_update_groups" ON "public"."groups" FOR UPDATE TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "admin_update_profiles_staff_or_parent" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "id") OR ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AND ("role" = ANY (ARRAY['teacher'::"public"."user_role", 'parent'::"public"."user_role"]))))) WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "id") OR ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AND ("role" = ANY (ARRAY['teacher'::"public"."user_role", 'parent'::"public"."user_role"])))));



ALTER TABLE "public"."attendance" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "authenticated_select_child_groups" ON "public"."child_groups" FOR SELECT TO "authenticated" USING (("public"."is_staff"(( SELECT "auth"."uid"() AS "uid")) OR "public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."child_guardians" "cg"
  WHERE (("cg"."child_id" = "child_groups"."child_id") AND ("cg"."guardian_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "authenticated_select_child_guardians" ON "public"."child_guardians" FOR SELECT TO "authenticated" USING ((("guardian_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_staff"(( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "authenticated_select_group_teachers" ON "public"."group_teachers" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."child_groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."child_guardians" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."children" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."daily_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."device_push_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_teachers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "select_children" ON "public"."children" FOR SELECT USING (true);



CREATE POLICY "staff_delete_daily_reports" ON "public"."daily_reports" FOR DELETE TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."group_teachers" "gt"
  WHERE (("gt"."teacher_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("gt"."group_id" = "daily_reports"."group_id"))))));



CREATE POLICY "staff_delete_tasks" ON "public"."tasks" FOR DELETE TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."group_teachers" "gt"
  WHERE (("gt"."teacher_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("gt"."group_id" = "tasks"."group_id"))))));



CREATE POLICY "staff_insert_attendance" ON "public"."attendance" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_staff"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "staff_insert_daily_reports" ON "public"."daily_reports" FOR INSERT TO "authenticated" WITH CHECK ((("teacher_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."group_teachers" "gt"
  WHERE (("gt"."teacher_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("gt"."group_id" = "daily_reports"."group_id")))))));



CREATE POLICY "staff_insert_tasks" ON "public"."tasks" FOR INSERT TO "authenticated" WITH CHECK ((("teacher_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."group_teachers" "gt"
  WHERE (("gt"."teacher_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("gt"."group_id" = "tasks"."group_id")))))));



CREATE POLICY "staff_or_guardian_select_daily_reports" ON "public"."daily_reports" FOR SELECT TO "authenticated" USING (("public"."is_staff"(( SELECT "auth"."uid"() AS "uid")) OR ((EXISTS ( SELECT 1
   FROM ("public"."child_guardians" "cg"
     JOIN "public"."child_groups" "cgr" ON (("cgr"."child_id" = "cg"."child_id")))
  WHERE (("cg"."guardian_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("cgr"."group_id" = "daily_reports"."group_id")))) AND (("child_id" IS NULL) OR (EXISTS ( SELECT 1
   FROM "public"."child_guardians" "cg"
  WHERE (("cg"."guardian_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("cg"."child_id" = "daily_reports"."child_id"))))))));



CREATE POLICY "staff_or_guardian_select_tasks" ON "public"."tasks" FOR SELECT TO "authenticated" USING (("public"."is_staff"(( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM ("public"."child_guardians" "cg"
     JOIN "public"."child_groups" "cgr" ON (("cgr"."child_id" = "cg"."child_id")))
  WHERE (("cg"."guardian_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("cgr"."group_id" = "tasks"."group_id"))))));



CREATE POLICY "staff_select_attendance" ON "public"."attendance" FOR SELECT TO "authenticated" USING ("public"."is_staff"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "staff_update_attendance" ON "public"."attendance" FOR UPDATE TO "authenticated" USING ("public"."is_staff"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_staff"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "staff_update_daily_reports" ON "public"."daily_reports" FOR UPDATE TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."group_teachers" "gt"
  WHERE (("gt"."teacher_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("gt"."group_id" = "daily_reports"."group_id")))))) WITH CHECK (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."group_teachers" "gt"
  WHERE (("gt"."teacher_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("gt"."group_id" = "daily_reports"."group_id"))))));



CREATE POLICY "staff_update_tasks" ON "public"."tasks" FOR UPDATE TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."group_teachers" "gt"
  WHERE (("gt"."teacher_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("gt"."group_id" = "tasks"."group_id")))))) WITH CHECK (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."group_teachers" "gt"
  WHERE (("gt"."teacher_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("gt"."group_id" = "tasks"."group_id"))))));



ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



REVOKE ALL ON FUNCTION "public"."clock_in_children"("child_ids" "uuid"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."clock_in_children"("child_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."clock_in_children"("child_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."clock_in_children"("child_ids" "uuid"[]) TO "service_role";



REVOKE ALL ON FUNCTION "public"."clock_out_children"("child_ids" "uuid"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."clock_out_children"("child_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."clock_out_children"("child_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."clock_out_children"("child_ids" "uuid"[]) TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";
GRANT INSERT ON TABLE "public"."profiles" TO "supabase_auth_admin";



GRANT ALL ON FUNCTION "public"."get_profiles_by_guardian"("p_child_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_profiles_by_guardian"("p_child_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_profiles_by_guardian"("p_child_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_new_user_registration"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_new_user_registration"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_staff"("user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_staff"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_set_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_set_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_set_timestamp"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."update_updated_at_column"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON TABLE "public"."attendance" TO "anon";
GRANT ALL ON TABLE "public"."attendance" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance" TO "service_role";



GRANT ALL ON TABLE "public"."child_groups" TO "anon";
GRANT ALL ON TABLE "public"."child_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."child_groups" TO "service_role";



GRANT ALL ON TABLE "public"."child_guardians" TO "anon";
GRANT ALL ON TABLE "public"."child_guardians" TO "authenticated";
GRANT ALL ON TABLE "public"."child_guardians" TO "service_role";



GRANT ALL ON TABLE "public"."children" TO "anon";
GRANT ALL ON TABLE "public"."children" TO "authenticated";
GRANT ALL ON TABLE "public"."children" TO "service_role";



GRANT ALL ON TABLE "public"."daily_reports" TO "anon";
GRANT ALL ON TABLE "public"."daily_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_reports" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."detailed_messages" TO "anon";
GRANT ALL ON TABLE "public"."detailed_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."detailed_messages" TO "service_role";



GRANT ALL ON TABLE "public"."device_push_tokens" TO "anon";
GRANT ALL ON TABLE "public"."device_push_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."device_push_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."group_teachers" TO "anon";
GRANT ALL ON TABLE "public"."group_teachers" TO "authenticated";
GRANT ALL ON TABLE "public"."group_teachers" TO "service_role";



GRANT ALL ON TABLE "public"."groups" TO "anon";
GRANT ALL ON TABLE "public"."groups" TO "authenticated";
GRANT ALL ON TABLE "public"."groups" TO "service_role";



GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






