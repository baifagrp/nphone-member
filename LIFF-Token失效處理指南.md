# 🔧 LIFF Access Token 失效處理指南

## ❌ 錯誤訊息

```
Error: The access token revoked
```

或

```
Error: The access token expired
```

---

## 🎯 問題原因

### 為什麼 Access Token 會失效？

1. **修改了 LIFF Scope** ⭐ 最常見
   - 新增或移除權限（例如：添加 `chat_message.write`）
   - 舊的 token 會立即失效

2. **用戶撤銷授權**
   - 在 LINE 設定中手動撤銷

3. **Token 自然過期**
   - Access token 有時效性

4. **LIFF App 重新部署**
   - 某些設定變更會導致 token 失效

---

## ✅ 解決方案（已自動處理）

### 我已經更新了代碼，自動處理 Token 失效：

#### 1. **初始化時驗證 Token**

```javascript
// 檢查登入狀態
if (!liff.isLoggedIn()) {
    liff.login();
    return;
}

// 驗證 Access Token
try {
    const accessToken = liff.getAccessToken();
    if (!accessToken) {
        // Token 不存在，重新登入
        liff.logout();
        liff.login();
        return;
    }
} catch (error) {
    // Token 驗證失敗，重新登入
    liff.logout();
    liff.login();
    return;
}
```

---

#### 2. **發送失敗時自動處理**

```javascript
catch (error) {
    // 檢查是否為 Token 失效錯誤
    if (error.message.includes('access token revoked') ||
        error.message.includes('access token expired') ||
        error.message.includes('permission is not in LIFF app scope')) {
        
        // 自動重新登入
        updateStatus('🔄', '授權已更新', '需要重新授權，請稍候...');
        liff.logout();
        liff.login();
    }
}
```

---

## 🔄 用戶體驗流程

### 情境 1：修改 LIFF Scope 後第一次使用

```
用戶點擊「發送會員卡」
  ↓
開啟 LIFF 頁面
  ↓
初始化 LIFF
  ↓
檢測到 Token 失效
  ↓
顯示：「授權已更新，需要重新授權」
  ↓
自動登出
  ↓
自動導向 LINE 授權頁面
  ↓
用戶看到新的權限：
  ✓ 查看您的個人資料
  ✓ 發送訊息  ← 新權限
  ↓
用戶點擊「同意」
  ↓
重新開啟 LIFF 頁面
  ↓
✅ 成功發送會員卡！
```

---

### 情境 2：正常使用（Token 有效）

```
用戶點擊「發送會員卡」
  ↓
開啟 LIFF 頁面
  ↓
初始化成功
  ↓
載入會員資訊
  ↓
生成條碼
  ↓
發送 Flex Message
  ↓
✅ 成功！視窗自動關閉
```

---

## 🛠️ 手動清除授權（如需要）

如果自動重新登入沒有觸發，可以手動清除：

### 在 LINE App 中：

1. **設定** ⚙️
2. **隱私設定** 🔒
3. **提供個人資料的服務** 📋
4. 找到「發送會員卡」或您的 Channel 名稱
5. 點擊進入
6. 點擊 **「刪除」** 或 **「取消授權」** ❌

### 重新測試：

1. 點擊「發送會員卡」按鈕
2. 系統會要求重新授權
3. 確認新權限並同意
4. ✅ 功能恢復正常

---

## 🔍 常見問題

### Q1: 為什麼修改 Scope 後需要重新授權？

**答：** 
為了安全性，當 LIFF App 的權限範圍改變時，LINE 會讓舊的 token 失效，要求用戶重新授權以確認新權限。

---

### Q2: 重新授權後，之前的資料會消失嗎？

**答：** 
不會！會員資料、儲值金、積分等都儲存在資料庫中，重新授權只是更新權限，不影響資料。

---

### Q3: 可以避免 Token 失效嗎？

**答：** 
無法完全避免，但可以減少：
- ✅ 在初期就設定好完整的 Scope
- ✅ 避免頻繁修改 LIFF 設定
- ✅ 使用長期有效的 token（LINE 自動處理）

---

### Q4: 為什麼一直要求重新授權？

**可能原因：**
1. LIFF Scope 設定錯誤
2. LIFF ID 不正確
3. Endpoint URL 錯誤

**檢查：**
```javascript
// 確認 config.js
LIFF_SEND_CARD_ID: '2008674758-5mczIgOu'  // 正確的 LIFF ID

// 確認 LIFF Scope
☑ profile
☑ openid
☑ chat_message.write
```

---

## 📊 錯誤類型對照表

| 錯誤訊息 | 原因 | 解決方法 |
|---------|------|---------|
| `access token revoked` | Token 被撤銷 | 自動重新登入 |
| `access token expired` | Token 過期 | 自動重新登入 |
| `permission is not in LIFF app scope` | 缺少權限 | 修改 Scope + 重新授權 |
| `LIFF ID not found` | LIFF ID 錯誤 | 檢查 config.js |

---

## ✅ 完整的授權流程

### 1. 首次使用

```
用戶
  ↓
點擊「發送會員卡」
  ↓
LINE 授權頁面
  ↓
顯示所需權限：
  - 查看個人資料
  - 發送訊息
  ↓
用戶同意
  ↓
取得 Access Token
  ↓
✅ 可以使用功能
```

---

### 2. Scope 變更後

```
用戶
  ↓
點擊「發送會員卡」
  ↓
檢測到 Token 失效
  ↓
自動登出
  ↓
自動導向授權頁面
  ↓
顯示新權限
  ↓
用戶同意
  ↓
取得新 Access Token
  ↓
✅ 功能恢復
```

---

## 🎯 現在要做什麼？

### 如果您看到 Token 失效錯誤：

#### 選項 1：自動處理（推薦）✅
**什麼都不用做！**
- 系統會自動偵測
- 自動重新登入
- 用戶只需要再點一次「同意」

#### 選項 2：手動清除
1. 進入 LINE 設定
2. 刪除「發送會員卡」授權
3. 重新使用功能
4. 重新授權

---

## 🎉 已完成的改進

### ✅ 自動 Token 驗證
- 初始化時檢查 Token
- 無效時自動重新登入

### ✅ 智能錯誤處理
- 識別 Token 相關錯誤
- 自動觸發重新授權流程

### ✅ 友善的用戶提示
- 顯示「授權已更新」訊息
- 自動導向授權頁面

### ✅ 防止重複錯誤
- 驗證後才執行主要邏輯
- 避免無限重試

---

## 📚 相關文件

- `member/send-member-card.html` - 已更新錯誤處理
- `LIFF權限錯誤修復指南.md` - Scope 設定
- `發送會員卡LIFF設置指南.md` - 完整設置流程

---

## 🔐 安全性說明

### Access Token 的作用

**Access Token 用於：**
- ✅ 驗證用戶身份
- ✅ 授權 API 調用
- ✅ 保護用戶資料

**為什麼會失效：**
- 🔒 保護用戶隱私
- 🔒 防止權限濫用
- 🔒 確保最新授權

**重新授權的好處：**
- ✅ 用戶明確知道新權限
- ✅ 可以選擇拒絕
- ✅ 系統更安全

---

## 🎊 完成！

現在系統會自動處理 Access Token 失效的情況：

1. **自動檢測** Token 是否有效
2. **自動重新登入** 當 Token 失效
3. **友善提示** 告訴用戶發生了什麼
4. **流暢體驗** 最小化用戶操作

用戶只需要：
1. 點擊「發送會員卡」
2. （如果需要）點擊「同意」重新授權
3. ✅ 完成！

祝您使用順利！😊

