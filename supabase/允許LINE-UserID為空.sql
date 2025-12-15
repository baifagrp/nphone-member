-- =============================================
-- 修改 members 表：允許 line_user_id 為 NULL
-- =============================================
-- 這樣可以支援純 Email 用戶（網頁註冊）

-- 1. 移除 line_user_id 的 NOT NULL 約束
ALTER TABLE public.members 
ALTER COLUMN line_user_id DROP NOT NULL;

-- 2. 確認 Email 唯一索引存在
CREATE UNIQUE INDEX IF NOT EXISTS members_email_unique_idx 
ON public.members(email);

-- 3. 為 line_user_id 建立唯一索引（但允許 NULL）
-- 注意：PostgreSQL 中，唯一索引允許多個 NULL 值
CREATE UNIQUE INDEX IF NOT EXISTS members_line_user_id_unique_idx 
ON public.members(line_user_id) 
WHERE line_user_id IS NOT NULL;

-- 4. 確認修改成功
DO $$ 
BEGIN
    RAISE NOTICE '✅ members 表結構已更新：';
    RAISE NOTICE '   - line_user_id 允許 NULL';
    RAISE NOTICE '   - email 具有唯一索引';
    RAISE NOTICE '   - line_user_id 具有唯一索引（排除 NULL）';
END $$;

