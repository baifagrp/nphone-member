# 📧 EmailJS 設置說明

## 概述

本系統使用 EmailJS 服務來發送 Email 驗證碼。EmailJS 是一個免費的郵件發送服務，無需後端即可發送郵件。

---

## 🚀 設置步驟

### 步驟 1：註冊 EmailJS 帳號

1. 前往 [EmailJS 官網](https://www.emailjs.com/)
2. 點擊 "Sign Up" 註冊帳號
3. 使用 Email 或 Google 帳號註冊
4. 驗證您的 Email

---

### 步驟 2：創建 Email 服務 (Service)

1. 登入 EmailJS Dashboard
2. 點擊左側 "Email Services"
3. 點擊 "Add New Service"
4. 選擇郵件服務商（推薦選項）：
   - **Gmail** - 適合個人使用
   - **Outlook** - 適合商業使用
   - **SendGrid** - 適合大量發送
5. 填寫服務資訊：
   - Service Name: `NPHONE_Verification`
   - 連接您的郵箱帳號
6. 複製 **Service ID**（例如：`service_abc123`）

---

### 步驟 3：創建 Email 模板 (Template)

1. 點擊左側 "Email Templates"
2. 點擊 "Create New Template"
3. 填寫模板資訊：

#### 模板設置：

**Template Name:** `verification_code`

**Subject:**
```
[NPHONE] 您的驗證碼
```

**Content (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            padding: 20px;
            background: linear-gradient(135deg, #C8A48A 0%, #A67B5B 100%);
            color: white;
            border-radius: 10px 10px 0 0;
        }
        .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
        }
        .code-box {
            background: white;
            border: 2px solid #C8A48A;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
        }
        .code {
            font-size: 32px;
            font-weight: bold;
            color: #C8A48A;
            letter-spacing: 8px;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>NPHONE 會員驗證</h1>
        </div>
        <div class="content">
            <p>您好 {{to_name}}，</p>
            
            <p>感謝您註冊 NPHONE 會員！以下是您的 Email 驗證碼：</p>
            
            <div class="code-box">
                <div class="code">{{verification_code}}</div>
            </div>
            
            <p><strong>重要提醒：</strong></p>
            <ul>
                <li>此驗證碼將在 {{expiry_minutes}} 分鐘後過期</li>
                <li>請勿將驗證碼分享給他人</li>
                <li>如果您沒有申請此驗證碼，請忽略此郵件</li>
            </ul>
            
            <p>如有任何問題，歡迎聯繫我們的客服團隊。</p>
            
            <p>祝您使用愉快！<br>
            NPHONE 團隊</p>
        </div>
        <div class="footer">
            <p>此郵件由系統自動發送，請勿直接回覆</p>
        </div>
    </div>
</body>
</html>
```

4. **重要：** 模板中的參數（`{{to_email}}`, `{{to_name}}`, `{{verification_code}}`, `{{expiry_minutes}}`）**不需要手動設置**
   
   這些參數會在發送郵件時自動傳入，EmailJS 會自動識別模板中的 `{{變數名稱}}`

5. 點擊 "Save" 儲存模板
6. 複製 **Template ID**（例如：`template_xyz789`）

---

### 步驟 4：獲取 Public Key

1. 點擊左側 "Account"
2. 在 "API Keys" 部分找到 **Public Key**
3. 複製 Public Key（例如：`your_public_key_here`）

---

### 步驟 5：配置到系統中

✅ **EmailJS 配置欄位已經在 `js/config.js` 中預留！**

找到以下區塊（約在第 50-62 行）：

```javascript
// =============================================
// EmailJS 設定（Email 驗證功能）
// =============================================
// 從 EmailJS Dashboard 取得
EMAILJS_SERVICE_ID: 'service_your_id',      // 👈 替換為您的 Service ID
EMAILJS_TEMPLATE_ID: 'template_your_id',    // 👈 替換為您的 Template ID
EMAILJS_PUBLIC_KEY: 'your_public_key_here', // 👈 替換為您的 Public Key
```

**請將以上三個值替換為您在 EmailJS Dashboard 中取得的實際值。**

### 📋 如何取得這三個配置值？

#### 🔑 1. 取得 Public Key

1. 登入 [EmailJS Dashboard](https://dashboard.emailjs.com/)
2. 點擊左側選單的 **"Account"** 
3. 確保在 **"General"** 標籤頁
4. 找到 **"Public Key"** 區塊
5. 點擊 **"Copy"** 或手動複製（格式如：`ABCdefGHI123xyz`）
6. 貼到 `config.js` 的 `EMAILJS_PUBLIC_KEY`

#### 📧 2. 取得 Service ID

1. 在 EmailJS Dashboard 點擊 **"Email Services"**
2. 找到您剛才創建的服務（例如：Gmail）
3. 在服務卡片上找到 **"Service ID"**（格式如：`service_abc123`）
4. 複製並貼到 `config.js` 的 `EMAILJS_SERVICE_ID`

#### 📄 3. 取得 Template ID

1. 在 EmailJS Dashboard 點擊 **"Email Templates"**
2. 找到您創建的 **"NPHONE 會員驗證碼"** 模板
3. 在模板卡片上找到 **"Template ID"**（格式如：`template_xyz789`）
4. 複製並貼到 `config.js` 的 `EMAILJS_TEMPLATE_ID`

---

## ✅ 測試設置

### 在 EmailJS Dashboard 測試

1. 進入您創建的 Template
2. 點擊 "Test It" 按鈕
3. 在右側填寫測試參數（**這裡才需要填寫變數值**）：
   - **To Email**: `{{to_email}}` → 填入您的測試信箱（如 `your@email.com`）
   - 點擊 "Add new variable" 添加其他參數：
     - `to_name`: `測試用戶`
     - `verification_code`: `123456`
     - `expiry_minutes`: `10`
4. 點擊 "Send Test Email"
5. 檢查您的信箱是否收到測試郵件

**注意：** 測試時需要手動添加變數，但實際使用時這些參數會由系統自動傳入。

### 在系統中測試

1. 執行 SQL：
   ```sql
   -- 在 Supabase SQL Editor 中執行
   \i supabase/email-verification-schema.sql
   \i supabase/email-verification-rpc.sql
   ```

2. 打開 `member/email-verification.html`
3. 輸入您的 Email
4. 點擊發送驗證碼
5. 檢查信箱並輸入驗證碼

---

## 📊 EmailJS 免費方案限制

### 免費方案包含：
- ✅ **200 封郵件/月**
- ✅ 2 個 Email 服務
- ✅ 3 個模板
- ✅ 完整功能訪問

### 如需更多：
- **Essential 方案**: $9/月 (5,000 封郵件)
- **Professional 方案**: $29/月 (15,000 封郵件)

---

## 🔒 安全注意事項

### ✅ 建議做法：
1. **不要**將 API Keys 提交到 Git
2. 使用環境變數存儲敏感資訊
3. 啟用 EmailJS 的域名限制
4. 定期更換 API Keys

### 設置域名限制：
1. 在 EmailJS Dashboard
2. 進入 "Account" > "Security"
3. 添加允許的域名：
   ```
   localhost
   yourdomain.com
   *.yourdomain.com
   ```

---

## 🐛 常見問題

### 1. 郵件沒收到？
- 檢查垃圾郵件資料夾
- 確認 Service 連接正常
- 檢查 Email 格式是否正確
- 查看 EmailJS Dashboard 的發送歷史

### 2. 驗證碼發送失敗？
- 確認 Service ID、Template ID、Public Key 正確
- 檢查瀏覽器 Console 錯誤訊息
- 確認 EmailJS SDK 已正確載入
- 檢查網路連接

### 3. 超出月度限額？
- 升級到付費方案
- 或等待下個月重置
- 或使用其他郵件服務（如 SendGrid、AWS SES）

---

## 📝 配置檢查清單

完成設置後，請確認：

- [ ] EmailJS 帳號已註冊並驗證
- [ ] Email Service 已創建並連接
- [ ] Email Template 已創建並測試
- [ ] Service ID、Template ID、Public Key 已複製
- [ ] 配置已添加到 `config.js`
- [ ] SQL Schema 和 RPC 已執行
- [ ] 測試郵件發送成功
- [ ] 驗證碼可以正常驗證
- [ ] 域名限制已設置（生產環境）

---

## 🔗 有用的連結

- [EmailJS 官網](https://www.emailjs.com/)
- [EmailJS 文檔](https://www.emailjs.com/docs/)
- [EmailJS SDK GitHub](https://github.com/emailjs/emailjs-sdk)
- [EmailJS 支援](https://www.emailjs.com/docs/support/)

---

**設置完成後，Email 驗證功能即可正常使用！** 📧✨

