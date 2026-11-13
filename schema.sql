


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



CREATE OR REPLACE FUNCTION "public"."claim_pending_splits"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  update public.subscription_splits
  set user_id = new.id
  where lower(email) = lower(trim(new.email))
    and user_id is null;
  return new;
end;
$$;


ALTER FUNCTION "public"."claim_pending_splits"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_split_before_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  -- Offline split without email is automatically accepted
  if new.email is null or trim(new.email) = '' then
    new.status := 'accepted';
  else
    -- Auto-link user_id if an account with this email already exists
    if new.user_id is null then
      select id into new.user_id
      from auth.users
      where lower(email) = lower(trim(new.email))
      limit 1;
    end if;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_split_before_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_split_invitation_notify"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_sub_name text;
  v_owner_id uuid;
  v_currency text;
begin
  -- Only notify if pending and linked to an existing user account
  if new.status = 'pending' and new.user_id is not null then
    select name, user_id, currency into v_sub_name, v_owner_id, v_currency
    from public.user_subscriptions
    where id = new.subscription_id;

    -- Avoid notifying if the owner invited their own email
    if v_owner_id is not null and v_owner_id <> new.user_id then
      insert into public.notifications (
        user_id,
        subscription_id,
        split_id,
        type,
        title,
        message,
        scheduled_for
      )
      values (
        new.user_id,
        new.subscription_id,
        new.id,
        'split_invite',
        'Subscription Share Invite',
        'You were invited to split ' || coalesce(v_sub_name, 'a subscription') || ' for ' || new.amount || ' ' || coalesce(v_currency, 'EUR') || '/mo.',
        current_date
      )
      on conflict (user_id, subscription_id, coalesce(split_id, '00000000-0000-0000-0000-000000000000'::uuid), type)
      do nothing;
    end if;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_split_invitation_notify"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_subscription_participant"("sub_id" "uuid", "u_id" "uuid", "u_email" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  select exists (
    select 1 from public.subscription_splits
    where subscription_id = sub_id
      and status = 'accepted'
      and (
        user_id = u_id 
        or (email is not null and lower(email) = lower(u_email))
      )
  );
$$;


ALTER FUNCTION "public"."is_subscription_participant"("sub_id" "uuid", "u_id" "uuid", "u_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."link_split_user_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  if new.email is not null and new.user_id is null then
    select id into new.user_id
    from auth.users
    where lower(email) = lower(trim(new.email))
    limit 1;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."link_split_user_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_subscription_price_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.subscription_price_history (subscription_id, user_id, cost, changed_at)
        VALUES (NEW.id, NEW.user_id, NEW.cost, NEW.created_at);
    ELSIF (TG_OP = 'UPDATE' AND OLD.cost <> NEW.cost) THEN
        INSERT INTO public.subscription_price_history (subscription_id, user_id, cost, changed_at)
        VALUES (NEW.id, NEW.user_id, NEW.cost, timezone('utc'::text, now()));
        NEW.last_hike_date = CURRENT_DATE;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_subscription_price_change"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."catalog_subscription_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "catalog_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "default_cost" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text" NOT NULL,
    "interval" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "catalog_subscription_plans_interval_check" CHECK (("interval" = ANY (ARRAY['weekly'::"text", 'monthly'::"text", 'quarterly'::"text", 'yearly'::"text"])))
);


ALTER TABLE "public"."catalog_subscription_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."catalog_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "category" "text" NOT NULL,
    "website_url" "text",
    "logo_path" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."catalog_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "subscription_id" "uuid",
    "type" "text" DEFAULT 'renewal'::"text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "is_read" boolean DEFAULT false NOT NULL,
    "scheduled_for" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "split_id" "uuid",
    CONSTRAINT "notifications_type_check" CHECK (("type" = ANY (ARRAY['renewal'::"text", 'hike'::"text", 'zombie'::"text", 'split_invite'::"text"])))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscription_price_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "subscription_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "cost" numeric(10,2) NOT NULL,
    "changed_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "notes" "text",
    CONSTRAINT "subscription_price_history_cost_check" CHECK (("cost" >= (0)::numeric))
);


ALTER TABLE "public"."subscription_price_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscription_splits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "subscription_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "email" "text",
    "amount" numeric(10,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    CONSTRAINT "subscription_splits_amount_check" CHECK (("amount" >= (0)::numeric)),
    CONSTRAINT "subscription_splits_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."subscription_splits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_settings" (
    "user_id" "uuid" NOT NULL,
    "base_currency" "text" DEFAULT 'USD'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "reminder_days" integer DEFAULT 3 NOT NULL,
    CONSTRAINT "user_settings_reminder_days_check" CHECK (("reminder_days" = ANY (ARRAY[1, 2, 5, 10, 15])))
);


ALTER TABLE "public"."user_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "catalog_id" "uuid",
    "name" "text" NOT NULL,
    "category" "text" DEFAULT 'Other'::"text" NOT NULL,
    "cost" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text" NOT NULL,
    "interval" "text" NOT NULL,
    "first_billed_date" "date",
    "next_billing_date" "date" NOT NULL,
    "original_cost" numeric(10,2),
    "last_hike_date" "date",
    "is_zombie" boolean DEFAULT false,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "plan_id" "uuid",
    CONSTRAINT "user_subscriptions_cost_check" CHECK (("cost" >= (0)::numeric)),
    CONSTRAINT "user_subscriptions_interval_check" CHECK (("interval" = ANY (ARRAY['weekly'::"text", 'monthly'::"text", 'quarterly'::"text", 'yearly'::"text"]))),
    CONSTRAINT "user_subscriptions_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'paused'::"text", 'canceled'::"text"])))
);


