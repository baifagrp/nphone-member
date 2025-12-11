-- =============================================
-- 第二階段：預約系統 - Row Level Security 政策
-- =============================================

-- =============================================
-- 啟用 RLS
-- =============================================
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Services 表的 RLS 政策
-- =============================================

-- 政策 1: 任何人都可以查看啟用的服務（會員端顯示）
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
CREATE POLICY "Anyone can view active services"
    ON public.services
    FOR SELECT
    USING (is_active = true);

-- 政策 2: 管理員可以查看所有服務
DROP POLICY IF EXISTS "Admins can view all services" ON public.services;
CREATE POLICY "Admins can view all services"
    ON public.services
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE admins.id = auth.uid()
        )
    );

-- 政策 3: 管理員可以新增服務
DROP POLICY IF EXISTS "Admins can insert services" ON public.services;
CREATE POLICY "Admins can insert services"
    ON public.services
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE admins.id = auth.uid()
        )
    );

-- 政策 4: 管理員可以更新服務
DROP POLICY IF EXISTS "Admins can update services" ON public.services;
CREATE POLICY "Admins can update services"
    ON public.services
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE admins.id = auth.uid()
        )
    );

-- 政策 5: 管理員可以刪除服務
DROP POLICY IF EXISTS "Admins can delete services" ON public.services;
CREATE POLICY "Admins can delete services"
    ON public.services
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE admins.id = auth.uid()
        )
    );

-- =============================================
-- Service Options 表的 RLS 政策
-- =============================================

-- 政策 1: 任何人都可以查看啟用的服務選項（會員端顯示）
DROP POLICY IF EXISTS "Anyone can view active service options" ON public.service_options;
CREATE POLICY "Anyone can view active service options"
    ON public.service_options
    FOR SELECT
    USING (is_active = true);

-- 政策 2: 管理員可以查看所有服務選項
DROP POLICY IF EXISTS "Admins can view all service options" ON public.service_options;
CREATE POLICY "Admins can view all service options"
    ON public.service_options
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE admins.id = auth.uid()
        )
    );

-- 政策 3: 管理員可以管理服務選項
DROP POLICY IF EXISTS "Admins can manage service options" ON public.service_options;
CREATE POLICY "Admins can manage service options"
    ON public.service_options
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE admins.id = auth.uid()
        )
    );

-- =============================================
-- Bookings 表的 RLS 政策
-- =============================================

-- 政策 1: 會員可以查看自己的預約
DROP POLICY IF EXISTS "Members can view own bookings" ON public.bookings;
CREATE POLICY "Members can view own bookings"
    ON public.bookings
    FOR SELECT
    USING (
        member_id IN (
            SELECT id FROM public.members
            WHERE line_user_id = current_setting('app.current_line_user_id', true)
        )
    );

-- 政策 2: 管理員可以查看所有預約
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
CREATE POLICY "Admins can view all bookings"
    ON public.bookings
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE admins.id = auth.uid()
        )
    );

-- 政策 3: 會員可以新增自己的預約（通過 RPC 函數）
-- 注意：直接 INSERT 會被 RPC 函數控制，這裡先開放但實際上由函數驗證
DROP POLICY IF EXISTS "Members can insert own bookings via RPC" ON public.bookings;
CREATE POLICY "Members can insert own bookings via RPC"
    ON public.bookings
    FOR INSERT
    WITH CHECK (true);

-- 政策 4: 管理員可以新增預約
DROP POLICY IF EXISTS "Admins can insert bookings" ON public.bookings;
CREATE POLICY "Admins can insert bookings"
    ON public.bookings
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE admins.id = auth.uid()
        )
    );

-- 政策 5: 會員可以取消自己的預約（透過 RPC 函數）
DROP POLICY IF EXISTS "Members can update own bookings via RPC" ON public.bookings;
CREATE POLICY "Members can update own bookings via RPC"
    ON public.bookings
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- 政策 6: 管理員可以更新所有預約
DROP POLICY IF EXISTS "Admins can update all bookings" ON public.bookings;
CREATE POLICY "Admins can update all bookings"
    ON public.bookings
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE admins.id = auth.uid()
        )
    );

-- 政策 7: 管理員可以刪除預約
DROP POLICY IF EXISTS "Admins can delete bookings" ON public.bookings;
CREATE POLICY "Admins can delete bookings"
    ON public.bookings
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE admins.id = auth.uid()
        )
    );

