-- =============================================
-- 第三階段：結帳系統 - 資料庫結構
-- =============================================

-- =============================================
-- 付款方式表
-- =============================================
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,              -- 付款方式代碼（cash, card, line_pay, etc.）
    name TEXT NOT NULL,                     -- 付款方式名稱（現金、刷卡、LINE Pay 等）
    is_active BOOLEAN DEFAULT TRUE,         -- 是否啟用
    sort_order INTEGER DEFAULT 0,           -- 排序順序
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 付款方式表索引
CREATE INDEX IF NOT EXISTS payment_methods_code_idx ON public.payment_methods(code);
CREATE INDEX IF NOT EXISTS payment_methods_active_idx ON public.payment_methods(is_active);

-- 付款方式表註解
COMMENT ON TABLE public.payment_methods IS '付款方式設定表';

-- 預設付款方式
INSERT INTO public.payment_methods (code, name, sort_order, is_active)
VALUES 
    ('cash', '現金', 1, true),
    ('card', '刷卡', 2, true),
    ('line_pay', 'LINE Pay', 3, true),
    ('transfer', '轉帳', 4, true)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- 交易記錄表
-- =============================================
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE RESTRICT,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,  -- 關聯的預約（可選）
    
    -- 交易類型
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('payment', 'refund', 'deposit', 'withdrawal')),
    -- payment: 付款（消費）
    -- refund: 退款
    -- deposit: 儲值（未來擴展）
    -- withdrawal: 提領（未來擴展）
    
    -- 交易金額
    amount DECIMAL(10, 2) NOT NULL,         -- 交易金額（正數為收入，負數為支出）
    total_amount DECIMAL(10, 2) NOT NULL,   -- 總金額（原始金額，不包含折扣）
    discount_amount DECIMAL(10, 2) DEFAULT 0, -- 折扣金額
    
    -- 付款資訊
    payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
    payment_method_code TEXT,                -- 付款方式代碼（快照，避免刪除後遺失）
    payment_method_name TEXT,                -- 付款方式名稱（快照）
    
    -- 交易狀態
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')),
    -- pending: 待處理
    -- completed: 已完成
    -- failed: 失敗
    -- cancelled: 已取消
    -- refunded: 已退款
    
    -- 交易詳情
    description TEXT,                        -- 交易描述
    receipt_number TEXT,                     -- 收據編號（可選）
    reference_number TEXT,                   -- 參考編號（如信用卡授權碼、轉帳帳號等）
    
    -- 備註
    notes TEXT,                              -- 備註
    admin_notes TEXT,                        -- 管理員備註（僅管理員可見）
    
    -- 時間戳記
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,  -- 完成時間
    cancelled_at TIMESTAMP WITH TIME ZONE   -- 取消時間
);

-- 交易記錄表索引
CREATE INDEX IF NOT EXISTS transactions_member_id_idx ON public.transactions(member_id);
CREATE INDEX IF NOT EXISTS transactions_booking_id_idx ON public.transactions(booking_id);
CREATE INDEX IF NOT EXISTS transactions_type_idx ON public.transactions(transaction_type);
CREATE INDEX IF NOT EXISTS transactions_status_idx ON public.transactions(status);
CREATE INDEX IF NOT EXISTS transactions_payment_method_idx ON public.transactions(payment_method_id);
CREATE INDEX IF NOT EXISTS transactions_created_at_idx ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS transactions_receipt_number_idx ON public.transactions(receipt_number) WHERE receipt_number IS NOT NULL;

-- 交易記錄表註解
COMMENT ON TABLE public.transactions IS '交易記錄表';
COMMENT ON COLUMN public.transactions.transaction_type IS '交易類型：payment=付款, refund=退款, deposit=儲值, withdrawal=提領';
COMMENT ON COLUMN public.transactions.status IS '交易狀態：pending=待處理, completed=已完成, failed=失敗, cancelled=已取消, refunded=已退款';

-- =============================================
-- 在 bookings 表中新增付款相關欄位（向後兼容）
-- =============================================
DO $$
BEGIN
    -- 新增 payment_status 欄位
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'bookings'
                   AND column_name = 'payment_status') THEN
        ALTER TABLE public.bookings ADD COLUMN payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'partial', 'refunded'));
        COMMENT ON COLUMN public.bookings.payment_status IS '付款狀態：unpaid=未付款, paid=已付款, partial=部分付款, refunded=已退款';
    END IF;
    
    -- 新增 transaction_id 欄位（關聯主要交易）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'bookings'
                   AND column_name = 'transaction_id') THEN
        ALTER TABLE public.bookings ADD COLUMN transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL;
    END IF;
    
    -- 新增 paid_amount 欄位（已付金額）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'bookings'
                   AND column_name = 'paid_amount') THEN
        ALTER TABLE public.bookings ADD COLUMN paid_amount DECIMAL(10, 2) DEFAULT 0;
    END IF;
    
    -- 設定預設值
    UPDATE public.bookings SET payment_status = 'unpaid' WHERE payment_status IS NULL;
    UPDATE public.bookings SET paid_amount = 0 WHERE paid_amount IS NULL;
END $$;

-- =============================================
-- 觸發器：自動更新 updated_at
-- =============================================

-- transactions 表的 updated_at 觸發器
CREATE OR REPLACE FUNCTION public.update_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_transactions_updated_at ON public.transactions;
CREATE TRIGGER trigger_update_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_transactions_updated_at();

-- payment_methods 表的 updated_at 觸發器
CREATE OR REPLACE FUNCTION public.update_payment_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_payment_methods_updated_at ON public.payment_methods;
CREATE TRIGGER trigger_update_payment_methods_updated_at
    BEFORE UPDATE ON public.payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION public.update_payment_methods_updated_at();

-- =============================================
-- 完成訊息
-- =============================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=========================================';
    RAISE NOTICE '✅ 結帳系統資料庫結構建立完成！';
    RAISE NOTICE '=========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 已建立的資料表：';
    RAISE NOTICE '   - payment_methods (付款方式)';
    RAISE NOTICE '   - transactions (交易記錄)';
    RAISE NOTICE '';
    RAISE NOTICE '📝 已更新的資料表：';
    RAISE NOTICE '   - bookings (新增付款相關欄位)';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  下一步：執行 checkout-rls-policies.sql 設定安全政策';
END $$;

