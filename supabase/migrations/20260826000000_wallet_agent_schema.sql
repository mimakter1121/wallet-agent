-- ==============================================================================
-- WALLET AGENT PLATFORM: COMPLETE SUPABASE POSTGRESQL SCHEMA & RLS MIGRATION
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS & DOMAINS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'agent', 'sub_agent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('pending', 'active', 'suspended', 'blocked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tx_type AS ENUM ('deposit', 'withdrawal', 'commission', 'fund_transfer', 'adjustment');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tx_status AS ENUM ('pending', 'processing', 'approved', 'completed', 'rejected', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE (Linked directly to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('admin', 'agent', 'sub_agent')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'blocked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. AGENTS TABLE
CREATE TABLE IF NOT EXISTS public.agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    agent_code TEXT NOT NULL UNIQUE,
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
    pending_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (pending_balance >= 0),
    total_deposit NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_withdrawal NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_commission NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    commission_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.0150, -- 1.5% default
    verification_status TEXT NOT NULL DEFAULT 'verified' CHECK (verification_status IN ('pending', 'under_review', 'verified', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE RESTRICT,
    customer_code TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending_verification')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_code TEXT NOT NULL UNIQUE,
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE RESTRICT,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'commission', 'fund_transfer', 'adjustment')),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    fee NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    commission NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    payment_method TEXT NOT NULL,
    reference TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'approved', 'completed', 'rejected', 'cancelled')),
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. WALLET TRANSACTIONS (Immutable Ledger)
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE RESTRICT,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    balance_before NUMERIC(15, 2) NOT NULL,
    balance_after NUMERIC(15, 2) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. COMMISSION TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.commission_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE RESTRICT,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    rate NUMERIC(5, 4) NOT NULL,
    transaction_amount NUMERIC(15, 2) NOT NULL,
    commission_amount NUMERIC(15, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'credited' CHECK (status IN ('credited', 'pending', 'paid')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. DEPOSIT REQUESTS
CREATE TABLE IF NOT EXISTS public.deposit_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_code TEXT NOT NULL UNIQUE,
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL,
    reference TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'approved', 'completed', 'rejected', 'cancelled')),
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. WITHDRAWAL REQUESTS
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_code TEXT NOT NULL UNIQUE,
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL,
    account_number TEXT NOT NULL,
    reference TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'approved', 'completed', 'rejected', 'cancelled')),
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'transaction' CHECK (type IN ('transaction', 'security', 'commission', 'system')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. SUPPORT TICKETS
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_code TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    category TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user ON public.profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_agents_profile ON public.agents(profile_id);
CREATE INDEX IF NOT EXISTS idx_agents_code ON public.agents(agent_code);

CREATE INDEX IF NOT EXISTS idx_customers_agent ON public.customers(agent_id);
CREATE INDEX IF NOT EXISTS idx_customers_code ON public.customers(customer_code);

CREATE INDEX IF NOT EXISTS idx_transactions_agent ON public.transactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_transactions_customer ON public.transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_code ON public.transactions(transaction_code);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON public.transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_agent ON public.wallet_transactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_created ON public.wallet_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_commission_tx_agent ON public.commission_transactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_deposit_req_agent ON public.deposit_requests(agent_id);
CREATE INDEX IF NOT EXISTS idx_deposit_req_code ON public.deposit_requests(request_code);
CREATE INDEX IF NOT EXISTS idx_withdrawal_req_agent ON public.withdrawal_requests(agent_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_req_code ON public.withdrawal_requests(request_code);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);

-- ==============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_agents_updated_at ON public.agents;
CREATE TRIGGER trg_agents_updated_at BEFORE UPDATE ON public.agents FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_customers_updated_at ON public.customers;
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_transactions_updated_at ON public.transactions;
CREATE TRIGGER trg_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_deposit_req_updated_at ON public.deposit_requests;
CREATE TRIGGER trg_deposit_req_updated_at BEFORE UPDATE ON public.deposit_requests FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_withdrawal_req_updated_at ON public.withdrawal_requests;
CREATE TRIGGER trg_withdrawal_req_updated_at BEFORE UPDATE ON public.withdrawal_requests FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER trg_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) HELPER FUNCTIONS & POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper to fetch current authenticated user profile
CREATE OR REPLACE FUNCTION public.get_auth_profile_id()
RETURNS UUID AS $$
    SELECT id FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper to fetch current authenticated agent ID
