# 📧 EmailJS 模板參數說明

## ❓ 常見疑問

### Q: 為什麼模板設置界面沒有顯示參數欄位？

**A:** 這是正常的！EmailJS 的模板參數**不需要在設置界面手動配置**。

---

## 🔍 參數工作原理

### 在模板 HTML 中使用參數

當您在 Email Template 的 HTML 內容中寫：

```html
<p>您好 {{to_name}}，</p>
<div class="code">{{verification_code}}</div>
<p>此驗證碼將在 {{expiry_minutes}} 分鐘後過期</p>
```

EmailJS 會**自動識別** `{{變數名稱}}` 格式的變數。

---

## 📤 參數傳遞方式

### 在 JavaScript 中傳遞參數

當您使用 `emailjs.send()` 發送郵件時傳入參數：

```javascript
const emailParams = {
    to_email: 'user@example.com',        // 👈 傳給 {{to_email}}
    to_name: 'NPHONE 會員',              // 👈 傳給 {{to_name}}
    verification_code: '123456',         // 👈 傳給 {{verification_code}}
    expiry_minutes: '10'                 // 👈 傳給 {{expiry_minutes}}
};

await emailjs.send(
    SERVICE_ID,
    TEMPLATE_ID,
    emailParams,  // 👈 這裡傳入參數
    PUBLIC_KEY
);
```

EmailJS 會自動將這些參數值替換到模板中對應的 `{{變數名稱}}` 位置。

---

## ✅ 正確的設置流程

### 步驟 1：創建模板

在 EmailJS Dashboard 創建模板時：

1. **只需要設置基本資訊：**
   - To Email: `{{to_email}}` ← 使用變數格式
   - From Name: `noreply` 或 `NPHONE`
   - Reply To: `your@email.com`

2. **在 HTML 內容中使用變數：**
   ```html
   {{to_name}}
   {{verification_code}}
   {{expiry_minutes}}
   ```

3. **不需要在任何設置面板中添加這些變數！**

### 步驟 2：測試模板

在 EmailJS Dashboard 測試時：

1. 點擊 "Test It"
2. 在右側測試面板：
   - **To Email** 欄位填入您的測試信箱
   - 點擊 **"Add new variable"** 添加：
     - `to_name` = `測試用戶`
     - `verification_code` = `123456`
     - `expiry_minutes` = `10`
3. 點擊 "Send Test Email"

### 步驟 3：系統使用

在實際系統中（`js/email-verification.js`）：

```javascript
// 系統會自動傳入所有需要的參數
const emailParams = {
    to_email: email,
    to_name: 'NPHONE 會員',
    verification_code: code,
    expiry_minutes: '10'
};

await emailjs.send(
    CONFIG.EMAILJS_SERVICE_ID,
    CONFIG.EMAILJS_TEMPLATE_ID,
    emailParams,
    CONFIG.EMAILJS_PUBLIC_KEY
);
```

---

## 🎯 我們的模板使用的參數

### 必須參數

| 參數名稱 | 說明 | 範例值 | 在模板中的位置 |
|---------|------|--------|---------------|
| `to_email` | 收件人 Email | `user@example.com` | To Email 欄位 |
| `to_name` | 收件人名稱 | `NPHONE 會員` | 郵件內容 |
| `verification_code` | 6位數驗證碼 | `123456` | 驗證碼區塊 |
| `expiry_minutes` | 過期分鐘數 | `10` | 提示文字 |

### 參數在模板中的使用

```html
<!DOCTYPE html>
<html>
<body>
    <div class="container">
        <div class="header">
            <h1>NPHONE 會員驗證</h1>
        </div>
        <div class="content">
            <!-- 使用 to_name 參數 -->
            <p>您好 {{to_name}}，</p>
            
            <p>感謝您註冊 NPHONE 會員！以下是您的 Email 驗證碼：</p>
            
            <!-- 使用 verification_code 參數 -->
            <div class="code-box">
                <div class="code">{{verification_code}}</div>
            </div>
            
            <!-- 使用 expiry_minutes 參數 -->
            <p><strong>重要提醒：</strong></p>
            <ul>
                <li>此驗證碼將在 {{expiry_minutes}} 分鐘後過期</li>
                <li>請勿將驗證碼分享給他人</li>
            </ul>
        </div>
    </div>
</body>
</html>
```

---

## 🔧 常見問題

### Q1: 我需要在 EmailJS 設置中預先定義所有參數嗎？

**A:** ❌ **不需要！** EmailJS 會自動識別模板中的 `{{變數}}` 格式。

### Q2: 如果我添加新的參數怎麼辦？

**A:** 只需要：
1. 在模板 HTML 中添加 `{{新參數名稱}}`
2. 在 JavaScript 發送時傳入對應的值

不需要在設置界面做任何修改！

### Q3: 測試時如何添加參數？

**A:** 在測試面板點擊 "Add new variable"，然後輸入：
- Variable name: 參數名稱（不需要 `{{}}`)
- Variable value: 測試值

### Q4: 參數名稱有什麼限制嗎？

**A:** 
- ✅ 只能使用字母、數字、底線
- ✅ 不能有空格或特殊符號
- ✅ 建議使用小寫 + 底線（snake_case）

---

## 📊 參數流程圖

```
使用者輸入 Email
     ↓
系統生成驗證碼 (123456)
     ↓
準備參數物件
{
  to_email: "user@example.com",
  to_name: "NPHONE 會員",
  verification_code: "123456",
  expiry_minutes: "10"
}
     ↓
呼叫 emailjs.send()
傳入參數物件
     ↓
EmailJS 處理
將參數值替換到模板
     ↓
最終郵件內容
"您好 NPHONE 會員，
 您的驗證碼：123456
 將在 10 分鐘後過期"
     ↓
發送給 user@example.com
```

---

## ✅ 總結

### 重要觀念

1. **模板中的 `{{變數}}` 不需要預先設置**
   - EmailJS 自動識別
   
2. **只需在發送郵件時傳入參數值**
   - 通過 JavaScript 物件傳遞

3. **測試時才需要手動添加變數**
   - 使用 "Add new variable" 按鈕
   - 實際使用時系統自動傳入

### 您只需要做的事

1. ✅ 在模板 HTML 中寫 `{{to_email}}`, `{{to_name}}` 等
2. ✅ 在 To Email 欄位寫 `{{to_email}}`
3. ✅ 儲存模板
4. ✅ 在程式碼中傳入參數值

**就這麼簡單！** 😊

---

## 🎓 延伸閱讀

- [EmailJS 官方文檔 - Template Parameters](https://www.emailjs.com/docs/user-guide/dynamic-variables-templates/)
- [EmailJS - How to Use Variables](https://www.emailjs.com/docs/tutorial/creating-email-template/)

---

**希望這樣更清楚了！** 如有任何疑問歡迎詢問！ 📧✨