ALTER TABLE "public"."user_subscriptions" OWNER TO "postgres";


ALTER TABLE ONLY "public"."catalog_subscription_plans"
    ADD CONSTRAINT "catalog_subscription_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."catalog_subscriptions"
    ADD CONSTRAINT "catalog_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."catalog_subscriptions"
    ADD CONSTRAINT "catalog_subscriptions_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_price_history"
    ADD CONSTRAINT "subscription_price_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_splits"
    ADD CONSTRAINT "subscription_splits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "idx_notifications_dedup" ON "public"."notifications" USING "btree" ("user_id", "subscription_id", COALESCE("split_id", '00000000-0000-0000-0000-000000000000'::"uuid"), "type");



CREATE UNIQUE INDEX "idx_notifications_renewal_dedup" ON "public"."notifications" USING "btree" ("user_id", "subscription_id", "scheduled_for", "type");



CREATE INDEX "idx_notifications_user_lookup" ON "public"."notifications" USING "btree" ("user_id", "is_read", "created_at" DESC);



CREATE OR REPLACE TRIGGER "on_subscription_price_changed" AFTER INSERT OR UPDATE ON "public"."user_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."log_subscription_price_change"();



CREATE OR REPLACE TRIGGER "on_user_subscriptions_updated" BEFORE UPDATE ON "public"."user_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_notify_split_invitation" AFTER INSERT OR UPDATE OF "user_id" ON "public"."subscription_splits" FOR EACH ROW EXECUTE FUNCTION "public"."handle_split_invitation_notify"();



CREATE OR REPLACE TRIGGER "trigger_split_before_insert" BEFORE INSERT OR UPDATE ON "public"."subscription_splits" FOR EACH ROW EXECUTE FUNCTION "public"."handle_split_before_insert"();



ALTER TABLE ONLY "public"."catalog_subscription_plans"
    ADD CONSTRAINT "catalog_subscription_plans_catalog_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "public"."catalog_subscriptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_split_id_fkey" FOREIGN KEY ("split_id") REFERENCES "public"."subscription_splits"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."user_subscriptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscription_price_history"
    ADD CONSTRAINT "subscription_price_history_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."user_subscriptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscription_price_history"
    ADD CONSTRAINT "subscription_price_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscription_splits"
    ADD CONSTRAINT "subscription_splits_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."user_subscriptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscription_splits"
    ADD CONSTRAINT "subscription_splits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_catalog_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "public"."catalog_subscriptions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."catalog_subscription_plans"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Invited members can view their split records" ON "public"."subscription_splits" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR ("email" = ("auth"."jwt"() ->> 'email'::"text"))));



CREATE POLICY "Owners can manage splits for their subscriptions" ON "public"."subscription_splits" USING ((EXISTS ( SELECT 1
   FROM "public"."user_subscriptions" "s"
  WHERE (("s"."id" = "subscription_splits"."subscription_id") AND ("s"."user_id" = "auth"."uid"())))));



CREATE POLICY "Participants can update their own split status" ON "public"."subscription_splits" FOR UPDATE USING ((("user_id" = "auth"."uid"()) OR (("email" IS NOT NULL) AND ("lower"("email") = "lower"(("auth"."jwt"() ->> 'email'::"text")))))) WITH CHECK ((("user_id" = "auth"."uid"()) OR (("email" IS NOT NULL) AND ("lower"("email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))));



CREATE POLICY "Public read catalog" ON "public"."catalog_subscriptions" FOR SELECT USING (true);



CREATE POLICY "Public read catalog plans" ON "public"."catalog_subscription_plans" FOR SELECT USING (true);



CREATE POLICY "Users can delete their own notifications" ON "public"."notifications" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own settings" ON "public"."user_settings" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own subscriptions" ON "public"."user_subscriptions" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read subscriptions they own or share" ON "public"."user_subscriptions" FOR SELECT USING ((("auth"."uid"() = "user_id") OR "public"."is_subscription_participant"("id", "auth"."uid"(), ("auth"."jwt"() ->> 'email'::"text"))));



CREATE POLICY "Users can update read state on their own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own settings" ON "public"."user_settings" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own price history" ON "public"."subscription_price_history" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own settings" ON "public"."user_settings" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."catalog_subscription_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."catalog_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscription_price_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscription_splits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_subscriptions" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."claim_pending_splits"() TO "anon";
GRANT ALL ON FUNCTION "public"."claim_pending_splits"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."claim_pending_splits"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_split_before_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_split_before_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_split_before_insert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_split_invitation_notify"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_split_invitation_notify"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_split_invitation_notify"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_subscription_participant"("sub_id" "uuid", "u_id" "uuid", "u_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_subscription_participant"("sub_id" "uuid", "u_id" "uuid", "u_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_subscription_participant"("sub_id" "uuid", "u_id" "uuid", "u_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."link_split_user_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."link_split_user_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."link_split_user_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_subscription_price_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_subscription_price_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_subscription_price_change"() TO "service_role";



GRANT ALL ON TABLE "public"."catalog_subscription_plans" TO "anon";
GRANT ALL ON TABLE "public"."catalog_subscription_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."catalog_subscription_plans" TO "service_role";



GRANT ALL ON TABLE "public"."catalog_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."catalog_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."catalog_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_price_history" TO "anon";
GRANT ALL ON TABLE "public"."subscription_price_history" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_price_history" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_splits" TO "anon";
GRANT ALL ON TABLE "public"."subscription_splits" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_splits" TO "service_role";



GRANT ALL ON TABLE "public"."user_settings" TO "anon";
GRANT ALL ON TABLE "public"."user_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_settings" TO "service_role";



GRANT ALL ON TABLE "public"."user_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."user_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_subscriptions" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







