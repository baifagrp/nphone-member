# 📱 發送會員卡 LIFF App 設置指南

## 🎯 概述

需要在 LINE Developers Console 中建立一個新的 LIFF App，專門用於「發送會員卡」功能。

---

## 📋 步驟 1：登入 LINE Developers Console

1. 前往 https://developers.line.biz/console/
2. 使用您的 LINE 帳號登入
3. 選擇您的 **Provider**
4. 選擇您的 **Messaging API Channel**

---

## 📋 步驟 2：進入 LIFF 設定

在 Channel 管理頁面：
1. 左側選單找到 **「LIFF」**
2. 點擊進入 LIFF 管理頁面
3. 點擊 **「Add」** 按鈕

---

## 📋 步驟 3：建立新的 LIFF App

填寫以下資訊：

### 基本設定

```
┌─────────────────────────────────────────┐
│ LIFF app name                           │
│ ┌─────────────────────────────────────┐ │
│ │ 發送會員卡                            │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Size                                    │
│ ○ Compact                               │
│ ○ Tall                                  │
│ ● Full                                  │ ← 選擇 Full
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Endpoint URL                            │
│ ┌─────────────────────────────────────┐ │
│ │ https://your-domain.com/member/     │ │
│ │ send-member-card.html               │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 詳細設定

**Size（大小）：**
- ✅ 選擇 **Full**
- 原因：需要完整畫面顯示載入狀態

**Endpoint URL（端點網址）：**
```
https://your-domain.com/member/send-member-card.html
```
⚠️ 請替換 `your-domain.com` 為您的實際網域

**Scope（權限範圍）：**
- ✅ `profile` - 取得用戶基本資料
- ✅ `openid` - OpenID Connect 認證
- ✅ `chat_message.write` - **必須勾選！用於發送訊息**
- ❌ `email` - 不需要（不是有效的 LIFF scope）

**Bot link feature（機器人連結功能）：**
- ○ On (Normal)
- ● Off ← 建議選擇

**Scan QR（掃描 QR Code）：**
- ❌ 不勾選（不需要）

**Module mode（模組模式）：**
- ❌ 不勾選（不需要）

---

## 📋 步驟 4：儲存並取得 LIFF ID

1. 點擊 **「Add」** 按鈕儲存
2. 建立成功後，會看到 LIFF ID
3. **複製 LIFF ID**（格式：`1234567890-abcdefgh`）

範例：
```
LIFF ID: 2008674758-xYz12AbC
```

---

## 📋 步驟 5：更新到 config.js

打開 `js/config.js`，找到第 39 行：

```javascript
// LINE LIFF 設定
LIFF_ID: '2008674758-uH75pBkr',  // 會員系統 LIFF ID
LIFF_SEND_CARD_ID: 'your_liff_id_here',  // ← 貼上您的 LIFF ID
```

**修改為：**

```javascript
// LINE LIFF 設定
LIFF_ID: '2008674758-uH75pBkr',  // 會員系統 LIFF ID
LIFF_SEND_CARD_ID: '2008674758-xYz12AbC',  // 發送會員卡 LIFF ID
```

---

## 📋 步驟 6：測試 LIFF App

### 方法 1：在 LINE 中測試

1. 在 LINE 中開啟以下網址：
   ```
   https://liff.line.me/2008674758-xYz12AbC/member/send-member-card.html
   ```
   （請替換為您的實際 LIFF ID）

2. 應該會看到：
   - ✅ 載入狀態顯示
   - ✅ 自動取得會員資訊
   - ✅ 發送 Flex Message
   - ✅ 自動關閉視窗

### 方法 2：從會員專區測試

1. 在 LINE 中開啟您的會員系統
2. 進入個人資料頁面
3. 點擊「📤 發送會員卡到 LINE」按鈕
4. 應該會自動跳轉並發送會員卡

---

## 🔧 設定對照表

| 設定項目 | 值 |
|---------|---|
| **LIFF app name** | 發送會員卡 |
| **Size** | Full |
| **Endpoint URL** | `https://your-domain.com/member/send-member-card.html` |
| **Scope** | `profile`, `openid`, `chat_message.write` ⭐ |
| **Bot link feature** | Off |
| **Scan QR** | 不勾選 |
| **Module mode** | 不勾選 |

