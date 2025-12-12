-- =============================================
-- 添加儲值金作為付款方式
-- =============================================

-- 添加儲值金付款方式
INSERT INTO public.payment_methods (code, name, sort_order, is_active)
VALUES ('wallet', '儲值金', 5, true)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    is_active = EXCLUDED.is_active,
    sort_order = EXCLUDED.sort_order;

