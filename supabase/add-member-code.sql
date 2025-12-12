-- =============================================
-- 添加會員編號欄位
-- =============================================

-- 添加會員編號欄位
ALTER TABLE public.members 
ADD COLUMN IF NOT EXISTS member_code TEXT UNIQUE;

-- 建立會員編號索引
CREATE INDEX IF NOT EXISTS members_member_code_idx ON public.members(member_code);

-- 添加註解
COMMENT ON COLUMN public.members.member_code IS '會員編號（由管理員輸入，用於顯示條碼）';

-- 完成訊息
DO $$ 
BEGIN
    RAISE NOTICE '✅ 會員編號欄位已添加！';
    RAISE NOTICE '📋 管理員可以在後台輸入會員編號';
    RAISE NOTICE '📋 會員編號會顯示在會員首頁的條碼中';
END $$;

