-- ==============================================================================
-- WALLET AGENT PLATFORM: SEED DEVELOPMENT DATA
-- ==============================================================================

-- 1. PROFILES
INSERT INTO public.profiles (id, auth_user_id, full_name, email, phone, avatar_url, role, status)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Marcus Vance', 'm.vance@walletagent.internal', '+1 (555) 382-9014', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'agent', 'active'),
    ('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'Julian Sterling', 'j.sterling@agentnet.io', '+1 (555) 773-1920', NULL, 'sub_agent', 'active'),
    ('a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'Treasury Admin', 'admin@walletagent.internal', '+1 (555) 000-9999', NULL, 'admin', 'active')
ON CONFLICT (id) DO NOTHING;

-- 2. AGENTS
INSERT INTO public.agents (id, profile_id, agent_code, balance, pending_balance, total_deposit, total_withdrawal, total_commission, commission_rate, verification_status)
VALUES 
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'AG-88402', 48250.00, 3420.00, 185400.00, 94200.00, 1845.50, 0.0150, 'verified'),
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'SUB-3011', 12400.00, 800.00, 48000.00, 22000.00, 620.00, 0.0120, 'verified')
ON CONFLICT (id) DO NOTHING;

-- 3. CUSTOMERS
INSERT INTO public.customers (id, agent_id, customer_code, full_name, phone, status)
VALUES 
    ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CUST-1049', 'Elena Rostova', '+1 (555) 234-8891', 'active'),
    ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'CUST-1050', 'David Chen', '+1 (555) 782-3341', 'active'),
    ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'CUST-1051', 'Sophia Al-Mansoor', '+1 (555) 901-2245', 'active'),
    ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'CUST-1052', 'Liam O''Connor', '+1 (555) 441-9982', 'pending_verification'),
    ('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'CUST-1053', 'Amara Okafor', '+1 (555) 672-0049', 'active')
ON CONFLICT (id) DO NOTHING;

-- 4. TRANSACTIONS & WALLET LEDGER
INSERT INTO public.transactions (id, transaction_code, agent_id, customer_id, type, amount, fee, commission, payment_method, reference, status, note)
VALUES 
    ('d0000000-0000-0000-0000-000000000001', 'TX-90281', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'deposit', 3200.00, 16.00, 48.00, 'Bank Transfer (ACH/SEPA)', 'REF-ACH-889410', 'completed', 'Invoice clearing for Q3 vendor settlement'),
    ('d0000000-0000-0000-0000-000000000002', 'TX-90280', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'withdrawal', 1850.00, 9.25, 22.20, 'Instant Wire', 'REF-WIRE-441092', 'processing', 'Authorized merchant cashout request'),
    ('d0000000-0000-0000-0000-000000000003', 'TX-90279', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005', 'deposit', 2400.00, 12.00, 36.00, 'Mobile Money (M-Pesa/Bkash/Nagad)', 'REF-MOMO-772910', 'pending', 'Sub-distributor cash collection')
ON CONFLICT (id) DO NOTHING;

-- 5. NOTIFICATIONS
INSERT INTO public.notifications (id, user_id, title, message, type, is_read)
VALUES 
    ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Deposit Request Approved', 'Deposit of $3,200.00 for customer Elena Rostova has been cleared and settled.', 'transaction', false),
    ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Commission Credited', 'You earned +$48.00 commission from transaction TX-90281.', 'commission', false)
ON CONFLICT (id) DO NOTHING;
