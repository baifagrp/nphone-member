-- ================================================================
-- Email 驗證系統 Schema
-- ================================================================

-- 1. 先處理現有會員的 email 欄位
-- 為沒有 email 的會員設定臨時 email（使用 LINE User ID 或 UUID）
UPDATE public.members
SET email = COALESCE(
    email,
    CASE 
        WHEN line_user_id IS NOT NULL THEN 'temp_' || line_user_id || '@nphone.temp'
        ELSE 'temp_' || id::TEXT || '@nphone.temp'
    END
)
WHERE email IS NULL OR email = '';

-- 2. 修改 members 表，確保 email 必填且唯一
DO $$
BEGIN
    -- 先檢查 email 列是否允許 NULL
    DECLARE
        v_is_nullable TEXT;
    BEGIN
        SELECT is_nullable INTO v_is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'members'
          AND column_name = 'email';
        
        IF v_is_nullable = 'YES' THEN
            ALTER TABLE public.members 
            ALTER COLUMN email SET NOT NULL;
            RAISE NOTICE '✅ email 欄位已設為 NOT NULL';
        END IF;
    END;
END $$;

-- 為 email 建立唯一索引（如果還沒有）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'members' 
        AND indexname = 'members_email_key'
    ) THEN
        CREATE UNIQUE INDEX members_email_key ON public.members(email);
        RAISE NOTICE '✅ email 唯一索引已建立';
    END IF;
END $$;

-- 3. 新增 email_verified 欄位到 members 表
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'members' 
        AND column_name = 'email_verified'
    ) THEN
        ALTER TABLE public.members
        ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
        
        COMMENT ON COLUMN public.members.email_verified IS 'Email 是否已驗證';
    END IF;
END $$;

-- 4. 新增 registration_status 欄位
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'members' 
        AND column_name = 'registration_status'
    ) THEN
        ALTER TABLE public.members
        ADD COLUMN registration_status TEXT DEFAULT 'pending';
        
        COMMENT ON COLUMN public.members.registration_status IS '註冊狀態：pending(待驗證)、verified(已驗證)、completed(已完成)';
    END IF;
END $$;

-- 5. 建立 email_verification_codes 表（儲存驗證碼）
CREATE TABLE IF NOT EXISTS public.email_verification_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    line_user_id TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT email_verification_codes_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- 建立索引以加速查詢
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_email ON public.email_verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_code ON public.email_verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_expires ON public.email_verification_codes(expires_at);

COMMENT ON TABLE public.email_verification_codes IS 'Email 驗證碼記錄表';
COMMENT ON COLUMN public.email_verification_codes.email IS '待驗證的 Email';
COMMENT ON COLUMN public.email_verification_codes.code IS '6位數驗證碼';
COMMENT ON COLUMN public.email_verification_codes.line_user_id IS 'LINE User ID（用於註冊流程）';
COMMENT ON COLUMN public.email_verification_codes.expires_at IS '驗證碼過期時間（10分鐘）';
COMMENT ON COLUMN public.email_verification_codes.is_used IS '是否已使用';

-- 7. 建立自動清理過期驗證碼的函數
CREATE OR REPLACE FUNCTION public.cleanup_expired_verification_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.email_verification_codes
    WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$;

COMMENT ON FUNCTION public.cleanup_expired_verification_codes IS '清理過期的驗證碼（超過1天）';

-- 6. 更新現有會員的 email_verified 狀態
-- 只有非臨時 email 的會員才標記為已驗證
UPDATE public.members
SET email_verified = TRUE,
    registration_status = 'completed'
WHERE email IS NOT NULL 
  AND email != ''
  AND email NOT LIKE '%@nphone.temp'
  AND (email_verified IS NULL OR email_verified = FALSE);

-- 臨時 email 的會員標記為待驗證
UPDATE public.members
SET email_verified = FALSE,
    registration_status = 'pending'
WHERE email LIKE '%@nphone.temp';

-- 8. 建立觸發器：自動清理舊驗證碼（可選）
-- 每次插入新驗證碼時，清理該 email 的舊驗證碼
CREATE OR REPLACE FUNCTION public.cleanup_old_verification_codes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- 刪除同一個 email 的舊驗證碼
    DELETE FROM public.email_verification_codes
    WHERE email = NEW.email
      AND id != NEW.id;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_cleanup_old_codes ON public.email_verification_codes;
CREATE TRIGGER trigger_cleanup_old_codes
    AFTER INSERT ON public.email_verification_codes
    FOR EACH ROW
    EXECUTE FUNCTION public.cleanup_old_verification_codes();

-- 9. 啟用 RLS
ALTER TABLE public.email_verification_codes ENABLE ROW LEVEL SECURITY;

-- RLS 政策：任何人都可以創建驗證碼（用於註冊）
DROP POLICY IF EXISTS "Anyone can create verification codes" ON public.email_verification_codes;
CREATE POLICY "Anyone can create verification codes"
    ON public.email_verification_codes
    FOR INSERT
    TO public
    WITH CHECK (true);

-- RLS 政策：管理員可以查看所有驗證碼
DROP POLICY IF EXISTS "Admins can view all verification codes" ON public.email_verification_codes;
CREATE POLICY "Admins can view all verification codes"
    ON public.email_verification_codes
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE admins.id = auth.uid()
        )
    );

-- 10. 顯示完成訊息
DO $$
BEGIN
    RAISE NOTICE '✅ Email 驗證系統 Schema 建立完成';
    RAISE NOTICE '📧 members.email 現在是必填欄位';
    RAISE NOTICE '🔐 email_verification_codes 表已建立';
    RAISE NOTICE '✨ 自動清理機制已啟用';
END $$;
