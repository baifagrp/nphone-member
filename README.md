# NPHONE 會員管理系統

## 📋 專案簡介

這是為 NPHONE 手機專賣店設計的完整會員管理系統，使用純 HTML/CSS/JavaScript + Supabase 建立，無需安裝 Node.js 或任何開發工具。

### 🎯 核心功能

#### ✅ 會員系統
- LINE Login 整合（OAuth + LIFF 雙模式）
- Email 驗證註冊流程
- 會員基本資料管理
- 會員條碼系統

#### ✅ 預約系統
- 服務項目管理
- 時段管理
- 營業時間設定
- 會員預約與歷史記錄

#### ✅ 結帳系統
- 多種付款方式
- 交易記錄管理
- 預約關聯結帳
- 交易編輯與刪除

#### ✅ 儲值金與積分
- 儲值金充值/消費
- 積分累積/使用
- 消費自動累積積分
- 儲值金付款支援

#### ✅ LINE LIFF 整合
- 在 LINE 內建瀏覽器運行
- 自動登入功能
- 分享與掃描功能
- 優雅降級支援

### 🏗️ 技術架構

```
前端：
  - 純 HTML/CSS/JavaScript（無需 build）
  - LINE LIFF SDK
  - Supabase JavaScript Client
  - EmailJS（Email 驗證）

後端：
  - Supabase PostgreSQL（資料庫）
  - Supabase Auth（身份驗證）
  - Supabase Edge Functions（伺服器邏輯）
  - Row Level Security（資料安全）

整合：
  - LINE Login（OAuth 2.0）
  - LINE LIFF（嵌入式應用）
  - JsBarcode（條碼生成）

部署：
  - Vercel / Netlify（推薦）
  - GitHub Pages（靜態頁面）
```

## 📁 專案結構

```
NPHONE 會員系統/
├── README.md                          # 專案說明
├── SETUP.md                           # 設定指南
├── DEPLOYMENT.md                      # 部署指南
│
├── index.html                         # 首頁（會員登入）✨ 支援 LIFF
│
├── member/                            # 會員端頁面
│   ├── profile.html                   # 會員中心
│   ├── edit.html                      # 編輯個人資料
│   ├── setup.html                     # 首次資料設定
│   ├── email-verification.html        # Email 驗證
│   ├── booking.html                   # 預約服務
│   ├── bookings.html                  # 預約記錄
│   ├── wallet.html                    # 儲值金
│   └── points.html                    # 積分記錄
│
├── admin/                             # 管理後台
│   ├── login.html                     # 管理員登入
│   ├── dashboard.html                 # 儀表板
│   ├── members.html                   # 會員管理
│   ├── member-detail.html             # 會員詳情
│   ├── member-new.html                # 新增會員
│   ├── member-edit.html               # 編輯會員
│   ├── bookings.html                  # 預約管理
│   ├── member-booking-new.html        # 新增預約
│   ├── checkout.html                  # 結帳管理
│   ├── wallet-points.html             # 儲值金/積分管理
│   ├── business-hours.html            # 營業時間設定
│   └── services.html                  # 服務項目管理
│
├── css/                               # 樣式表
│   ├── styles.css                     # 基礎樣式
│   ├── design-system.css              # 設計系統
│   ├── calendar.css                   # 日曆樣式
│   ├── admin-enhancements.css         # 管理後台樣式
│   └── animations.css                 # 動畫效果
│
├── js/                                # JavaScript
│   ├── config.js                      # 系統配置
│   ├── supabase-client.js             # Supabase 客戶端
│   ├── liff-client.js                 # ✨ LINE LIFF 客戶端
│   ├── auth.js                        # 認證功能
│   ├── member.js                      # 會員 API
│   ├── admin.js                       # 管理員 API
│   ├── booking.js                     # 預約 API
│   ├── checkout.js                    # 結帳 API
│   ├── wallet-points.js               # 儲值金/積分 API
│   ├── email-verification.js          # Email 驗證 API
│   ├── ui-utils.js                    # UI 工具
│   └── animation-utils.js             # 動畫工具
│
└── supabase/                          # 資料庫與後端
    ├── schema.sql                     # 資料庫結構
    ├── rls-policies.sql               # RLS 安全政策
    ├── booking-schema.sql             # 預約系統 Schema
    ├── checkout-schema.sql            # 結帳系統 Schema
    ├── phase3-schema.sql              # 儲值金/積分 Schema
    ├── email-verification-schema.sql  # Email 驗證 Schema
    ├── email-verification-rpc.sql     # Email 驗證 RPC
    └── edge-functions/                # Edge Functions
        ├── line-login/index.ts        # LINE Login 處理
        └── create-booking/index.ts    # 預約建立處理
```

## 🚀 快速開始

### 必要設置（依序執行）

#### 1️⃣ 設定 Supabase

```bash
# 在 Supabase SQL Editor 依序執行：
1. supabase/schema.sql
2. supabase/rls-policies.sql
3. supabase/booking-schema.sql
4. supabase/checkout-schema.sql
5. supabase/phase3-schema.sql
6. supabase/email-verification-schema.sql
7. supabase/email-verification-rpc.sql
8. supabase/fix-line-login-email.sql
9. supabase/fix-email-verification-complete.sql
```

**取得 API Keys：**
- Dashboard > Settings > API
- 複製 `Project URL` 和 `anon public key`

---

#### 2️⃣ 設定 LINE Developers