---

## 📊 兩個 LIFF App 的區別

您的系統現在有兩個 LIFF App：

### LIFF App 1：會員系統（原有）
```javascript
LIFF_ID: '2008674758-uH75pBkr'
```

**用途：**
- 會員系統首頁
- 一般會員功能
- 首頁 LIFF 整合

**Endpoint URL：**
```
https://your-domain.com/index.html
```

---

### LIFF App 2：發送會員卡（新增）
```javascript
LIFF_SEND_CARD_ID: '2008674758-xYz12AbC'  // ← 您的新 LIFF ID
```

**用途：**
- 專門發送會員卡到 LINE
- 一鍵操作
- 自動關閉視窗

**Endpoint URL：**
```
https://your-domain.com/member/send-member-card.html
```

---

## 🔍 常見問題

### Q1: 為什麼需要兩個 LIFF App？

**答：** 
- **會員系統 LIFF**：用於整個會員系統的 LIFF 功能
- **發送會員卡 LIFF**：專門用於快速發送會員卡，使用 `liff.sendMessages()` 後自動關閉，用戶體驗更好

---

### Q2: 可以用同一個 LIFF ID 嗎？

**答：**
可以，但不建議。因為：
- ❌ Endpoint URL 不同
- ❌ 功能目的不同
- ❌ 分開管理更清晰

---

### Q3: LIFF ID 格式錯誤怎麼辦？

**答：**
正確格式應該是：`1234567890-abcdefgh`
- ✅ 前半部分：10 位數字（Channel ID）
- ✅ 連接符：`-`
- ✅ 後半部分：8 位英數字

---

### Q4: 測試時出現錯誤？

**常見錯誤 1：LIFF ID not found**
- 檢查 LIFF ID 是否正確複製
- 確認 LIFF App 已成功建立

**常見錯誤 2：Endpoint URL 錯誤**
- 確認網址格式正確
- 確認檔案確實存在於該路徑

**常見錯誤 3：Scope 錯誤**
- 確認已勾選 `profile` 和 `openid`
- 不要勾選 `email`（LIFF 不支援）

---

## ✅ 設定完成檢查清單

完成以下所有項目後，功能就可以正常使用了：

- [ ] ✅ 在 LINE Developers Console 建立新的 LIFF App
- [ ] ✅ LIFF App 名稱：「發送會員卡」
- [ ] ✅ Size 設為：Full
- [ ] ✅ Endpoint URL 正確
- [ ] ✅ Scope 包含：profile, openid
- [ ] ✅ 複製 LIFF ID
- [ ] ✅ 更新到 `js/config.js` 的 `LIFF_SEND_CARD_ID`
- [ ] ✅ 檔案 `member/send-member-card.html` 已上傳
- [ ] ✅ 檔案 `member/profile.html` 已更新
- [ ] ✅ 在 LINE 中測試功能
- [ ] ✅ 確認會員卡成功發送

---

## 🎉 完成！

設定完成後：
1. 會員點擊「發送會員卡」按鈕
2. 自動跳轉到 LIFF 頁面
3. 載入會員資訊和條碼
4. 自動發送 Flex Message 到 LINE
5. 視窗自動關閉
6. 在 LINE 聊天室看到精美的會員卡 ✨

---

## 📚 相關文件

- `js/config.js` - 配置檔案
- `member/send-member-card.html` - LIFF 發送頁面
- `member/profile.html` - 會員專區（含發送按鈕）
- `會員卡發送功能說明.md` - 功能詳細說明

---

如有任何問題，請參考 LINE Developers 官方文件：
https://developers.line.biz/en/docs/liff/

祝您設定順利！😊

