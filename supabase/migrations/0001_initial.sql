-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- Core tables
-- ─────────────────────────────────────────────

CREATE TABLE public.users (
  id         UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT        NOT NULL,
  role       TEXT        NOT NULL CHECK (role IN ('employer', 'affiliate', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.organizations (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT        NOT NULL,
  owner_id   UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.jobs (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id            UUID          NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title             TEXT          NOT NULL,
  description       TEXT          NOT NULL,
  commission_amount NUMERIC(10,2) NOT NULL,
  status            TEXT          NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'active', 'paused', 'closed')),
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE public.affiliate_profiles (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  payout_email      TEXT,
  stripe_account_id TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.referral_links (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id UUID        NOT NULL REFERENCES public.affiliate_profiles(id) ON DELETE CASCADE,
  job_id       UUID        NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  token        UUID        NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Tracking
-- ─────────────────────────────────────────────

CREATE TABLE public.click_events (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_link_id UUID        NOT NULL REFERENCES public.referral_links(id) ON DELETE CASCADE,
  ip_address       INET,
  user_agent       TEXT,
  fingerprint      TEXT,
  clicked_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Applications & commissions
-- ─────────────────────────────────────────────

CREATE TABLE public.applications (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id           UUID        NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  referral_link_id UUID        REFERENCES public.referral_links(id) ON DELETE SET NULL,
  candidate_name   TEXT        NOT NULL,
  candidate_email  TEXT        NOT NULL,
  resume_url       TEXT,
  is_self_referral BOOLEAN     NOT NULL DEFAULT FALSE,
  status           TEXT        NOT NULL DEFAULT 'applied'
                   CHECK (status IN ('applied', 'reviewing', 'hired', 'rejected')),
  applied_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.commissions (
  id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id   UUID          NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  affiliate_id     UUID          NOT NULL REFERENCES public.affiliate_profiles(id) ON DELETE CASCADE,
  amount           NUMERIC(10,2) NOT NULL,
  commission_type  TEXT          NOT NULL CHECK (commission_type IN ('referral', 'self_referral')),
  status           TEXT          NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'pending_verification', 'approved', 'paid', 'disputed')),
  eligible_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Payouts & disputes
-- ─────────────────────────────────────────────

CREATE TABLE public.payouts (
  id                 UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id       UUID          NOT NULL REFERENCES public.affiliate_profiles(id) ON DELETE CASCADE,
  amount             NUMERIC(10,2) NOT NULL,
  stripe_transfer_id TEXT,
  status             TEXT          NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'processing', 'complete', 'failed')),
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE public.disputes (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  commission_id UUID        NOT NULL REFERENCES public.commissions(id) ON DELETE CASCADE,
  raised_by     UUID        NOT NULL REFERENCES public.users(id),
  reason        TEXT        NOT NULL,
  status        TEXT        NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Audit log
-- ─────────────────────────────────────────────

CREATE TABLE public.audit_logs (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT        NOT NULL,
  entity_id   UUID        NOT NULL,
  changed_by  UUID        REFERENCES public.users(id),
  change_type TEXT        NOT NULL,
  old_value   JSONB,
  new_value   JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Row-level security
-- ─────────────────────────────────────────────

ALTER TABLE public.users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_links     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.click_events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs         ENABLE ROW LEVEL SECURITY;

-- Users: own row only
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Jobs: public read for active jobs (unauthenticated job page)
CREATE POLICY "jobs_select_active" ON public.jobs
  FOR SELECT USING (status = 'active');

-- Referral links: public read so the /r/[token] redirect can look up the token
CREATE POLICY "referral_links_select_public" ON public.referral_links
  FOR SELECT USING (true);

-- Click events: server-side insert only
CREATE POLICY "click_events_insert" ON public.click_events
  FOR INSERT WITH CHECK (true);

-- Applications: public insert (anyone can apply)
CREATE POLICY "applications_insert_public" ON public.applications
  FOR INSERT WITH CHECK (true);

-- Commissions: server-side insert
CREATE POLICY "commissions_insert" ON public.commissions
  FOR INSERT WITH CHECK (true);

-- ─────────────────────────────────────────────
-- Auto-create users row on auth sign-up
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'affiliate')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
