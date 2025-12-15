# 🔧 LIFF 權限錯誤修復指南

## ❌ 錯誤訊息

```
Error: The permission is not in LIFF app scope.
```

---

## 🎯 問題原因

LIFF App 缺少 `chat_message.write` 權限，無法使用 `liff.sendMessages()` 發送訊息到 LINE 聊天室。

---

## ✅ 快速修復（5 分鐘）

### 步驟 1：進入 LIFF 設定

1. 登入 https://developers.line.biz/console/
2. 選擇您的 Provider 和 Channel
3. 左側選單 → **LIFF**
4. 找到「發送會員卡」（LIFF ID: `2008674758-5mczIgOu`）
5. 點擊 **「Edit」**

---

### 步驟 2：添加權限

在 **Scope** 區域：

**修改前 ❌：**
```
☑ profile
☑ openid
```

**修改後 ✅：**
```
☑ profile
☑ openid
☑ chat_message.write  ← 新增這個！
```

點擊 **「Update」** 儲存。

---

### 步驟 3：清除舊授權

**重要！** 必須清除舊的授權才能重新授權新權限。

#### 在 LINE App 中：

1. **設定** → **隱私設定** → **提供個人資料的服務**
2. 找到「發送會員卡」或您的 Channel 名稱
3. 點擊進入
4. 點擊 **「刪除」** 或 **「取消授權」**

---

### 步驟 4：重新測試

1. 在 LINE 中開啟會員系統
2. 進入個人資料頁面
3. 點擊「📤 發送會員卡到 LINE」
4. **系統會要求授權**（第一次）
5. 確認權限包含：
   - ✅ 查看您的個人資料
   - ✅ **發送訊息** ← 新權限
6. 點擊「同意」
7. ✅ 應該能成功發送會員卡！

---

## 📋 LIFF Scope 完整說明

### 三個必要權限

| Scope | 用途 | 是否必須 |
|-------|------|---------|
| `profile` | 取得 userId, displayName, pictureUrl | ✅ 必須 |
| `openid` | OpenID Connect 認證 | ✅ 必須 |
| `chat_message.write` | **發送訊息到聊天室** | ✅ **必須** |

### 為什麼需要 chat_message.write？

**此權限用於：**
- `liff.sendMessages()` - 發送訊息 API
- 發送 Flex Message（會員卡）
- 發送文字、圖片等各種訊息

**沒有此權限會：**
- ❌ 無法發送任何訊息
- ❌ `liff.sendMessages()` 失敗
- ❌ 出現權限錯誤

---

## 🔍 如何確認權限已正確設定

### 方法 1：在 LINE Developers Console 確認

1. LIFF 列表中找到您的 App
2. 查看 Scope 欄位
3. 應該顯示：`profile, openid, chat_message.write`

---

### 方法 2：授權頁面確認

當用戶第一次使用 LIFF App 時，會看到授權頁面：

**正確的授權頁面：**
```
┌─────────────────────────────────┐
│   發送會員卡                     │
│   想要取得以下權限：              │
│                                 │
│   ✓ 查看您的個人資料              │
│   ✓ 發送訊息                     │ ← 應該有這個！
│                                 │
│   [同意] [拒絕]                  │
└─────────────────────────────────┘
```

如果沒有「發送訊息」，表示 Scope 設定錯誤。

---

### 方法 3：程式碼測試

可以在 LIFF 頁面中檢查權限：

```javascript
// 檢查是否有 chat_message.write 權限
const permissions = liff.getContext().scope;
console.log('LIFF Permissions:', permissions);

// 應該包含：
// ["profile", "openid", "chat_message.write"]
```

---

## 🐛 其他常見 LIFF 錯誤

### 錯誤 1：LIFF ID not found
```
Error: LIFF ID not found
```

**原因：** LIFF ID 錯誤或不存在

**解決：**
- 確認 `CONFIG.LIFF_SEND_CARD_ID` 正確
- 確認 LIFF App 已建立

---

### 錯誤 2：Endpoint URL 錯誤
```
Failed to load resource: 404
```

**原因：** Endpoint URL 設定錯誤或檔案不存在

**解決：**
- 確認 Endpoint URL 指向正確的檔案
- 確認檔案已上傳到伺服器

---

### 錯誤 3：未登入
```
Error: User is not logged in
```

**原因：** 用戶未登入 LINE

**解決：**
```javascript
if (!liff.isLoggedIn()) {
    liff.login();
}
```

---

## ✅ 修復完成檢查清單

確認以下所有項目：

- [ ] ✅ LIFF App Scope 包含 `chat_message.write`
- [ ] ✅ 已點擊「Update」儲存變更
- [ ] ✅ 已清除舊的授權
- [ ] ✅ 重新測試並授權新權限
- [ ] ✅ 授權頁面顯示「發送訊息」權限
- [ ] ✅ 成功發送會員卡到 LINE
- [ ] ✅ 在聊天室看到 Flex Message
- [ ] ✅ 視窗自動關閉

---

## 🎉 修復成功！

完成以上步驟後，「發送會員卡」功能應該可以正常運作了！

**功能流程：**
```
點擊按鈕
  ↓
開啟 LIFF 頁面
  ↓
取得會員資訊
  ↓
生成條碼
  ↓
創建 Flex Message
  ↓
liff.sendMessages() ✅ ← 使用 chat_message.write 權限
  ↓
發送成功
  ↓
自動關閉視窗
  ↓
在 LINE 看到會員卡 🎊
```

---

## 📚 相關資源

- [LINE LIFF 官方文件](https://developers.line.biz/en/docs/liff/)
- [LIFF Scope 說明](https://developers.line.biz/en/docs/liff/developing-liff-apps/#scope)
- [liff.sendMessages() API](https://developers.line.biz/en/reference/liff/#send-messages)

---

如果還有問題，請檢查：
1. Console 錯誤訊息
2. LIFF App 設定
3. 權限授權狀態

祝您修復順利！😊

