# 部署指南

本文件將指導您如何將會員系統部署到網路上。

## 📋 部署前準備

在開始部署前，請確認：

- [ ] 已完成 `SETUP.md` 中的所有設定
- [ ] 本地測試已通過
- [ ] `js/config.js` 中的所有設定正確無誤
- [ ] Supabase 資料庫已建立並設定完成
- [ ] LINE Developers 已設定完成

---

## 🚀 部署選項

我們提供三種免費的部署方式，選擇最適合您的一種即可。

---

## 選項 A：GitHub Pages（推薦）

### 優點
- ✅ 完全免費
- ✅ 自動 HTTPS
- ✅ 簡單易用
- ✅ 可使用自訂網域

### 步驟

#### 1. 建立 GitHub 帳號
前往 [GitHub](https://github.com) 註冊免費帳號（如果還沒有的話）。

#### 2. 建立新 Repository
1. 登入 GitHub
2. 點擊右上角的 `+` → **New repository**
3. 填寫資訊：
   - **Repository name**: `member-system`（或任何名稱）
   - **Description**: 手機貼膜店會員系統
   - **Public** 或 **Private**（建議選 Private 以保護資料）
   - ✅ 勾選 **Add a README file**
4. 點擊 **Create repository**

#### 3. 上傳專案檔案

**方法一：使用 GitHub 網頁介面（簡單）**
1. 在 repository 頁面，點擊 **Add file** → **Upload files**
2. 將專案資料夾中的所有檔案拖曳到網頁中
3. 在底部輸入 commit 訊息：`初始化會員系統`
4. 點擊 **Commit changes**

**方法二：使用 Git 指令（進階）**
```bash
# 初始化 Git
git init

# 加入所有檔案
git add .

# 提交
git commit -m "初始化會員系統"

# 連接到 GitHub
git remote add origin https://github.com/你的帳號/member-system.git

# 推送到 GitHub
git push -u origin main
```

#### 4. 啟用 GitHub Pages
1. 進入 repository 頁面
2. 點擊 **Settings**（設定）
3. 左側選單選擇 **Pages**
4. 在 **Source** 下拉選單選擇 `main` branch
5. 點擊 **Save**
6. 等待約 1-2 分鐘，頁面會顯示網址

您的網站將會在：
```
https://你的帳號.github.io/member-system/
```

#### 5. 更新設定

**5.1 更新 `js/config.js`**
```javascript
APP_BASE_URL: 'https://你的帳號.github.io/member-system',
LINE_CALLBACK_PATH: '/member-system/auth-callback.html',
```

**5.2 更新 LINE Developers Callback URL**
1. 前往 [LINE Developers Console](https://developers.line.biz/console/)
2. 選擇您的 Channel
3. **LINE Login** 頁籤 → **Callback URL**
4. 新增：
   ```
   https://你的帳號.github.io/member-system/auth-callback.html
   ```
5. 點擊 **Update**

#### 6. 重新上傳更新的檔案
將修改後的 `js/config.js` 重新上傳到 GitHub。

#### 7. 測試
訪問您的網站並測試所有功能。

---

## 選項 B：Netlify

### 優點
- ✅ 完全免費
- ✅ 自動部署
- ✅ 更快的載入速度
- ✅ 表單處理功能

### 步驟

#### 1. 註冊 Netlify
前往 [Netlify](https://www.netlify.com) 註冊免費帳號（可使用 GitHub 登入）。

#### 2. 部署方式一：拖放部署（最簡單）

1. 將專案資料夾壓縮成 ZIP 檔
2. 訪問 [Netlify Drop](https://app.netlify.com/drop)
3. 將 ZIP 檔拖放到網頁中
4. 等待部署完成
5. Netlify 會給您一個網址，如：`https://random-name-12345.netlify.app`

#### 3. 部署方式二：連接 GitHub（推薦）

1. 先將專案上傳到 GitHub（參考選項 A 的步驟 2-3）
2. 在 Netlify Dashboard 點擊 **New site from Git**
3. 選擇 **GitHub**
4. 選擇您的 repository
5. 設定：
   - **Branch to deploy**: `main`
   - **Build command**: 留空
   - **Publish directory**: 留空（部署整個資料夾）
6. 點擊 **Deploy site**

#### 4. 自訂網域（選擇性）
1. 在 Site settings → **Domain management**
2. 點擊 **Add custom domain**
3. 輸入您的網域（需先購買網域）

#### 5. 更新設定
同選項 A 的步驟 5-7。

---

## 選項 C：Vercel

### 優點
- ✅ 完全免費
- ✅ 極快的速度
- ✅ 自動 HTTPS
- ✅ Edge Network

### 步驟

#### 1. 註冊 Vercel
前往 [Vercel](https://vercel.com) 註冊免費帳號（可使用 GitHub 登入）。

#### 2. 部署

**方法一：拖放部署**
1. 前往 [Vercel Dashboard](https://vercel.com/dashboard)
2. 點擊 **Add New...** → **Project**
3. 將專案資料夾拖放到網頁中
4. 等待部署完成

**方法二：連接 GitHub**
1. 先將專案上傳到 GitHub
2. 在 Vercel Dashboard 點擊 **Add New...** → **Project**
3. 選擇 **Import Git Repository**
4. 選擇您的 repository
5. 設定：
   - **Framework Preset**: Other
   - **Build Command**: 留空
   - **Output Directory**: 留空
6. 點擊 **Deploy**

#### 3. 設定
同選項 A 的步驟 5-7。

---

## 🔧 進階設定

### 自訂網域

如果您有自己的網域（如 `www.yourshop.com`）：

1. **GitHub Pages**:
   - Settings → Pages → Custom domain
   - 輸入網域並驗證
   - 在網域 DNS 設定中新增 CNAME 記錄

2. **Netlify/Vercel**:
   - Site settings → Domain management
   - Add custom domain
   - 依指示設定 DNS

### HTTPS 設定
- GitHub Pages、Netlify、Vercel 都會自動提供免費 HTTPS
- 無需手動設定

### 環境變數（進階）

如果未來需要使用環境變數，可以在各平台設定：

**Netlify**:
- Site settings → Build & deploy → Environment

**Vercel**:
- Project settings → Environment Variables

---

## 📝 部署後檢查清單

完成部署後，請檢查：

- [ ] 網站可以正常訪問
- [ ] 首頁顯示正常
- [ ] LINE 登入按鈕可以點擊
- [ ] 導向 LINE 授權頁面
- [ ] 授權後可以正常返回並登入
- [ ] 會員中心顯示正確資料
- [ ] 可以編輯個人資料
- [ ] 管理後台可以登入
- [ ] 管理後台可以查看會員列表
- [ ] 管理後台可以新增/編輯會員

---

## 🐛 常見問題

### Q1: 部署後網站顯示 404 錯誤？
**A**: 檢查以下項目：
- GitHub Pages 是否已正確啟用
- Branch 是否選擇正確
- 檔案是否都已上傳

### Q2: LINE Login 無法使用？
**A**: 
1. 確認 Callback URL 已正確設定
2. 檢查 `js/config.js` 中的 APP_BASE_URL 是否正確
3. 確認 LINE Channel ID 和 Secret 正確

### Q3: 更新程式碼後網站沒有變化？
**A**:
- 清除瀏覽器快取（Ctrl + F5 或 Cmd + Shift + R）
- 等待 1-2 分鐘讓部署完成
- 檢查檔案是否真的已上傳

### Q4: 顯示「配置尚未完成」警告？
**A**: 
- 確認 `js/config.js` 中所有設定都已填寫
- 特別檢查 SUPABASE_URL 和 SUPABASE_ANON_KEY

### Q5: 管理後台無法登入？
**A**:
- 確認已在 Supabase 建立管理員帳號
- 確認 `admins` 表中有對應記錄
- 檢查 Email 和密碼是否正確

---

## 🔄 更新部署的網站

### GitHub Pages
1. 修改本地檔案
2. 上傳到 GitHub（覆蓋舊檔案或使用 Git push）
3. 等待 1-2 分鐘自動更新

### Netlify/Vercel（連接 GitHub）
1. 修改本地檔案
2. Push 到 GitHub
3. 自動觸發部署，約 1 分鐘完成

### Netlify/Vercel（手動）
1. 重新拖放新的 ZIP 檔
2. 或在 Dashboard 點擊 **Trigger deploy**

---

## 📈 效能優化（選擇性）

如果未來會員數量增加，可以考慮：

1. **啟用 CDN**（GitHub Pages、Netlify、Vercel 都已內建）
2. **圖片優化**：使用 WebP 格式
3. **程式碼壓縮**：使用 minify 工具
4. **快取策略**：設定 Cache-Control headers

---

## 🎉 完成！

恭喜！您的會員系統已成功部署到網路上。

現在您可以：
- ✅ 分享網址給會員使用
- ✅ 開始累積會員資料
- ✅ 使用管理後台管理會員

**下一步**：
- 📊 觀察會員註冊情況
- 🎨 根據需求調整 UI
- 🚀 準備開發第二階段功能（預約系統）

---

## 📚 相關資源

- [GitHub Pages 文件](https://docs.github.com/en/pages)
- [Netlify 文件](https://docs.netlify.com/)
- [Vercel 文件](https://vercel.com/docs)
- [Supabase 文件](https://supabase.com/docs)

