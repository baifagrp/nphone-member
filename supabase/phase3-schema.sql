-- =============================================
-- 第三階段：積分系統和儲值金資料庫結構
-- =============================================

-- =============================================
-- 啟用必要的擴展
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 儲值金錢包表 (Wallets)
-- =============================================
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID UNIQUE NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    balance DECIMAL(10, 2) DEFAULT 0 NOT NULL CHECK (balance >= 0),
    total_recharged DECIMAL(10, 2) DEFAULT 0 NOT NULL CHECK (total_recharged >= 0),
    total_spent DECIMAL(10, 2) DEFAULT 0 NOT NULL CHECK (total_spent >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_wallets_member_id ON public.wallets(member_id);

-- =============================================
-- 儲值金交易記錄表 (Wallet Transactions)
-- =============================================
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('recharge', 'payment', 'refund', 'adjustment')),
    amount DECIMAL(10, 2) NOT NULL,
    balance_before DECIMAL(10, 2) NOT NULL,
    balance_after DECIMAL(10, 2) NOT NULL,
    description TEXT,
    reference_id UUID, -- 關聯的交易 ID（如 transactions.id）或預約 ID（如 bookings.id）
    reference_type TEXT, -- 'transaction', 'booking', 'manual'
    admin_id UUID REFERENCES public.admins(id), -- 如果是管理員操作
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON public.wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_member_id ON public.wallet_transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON public.wallet_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON public.wallet_transactions(created_at DESC);

-- =============================================
-- 積分表 (Points)
-- =============================================
CREATE TABLE IF NOT EXISTS public.points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID UNIQUE NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    balance INTEGER DEFAULT 0 NOT NULL CHECK (balance >= 0),
    total_earned INTEGER DEFAULT 0 NOT NULL CHECK (total_earned >= 0),
    total_spent INTEGER DEFAULT 0 NOT NULL CHECK (total_spent >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_points_member_id ON public.points(member_id);

-- =============================================
-- 積分交易記錄表 (Point Transactions)
-- =============================================
CREATE TABLE IF NOT EXISTS public.point_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    points_id UUID NOT NULL REFERENCES public.points(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'spend', 'expire', 'adjustment', 'bonus')),
    points INTEGER NOT NULL, -- 正數表示獲得，負數表示使用
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    description TEXT,
    reference_id UUID, -- 關聯的交易 ID 或預約 ID
    reference_type TEXT, -- 'transaction', 'booking', 'manual', 'bonus'
    expiry_date DATE, -- 積分到期日（如果有的話）
    admin_id UUID REFERENCES public.admins(id), -- 如果是管理員操作
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_point_transactions_points_id ON public.point_transactions(points_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_member_id ON public.point_transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_type ON public.point_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_point_transactions_created_at ON public.point_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_point_transactions_expiry_date ON public.point_transactions(expiry_date) WHERE expiry_date IS NOT NULL;

-- =============================================
-- 積分規則設定表 (Point Rules)
-- =============================================
CREATE TABLE IF NOT EXISTS public.point_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_type TEXT NOT NULL UNIQUE CHECK (rule_type IN ('spend_rate', 'signup_bonus', 'birthday_bonus')),
    -- spend_rate: 消費多少金額獲得 1 點
    -- signup_bonus: 註冊獎勵點數
    -- birthday_bonus: 生日獎勵點數
    value INTEGER NOT NULL, -- spend_rate 的數值（例如 10 表示每 10 元獲得 1 點）
    bonus_points INTEGER DEFAULT 0, -- 獎勵點數（用於 signup_bonus 和 birthday_bonus）
    is_active BOOLEAN DEFAULT true NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 插入預設積分規則
INSERT INTO public.point_rules (rule_type, value, bonus_points, description, is_active)
VALUES 
    ('spend_rate', 10, 0, '每消費 10 元獲得 1 點', true),
    ('signup_bonus', 0, 100, '註冊會員贈送 100 點', true),
    ('birthday_bonus', 0, 200, '生日當月贈送 200 點', true)
ON CONFLICT (rule_type) DO NOTHING;

-- =============================================
-- 自動更新 updated_at 的觸發器
-- =============================================

-- Wallets 表觸發器
CREATE OR REPLACE FUNCTION update_wallets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_wallets_updated_at ON public.wallets;
CREATE TRIGGER trigger_update_wallets_updated_at
    BEFORE UPDATE ON public.wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_wallets_updated_at();

-- Points 表觸發器
CREATE OR REPLACE FUNCTION update_points_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_points_updated_at ON public.points;
CREATE TRIGGER trigger_update_points_updated_at
    BEFORE UPDATE ON public.points
    FOR EACH ROW
    EXECUTE FUNCTION update_points_updated_at();

-- Point Rules 表觸發器
CREATE OR REPLACE FUNCTION update_point_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_point_rules_updated_at ON public.point_rules;
CREATE TRIGGER trigger_update_point_rules_updated_at
    BEFORE UPDATE ON public.point_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_point_rules_updated_at();

-- =============================================
-- 完成訊息
-- =============================================
DO $$ 
BEGIN
    RAISE NOTICE '✅ 第三階段資料庫結構建立完成！';
    RAISE NOTICE '📋 已建立表格：';
    RAISE NOTICE '   - wallets (儲值金錢包)';
    RAISE NOTICE '   - wallet_transactions (儲值金交易記錄)';
    RAISE NOTICE '   - points (積分)';
    RAISE NOTICE '   - point_transactions (積分交易記錄)';
    RAISE NOTICE '   - point_rules (積分規則)';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  下一步：執行 phase3-rls-policies.sql 設定安全政策';
END $$;

