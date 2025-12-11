-- =============================================
-- 強制刷新 create_booking 函數
-- =============================================
-- 如果函數更新後仍然出現錯誤，執行此腳本強制刷新

-- 1. 刪除所有版本的函數
DROP FUNCTION IF EXISTS public.create_booking CASCADE;

-- 2. 通知 PostgreSQL 重新載入函數定義
NOTIFY pgrst, 'reload schema';

-- 3. 如果上面的 NOTIFY 不起作用，可以嘗試重新創建函數
-- （執行完整的 booking-rls-policies.sql）

