-- =============================================
-- 第三階段：結帳系統 - RLS 政策和 RPC 函數
-- =============================================

-- =============================================
-- 啟用 RLS
-- =============================================
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- payment_methods 表的 RLS 政策
-- =============================================

-- 政策 1: 任何人都可以查看啟用的付款方式
DROP POLICY IF EXISTS "Anyone can view active payment methods" ON public.payment_methods;
CREATE POLICY "Anyone can view active payment methods"
    ON public.payment_methods
    FOR SELECT
    USING (is_active = true);

-- 政策 2: 管理員可以管理付款方式
DROP POLICY IF EXISTS "Admins can manage payment methods" ON public.payment_methods;
CREATE POLICY "Admins can manage payment methods"
    ON public.payment_methods
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE admins.id = auth.uid()
        )
    );

-- =============================================
-- transactions 表的 RLS 政策
-- =============================================

-- 政策 1: 會員可以查看自己的交易記錄
DROP POLICY IF EXISTS "Members can view own transactions" ON public.transactions;
CREATE POLICY "Members can view own transactions"
    ON public.transactions
    FOR SELECT
    USING (
        member_id IN (
            SELECT id FROM public.members
            WHERE line_user_id = current_setting('app.current_line_user_id', true)
        )
    );

-- 政策 2: 管理員可以查看所有交易記錄
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
CREATE POLICY "Admins can view all transactions"
    ON public.transactions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE admins.id = auth.uid()
        )
    );

-- 政策 3: 管理員可以新增交易記錄
DROP POLICY IF EXISTS "Admins can insert transactions" ON public.transactions;
CREATE POLICY "Admins can insert transactions"
    ON public.transactions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE admins.id = auth.uid()
        )
    );

-- 政策 4: 管理員可以更新交易記錄
DROP POLICY IF EXISTS "Admins can update transactions" ON public.transactions;
CREATE POLICY "Admins can update transactions"
    ON public.transactions
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE admins.id = auth.uid()
        )
    );

-- 政策 5: 管理員可以刪除交易記錄
DROP POLICY IF EXISTS "Admins can delete transactions" ON public.transactions;
CREATE POLICY "Admins can delete transactions"
    ON public.transactions
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE admins.id = auth.uid()
        )
    );

