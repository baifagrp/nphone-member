-- =============================================
-- 會員資料更新 RPC 函數（透過 Member ID）
-- =============================================
-- 此函數用於純 Email 註冊的會員更新自己的資料
-- 透過 member.id 進行驗證和更新

CREATE OR REPLACE FUNCTION public.update_member_profile_by_id(
    p_member_id UUID,
    p_name TEXT,
    p_phone TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_birthday DATE DEFAULT NULL,
    p_gender TEXT DEFAULT NULL
)
RETURNS public.members
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_member public.members;
BEGIN
    -- 驗證欄位
    IF p_name IS NULL OR LENGTH(TRIM(p_name)) < 2 THEN
        RAISE EXCEPTION '姓名至少需要 2 個字元';
    END IF;
    
    IF p_phone IS NOT NULL AND NOT p_phone ~ '^09\d{8}$' THEN
        RAISE EXCEPTION '電話號碼格式錯誤，應為 09 開頭的 10 位數字';
    END IF;
    
    IF p_email IS NOT NULL AND p_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN
        RAISE EXCEPTION 'Email 格式錯誤';
    END IF;
    
    IF p_gender IS NOT NULL AND p_gender NOT IN ('male', 'female', 'other', 'prefer_not_to_say') THEN
        RAISE EXCEPTION '性別值無效';
    END IF;
    
    -- 查找會員
    SELECT * INTO v_member
    FROM public.members
    WHERE id = p_member_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION '找不到對應的會員資料';
    END IF;
    
    -- 檢查 Email 是否已被其他會員使用（如果變更了 Email）
    IF p_email IS NOT NULL AND p_email != COALESCE(v_member.email, '') THEN
        IF EXISTS (
            SELECT 1 FROM public.members
            WHERE email = p_email
              AND id != p_member_id
              AND email NOT LIKE '%@nphone.temp'
        ) THEN
            RAISE EXCEPTION '此 Email 已被其他會員使用';
        END IF;
    END IF;
    
    -- 更新資料
    UPDATE public.members
    SET 
        name = p_name,
        phone = NULLIF(TRIM(p_phone), ''),
        email = NULLIF(TRIM(p_email), ''),
        birthday = p_birthday,
        gender = p_gender,
        updated_at = NOW()
    WHERE id = p_member_id
    RETURNING * INTO v_member;
    
    RETURN v_member;
END;
$$;

-- 註解
COMMENT ON FUNCTION public.update_member_profile_by_id IS '會員端更新個人資料函數（透過 Member ID），用於純 Email 註冊的會員';

-- 顯示完成訊息
DO $$
BEGIN
    RAISE NOTICE '✅ update_member_profile_by_id 函數建立完成';
END $$;

