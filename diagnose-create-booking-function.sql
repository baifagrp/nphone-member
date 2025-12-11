-- =============================================
-- 診斷 create_booking 函數定義
-- =============================================

-- 1. 檢查所有 create_booking 函數的定義
SELECT 
    p.proname AS function_name,
    pg_catalog.pg_get_function_arguments(p.oid) AS arguments,
    pg_catalog.pg_get_function_result(p.oid) AS return_type,
    pg_get_functiondef(p.oid) AS function_definition
FROM
    pg_catalog.pg_proc p
LEFT JOIN
    pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE
    p.proname = 'create_booking'
    AND n.nspname = 'public'
ORDER BY
    arguments;

-- 2. 檢查函數參數的詳細資訊
SELECT 
    p.proname AS function_name,
    unnest(p.proargnames) AS parameter_name,
    pg_catalog.format_type(unnest(p.proargtypes), NULL) AS parameter_type,
    p.oid::regprocedure AS function_signature
FROM
    pg_catalog.pg_proc p
JOIN
    pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE
    p.proname = 'create_booking'
    AND n.nspname = 'public';

-- 3. 測試調用（只檢查參數綁定，不實際執行）
-- 這會告訴我們 PostgREST 如何解析參數
DO $$
BEGIN
    RAISE NOTICE '=== create_booking 函數診斷 ===';
    RAISE NOTICE '請檢查上面的函數定義，確認參數類型是否正確';
    RAISE NOTICE '特別是 p_service_option_id 應該是 TEXT 類型（可選）';
END $$;

