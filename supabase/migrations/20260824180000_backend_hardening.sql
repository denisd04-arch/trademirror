-- TradeMirror backend hardening: profiles, strategies, RLS helpers, active strategy RPC

-- ---------------------------------------------------------------------------
-- Profiles: email_verified + account_status constraint
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_account_status_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_account_status_check
  CHECK (account_status IN ('active', 'disabled'));

-- ---------------------------------------------------------------------------
-- Strategies: is_active + constraints
-- ---------------------------------------------------------------------------
ALTER TABLE public.strategies
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT false;

ALTER TABLE public.strategies
  DROP CONSTRAINT IF EXISTS strategies_default_tp_check;

ALTER TABLE public.strategies
  ALTER COLUMN default_tp DROP NOT NULL;

ALTER TABLE public.strategies
  ADD CONSTRAINT strategies_default_tp_check
  CHECK (default_tp IS NULL OR default_tp IN ('TP1', 'TP2', 'TP3', 'TP4'));

ALTER TABLE public.strategies
  DROP CONSTRAINT IF EXISTS strategies_strategy_name_check;

ALTER TABLE public.strategies
  ADD CONSTRAINT strategies_strategy_name_check
  CHECK (length(trim(strategy_name)) > 0);

-- One active strategy per user (when is_active = true)
DROP INDEX IF EXISTS idx_strategies_one_active_per_user;
CREATE UNIQUE INDEX idx_strategies_one_active_per_user
  ON public.strategies (user_id)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_strategies_user_active
  ON public.strategies (user_id, is_active);

-- Backfill is_active from profiles.active_strategy_id
UPDATE public.strategies s
SET is_active = true
FROM public.profiles p
WHERE p.active_strategy_id = s.id
  AND p.id = s.user_id
  AND s.is_active = false;

-- ---------------------------------------------------------------------------
-- Profile auto-creation on signup
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_first_name text := trim(COALESCE(NEW.raw_user_meta_data->>'first_name', ''));
  v_last_name text := trim(COALESCE(NEW.raw_user_meta_data->>'last_name', ''));
BEGIN
  IF v_first_name = '' OR v_last_name = '' THEN
    RAISE EXCEPTION 'first_name and last_name are required';
  END IF;

  INSERT INTO public.profiles (id, first_name, last_name, email, email_verified)
  VALUES (
    NEW.id,
    v_first_name,
    v_last_name,
    NEW.email,
    (NEW.email_confirmed_at IS NOT NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Sync profile email / verification when auth user changes
CREATE OR REPLACE FUNCTION public.handle_user_email_update()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM set_config('app.system_profile_update', 'on', true);
  UPDATE public.profiles
  SET
    email = NEW.email,
    email_verified = (NEW.email_confirmed_at IS NOT NULL)
  WHERE id = NEW.id;
  PERFORM set_config('app.system_profile_update', 'off', true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF email, email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_email_update();

-- ---------------------------------------------------------------------------
-- Protect privileged profile columns from client updates
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('app.system_profile_update', true) = 'on' THEN
    RETURN NEW;
  END IF;

  NEW.account_status := OLD.account_status;
  NEW.last_login := OLD.last_login;
  NEW.active_strategy_id := OLD.active_strategy_id;
  NEW.email := OLD.email;
  NEW.email_verified := OLD.email_verified;
  NEW.id := OLD.id;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS protect_profile_fields ON public.profiles;
CREATE TRIGGER protect_profile_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_fields();

-- ---------------------------------------------------------------------------
-- Protect strategy ownership and direct is_active changes
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_strategy_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('app.system_strategy_update', true) = 'on' THEN
  RETURN NEW;
  END IF;

  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Cannot change strategy ownership';
  END IF;
  IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    NEW.is_active := OLD.is_active;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS protect_strategy_fields ON public.strategies;
CREATE TRIGGER protect_strategy_fields
  BEFORE UPDATE ON public.strategies
  FOR EACH ROW EXECUTE FUNCTION public.protect_strategy_fields();

-- Clear profile pointer when active strategy is deleted
CREATE OR REPLACE FUNCTION public.handle_strategy_delete()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM set_config('app.system_profile_update', 'on', true);
  UPDATE public.profiles
  SET active_strategy_id = NULL
  WHERE id = OLD.user_id
    AND active_strategy_id = OLD.id;
  PERFORM set_config('app.system_profile_update', 'off', true);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_strategy_deleted ON public.strategies;
CREATE TRIGGER on_strategy_deleted
  AFTER DELETE ON public.strategies
  FOR EACH ROW EXECUTE FUNCTION public.handle_strategy_delete();

-- ---------------------------------------------------------------------------
-- RPC: touch_last_login (authenticated users only, own profile)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_last_login()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  PERFORM set_config('app.system_profile_update', 'on', true);
  UPDATE public.profiles
  SET last_login = now()
  WHERE id = auth.uid();
  PERFORM set_config('app.system_profile_update', 'off', true);
END;
$$;

REVOKE ALL ON FUNCTION public.touch_last_login() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.touch_last_login() TO authenticated;

-- ---------------------------------------------------------------------------
-- RPC: set_active_strategy (atomic, ownership enforced)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_active_strategy(p_strategy_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.strategies
    WHERE id = p_strategy_id
      AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Strategy not found or access denied';
  END IF;

  PERFORM set_config('app.system_strategy_update', 'on', true);
  UPDATE public.strategies
  SET is_active = false
  WHERE user_id = v_user_id;

  UPDATE public.strategies
  SET is_active = true
  WHERE id = p_strategy_id
    AND user_id = v_user_id;
  PERFORM set_config('app.system_strategy_update', 'off', true);

  PERFORM set_config('app.system_profile_update', 'on', true);
  UPDATE public.profiles
  SET active_strategy_id = p_strategy_id
  WHERE id = v_user_id;
  PERFORM set_config('app.system_profile_update', 'off', true);
END;
$$;

REVOKE ALL ON FUNCTION public.set_active_strategy(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_active_strategy(uuid) TO authenticated;
