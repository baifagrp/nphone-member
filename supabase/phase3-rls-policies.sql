-- =============================================
-- 第三階段：積分系統和儲值金 - RLS 政策和 RPC 函數
-- =============================================

-- =============================================
-- 啟用 RLS
-- =============================================
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_rules ENABLE ROW LEVEL SECURITY;

-- =============================================
-- wallets 表的 RLS 政策
-- =============================================

-- 政策 1: 會員可以查看自己的錢包
DROP POLICY IF EXISTS "Members can view own wallet" ON public.wallets;
CREATE POLICY "Members can view own wallet"
    ON public.wallets
    FOR SELECT
    USING (
        member_id IN (
            SELECT id FROM public.members
            WHERE line_user_id = current_setting('app.current_line_user_id', true)
        )
    );

-- 政策 2: 管理員可以查看所有錢包
DROP POLICY IF EXISTS "Admins can view all wallets" ON public.wallets;
CREATE POLICY "Admins can view all wallets"
    ON public.wallets
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE admins.id = auth.uid()
        )
    );

-- 政策 3: 管理員可以管理錢包
DROP POLICY IF EXISTS "Admins can manage wallets" ON public.wallets;
CREATE POLICY "Admins can manage wallets"
    ON public.wallets
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE admins.id = auth.uid()
        )
    );

-- =============================================
-- wallet_transactions 表的 RLS 政策
-- =============================================

-- 政策 1: 會員可以查看自己的儲值金交易記錄
DROP POLICY IF EXISTS "Members can view own wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Members can view own wallet transactions"
    ON public.wallet_transactions
    FOR SELECT
    USING (
        member_id IN (
            SELECT id FROM public.members
            WHERE line_user_id = current_setting('app.current_line_user_id', true)
        )
    );

-- 政策 2: 管理員可以查看所有儲值金交易記錄
DROP POLICY IF EXISTS "Admins can view all wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Admins can view all wallet transactions"
    ON public.wallet_transactions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE admins.id = auth.uid()
        )
    );

-- 政策 3: 管理員可以建立儲值金交易記錄
DROP POLICY IF EXISTS "Admins can create wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Admins can create wallet transactions"
    ON public.wallet_transactions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE admins.id = auth.uid()
        )
    );

-- =============================================
-- points 表的 RLS 政策
-- =============================================

-- 政策 1: 會員可以查看自己的積分
DROP POLICY IF EXISTS "Members can view own points" ON public.points;
CREATE POLICY "Members can view own points"
    ON public.points
    FOR SELECT
    USING (
        member_id IN (
            SELECT id FROM public.members
            WHERE line_user_id = current_setting('app.current_line_user_id', true)
        )
    );

-- 政策 2: 管理員可以查看所有積分
DROP POLICY IF EXISTS "Admins can view all points" ON public.points;
CREATE POLICY "Admins can view all points"
    ON public.points
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE admins.id = auth.uid()
        )
    );

-- 政策 3: 管理員可以管理積分
DROP POLICY IF EXISTS "Admins can manage points" ON public.points;
CREATE POLICY "Admins can manage points"
    ON public.points
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE admins.id = auth.uid()
        )
    );

-- =============================================
-- point_transactions 表的 RLS 政策
-- =============================================

-- 政策 1: 會員可以查看自己的積分交易記錄
DROP POLICY IF EXISTS "Members can view own point transactions" ON public.point_transactions;
CREATE POLICY "Members can view own point transactions"
    ON public.point_transactions
    FOR SELECT
    USING (
        member_id IN (
            SELECT id FROM public.members
            WHERE line_user_id = current_setting('app.current_line_user_id', true)
        )
    );

-- 政策 2: 管理員可以查看所有積分交易記錄
DROP POLICY IF EXISTS "Admins can view all point transactions" ON public.point_transactions;
CREATE POLICY "Admins can view all point transactions"
    ON public.point_transactions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE admins.id = auth.uid()
        )
    );

-- 政策 3: 管理員可以建立積分交易記錄
DROP POLICY IF EXISTS "Admins can create point transactions" ON public.point_transactions;
CREATE POLICY "Admins can create point transactions"
    ON public.point_transactions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE admins.id = auth.uid()
        )
    );

