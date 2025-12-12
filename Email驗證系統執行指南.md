# 📧 Email 驗證系統執行指南

## ✅ 修正完成

所有 SQL 錯誤已修正，現在可以順利執行！

---

## 🚀 執行步驟

### 步驟 1：打開 Supabase Dashboard

1. 登入 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇您的專案
3. 點擊左側選單的 **"SQL Editor"**

---

### 步驟 2：執行 Schema 檔案

1. 點擊 **"+ New Query"** 創建新查詢
2. 打開 `supabase/email-verification-schema.sql` 檔案
3. **複製完整內容** 貼到 SQL Editor
4. 點擊 **"Run"** 或按 `Ctrl+Enter` 執行

**預期結果：**
```
✅ email 欄位已設為 NOT NULL
✅ email 唯一索引已建立
✅ Email 驗證系統 Schema 建立完成
📧 members.email 現在是必填欄位
🔐 email_verification_codes 表已建立
✨ 自動清理機制已啟用
```

---

### 步驟 3：執行 RPC 函數檔案

1. 再次點擊 **"+ New Query"** 創建新查詢
2. 打開 `supabase/email-verification-rpc.sql` 檔案
3. **複製完整內容** 貼到 SQL Editor
4. 點擊 **"Run"** 執行

**預期結果：**
```
✅ Email 驗證 RPC 函數建立完成
📝 可用函數：
  - generate_verification_code(email, line_user_id)
  - verify_email_code(email, code)
  - complete_registration(email, line_user_id, ...)
  - check_email_exists(email)
```

---

## 🔍 驗證執行結果

### 檢查 1：確認新表已建立

在 Supabase SQL Editor 執行：

```sql
-- 檢查 email_verification_codes 表
SELECT * FROM public.email_verification_codes LIMIT 1;
```

應該不會出錯（即使沒有資料）。

---

### 檢查 2：確認 members 表欄位

```sql
-- 檢查 members 表的新欄位
SELECT 
    email, 
    email_verified, 
    registration_status 
FROM public.members 
LIMIT 5;
```

應該看到三個欄位都存在。

---

### 檢查 3：確認 RPC 函數

```sql
-- 列出所有 public schema 的函數
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%verification%'
  OR routine_name LIKE '%registration%';
```

應該看到以下函數：
- `generate_verification_code`
- `verify_email_code`
- `complete_registration`
- `check_email_exists`
- `cleanup_expired_verification_codes`
- `cleanup_old_verification_codes`

---

## 🧪 測試驗證功能

### 測試 1：生成驗證碼

```sql
-- 測試生成驗證碼
SELECT public.generate_verification_code(
    'test@example.com',
    'U1234567890abcdef'
);
```

應該返回一個 6 位數字驗證碼。

---

### 測試 2：檢查驗證碼記錄

```sql
-- 查看剛才生成的驗證碼
SELECT 
    email,
    code,
    expires_at,
    is_used
FROM public.email_verification_codes
WHERE email = 'test@example.com'
ORDER BY created_at DESC
LIMIT 1;
```

應該看到剛才生成的驗證碼，且 `is_used = false`。

---

### 測試 3：驗證 Email

```sql
-- 使用正確的驗證碼進行驗證（替換為實際的驗證碼）
SELECT public.verify_email_code(
    'test@example.com',
    '123456'  -- 替換為實際生成的驗證碼
);
```

如果驗證碼正確且未過期，應該返回成功訊息。

---

## 🔧 如果遇到錯誤

### 錯誤：email 欄位有 NULL 值

**解決方案：**
```sql
-- 手動為 NULL email 設定臨時值
UPDATE public.members
SET email = 'temp_' || id::TEXT || '@nphone.temp'
WHERE email IS NULL OR email = '';
```

---

### 錯誤：email 欄位不唯一

**解決方案：**
```sql
-- 找出重複的 email
SELECT email, COUNT(*) 
FROM public.members 
GROUP BY email 
HAVING COUNT(*) > 1;

-- 為重複的 email 添加序號
WITH duplicates AS (
    SELECT id, email, ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at) as rn
    FROM public.members
)
UPDATE public.members m
SET email = d.email || '_' || d.rn
FROM duplicates d
WHERE m.id = d.id AND d.rn > 1;
```

---

### 錯誤：admins 表不存在

如果您的系統還沒有 `admins` 表，可以暫時修改 RLS 政策：

```sql
-- 暫時允許所有認證用戶查看驗證碼（僅測試用）
DROP POLICY IF EXISTS "Admins can view all verification codes" ON public.email_verification_codes;
CREATE POLICY "Admins can view all verification codes"
    ON public.email_verification_codes
    FOR SELECT
    TO authenticated
    USING (true);
```

---

## 📋 執行檢查清單

執行完成後，確認以下項目：

- [ ] `email_verification_codes` 表已建立
- [ ] `members.email` 欄位已設為 NOT NULL
- [ ] `members.email_verified` 欄位已建立
- [ ] `members.registration_status` 欄位已建立
- [ ] 所有現有會員都有 email 值（即使是臨時的）
- [ ] RPC 函數 `generate_verification_code` 可執行
- [ ] RPC 函數 `verify_email_code` 可執行
- [ ] RPC 函數 `complete_registration` 可執行
- [ ] RPC 函數 `check_email_exists` 可執行

---

## 🎯 下一步

執行成功後，您可以：

1. ✅ 繼續設置 EmailJS（參考 `EmailJS設置說明.md`）
2. ✅ 測試前端驗證頁面（`member/email-verification.html`）
3. ✅ 更新 LINE Login 流程以導向驗證頁面

---

## 🆘 需要幫助？

如果遇到其他錯誤，請提供：
1. 完整的錯誤訊息
2. 您執行的 SQL 語句
3. 當前的資料庫狀態

我會協助您解決！😊

