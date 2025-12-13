-- ================================================================
-- LINE 訊息推播系統 Schema
-- ================================================================

-- 0. 建立 updated_at 自動更新函數（如果尚未存在）
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_updated_at_column IS '自動更新 updated_at 欄位的觸發器函數';

---

-- 1. 通知設定表（notification_settings）
CREATE TABLE IF NOT EXISTS public.notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    
    -- 通知開關
    booking_reminder_enabled BOOLEAN DEFAULT TRUE,
    birthday_greeting_enabled BOOLEAN DEFAULT TRUE,
    wallet_notification_enabled BOOLEAN DEFAULT TRUE,
    points_notification_enabled BOOLEAN DEFAULT TRUE,
    promotion_enabled BOOLEAN DEFAULT TRUE,
    
    -- 提醒時間設定
    booking_reminder_hours INTEGER DEFAULT 24,  -- 預約前幾小時提醒（預設 24 小時）
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_member_notification_settings UNIQUE (member_id)
);

COMMENT ON TABLE public.notification_settings IS '會員通知設定表';
COMMENT ON COLUMN public.notification_settings.booking_reminder_enabled IS '預約提醒開關';
COMMENT ON COLUMN public.notification_settings.birthday_greeting_enabled IS '生日祝福開關';
COMMENT ON COLUMN public.notification_settings.wallet_notification_enabled IS '儲值金通知開關';
COMMENT ON COLUMN public.notification_settings.points_notification_enabled IS '積分通知開關';
COMMENT ON COLUMN public.notification_settings.promotion_enabled IS '優惠活動通知開關';
COMMENT ON COLUMN public.notification_settings.booking_reminder_hours IS '預約提醒時間（小時）';

-- 索引
CREATE INDEX IF NOT EXISTS idx_notification_settings_member ON public.notification_settings(member_id);

-- 更新時間觸發器
DROP TRIGGER IF EXISTS update_notification_settings_updated_at ON public.notification_settings;
CREATE TRIGGER update_notification_settings_updated_at
    BEFORE UPDATE ON public.notification_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

---

-- 2. 通知記錄表（notification_logs）
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    
    -- 通知類型
    notification_type TEXT NOT NULL CHECK (notification_type IN (
        'booking_created',       -- 預約建立成功
        'booking_confirmed',     -- 預約已確認
        'booking_reminder',      -- 預約提醒
        'birthday_greeting',     -- 生日祝福
        'wallet_change',         -- 儲值金變動
        'points_change',         -- 積分變動
        'promotion',             -- 優惠活動
        'system'                 -- 系統通知
    )),
    
    -- 通知內容
    title TEXT,
    message TEXT NOT NULL,
    
    -- 關聯資料
    related_booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    related_transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    
    -- 發送狀態
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    
    -- LINE 訊息 ID
    line_message_id TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.notification_logs IS '通知發送記錄表';
COMMENT ON COLUMN public.notification_logs.notification_type IS '通知類型';
COMMENT ON COLUMN public.notification_logs.status IS '發送狀態：pending, sent, failed';
COMMENT ON COLUMN public.notification_logs.line_message_id IS 'LINE 訊息 ID（用於追蹤）';

-- 索引
CREATE INDEX IF NOT EXISTS idx_notification_logs_member ON public.notification_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON public.notification_logs(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON public.notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created ON public.notification_logs(created_at DESC);

---

-- 3. 會員建立時自動建立通知設定
CREATE OR REPLACE FUNCTION public.create_default_notification_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.notification_settings (member_id)
    VALUES (NEW.id)
    ON CONFLICT (member_id) DO NOTHING;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_create_notification_settings ON public.members;
CREATE TRIGGER trigger_create_notification_settings
    AFTER INSERT ON public.members
    FOR EACH ROW
    EXECUTE FUNCTION public.create_default_notification_settings();

COMMENT ON FUNCTION public.create_default_notification_settings IS '會員建立時自動建立通知設定';

---

-- 4. 為現有會員建立通知設定
INSERT INTO public.notification_settings (member_id)
SELECT id FROM public.members
WHERE id NOT IN (SELECT member_id FROM public.notification_settings)
ON CONFLICT (member_id) DO NOTHING;

---

-- 5. 啟用 RLS
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- RLS 政策：允許 anon 使用者（會員端）讀取通知設定
-- 前端會根據 member_id 過濾，這裡允許基本訪問
DROP POLICY IF EXISTS "Allow anon read notification settings" ON public.notification_settings;
CREATE POLICY "Allow anon read notification settings"
    ON public.notification_settings
    FOR SELECT
    TO anon
    USING (true);

DROP POLICY IF EXISTS "Allow anon update notification settings" ON public.notification_settings;
CREATE POLICY "Allow anon update notification settings"
    ON public.notification_settings
    FOR UPDATE
    TO anon
    USING (true)
    WITH CHECK (true);

-- RLS 政策：管理員可以管理所有通知設定
DROP POLICY IF EXISTS "Admins can manage all notification settings" ON public.notification_settings;
CREATE POLICY "Admins can manage all notification settings"
    ON public.notification_settings
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE admins.id = auth.uid()
        )
    );

-- RLS 政策：允許 anon 使用者（會員端）讀取通知記錄
DROP POLICY IF EXISTS "Allow anon read notification logs" ON public.notification_logs;
CREATE POLICY "Allow anon read notification logs"
    ON public.notification_logs
    FOR SELECT
    TO anon
    USING (true);

-- RLS 政策：允許 service_role 建立通知記錄（Edge Function 使用）
DROP POLICY IF EXISTS "Service role can insert notification logs" ON public.notification_logs;
CREATE POLICY "Service role can insert notification logs"
    ON public.notification_logs
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- RLS 政策：管理員可以查看所有通知記錄
DROP POLICY IF EXISTS "Admins can view all notification logs" ON public.notification_logs;
CREATE POLICY "Admins can view all notification logs"
    ON public.notification_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE admins.id = auth.uid()
        )
    );

-- 顯示完成訊息
DO $$
BEGIN
    RAISE NOTICE '✅ 通知系統 Schema 建立完成';
    RAISE NOTICE '📋 notification_settings 表已建立';
    RAISE NOTICE '📝 notification_logs 表已建立';
    RAISE NOTICE '🔔 會員自動建立通知設定已啟用';
END $$;

