-- ================================================================
-- 修正 LINE Login 會員創建流程
-- ================================================================
-- 解決 email NOT NULL 約束導致 LINE Login 失敗的問題
-- ================================================================

-- 更新 upsert_member_from_line 函數
CREATE OR REPLACE FUNCTION public.upsert_member_from_line(
    p_line_user_id TEXT,
    p_name TEXT,
    p_avatar_url TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL
)
RETURNS public.members AS $$
DECLARE
    v_member public.members;
    v_temp_email TEXT;
BEGIN
    -- 如果沒有提供 email，生成臨時 email
    IF p_email IS NULL OR p_email = '' THEN
        v_temp_email := 'temp_' || p_line_user_id || '@nphone.temp';
    ELSE
        v_temp_email := p_email;
    END IF;
    
    -- 嘗試更新現有會員
    UPDATE public.members
    SET 
        name = p_name,
        avatar_url = COALESCE(p_avatar_url, avatar_url),
        -- 只更新 email 如果提供了真實的 email（不是臨時的）
        email = CASE 
            WHEN p_email IS NOT NULL AND p_email != '' THEN p_email
            ELSE email
        END,
        updated_at = NOW()
    WHERE line_user_id = p_line_user_id
    RETURNING * INTO v_member;
    
    -- 如果不存在，則新增
    IF NOT FOUND THEN
        INSERT INTO public.members (
            line_user_id, 
            name, 
            avatar_url, 
            email,
            email_verified,
            registration_status
        )
        VALUES (
            p_line_user_id, 
            p_name, 
            p_avatar_url, 
            v_temp_email,
            FALSE,  -- Email 未驗證
            'pending'  -- 待驗證狀態
        )
        RETURNING * INTO v_member;
    END IF;
    
    RETURN v_member;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 顯示完成訊息
DO $$
BEGIN
    RAISE NOTICE '✅ LINE Login 會員創建函數已更新';
    RAISE NOTICE '📧 現在會自動為新會員生成臨時 email';
    RAISE NOTICE '🔐 格式：temp_<LINE_USER_ID>@nphone.temp';
    RAISE NOTICE '✨ 會員完成 Email 驗證後會更新為真實 email';
END $$;

