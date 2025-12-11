-- =============================================
-- 檢查 create_booking 函數的實際定義
-- =============================================
-- 執行此查詢來確認資料庫中的函數簽名

SELECT 
    p.proname AS function_name,
    pg_get_function_arguments(p.oid) AS arguments,
    pg_get_function_result(p.oid) AS return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'create_booking'
ORDER BY p.oid;

-- 如果看到多個版本，請刪除舊版本：
-- DROP FUNCTION IF EXISTS public.create_booking(TEXT, UUID, DATE, TIME, UUID, TEXT) CASCADE;
-- DROP FUNCTION IF EXISTS public.create_booking(TEXT, UUID, DATE, TIME, UUID) CASCADE;

