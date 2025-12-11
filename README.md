# 手機貼膜店會員管理系統

## 📋 專案簡介

這是一個為手機貼膜店設計的會員管理系統，使用純 HTML/CSS/JavaScript + Supabase 建立，無需安裝 Node.js 或任何開發工具。

### 主要功能

**第一階段功能**：
- ✅ 會員 LINE 登入/註冊
- ✅ 會員基本資料管理（姓名、電話、Email、生日、性別）
- ✅ LINE 帳號綁定
- ✅ 商家後台管理（會員列表、新增、編輯）

### 技術架構

```
前端：純 HTML + CSS + JavaScript
後端：Supabase (PostgreSQL + Auth + Edge Functions)
通訊：LINE Login API
部署：GitHub Pages / Vercel / Netlify
```

## 📁 專案結構

```
會員系統/
├── README.md                    # 專案說明
├── SETUP.md                     # 設定指南
├── index.html                   # 首頁（會員登入）
├── member-profile.html          # 會員個人中心
├── member-edit.html             # 編輯個人資料
├── admin-login.html             # 管理員登入
├── admin-dashboard.html         # 後台首頁
├── admin-members.html           # 會員列表
├── admin-member-detail.html     # 會員詳情
├── admin-member-new.html        # 新增會員
├── css/
│   └── styles.css              # Apple 風格樣式
├── js/
│   ├── config.js               # Supabase 配置
│   ├── supabase-client.js      # Supabase 客戶端
│   ├── auth.js                 # 認證相關功能
│   ├── member.js               # 會員端功能
│   └── admin.js                # 後台管理功能
├── images/
│   └── logo.svg                # 店家 Logo
└── supabase/
    ├── schema.sql              # 資料庫結構
    ├── rls-policies.sql        # 安全政策
    └── edge-functions/
        └── line-login/         # LINE Login 處理
            └── index.ts
```

## 🚀 快速開始

### 步驟 1：設定 Supabase

1. 前往 [Supabase](https://supabase.com) 註冊免費帳號
2. 建立新專案
3. 執行 `supabase/schema.sql` 建立資料表
4. 執行 `supabase/rls-policies.sql` 設定安全政策
5. 複製 API Keys 到 `js/config.js`

詳細步驟請參考 [SETUP.md](SETUP.md)

### 步驟 2：設定 LINE Developers

1. 前往 [LINE Developers Console](https://developers.line.biz/)
2. 建立 LINE Login Channel
3. 設定 Callback URL
4. 複製 Channel ID 和 Secret

詳細步驟請參考 [SETUP.md](SETUP.md)

### 步驟 3：開啟網站

1. 直接雙擊 `index.html` 在瀏覽器開啟
2. 或使用任何網頁伺服器（如 VS Code Live Server）

### 步驟 4：部署（選擇性）

- **GitHub Pages**：推送到 GitHub 並啟用 Pages
- **Netlify**：拖放資料夾到 Netlify
- **Vercel**：連接 GitHub repo 自動部署

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

### 會員端

1. 訪問首頁 `index.html`
2. 點擊「使用 LINE 登入」
3. 授權後自動建立/登入帳號
4. 查看和編輯個人資料

### 管理後台

1. 訪問 `admin-login.html`
2. 使用管理員帳密登入
3. 查看所有會員列表
4. 新增或編輯會員資料

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

### members 表（會員）

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | uuid | 主鍵 |
| line_user_id | text | LINE 使用者 ID（唯一）|
| name | text | 姓名 |
| phone | text | 電話 |
| email | text | Email |
| birthday | date | 生日 |
| gender | text | 性別 |
| avatar_url | text | 頭像 URL |
| created_at | timestamp | 建立時間 |
| updated_at | timestamp | 更新時間 |

### admins 表（管理員）

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | uuid | 主鍵（關聯 auth.users）|
| email | text | 管理員帳號 |
| role | text | 角色（owner/staff）|
| created_at | timestamp | 建立時間 |

## 🔮 未來擴展（第二、三階段）

- 📅 預約系統
- 💰 儲值金管理
- 🎁 點數與紅利
- 📧 LINE 訊息推播
- 📊 數據分析儀表板

## 📞 支援

如有問題，請檢查：
1. [SETUP.md](SETUP.md) - 詳細設定指南
2. Supabase 文件
3. LINE Developers 文件

## 📄 授權

此專案為手機貼膜店內部使用，未授權不得轉售或再分發。
