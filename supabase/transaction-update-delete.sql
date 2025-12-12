-- =============================================
-- 交易更新與刪除 RPC 函數
-- =============================================
-- 此文件定義交易的更新和刪除函數
-- 包含儲值金退回和積分收回邏輯

-- =============================================
-- RPC 函數：更新交易記錄（管理員使用）
-- =============================================
CREATE OR REPLACE FUNCTION public.update_transaction(
    p_transaction_id UUID,
    p_amount DECIMAL(10, 2) DEFAULT NULL,
    p_total_amount DECIMAL(10, 2) DEFAULT NULL,
    p_discount_amount DECIMAL(10, 2) DEFAULT NULL,
    p_payment_method_code TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_admin_notes TEXT DEFAULT NULL
)
RETURNS public.transactions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_old_transaction public.transactions;
    v_new_transaction public.transactions;
    v_member_id UUID;
    v_payment_method public.payment_methods;
    v_old_wallet_transaction_id UUID;
    v_new_wallet_transaction_id UUID;
    v_old_points INTEGER;
    v_new_points INTEGER;
    v_point_rule_value DECIMAL(10, 2);
    v_admin_id UUID;
BEGIN
    -- 取得當前管理員 ID（如果有的話）
    BEGIN
        SELECT id INTO v_admin_id FROM auth.users WHERE id = auth.uid();
    EXCEPTION WHEN OTHERS THEN
        v_admin_id := NULL;
    END;
    
    -- 查詢原交易記錄
    SELECT * INTO v_old_transaction
    FROM public.transactions
    WHERE id = p_transaction_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION '找不到對應的交易記錄';
    END IF;
    
    v_member_id := v_old_transaction.member_id;
    
    -- 如果提供了新的付款方式，查找付款方式
    IF p_payment_method_code IS NOT NULL THEN
        SELECT * INTO v_payment_method
        FROM public.payment_methods
        WHERE code = p_payment_method_code AND is_active = true;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION '付款方式不存在或已停用';
        END IF;
    END IF;
    
    -- ==========================================
    -- 處理儲值金變更
    -- ==========================================
    
    -- 如果原來是儲值金付款，且現在改為其他付款方式或金額改變，需要退回原金額
    IF v_old_transaction.payment_method_code = 'wallet' AND 
       (p_payment_method_code IS NOT NULL AND p_payment_method_code != 'wallet' OR 
        p_amount IS NOT NULL AND p_amount != v_old_transaction.amount) THEN
        
        -- 退回原儲值金金額
        SELECT public.recharge_wallet(
            v_member_id,
            v_old_transaction.amount,
            '交易編輯退回 (原交易編號: ' || v_old_transaction.receipt_number || ')',
            v_admin_id
        ) INTO v_old_wallet_transaction_id;
        
        RAISE NOTICE '已退回儲值金: %', v_old_transaction.amount;
    END IF;
    
    -- 如果新的付款方式是儲值金（且原來不是，或金額改變了），需要扣除新金額
    IF p_payment_method_code = 'wallet' AND
       (v_old_transaction.payment_method_code != 'wallet' OR
        p_amount IS NOT NULL AND p_amount != v_old_transaction.amount) THEN
        
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
            
            -- 計算應扣除的儲值金金額
            v_wallet_payment_amount := LEAST(COALESCE(p_amount, v_old_transaction.amount), v_wallet_balance);
            
            -- 使用儲值金付款
            SELECT public.pay_with_wallet(
                v_member_id,
                v_wallet_payment_amount,
                '交易編輯扣款 (交易編號: ' || v_old_transaction.receipt_number || ')',
                p_transaction_id,
                'transaction',
                v_admin_id
            ) INTO v_new_wallet_transaction_id;
            
            RAISE NOTICE '已扣除儲值金: %', v_wallet_payment_amount;
        END;
    END IF;
    
    -- ==========================================
    -- 處理積分變更
    -- ==========================================
    
    -- 只有付款類型的交易才處理積分
    IF v_old_transaction.transaction_type = 'payment' THEN
        -- 取得積分規則
        v_point_rule_value := 10; -- 預設值
        BEGIN
            SELECT value INTO v_point_rule_value
            FROM public.point_rules
            WHERE rule_type = 'spend_rate'
              AND is_active = true
            LIMIT 1;
        EXCEPTION WHEN OTHERS THEN
            -- 保持預設值
        END;
        
        -- 計算原積分
        v_old_points := FLOOR((v_old_transaction.amount - COALESCE(v_old_transaction.discount_amount, 0)) / v_point_rule_value)::INTEGER;
        
        -- 計算新積分
        IF p_amount IS NOT NULL THEN
            v_new_points := FLOOR((p_amount - COALESCE(COALESCE(p_discount_amount, v_old_transaction.discount_amount), 0)) / v_point_rule_value)::INTEGER;
        ELSE
            v_new_points := v_old_points;
        END IF;
        
        -- 如果積分改變了
        IF v_new_points != v_old_points THEN
            -- 收回原積分
            IF v_old_points > 0 THEN
                BEGIN
                    PERFORM public.spend_points(
                        v_member_id,
                        v_old_points,
                        '交易編輯收回積分 (原交易編號: ' || v_old_transaction.receipt_number || ')',
                        p_transaction_id,
                        'transaction',
                        v_admin_id
                    );
                    RAISE NOTICE '已收回積分: %', v_old_points;
                EXCEPTION WHEN OTHERS THEN
                    RAISE WARNING '收回積分失敗：%', SQLERRM;
                END;
            END IF;
            
            -- 發放新積分
            IF v_new_points > 0 THEN
                BEGIN
                    PERFORM public.earn_points(
                        v_member_id,
                        v_new_points,
                        '交易編輯獲得積分 (交易編號: ' || v_old_transaction.receipt_number || ')',
                        p_transaction_id,
                        'transaction',
                        v_admin_id
                    );
                    RAISE NOTICE '已發放積分: %', v_new_points;
                EXCEPTION WHEN OTHERS THEN
                    RAISE WARNING '發放積分失敗：%', SQLERRM;
                END;
            END IF;
        END IF;
    END IF;
    
    -- ==========================================
    -- 更新交易記錄
    -- ==========================================
    UPDATE public.transactions
    SET 
        amount = COALESCE(p_amount, amount),
        total_amount = COALESCE(p_total_amount, total_amount),
        discount_amount = COALESCE(p_discount_amount, discount_amount),
        payment_method_id = COALESCE(v_payment_method.id, payment_method_id),
        payment_method_code = COALESCE(v_payment_method.code, payment_method_code),
        payment_method_name = COALESCE(v_payment_method.name, payment_method_name),
        description = COALESCE(p_description, description),
        notes = COALESCE(p_notes, notes),
        admin_notes = COALESCE(p_admin_notes, admin_notes),
        updated_at = NOW()
    WHERE id = p_transaction_id
    RETURNING * INTO v_new_transaction;
    
    -- ==========================================
    -- 更新關聯的預約付款狀態
    -- ==========================================
    IF v_new_transaction.booking_id IS NOT NULL AND v_new_transaction.transaction_type = 'payment' THEN
        UPDATE public.bookings
        SET 
            paid_amount = v_new_transaction.amount,
            updated_at = NOW()
        WHERE id = v_new_transaction.booking_id;
    END IF;
    
    RETURN v_new_transaction;
