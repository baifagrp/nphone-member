-- =============================================
-- 調試預約驗證 - 返回表格結果版本
-- =============================================

-- 設定測試參數（請修改這裡）
WITH test_params AS (
    SELECT 
        '2025-12-14'::DATE AS p_booking_date,
        '09:05:00'::TIME AS p_booking_time,
        'U55d367a385246ff7a121c6b063f09360'::TEXT AS p_line_user_id  -- ⚠️ 改成您的 LINE User ID
),
service_info AS (
    SELECT duration, name
    FROM public.services
    WHERE name = '抗藍光貼膜'
    LIMIT 1
),
validation_results AS (
    SELECT
        -- 步驟 1: 日期檢查
        t.p_booking_date AS 預約日期,
        EXTRACT(DOW FROM t.p_booking_date)::INTEGER AS 星期幾,
        CASE EXTRACT(DOW FROM t.p_booking_date)::INTEGER
            WHEN 0 THEN '週日'
            WHEN 1 THEN '週一'
            WHEN 2 THEN '週二'
            WHEN 3 THEN '週三'
            WHEN 4 THEN '週四'
            WHEN 5 THEN '週五'
            WHEN 6 THEN '週六'
        END AS 星期名稱,
        
        -- 步驟 2: 營業時間
        bh.is_open AS 是否營業,
        bh.open_time AS 營業開始,
        bh.close_time AS 營業結束,
        
        -- 步驟 3: 預約時間
        t.p_booking_time AS 預約時間,
        
        -- 步驟 4: 服務結束時間
        s.duration AS 服務時長_分鐘,
        (t.p_booking_time + (s.duration || ' minutes')::INTERVAL)::TIME AS 服務結束時間,
        
        -- 驗證結果
        CASE 
            WHEN NOT bh.is_open THEN '❌ 當天未營業'
            WHEN t.p_booking_time < bh.open_time THEN '❌ 預約時間早於營業時間'
            WHEN (t.p_booking_time + (s.duration || ' minutes')::INTERVAL)::TIME > bh.close_time THEN '❌ 服務結束時間超過營業時間'
            ELSE '✅ 營業時間檢查通過'
        END AS 營業時間驗證,
        
        -- 步驟 5: 時間段檢查
        EXISTS(SELECT 1 FROM public.time_slots WHERE time_slot = t.p_booking_time) AS 時間段存在,
        COALESCE((SELECT is_active FROM public.time_slots WHERE time_slot = t.p_booking_time LIMIT 1), false) AS 時間段啟用,
        COALESCE((SELECT max_bookings FROM public.time_slots WHERE time_slot = t.p_booking_time LIMIT 1), 1) AS 最大預約數,
        
        -- 步驟 6: 預約衝突數量
        (
            SELECT COUNT(*)
            FROM public.bookings b
            WHERE b.booking_date = t.p_booking_date
              AND b.status IN ('pending', 'confirmed')
              AND (
                  (b.booking_time <= t.p_booking_time AND (b.booking_time + (b.service_duration || ' minutes')::INTERVAL)::TIME > t.p_booking_time)
                  OR
                  (b.booking_time < (t.p_booking_time + (s.duration || ' minutes')::INTERVAL)::TIME AND b.booking_time >= t.p_booking_time)
              )
        ) AS 現有預約數,
        
        -- 步驟 7: 會員重複預約
        (
            SELECT COUNT(*)
            FROM public.bookings b
            JOIN public.members m ON b.member_id = m.id
            WHERE m.line_user_id = t.p_line_user_id
              AND b.booking_date = t.p_booking_date
              AND b.booking_time = t.p_booking_time
              AND b.status IN ('pending', 'confirmed')
        ) AS 會員重複預約數
        
    FROM test_params t
    CROSS JOIN service_info s
    LEFT JOIN public.business_hours bh ON bh.day_of_week = EXTRACT(DOW FROM t.p_booking_date)::INTEGER
)
SELECT 
    -- 基本資訊
    預約日期,
    星期幾,
    星期名稱,
    預約時間,
    
    -- 營業時間
    是否營業,
    營業開始,
    營業結束,
    
    -- 服務資訊
    服務時長_分鐘,
    服務結束時間,
    
    -- 驗證結果
    營業時間驗證,
    
    -- 時間段資訊
    時間段存在,
    時間段啟用,
    最大預約數,
    
    -- 衝突檢查
    現有預約數,
    會員重複預約數,
    
    -- 最終判斷
    CASE
        WHEN 營業時間驗證 != '✅ 營業時間檢查通過' THEN 營業時間驗證
        WHEN 時間段存在 AND NOT 時間段啟用 THEN '❌ 時間段未啟用'
        WHEN 現有預約數 >= 最大預約數 THEN '❌ 預約數已達上限 (' || 現有預約數 || ' >= ' || 最大預約數 || ')'
        WHEN 會員重複預約數 > 0 THEN '❌ 您在此時間已有預約'
        ELSE '✅ 可以預約！'
    END AS "🎯 最終判斷"
    
FROM validation_results;

-- =============================================
-- 如果有預約衝突，顯示詳細資訊
-- =============================================
WITH test_params AS (
    SELECT 
        '2025-12-14'::DATE AS p_booking_date,
        '09:05:00'::TIME AS p_booking_time,
        'U55d367a385246ff7a121c6b063f09360'::TEXT AS p_line_user_id  -- ⚠️ 改成您的 LINE User ID（與上面相同）
)
SELECT 
    '🔍 衝突的預約詳情' AS 說明,
    m.name AS 會員姓名,
    b.booking_time AS 預約時間,
    (b.booking_time + (b.service_duration || ' minutes')::INTERVAL)::TIME AS 結束時間,
    b.service_duration AS 服務時長_分鐘,
    b.status AS 預約狀態,
    s.name AS 服務名稱
FROM test_params t
CROSS JOIN public.bookings b
JOIN public.members m ON b.member_id = m.id
JOIN public.services s ON b.service_id = s.id
WHERE b.booking_date = t.p_booking_date
  AND b.status IN ('pending', 'confirmed')
ORDER BY b.booking_time;

