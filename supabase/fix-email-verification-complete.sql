-- ================================================================
-- 修正 Email 驗證完成流程
-- ================================================================
-- 解決 complete_registration 函數引用不存在欄位的問題
-- ================================================================

-- 更新 complete_registration 函數
CREATE OR REPLACE FUNCTION public.complete_registration(
    p_email TEXT,
    p_line_user_id TEXT,
    p_line_display_name TEXT DEFAULT NULL,
    p_line_picture_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_existing_member RECORD;
    v_new_member RECORD;
    v_email_owner RECORD;
    v_result JSONB;
BEGIN
    -- 驗證參數
    IF p_email IS NULL OR p_line_user_id IS NULL THEN
        RAISE EXCEPTION 'Email 和 LINE User ID 不能為空';
    END IF;
    
    -- 檢查 email 是否已驗證（必須先通過驗證碼驗證）
    IF NOT EXISTS (
        SELECT 1 FROM public.email_verification_codes
        WHERE email = p_email
          AND line_user_id = p_line_user_id
          AND is_used = TRUE
    ) THEN
        RAISE EXCEPTION 'Email 尚未驗證，請先完成驗證';
    END IF;
    
    -- ⭐ 檢查此 email 是否已被其他會員使用
    SELECT * INTO v_email_owner
    FROM public.members
    WHERE email = p_email
      AND email NOT LIKE '%@nphone.temp'  -- 排除臨時 email
      AND line_user_id != p_line_user_id  -- 排除自己
    LIMIT 1;
    
    IF v_email_owner.id IS NOT NULL THEN
        RAISE EXCEPTION '此 Email 已被其他會員使用，請使用其他 Email';
    END IF;
    
    -- ⭐ 關鍵修正：先查找使用此 LINE User ID 的會員（可能有臨時 email）
    SELECT * INTO v_existing_member
    FROM public.members
    WHERE line_user_id = p_line_user_id
    LIMIT 1;
    
    IF v_existing_member.id IS NOT NULL THEN
        -- 找到 LINE User ID 對應的會員，更新其 email
        -- 這個會員可能是剛才 LINE Login 時創建的（使用臨時 email）
        UPDATE public.members
        SET 
            email = p_email,  -- ⭐ 更新為真實 email
            name = COALESCE(p_line_display_name, name),
            avatar_url = COALESCE(p_line_picture_url, avatar_url),
            email_verified = TRUE,
            registration_status = 'completed',
            updated_at = NOW()
        WHERE id = v_existing_member.id
        RETURNING * INTO v_new_member;
        
        v_result := jsonb_build_object(
            'success', true,
            'is_new_member', false,
            'message', '已綁定到現有會員帳號',
            'member', jsonb_build_object(
                'id', v_new_member.id,
                'name', v_new_member.name,
                'email', v_new_member.email,
                'phone', v_new_member.phone,
                'line_user_id', v_new_member.line_user_id,
                'member_code', v_new_member.member_code,
                'avatar_url', v_new_member.avatar_url,
                'email_verified', v_new_member.email_verified,
                'registration_status', v_new_member.registration_status
            )
        );
    ELSE
        -- 沒有現有會員，創建新會員
        INSERT INTO public.members (
            name,
            email,
            line_user_id,
            avatar_url,
            email_verified,
            registration_status
        ) VALUES (
            COALESCE(p_line_display_name, 'LINE 用戶'),
            p_email,
            p_line_user_id,
            p_line_picture_url,
            TRUE,
            'completed'
        )
        RETURNING * INTO v_new_member;
        
        v_result := jsonb_build_object(
            'success', true,
            'is_new_member', true,
            'message', '新會員註冊成功',
            'member', jsonb_build_object(
                'id', v_new_member.id,
                'name', v_new_member.name,
                'email', v_new_member.email,
                'phone', v_new_member.phone,
                'line_user_id', v_new_member.line_user_id,
                'member_code', v_new_member.member_code,
                'avatar_url', v_new_member.avatar_url,
                'email_verified', v_new_member.email_verified,
                'registration_status', v_new_member.registration_status
            )
        );
    END IF;
    
    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.complete_registration IS '完成會員註冊（Email 驗證後綁定 LINE 或創建新會員）';

-- 顯示完成訊息
DO $$
BEGIN
    RAISE NOTICE '✅ complete_registration 函數已更新';
    RAISE NOTICE '📧 現在使用正確的欄位：name, avatar_url';
    RAISE NOTICE '🔗 LINE 資訊會正確綁定到會員帳號';
END $$;

