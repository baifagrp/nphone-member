-- =============================================
-- 會員管理系統 - Row Level Security 政策
-- =============================================

-- =============================================
-- 啟用 RLS
-- =============================================
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Members 表的 RLS 政策
-- =============================================

-- 政策 1: 允許任何人查看會員資料（用於 LINE Login 檢查）
-- 注意：在生產環境中可能需要更嚴格的控制
CREATE POLICY "Anyone can view members for LINE login"
    ON public.members
    FOR SELECT
    USING (true);

-- 政策 2: 允許任何人新增會員（LINE Login 註冊時）
CREATE POLICY "Anyone can insert members for registration"
    ON public.members
    FOR INSERT
    WITH CHECK (true);

-- 政策 3: 會員只能更新自己的資料
-- 使用 line_user_id 進行身份驗證
CREATE POLICY "Members can update own data"
    ON public.members
    FOR UPDATE
    USING (
        line_user_id = current_setting('app.current_line_user_id', true)
    );

-- 政策 4: 管理員可以查看所有會員
CREATE POLICY "Admins can view all members"
    ON public.members
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE admins.id = auth.uid()
        )
    );

-- 政策 5: 管理員可以新增會員
CREATE POLICY "Admins can insert members"
    ON public.members
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE admins.id = auth.uid()
        )
    );

-- 政策 6: 管理員可以更新所有會員資料
CREATE POLICY "Admins can update all members"
    ON public.members
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE admins.id = auth.uid()
        )
    );

-- 政策 7: 管理員可以刪除會員（謹慎使用）
CREATE POLICY "Admins can delete members"
    ON public.members
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE admins.id = auth.uid()
        )
    );

-- =============================================
-- Admins 表的 RLS 政策
-- =============================================

-- 政策 1: 管理員可以查看所有管理員
CREATE POLICY "Admins can view all admins"
    ON public.admins
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE admins.id = auth.uid()
        )
    );

-- 政策 2: 只有 owner 可以新增管理員
CREATE POLICY "Only owners can insert admins"
    ON public.admins
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE admins.id = auth.uid() AND admins.role = 'owner'
        )
    );

-- 政策 3: 只有 owner 可以更新管理員
CREATE POLICY "Only owners can update admins"
    ON public.admins
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE admins.id = auth.uid() AND admins.role = 'owner'
        )
    );

-- 政策 4: 只有 owner 可以刪除管理員
CREATE POLICY "Only owners can delete admins"
    ON public.admins
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE admins.id = auth.uid() AND admins.role = 'owner'
        )
    );

-- =============================================
-- 輔助函數：檢查是否為管理員
-- =============================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admins
        WHERE admins.id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 輔助函數：檢查是否為 owner
-- =============================================
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admins
        WHERE admins.id = auth.uid() AND admins.role = 'owner'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 輔助函數：取得會員資料（透過 LINE User ID）
-- =============================================
CREATE OR REPLACE FUNCTION public.get_member_by_line_id(line_id TEXT)
RETURNS SETOF public.members AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.members
    WHERE line_user_id = line_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 輔助函數：建立或更新會員（LINE Login 使用）
-- =============================================
CREATE OR REPLACE FUNCTION public.upsert_member_from_line(
    p_line_user_id TEXT,
    p_name TEXT,
    p_avatar_url TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL
)
RETURNS public.members AS $$
DECLARE
    v_member public.members;
BEGIN
    -- 嘗試更新現有會員
    UPDATE public.members
    SET 
        name = p_name,
        avatar_url = COALESCE(p_avatar_url, avatar_url),
        email = COALESCE(p_email, email),
        updated_at = NOW()
    WHERE line_user_id = p_line_user_id
    RETURNING * INTO v_member;
    
    -- 如果不存在，則新增
    IF NOT FOUND THEN
        INSERT INTO public.members (line_user_id, name, avatar_url, email)
        VALUES (p_line_user_id, p_name, p_avatar_url, p_email)
        RETURNING * INTO v_member;
    END IF;
    
    RETURN v_member;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 完成訊息
-- =============================================
DO $$ 
BEGIN
    RAISE NOTICE '✅ RLS 政策設定完成！';
    RAISE NOTICE '🔒 已啟用 Row Level Security';
    RAISE NOTICE '📋 已建立政策：';
    RAISE NOTICE '   - Members: 7 條政策（會員自我管理 + 管理員完整權限）';
    RAISE NOTICE '   - Admins: 4 條政策（owner 完整控制）';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 已建立輔助函數：';
    RAISE NOTICE '   - is_admin()';
    RAISE NOTICE '   - is_owner()';
    RAISE NOTICE '   - get_member_by_line_id()';
    RAISE NOTICE '   - upsert_member_from_line()';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  下一步：建立管理員帳號';
END $$;

