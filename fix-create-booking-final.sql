-- =============================================
-- 最終修正 create_booking 函數
-- 解決 v_member_id 變數重用導致的類型衝突問題
-- =============================================

-- 步驟 1: 刪除所有現有的 create_booking 函數
DO $$
DECLARE
    r RECORD;
    drop_stmt TEXT;
BEGIN
    FOR r IN
        SELECT oid, proname, 
               pg_catalog.pg_get_function_identity_arguments(oid) as identity_args
        FROM pg_catalog.pg_proc
        WHERE proname = 'create_booking'
          AND pronamespace = (SELECT oid FROM pg_catalog.pg_namespace WHERE nspname = 'public')
    LOOP
        drop_stmt := format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE', r.proname, r.identity_args);
        RAISE NOTICE '刪除函數: %', drop_stmt;
        EXECUTE drop_stmt;
    END LOOP;
END $$;

-- 步驟 2: 創建第一個函數（沒有服務選項參數）
CREATE OR REPLACE FUNCTION public.create_booking(
    p_line_user_id TEXT,
    p_service_id UUID,
    p_booking_date DATE,
    p_booking_time TIME,
    p_notes TEXT DEFAULT NULL
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_member_id UUID;
    v_service public.services;
    v_final_price DECIMAL(10, 2);
    v_booking public.bookings;
    v_conflict_count INTEGER;  -- 新增：用於檢查重複預約
BEGIN
    -- 驗證必要參數
    IF p_service_id IS NULL THEN
        RAISE EXCEPTION '服務 ID 不能為空';
    END IF;
    
    -- 查找會員
    SELECT id INTO v_member_id
    FROM public.members
    WHERE line_user_id = p_line_user_id;

    IF v_member_id IS NULL THEN
        RAISE EXCEPTION '找不到對應的會員資料';
    END IF;

    -- 取得服務資訊
    SELECT * INTO v_service
    FROM public.services
    WHERE id = p_service_id AND is_active = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION '服務不存在或已停用';
    END IF;

    -- 如果服務需要選項但未提供，則錯誤
    IF v_service.has_options = true THEN
        RAISE EXCEPTION '此服務需要選擇 %，請使用帶選項的預約函數', COALESCE(v_service.option_label, '選項');
    END IF;

    v_final_price := COALESCE(v_service.base_price, 0);
    
    -- 檢查時間段是否可用
    IF NOT public.check_time_slot_available(p_booking_date, p_booking_time, v_service.duration) THEN
        RAISE EXCEPTION '該時間段無法預約，請選擇其他時間';
    END IF;
    
    -- 檢查是否已有衝突的預約（修正：使用新的變數 v_conflict_count，避免重用 v_member_id）
    SELECT COUNT(*)
    INTO v_conflict_count
    FROM public.bookings
    WHERE member_id = v_member_id
      AND booking_date = p_booking_date
      AND booking_time = p_booking_time
      AND status IN ('pending', 'confirmed');
    
    IF v_conflict_count > 0 THEN
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
        v_member_id,  -- 使用已查找的 v_member_id
        p_service_id,
        p_booking_date,
        p_booking_time,
        'pending',
        v_service.name,
        v_service.duration,
        v_final_price,
        NULL,  -- 沒有選項
        NULL,  -- 沒有選項名稱
        NULLIF(p_notes, '')
    )
    RETURNING * INTO v_booking;
    
    RETURN v_booking;
END;
$$;

-- 步驟 3: 創建第二個函數（有服務選項參數）
CREATE OR REPLACE FUNCTION public.create_booking(
    p_line_user_id TEXT,
    p_service_id UUID,
    p_booking_date DATE,
    p_booking_time TIME,
    p_service_option_id TEXT,
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
    v_service_option_id UUID;
    v_cleaned_option_id TEXT;
    v_conflict_count INTEGER;  -- 新增：用於檢查重複預約
BEGIN
    -- 驗證必要參數
    IF p_service_id IS NULL THEN
        RAISE EXCEPTION '服務 ID 不能為空';
    END IF;
    
    -- 驗證服務選項 ID（這是必填參數）
    IF p_service_option_id IS NULL OR TRIM(p_service_option_id) = '' THEN
        RAISE EXCEPTION '服務選項 ID 不能為空';
    END IF;
    
    v_cleaned_option_id := TRIM(p_service_option_id);
    
    -- 檢查是否為無效值
    IF v_cleaned_option_id = '0' 
       OR v_cleaned_option_id = 'null'
       OR v_cleaned_option_id = 'undefined'
       OR v_cleaned_option_id = 'NULL'
       OR v_cleaned_option_id = 'UNDEFINED' THEN
        RAISE EXCEPTION '服務選項 ID 無效: %', p_service_option_id;
    END IF;
    
    -- 查找會員
    SELECT id INTO v_member_id
    FROM public.members
    WHERE line_user_id = p_line_user_id;

    IF v_member_id IS NULL THEN
        RAISE EXCEPTION '找不到對應的會員資料';
    END IF;

    -- 取得服務資訊
    SELECT * INTO v_service
    FROM public.services
    WHERE id = p_service_id AND is_active = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION '服務不存在或已停用';
    END IF;

    -- 轉換服務選項 ID 為 UUID
    BEGIN
        v_service_option_id := v_cleaned_option_id::UUID;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION '服務選項 ID 格式錯誤: %', v_cleaned_option_id;
    END;
    
    -- 取得服務選項資訊
    SELECT * INTO v_service_option
    FROM public.service_options
    WHERE id = v_service_option_id 
      AND service_id = p_service_id
      AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION '服務選項不存在或已停用';
    END IF;
    
    -- 計算最終價格（基礎價格 + 選項價格調整）
    v_final_price := COALESCE(v_service.base_price, 0) + COALESCE(v_service_option.price_modifier, 0);
    v_option_name := v_service_option.name;
    
    -- 檢查時間段是否可用
    IF NOT public.check_time_slot_available(p_booking_date, p_booking_time, v_service.duration) THEN
        RAISE EXCEPTION '該時間段無法預約，請選擇其他時間';
    END IF;
    
    -- 檢查是否已有衝突的預約（修正：使用新的變數 v_conflict_count，避免重用 v_member_id）
    SELECT COUNT(*)
    INTO v_conflict_count
    FROM public.bookings
    WHERE member_id = v_member_id
      AND booking_date = p_booking_date
      AND booking_time = p_booking_time
      AND status IN ('pending', 'confirmed');
    
    IF v_conflict_count > 0 THEN
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
        v_member_id,  -- 使用已查找的 v_member_id
        p_service_id,
        p_booking_date,
        p_booking_time,
        'pending',
        v_service.name,
        v_service.duration,
        v_final_price,
        v_service_option_id,
        v_option_name,
        NULLIF(p_notes, '')
    )
    RETURNING * INTO v_booking;
    
    RETURN v_booking;
END;
$$;

-- 步驟 4: 驗證函數已創建
SELECT 
    p.proname AS function_name,
    pg_catalog.pg_get_function_arguments(p.oid) AS arguments
FROM
    pg_catalog.pg_proc p
LEFT JOIN
    pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE
    p.proname = 'create_booking'
    AND n.nspname = 'public'
ORDER BY
    arguments;

-- 註解
COMMENT ON FUNCTION public.create_booking(TEXT, UUID, DATE, TIME, TEXT) IS '會員端建立預約函數（無服務選項版本）';
COMMENT ON FUNCTION public.create_booking(TEXT, UUID, DATE, TIME, TEXT, TEXT) IS '會員端建立預約函數（有服務選項版本）';

