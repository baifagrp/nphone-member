# 🔧 EmailJS 400 錯誤排查指南

## ❌ 錯誤訊息

```
api.emailjs.com/api/v1.0/email/send:1 
Failed to load resource: the server responded with a status of 400
```

---

## 🎯 常見原因與解決方案

### 1️⃣ Template ID 不正確

#### 檢查步驟：

1. 登入 [EmailJS Dashboard](https://dashboard.emailjs.com/)
2. 點擊左側 **"Email Templates"**
3. 找到您的預約通知模板
4. 確認 **Template ID** 是否為：`template_fjsbjqn`

#### 如果不是：

更新 `js/config.js`：
```javascript
EMAILJS_BOOKING_TEMPLATE_ID: 'your-actual-template-id',
```

---

### 2️⃣ Service ID 不正確

#### 檢查步驟：

1. 在 EmailJS Dashboard
2. 點擊左側 **"Email Services"**
3. 確認 **Service ID** 是否為：`service_blp8qfq`

#### 如果不是：

更新 `js/config.js`：
```javascript
EMAILJS_SERVICE_ID: 'your-actual-service-id',
```

---

### 3️⃣ Public Key 不正確

#### 檢查步驟：

1. 在 EmailJS Dashboard
2. 點擊右上角帳號 → **"Account"**
3. 找到 **"API Keys"** 區塊
4. 確認 **Public Key** 是否為：`2wthB1ujHwbrjNfKC`

#### 如果不是：

更新 `js/config.js`：
```javascript
EMAILJS_PUBLIC_KEY: 'your-actual-public-key',
```

---

### 4️⃣ 模板設置不正確 ⭐ 最常見

#### A. 檢查模板收件人設置

在 EmailJS 模板編輯頁面：

1. 點擊 **"Settings"** 標籤
2. 找到 **"To Email"** 欄位
3. 應該填入：**`{{to_email}}`**（不是實際的 Email）

```
To Email: {{to_email}}
```

這樣系統才能動態設置收件人！

---

#### B. 檢查模板變數

確認模板中使用的所有變數都有定義：

**必要變數清單：**
```
{{to_email}}           - 收件人 Email
{{shop_name}}          - 店家名稱
{{member_name}}        - 會員姓名
{{member_phone}}       - 會員電話
{{member_email}}       - 會員 Email
{{service_name}}       - 服務項目
{{service_option}}     - 服務選項
{{booking_date}}       - 預約日期
{{booking_time}}       - 預約時間
{{notes}}              - 備註
{{booking_id}}         - 預約編號
{{created_at}}         - 建立時間
{{admin_url}}          - 管理後台連結
```

---

#### C. 完整模板設置

**Subject（主旨）：**
```
🔔 新預約通知 - {{member_name}} 的預約
```

**To Email（收件人）：**
```
{{to_email}}
```

**From Name（寄件人名稱）：**
```
{{shop_name}} 預約系統
```

**Reply To（回覆地址）：**
```
noreply@emailjs.com
```

---

### 5️⃣ EmailJS 初始化問題

#### 檢查初始化順序

在 `member/booking.html` 中，確認載入順序：

```html
<!-- 1. EmailJS SDK -->
<script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>

<!-- 2. Config -->
<script src="../js/config.js"></script>

<!-- 3. Email Notification API -->
<script src="../js/email-notification.js"></script>
```

#### 檢查初始化調用

在發送郵件前，應該先初始化：

```javascript
// 初始化 EmailJS
EmailNotificationAPI.init();

// 然後發送
EmailNotificationAPI.sendBookingNotificationToShop(data);
```

---

## 🧪 測試步驟

### 測試 1：直接在 EmailJS 測試

1. 登入 EmailJS Dashboard
2. 找到 `template_fjsbjqn` 模板
3. 點擊 **"Test it"** 按鈕
4. 填入測試資料：

```json
{
  "to_email": "nphone.khjg@icloud.com",
  "shop_name": "NPHONE",
  "member_name": "測試會員",
  "member_phone": "0912-345-678",
  "member_email": "test@example.com",
  "service_name": "螢幕貼膜",
  "service_option": "iPhone 14 Pro",
  "booking_date": "2025年12月13日 週五",
  "booking_time": "14:00",
  "notes": "測試備註",
  "booking_id": "test-123",
  "created_at": "2025/12/13 10:30:00",
  "admin_url": "https://your-domain.vercel.app/admin/bookings.html"
}
```

5. 點擊 **"Send Test"**
6. 檢查 Email 信箱

**✅ 如果這裡成功：** 說明模板設置正確，問題在前端代碼
**❌ 如果這裡失敗：** 說明模板設置有問題

---

### 測試 2：檢查瀏覽器 Console

按 F12 打開開發者工具，查看：

```javascript
// 應該看到：
📤 發送 Email 參數 {
  service: "service_blp8qfq",
  template: "template_fjsbjqn",
  params: {
    to_email: "nphone.khjg@icloud.com",
    shop_name: "NPHONE",
    member_name: "張小明",
    ...
  }
}

// 如果成功：
✅ 預約通知 Email 發送成功

// 如果失敗：
❌ 發送預約通知 Email 失敗 Error: ...
```

---

### 測試 3：使用簡化參數測試

暫時修改 `email-notification.js`，使用最少參數：

```javascript
const templateParams = {
    to_email: 'nphone.khjg@icloud.com',
    shop_name: 'NPHONE',
    member_name: '測試會員',
    service_name: '測試服務',
    booking_date: '2025-12-13',
    booking_time: '14:00'
};
```

如果這樣可以成功，說明某些參數有問題。

---

## 🔍 常見錯誤對照

### 錯誤 1: Invalid template ID

```
Error: Invalid 'template_id' parameter
```

**解決：** 檢查 Template ID 是否正確

---

### 錯誤 2: Invalid service ID

```
Error: Invalid 'service_id' parameter
```

**解決：** 檢查 Service ID 是否正確

---

### 錯誤 3: Template parameter missing

```
Error: Template parameter 'xxx' is required
```

**解決：** 模板中使用了某個變數，但前端沒有傳遞

---

### 錯誤 4: Invalid email format

```
Error: Invalid email address
```

**解決：** 檢查 `SHOP_NOTIFICATION_EMAIL` 格式是否正確

---

## ✅ 完整配置檢查清單

### EmailJS Dashboard 設置

- [ ] ✅ Service ID 正確：`service_blp8qfq`
- [ ] ✅ Template ID 正確：`template_fjsbjqn`
- [ ] ✅ Public Key 正確：`2wthB1ujHwbrjNfKC`
- [ ] ✅ 模板 "To Email" 設為：`{{to_email}}`
- [ ] ✅ 模板包含所有必要變數
- [ ] ✅ 模板測試發送成功

---

### js/config.js 設置

- [ ] ✅ `EMAILJS_SERVICE_ID` 正確
- [ ] ✅ `EMAILJS_BOOKING_TEMPLATE_ID` 正確
- [ ] ✅ `EMAILJS_PUBLIC_KEY` 正確
- [ ] ✅ `SHOP_NOTIFICATION_EMAIL` 格式正確：`nphone.khjg@icloud.com`

---

### 前端代碼

- [ ] ✅ EmailJS SDK 已載入
- [ ] ✅ `email-notification.js` 已載入
- [ ] ✅ `EmailNotificationAPI.init()` 已調用
- [ ] ✅ 傳遞的參數完整

---

## 💡 快速修復

### 方案 1：重新建立模板

如果持續失敗，建議：

1. 在 EmailJS 建立新的模板
2. 使用簡單的 HTML
3. 只包含基本變數
4. 測試成功後再增加內容

---

### 方案 2：檢查 Email Service

確認 Email Service 狀態：

1. EmailJS Dashboard → Email Services
2. 確認 Service 狀態為 **"Active"**
3. 確認連接的郵箱服務正常

---

### 方案 3：暫時禁用 Email 通知

如果急需上線，可暫時註解掉 Email 通知：

```javascript
// 暫時禁用 Email 通知
// EmailNotificationAPI.sendBookingNotificationToShop(notificationData);
```

只保留 LINE 通知給顧客。

---

## 📞 需要更多協助？

如果以上方法都無法解決，請提供：

1. ✅ 完整的 Console 錯誤訊息
2. ✅ EmailJS Dashboard 的 Template ID 截圖
3. ✅ 模板設置的截圖
4. ✅ 在 EmailJS 直接測試是否成功

這樣我才能更準確地診斷問題！😊