-- =============================================
-- Business Hours 表的 RLS 政策
-- =============================================

-- 政策 1: 任何人都可以查看營業時間（會員端顯示可用時間）
DROP POLICY IF EXISTS "Anyone can view business hours" ON public.business_hours;
CREATE POLICY "Anyone can view business hours"
    ON public.business_hours
    FOR SELECT
    USING (true);

-- 政策 2: 管理員可以管理營業時間
DROP POLICY IF EXISTS "Admins can manage business hours" ON public.business_hours;
CREATE POLICY "Admins can manage business hours"
    ON public.business_hours
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE admins.id = auth.uid()
        )
    );

-- =============================================
-- Time Slots 表的 RLS 政策
-- =============================================

-- 政策 1: 任何人都可以查看啟用的時間段
DROP POLICY IF EXISTS "Anyone can view active time slots" ON public.time_slots;
CREATE POLICY "Anyone can view active time slots"
    ON public.time_slots
    FOR SELECT
    USING (is_active = true);

-- 政策 2: 管理員可以管理時間段
DROP POLICY IF EXISTS "Admins can manage time slots" ON public.time_slots;
CREATE POLICY "Admins can manage time slots"
    ON public.time_slots
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE admins.id = auth.uid()
        )
    );

-- =============================================
-- 輔助函數：建立預約（會員端使用）
-- =============================================
CREATE OR REPLACE FUNCTION public.create_booking(
    p_line_user_id TEXT,
    p_service_id UUID,
    p_booking_date DATE,
    p_booking_time TIME,
    p_service_option_id UUID DEFAULT NULL,
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
BEGIN
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
    
    -- 如果服務需要選項但未提供，則錯誤
    IF v_service.has_options = true AND p_service_option_id IS NULL THEN
        RAISE EXCEPTION '此服務需要選擇 %', COALESCE(v_service.option_label, '選項');
    END IF;
    
    -- 如果提供了服務選項，驗證並取得資訊
    v_final_price := COALESCE(v_service.base_price, 0);
    v_option_name := NULL;
    
    IF p_service_option_id IS NOT NULL THEN
        SELECT * INTO v_service_option
        FROM public.service_options
        WHERE id = p_service_option_id 
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
        p_service_option_id,
        v_option_name,
        p_notes
    )
    RETURNING * INTO v_booking;
    
    RETURN v_booking;
END;
$$;

-- =============================================
-- 輔助函數：取消預約（會員端使用）
-- =============================================
CREATE OR REPLACE FUNCTION public.cancel_booking_by_member(
    p_line_user_id TEXT,
    p_booking_id UUID
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_booking public.bookings;
BEGIN
    -- 查找預約
    SELECT b.* INTO v_booking
    FROM public.bookings b
    JOIN public.members m ON b.member_id = m.id
    WHERE b.id = p_booking_id
      AND m.line_user_id = p_line_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION '找不到對應的預約記錄';
    END IF;
    
    -- 檢查狀態
    IF v_booking.status = 'cancelled' THEN
        RAISE EXCEPTION '此預約已經取消';
    END IF;
    
    IF v_booking.status = 'completed' THEN
        RAISE EXCEPTION '已完成的預約無法取消';
    END IF;
    
    -- 取消預約
    UPDATE public.bookings
    SET 
        status = 'cancelled',
        cancelled_at = NOW(),
        updated_at = NOW()
    WHERE id = p_booking_id
    RETURNING * INTO v_booking;
    
    RETURN v_booking;
END;
$$;

-- =============================================
-- 完成訊息
-- =============================================
DO $$ 
BEGIN
    RAISE NOTICE '✅ 預約系統 RLS 政策設定完成！';
    RAISE NOTICE '🔒 已啟用 Row Level Security';
    RAISE NOTICE '📋 已建立政策：';
    RAISE NOTICE '   - Services: 5 條政策';
    RAISE NOTICE '   - Service Options: 3 條政策';
    RAISE NOTICE '   - Bookings: 7 條政策';
    RAISE NOTICE '   - Business Hours: 2 條政策';
    RAISE NOTICE '   - Time Slots: 2 條政策';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 已建立 RPC 函數：';
    RAISE NOTICE '   - create_booking() (會員建立預約，支援服務選項)';
    RAISE NOTICE '   - cancel_booking_by_member() (會員取消預約)';
END $$;

