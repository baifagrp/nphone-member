-- =============================================
-- 更新積分規則：移除註冊和生日獎勵
-- =============================================

-- 刪除註冊獎勵規則
DELETE FROM public.point_rules WHERE rule_type = 'signup_bonus';

-- 刪除生日獎勵規則
DELETE FROM public.point_rules WHERE rule_type = 'birthday_bonus';

-- 確保消費比率規則存在
INSERT INTO public.point_rules (rule_type, value, bonus_points, description, is_active)
VALUES 
    ('spend_rate', 10, 0, '每消費 10 元獲得 1 點', true)
ON CONFLICT (rule_type) DO UPDATE SET
    value = EXCLUDED.value,
    bonus_points = EXCLUDED.bonus_points,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active;

-- 完成訊息
DO $$ 
BEGIN
    RAISE NOTICE '✅ 積分規則已更新！';
    RAISE NOTICE '📋 已刪除：';
    RAISE NOTICE '   - 註冊會員獎勵';
    RAISE NOTICE '   - 生日當月獎勵';
    RAISE NOTICE '';
    RAISE NOTICE '📋 保留規則：';
    RAISE NOTICE '   - 每消費 10 元獲得 1 點';
END $$;

