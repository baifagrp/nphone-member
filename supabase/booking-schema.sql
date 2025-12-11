-- =============================================
-- 第二階段：預約系統 - 資料庫結構
-- =============================================

-- =============================================
-- 服務項目表
-- =============================================
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,                    -- 服務名稱
    description TEXT,                      -- 服務描述
    duration INTEGER NOT NULL DEFAULT 60,  -- 服務時長（分鐘）
    price DECIMAL(10, 2) NOT NULL DEFAULT 0, -- 價格
    image_url TEXT,                        -- 服務圖片 URL
    is_active BOOLEAN DEFAULT TRUE,        -- 是否啟用
    sort_order INTEGER DEFAULT 0,          -- 排序順序
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 服務項目表索引
CREATE INDEX IF NOT EXISTS services_is_active_idx ON public.services(is_active);
CREATE INDEX IF NOT EXISTS services_sort_order_idx ON public.services(sort_order);

-- 服務項目表註解
COMMENT ON TABLE public.services IS '服務項目表';
COMMENT ON COLUMN public.services.name IS '服務名稱';
COMMENT ON COLUMN public.services.duration IS '服務時長（分鐘）';
COMMENT ON COLUMN public.services.price IS '服務價格';

-- =============================================
-- 預約記錄表
-- =============================================
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
    
    -- 預約時間
    booking_date DATE NOT NULL,            -- 預約日期
    booking_time TIME NOT NULL,            -- 預約時間
    
    -- 預約狀態
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
    
    -- 預約詳情
    service_name TEXT NOT NULL,            -- 服務名稱（快照，避免服務被刪除後遺失）
    service_duration INTEGER NOT NULL,     -- 服務時長（快照）
    service_price DECIMAL(10, 2) NOT NULL, -- 服務價格（快照）
    
    -- 備註
    notes TEXT,                            -- 客戶備註
    admin_notes TEXT,                      -- 管理員備註（僅管理員可見）
    
    -- 時間戳記
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    confirmed_at TIMESTAMP WITH TIME ZONE, -- 確認時間
    cancelled_at TIMESTAMP WITH TIME ZONE, -- 取消時間
    completed_at TIMESTAMP WITH TIME ZONE  -- 完成時間
);

-- 預約記錄表索引
CREATE INDEX IF NOT EXISTS bookings_member_id_idx ON public.bookings(member_id);
CREATE INDEX IF NOT EXISTS bookings_service_id_idx ON public.bookings(service_id);
CREATE INDEX IF NOT EXISTS bookings_date_time_idx ON public.bookings(booking_date, booking_time);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON public.bookings(status);
CREATE INDEX IF NOT EXISTS bookings_created_at_idx ON public.bookings(created_at DESC);

-- 預約記錄表註解
COMMENT ON TABLE public.bookings IS '預約記錄表';
COMMENT ON COLUMN public.bookings.status IS '預約狀態：pending=待確認, confirmed=已確認, cancelled=已取消, completed=已完成, no_show=未到';

-- =============================================
-- 營業時間設定表（可選，用於限制可預約時間）
-- =============================================
CREATE TABLE IF NOT EXISTS public.business_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=週日, 1=週一, ..., 6=週六
    is_open BOOLEAN DEFAULT TRUE,          -- 當天是否營業
    open_time TIME DEFAULT '09:00:00',     -- 開始時間
    close_time TIME DEFAULT '18:00:00',    -- 結束時間
    break_start TIME,                      -- 休息開始時間（可選）
    break_end TIME,                        -- 休息結束時間（可選）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(day_of_week)
);

-- 營業時間表註解
COMMENT ON TABLE public.business_hours IS '營業時間設定表';
COMMENT ON COLUMN public.business_hours.day_of_week IS '星期幾：0=週日, 1=週一, ..., 6=週六';

-- =============================================
-- 時間段設定表（可選，用於設定每個時間段可接受的人數）
-- =============================================
CREATE TABLE IF NOT EXISTS public.time_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    time_slot TIME NOT NULL,               -- 時間段（例如：09:00, 10:00）
    max_bookings INTEGER DEFAULT 1,        -- 該時間段最大預約數
    is_active BOOLEAN DEFAULT TRUE,        -- 是否啟用
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(time_slot)
);

-- 時間段表索引
CREATE INDEX IF NOT EXISTS time_slots_time_slot_idx ON public.time_slots(time_slot);
CREATE INDEX IF NOT EXISTS time_slots_is_active_idx ON public.time_slots(is_active);

-- 時間段表註解
COMMENT ON TABLE public.time_slots IS '時間段設定表';

-- =============================================
-- 自動更新 updated_at 觸發器（為新表建立）
-- =============================================

