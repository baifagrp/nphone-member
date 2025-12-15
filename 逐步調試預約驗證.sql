-- =============================================
-- 逐步調試預約驗證邏輯
-- 模擬 check_time_slot_available 函數的每一步
-- =============================================

-- 設定測試參數
DO $$
DECLARE
    -- 測試參數（請根據實際預約調整）
    p_booking_date DATE := '2025-12-14';
    p_booking_time TIME := '09:05:00';
    p_line_user_id TEXT := 'U55d367a385246ff7a121c6b063f09360';  -- ⚠️ 替換為實際的 LINE User ID
    
    -- 變數
    v_day_of_week INTEGER;
    v_is_open BOOLEAN;
    v_open_time TIME;
    v_close_time TIME;
    v_end_time TIME;
    v_conflict_count INTEGER;
    v_max_bookings INTEGER;
    v_service_duration INTEGER;
    v_time_slot_exists BOOLEAN;
    v_time_slot_active BOOLEAN;
    r RECORD;  -- 用於 FOR 循環
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE '🔍 開始逐步驗證預約';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
    
    -- 取得服務時長（假設是抗藍光貼膜）
    SELECT duration INTO v_service_duration
    FROM public.services
    WHERE name = '抗藍光貼膜'
    LIMIT 1;
    
    RAISE NOTICE '📱 服務時長: % 分鐘', v_service_duration;
    RAISE NOTICE '';
    
    -- 步驟 1: 取得星期幾
    v_day_of_week := EXTRACT(DOW FROM p_booking_date);
    RAISE NOTICE '✅ 步驟 1: 日期檢查';
    RAISE NOTICE '   預約日期: %', p_booking_date;
    RAISE NOTICE '   星期幾: % (%)', v_day_of_week, 
        CASE v_day_of_week
            WHEN 0 THEN '週日'
            WHEN 1 THEN '週一'
            WHEN 2 THEN '週二'
            WHEN 3 THEN '週三'
            WHEN 4 THEN '週四'
            WHEN 5 THEN '週五'
            WHEN 6 THEN '週六'
        END;
    RAISE NOTICE '';
    
    -- 步驟 2: 檢查營業時間
    SELECT is_open, open_time, close_time
    INTO v_is_open, v_open_time, v_close_time
    FROM public.business_hours
    WHERE day_of_week = v_day_of_week;
    
    RAISE NOTICE '✅ 步驟 2: 營業時間檢查';
    IF NOT FOUND THEN
        RAISE NOTICE '   ❌ 找不到營業時間設定！';
        RETURN;
    END IF;
    
    RAISE NOTICE '   是否營業: %', v_is_open;
    RAISE NOTICE '   營業時間: % - %', v_open_time, v_close_time;
    
    IF NOT v_is_open THEN
        RAISE NOTICE '   ❌ 當天未營業 - 驗證失敗！';
        RETURN;
    ELSE
        RAISE NOTICE '   ✅ 當天有營業';
    END IF;
    RAISE NOTICE '';
    
    -- 步驟 3: 檢查預約時間是否在營業時間內
    RAISE NOTICE '✅ 步驟 3: 預約時間檢查';
    RAISE NOTICE '   預約時間: %', p_booking_time;
    RAISE NOTICE '   營業開始: %', v_open_time;
    
    IF p_booking_time < v_open_time THEN
        RAISE NOTICE '   ❌ 預約時間在營業時間之前 - 驗證失敗！';
        RETURN;
    ELSE
        RAISE NOTICE '   ✅ 預約時間在營業時間之後';
    END IF;
    RAISE NOTICE '';
    
    -- 步驟 4: 計算服務結束時間
    v_end_time := (p_booking_time + (v_service_duration || ' minutes')::INTERVAL)::TIME;
    
    RAISE NOTICE '✅ 步驟 4: 服務結束時間檢查';
    RAISE NOTICE '   服務時長: % 分鐘', v_service_duration;
    RAISE NOTICE '   開始時間: %', p_booking_time;
    RAISE NOTICE '   結束時間: %', v_end_time;
    RAISE NOTICE '   營業結束: %', v_close_time;
    
    IF v_end_time > v_close_time THEN
        RAISE NOTICE '   ❌ 服務結束時間超過營業時間 - 驗證失敗！';
        RAISE NOTICE '   ⚠️  問題：% + % 分鐘 = % > %', p_booking_time, v_service_duration, v_end_time, v_close_time;
        RETURN;
    ELSE
        RAISE NOTICE '   ✅ 服務結束時間在營業時間內';
    END IF;
    RAISE NOTICE '';
    
    -- 步驟 5: 檢查時間段是否存在且啟用
    SELECT 
        COUNT(*) > 0,
        COALESCE(BOOL_OR(is_active), false),
        COALESCE(MAX(max_bookings), 1)
    INTO v_time_slot_exists, v_time_slot_active, v_max_bookings
    FROM public.time_slots
    WHERE time_slot = p_booking_time;
    
    RAISE NOTICE '✅ 步驟 5: 時間段設定檢查';
    RAISE NOTICE '   時間段: %', p_booking_time;
    RAISE NOTICE '   是否存在: %', v_time_slot_exists;
    RAISE NOTICE '   是否啟用: %', v_time_slot_active;
    RAISE NOTICE '   最大預約數: %', v_max_bookings;
    
    IF NOT v_time_slot_exists THEN
        RAISE NOTICE '   ⚠️  時間段不存在（將使用預設值：最大 1 個預約）';
    ELSIF NOT v_time_slot_active THEN
        RAISE NOTICE '   ❌ 時間段未啟用 - 驗證失敗！';
        RETURN;
    ELSE
        RAISE NOTICE '   ✅ 時間段存在且已啟用';
    END IF;
    RAISE NOTICE '';
    
    -- 步驟 6: 檢查預約衝突
    SELECT COUNT(*)
    INTO v_conflict_count
    FROM public.bookings
    WHERE booking_date = p_booking_date
      AND status IN ('pending', 'confirmed')
      AND (
          -- 時間重疊檢查
          (booking_time <= p_booking_time AND (booking_time + (service_duration || ' minutes')::INTERVAL)::TIME > p_booking_time)
          OR
          (booking_time < v_end_time AND booking_time >= p_booking_time)
      );
    
    RAISE NOTICE '✅ 步驟 6: 預約衝突檢查';
    RAISE NOTICE '   現有預約數: %', v_conflict_count;
    RAISE NOTICE '   最大預約數: %', v_max_bookings;
    
    IF v_conflict_count >= v_max_bookings THEN
        RAISE NOTICE '   ❌ 預約數已達上限 - 驗證失敗！';
        RAISE NOTICE '   ⚠️  % >= %', v_conflict_count, v_max_bookings;
        
        -- 顯示衝突的預約
        RAISE NOTICE '   衝突的預約：';
        FOR r IN 
            SELECT b.booking_time, b.service_duration, m.name
            FROM public.bookings b
            JOIN public.members m ON b.member_id = m.id
            WHERE b.booking_date = p_booking_date
              AND b.status IN ('pending', 'confirmed')
              AND (
                  (b.booking_time <= p_booking_time AND (b.booking_time + (b.service_duration || ' minutes')::INTERVAL)::TIME > p_booking_time)
                  OR
                  (b.booking_time < v_end_time AND b.booking_time >= p_booking_time)
              )
        LOOP
            RAISE NOTICE '     - % ~ % (% 分鐘) - %', 
                r.booking_time, 
                (r.booking_time + (r.service_duration || ' minutes')::INTERVAL)::TIME,
                r.service_duration,
                r.name;
        END LOOP;
        RETURN;
    ELSE
        RAISE NOTICE '   ✅ 無預約衝突';
    END IF;
    RAISE NOTICE '';
    
    -- 步驟 7: 檢查會員是否已有同時間預約
    SELECT COUNT(*)
    INTO v_conflict_count
    FROM public.bookings
    WHERE member_id = (SELECT id FROM public.members WHERE line_user_id = p_line_user_id)
      AND booking_date = p_booking_date
      AND booking_time = p_booking_time
      AND status IN ('pending', 'confirmed');
    
    RAISE NOTICE '✅ 步驟 7: 會員重複預約檢查';
    RAISE NOTICE '   LINE User ID: %', p_line_user_id;
    RAISE NOTICE '   同時間預約數: %', v_conflict_count;
    
    IF v_conflict_count > 0 THEN
        RAISE NOTICE '   ❌ 您在此時間已有預約 - 驗證失敗！';
        RETURN;
    ELSE
        RAISE NOTICE '   ✅ 無重複預約';
    END IF;
    RAISE NOTICE '';
    
    -- 最終結果
    RAISE NOTICE '==========================================';
    RAISE NOTICE '🎉 所有驗證通過！理論上應該可以預約';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
    RAISE NOTICE '如果仍然無法預約，請檢查：';
    RAISE NOTICE '1. Edge Function 是否正確調用 RPC';
    RAISE NOTICE '2. 前端發送的參數是否完整';
    RAISE NOTICE '3. Supabase Edge Function 日誌';
    
END $$;