-- =============================================
-- point_rules 表的 RLS 政策
-- =============================================

-- 政策 1: 任何人都可以查看啟用的積分規則
DROP POLICY IF EXISTS "Anyone can view active point rules" ON public.point_rules;
CREATE POLICY "Anyone can view active point rules"
    ON public.point_rules
    FOR SELECT
    USING (is_active = true);

-- 政策 2: 管理員可以管理積分規則
DROP POLICY IF EXISTS "Admins can manage point rules" ON public.point_rules;
CREATE POLICY "Admins can manage point rules"
    ON public.point_rules
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE admins.id = auth.uid()
        )
    );

-- =============================================
-- RPC 函數：取得會員錢包資訊
-- =============================================
CREATE OR REPLACE FUNCTION public.get_member_wallet(p_line_user_id TEXT)
RETURNS TABLE (
    id UUID,
    member_id UUID,
    balance DECIMAL(10, 2),
    total_recharged DECIMAL(10, 2),
    total_spent DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.id,
        w.member_id,
        w.balance,
        w.total_recharged,
        w.total_spent,
        w.created_at,
        w.updated_at
    FROM public.wallets w
    INNER JOIN public.members m ON m.id = w.member_id
    WHERE m.line_user_id = p_line_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- RPC 函數：取得會員積分資訊
-- =============================================
CREATE OR REPLACE FUNCTION public.get_member_points(p_line_user_id TEXT)
RETURNS TABLE (
    id UUID,
    member_id UUID,
    balance INTEGER,
    total_earned INTEGER,
    total_spent INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.member_id,
        p.balance,
        p.total_earned,
        p.total_spent,
        p.created_at,
        p.updated_at
    FROM public.points p
    INNER JOIN public.members m ON m.id = p.member_id
    WHERE m.line_user_id = p_line_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- RPC 函數：取得會員儲值金交易記錄
-- =============================================
CREATE OR REPLACE FUNCTION public.get_member_wallet_transactions(
    p_line_user_id TEXT,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    wallet_id UUID,
    member_id UUID,
    transaction_type TEXT,
    amount DECIMAL(10, 2),
    balance_before DECIMAL(10, 2),
    balance_after DECIMAL(10, 2),
    description TEXT,
    reference_id UUID,
    reference_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wt.id,
        wt.wallet_id,
        wt.member_id,
        wt.transaction_type,
        wt.amount,
        wt.balance_before,
        wt.balance_after,
        wt.description,
        wt.reference_id,
        wt.reference_type,
        wt.created_at
    FROM public.wallet_transactions wt
    INNER JOIN public.members m ON m.id = wt.member_id
    WHERE m.line_user_id = p_line_user_id
    ORDER BY wt.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- RPC 函數：取得會員積分交易記錄
-- =============================================
CREATE OR REPLACE FUNCTION public.get_member_point_transactions(
    p_line_user_id TEXT,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    points_id UUID,
    member_id UUID,
    transaction_type TEXT,
    points INTEGER,
    balance_before INTEGER,
    balance_after INTEGER,
    description TEXT,
    reference_id UUID,
    reference_type TEXT,
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pt.id,
        pt.points_id,
        pt.member_id,
        pt.transaction_type,
        pt.points,
        pt.balance_before,
        pt.balance_after,
        pt.description,
        pt.reference_id,
        pt.reference_type,
        pt.expiry_date,
        pt.created_at
    FROM public.point_transactions pt
    INNER JOIN public.members m ON m.id = pt.member_id
    WHERE m.line_user_id = p_line_user_id
    ORDER BY pt.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- RPC 函數：儲值（管理員操作）
-- =============================================
CREATE OR REPLACE FUNCTION public.recharge_wallet(
    p_member_id UUID,
    p_amount DECIMAL(10, 2),
    p_description TEXT DEFAULT NULL,
    p_admin_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_wallet_id UUID;
    v_balance_before DECIMAL(10, 2);
    v_balance_after DECIMAL(10, 2);
    v_transaction_id UUID;
BEGIN
    -- 檢查金額
    IF p_amount <= 0 THEN
        RAISE EXCEPTION '儲值金額必須大於 0';
    END IF;
    
    -- 取得或建立錢包
    SELECT id INTO v_wallet_id
    FROM public.wallets
    WHERE member_id = p_member_id;
    
    IF v_wallet_id IS NULL THEN
        INSERT INTO public.wallets (member_id, balance, total_recharged)
        VALUES (p_member_id, p_amount, p_amount)
        RETURNING id INTO v_wallet_id;
        
        v_balance_before := 0;
        v_balance_after := p_amount;
    ELSE
        SELECT balance INTO v_balance_before FROM public.wallets WHERE id = v_wallet_id;
        v_balance_after := v_balance_before + p_amount;
        
        UPDATE public.wallets
        SET 
            balance = v_balance_after,
            total_recharged = total_recharged + p_amount
        WHERE id = v_wallet_id;
    END IF;
    
    -- 建立交易記錄
    INSERT INTO public.wallet_transactions (
        wallet_id,
        member_id,
        transaction_type,
        amount,
        balance_before,
        balance_after,
        description,
        reference_type,
        admin_id
    ) VALUES (
        v_wallet_id,
        p_member_id,
        'recharge',
        p_amount,
        v_balance_before,
        v_balance_after,
        COALESCE(p_description, '儲值'),
        'manual',
        p_admin_id
    ) RETURNING id INTO v_transaction_id;
    
    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- RPC 函數：使用儲值金付款（管理員操作）
-- =============================================
CREATE OR REPLACE FUNCTION public.pay_with_wallet(
    p_member_id UUID,
    p_amount DECIMAL(10, 2),
    p_description TEXT DEFAULT NULL,
    p_reference_id UUID DEFAULT NULL,
    p_reference_type TEXT DEFAULT 'transaction',
    p_admin_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_wallet_id UUID;
    v_balance_before DECIMAL(10, 2);
    v_balance_after DECIMAL(10, 2);
    v_transaction_id UUID;
BEGIN
    -- 檢查金額
    IF p_amount <= 0 THEN
        RAISE EXCEPTION '付款金額必須大於 0';
    END IF;
    
    -- 取得錢包
    SELECT id, balance INTO v_wallet_id, v_balance_before
    FROM public.wallets
    WHERE member_id = p_member_id;
    
    IF v_wallet_id IS NULL OR v_balance_before < p_amount THEN
        RAISE EXCEPTION '儲值金餘額不足';
    END IF;
    
    v_balance_after := v_balance_before - p_amount;
    
    -- 更新錢包
    UPDATE public.wallets
    SET 
        balance = v_balance_after,
        total_spent = total_spent + p_amount
    WHERE id = v_wallet_id;
    
    -- 建立交易記錄
    INSERT INTO public.wallet_transactions (
        wallet_id,
        member_id,
        transaction_type,
        amount,
        balance_before,
        balance_after,
        description,
        reference_id,
        reference_type,
        admin_id
    ) VALUES (
        v_wallet_id,
        p_member_id,
        'payment',
        -p_amount,
        v_balance_before,
        v_balance_after,
        COALESCE(p_description, '使用儲值金付款'),
        p_reference_id,
        p_reference_type,
        p_admin_id
    ) RETURNING id INTO v_transaction_id;
    
    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- RPC 函數：獲得積分（管理員操作）
-- =============================================
CREATE OR REPLACE FUNCTION public.earn_points(
    p_member_id UUID,
    p_points INTEGER,
    p_description TEXT DEFAULT NULL,
    p_reference_id UUID DEFAULT NULL,
    p_reference_type TEXT DEFAULT 'transaction',
    p_admin_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_points_id UUID;
    v_balance_before INTEGER;
    v_balance_after INTEGER;
    v_transaction_id UUID;
BEGIN
    -- 檢查點數
    IF p_points <= 0 THEN
        RAISE EXCEPTION '獲得點數必須大於 0';
    END IF;
    
    -- 取得或建立積分帳戶
    SELECT id INTO v_points_id
    FROM public.points
    WHERE member_id = p_member_id;
    
    IF v_points_id IS NULL THEN
        INSERT INTO public.points (member_id, balance, total_earned)
        VALUES (p_member_id, p_points, p_points)
        RETURNING id INTO v_points_id;
        
        v_balance_before := 0;
        v_balance_after := p_points;
    ELSE
        SELECT balance INTO v_balance_before FROM public.points WHERE id = v_points_id;
        v_balance_after := v_balance_before + p_points;
        
        UPDATE public.points
        SET 
            balance = v_balance_after,
            total_earned = total_earned + p_points
        WHERE id = v_points_id;
    END IF;
    
    -- 建立交易記錄
    INSERT INTO public.point_transactions (
        points_id,
        member_id,
        transaction_type,
        points,
        balance_before,
        balance_after,
        description,
        reference_id,
        reference_type,
        admin_id
    ) VALUES (
        v_points_id,
        p_member_id,
        CASE WHEN p_reference_type = 'bonus' THEN 'bonus' ELSE 'earn' END,
        p_points,
        v_balance_before,
        v_balance_after,
        COALESCE(p_description, '獲得積分'),
        p_reference_id,
        p_reference_type,
        p_admin_id
    ) RETURNING id INTO v_transaction_id;
    
    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- RPC 函數：使用積分（管理員操作）
-- =============================================
CREATE OR REPLACE FUNCTION public.spend_points(
    p_member_id UUID,
    p_points INTEGER,
    p_description TEXT DEFAULT NULL,
    p_reference_id UUID DEFAULT NULL,
    p_reference_type TEXT DEFAULT 'transaction',
    p_admin_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_points_id UUID;
    v_balance_before INTEGER;
    v_balance_after INTEGER;
    v_transaction_id UUID;
BEGIN
    -- 檢查點數
    IF p_points <= 0 THEN
        RAISE EXCEPTION '使用點數必須大於 0';
    END IF;
    
    -- 取得積分帳戶
    SELECT id, balance INTO v_points_id, v_balance_before
    FROM public.points
    WHERE member_id = p_member_id;
    
    IF v_points_id IS NULL OR v_balance_before < p_points THEN
        RAISE EXCEPTION '積分餘額不足';
    END IF;
    
    v_balance_after := v_balance_before - p_points;
    
    -- 更新積分
    UPDATE public.points
    SET 
        balance = v_balance_after,
        total_spent = total_spent + p_points
    WHERE id = v_points_id;
    
    -- 建立交易記錄
    INSERT INTO public.point_transactions (
        points_id,
        member_id,
        transaction_type,
        points,
        balance_before,
        balance_after,
        description,
        reference_id,
        reference_type,
        admin_id
    ) VALUES (
        v_points_id,
        p_member_id,
        'spend',
        -p_points,
        v_balance_before,
        v_balance_after,
        COALESCE(p_description, '使用積分'),
        p_reference_id,
        p_reference_type,
        p_admin_id
    ) RETURNING id INTO v_transaction_id;
    
    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 完成訊息
-- =============================================
DO $$ 
BEGIN
    RAISE NOTICE '✅ 第三階段 RLS 政策和 RPC 函數建立完成！';
    RAISE NOTICE '📋 已建立政策：';
    RAISE NOTICE '   - wallets 表 RLS 政策';
    RAISE NOTICE '   - wallet_transactions 表 RLS 政策';
    RAISE NOTICE '   - points 表 RLS 政策';
    RAISE NOTICE '   - point_transactions 表 RLS 政策';
    RAISE NOTICE '   - point_rules 表 RLS 政策';
    RAISE NOTICE '';
    RAISE NOTICE '📋 已建立 RPC 函數：';
    RAISE NOTICE '   - get_member_wallet';
    RAISE NOTICE '   - get_member_points';
    RAISE NOTICE '   - get_member_wallet_transactions';
    RAISE NOTICE '   - get_member_point_transactions';
    RAISE NOTICE '   - recharge_wallet';
    RAISE NOTICE '   - pay_with_wallet';
    RAISE NOTICE '   - earn_points';
    RAISE NOTICE '   - spend_points';
END $$;