CREATE OR REPLACE FUNCTION public.get_auth_agent_id()
RETURNS UUID AS $$
    SELECT a.id FROM public.agents a
    JOIN public.profiles p ON p.id = a.profile_id
    WHERE p.auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE auth_user_id = auth.uid() AND role = 'admin' AND status = 'active'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- PROFILES POLICIES
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (auth_user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth_user_id = auth.uid());

-- AGENTS POLICIES
DROP POLICY IF EXISTS "Agents can read own agent record" ON public.agents;
CREATE POLICY "Agents can read own agent record" ON public.agents
    FOR SELECT USING (id = public.get_auth_agent_id() OR public.is_admin());

-- Note: DIRECT UPDATE ON AGENTS TABLE IS BLOCKED FOR CLIENTS; BALANCES ONLY CHANGE VIA SECURITY DEFINER RPC.

-- CUSTOMERS POLICIES
DROP POLICY IF EXISTS "Agents can view own customers" ON public.customers;
CREATE POLICY "Agents can view own customers" ON public.customers
    FOR SELECT USING (agent_id = public.get_auth_agent_id() OR public.is_admin());

DROP POLICY IF EXISTS "Agents can insert own customers" ON public.customers;
CREATE POLICY "Agents can insert own customers" ON public.customers
    FOR INSERT WITH CHECK (agent_id = public.get_auth_agent_id() OR public.is_admin());

DROP POLICY IF EXISTS "Agents can update own customers" ON public.customers;
CREATE POLICY "Agents can update own customers" ON public.customers
    FOR UPDATE USING (agent_id = public.get_auth_agent_id() OR public.is_admin());

-- TRANSACTIONS POLICIES
DROP POLICY IF EXISTS "Agents can view own transactions" ON public.transactions;
CREATE POLICY "Agents can view own transactions" ON public.transactions
    FOR SELECT USING (agent_id = public.get_auth_agent_id() OR public.is_admin());

-- WALLET TRANSACTIONS POLICIES (Immutable Ledger)
DROP POLICY IF EXISTS "Agents can view own wallet ledger" ON public.wallet_transactions;
CREATE POLICY "Agents can view own wallet ledger" ON public.wallet_transactions
    FOR SELECT USING (agent_id = public.get_auth_agent_id() OR public.is_admin());

-- COMMISSION TRANSACTIONS POLICIES
DROP POLICY IF EXISTS "Agents can view own commission records" ON public.commission_transactions;
CREATE POLICY "Agents can view own commission records" ON public.commission_transactions
    FOR SELECT USING (agent_id = public.get_auth_agent_id() OR public.is_admin());

-- DEPOSIT REQUESTS POLICIES
DROP POLICY IF EXISTS "Agents can view own deposit requests" ON public.deposit_requests;
CREATE POLICY "Agents can view own deposit requests" ON public.deposit_requests
    FOR SELECT USING (agent_id = public.get_auth_agent_id() OR public.is_admin());

DROP POLICY IF EXISTS "Agents can insert own deposit requests" ON public.deposit_requests;
CREATE POLICY "Agents can insert own deposit requests" ON public.deposit_requests
    FOR INSERT WITH CHECK (agent_id = public.get_auth_agent_id() OR public.is_admin());

-- WITHDRAWAL REQUESTS POLICIES
DROP POLICY IF EXISTS "Agents can view own withdrawal requests" ON public.withdrawal_requests;
CREATE POLICY "Agents can view own withdrawal requests" ON public.withdrawal_requests
    FOR SELECT USING (agent_id = public.get_auth_agent_id() OR public.is_admin());

