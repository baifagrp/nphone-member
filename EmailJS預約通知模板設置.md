# 📧 EmailJS 預約通知模板設置指南

## 🎯 功能說明

當會員成功建立預約時，系統會同時：
1. 📱 發送 LINE 通知給**顧客**
2. 📧 發送 Email 通知給**店家**

---

## 🔧 EmailJS 設置步驟

### 1️⃣ 登入 EmailJS

前往 [EmailJS Dashboard](https://dashboard.emailjs.com/)
- 如果已有帳號，直接登入
- 使用之前設置 Email 驗證時的同一個帳號

---

### 2️⃣ 創建預約通知模板

#### A. 進入 Email Templates

1. 在左側選單點擊 **"Email Templates"**
2. 點擊 **"Create New Template"** 按鈕

#### B. 設置模板基本資訊

**Template Name（模板名稱）：**
```
booking_notification
```

**Template ID（模板 ID）：**
```
template_fjsbjqn
```
⚠️ 這個 ID 需要填入 `js/config.js` 的 `EMAILJS_BOOKING_TEMPLATE_ID`

---

### 3️⃣ 設置郵件內容

#### 📧 郵件主旨（Subject）

```
🔔 新預約通知 - {{member_name}} 的預約
```

---

#### 📝 郵件內容（Content）

使用以下 HTML 模板（可直接複製）：

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {
            font-family: 'Microsoft JhengHei', 'PingFang TC', 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 30px;
        }
        .info-card {
            background-color: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin: 15px 0;
            border-radius: 4px;
        }
        .info-row {
            display: flex;
            margin: 10px 0;
        }
        .info-label {
            font-weight: bold;
            color: #666;
            min-width: 100px;
        }
        .info-value {
            color: #333;
            flex: 1;
        }
        .highlight {
            color: #667eea;
            font-weight: bold;
        }
        .button {
            display: inline-block;
            background-color: #667eea;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: bold;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
        .emoji {
            font-size: 20px;
            margin-right: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- 郵件標題 -->
        <div class="header">
            <h1>🔔 新預約通知</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">{{shop_name}}</p>
        </div>
        
        <!-- 主要內容 -->
        <div class="content">
            <p style="font-size: 16px; margin-bottom: 20px;">
                您好！有新的預約需要處理：
            </p>
            
            <!-- 會員資訊 -->
            <div class="info-card">
                <h3 style="margin-top: 0; color: #667eea;">
                    <span class="emoji">👤</span> 會員資訊
                </h3>
                <div class="info-row">
                    <span class="info-label">姓名：</span>
                    <span class="info-value highlight">{{member_name}}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">電話：</span>
                    <span class="info-value">{{member_phone}}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Email：</span>
                    <span class="info-value">{{member_email}}</span>
                </div>
            </div>
            
            <!-- 預約資訊 -->
            <div class="info-card">
                <h3 style="margin-top: 0; color: #667eea;">
                    <span class="emoji">📱</span> 預約資訊
                </h3>
                <div class="info-row">
                    <span class="info-label">服務項目：</span>
                    <span class="info-value highlight">{{service_name}}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">服務選項：</span>
                    <span class="info-value">{{service_option}}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">預約日期：</span>
                    <span class="info-value highlight">{{booking_date}}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">預約時間：</span>
                    <span class="info-value highlight">{{booking_time}}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">備註：</span>
                    <span class="info-value">{{notes}}</span>
                </div>
            </div>
            
            <!-- 系統資訊 -->
            <div class="info-card" style="border-left-color: #999;">
                <h3 style="margin-top: 0; color: #666;">
                    <span class="emoji">⚙️</span> 系統資訊
                </h3>
                <div class="info-row">
                    <span class="info-label">預約編號：</span>
                    <span class="info-value" style="font-family: monospace; font-size: 12px;">{{booking_id}}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">建立時間：</span>
                    <span class="info-value">{{created_at}}</span>
                </div>
            </div>
            
            <!-- 操作按鈕 -->
            <div style="text-align: center;">
                <a href="{{admin_url}}" class="button">
                    前往管理後台處理預約 →
                </a>
            </div>
            
            <p style="margin-top: 30px; color: #666; font-size: 14px;">
                ⏳ 請盡快確認此預約，系統已通知會員預約成功。
            </p>
        </div>
        
        <!-- 郵件底部 -->
        <div class="footer">
            <p style="margin: 0;">這是系統自動發送的郵件，請勿直接回覆。</p>
            <p style="margin: 10px 0 0 0;">© {{shop_name}} 會員管理系統</p>
        </div>
    </div>
</body>
</html>
```

---

### 4️⃣ 測試模板

在 EmailJS 模板編輯頁面：

1. 點擊 **"Test it"** 按鈕
2. 填入測試資料：

```json
{
  "to_email": "your-test-email@example.com",
  "shop_name": "NPHONE",
  "member_name": "測試會員",
  "member_phone": "0912-345-678",
  "member_email": "member@example.com",
  "service_name": "螢幕貼膜",
  "service_option": "iPhone 14 Pro",
  "booking_date": "2025年12月13日 週五",
  "booking_time": "14:00",
  "notes": "請準備好手機",
  "booking_id": "test-booking-id-12345",
  "created_at": "2025/12/12 14:30:25",
  "admin_url": "https://your-domain.vercel.app/admin/bookings.html"
}
```

3. 點擊 **"Send Test"**
4. 檢查您的 Email 信箱

---

### 5️⃣ 保存模板

確認測試無誤後：
1. 點擊 **"Save"** 按鈕
2. 複製 **Template ID**：`template_booking_notification`

---

## ⚙️ 系統配置

### 更新 `js/config.js`

```javascript
const CONFIG = {
  // ... 其他設定 ...
  
  // EmailJS 設定
  EMAILJS_SERVICE_ID: 'service_blp8qfq',
  EMAILJS_TEMPLATE_ID: 'template_friq9kv',  // Email 驗證模板
  EMAILJS_BOOKING_TEMPLATE_ID: 'template_booking_notification',  // 🆕 預約通知模板
  EMAILJS_PUBLIC_KEY: '2wthB1ujHwbrjNfKC',
  
  // 店家通知 Email
  SHOP_NOTIFICATION_EMAIL: 'your-shop-email@example.com',  // 🆕 替換為店家 Email
};
```

---

## 📊 完整通知流程

```
會員建立預約
    ↓
系統處理預約
    ↓
預約建立成功
    ↓
同時發送兩個通知：
    ├─ 📱 LINE 通知 → 顧客
    │   └─ "預約已成功建立！"
    │
    └─ 📧 Email 通知 → 店家
        └─ "新預約通知 - XXX 的預約"
```

---

## 🎨 Email 樣式預覽

Email 包含以下區塊：

### 1. 標題區（紫色漸層背景）
```
🔔 新預約通知
NPHONE
```

### 2. 會員資訊卡片
```
👤 會員資訊
姓名：張小明
電話：0912-345-678
Email：member@example.com
```

### 3. 預約資訊卡片
```
📱 預約資訊
服務項目：螢幕貼膜
服務選項：iPhone 14 Pro
預約日期：2025年12月13日 週五
預約時間：14:00
備註：請準備好手機
```

### 4. 系統資訊卡片
```
⚙️ 系統資訊
預約編號：abc123...
建立時間：2025/12/12 14:30:25
```

### 5. 操作按鈕
```
[前往管理後台處理預約 →]
```

---

## 🧪 測試步驟

### 1. 設置完成後測試

1. 會員登入系統
2. 建立新預約
3. 提交預約

### 2. 確認通知

**顧客端（LINE）：**
- ✅ 收到「預約已成功建立！」通知
- ✅ 包含預約詳細資訊

**店家端（Email）：**
- ✅ 收到「新預約通知」郵件
- ✅ 包含會員和預約資訊
- ✅ 可點擊按鈕前往管理後台

---

## ⚠️ 常見問題

### Q1: 沒有收到 Email？

**檢查：**
1. EmailJS Service ID 是否正確
2. Template ID 是否正確：`template_booking_notification`
3. Public Key 是否正確
4. 店家 Email 是否正確設定
5. 檢查垃圾郵件資料夾

---

### Q2: Email 內容顯示不完整？

**解決：**
- 確認所有模板變數都有在程式中傳遞
- 檢查 `email-notification.js` 的 `templateParams`

---

### Q3: 如何更改 Email 樣式？

**步驟：**
1. 登入 EmailJS Dashboard
2. 找到 `template_booking_notification` 模板
3. 編輯 HTML 內容
4. 保存並測試

---

## 📋 檢查清單

部署前確認：

- [ ] ✅ EmailJS 預約通知模板已建立
- [ ] ✅ Template ID 正確：`template_booking_notification`
- [ ] ✅ `js/config.js` 已更新
- [ ] ✅ `SHOP_NOTIFICATION_EMAIL` 已設定
- [ ] ✅ 測試郵件發送成功
- [ ] ✅ 郵件內容顯示正確
- [ ] ✅ 管理後台連結可用

---

## 🎉 完成！

設置完成後，每次會員預約時：
- 📱 **顧客**立即收到 LINE 通知
- 📧 **店家**立即收到 Email 通知

雙重通知，確保不會錯過任何預約！✨

