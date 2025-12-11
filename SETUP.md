# 系統設定指南

本指南將協助您完成所有必要的設定步驟。

## 📋 前置準備

請準備以下帳號（全部免費）：

- [ ] Google 帳號（用於 Supabase）
- [ ] LINE 帳號（用於 LINE Developers）
- [ ] GitHub 帳號（選擇性，用於部署）

## 🗄️ 步驟一：設定 Supabase

### 1.1 建立 Supabase 專案

1. 前往 [https://supabase.com](https://supabase.com)
2. 點擊 **Start your project**
3. 使用 Google 帳號登入
4. 點擊 **New Project**
5. 填寫專案資訊：
   - **Name**: `member-system`（或任何您喜歡的名稱）
   - **Database Password**: 設定一個強密碼（請記住！）
   - **Region**: 選擇 `Northeast Asia (Tokyo)` 或 `Southeast Asia (Singapore)`
6. 點擊 **Create new project**
7. 等待約 2 分鐘讓專案建立完成

### 1.2 取得 API Keys

1. 專案建立完成後，左側選單點擊 **Settings**（齒輪圖示）
2. 選擇 **API**
3. 找到以下資訊並複製保存：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...`（很長的字串）

### 1.3 建立資料庫表格

1. 左側選單點擊 **SQL Editor**
2. 點擊 **New query**
3. 複製 `supabase/schema.sql` 的內容貼上
4. 點擊 **Run** 執行
5. 看到 "Success. No rows returned" 表示成功

### 1.4 設定安全政策（RLS）

1. 同樣在 SQL Editor 中
2. 點擊 **New query**
3. 複製 `supabase/rls-policies.sql` 的內容貼上
4. 點擊 **Run** 執行

### 1.5 建立第一個管理員帳號

1. 左側選單點擊 **Authentication**
2. 點擊 **Add user** → **Create new user**
3. 填寫：
   - **Email**: 您的管理員 Email（例如：`admin@example.com`）
   - **Password**: 設定密碼（至少 6 字元）
   - **Auto Confirm User**: ✅ 打勾
4. 點擊 **Create user**
5. 複製新建立的 User ID（UUID 格式）
6. 回到 **SQL Editor**，執行以下 SQL（將 `USER_ID` 和 `EMAIL` 替換）：

```sql
INSERT INTO admins (id, email, role)
VALUES ('USER_ID 貼在這裡', 'admin@example.com', 'owner');
```

7. 點擊 **Run**

✅ Supabase 設定完成！

---

## 📱 步驟二：設定 LINE Developers

### 2.1 建立 LINE Login Channel

1. 前往 [LINE Developers Console](https://developers.line.biz/console/)
2. 使用 LINE 帳號登入
3. 如果是第一次使用，需要：
   - 建立 **Provider**（提供者）
   - 填寫公司/店家名稱
4. 點擊建立好的 Provider
5. 點擊 **Create a new channel**
6. 選擇 **LINE Login**
7. 填寫資訊：
   - **Channel type**: LINE Login
   - **Provider**: 選擇剛建立的
   - **Company or owner's country or region**: Taiwan
   - **Channel icon**: 上傳店家 Logo（選擇性）
   - **Channel name**: `手機貼膜店會員系統`
   - **Channel description**: `會員登入與管理系統`
   - **App types**: ✅ Web app
   - **Email address**: 您的 Email
   - 同意條款並建立

### 2.2 設定 Callback URL

1. 進入剛建立的 Channel
2. 選擇 **LINE Login** 頁籤
3. 找到 **Callback URL** 欄位
4. 新增以下 URL（根據您的部署方式選擇）：
   - **本地測試**: `http://localhost:8000/auth-callback.html`
   - **GitHub Pages**: `https://your-username.github.io/member-system/auth-callback.html`
   - **自訂網址**: `https://your-domain.com/auth-callback.html`
5. 點擊 **Update**

### 2.3 取得 Channel ID 和 Secret

1. 選擇 **Basic settings** 頁籤
2. 複製保存以下資訊：
   - **Channel ID**: 一串數字
   - **Channel secret**: 點擊 **Issue** 後複製

### 2.4 建立 LINE Messaging API（為未來通知準備）

1. 回到 Provider 頁面
2. 點擊 **Create a new channel**
3. 選擇 **Messaging API**
4. 填寫類似資訊（步驟 2.1）
5. 建立完成後，進入 Channel
6. 選擇 **Messaging API** 頁籤
7. 找到 **Channel access token**
8. 點擊 **Issue**，複製保存

✅ LINE Developers 設定完成！

---

## ⚙️ 步驟三：設定專案配置

### 3.1 填寫配置檔案

1. 用記事本開啟 `js/config.js`
2. 填入您在步驟一和步驟二取得的資訊：

```javascript
const CONFIG = {
  // Supabase 設定
  SUPABASE_URL: 'https://xxxxx.supabase.co',  // 步驟 1.2 的 Project URL
  SUPABASE_ANON_KEY: 'eyJhbGc...',  // 步驟 1.2 的 anon public key
  
  // LINE 設定
  LINE_CHANNEL_ID: '1234567890',  // 步驟 2.3 的 Channel ID
  LINE_CHANNEL_SECRET: 'xxxxx',  // 步驟 2.3 的 Channel secret
  LINE_CALLBACK_URL: 'http://localhost:8000/auth-callback.html',  // 步驟 2.2 設定的 URL
  
  // LINE Messaging API（選擇性，第二階段使用）
  LINE_MESSAGING_TOKEN: 'xxxxx'  // 步驟 2.4 的 token
};
```

3. 儲存檔案

### 3.2 設定 Supabase Edge Function（LINE Login 處理）

由於純前端無法安全處理 LINE OAuth，我們需要使用 Supabase Edge Function：

1. 在 Supabase Dashboard，左側選單點擊 **Edge Functions**
2. 點擊 **Deploy a new function**
3. 名稱輸入：`line-login-callback`
4. 複製 `supabase/edge-functions/line-login/index.ts` 的內容貼上
5. 在 **Secrets** 區域設定：
   - `LINE_CHANNEL_ID`: 您的 Channel ID
   - `LINE_CHANNEL_SECRET`: 您的 Channel Secret
6. 點擊 **Deploy**
7. 複製產生的 Function URL
8. 更新 `js/config.js` 中的 `LINE_CALLBACK_URL` 為此 URL

✅ 專案配置完成！

---

## 🌐 步驟四：測試系統

### 4.1 本地測試

1. **使用 Python（如果已安裝）**：
   ```bash
   # 在專案資料夾中開啟命令提示字元
   python -m http.server 8000
   ```
   然後訪問：`http://localhost:8000`

2. **使用 Chrome 瀏覽器**：
   - 直接雙擊 `index.html` 開啟
   - 如果遇到 CORS 問題，需要使用網頁伺服器

3. **使用線上編輯器**：
   - 前往 [CodePen](https://codepen.io)
   - 或 [JSFiddle](https://jsfiddle.net)
   - 複製貼上程式碼測試

### 4.2 測試流程

**測試會員登入**：
1. 開啟 `index.html`
2. 點擊「使用 LINE 登入」
3. 授權後應該跳轉回來並顯示會員中心
4. 檢查個人資料是否正確顯示

**測試管理後台**：
1. 開啟 `admin-login.html`
2. 使用步驟 1.5 建立的管理員帳號登入
3. 應該能看到會員列表
4. 嘗試新增一位測試會員

✅ 測試完成！

---

## 🚀 步驟五：部署到網路

### 選項 A：GitHub Pages（推薦）

1. 在 GitHub 建立新 repository
2. 上傳所有檔案（除了 `.git` 資料夾）
3. 進入 repo 的 **Settings** → **Pages**
4. **Source** 選擇 `main` branch
5. 點擊 **Save**
6. 等待約 1 分鐘，訪問提供的網址

### 選項 B：Netlify

1. 前往 [Netlify](https://netlify.com)
2. 拖放整個專案資料夾到網站
3. 自動部署完成

### 選項 C：Vercel

1. 前往 [Vercel](https://vercel.com)
2. 連接 GitHub repo
3. 自動偵測設定並部署

**部署後記得**：
- 更新 `js/config.js` 中的 `LINE_CALLBACK_URL` 為新網址
- 在 LINE Developers 更新 Callback URL

✅ 部署完成！

---

## ❓ 常見問題

### Q1: Supabase 顯示 "Row Level Security" 錯誤？
A: 確認已執行 `rls-policies.sql`，並且已啟用 RLS。

### Q2: LINE Login 後沒有反應？
A: 檢查：
- Callback URL 是否正確
- Edge Function 是否正確部署
- 瀏覽器 Console 有無錯誤訊息

### Q3: 管理員無法登入？
A: 確認：
- 已在 Supabase Authentication 建立使用者
- 已在 `admins` 表中新增對應記錄
- Email 和密碼正確

### Q4: 資料無法儲存？
A: 檢查：
- Supabase API Keys 是否正確
- RLS 政策是否正確設定
- 瀏覽器 Console 錯誤訊息

### Q5: 本地測試出現 CORS 錯誤？
A: 需要使用網頁伺服器，不能直接雙擊開啟 HTML 檔案。

---

## 📚 參考資源

- [Supabase 文件](https://supabase.com/docs)
- [LINE Login 文件](https://developers.line.biz/en/docs/line-login/)
- [LINE Messaging API 文件](https://developers.line.biz/en/docs/messaging-api/)

---

## ✅ 設定檢查清單

完成後請確認：

- [ ] Supabase 專案已建立
- [ ] 資料庫表格已建立
- [ ] RLS 政策已設定
- [ ] 管理員帳號已建立
- [ ] LINE Login Channel 已建立
- [ ] LINE Messaging API Channel 已建立
- [ ] Callback URL 已設定
- [ ] `js/config.js` 已填寫所有設定
- [ ] Edge Function 已部署
- [ ] 本地測試成功
- [ ] 已部署到網路（選擇性）

恭喜！您的會員系統已經準備就緒！🎉