END;
$$;

COMMENT ON FUNCTION public.update_transaction IS '管理員更新交易記錄函數，包含儲值金退回和積分收回邏輯';

-- =============================================
-- RPC 函數：刪除交易記錄（管理員使用）
-- =============================================
CREATE OR REPLACE FUNCTION public.delete_transaction(
    p_transaction_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_transaction public.transactions;
    v_member_id UUID;
    v_wallet_transaction_id UUID;
    v_points INTEGER;
    v_point_rule_value DECIMAL(10, 2);
    v_admin_id UUID;
BEGIN
    -- 取得當前管理員 ID（如果有的話）
    BEGIN
        SELECT id INTO v_admin_id FROM auth.users WHERE id = auth.uid();
    EXCEPTION WHEN OTHERS THEN
        v_admin_id := NULL;
    END;
    
    -- 查詢交易記錄
    SELECT * INTO v_transaction
    FROM public.transactions
    WHERE id = p_transaction_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION '找不到對應的交易記錄';
    END IF;
    
    v_member_id := v_transaction.member_id;
    
    -- ==========================================
    -- 處理儲值金退回
    -- ==========================================
    IF v_transaction.payment_method_code = 'wallet' AND v_transaction.amount > 0 THEN
        -- 退回儲值金
        SELECT public.recharge_wallet(
            v_member_id,
            v_transaction.amount,
            '交易刪除退回 (原交易編號: ' || v_transaction.receipt_number || ')',
            v_admin_id
        ) INTO v_wallet_transaction_id;
        
        RAISE NOTICE '已退回儲值金: %', v_transaction.amount;
    END IF;
    
    -- ==========================================
    -- 處理積分收回
    -- ==========================================
    IF v_transaction.transaction_type = 'payment' AND v_transaction.amount > 0 THEN
        -- 取得積分規則
        v_point_rule_value := 10; -- 預設值
        BEGIN
            SELECT value INTO v_point_rule_value
            FROM public.point_rules
            WHERE rule_type = 'spend_rate'
              AND is_active = true
            LIMIT 1;
        EXCEPTION WHEN OTHERS THEN
            -- 保持預設值
        END;
        
        -- 計算積分
        v_points := FLOOR((v_transaction.amount - COALESCE(v_transaction.discount_amount, 0)) / v_point_rule_value)::INTEGER;
        
        -- 收回積分
        IF v_points > 0 THEN
            BEGIN
                PERFORM public.spend_points(
                    v_member_id,
                    v_points,
                    '交易刪除收回積分 (原交易編號: ' || v_transaction.receipt_number || ')',
                    p_transaction_id,
                    'transaction',
                    v_admin_id
                );
                RAISE NOTICE '已收回積分: %', v_points;
            EXCEPTION WHEN OTHERS THEN
                RAISE WARNING '收回積分失敗：%', SQLERRM;
            END;
        END IF;
    END IF;
    
    -- ==========================================
    -- 更新關聯的預約付款狀態
    -- ==========================================
    IF v_transaction.booking_id IS NOT NULL AND v_transaction.transaction_type = 'payment' THEN
        UPDATE public.bookings
        SET 
            payment_status = 'unpaid',
            transaction_id = NULL,
            paid_amount = 0,
            updated_at = NOW()
        WHERE id = v_transaction.booking_id;
        
        RAISE NOTICE '已更新預約 % 付款狀態為未付款', v_transaction.booking_id;
    END IF;
    
    -- ==========================================
    -- 刪除交易記錄
    -- ==========================================
    DELETE FROM public.transactions
    WHERE id = p_transaction_id;
    
    RAISE NOTICE '已刪除交易記錄: %', p_transaction_id;
    
    RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.delete_transaction IS '管理員刪除交易記錄函數，包含儲值金退回和積分收回邏輯';

-- =============================================
-- 完成訊息
-- =============================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=========================================';
    RAISE NOTICE '✅ 交易更新與刪除函數建立完成！';
    RAISE NOTICE '=========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📋 已建立的函數：';
    RAISE NOTICE '   - update_transaction (更新交易記錄)';
    RAISE NOTICE '   - delete_transaction (刪除交易記錄)';
    RAISE NOTICE '';
    RAISE NOTICE '✨ 功能說明：';
    RAISE NOTICE '   - 編輯交易時自動處理儲值金退回/扣除';
    RAISE NOTICE '   - 編輯交易時自動處理積分收回/發放';
    RAISE NOTICE '   - 刪除交易時自動退回儲值金';
    RAISE NOTICE '   - 刪除交易時自動收回積分';
    RAISE NOTICE '   - 自動更新關聯預約的付款狀態';
    RAISE NOTICE '';
END $$;