-- =============================================
-- RPC 函數：查詢會員交易記錄
-- =============================================
CREATE OR REPLACE FUNCTION public.get_member_transactions(
    p_line_user_id TEXT,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0,
    p_type TEXT DEFAULT NULL,
    p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    member_id UUID,
    booking_id UUID,
    transaction_type TEXT,
    amount DECIMAL(10, 2),
    total_amount DECIMAL(10, 2),
    discount_amount DECIMAL(10, 2),
    payment_method_id UUID,
    payment_method_code TEXT,
    payment_method_name TEXT,
    status TEXT,
    description TEXT,
    receipt_number TEXT,
    reference_number TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_member_id UUID;
BEGIN
    -- 查找會員 ID
    SELECT members.id INTO v_member_id
    FROM public.members
    WHERE members.line_user_id = p_line_user_id;
    
    IF v_member_id IS NULL THEN
        RAISE EXCEPTION '找不到對應的會員資料';
    END IF;
    
    -- 返回該會員的交易記錄
    RETURN QUERY
    SELECT 
        public.transactions.id,
        public.transactions.member_id,
        public.transactions.booking_id,
        public.transactions.transaction_type,
        public.transactions.amount,
        public.transactions.total_amount,
        public.transactions.discount_amount,
        public.transactions.payment_method_id,
        public.transactions.payment_method_code,
        public.transactions.payment_method_name,
        public.transactions.status,
        public.transactions.description,
        public.transactions.receipt_number,
        public.transactions.reference_number,
        public.transactions.notes,
        public.transactions.created_at,
        public.transactions.updated_at,
        public.transactions.completed_at,
        public.transactions.cancelled_at
    FROM public.transactions
    WHERE public.transactions.member_id = v_member_id
      AND (p_type IS NULL OR public.transactions.transaction_type = p_type)
      AND (p_status IS NULL OR public.transactions.status = p_status)
    ORDER BY public.transactions.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

COMMENT ON FUNCTION public.get_member_transactions IS '會員端查詢自己的交易記錄函數';

-- =============================================
-- RPC 函數：建立交易記錄（管理員使用）
-- =============================================
CREATE OR REPLACE FUNCTION public.create_transaction(
    p_line_user_id TEXT,
    p_transaction_type TEXT,
    p_amount DECIMAL(10, 2),
    p_payment_method_code TEXT,
    p_booking_id UUID DEFAULT NULL,
    p_total_amount DECIMAL(10, 2) DEFAULT NULL,
    p_discount_amount DECIMAL(10, 2) DEFAULT 0,
    p_description TEXT DEFAULT NULL,
    p_receipt_number TEXT DEFAULT NULL,
    p_reference_number TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_admin_notes TEXT DEFAULT NULL
)
RETURNS public.transactions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_member_id UUID;
    v_payment_method public.payment_methods;
    v_transaction public.transactions;
    v_booking public.bookings;
    v_receipt_number TEXT;
    v_total_amount DECIMAL(10, 2);
BEGIN
    -- 驗證必要參數
    IF p_transaction_type IS NULL THEN
        RAISE EXCEPTION '交易類型不能為空';
    END IF;
    
    IF p_amount IS NULL THEN
        RAISE EXCEPTION '交易金額不能為空';
    END IF;
    
    IF p_payment_method_code IS NULL THEN
        RAISE EXCEPTION '付款方式不能為空';
    END IF;
    
    -- 查找會員 ID
    SELECT members.id INTO v_member_id
    FROM public.members
    WHERE members.line_user_id = p_line_user_id;
    
    IF v_member_id IS NULL THEN
        RAISE EXCEPTION '找不到對應的會員資料';
    END IF;
    
    -- 如果提供了 booking_id，驗證預約是否存在
    IF p_booking_id IS NOT NULL THEN
        SELECT * INTO v_booking
        FROM public.bookings
        WHERE id = p_booking_id AND member_id = v_member_id;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION '找不到對應的預約記錄';
        END IF;
    END IF;
    
    -- 查找付款方式
    SELECT * INTO v_payment_method
    FROM public.payment_methods
    WHERE code = p_payment_method_code AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION '付款方式不存在或已停用';
    END IF;
    
    -- 如果沒有提供 total_amount，使用 amount
    v_total_amount := COALESCE(p_total_amount, p_amount);
    
    -- 生成收據編號（如果沒有提供）
    IF p_receipt_number IS NULL THEN
        -- 格式：YYYYMMDD-XXXX（年月日-4位數字）
        v_receipt_number := TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                            LPAD((COALESCE((
                                SELECT MAX(CAST(SUBSTRING(receipt_number FROM 10) AS INTEGER))
                                FROM public.transactions
                                WHERE receipt_number LIKE TO_CHAR(NOW(), 'YYYYMMDD') || '-%'
                            ), 0) + 1)::TEXT, 4, '0');
    ELSE
        v_receipt_number := p_receipt_number;
    END IF;
    
    -- 建立交易記錄
    INSERT INTO public.transactions (
        member_id,
        booking_id,
        transaction_type,
        amount,
        total_amount,
        discount_amount,
        payment_method_id,
        payment_method_code,
        payment_method_name,
        status,
        description,
        receipt_number,
        reference_number,
        notes,
        admin_notes,
        completed_at
    )
    VALUES (
        v_member_id,
        p_booking_id,
        p_transaction_type,
        p_amount,
        v_total_amount,
        COALESCE(p_discount_amount, 0),
        v_payment_method.id,
        v_payment_method.code,
        v_payment_method.name,
        'completed',  -- 預設為已完成（管理員建立時通常已完成付款）
        p_description,
        v_receipt_number,
        p_reference_number,
        p_notes,
        p_admin_notes,
        NOW()  -- 立即標記為完成
    )
    RETURNING * INTO v_transaction;
    
    -- 如果關聯了預約，更新預約的付款狀態
    IF p_booking_id IS NOT NULL AND v_transaction.transaction_type = 'payment' THEN
        UPDATE public.bookings
        SET 
            payment_status = 'paid',
            transaction_id = v_transaction.id,
            paid_amount = p_amount,
            updated_at = NOW()
        WHERE id = p_booking_id;
    END IF;
    
    RETURN v_transaction;
END;
$$;

COMMENT ON FUNCTION public.create_transaction IS '建立交易記錄函數（管理員使用）';

-- =============================================
-- RPC 函數：退款
-- =============================================
CREATE OR REPLACE FUNCTION public.create_refund(
    p_line_user_id TEXT,
    p_original_transaction_id UUID,
    p_amount DECIMAL(10, 2),
    p_payment_method_code TEXT,
    p_description TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_admin_notes TEXT DEFAULT NULL
)
RETURNS public.transactions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_member_id UUID;
    v_original_transaction public.transactions;
    v_refund_transaction public.transactions;
    v_payment_method public.payment_methods;
BEGIN
    -- 驗證必要參數
    IF p_amount IS NULL OR p_amount <= 0 THEN
        RAISE EXCEPTION '退款金額必須大於 0';
    END IF;
    
    -- 查找會員 ID
    SELECT members.id INTO v_member_id
    FROM public.members
    WHERE members.line_user_id = p_line_user_id;
    
    IF v_member_id IS NULL THEN
        RAISE EXCEPTION '找不到對應的會員資料';
    END IF;
    
    -- 查找原始交易
    SELECT * INTO v_original_transaction
    FROM public.transactions
    WHERE id = p_original_transaction_id AND member_id = v_member_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION '找不到對應的交易記錄';
    END IF;
    
    IF v_original_transaction.transaction_type != 'payment' THEN
        RAISE EXCEPTION '只能對付款交易進行退款';
    END IF;
    
    IF v_original_transaction.status != 'completed' THEN
        RAISE EXCEPTION '只能對已完成的交易進行退款';
    END IF;
    
    -- 檢查退款金額是否超過原始金額
    IF p_amount > ABS(v_original_transaction.amount) THEN
        RAISE EXCEPTION '退款金額不能超過原始交易金額';
    END IF;
    
    -- 查找退款方式（如果提供）
    IF p_payment_method_code IS NOT NULL THEN
        SELECT * INTO v_payment_method
        FROM public.payment_methods
        WHERE code = p_payment_method_code AND is_active = true;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION '付款方式不存在或已停用';
        END IF;
    END IF;
    
    -- 建立退款交易（金額為負數）
    INSERT INTO public.transactions (
        member_id,
        booking_id,
        transaction_type,
        amount,
        total_amount,
        discount_amount,
        payment_method_id,
        payment_method_code,
        payment_method_name,
        status,
        description,
        receipt_number,
        reference_number,
        notes,
        admin_notes,
        completed_at
    )
    VALUES (
        v_member_id,
        v_original_transaction.booking_id,
        'refund',
        -p_amount,  -- 退款金額為負數
        p_amount,
        0,
        COALESCE(v_payment_method.id, v_original_transaction.payment_method_id),
        COALESCE(v_payment_method.code, v_original_transaction.payment_method_code),
        COALESCE(v_payment_method.name, v_original_transaction.payment_method_name),
        'completed',
        COALESCE(p_description, '退款：' || v_original_transaction.receipt_number),
        NULL,  -- 退款不收據編號
        NULL,
        p_notes,
        p_admin_notes,
        NOW()
    )
    RETURNING * INTO v_refund_transaction;
    
    -- 更新原始交易狀態
    UPDATE public.transactions
    SET 
        status = 'refunded',
        updated_at = NOW()
    WHERE id = p_original_transaction_id;
    
    -- 如果關聯了預約，更新預約的付款狀態
    IF v_original_transaction.booking_id IS NOT NULL THEN
        UPDATE public.bookings
        SET 
            payment_status = 'refunded',
            paid_amount = GREATEST(0, paid_amount - p_amount),
            updated_at = NOW()
        WHERE id = v_original_transaction.booking_id;
    END IF;
    
    RETURN v_refund_transaction;
END;
$$;

COMMENT ON FUNCTION public.create_refund IS '建立退款交易函數（管理員使用）';

-- =============================================
-- 完成訊息
-- =============================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=========================================';
    RAISE NOTICE '✅ 結帳系統 RLS 政策和 RPC 函數建立完成！';
    RAISE NOTICE '=========================================';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 已設定的 RLS 政策：';
    RAISE NOTICE '   - payment_methods: 可查看啟用的付款方式';
    RAISE NOTICE '   - transactions: 會員可查看自己的交易，管理員可管理所有交易';
    RAISE NOTICE '';
    RAISE NOTICE '⚙️  已建立的 RPC 函數：';
    RAISE NOTICE '   - get_member_transactions() (查詢會員交易記錄)';
    RAISE NOTICE '   - create_transaction() (建立交易記錄)';
    RAISE NOTICE '   - create_refund() (建立退款)';
END $$;