-- 為 services 表建立觸發器
DROP TRIGGER IF EXISTS set_updated_at_services ON public.services;
CREATE TRIGGER set_updated_at_services
    BEFORE UPDATE ON public.services
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 為 bookings 表建立觸發器
DROP TRIGGER IF EXISTS set_updated_at_bookings ON public.bookings;
CREATE TRIGGER set_updated_at_bookings
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 為 business_hours 表建立觸發器
DROP TRIGGER IF EXISTS set_updated_at_business_hours ON public.business_hours;
CREATE TRIGGER set_updated_at_business_hours
    BEFORE UPDATE ON public.business_hours
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 為 time_slots 表建立觸發器
DROP TRIGGER IF EXISTS set_updated_at_time_slots ON public.time_slots;
CREATE TRIGGER set_updated_at_time_slots
    BEFORE UPDATE ON public.time_slots
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- 預設資料（可選）
-- =============================================

-- 預設營業時間（週一到週五 09:00-18:00，週六 09:00-13:00，週日休息）
INSERT INTO public.business_hours (day_of_week, is_open, open_time, close_time)
VALUES
    (0, false, '09:00:00', '18:00:00'), -- 週日休息
    (1, true, '09:00:00', '18:00:00'),  -- 週一
    (2, true, '09:00:00', '18:00:00'),  -- 週二
    (3, true, '09:00:00', '18:00:00'),  -- 週三
    (4, true, '09:00:00', '18:00:00'),  -- 週四
    (5, true, '09:00:00', '18:00:00'),  -- 週五
    (6, true, '09:00:00', '13:00:00')   -- 週六
ON CONFLICT (day_of_week) DO NOTHING;

-- 預設時間段（每小時一個時段，09:00-17:00）
INSERT INTO public.time_slots (time_slot, max_bookings, is_active)
VALUES
    ('09:00:00'::TIME, 1, true),
    ('10:00:00'::TIME, 1, true),
    ('11:00:00'::TIME, 1, true),
    ('12:00:00'::TIME, 1, true),
    ('13:00:00'::TIME, 1, true),
    ('14:00:00'::TIME, 1, true),
    ('15:00:00'::TIME, 1, true),
    ('16:00:00'::TIME, 1, true),
    ('17:00:00'::TIME, 1, true)
ON CONFLICT (time_slot) DO NOTHING;

-- 預設服務項目範例（可選，可刪除或修改）
INSERT INTO public.services (name, description, duration, price, sort_order)
VALUES
    ('基礎貼膜', 'iPhone、Android 基礎螢幕保護貼', 30, 500, 1),
    ('全機包膜', '完整機身保護膜，包含邊框', 60, 1500, 2),
    ('抗藍光貼膜', '抗藍光螢幕保護貼', 30, 800, 3),
    ('防窺貼膜', '防窺螢幕保護貼', 30, 900, 4)
ON CONFLICT DO NOTHING;

-- =============================================
-- 輔助函數：檢查時間段是否可用
-- =============================================
CREATE OR REPLACE FUNCTION public.check_time_slot_available(
    p_booking_date DATE,
    p_booking_time TIME,
    p_service_duration INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    v_is_open BOOLEAN;
    v_open_time TIME;
    v_close_time TIME;
    v_day_of_week INTEGER;
    v_end_time TIME;
    v_conflict_count INTEGER;
BEGIN
    -- 取得當天的星期幾（0=週日, 6=週六）
    v_day_of_week := EXTRACT(DOW FROM p_booking_date);
    
    -- 檢查當天是否營業
    SELECT is_open, open_time, close_time
    INTO v_is_open, v_open_time, v_close_time
    FROM public.business_hours
    WHERE day_of_week = v_day_of_week;
    
    IF NOT FOUND OR NOT v_is_open THEN
        RETURN FALSE;
    END IF;
    
    -- 檢查預約時間是否在營業時間內
    IF p_booking_time < v_open_time THEN
        RETURN FALSE;
    END IF;
    
    -- 計算服務結束時間
    v_end_time := (p_booking_time + (p_service_duration || ' minutes')::INTERVAL)::TIME;
    
    -- 如果服務結束時間超過營業結束時間
    IF v_end_time > v_close_time THEN
        RETURN FALSE;
    END IF;
    
    -- 檢查該時間段是否有衝突的預約（只計算已確認和待確認的）
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
    
    -- 檢查是否超過該時間段的最大預約數
    IF v_conflict_count >= COALESCE((
        SELECT max_bookings
        FROM public.time_slots
        WHERE time_slot = p_booking_time
          AND is_active = true
        LIMIT 1
    ), 1) THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 完成訊息
-- =============================================
DO $$ 
BEGIN
    RAISE NOTICE '✅ 預約系統資料庫結構建立完成！';
    RAISE NOTICE '📋 已建立表格：';
    RAISE NOTICE '   - services (服務項目)';
    RAISE NOTICE '   - bookings (預約記錄)';
    RAISE NOTICE '   - business_hours (營業時間)';
    RAISE NOTICE '   - time_slots (時間段設定)';
    RAISE NOTICE '';
    RAISE NOTICE '📋 已建立函數：';
    RAISE NOTICE '   - check_time_slot_available() (檢查時間段是否可用)';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  下一步：執行 booking-rls-policies.sql 設定安全政策';
END $$;

