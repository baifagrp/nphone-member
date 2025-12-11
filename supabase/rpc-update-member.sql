-- =============================================
-- 會員資料更新 RPC 函數
-- =============================================
-- 此函數用於會員端更新自己的資料，會驗證 line_user_id

CREATE OR REPLACE FUNCTION public.update_member_profile(
    p_line_user_id TEXT,
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
    WHERE line_user_id = p_line_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION '找不到對應的會員資料';
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
    WHERE line_user_id = p_line_user_id
    RETURNING * INTO v_member;
    
    RETURN v_member;
END;
$$;

-- 註解
COMMENT ON FUNCTION public.update_member_profile IS '會員端更新個人資料函數，會驗證 line_user_id';

