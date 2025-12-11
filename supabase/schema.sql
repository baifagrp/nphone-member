-- =============================================
-- 會員管理系統 - 資料庫結構
-- =============================================

-- 啟用 UUID 擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 會員資料表
-- =============================================
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    line_user_id TEXT UNIQUE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    birthday DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 會員資料表索引
CREATE INDEX IF NOT EXISTS members_line_user_id_idx ON public.members(line_user_id);
CREATE INDEX IF NOT EXISTS members_phone_idx ON public.members(phone);
CREATE INDEX IF NOT EXISTS members_email_idx ON public.members(email);
CREATE INDEX IF NOT EXISTS members_created_at_idx ON public.members(created_at DESC);

-- 會員資料表註解
COMMENT ON TABLE public.members IS '會員基本資料表';
COMMENT ON COLUMN public.members.id IS '會員唯一識別碼';
COMMENT ON COLUMN public.members.line_user_id IS 'LINE 使用者 ID';
COMMENT ON COLUMN public.members.name IS '會員姓名';
COMMENT ON COLUMN public.members.phone IS '聯絡電話';
COMMENT ON COLUMN public.members.email IS 'Email 地址';
COMMENT ON COLUMN public.members.birthday IS '生日';
COMMENT ON COLUMN public.members.gender IS '性別';
COMMENT ON COLUMN public.members.avatar_url IS '頭像 URL（從 LINE 取得）';

-- =============================================
-- 管理員資料表
-- =============================================
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'staff')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 管理員資料表索引
CREATE INDEX IF NOT EXISTS admins_email_idx ON public.admins(email);
CREATE INDEX IF NOT EXISTS admins_role_idx ON public.admins(role);

-- 管理員資料表註解
COMMENT ON TABLE public.admins IS '管理員帳號表';
COMMENT ON COLUMN public.admins.id IS '管理員 ID（關聯 auth.users）';
COMMENT ON COLUMN public.admins.email IS '管理員 Email';
COMMENT ON COLUMN public.admins.role IS '角色（owner=店主, staff=員工）';

-- =============================================
-- 自動更新 updated_at 觸發器
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 為 members 表建立觸發器
DROP TRIGGER IF EXISTS set_updated_at ON public.members;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.members
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- 預留欄位給未來功能（第二、三階段）
-- =============================================

-- 預約系統表結構（暫不建立，第二階段使用）
-- CREATE TABLE IF NOT EXISTS public.bookings (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
--     service_name TEXT NOT NULL,
--     service_duration INTEGER, -- 分鐘
--     service_price DECIMAL(10, 2),
--     booking_date DATE NOT NULL,
--     booking_time TIME NOT NULL,
--     status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
--     notes TEXT,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
-- );

-- 儲值金表結構（暫不建立，第三階段使用）
-- CREATE TABLE IF NOT EXISTS public.wallets (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     member_id UUID UNIQUE REFERENCES public.members(id) ON DELETE CASCADE,
--     balance DECIMAL(10, 2) DEFAULT 0 NOT NULL CHECK (balance >= 0),
--     total_recharged DECIMAL(10, 2) DEFAULT 0 NOT NULL,
--     total_spent DECIMAL(10, 2) DEFAULT 0 NOT NULL,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
-- );

-- 點數表結構（暫不建立，第三階段使用）
-- CREATE TABLE IF NOT EXISTS public.points (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     member_id UUID UNIQUE REFERENCES public.members(id) ON DELETE CASCADE,
--     balance INTEGER DEFAULT 0 NOT NULL CHECK (balance >= 0),
--     total_earned INTEGER DEFAULT 0 NOT NULL,
--     total_spent INTEGER DEFAULT 0 NOT NULL,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
-- );

-- =============================================
-- 完成訊息
-- =============================================
DO $$ 
BEGIN
    RAISE NOTICE '✅ 資料庫結構建立完成！';
    RAISE NOTICE '📋 已建立表格：';
    RAISE NOTICE '   - members (會員資料)';
    RAISE NOTICE '   - admins (管理員)';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  下一步：執行 rls-policies.sql 設定安全政策';
END $$;