DROP POLICY IF EXISTS "Agents can insert own withdrawal requests" ON public.withdrawal_requests;
CREATE POLICY "Agents can insert own withdrawal requests" ON public.withdrawal_requests
    FOR INSERT WITH CHECK (agent_id = public.get_auth_agent_id() OR public.is_admin());

-- NOTIFICATIONS POLICIES
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (user_id = public.get_auth_profile_id() OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own notifications read state" ON public.notifications;
CREATE POLICY "Users can update own notifications read state" ON public.notifications
    FOR UPDATE USING (user_id = public.get_auth_profile_id());

-- SUPPORT TICKETS POLICIES
DROP POLICY IF EXISTS "Users can view own support tickets" ON public.support_tickets;
CREATE POLICY "Users can view own support tickets" ON public.support_tickets
    FOR SELECT USING (user_id = public.get_auth_profile_id() OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert own support tickets" ON public.support_tickets;
CREATE POLICY "Users can insert own support tickets" ON public.support_tickets
    FOR INSERT WITH CHECK (user_id = public.get_auth_profile_id() OR public.is_admin());

-- AUDIT LOGS POLICIES
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
    FOR SELECT USING (user_id = public.get_auth_profile_id() OR public.is_admin());

-- ==============================================================================
-- ATOMIC SECURITY DEFINER RPC FUNCTIONS (Server-Side Wallet Logic)
-- ==============================================================================

-- 1. SUBMIT DEPOSIT REQUEST (Agent Action)
CREATE OR REPLACE FUNCTION public.submit_deposit_request(
    p_customer_id UUID,
    p_amount NUMERIC,
    p_payment_method TEXT,
    p_reference TEXT,
    p_note TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_agent_id UUID;
    v_profile_id UUID;
    v_cust_exists BOOLEAN;
    v_req_id UUID;
    v_tx_id UUID;
    v_req_code TEXT;
    v_tx_code TEXT;
BEGIN
    v_agent_id := public.get_auth_agent_id();
    v_profile_id := public.get_auth_profile_id();

    IF v_agent_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Authenticated agent record not found.';
    END IF;

    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Invalid amount: Deposit amount must be greater than zero.';
    END IF;

    -- Verify customer ownership
    SELECT EXISTS(SELECT 1 FROM public.customers WHERE id = p_customer_id AND agent_id = v_agent_id) INTO v_cust_exists;
    IF NOT v_cust_exists THEN
        RAISE EXCEPTION 'Invalid customer: Target customer does not belong to this agent.';
    END IF;

    v_req_code := 'DEP-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8));
    v_tx_code := 'TX-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8));

    -- Create deposit request (initial: pending)
    INSERT INTO public.deposit_requests (request_code, agent_id, customer_id, amount, payment_method, reference, status, note)
    VALUES (v_req_code, v_agent_id, p_customer_id, p_amount, p_payment_method, p_reference, 'pending', p_note)
    RETURNING id INTO v_req_id;

    -- Create transaction entry
    INSERT INTO public.transactions (transaction_code, agent_id, customer_id, type, amount, fee, commission, payment_method, reference, status, note)
    VALUES (v_tx_code, v_agent_id, p_customer_id, 'deposit', p_amount, (p_amount * 0.005), (p_amount * 0.015), p_payment_method, p_reference, 'pending', p_note)
    RETURNING id INTO v_tx_id;

    -- Update pending balance
    UPDATE public.agents 
    SET pending_balance = pending_balance + p_amount
    WHERE id = v_agent_id;

    -- Audit log
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, metadata)
    VALUES (v_profile_id, 'SUBMIT_DEPOSIT_REQUEST', 'deposit_requests', v_req_id, jsonb_build_object('amount', p_amount, 'tx_code', v_tx_code, 'customer_id', p_customer_id));

    RETURN jsonb_build_object(
        'success', true,
        'request_id', v_req_id,
        'request_code', v_req_code,
        'transaction_id', v_tx_id,
        'transaction_code', v_tx_code,
        'amount', p_amount,
        'status', 'pending'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. APPROVE DEPOSIT REQUEST (Admin / Clearance Gateway Action)
CREATE OR REPLACE FUNCTION public.approve_deposit_request(
    p_request_id UUID,
    p_admin_note TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_req RECORD;
    v_agent RECORD;
    v_old_balance NUMERIC;
    v_new_balance NUMERIC;
    v_comm_amount NUMERIC;
BEGIN
    -- Row-lock deposit request
    SELECT * INTO v_req FROM public.deposit_requests WHERE id = p_request_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Deposit request not found.';
    END IF;

    IF v_req.status = 'approved' OR v_req.status = 'completed' THEN
        RAISE EXCEPTION 'Deposit request is already finalized.';
    END IF;

    -- Lock agent wallet row
    SELECT * INTO v_agent FROM public.agents WHERE id = v_req.agent_id FOR UPDATE;
    v_old_balance := v_agent.balance;
    v_new_balance := v_old_balance + v_req.amount;
    v_comm_amount := v_req.amount * v_agent.commission_rate;

    -- Update agent balance
    UPDATE public.agents SET
        balance = v_new_balance,
        pending_balance = GREATEST(0, pending_balance - v_req.amount),
        total_deposit = total_deposit + v_req.amount,
        total_commission = total_commission + v_comm_amount
    WHERE id = v_req.agent_id;

    -- Immutable wallet ledger entry
    INSERT INTO public.wallet_transactions (agent_id, type, amount, balance_before, balance_after, description)
    VALUES (v_req.agent_id, 'deposit_cleared', v_req.amount, v_old_balance, v_new_balance, 'Deposit cleared for request ' || v_req.request_code);

    -- Commission transaction entry
    INSERT INTO public.commission_transactions (agent_id, rate, transaction_amount, commission_amount, status)
    VALUES (v_req.agent_id, v_agent.commission_rate, v_req.amount, v_comm_amount, 'credited');

    -- Update request status
    UPDATE public.deposit_requests SET
        status = 'approved',
        note = COALESCE(p_admin_note, note)
    WHERE id = p_request_id;

    -- Update transaction status
    UPDATE public.transactions SET
        status = 'approved',
        note = COALESCE(p_admin_note, note)
    WHERE reference = v_req.reference AND agent_id = v_req.agent_id;

    RETURN jsonb_build_object(
        'success', true,
        'request_id', p_request_id,
        'new_balance', v_new_balance,
        'commission_earned', v_comm_amount,
        'status', 'approved'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. SUBMIT WITHDRAWAL REQUEST (Agent Action)
CREATE OR REPLACE FUNCTION public.submit_withdrawal_request(
    p_customer_id UUID,
    p_amount NUMERIC,
    p_payment_method TEXT,
    p_account_number TEXT,
    p_reference TEXT,
    p_note TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_agent_id UUID;
    v_profile_id UUID;
    v_agent RECORD;
    v_cust_exists BOOLEAN;
    v_req_id UUID;
    v_tx_id UUID;
    v_req_code TEXT;
    v_tx_code TEXT;
    v_old_balance NUMERIC;
    v_new_balance NUMERIC;
    v_comm_amount NUMERIC;
BEGIN
    v_agent_id := public.get_auth_agent_id();
    v_profile_id := public.get_auth_profile_id();

    IF v_agent_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Authenticated agent record not found.';
    END IF;

    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Invalid amount: Withdrawal amount must be greater than zero.';
    END IF;

    -- Verify customer ownership
    SELECT EXISTS(SELECT 1 FROM public.customers WHERE id = p_customer_id AND agent_id = v_agent_id) INTO v_cust_exists;
    IF NOT v_cust_exists THEN
        RAISE EXCEPTION 'Invalid customer: Target customer does not belong to this agent.';
    END IF;

    -- Row-lock agent wallet to verify sufficient available balance
    SELECT * INTO v_agent FROM public.agents WHERE id = v_agent_id FOR UPDATE;
    IF v_agent.balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance: Requested withdrawal ($%) exceeds available balance ($%).', p_amount, v_agent.balance;
    END IF;

    v_old_balance := v_agent.balance;
    v_new_balance := v_old_balance - p_amount;
    v_comm_amount := p_amount * 0.0120; -- 1.2% withdrawal commission

    v_req_code := 'WTH-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8));
    v_tx_code := 'TX-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8));

    -- Create withdrawal request (initial: processing)
    INSERT INTO public.withdrawal_requests (request_code, agent_id, customer_id, amount, payment_method, account_number, reference, status, note)
    VALUES (v_req_code, v_agent_id, p_customer_id, p_amount, p_payment_method, p_account_number, p_reference, 'processing', p_note)
    RETURNING id INTO v_req_id;

    -- Create transaction entry
    INSERT INTO public.transactions (transaction_code, agent_id, customer_id, type, amount, fee, commission, payment_method, reference, status, note)
    VALUES (v_tx_code, v_agent_id, p_customer_id, 'withdrawal', p_amount, (p_amount * 0.005), v_comm_amount, p_payment_method, p_reference, 'processing', p_note)
    RETURNING id INTO v_tx_id;

    -- Deduct balance atomically
    UPDATE public.agents SET
        balance = v_new_balance,
        total_withdrawal = total_withdrawal + p_amount,
        total_commission = total_commission + v_comm_amount
    WHERE id = v_agent_id;

    -- Immutable wallet ledger entry
    INSERT INTO public.wallet_transactions (agent_id, transaction_id, type, amount, balance_before, balance_after, description)
    VALUES (v_agent_id, v_tx_id, 'withdrawal_disbursed', -p_amount, v_old_balance, v_new_balance, 'Withdrawal disbursed for request ' || v_req_code);

    -- Commission transaction entry
    INSERT INTO public.commission_transactions (agent_id, transaction_id, rate, transaction_amount, commission_amount, status)
    VALUES (v_agent_id, v_tx_id, 0.0120, p_amount, v_comm_amount, 'credited');

    -- Audit log
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, metadata)
    VALUES (v_profile_id, 'SUBMIT_WITHDRAWAL_REQUEST', 'withdrawal_requests', v_req_id, jsonb_build_object('amount', p_amount, 'new_balance', v_new_balance, 'account', p_account_number));

    RETURN jsonb_build_object(
        'success', true,
        'request_id', v_req_id,
        'request_code', v_req_code,
        'transaction_id', v_tx_id,
        'new_balance', v_new_balance,
        'commission_earned', v_comm_amount,
        'status', 'processing'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. CLAIM COMMISSION TO OPERATIONAL WALLET
CREATE OR REPLACE FUNCTION public.claim_commission_to_wallet(
    p_amount NUMERIC
)
RETURNS JSONB AS $$
DECLARE
    v_agent_id UUID;
    v_profile_id UUID;
    v_agent RECORD;
    v_old_balance NUMERIC;
    v_new_balance NUMERIC;
BEGIN
    v_agent_id := public.get_auth_agent_id();
    v_profile_id := public.get_auth_profile_id();

    IF v_agent_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Authenticated agent record not found.';
    END IF;

    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Invalid amount: Claim amount must be greater than zero.';
    END IF;

    SELECT * INTO v_agent FROM public.agents WHERE id = v_agent_id FOR UPDATE;

    v_old_balance := v_agent.balance;
    v_new_balance := v_old_balance + p_amount;

    UPDATE public.agents SET
        balance = v_new_balance
    WHERE id = v_agent_id;

    INSERT INTO public.wallet_transactions (agent_id, type, amount, balance_before, balance_after, description)
    VALUES (v_agent_id, 'commission_claimed', p_amount, v_old_balance, v_new_balance, 'Commission yield transfer to available float');

    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, metadata)
    VALUES (v_profile_id, 'CLAIM_COMMISSION', 'agents', v_agent_id, jsonb_build_object('claimed_amount', p_amount, 'new_balance', v_new_balance));

    RETURN jsonb_build_object(
        'success', true,
        'claimed_amount', p_amount,
        'new_balance', v_new_balance
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. REPLENISH AGENT FLOAT (Add Funds RPC)
CREATE OR REPLACE FUNCTION public.add_agent_funds(
    p_amount NUMERIC,
    p_payment_method TEXT,
    p_reference TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_agent_id UUID;
    v_profile_id UUID;
    v_agent RECORD;
    v_old_balance NUMERIC;
    v_new_balance NUMERIC;
    v_tx_id UUID;
    v_tx_code TEXT;
BEGIN
    v_agent_id := public.get_auth_agent_id();
    v_profile_id := public.get_auth_profile_id();

    IF v_agent_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Authenticated agent record not found.';
    END IF;

    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Invalid amount: Amount must be greater than zero.';
    END IF;

    SELECT * INTO v_agent FROM public.agents WHERE id = v_agent_id FOR UPDATE;
    v_old_balance := v_agent.balance;
    v_new_balance := v_old_balance + p_amount;

    v_tx_code := 'TOPUP-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8));

    INSERT INTO public.transactions (transaction_code, agent_id, type, amount, fee, commission, payment_method, reference, status, note)
    VALUES (v_tx_code, v_agent_id, 'fund_transfer', p_amount, 0, 0, p_payment_method, p_reference, 'approved', 'Direct Agent Liquidity Replenishment')
    RETURNING id INTO v_tx_id;

    UPDATE public.agents SET
        balance = v_new_balance
    WHERE id = v_agent_id;

    INSERT INTO public.wallet_transactions (agent_id, transaction_id, type, amount, balance_before, balance_after, description)
    VALUES (v_agent_id, v_tx_id, 'funds_added', p_amount, v_old_balance, v_new_balance, 'Agent Float Top-Up via ' || p_payment_method);

    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, metadata)
    VALUES (v_profile_id, 'ADD_AGENT_FUNDS', 'agents', v_agent_id, jsonb_build_object('amount', p_amount, 'new_balance', v_new_balance, 'reference', p_reference));

    RETURN jsonb_build_object(
        'success', true,
        'transaction_code', v_tx_code,
        'new_balance', v_new_balance
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. GET AGENT DASHBOARD METRICS (High Performance Server-side Aggregation)
CREATE OR REPLACE FUNCTION public.get_agent_dashboard_metrics()
RETURNS JSONB AS $$
DECLARE
    v_agent_id UUID;
    v_agent RECORD;
    v_cust_count INTEGER;
    v_today_deposit NUMERIC;
    v_today_withdrawal NUMERIC;
    v_today_commission NUMERIC;
BEGIN
    v_agent_id := public.get_auth_agent_id();
    IF v_agent_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Authenticated agent record not found.';
    END IF;

    SELECT * INTO v_agent FROM public.agents WHERE id = v_agent_id;

    SELECT COUNT(*) INTO v_cust_count FROM public.customers WHERE agent_id = v_agent_id;

    SELECT COALESCE(SUM(amount), 0) INTO v_today_deposit
    FROM public.transactions 
    WHERE agent_id = v_agent_id AND type = 'deposit' AND status IN ('approved', 'completed') AND created_at >= CURRENT_DATE;

    SELECT COALESCE(SUM(amount), 0) INTO v_today_withdrawal
    FROM public.transactions 
    WHERE agent_id = v_agent_id AND type = 'withdrawal' AND status IN ('processing', 'approved', 'completed') AND created_at >= CURRENT_DATE;

    SELECT COALESCE(SUM(commission_amount), 0) INTO v_today_commission
    FROM public.commission_transactions 
    WHERE agent_id = v_agent_id AND created_at >= CURRENT_DATE;

    RETURN jsonb_build_object(
        'balance', v_agent.balance,
        'pending_balance', v_agent.pending_balance,
        'total_commission', v_agent.total_commission,
        'today_deposits', v_today_deposit,
        'today_withdrawals', v_today_withdrawal,
        'today_commission', v_today_commission,
        'active_customers_count', v_cust_count,
        'verification_status', v_agent.verification_status,
        'agent_code', v_agent.agent_code
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- REALTIME PUBLICATION SETUP
-- ==============================================================================
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.agents;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.deposit_requests;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.withdrawal_requests;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
