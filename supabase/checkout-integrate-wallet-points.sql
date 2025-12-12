-- =============================================
-- 整合儲值金和積分到結帳流程
-- =============================================
-- 此腳本更新 create_transaction RPC 函數，添加：
-- 1. 儲值金付款功能
-- 2. 自動計算並添加積分
-- =============================================

-- 刪除舊的函數
DROP FUNCTION IF EXISTS public.create_transaction CASCADE;

-- =============================================
-- RPC 函數：建立交易記錄（管理員使用，整合儲值金和積分）
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
    v_wallet_transaction_id UUID;
    v_points_to_earn INTEGER;
    v_point_rule_value DECIMAL(10, 2);
    v_admin_id UUID;
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
    
    -- 取得當前管理員 ID（如果有的話）
    BEGIN
        SELECT id INTO v_admin_id FROM auth.users WHERE id = auth.uid();
    EXCEPTION WHEN OTHERS THEN
        v_admin_id := NULL;
    END;
    
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
        
        -- 如果是付款類型，檢查該預約是否已經有完成的付款交易（防止重複結帳）
        IF p_transaction_type = 'payment' THEN
            IF EXISTS (
                SELECT 1 FROM public.transactions
                WHERE booking_id = p_booking_id
                  AND transaction_type = 'payment'
                  AND status = 'completed'
            ) THEN
                RAISE EXCEPTION '該預約已經有付款記錄，無法重複結帳。如需修改，請使用編輯功能。';
            END IF;
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
    
    -- 如果付款方式為儲值金，檢查餘額並扣除
    -- 注意：這裡檢查 payment_method_code 是否為 'wallet'，且必須在 v_total_amount 和 v_receipt_number 賦值之後執行
    IF p_payment_method_code = 'wallet' THEN
        DECLARE
            v_wallet_balance DECIMAL(10, 2);
            v_wallet_payment_amount DECIMAL(10, 2);
        BEGIN
            -- 取得儲值金餘額
            SELECT balance INTO v_wallet_balance
            FROM public.wallets
            WHERE member_id = v_member_id;
            
            IF v_wallet_balance IS NULL OR v_wallet_balance <= 0 THEN
                RAISE EXCEPTION '會員儲值金餘額不足，無法使用儲值金付款';
            END IF;
            
            -- 計算應扣除的儲值金金額（使用 p_amount 而不是 v_total_amount）
            -- v_total_amount 包含折扣，p_amount 才是實際付款金額
            v_wallet_payment_amount := LEAST(p_amount, v_wallet_balance);
            
            -- 使用儲值金付款
            SELECT public.pay_with_wallet(
                v_member_id,
                v_wallet_payment_amount,
                '使用儲值金付款 (交易編號: ' || v_receipt_number || ')',
                NULL,  -- reference_id 會在交易建立後更新
                'transaction',
                v_admin_id
            ) INTO v_wallet_transaction_id;
        END;
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
    
    -- 如果使用了儲值金付款，更新儲值金交易記錄的 reference_id
    IF v_wallet_transaction_id IS NOT NULL THEN
        UPDATE public.wallet_transactions
        SET reference_id = v_transaction.id
        WHERE id = v_wallet_transaction_id;
    END IF;
    
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
    
    -- 如果是付款類型，自動計算並添加積分
    IF p_transaction_type = 'payment' AND p_amount > 0 THEN
        -- 取得積分規則（每消費指定金額獲得 1 點）
        -- 使用預設值：每 10 元 1 點
        v_point_rule_value := 10;
        
        -- 嘗試從 point_rules 表獲取消費積分規則
        BEGIN
            SELECT value INTO v_point_rule_value
            FROM public.point_rules
            WHERE rule_type = 'spend_rate'
              AND is_active = true
            LIMIT 1;
        EXCEPTION WHEN OTHERS THEN
            -- 如果查詢失敗，保持預設值 10
            NULL;
        END;
        
        -- 計算積分：實際付款金額 / 規則值（例如：100 元 / 10 = 10 點）
        IF v_point_rule_value IS NOT NULL AND v_point_rule_value > 0 THEN
            v_points_to_earn := FLOOR((p_amount - COALESCE(p_discount_amount, 0)) / v_point_rule_value)::INTEGER;
            
            IF v_points_to_earn > 0 THEN
                -- 添加積分
                BEGIN
                    PERFORM public.earn_points(
                        v_member_id,
                        v_points_to_earn,
                        '消費獲得積分 (交易編號: ' || v_receipt_number || ')',
                        v_transaction.id,
                        'transaction',
                        v_admin_id
                    );
                EXCEPTION WHEN OTHERS THEN
                    -- 如果積分添加失敗，記錄但不影響交易
                    RAISE NOTICE '添加積分失敗，但交易已成功建立';
                END;
            END IF;
        END IF;
    END IF;
    
    RETURN v_transaction;
END;
$$;

COMMENT ON FUNCTION public.create_transaction IS '建立交易記錄函數（管理員使用，整合儲值金和積分）';

