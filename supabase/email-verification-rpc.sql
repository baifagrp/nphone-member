-- ================================================================
-- Email 驗證 RPC 函數
-- ================================================================

-- 1. 生成驗證碼函數
CREATE OR REPLACE FUNCTION public.generate_verification_code(
    p_email TEXT,
    p_line_user_id TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_code TEXT;
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- 驗證 email 格式
    IF p_email IS NULL OR p_email = '' THEN
        RAISE EXCEPTION 'Email 不能為空';
    END IF;
    
    IF p_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RAISE EXCEPTION 'Email 格式不正確';
    END IF;
    
    -- 檢查該 email 是否在短時間內已經發送過驗證碼（防止濫用）
    IF EXISTS (
        SELECT 1 FROM public.email_verification_codes
        WHERE email = p_email
          AND created_at > NOW() - INTERVAL '1 minute'
          AND NOT is_used
    ) THEN
        RAISE EXCEPTION '驗證碼發送太頻繁，請稍後再試';
    END IF;
    
    -- 生成 6 位數驗證碼
    v_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- 設定過期時間（10 分鐘）
    v_expires_at := NOW() + INTERVAL '10 minutes';
    
    -- 插入驗證碼記錄
    INSERT INTO public.email_verification_codes (
        email,
        code,
        line_user_id,
        expires_at
    ) VALUES (
        p_email,
        v_code,
        p_line_user_id,
        v_expires_at
    );
    
    -- 返回驗證碼（前端會用這個碼透過 EmailJS 發送）
    RETURN v_code;
END;
$$;

COMMENT ON FUNCTION public.generate_verification_code IS '生成 Email 驗證碼（10分鐘有效）';

-- 2. 驗證驗證碼函數
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
    LIMIT 1;
    
    -- 準備返回結果
    IF v_existing_member.id IS NOT NULL THEN
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

-- 3. 完成註冊（綁定 LINE User ID 到現有會員或創建新會員）
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
    
    -- 查找現有會員
    SELECT * INTO v_existing_member
    FROM public.members
    WHERE email = p_email
    LIMIT 1;
    
    IF v_existing_member.id IS NOT NULL THEN
        -- 找到現有會員，更新 LINE 綁定資訊
        UPDATE public.members
        SET 
            line_user_id = p_line_user_id,
            line_display_name = COALESCE(p_line_display_name, line_display_name),
            line_picture_url = COALESCE(p_line_picture_url, line_picture_url),
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
                'member_code', v_new_member.member_code
            )
        );
    ELSE
        -- 沒有現有會員，創建新會員
        INSERT INTO public.members (
            name,
            email,
            line_user_id,
            line_display_name,
            line_picture_url,
            email_verified,
            registration_status
        ) VALUES (
            COALESCE(p_line_display_name, 'LINE 用戶'),
            p_email,
            p_line_user_id,
            p_line_display_name,
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
                'member_code', v_new_member.member_code
            )
        );
    END IF;
    
    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.complete_registration IS '完成註冊：綁定 LINE 到現有會員或創建新會員';

-- 4. 檢查 Email 是否已被使用
CREATE OR REPLACE FUNCTION public.check_email_exists(
    p_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_member RECORD;
    v_result JSONB;
BEGIN
    SELECT * INTO v_member
    FROM public.members
    WHERE email = p_email
    LIMIT 1;
    
    IF v_member.id IS NOT NULL THEN
        v_result := jsonb_build_object(
            'exists', true,
            'has_line_binding', (v_member.line_user_id IS NOT NULL AND v_member.line_user_id != ''),
            'member_name', v_member.name
        );
    ELSE
        v_result := jsonb_build_object(
            'exists', false,
            'has_line_binding', false
        );
    END IF;
    
    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.check_email_exists IS '檢查 Email 是否已存在於系統中';

-- 顯示完成訊息
DO $$
BEGIN
    RAISE NOTICE '✅ Email 驗證 RPC 函數建立完成';
    RAISE NOTICE '📝 可用函數：';
    RAISE NOTICE '  - generate_verification_code(email, line_user_id)';
    RAISE NOTICE '  - verify_email_code(email, code)';
    RAISE NOTICE '  - complete_registration(email, line_user_id, ...)';
    RAISE NOTICE '  - check_email_exists(email)';
END $$;
