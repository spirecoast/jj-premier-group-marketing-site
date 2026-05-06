-- Helper: is the current authenticated user a known active agent?
-- Used in policies so an authenticated Supabase user only gets access if they
-- have a row in `agents` with auth_user_id linked.
CREATE OR REPLACE FUNCTION public.is_active_agent()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agents
    WHERE auth_user_id = auth.uid()
      AND active = true
  );
$$;
--> statement-breakpoint

-- Read access for active agents on the team-shared tables.
-- Writes from server actions go through the postgres role (DATABASE_URL),
-- which bypasses RLS — so no INSERT/UPDATE/DELETE policies are needed yet.

CREATE POLICY "agents_read_contacts" ON public.contacts
  FOR SELECT TO authenticated
  USING (public.is_active_agent());
--> statement-breakpoint

CREATE POLICY "agents_read_events" ON public.events
  FOR SELECT TO authenticated
  USING (public.is_active_agent());
--> statement-breakpoint

CREATE POLICY "agents_read_agents" ON public.agents
  FOR SELECT TO authenticated
  USING (public.is_active_agent());
--> statement-breakpoint

-- Agents can update their own row only (bio, phone, etc.).
CREATE POLICY "agents_update_self" ON public.agents
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());
--> statement-breakpoint

CREATE POLICY "agents_read_sequences" ON public.sequences
  FOR SELECT TO authenticated
  USING (public.is_active_agent());
--> statement-breakpoint

CREATE POLICY "agents_read_sequence_enrollments" ON public.sequence_enrollments
  FOR SELECT TO authenticated
  USING (public.is_active_agent());
--> statement-breakpoint

CREATE POLICY "agents_read_lead_routing_rules" ON public.lead_routing_rules
  FOR SELECT TO authenticated
  USING (public.is_active_agent());