**LINE Login Channel：**
1. 前往 [LINE Developers Console](https://developers.line.biz/)
2. 建立 Provider → 建立 LINE Login Channel
3. 設定 Callback URL: `https://your-domain.vercel.app/auth/callback.html`
4. Scope: `profile`, `openid`, `email`
5. 複製 `Channel ID` 和 `Channel Secret`

**LINE LIFF（可選但推薦）：**
1. 在同一個 Channel 中建立 LIFF
2. Endpoint URL: `https://your-domain.vercel.app`
3. Size: `Full`
4. Scope: `profile`, `openid`
5. 複製 `LIFF ID`

---

#### 3️⃣ 設定 EmailJS

1. 註冊 [EmailJS](https://www.emailjs.com/)
2. 連接郵件服務（Gmail/Outlook）
3. 創建驗證碼郵件模板
4. 複製 `Service ID`, `Template ID`, `Public Key`

---

#### 4️⃣ 配置系統

編輯 `js/config.js`：

```javascript
const CONFIG = {
  // Supabase
  SUPABASE_URL: 'https://xxx.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGci...',
  
  // LINE Login
  LINE_CHANNEL_ID: '1234567890',
  LINE_CHANNEL_SECRET: 'xxxxx',
  
  // LINE LIFF
  LIFF_ID: '1234567890-abcdefgh',
  
  // EmailJS
  EMAILJS_SERVICE_ID: 'service_xxx',
  EMAILJS_TEMPLATE_ID: 'template_xxx',
  EMAILJS_PUBLIC_KEY: 'xxx',
};
```

---

#### 5️⃣ 部署

**推薦使用 Vercel：**

```bash
# 使用 Vercel CLI
npm i -g vercel
vercel

# 或直接在 Vercel Dashboard 匯入 GitHub repo
```

**其他選項：**
- Netlify: 拖放資料夾即可
- GitHub Pages: 推送到 gh-pages 分支

詳細步驟請參考 [DEPLOYMENT.md](DEPLOYMENT.md)

## 🔐 環境變數設定

編輯 `js/config.js` 填入您的金鑰：

```javascript
const CONFIG = {
  SUPABASE_URL: 'your-supabase-url',
  SUPABASE_ANON_KEY: 'your-supabase-anon-key',
  LINE_CHANNEL_ID: 'your-line-channel-id',
  LINE_CALLBACK_URL: 'your-callback-url'
};
```

## 👥 預設管理員帳號

首次使用需在 Supabase 建立管理員：

1. 前往 Supabase Authentication 頁面
2. 手動新增使用者
3. 在 `admins` 表中新增記錄連結該使用者

預設帳號：
- Email: admin@example.com
- Password: （請自行設定）

## 📱 使用說明

### 會員端功能

#### 🔐 登入註冊
1. **首頁** → 點擊「使用 LINE 登入」
2. **LINE 授權** → 自動建立會員帳號
3. **Email 驗證** → 輸入並驗證 Email
4. **完成註冊** → 進入會員中心

#### 📋 會員中心
- 查看會員編號條碼
- 查看儲值金/積分餘額
- 管理個人資料
- 查看預約記錄

#### 📅 預約服務
- 選擇服務項目
- 選擇日期和時段
- 提交預約
- 查看預約歷史

#### 💰 儲值金/積分
- 查看餘額
- 查看交易記錄
- 消費自動累積積分

---

### 管理後台功能

#### 👥 會員管理
- 查看所有會員
- 新增會員（預先建立）
- 編輯會員資料
- 查看會員詳情

#### 📅 預約管理
- 查看所有預約
- 為會員建立預約
- 刪除預約

#### 💳 結帳管理
- 建立交易記錄
- 關聯預約結帳
- 編輯/刪除交易
- 儲值金付款支援

#### 💰 儲值金/積分管理
- 為會員充值
- 調整積分
- 查看交易記錄

#### ⚙️ 系統設定
- 營業時間設定
- 時段管理
- 服務項目管理

## 🛠️ 開發注意事項

### 瀏覽器相容性

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### 安全性

- 所有敏感操作透過 Supabase RLS 保護
- API Keys 使用 anon key（公開 key）
- 管理員操作需要認證

### 效能

- 小於 10 位會員，效能完全足夠
- 無需優化或快取

## 📊 資料庫結構

### 核心資料表

#### members（會員）
- 基本資料、LINE 綁定、Email 驗證狀態
- 會員編號（條碼）、註冊狀態

#### bookings（預約）
- 預約資訊、服務項目、時段
- 付款狀態、關聯交易

#### transactions（交易）
- 交易類型、金額、付款方式
- 關聯預約、收據編號

#### wallets（儲值金）
- 餘額、總充值、總消費
- 關聯 wallet_transactions

#### points（積分）
- 餘額、總獲得、總使用
- 關聯 point_transactions

#### services（服務項目）
- 服務名稱、價格、時長
- 選項管理

#### business_hours（營業時間）
- 每日營業時間
- 休息時段

詳細結構請參考 `supabase/*.sql` 檔案。

## 🔮 進行中的功能

### 即將完成
- 🔔 LINE 訊息推播（預約提醒、生日祝福）
- 🎟️ 票券系統（優惠券、體驗券）
- 📊 報表與分析（營收統計、會員分析）

### 規劃中
- 🤖 LINE 聊天機器人整合
- 📱 進階 LIFF 功能（分享、掃描）
- 🎨 主題自訂功能
- 🌐 多語系支援

## 📞 支援

如有問題，請檢查：
1. [SETUP.md](SETUP.md) - 詳細設定指南
2. Supabase 文件
3. LINE Developers 文件

## 📄 授權

此專案為手機貼膜店內部使用，未授權不得轉售或再分發。
