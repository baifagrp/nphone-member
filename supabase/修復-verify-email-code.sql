-- =============================================
-- 修復 verify_email_code 函數
-- =============================================
-- 修復 NULL 檢查問題

CREATE OR REPLACE FUNCTION public.verify_email_code(
    p_email TEXT,
    p_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_verification_record RECORD;
    v_existing_member RECORD;
    v_result JSONB;
BEGIN
    -- 查找驗證碼記錄
    SELECT * INTO v_verification_record
    FROM public.email_verification_codes
    WHERE email = p_email
      AND code = p_code
      AND NOT is_used
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- 檢查驗證碼是否存在且有效
    IF NOT FOUND THEN
        RAISE EXCEPTION '驗證碼無效或已過期';
    END IF;
    
    -- 標記驗證碼為已使用
    UPDATE public.email_verification_codes
    SET is_used = TRUE,
        used_at = NOW()
    WHERE id = v_verification_record.id;
    
    -- 檢查是否有現有會員使用此 email
    SELECT * INTO v_existing_member
    FROM public.members
    WHERE email = p_email
      AND email NOT LIKE '%@nphone.temp'  -- 排除臨時 email
    LIMIT 1;
    
    -- 準備返回結果（使用 FOUND 檢查）
    IF FOUND AND v_existing_member.id IS NOT NULL THEN
        -- 找到現有會員
        v_result := jsonb_build_object(
            'success', true,
            'email_verified', true,
            'has_existing_member', true,
            'member_id', v_existing_member.id,
            'member_data', jsonb_build_object(
                'id', v_existing_member.id,
                'name', v_existing_member.name,
                'phone', v_existing_member.phone,
                'email', v_existing_member.email,
                'line_user_id', v_existing_member.line_user_id,
                'member_code', v_existing_member.member_code
            )
        );
    ELSE
        -- 沒有現有會員
        v_result := jsonb_build_object(
            'success', true,
            'email_verified', true,
            'has_existing_member', false,
            'email', p_email,
            'line_user_id', v_verification_record.line_user_id
        );
    END IF;
    
    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.verify_email_code IS '驗證 Email 驗證碼，並檢查是否有現有會員';

-- 顯示完成訊息
DO $$
BEGIN
    RAISE NOTICE '✅ verify_email_code 函數已修復';
END $$;

