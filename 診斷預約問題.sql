-- =============================================
-- 完整診斷：為什麼 09:05 無法預約？
-- =============================================

-- 1️⃣ 檢查營業時間（週日）
SELECT 
    '1. 營業時間檢查' AS 檢查項目,
    day_of_week AS 星期,
    CASE day_of_week
        WHEN 0 THEN '週日'
        WHEN 1 THEN '週一'
        WHEN 2 THEN '週二'
        WHEN 3 THEN '週三'
        WHEN 4 THEN '週四'
        WHEN 5 THEN '週五'
        WHEN 6 THEN '週六'
    END AS 星期名稱,
    is_open AS 是否營業,
    open_time AS 開店時間,
    close_time AS 關店時間,
    CASE 
        WHEN is_open = false THEN '❌ 未營業'
        WHEN open_time > '09:05:00' THEN '❌ 09:05 在營業時間之前'
        WHEN close_time <= '09:05:00' THEN '❌ 09:05 在營業時間之後'
        ELSE '✅ 營業時間正常'
    END AS 檢查結果
FROM public.business_hours
WHERE day_of_week = 0;  -- 0 = 週日

-- 2️⃣ 檢查時間段設定
SELECT 
    '2. 時間段檢查' AS 檢查項目,
    time_slot AS 時間段,
    is_active AS 是否啟用,
    max_bookings AS 最大預約數,
    CASE 
        WHEN time_slot = '09:05:00' AND is_active = true THEN '✅ 09:05 時間段存在且啟用'
        WHEN time_slot = '09:05:00' AND is_active = false THEN '❌ 09:05 時間段存在但未啟用'
        ELSE '⚠️ 其他時間段'
    END AS 檢查結果
FROM public.time_slots
WHERE time_slot BETWEEN '09:00:00' AND '09:10:00'
ORDER BY time_slot;

-- 3️⃣ 檢查是否有 09:05 時間段
SELECT 
    '3. 09:05 時間段是否存在' AS 檢查項目,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ 存在'
        ELSE '❌ 不存在 - 這是問題所在！'
    END AS 檢查結果,
    COUNT(*) AS 數量
FROM public.time_slots
WHERE time_slot = '09:05:00';

-- 4️⃣ 檢查 09:05 的現有預約
SELECT 
    '4. 現有預約檢查' AS 檢查項目,
    COUNT(*) AS 現有預約數,
    COALESCE((
        SELECT max_bookings 
        FROM public.time_slots 
        WHERE time_slot = '09:05:00'
    ), 1) AS 最大允許數,
    CASE 
        WHEN COUNT(*) >= COALESCE((
            SELECT max_bookings 
            FROM public.time_slots 
            WHERE time_slot = '09:05:00'
        ), 1) THEN '❌ 已滿 - 這是問題所在！'
        ELSE '✅ 有空位'
    END AS 檢查結果
FROM public.bookings
WHERE booking_date = '2025-12-14'
  AND booking_time = '09:05:00'
  AND status IN ('pending', 'confirmed');

-- 5️⃣ 完整模擬驗證流程
SELECT 
    '5. 完整驗證模擬' AS 檢查項目,
    *
FROM (
    SELECT 
        bh.is_open AS 是否營業,
        bh.open_time AS 開店時間,
        bh.close_time AS 關店時間,
        '09:05:00'::TIME AS 預約時間,
        ts.time_slot AS 時間段,
        ts.is_active AS 時間段是否啟用,
        ts.max_bookings AS 最大預約數,
        (SELECT COUNT(*) FROM public.bookings 
         WHERE booking_date = '2025-12-14' 
           AND booking_time = '09:05:00'
           AND status IN ('pending', 'confirmed')
        ) AS 現有預約數,
        CASE 
            WHEN bh.is_open = false THEN '❌ 當天未營業'
            WHEN '09:05:00'::TIME < bh.open_time THEN '❌ 在營業時間之前'
            WHEN '09:05:00'::TIME >= bh.close_time THEN '❌ 在營業時間之後'
            WHEN ts.time_slot IS NULL THEN '❌ 時間段不存在'
            WHEN ts.is_active = false THEN '❌ 時間段未啟用'
            WHEN (SELECT COUNT(*) FROM public.bookings 
                  WHERE booking_date = '2025-12-14' 
                    AND booking_time = '09:05:00'
                    AND status IN ('pending', 'confirmed')
                 ) >= ts.max_bookings THEN '❌ 預約已滿'
            ELSE '✅ 應該可以預約'
        END AS 最終判斷
    FROM public.business_hours bh
    LEFT JOIN public.time_slots ts ON ts.time_slot = '09:05:00'
    WHERE bh.day_of_week = 0  -- 週日
) AS validation;

-- 6️⃣ 查看所有可用的時間段（週日）
SELECT 
    '6. 週日所有可用時間段' AS 檢查項目,
    ts.time_slot AS 時間段,
    ts.max_bookings AS 最大預約數,
    (SELECT COUNT(*) FROM public.bookings 
     WHERE booking_date = '2025-12-14' 
       AND booking_time = ts.time_slot
       AND status IN ('pending', 'confirmed')
    ) AS 已預約數,
    ts.max_bookings - (SELECT COUNT(*) FROM public.bookings 
                       WHERE booking_date = '2025-12-14' 
                         AND booking_time = ts.time_slot
                         AND status IN ('pending', 'confirmed')
                      ) AS 剩餘名額
FROM public.time_slots ts
CROSS JOIN public.business_hours bh
WHERE bh.day_of_week = 0
  AND bh.is_open = true
  AND ts.is_active = true
  AND ts.time_slot >= bh.open_time
  AND ts.time_slot < bh.close_time
ORDER BY ts.time_slot;

