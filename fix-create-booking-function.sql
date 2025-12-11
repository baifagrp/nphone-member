-- =============================================
-- 強制重新創建 create_booking 函數
-- 此腳本會完全刪除舊版本並創建新版本
-- =============================================

-- 步驟 1: 使用更簡單直接的方法刪除所有可能的函數重載版本
-- 先嘗試刪除所有可能的參數組合（避免函數重載衝突）
DROP FUNCTION IF EXISTS public.create_booking(TEXT, UUID, DATE, TIME, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.create_booking(TEXT, UUID, DATE, TIME, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.create_booking(TEXT, UUID, DATE, TIME, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.create_booking(TEXT, UUID, DATE, TIME, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.create_booking(TEXT, UUID, DATE, TIME) CASCADE;

-- 步驟 2: 使用動態 SQL 刪除所有剩餘的 create_booking 函數（包括任何其他重載版本）
DO $$
DECLARE
    r RECORD;
    drop_stmt TEXT;
BEGIN
    -- 找出所有 create_booking 函數（包括所有重載版本）
    FOR r IN
        SELECT oid, proname, 
               pg_catalog.pg_get_function_arguments(oid) as args,
               pg_catalog.pg_get_function_identity_arguments(oid) as identity_args
        FROM pg_catalog.pg_proc
        WHERE proname = 'create_booking'
          AND pronamespace = (SELECT oid FROM pg_catalog.pg_namespace WHERE nspname = 'public')
    LOOP
        -- 使用 identity_arguments（用於識別函數的唯一標識）
        drop_stmt := format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE', r.proname, r.identity_args);
        RAISE NOTICE '執行: %', drop_stmt;
        EXECUTE drop_stmt;
    END LOOP;
END $$;

-- 步驟 3: 創建新版本的函數（使用 TEXT 類型作為 p_service_option_id）
CREATE OR REPLACE FUNCTION public.create_booking(
    p_line_user_id TEXT,
    p_service_id UUID,
    p_booking_date DATE,
    p_booking_time TIME,
    p_service_option_id TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_member_id UUID;
    v_service public.services;
    v_service_option public.service_options;
    v_final_price DECIMAL(10, 2);
    v_option_name TEXT;
    v_booking public.bookings;
    v_service_option_id UUID;  -- 用於轉換 TEXT 到 UUID
    v_has_valid_option BOOLEAN := FALSE;  -- 判斷是否有有效的選項 ID
BEGIN
    -- ============================================
    -- 參數驗證和清理（防止無效值導致類型錯誤）
    -- ============================================
    
    -- 驗證必要參數
    IF p_service_id IS NULL THEN
        RAISE EXCEPTION '服務 ID 不能為空';
    END IF;
    
    -- 清理 p_service_option_id：將所有無效值轉為 NULL
    -- 注意：PostgREST 可能在參數傳遞階段就進行類型檢查，
    -- 所以我們需要在函數開始時立即處理
    IF p_service_option_id IS NOT NULL THEN
        -- 檢查是否為無效值（包括 "0"）
        IF TRIM(p_service_option_id) = '' 
           OR TRIM(p_service_option_id) = '0' 
           OR TRIM(p_service_option_id) = 'null'
           OR TRIM(p_service_option_id) = 'undefined'
           OR TRIM(p_service_option_id) = 'NULL'
           OR TRIM(p_service_option_id) = 'UNDEFINED' THEN
            p_service_option_id := NULL;
        END IF;
    END IF;
    
    -- 查找會員
    SELECT id INTO v_member_id
    FROM public.members
    WHERE line_user_id = p_line_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION '找不到對應的會員資料';
    END IF;

    -- 取得服務資訊
    SELECT * INTO v_service
    FROM public.services
    WHERE id = p_service_id AND is_active = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION '服務不存在或已停用';
    END IF;

    -- 如果提供了服務選項，驗證並取得資訊
    v_final_price := COALESCE(v_service.base_price, 0);
    v_option_name := NULL;
    
    -- 檢查 p_service_option_id 是否有效（不是 NULL、空字串或 "0"）
    v_has_valid_option := (p_service_option_id IS NOT NULL 
                            AND TRIM(p_service_option_id) != '0' 
                            AND TRIM(p_service_option_id) != ''
                            AND TRIM(p_service_option_id) != 'null'
                            AND TRIM(p_service_option_id) != 'undefined');
    
    -- 如果服務需要選項但未提供有效選項，則錯誤
    IF v_service.has_options = true AND NOT v_has_valid_option THEN
        RAISE EXCEPTION '此服務需要選擇 %', COALESCE(v_service.option_label, '選項');
    END IF;
    
    -- 如果有有效的服務選項 ID，處理選項
    IF v_has_valid_option THEN
        
        -- 嘗試將 TEXT 轉換為 UUID（使用安全的轉換方式）
        BEGIN
            v_service_option_id := p_service_option_id::UUID;
        EXCEPTION WHEN OTHERS THEN
            RAISE EXCEPTION '服務選項 ID 格式錯誤: %', p_service_option_id;
        END;
        
        SELECT * INTO v_service_option
        FROM public.service_options
        WHERE id = v_service_option_id 
          AND service_id = p_service_id
          AND is_active = true;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION '服務選項不存在或已停用';
        END IF;
        
        -- 計算最終價格（基礎價格 + 選項價格調整）
        v_final_price := v_final_price + COALESCE(v_service_option.price_modifier, 0);
        v_option_name := v_service_option.name;
    END IF;
    
    -- 檢查時間段是否可用
    IF NOT public.check_time_slot_available(p_booking_date, p_booking_time, v_service.duration) THEN
        RAISE EXCEPTION '該時間段無法預約，請選擇其他時間';
    END IF;
    
    -- 檢查是否已有衝突的預約（同一個會員同一天不能重複預約）
    SELECT COUNT(*)
    INTO v_member_id  -- 重用變數
    FROM public.bookings
    WHERE member_id = (
        SELECT id FROM public.members WHERE line_user_id = p_line_user_id
    )
      AND booking_date = p_booking_date
      AND booking_time = p_booking_time
      AND status IN ('pending', 'confirmed');
    
    IF v_member_id > 0 THEN
        RAISE EXCEPTION '您在此時間已有預約';
    END IF;
    
    -- 建立預約
    INSERT INTO public.bookings (
        member_id,
        service_id,
        booking_date,
        booking_time,
        status,
        service_name,
        service_duration,
        service_price,
        service_option_id,
        service_option_name,
        notes
    )
    VALUES (
        (SELECT id FROM public.members WHERE line_user_id = p_line_user_id),
        p_service_id,
        p_booking_date,
        p_booking_time,
        'pending',
        v_service.name,
        v_service.duration,
        v_final_price,
        CASE 
            WHEN v_has_valid_option THEN v_service_option_id
            ELSE NULL 
        END,
        v_option_name,
        NULLIF(p_notes, '')
    )
    RETURNING * INTO v_booking;
    
    RETURN v_booking;
END;
$$;

-- 步驟 4: 刷新 PostgREST 的快取（通過重新載入 schema）
NOTIFY pgrst, 'reload schema';

-- 步驟 5: 驗證函數已創建
SELECT 
    p.proname AS function_name,
    pg_catalog.pg_get_function_arguments(p.oid) AS arguments,
    pg_catalog.pg_get_function_result(p.oid) AS return_type
FROM
    pg_catalog.pg_proc p
LEFT JOIN
    pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE
    p.proname = 'create_booking'
    AND n.nspname = 'public'
ORDER BY
    function_name, arguments;

-- 註解
COMMENT ON FUNCTION public.create_booking IS '會員端建立預約函數，p_service_option_id 為 TEXT 類型（可選參數）';

